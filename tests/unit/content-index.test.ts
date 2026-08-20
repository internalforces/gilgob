import { access, cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AstroIntegration } from 'astro';
import type { ViteDevServer } from 'vite';
import * as contentBuilder from '../../src/lib/content/build-index';
import { buildContentIndex } from '../../src/lib/content/build-index';
import { readContentIndex, writeContentIndex } from '../../src/lib/content/index-store';
import { contentIndexIntegration } from '../../src/integrations/content-index';
import type { ContentIndex } from '../../src/lib/content/types';

type ConfigSetupOptions = Parameters<NonNullable<AstroIntegration['hooks']['astro:config:setup']>>[0];
type ConfigUpdate = Parameters<ConfigSetupOptions['updateConfig']>[0];
type CapturedVitePlugin = {
  buildStart?: () => void | Promise<void>;
  configureServer?: (server: ViteDevServer) => void;
};
type BuildDoneOptions = Parameters<NonNullable<AstroIntegration['hooks']['astro:build:done']>>[0];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('content index', () => {
  it('builds backlinks and deduplicated relation edges', async () => {
    const index = await buildContentIndex('tests/fixtures/content-index');
    const source = index.documents.find((item) => item.title === '인덱스 탐구');
    const target = index.documents.find((item) => item.title === 'B-Tree');

    expect(source?.outgoing).toEqual([target?.id]);
    expect(target?.backlinks).toEqual([source?.id]);
    expect(source?.related).toEqual([target?.id, 'knowledge/avl-tree']);
    expect(index.graph.edges.filter((edge) => edge.kind === 'wikilink')).toHaveLength(1);
    expect(index.graph.nodes.filter((node) => node.kind === 'category')).toHaveLength(1);
    expect(index.graph.edges.every((edge) => edge.id === `${edge.kind}:${edge.source}:${edge.target}`)).toBe(true);
  });

  it('preserves related scoring, title ties, positive-only candidates, and the five-item cap', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-related-ranking-'));
    const contentRoot = join(directory, 'content');
    const documents = [
      ['source', 'Source', 'Alpha', ['one', 'two'], '[[Linked]]'],
      ['linked', 'Linked', 'Other', [], ''],
      ['category-plus-tag', 'Category plus tag', 'Alpha', ['one'], ''],
      ['category-only', 'Category only', 'Alpha', [], ''],
      ['two-tags', 'Two tags', 'Other', ['one', 'two'], ''],
      ['a-tag', 'A tag', 'Other', ['one'], ''],
      ['b-tag', 'B tag', 'Other', ['two'], ''],
      ['unrelated', 'Unrelated', 'Elsewhere', ['none'], ''],
    ] as const;

    try {
      await mkdir(join(contentRoot, 'knowledge'), { recursive: true });
      await Promise.all(documents.map(([slug, title, category, tags, body]) => writeFile(
        join(contentRoot, `knowledge/${slug}.md`),
        `---\ntitle: "${title}"\ndescription: "${title}"\ncategory: "${category}"\ntags: ${JSON.stringify(tags)}\ncreated: 2026-08-20\ndraft: false\naliases: []\nfeatured: false\nstatus: seed\n---\n\n${body}\n`,
        'utf8',
      )));

      const index = await buildContentIndex(contentRoot);
      const source = index.documents.find((document) => document.title === 'Source');

      expect(source?.related).toEqual([
        'knowledge/linked',
        'knowledge/category-plus-tag',
        'knowledge/category-only',
        'knowledge/two-tags',
        'knowledge/a-tag',
      ]);
      expect(source?.related).not.toContain('knowledge/unrelated');
      expect(source?.related).toHaveLength(5);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('normalizes dates and derives slugs, document ids, and urls', async () => {
    const index = await buildContentIndex('tests/fixtures/content-index');
    const target = index.documents.find((item) => item.title === 'B-Tree');

    expect(target).toMatchObject({
      id: 'knowledge/database/b-tree',
      slug: 'database/b-tree',
      url: '/knowledge/database/b-tree',
      created: '2026-08-18',
      updated: '2026-08-19',
      draft: false,
      featured: false,
    });
  });

  it('resolves relative links from the source path when an explicit slug is present', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const index = await buildContentIndex('tests/fixtures/content-index-relative');
    const source = index.documents.find((item) => item.title === 'Relative Source');

    expect(source?.outgoing).toEqual(['knowledge/database/target']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('fails on duplicate aliases', async () => {
    await expect(buildContentIndex('tests/fixtures/duplicate-alias')).rejects.toThrow('중복 별칭');
  });

  it('fails on NFC, trim, and case-equivalent aliases within one document', async () => {
    await expect(buildContentIndex('tests/fixtures/duplicate-alias-single-document')).rejects.toThrow('중복 별칭');
  });

  it('allows a title to match its own alias because the owner is unchanged', async () => {
    await expect(buildContentIndex('tests/fixtures/self-title-alias')).resolves.toMatchObject({
      documents: [{ title: 'Own Name', aliases: [' own name '] }],
    });
  });

  it('fails on duplicate slugs and titles before deriving relations', async () => {
    await expect(buildContentIndex('tests/fixtures/duplicate-slug')).rejects.toThrow('중복 슬러그');
    await expect(buildContentIndex('tests/fixtures/duplicate-title')).rejects.toThrow('중복 제목');
  });

  it('fails when different collection kinds use the same normalized slug', async () => {
    await expect(buildContentIndex('tests/fixtures/duplicate-slug-cross-kind')).rejects.toThrow('중복 슬러그');
  });

  it('fails when one document title collides with another document alias', async () => {
    await expect(buildContentIndex('tests/fixtures/title-alias-collision')).rejects.toThrow('중복 제목 또는 별칭');
  });

  it('warns for unresolved links and missing attachments without failing the build', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(buildContentIndex('tests/fixtures/content-index-warnings')).resolves.toBeDefined();
    expect(warn.mock.calls).toEqual([
      ['[content] 해결되지 않은 링크: 아직 없는 문서'],
      ['[content] 누락된 첨부: attachments/missing.png'],
    ]);
  });

  it('treats traversal, symlink escapes, and directories as missing attachments', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-attachment-validation-'));
    const contentRoot = join(directory, 'content');
    const attachmentRoot = join(contentRoot, 'attachments');
    const outside = join(directory, 'secret.txt');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    try {
      await mkdir(join(contentRoot, 'knowledge'), { recursive: true });
      await mkdir(join(attachmentRoot, 'directory'), { recursive: true });
      await writeFile(outside, 'secret');
      await symlink(outside, join(attachmentRoot, 'escape.txt'));
      await writeFile(join(contentRoot, 'knowledge/attachments.md'), `---
title: "Attachment validation"
description: "attachment validation"
category: "Research"
tags: []
created: 2026-08-20
draft: false
aliases: []
featured: false
status: seed
---

![[attachments/../secret.txt]]
![[attachments/escape.txt]]
![[attachments/directory]]
`, 'utf8');

      await buildContentIndex(contentRoot);

      expect(warn.mock.calls).toEqual([
        ['[content] 누락된 첨부: attachments/../secret.txt'],
        ['[content] 누락된 첨부: attachments/escape.txt'],
        ['[content] 누락된 첨부: attachments/directory'],
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('content index store', () => {
  it('writes and reads an index through the cache file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-index-'));
    const path = join(directory, '.cache/content-index.json');
    const index = await buildContentIndex('tests/fixtures/content-index');

    try {
      await writeContentIndex(index, path);

      expect(readContentIndex(path)).toEqual(index);
      expect(await readFile(path, 'utf8')).toBe(`${JSON.stringify(index, null, 2)}\n`);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('instructs the user to restart the build when the cache is absent', () => {
    expect(() => readContentIndex('/definitely/missing/content-index.json')).toThrow('빌드를 다시 시작');
  });
});

describe('content index integration', () => {
  it('copies contained regular attachments at the output root while URLs remain base-aware', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-attachments-'));
    const attachmentRoot = join(directory, 'content/attachments');
    const outputRoot = join(directory, 'dist');
    const outsideFile = join(directory, 'outside-secret.txt');
    const integration = contentIndexIntegration();

    try {
      await mkdir(join(attachmentRoot, 'diagrams'), { recursive: true });
      await mkdir(join(attachmentRoot, '..assets'), { recursive: true });
      await writeFile(join(attachmentRoot, 'diagrams/tree.txt'), 'tree');
      await writeFile(join(attachmentRoot, '..assets/safe.txt'), 'safe');
      await writeFile(outsideFile, 'secret');
      await symlink(outsideFile, join(attachmentRoot, 'escape.txt'));
      await integration.hooks['astro:config:setup']?.({
        config: { root: pathToFileURL(`${directory}/`), base: '/repo' },
        updateConfig: (config: ConfigUpdate) => config as never,
      } as unknown as ConfigSetupOptions);
      await integration.hooks['astro:build:done']?.({
        dir: pathToFileURL(`${outputRoot}/`),
      } as unknown as BuildDoneOptions);

      await expect(readFile(join(outputRoot, 'content-assets/diagrams/tree.txt'), 'utf8')).resolves.toBe('tree');
      await expect(readFile(join(outputRoot, 'content-assets/..assets/safe.txt'), 'utf8')).resolves.toBe('safe');
      await expect(readFile(join(outputRoot, 'content-assets/escape.txt'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(access(join(outputRoot, 'repo/content-assets/diagrams/tree.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('does not fail when the optional attachment directory is absent', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-no-attachments-'));
    const integration = contentIndexIntegration();
    const buildDone = integration.hooks['astro:build:done'];

    try {
      await integration.hooks['astro:config:setup']?.({
        config: { root: pathToFileURL(`${directory}/`), base: '/' },
        updateConfig: (config: ConfigUpdate) => config as never,
      } as unknown as ConfigSetupOptions);

      expect(buildDone).toBeTypeOf('function');
      if (buildDone === undefined) return;
      await expect(buildDone({
        dir: pathToFileURL(`${directory}/dist/`),
      } as unknown as BuildDoneOptions)).resolves.toBeUndefined();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('generates the cache in the Vite buildStart hook', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-integration-'));
    const contentRoot = join(directory, 'content');
    let vitePlugin: CapturedVitePlugin | undefined;
    const integration = contentIndexIntegration();
    const setup = integration.hooks['astro:config:setup'];

    try {
      await cp('tests/fixtures/content-index', contentRoot, { recursive: true });
      await setup?.({
        config: { root: pathToFileURL(`${directory}/`) },
        updateConfig: (config: ConfigUpdate) => {
          vitePlugin = config.vite?.plugins?.[0] as unknown as CapturedVitePlugin;
          return config as never;
        },
      } as unknown as ConfigSetupOptions);

      await vitePlugin?.buildStart?.();

      expect(readContentIndex(join(directory, '.cache/content-index.json')).documents).toHaveLength(3);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('debounces content changes and invalidates the development module graph', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-watch-'));
    const contentRoot = join(directory, 'content');
    const cachePath = join(directory, '.cache/content-index.json');
    const listeners = new Map<string, (path: string) => void>();
    let invalidations = 0;
    let vitePlugin: CapturedVitePlugin | undefined;
    const setup = contentIndexIntegration().hooks['astro:config:setup'];

    try {
      await cp('tests/fixtures/content-index', contentRoot, { recursive: true });
      await setup?.({
        config: { root: pathToFileURL(`${directory}/`) },
        logger: { error: () => undefined },
        updateConfig: (config: ConfigUpdate) => {
          vitePlugin = config.vite?.plugins?.[0] as unknown as CapturedVitePlugin;
          return config as never;
        },
      } as unknown as ConfigSetupOptions);
      vitePlugin?.configureServer?.({
        watcher: {
          on(event: string, listener: (path: string) => void) {
            listeners.set(event, listener);
            return this;
          },
        },
        moduleGraph: { invalidateAll: () => { invalidations += 1; } },
      } as unknown as ViteDevServer);

      const changedPath = join(contentRoot, 'knowledge/avl-tree.md');
      listeners.get('add')?.(changedPath);
      listeners.get('change')?.(changedPath);
      listeners.get('unlink')?.(changedPath);

      await vi.waitFor(async () => {
        expect(await readFile(cachePath, 'utf8')).toContain('AVL Tree');
      });
      expect([...listeners.keys()]).toEqual(['add', 'change', 'unlink']);
      expect(invalidations).toBe(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('serializes overlapping watcher rebuilds and preserves the last event', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gilgob-overlap-'));
    const contentRoot = join(directory, 'content');
    const cachePath = join(directory, '.cache/content-index.json');
    const listeners = new Map<string, (path: string) => void>();
    let vitePlugin: CapturedVitePlugin | undefined;
    let calls = 0;
    let active = 0;
    let maxActive = 0;
    let releaseFirst: (() => void) | undefined;
    const firstBuildBlocked = new Promise<void>((resolve) => { releaseFirst = resolve; });
    vi.spyOn(contentBuilder, 'buildContentIndex').mockImplementation(async () => {
      calls += 1;
      const snapshot = calls;
      active += 1;
      maxActive = Math.max(maxActive, active);
      if (snapshot === 1) await firstBuildBlocked;
      active -= 1;
      return indexSnapshot(`snapshot-${snapshot}`);
    });
    const setup = contentIndexIntegration().hooks['astro:config:setup'];

    try {
      await cp('tests/fixtures/content-index', contentRoot, { recursive: true });
      await setup?.({
        config: { root: pathToFileURL(`${directory}/`) },
        logger: { error: () => undefined },
        updateConfig: (config: ConfigUpdate) => {
          vitePlugin = config.vite?.plugins?.[0] as unknown as CapturedVitePlugin;
          return config as never;
        },
      } as unknown as ConfigSetupOptions);
      vitePlugin?.configureServer?.({
        watcher: {
          on(event: string, listener: (path: string) => void) {
            listeners.set(event, listener);
            return this;
          },
        },
        moduleGraph: { invalidateAll: () => undefined },
      } as unknown as ViteDevServer);

      const changedPath = join(contentRoot, 'knowledge/avl-tree.md');
      listeners.get('add')?.(changedPath);
      await vi.waitFor(() => expect(calls).toBe(1));
      listeners.get('change')?.(changedPath);
      await new Promise((resolve) => setTimeout(resolve, 100));
      releaseFirst?.();

      await vi.waitFor(() => expect(calls).toBe(2));
      await vi.waitFor(() => expect(readContentIndex(cachePath).generatedAt).toBe('snapshot-2'));
      expect(maxActive).toBe(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

function indexSnapshot(generatedAt: string): ContentIndex {
  return { documents: [], graph: { nodes: [], edges: [] }, generatedAt };
}
