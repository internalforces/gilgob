import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import {
  assertNoKoreanMobileNumber,
  createPortfolioExportCleanupController,
  installPortfolioExportSignalHandlers,
  parsePortfolioPdfArgs,
  parsePortfolioPdfRequiredText,
  portfolioPdfFilename,
  publishPortfolioPdf,
} from './lib/portfolio-pdf.mjs';
import {
  assertPageRenderAssets,
  assertPortfolioPrintGeometry,
  createPageResourceAudit,
} from './lib/portfolio-page-audit.mjs';

const PREVIEW_HOST = '127.0.0.1';
const PREVIEW_ATTEMPTS = 60;
const PREVIEW_RETRY_DELAY_MS = 250;
const BROWSER_CLOSE_TIMEOUT_MS = 5_000;
const BROWSER_KILL_TIMEOUT_MS = 3_000;

function configuredBasePath() {
  const configured = process.env.BASE_PATH ?? '/gilgob';
  if (configured === '' || configured === '/') return '';
  return `/${configured.replace(/^\/+|\/+$/g, '')}`;
}

async function findAvailablePort() {
  const server = createServer();

  try {
    const port = await new Promise((resolvePort, reject) => {
      server.once('error', reject);
      server.listen(0, PREVIEW_HOST, () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          reject(new Error('Could not determine an available localhost port.'));
          return;
        }
        resolvePort(address.port);
      });
    });

    return port;
  } finally {
    if (server.listening) {
      await new Promise((resolveClose, reject) => {
        server.close((error) => (error ? reject(error) : resolveClose()));
      });
    }
  }
}

function startPreview(port, state) {
  const previewArguments = ['run', 'preview', '--'];
  if (process.env.PORTFOLIO_PDF_PREVIEW_ROOT) {
    previewArguments.push('--root', resolve(process.env.PORTFOLIO_PDF_PREVIEW_ROOT));
  }
  previewArguments.push('--host', PREVIEW_HOST, '--port', String(port));
  const preview = spawn(
    'npm',
    previewArguments,
    {
      env: {
        ...process.env,
        ASTRO_PREVIEW_BACKGROUND: '0',
      },
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  preview.stdout.resume();
  preview.stderr.setEncoding('utf8');
  preview.stderr.on('data', (chunk) => {
    state.stderr = `${state.stderr}${chunk}`.slice(-16_000);
  });
  preview.once('error', (error) => {
    state.error = error;
  });
  preview.once('exit', (code, signal) => {
    state.exit = { code, signal };
  });

  return preview;
}

function previewFailureMessage(message, state) {
  const stderr = state.stderr.trim();
  return stderr ? `${message}\nPreview stderr:\n${stderr}` : message;
}

async function waitForPreview(baseUrl, state) {
  let lastFailure = 'the preview did not return a successful response';

  for (let attempt = 1; attempt <= PREVIEW_ATTEMPTS; attempt += 1) {
    if (state.error) {
      throw new Error(previewFailureMessage(`Preview failed to start: ${state.error.message}`, state));
    }
    if (state.exit) {
      throw new Error(
        previewFailureMessage(
          `Preview exited before startup (code ${String(state.exit.code)}, signal ${String(state.exit.signal)}).`,
          state,
        ),
      );
    }

    try {
      const response = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
      lastFailure = `HTTP ${response.status} from ${baseUrl}/`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }

    await delay(PREVIEW_RETRY_DELAY_MS);
  }

  throw new Error(
    previewFailureMessage(
      `Preview did not become ready after ${PREVIEW_ATTEMPTS} attempts: ${lastFailure}`,
      state,
    ),
  );
}

async function launchChromium(cleanupController) {
  try {
    const browserServer = await chromium.launchServer({
      handleSIGHUP: false,
      handleSIGINT: false,
      handleSIGTERM: false,
    });
    cleanupController.trackBrowserServer(browserServer);
    const browser = await chromium.connect(browserServer.wsEndpoint());
    cleanupController.trackBrowserConnection(browser);
    return { browser, browserServer };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Executable doesn't exist|playwright install/i.test(message)) {
      throw new Error(`${message}\nInstall the required browser with: npx playwright install chromium`);
    }
    throw error;
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function visibleCount(locator) {
  const count = await locator.count();
  let visible = 0;

  for (let index = 0; index < count; index += 1) {
    if (await locator.nth(index).isVisible()) visible += 1;
  }

  return visible;
}

async function requireVisibleText(page, text) {
  const matches = page.getByText(text);
  if ((await visibleCount(matches)) === 0) {
    throw new Error(`Portfolio is missing required visible text: ${text}`);
  }
}

async function validatePortfolioDom(page) {
  const projects = page.locator('[data-portfolio-project]');
  const projectCount = await projects.count();
  if (projectCount !== 1) {
    throw new Error(`Portfolio must contain one project root; received ${projectCount}.`);
  }

  const screens = page.locator('.portfolio-screen');
  const screenCount = await screens.count();
  const visibleScreenCount = await visibleCount(screens);
  if (screenCount !== 2 || visibleScreenCount !== 2) {
    throw new Error(
      `Portfolio must contain exactly two visible screens; received ${screenCount} total and ${visibleScreenCount} visible.`,
    );
  }

  const requiredText = parsePortfolioPdfRequiredText(
    await projects.getAttribute('data-portfolio-pdf-required-text'),
  );
  for (const text of requiredText) {
    await requireVisibleText(page, text);
  }
  assertNoKoreanMobileNumber(await page.locator('body').innerText(), 'Portfolio HTML');

  return {
    project: await projects.getAttribute('data-portfolio-project'),
    requiredText,
  };
}

function combinedExportError(actionError, cleanupErrors) {
  if (actionError && cleanupErrors.length > 0) {
    return new AggregateError(
      [actionError, ...cleanupErrors],
      `Portfolio export action failed: ${errorMessage(actionError)}; cleanup also failed: ${cleanupErrors.map(errorMessage).join('; ')}`,
    );
  }
  if (actionError) return actionError;
  if (cleanupErrors.length > 0) {
    return new AggregateError(
      cleanupErrors,
      `Portfolio cleanup failed before publication: ${cleanupErrors.map(errorMessage).join('; ')}`,
    );
  }
  return undefined;
}

async function exportPortfolioPdf(argv) {
  const { shareId } = parsePortfolioPdfArgs(argv);
  const port = await findAvailablePort();
  const cleanupController = createPortfolioExportCleanupController({
    browserCloseTimeoutMs: BROWSER_CLOSE_TIMEOUT_MS,
    browserKillTimeoutMs: BROWSER_KILL_TIMEOUT_MS,
  });
  const disposeSignalHandlers = installPortfolioExportSignalHandlers(cleanupController);
  const baseUrl = `http://${PREVIEW_HOST}:${String(port)}${configuredBasePath()}`;
  const previewState = { stderr: '', error: undefined, exit: undefined };
  const outputDirectory = resolve(
    process.env.PORTFOLIO_PDF_OUTPUT_DIRECTORY ?? join('output', 'pdf'),
  );

  let temporaryPath;
  let finalPath;
  let requiredText;
  let actionError;

  try {
    const preview = startPreview(port, previewState);
    cleanupController.trackPreview(preview);
    await waitForPreview(baseUrl, previewState);

    const { browser, browserServer } = await launchChromium(cleanupController);
    const page = await browser.newPage();
    const resourceAudit = createPageResourceAudit(page);
    const portfolioUrl = `${baseUrl}/portfolio/${shareId}/`;
    try {
      const response = await page.goto(portfolioUrl, { waitUntil: 'networkidle' });
      if (!response || !response.ok()) {
        const status = response ? response.status() : 'no response';
        throw new Error(`Portfolio request failed (${String(status)}): ${portfolioUrl}`);
      }

      await assertPageRenderAssets(page);
      resourceAudit.assertHealthy();
      await page.emulateMedia({ media: 'print' });
      await assertPortfolioPrintGeometry(page);

      const portfolio = await validatePortfolioDom(page);
      const { project } = portfolio;
      requiredText = portfolio.requiredText;
      const filename = portfolioPdfFilename(project);
      await mkdir(outputDirectory, { recursive: true });
      temporaryPath = join(outputDirectory, `.${filename}.${String(process.pid)}.tmp.pdf`);
      finalPath = join(outputDirectory, filename);
      cleanupController.trackTemporaryPdf(temporaryPath);
      const finishTemporaryPdfWrite = cleanupController.beginTemporaryPdfWrite();
      try {
        await writeFile(temporaryPath, new Uint8Array());

        if (process.env.PORTFOLIO_PDF_LIFECYCLE_REPORT === '1') {
          console.log(JSON.stringify({
            event: 'portfolio-export-resources-ready',
            browserPid: browserServer.process().pid,
            previewPid: preview.pid,
            temporaryPath,
          }));
        }

        await page.pdf({
          path: temporaryPath,
          format: 'A4',
          preferCSSPageSize: true,
          printBackground: true,
          displayHeaderFooter: false,
        });
      } finally {
        finishTemporaryPdfWrite();
      }
      resourceAudit.assertHealthy();
    } finally {
      resourceAudit.dispose();
    }
  } catch (error) {
    actionError = error;
  }

  const cleanupErrors = await cleanupController.cleanup({
    preserveTemporaryPdf: !actionError && !cleanupController.interruptedSignal,
  });

  const lifecycleError = combinedExportError(actionError, cleanupErrors);
  if (lifecycleError) {
    const temporaryCleanupErrors = await cleanupController.discardTemporaryPdf();
    disposeSignalHandlers();
    if (temporaryCleanupErrors.length > 0) {
      throw new AggregateError(
        [lifecycleError, ...temporaryCleanupErrors],
        `Portfolio export failed and temporary-file cleanup also failed: ${temporaryCleanupErrors.map(errorMessage).join('; ')}`,
      );
    }
    throw lifecycleError;
  }
  if (cleanupController.interruptedSignal) {
    throw new Error(`Portfolio export interrupted by ${cleanupController.interruptedSignal}.`);
  }

  try {
    const validation = await publishPortfolioPdf({
      temporaryPath,
      finalPath,
      validationOptions: { requiredText },
    });
    cleanupController.markTemporaryPdfPublished();
    temporaryPath = undefined;
    console.log(
      `Validated one-page A4 portfolio PDF with required text: ${validation.finalPath}`,
    );
  } catch (error) {
    const temporaryCleanupErrors = await cleanupController.discardTemporaryPdf();
    if (temporaryCleanupErrors.length > 0) {
      throw new AggregateError(
        [error, ...temporaryCleanupErrors],
        `Portfolio publication failed and temporary-file cleanup also failed: ${temporaryCleanupErrors.map(errorMessage).join('; ')}`,
      );
    }
    throw error;
  } finally {
    disposeSignalHandlers();
  }
}

exportPortfolioPdf(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
