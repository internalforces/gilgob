import { PDFDocument } from 'pdf-lib';
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as portfolioPdf from '../../scripts/lib/portfolio-pdf.mjs';

const {
  A4_SIZE_POINTS,
  assertPortfolioPdf,
  assertSinglePagePdf,
  extractPdfText,
  parsePortfolioPdfArgs,
  portfolioPdfFilename,
  publishPortfolioPdf,
  terminateProcessGroup,
} = portfolioPdf;

const primaryRequiredText = [
  'Candidate Alpha',
  'candidate.alpha@example.test',
  'Project Alpha',
  '12',
  '1.2.3',
  'Alpha decision evidence',
];
const alternateRequiredText = [
  'Candidate Beta',
  'candidate.beta@example.test',
  'Project Beta',
  '48',
  '9.8.7',
  'Beta decision evidence',
];
const completePortfolioText = primaryRequiredText.join('\n');

async function pdfBytes({
  pages = 1,
  size = [A4_SIZE_POINTS.width, A4_SIZE_POINTS.height],
  text,
}: {
  pages?: number;
  size?: [number, number];
  text?: string;
} = {}) {
  const document = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) {
    const page = document.addPage(size);
    if (text) page.drawText(text);
  }
  return document.save();
}

function processExists(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
}

describe('portfolio PDF helpers', () => {
  it('parses one safe share id', () => {
    expect(parsePortfolioPdfArgs(['--share-id', '8c5e1a7d3b92-signal-hub'])).toEqual({
      shareId: '8c5e1a7d3b92-signal-hub',
    });
  });

  it.each([
    { argv: [] },
    { argv: ['--share-id'] },
    { argv: ['--share-id', '../signal-hub'] },
    { argv: ['--unknown', 'value'] },
  ])(
    'rejects invalid arguments $argv',
    ({ argv }) => {
      expect(() => parsePortfolioPdfArgs(argv)).toThrow();
    },
  );

  it('builds a deterministic safe filename', () => {
    expect(portfolioPdfFilename('signal-hub')).toBe(
      'sonmyeonggwan-signal-hub-project-portfolio.pdf',
    );
  });

  it('accepts one page and rejects two pages', async () => {
    const one = await PDFDocument.create();
    one.addPage();
    await expect(assertSinglePagePdf(await one.save())).resolves.toBeUndefined();

    const two = await PDFDocument.create();
    two.addPage();
    two.addPage();
    await expect(assertSinglePagePdf(await two.save())).rejects.toThrow(/exactly one page/i);
  });

  it('parses distinct per-page required-token payloads', () => {
    const parseRequiredText = (portfolioPdf as typeof portfolioPdf & {
      parsePortfolioPdfRequiredText?: (value: string | null) => string[];
    }).parsePortfolioPdfRequiredText;

    expect(parseRequiredText).toBeTypeOf('function');
    expect(parseRequiredText!(JSON.stringify(primaryRequiredText))).toEqual(primaryRequiredText);
    expect(parseRequiredText!(JSON.stringify(alternateRequiredText))).toEqual(alternateRequiredText);
    expect(parseRequiredText!(JSON.stringify(primaryRequiredText)))
      .not.toEqual(parseRequiredText!(JSON.stringify(alternateRequiredText)));
    expect(() => parseRequiredText!('["", "valid"]')).toThrow(/non-empty strings/i);
  });

  it('requires per-page tokens and rejects generic Korean mobile-number patterns', async () => {
    const bytes = await pdfBytes();

    await expect(assertPortfolioPdf(bytes, {
      extractText: async () => completePortfolioText,
      requiredText: primaryRequiredText,
    })).resolves.toMatchObject({ pageCount: 1, text: completePortfolioText });

    await expect(assertPortfolioPdf(bytes, {
      extractText: async () => completePortfolioText.replace('decision', 'deci\nsion'),
      requiredText: primaryRequiredText,
    })).resolves.toMatchObject({ pageCount: 1 });

    await expect(assertPortfolioPdf(bytes, {
      extractText: async () => completePortfolioText.replace('Alpha decision', 'Alpha\ndecision'),
      requiredText: primaryRequiredText,
    })).resolves.toMatchObject({ pageCount: 1 });

    await expect(assertPortfolioPdf(bytes, {
      extractText: async () => primaryRequiredText.slice(1).join('\n'),
      requiredText: primaryRequiredText,
    })).rejects.toThrow(/missing required.*Candidate Alpha/i);

    await expect(assertPortfolioPdf(bytes, {
      extractText: async () => completePortfolioText,
    })).rejects.toThrow(/per-page required text/i);

    for (const syntheticPhone of ['010-0000-0000', '010 1111 2222', '01033334444']) {
      await expect(assertPortfolioPdf(bytes, {
        extractText: async () => `${completePortfolioText}\n${syntheticPhone}`,
        requiredText: primaryRequiredText,
      })).rejects.toThrow(/Korean mobile number/i);
    }
  });

  it('rejects non-A4, landscape and multi-page PDFs', async () => {
    await expect(assertPortfolioPdf(await pdfBytes({ size: [612, 792] }), {
      extractText: async () => completePortfolioText,
      requiredText: primaryRequiredText,
    })).rejects.toThrow(/A4 portrait/i);

    await expect(assertPortfolioPdf(await pdfBytes({
      size: [A4_SIZE_POINTS.height, A4_SIZE_POINTS.width],
    }), {
      extractText: async () => completePortfolioText,
      requiredText: primaryRequiredText,
    })).rejects.toThrow(/A4 portrait/i);

    await expect(assertPortfolioPdf(await pdfBytes({ pages: 2 }), {
      extractText: async () => completePortfolioText,
      requiredText: primaryRequiredText,
    })).rejects.toThrow(/exactly one page/i);
  });

  it('extracts text through the production PDF parser', async () => {
    const bytes = Buffer.from(await pdfBytes({ text: 'Signal Hub' }));
    await expect(extractPdfText(bytes)).resolves.toContain('Signal Hub');
  });

  it('publishes only within one directory after validation', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-pdf-publish-'));
    const otherDirectory = await mkdtemp(join(tmpdir(), 'portfolio-pdf-other-'));
    const temporaryPath = join(directory, '.portfolio.tmp.pdf');
    const finalPath = join(directory, 'portfolio.pdf');
    const outsidePath = join(otherDirectory, 'portfolio.pdf');
    const bytes = await pdfBytes();

    try {
      await writeFile(temporaryPath, bytes);
      await expect(publishPortfolioPdf({
        temporaryPath,
        finalPath,
        validationOptions: {
          extractText: async () => completePortfolioText,
          requiredText: primaryRequiredText,
        },
      })).resolves.toMatchObject({ finalPath });
      await expect(readFile(finalPath)).resolves.toEqual(Buffer.from(bytes));

      await writeFile(temporaryPath, bytes);
      await expect(publishPortfolioPdf({
        temporaryPath,
        finalPath: outsidePath,
        validationOptions: {
          extractText: async () => completePortfolioText,
          requiredText: primaryRequiredText,
        },
      })).rejects.toThrow(/same output directory/i);
    } finally {
      await Promise.all([
        rm(directory, { recursive: true, force: true }),
        rm(otherDirectory, { recursive: true, force: true }),
      ]);
    }
  });

  it('preserves a sentinel final PDF when temporary validation fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-pdf-sentinel-'));
    const temporaryPath = join(directory, '.portfolio.tmp.pdf');
    const finalPath = join(directory, 'portfolio.pdf');
    const sentinel = Buffer.from('last known good PDF');

    try {
      await writeFile(finalPath, sentinel);
      await writeFile(temporaryPath, await pdfBytes({ pages: 2 }));

      await expect(publishPortfolioPdf({
        temporaryPath,
        finalPath,
        validationOptions: {
          extractText: async () => completePortfolioText,
          requiredText: primaryRequiredText,
        },
      })).rejects.toThrow(/exactly one page/i);
      await expect(readFile(finalPath)).resolves.toEqual(sentinel);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.skipIf(process.platform === 'win32')(
    'terminates the detached preview process group with a bounded KILL fallback',
    async () => {
      const child = spawn(process.execPath, ['-e', `
        const { spawn } = require('node:child_process');
        process.on('SIGTERM', () => {});
        const descendant = spawn(process.execPath, ['-e',
          'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000);'
        ], { stdio: 'ignore' });
        process.stdout.write(String(descendant.pid) + '\\n');
        setInterval(() => {}, 1000);
      `], {
        detached: true,
        stdio: ['ignore', 'pipe', 'ignore'],
      });

      const descendantPid = await new Promise<number>((resolvePid, reject) => {
        child.once('error', reject);
        child.stdout!.once('data', (chunk) => resolvePid(Number(String(chunk).trim())));
      });

      try {
        expect(processExists(child.pid!)).toBe(true);
        expect(processExists(descendantPid)).toBe(true);
        await expect(terminateProcessGroup(child, {
          termTimeoutMs: 100,
          killTimeoutMs: 2_000,
        })).resolves.toBeUndefined();
        expect(processExists(child.pid!)).toBe(false);
        expect(processExists(descendantPid)).toBe(false);
      } finally {
        try {
          process.kill(-child.pid!, 'SIGKILL');
        } catch {
          // The expected successful path has already removed the process group.
        }
      }
    },
    10_000,
  );

  it('cleans exporter resources once and force-kills a browser after a close timeout', async () => {
    const createCleanupController = (portfolioPdf as typeof portfolioPdf & {
      createPortfolioExportCleanupController?: (options: {
        browserCloseTimeoutMs: number;
        browserKillTimeoutMs: number;
        terminatePreview: () => Promise<void>;
      }) => {
        trackBrowserConnection: (browser: { close: () => Promise<void> }) => void;
        trackBrowserServer: (server: {
          close: () => Promise<void>;
          kill: () => Promise<void>;
        }) => void;
        trackPreview: (preview: object) => void;
        trackTemporaryPdf: (path: string) => void;
        cleanup: (options: { preserveTemporaryPdf: boolean }) => Promise<Error[]>;
      };
    }).createPortfolioExportCleanupController;

    expect(createCleanupController).toBeTypeOf('function');

    const directory = await mkdtemp(join(tmpdir(), 'portfolio-export-cleanup-'));
    const temporaryPath = join(directory, '.portfolio.tmp.pdf');
    const calls = { browser: 0, serverClose: 0, serverKill: 0, preview: 0 };
    await writeFile(temporaryPath, 'temporary PDF');

    const controller = createCleanupController!({
      browserCloseTimeoutMs: 20,
      browserKillTimeoutMs: 200,
      terminatePreview: async () => {
        calls.preview += 1;
      },
    });
    controller.trackBrowserConnection({
      close: async () => {
        calls.browser += 1;
      },
    });
    controller.trackBrowserServer({
      close: async () => {
        calls.serverClose += 1;
        await new Promise(() => {});
      },
      kill: async () => {
        calls.serverKill += 1;
      },
    });
    controller.trackPreview({});
    controller.trackTemporaryPdf(temporaryPath);

    try {
      const [first, second] = await Promise.all([
        controller.cleanup({ preserveTemporaryPdf: false }),
        controller.cleanup({ preserveTemporaryPdf: false }),
      ]);

      expect(first).toEqual([]);
      expect(second).toEqual([]);
      expect(calls).toEqual({ browser: 1, serverClose: 1, serverKill: 1, preview: 1 });
      await expect(access(temporaryPath)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
