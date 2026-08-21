import { spawn, type ChildProcess } from 'node:child_process';
import { access, mkdir, mkdtemp, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import * as portfolioAudit from '../../scripts/lib/portfolio-page-audit.mjs';
import { pagePath } from './helpers';

const { assertPageRenderAssets, createPageResourceAudit } = portfolioAudit;
const portfolioPath = pagePath('/portfolio/8c5e1a7d3b92-signal-hub/');

type LifecycleReady = {
  event: 'portfolio-export-resources-ready';
  browserPid: number;
  previewPid: number;
  temporaryPath: string;
};

function processExists(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
}

function processGroupExists(pid: number) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
}

function waitForLifecycleReady(child: ChildProcess) {
  return new Promise<LifecycleReady>((resolveReady, rejectReady) => {
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      rejectReady(new Error(`Timed out waiting for exporter resources.\n${stdout}\n${stderr}`));
    }, 30_000);

    const cleanup = () => {
      clearTimeout(timeout);
      child.stdout?.off('data', onStdout);
      child.stderr?.off('data', onStderr);
      child.off('exit', onExit);
      child.off('error', onError);
    };
    const onStdout = (chunk: Buffer | string) => {
      stdout += String(chunk);
      for (const line of stdout.split(/\r?\n/)) {
        try {
          const report = JSON.parse(line) as Partial<LifecycleReady>;
          if (report.event === 'portfolio-export-resources-ready') {
            cleanup();
            resolveReady(report as LifecycleReady);
            return;
          }
        } catch {
          // Other exporter output is not a lifecycle report.
        }
      }
    };
    const onStderr = (chunk: Buffer | string) => {
      stderr += String(chunk);
    };
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup();
      rejectReady(new Error(
        `Exporter exited before resources were reported (code ${String(code)}, signal ${String(signal)}).\n${stdout}\n${stderr}`,
      ));
    };
    const onError = (error: Error) => {
      cleanup();
      rejectReady(error);
    };

    child.stdout?.on('data', onStdout);
    child.stderr?.on('data', onStderr);
    child.once('exit', onExit);
    child.once('error', onError);
  });
}

test('audits failed and non-successful render resources', async ({ page }) => {
  await page.route('https://assets.test/broken.css', (route) => route.abort('failed'));
  await page.route('https://assets.test/broken.png', (route) => route.fulfill({
    status: 404,
    contentType: 'image/png',
    body: 'missing',
  }));
  const audit = createPageResourceAudit(page);

  try {
    await page.setContent(`
      <link rel="stylesheet" href="https://assets.test/broken.css">
      <img src="https://assets.test/broken.png" alt="broken fixture">
    `, { waitUntil: 'load' });

    expect(() => audit.assertHealthy()).toThrow(/stylesheet.*broken\.css.*image.*404/is);
  } finally {
    audit.dispose();
  }
});

test('rejects errored fonts and incomplete images after document fonts settle', async ({ page }) => {
  await page.setContent('<img src="data:image/png;base64,broken" alt="broken fixture">');
  await page.evaluate(async () => {
    const face = new FontFace('BrokenPortfolioFont', 'url(data:font/woff2;base64,AA==)');
    document.fonts.add(face);
    try {
      await face.load();
    } catch {
      // The failed status is the behavior under test.
    }
    await document.fonts.ready;
  });

  await expect(assertPageRenderAssets(page)).rejects.toThrow(/font.*error.*image.*broken/is);
});

test('rejects a page without the required bundled Korean font face', async ({ page }) => {
  await page.setContent('<p>한글 포트폴리오</p>');

  await expect(assertPageRenderAssets(page)).rejects.toThrow(/Noto Sans KR.*zero loaded faces|Noto Sans KR.*check failed/is);
});

test('accepts settled fonts and complete images', async ({ page }) => {
  await page.setContent(`
    <img
      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3C/svg%3E"
      alt="complete fixture"
    >
  `, { waitUntil: 'load' });

  const assertAssetsWithOptions = assertPageRenderAssets as (
    targetPage: Page,
    options: { requiredKoreanFonts: [] },
  ) => Promise<void>;
  await expect(assertAssetsWithOptions(page, {
    requiredKoreanFonts: [],
  })).resolves.toBeUndefined();
});

test('accepts the current two-screen print geometry and bundled Korean font', async ({ page }) => {
  const assertPortfolioPrintGeometry = (portfolioAudit as typeof portfolioAudit & {
    assertPortfolioPrintGeometry?: (targetPage: Page) => Promise<void>;
  }).assertPortfolioPrintGeometry;
  expect(typeof assertPortfolioPrintGeometry).toBe('function');

  await page.goto(portfolioPath, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  await expect(assertPageRenderAssets(page)).resolves.toBeUndefined();
  await expect(assertPortfolioPrintGeometry!(page)).resolves.toBeUndefined();
});

test('keeps Screen 1 content rows visibly and consistently separated', async ({ page }) => {
  await page.goto(portfolioPath, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  const gaps = await page.locator('.portfolio-overview').evaluate((screen) => {
    const maximumBottom = (selector: string) => Math.max(
      ...Array.from(screen.querySelectorAll(selector), (element) => (
        element.getBoundingClientRect().bottom
      )),
    );
    return {
      storyToCapabilities: screen.querySelector('#portfolio-capabilities-title')!
        .getBoundingClientRect().top - maximumBottom('.portfolio-story__card'),
      capabilitiesToOwnership: screen.querySelector('#portfolio-ownership-title')!
        .getBoundingClientRect().top - maximumBottom('.portfolio-capability'),
    };
  });

  expect(gaps.storyToCapabilities).toBeGreaterThanOrEqual(4);
  expect(gaps.capabilitiesToOwnership).toBeGreaterThanOrEqual(4);
  expect(Math.abs(gaps.storyToCapabilities - gaps.capabilitiesToOwnership))
    .toBeLessThanOrEqual(0.25);
});

test('rejects visually overlapping direct sibling sections', async ({ page }) => {
  const assertPortfolioPrintGeometry = (portfolioAudit as typeof portfolioAudit & {
    assertPortfolioPrintGeometry?: (targetPage: Page) => Promise<void>;
  }).assertPortfolioPrintGeometry;
  expect(typeof assertPortfolioPrintGeometry).toBe('function');

  await page.goto(portfolioPath, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.locator('.portfolio-overview .portfolio-ownership').evaluate((section) => {
    section.style.transform = 'translateY(-16px)';
  });

  await expect(assertPortfolioPrintGeometry!(page)).rejects.toThrow(
    /direct siblings.*portfolio-section.*portfolio-ownership.*visual gap.*below/is,
  );
});

test('rejects deliberately clipped print content with actionable geometry details', async ({ page }) => {
  const assertPortfolioPrintGeometry = (portfolioAudit as typeof portfolioAudit & {
    assertPortfolioPrintGeometry?: (targetPage: Page) => Promise<void>;
  }).assertPortfolioPrintGeometry;
  expect(typeof assertPortfolioPrintGeometry).toBe('function');

  await page.goto(portfolioPath, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.locator('.portfolio-overview .portfolio-story__card').first().evaluate((card) => {
    const overflow = document.createElement('p');
    overflow.dataset.geometryOverflowFixture = 'true';
    overflow.textContent = '의도적으로 넘치는 인쇄 콘텐츠 '.repeat(600);
    card.append(overflow);
  });

  await expect(assertPortfolioPrintGeometry!(page)).rejects.toThrow(
    /portfolio-screen.*(?:scrollHeight|outside).*geometry-overflow-fixture/is,
  );
});

test('cleans preview, browser and temporary PDF after SIGTERM', async () => {
  test.setTimeout(45_000);
  test.skip(process.platform === 'win32', 'POSIX process groups are required.');

  const outputDirectory = await mkdtemp(join(tmpdir(), 'portfolio-export-signal-'));
  const previewRoot = join(outputDirectory, 'preview-root');
  let exporter: ChildProcess | undefined;
  let ready: LifecycleReady | undefined;

  try {
    await mkdir(previewRoot, { recursive: true });
    await symlink(resolve('dist'), join(previewRoot, 'dist'), 'dir');
    await writeFile(
      join(previewRoot, 'astro.config.mjs'),
      "export default { base: '/gilgob', output: 'static' };\n",
      'utf8',
    );
    exporter = spawn(process.execPath, [
      'scripts/export-portfolio-pdf.mjs',
      '--share-id',
      '8c5e1a7d3b92-signal-hub',
    ], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORTFOLIO_PDF_LIFECYCLE_REPORT: '1',
        PORTFOLIO_PDF_OUTPUT_DIRECTORY: outputDirectory,
        PORTFOLIO_PDF_PREVIEW_ROOT: previewRoot,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const exit = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolveExit) => {
      exporter!.once('exit', (code, signal) => resolveExit({ code, signal }));
    });

    ready = await waitForLifecycleReady(exporter);
    expect(processExists(ready.browserPid)).toBe(true);
    expect(processGroupExists(ready.previewPid)).toBe(true);
    expect(ready.temporaryPath.startsWith(outputDirectory)).toBe(true);

    expect(exporter.kill('SIGTERM')).toBe(true);
    await expect(exit).resolves.toEqual({ code: null, signal: 'SIGTERM' });
    await expect.poll(() => processExists(ready!.browserPid), { timeout: 10_000 }).toBe(false);
    await expect.poll(() => processGroupExists(ready!.previewPid), { timeout: 10_000 }).toBe(false);
    await expect(access(ready.temporaryPath)).rejects.toMatchObject({ code: 'ENOENT' });
    expect((await readdir(outputDirectory)).filter((name) => name.endsWith('.tmp.pdf'))).toEqual([]);
  } finally {
    if (exporter?.pid && processExists(exporter.pid)) exporter.kill('SIGKILL');
    if (ready?.previewPid && processGroupExists(ready.previewPid)) {
      process.kill(-ready.previewPid, 'SIGKILL');
    }
    if (ready?.browserPid && processExists(ready.browserPid)) {
      process.kill(ready.browserPid, 'SIGKILL');
    }
    await rm(outputDirectory, { recursive: true, force: true });
  }
});
