import { execFile } from 'node:child_process';
import { access, readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const basePath = 'dist';
const draftFixture = 'content/knowledge/__integration-draft.md';

describe('content routes', () => {
  beforeAll(async () => {
    await writeFile(draftFixture, `---
title: "공개되지 않는 초안"
description: "프로덕션 정적 경로 제외를 검증한다."
category: "Research"
tags: ["Draft"]
created: 2026-08-20
draft: true
aliases: []
featured: false
status: seed
---

# 공개되지 않는 초안
`, 'utf8');
    try {
      await execFileAsync('npm', ['run', 'build'], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' },
        maxBuffer: 10 * 1024 * 1024,
      });
    } finally {
      await rm(draftFixture, { force: true });
    }
  }, 60_000);

  it.each([
    ['knowledge', 'database/b-tree-index'],
    ['explorations', 'llm-watermark'],
    ['projects', 'signal-hub'],
    ['logs', '2026-08-20-oracle-hierarchical-query'],
  ])('builds the %s index and detail route', async (kind, slug) => {
    const [indexHtml, detailHtml] = await Promise.all([
      readFile(`${basePath}/${kind}/index.html`, 'utf8'),
      readFile(`${basePath}/${kind}/${slug}/index.html`, 'utf8'),
    ]);

    expect(indexHtml).toContain('data-content-list');
    expect(indexHtml).toContain('data-filter-card');
    expect(indexHtml).toContain('data-pagefind-meta="type:');
    expect(indexHtml).toContain('aria-live="polite"');
    expect(detailHtml).toContain('data-pagefind-body');
    expect(detailHtml).toContain('목차');
    expect(detailHtml).toContain('백링크');
    expect(detailHtml).toContain('관련 지식');
  });

  it('renders complete static cards before the filter island enhances them', async () => {
    const html = await readFile(`${basePath}/knowledge/index.html`, 'utf8');
    const filterComponent = html.indexOf('/_astro/ContentFilters.');
    const filterIsland = html.lastIndexOf('<astro-island', filterComponent);

    expect(filterComponent).toBeGreaterThan(-1);
    expect(html.indexOf('data-filter-card')).toBeLessThan(filterIsland);
    expect(html).not.toContain('data-draft="true"');
    expect(html).toContain('type="search"');
    expect(html).toContain('name="category"');
    expect(html).toContain('name="tag"');
    expect(html).toContain('name="status"');
  });

  it('does not emit a production route for a draft fixture', async () => {
    await expect(access(`${basePath}/knowledge/__integration-draft/index.html`)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
