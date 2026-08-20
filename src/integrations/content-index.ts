import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { Plugin, ViteDevServer } from 'vite';
import { buildContentIndex } from '../lib/content/build-index';
import { DEFAULT_CONTENT_INDEX_PATH, writeContentIndex } from '../lib/content/index-store';

const REBUILD_DELAY_MS = 80;

export function contentIndexIntegration(): AstroIntegration {
  return {
    name: 'gilgob-content-index',
    hooks: {
      'astro:config:setup': ({ config, logger, updateConfig }) => {
        const projectRoot = fileURLToPath(config.root);
        const contentRoot = join(projectRoot, 'content');
        const indexPath = join(projectRoot, DEFAULT_CONTENT_INDEX_PATH);
        let rebuildTimer: ReturnType<typeof setTimeout> | undefined;
        const generate = async () => {
          const index = await buildContentIndex(contentRoot);
          await writeContentIndex(index, indexPath);
        };

        const plugin: Plugin = {
          name: 'gilgob-content-index',
          buildStart: generate,
          configureServer(server) {
            const scheduleRebuild = (changedPath: string) => {
              if (!isWithinContent(changedPath, projectRoot, contentRoot)) return;
              if (rebuildTimer !== undefined) clearTimeout(rebuildTimer);
              rebuildTimer = setTimeout(() => {
                rebuildTimer = undefined;
                void regenerateForDevelopment(generate, server, logger);
              }, REBUILD_DELAY_MS);
            };

            server.watcher.on('add', scheduleRebuild);
            server.watcher.on('change', scheduleRebuild);
            server.watcher.on('unlink', scheduleRebuild);
          },
        };

        updateConfig({ vite: { plugins: [plugin] } });
      },
    },
  };
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
