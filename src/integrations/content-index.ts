import { copyFile, mkdir, readdir, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { Plugin, ViteDevServer } from 'vite';
import { buildContentIndex } from '../lib/content/build-index';
import { DEFAULT_CONTENT_INDEX_PATH, writeContentIndex } from '../lib/content/index-store';

const REBUILD_DELAY_MS = 80;

export function contentIndexIntegration(): AstroIntegration {
  let contentRoot: string | undefined;
  let base = '/';

  return {
    name: 'gilgob-content-index',
    hooks: {
      'astro:config:setup': ({ config, logger, updateConfig }) => {
        const projectRoot = fileURLToPath(config.root);
        const configuredContentRoot = join(projectRoot, 'content');
        contentRoot = configuredContentRoot;
        base = config.base;
        const indexPath = join(projectRoot, DEFAULT_CONTENT_INDEX_PATH);
        let rebuildTimer: ReturnType<typeof setTimeout> | undefined;
        let rebuildRunning = false;
        let rerunRequested = false;
        let generationQueue = Promise.resolve();
        const generate = async () => {
          const index = await buildContentIndex(configuredContentRoot);
          await writeContentIndex(index, indexPath);
        };
        const enqueueGeneration = () => {
          const queuedGeneration = generationQueue.then(generate);
          generationQueue = queuedGeneration.catch(() => undefined);
          return queuedGeneration;
        };

        const plugin: Plugin = {
          name: 'gilgob-content-index',
          buildStart: enqueueGeneration,
          configureServer(server) {
            const rebuild = async () => {
              if (rebuildRunning) {
                rerunRequested = true;
                return;
              }

              rebuildRunning = true;
              try {
                do {
                  rerunRequested = false;
                  await regenerateForDevelopment(enqueueGeneration, server, logger);
                } while (rerunRequested);
              } finally {
                rebuildRunning = false;
              }
            };

            const scheduleRebuild = (changedPath: string) => {
              if (!isWithinContent(changedPath, projectRoot, configuredContentRoot)) return;
              if (rebuildTimer !== undefined) clearTimeout(rebuildTimer);
              rebuildTimer = setTimeout(() => {
                rebuildTimer = undefined;
                void rebuild();
              }, REBUILD_DELAY_MS);
            };

            server.watcher.on('add', scheduleRebuild);
            server.watcher.on('change', scheduleRebuild);
            server.watcher.on('unlink', scheduleRebuild);
          },
        };

        updateConfig({ vite: { plugins: [plugin] } });
      },
      'astro:build:done': async ({ dir }) => {
        if (contentRoot === undefined) return;
        await copyAttachments(contentRoot, fileURLToPath(dir), base);
      },
    },
  };
}

async function copyAttachments(contentRoot: string, outputRoot: string, base: string): Promise<void> {
  const attachmentRoot = join(contentRoot, 'attachments');
  let canonicalContentRoot: string;
  let canonicalAttachmentRoot: string;
  try {
    [canonicalContentRoot, canonicalAttachmentRoot] = await Promise.all([
      realpath(contentRoot),
      realpath(attachmentRoot),
    ]);
  } catch (error) {
    if (isMissingFile(error)) return;
    throw error;
  }

  if (!isContainedPath(canonicalAttachmentRoot, canonicalContentRoot)) return;
  const outputAttachmentRoot = join(outputRoot, ...baseSegments(base), 'content-assets');
  await copyContainedFiles(attachmentRoot, attachmentRoot, canonicalAttachmentRoot, outputAttachmentRoot);
}

async function copyContainedFiles(
  directory: string,
  attachmentRoot: string,
  canonicalAttachmentRoot: string,
  outputAttachmentRoot: string,
): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const source = join(directory, entry.name);
    if (entry.isDirectory()) {
      const canonicalDirectory = await realpath(source);
      if (isContainedPath(canonicalDirectory, canonicalAttachmentRoot)) {
        await copyContainedFiles(source, attachmentRoot, canonicalAttachmentRoot, outputAttachmentRoot);
      }
      continue;
    }

    let canonicalSource: string;
    try {
      canonicalSource = await realpath(source);
    } catch (error) {
      if (isMissingFile(error)) continue;
      throw error;
    }
    if (!isContainedPath(canonicalSource, canonicalAttachmentRoot)) continue;
    if (!(await stat(canonicalSource)).isFile()) continue;

    const destination = join(outputAttachmentRoot, relative(attachmentRoot, source));
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(canonicalSource, destination);
  }
}

function baseSegments(base: string): string[] {
  return base.split('/').filter((segment) => segment !== '' && segment !== '.');
}

function isContainedPath(path: string, root: string): boolean {
  const pathFromRoot = relative(root, path);
  return pathFromRoot === ''
    || (pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot));
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function regenerateForDevelopment(
  generate: () => Promise<void>,
  server: ViteDevServer,
  logger: { error(message: string): void },
): Promise<void> {
  try {
    await generate();
    server.moduleGraph.invalidateAll();
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
  }
}

function isWithinContent(changedPath: string, projectRoot: string, contentRoot: string): boolean {
  const absolutePath = isAbsolute(changedPath) ? changedPath : resolve(projectRoot, changedPath);
  const pathFromContent = relative(contentRoot, absolutePath);
  return pathFromContent === '' || (!pathFromContent.startsWith('..') && !isAbsolute(pathFromContent));
}
