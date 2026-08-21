import { readFile, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const SAFE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const A4_TOLERANCE_POINTS = 2;

export const A4_SIZE_POINTS = Object.freeze({ width: 595.28, height: 841.89 });
const KOREAN_MOBILE_NUMBER_PATTERN = /(?:^|[^0-9])010(?:[ -]?[0-9]{4}){2}(?![0-9])/;

function validatePortfolioPdfRequiredText(requiredText) {
  if (
    !Array.isArray(requiredText)
    || requiredText.length === 0
    || requiredText.some((value) => typeof value !== 'string' || value.trim().length === 0)
  ) {
    throw new Error('Portfolio PDF per-page required text must be a non-empty array of non-empty strings.');
  }

  return [...requiredText];
}

export function parsePortfolioPdfRequiredText(serialized) {
  if (typeof serialized !== 'string' || serialized.length === 0) {
    throw new Error('Portfolio page is missing its PDF required-text payload.');
  }

  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new Error('Portfolio page PDF required-text payload is not valid JSON.', { cause: error });
  }

  return validatePortfolioPdfRequiredText(parsed);
}

export function assertNoKoreanMobileNumber(text, label = 'Portfolio output') {
  if (KOREAN_MOBILE_NUMBER_PATTERN.test(String(text).replace(/\r?\n/g, ' '))) {
    throw new Error(`${label} contains a Korean mobile number.`);
  }
}

function comparablePdfText(text) {
  return String(text).replace(/\s+/gu, '');
}

function assertSafeId(value, label) {
  if (typeof value !== 'string' || !SAFE_ID_PATTERN.test(value)) {
    throw new Error(
      `${label} must contain only lowercase letters, numbers, and single hyphens between segments.`,
    );
  }
}

export function parsePortfolioPdfArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--share-id') {
    throw new Error('Usage: npm run portfolio:pdf -- --share-id <safe-share-id>');
  }

  const shareId = argv[1];
  assertSafeId(shareId, 'Portfolio share ID');

  return { shareId };
}

export function portfolioPdfFilename(project) {
  assertSafeId(project, 'Portfolio project slug');
  return `sonmyeonggwan-${project}-project-portfolio.pdf`;
}

export async function assertSinglePagePdf(bytes) {
  const document = await PDFDocument.load(bytes);
  const count = document.getPageCount();

  if (count !== 1) {
    throw new Error(`Portfolio PDF must contain exactly one page; received ${count}.`);
  }
}

export async function extractPdfText(bytes) {
  const loadingTask = getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    useSystemFonts: true,
  });

  try {
    const document = await loadingTask.promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => (
        'str' in item ? `${item.str}${item.hasEOL ? '\n' : ''}` : ''
      )).join(''));
    }

    return pages.join('\n');
  } finally {
    await loadingTask.destroy();
  }
}

/**
 * @param {Uint8Array | Buffer} bytes
 * @param {{
 *   extractText?: (bytes: Uint8Array | Buffer) => Promise<string>;
 *   requiredText?: string[];
 * }} [options]
 */
export async function assertPortfolioPdf(bytes, {
  extractText = extractPdfText,
  requiredText = undefined,
} = {}) {
  const pageRequiredText = validatePortfolioPdfRequiredText(requiredText);

  if (!bytes || bytes.byteLength === 0) {
    throw new Error('Portfolio PDF generation produced an empty file.');
  }

  const document = await PDFDocument.load(bytes);
  const pageCount = document.getPageCount();
  if (pageCount !== 1) {
    throw new Error(`Portfolio PDF must contain exactly one page; received ${pageCount}.`);
  }

  const { width, height } = document.getPage(0).getSize();
  const isPortrait = height > width;
  const isA4 = Math.abs(width - A4_SIZE_POINTS.width) <= A4_TOLERANCE_POINTS
    && Math.abs(height - A4_SIZE_POINTS.height) <= A4_TOLERANCE_POINTS;
  if (!isPortrait || !isA4) {
    throw new Error(
      `Portfolio PDF must use A4 portrait dimensions; received ${width.toFixed(2)} x ${height.toFixed(2)} points.`,
    );
  }

  const text = await extractText(bytes);
  const comparableText = comparablePdfText(text);
  const missing = pageRequiredText.filter(
    (value) => !comparableText.includes(comparablePdfText(value)),
  );
  if (missing.length > 0) {
    throw new Error(`Portfolio PDF is missing required extractable text: ${missing.join(', ')}`);
  }

  assertNoKoreanMobileNumber(text, 'Portfolio PDF');

  return { pageCount, width, height, text };
}

export async function publishPortfolioPdf({
  temporaryPath,
  finalPath,
  validationOptions,
}) {
  const resolvedTemporaryPath = resolve(temporaryPath);
  const resolvedFinalPath = resolve(finalPath);
  if (dirname(resolvedTemporaryPath) !== dirname(resolvedFinalPath)) {
    throw new Error('Temporary and final portfolio PDFs must use the same output directory.');
  }

  const bytes = await readFile(resolvedTemporaryPath);
  const validation = await assertPortfolioPdf(bytes, validationOptions);
  await rename(resolvedTemporaryPath, resolvedFinalPath);

  return { finalPath: resolvedFinalPath, ...validation };
}

function processGroupExists(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    if (error && error.code === 'ESRCH') return false;
    throw error;
  }
}

async function waitForProcessGroupExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!processGroupExists(pid)) return true;
    await delay(25);
  }
  return !processGroupExists(pid);
}

export async function terminateProcessGroup(child, {
  termTimeoutMs = 3_000,
  killTimeoutMs = 3_000,
} = {}) {
  if (!child?.pid) return;
  if (process.platform === 'win32') {
    throw new Error('Detached preview process-group cleanup requires a POSIX platform.');
  }

  const pid = child.pid;
  if (!processGroupExists(pid)) return;

  try {
    process.kill(-pid, 'SIGTERM');
  } catch (error) {
    if (error?.code === 'ESRCH') return;
    throw error;
  }

  if (await waitForProcessGroupExit(pid, termTimeoutMs)) return;

  try {
    process.kill(-pid, 'SIGKILL');
  } catch (error) {
    if (error?.code === 'ESRCH') return;
    throw error;
  }

  if (!await waitForProcessGroupExit(pid, killTimeoutMs)) {
    throw new Error(`Preview process group ${pid} remained alive after SIGTERM and SIGKILL.`);
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function runBounded(operation, timeoutMs, label) {
  let timeoutId;
  const operationResult = Promise.resolve()
    .then(operation)
    .then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error }),
    );
  const timeoutResult = new Promise((resolveTimeout) => {
    timeoutId = setTimeout(
      () => resolveTimeout({ ok: false, timeout: true }),
      timeoutMs,
    );
  });
  const result = await Promise.race([operationResult, timeoutResult]);
  clearTimeout(timeoutId);

  if (result.ok) return undefined;
  if ('timeout' in result) return new Error(`${label} did not finish within ${timeoutMs}ms.`);
  return new Error(`${label} failed: ${errorMessage(result.error)}`, { cause: result.error });
}

async function cleanupBrowserResources({
  browserConnection,
  browserServer,
  browserCloseTimeoutMs,
  browserKillTimeoutMs,
}) {
  let requiresForceKill = false;

  if (browserConnection) {
    const closeError = await runBounded(
      () => browserConnection.close(),
      browserCloseTimeoutMs,
      'Chromium connection close',
    );
    requiresForceKill ||= Boolean(closeError);
  }

  if (browserServer && !requiresForceKill) {
    const closeError = await runBounded(
      () => browserServer.close(),
      browserCloseTimeoutMs,
      'Chromium server close',
    );
    requiresForceKill ||= Boolean(closeError);
  }

  if (!browserServer || !requiresForceKill) return [];

  const killError = await runBounded(
    () => browserServer.kill(),
    browserKillTimeoutMs,
    'Chromium server force-kill',
  );
  return killError ? [killError] : [];
}

export function createPortfolioExportCleanupController({
  browserCloseTimeoutMs = 5_000,
  browserKillTimeoutMs = 3_000,
  terminatePreview = terminateProcessGroup,
  removeTemporaryPdf = (path) => rm(path, { force: true }),
} = {}) {
  let browserConnection;
  let browserServer;
  let preview;
  let temporaryPath;
  let resourcesCleanupPromise;
  let temporaryCleanupPromise;
  let temporaryWrites = 0;
  let resolveTemporaryWrites;
  let temporaryWritesSettled = Promise.resolve();
  let removeTemporaryRequested = false;
  let interruptedSignal;

  const cleanupResources = async () => {
    const errors = await cleanupBrowserResources({
      browserConnection,
      browserServer,
      browserCloseTimeoutMs,
      browserKillTimeoutMs,
    });

    try {
      await terminatePreview(preview);
    } catch (error) {
      errors.push(new Error(`Preview cleanup failed: ${errorMessage(error)}`, { cause: error }));
    }

    return errors;
  };

  const discardTemporaryPdf = async () => {
    if (!temporaryPath) return [];
    if (!temporaryCleanupPromise) {
      const path = temporaryPath;
      temporaryCleanupPromise = Promise.resolve()
        .then(async () => {
          await temporaryWritesSettled;
          await removeTemporaryPdf(path);
        })
        .then(
          () => [],
          (error) => [new Error(
            `Temporary PDF cleanup failed: ${errorMessage(error)}`,
            { cause: error },
          )],
        );
    }
    return temporaryCleanupPromise;
  };

  return {
    trackBrowserConnection(value) {
      browserConnection = value;
    },
    trackBrowserServer(value) {
      browserServer = value;
    },
    trackPreview(value) {
      preview = value;
    },
    trackTemporaryPdf(path) {
      temporaryPath = path;
    },
    beginTemporaryPdfWrite() {
      if (temporaryWrites === 0) {
        temporaryWritesSettled = new Promise((resolveWrites) => {
          resolveTemporaryWrites = resolveWrites;
        });
      }
      temporaryWrites += 1;
      let finished = false;
      return () => {
        if (finished) return;
        finished = true;
        temporaryWrites -= 1;
        if (temporaryWrites === 0) {
          resolveTemporaryWrites?.();
          resolveTemporaryWrites = undefined;
        }
      };
    },
    interrupt(signal) {
      interruptedSignal ??= signal;
      removeTemporaryRequested = true;
    },
    get interruptedSignal() {
      return interruptedSignal;
    },
    async cleanup({ preserveTemporaryPdf = false } = {}) {
      if (!preserveTemporaryPdf) removeTemporaryRequested = true;
      resourcesCleanupPromise ??= cleanupResources();
      const errors = [...await resourcesCleanupPromise];
      if (removeTemporaryRequested) errors.push(...await discardTemporaryPdf());
      return errors;
    },
    discardTemporaryPdf,
    markTemporaryPdfPublished() {
      temporaryPath = undefined;
    },
  };
}

export function installPortfolioExportSignalHandlers(controller, {
  reportCleanupError = (error) => process.stderr.write(`${error.message}\n`),
} = {}) {
  let handlingSignal = false;

  const dispose = () => {
    process.off('SIGINT', onSigint);
    process.off('SIGTERM', onSigterm);
  };
  const handleSignal = (signal) => {
    controller.interrupt(signal);
    if (handlingSignal) return;
    handlingSignal = true;

    void (async () => {
      const cleanupErrors = await controller.cleanup({ preserveTemporaryPdf: false });
      cleanupErrors.forEach(reportCleanupError);
      dispose();
      process.removeAllListeners(signal);
      try {
        process.kill(process.pid, signal);
      } catch {
        process.exit(signal === 'SIGINT' ? 130 : 143);
      }
    })();
  };
  const onSigint = () => handleSignal('SIGINT');
  const onSigterm = () => handleSignal('SIGTERM');

  process.on('SIGINT', onSigint);
  process.on('SIGTERM', onSigterm);
  return dispose;
}
