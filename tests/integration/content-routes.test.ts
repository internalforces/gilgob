import { execFile } from 'node:child_process';
import { access, readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const basePath = 'dist';
const draftFixture = 'content/knowledge/__integration-draft.md';
const publicLinkFixture = 'content/knowledge/__integration-public-link.md';
const portfolioFixture = 'content/portfolio/__integration-unlisted.md';
const portfolioDraftFixture = 'content/portfolio/__integration-unlisted-draft.md';
const duplicatePortfolioFixture = 'content/portfolio/__integration-unlisted-duplicate.md';
const portfolioShareId = '8c5e1a7d3b92-route-fixture';
const publishedPortfolioShareId = '8c5e1a7d3b92-signal-hub';
const portfolioDraftShareId = 'b91d2e4f6a80-draft-fixture';

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
    await writeFile(publicLinkFixture, `---
title: "초안을 참조하는 공개 문서"
description: "공개 문서에서 초안 링크가 노출되지 않는지 검증한다."
category: "보안"
tags: ["Draft"]
created: 2026-08-20
draft: false
aliases: []
featured: false
status: seed
---

[[공개되지 않는 초안|초안 링크]]
`, 'utf8');
    await writeFile(portfolioFixture, `---
title: "통합 테스트 링크 전용 포트폴리오"
description: "직접 링크 접근과 공개 표면 제외를 검증한다."
shareId: "8c5e1a7d3b92-route-fixture"
project: "signal-hub"
targetRole: "백엔드 개발자"
targetDomains:
  primary: "데이터 플랫폼"
  subdomains: ["시계열 분석", "핀테크 데이터", "개발자 도구"]
period: "2026.08–현재"
projectType: "개인 프로젝트"
role: ["설계", "구현", "배포"]
tags: ["TypeScript", "SQLite"]
updated: 2026-08-21
draft: false
repository: "https://github.com/internalforces/SignalHub"
package: "https://www.npmjs.com/package/csv-to-signal"
---

## 30초 요약

통합 테스트 전용 본문이다.
`, 'utf8');
    await writeFile(portfolioDraftFixture, `---
title: "프로덕션에서 제외되는 포트폴리오 초안"
description: "포트폴리오 초안 정적 경로 제외를 검증한다."
shareId: "${portfolioDraftShareId}"
project: "signal-hub"
targetRole: "백엔드 개발자"
targetDomains:
  primary: "데이터 플랫폼"
  subdomains: ["시계열 분석"]
period: "2026.08–현재"
projectType: "개인 프로젝트"
role: ["설계"]
tags: ["TypeScript"]
updated: 2026-08-21
draft: true
---

초안 본문이다.
`, 'utf8');
    try {
      await execFileAsync('npm', ['run', 'build'], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' },
        maxBuffer: 10 * 1024 * 1024,
      });
    } finally {
      await Promise.all([
        rm(draftFixture, { force: true }),
        rm(publicLinkFixture, { force: true }),
        rm(portfolioFixture, { force: true }),
        rm(portfolioDraftFixture, { force: true }),
      ]);
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
    expect(detailHtml.match(/<h1(?:\s|>)/g)).toHaveLength(1);
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

  it('does not render an href from a public document to a draft document', async () => {
    const html = await readFile(`${basePath}/knowledge/__integration-public-link/index.html`, 'utf8');

    expect(html).toContain('초안 링크');
    expect(html).toContain('wiki-link--missing');
    expect(html).not.toContain('href="/gilgob/knowledge/__integration-draft"');
  });

  it('places reading content before the mobile table of contents in the DOM', async () => {
    const html = await readFile(`${basePath}/knowledge/database/b-tree-index/index.html`, 'utf8');

    expect(html.indexOf('<div class="prose">')).toBeLessThan(html.indexOf('reading-toc--mobile'));
  });

  it('places one related-knowledge footer between backlinks and next questions', async () => {
    const html = await readFile(`${basePath}/knowledge/network/tcp-udp/index.html`, 'utf8');
    const backlinks = html.indexOf('id="backlinks-title"');
    const related = html.indexOf('id="related-title"');
    const nextQuestions = html.indexOf('id="next-questions-title"');

    expect(backlinks).toBeGreaterThan(-1);
    expect(related).toBeGreaterThan(backlinks);
    expect(nextQuestions).toBeGreaterThan(related);
    expect(html.match(/>관련 지식<\/h2>/g)).toHaveLength(1);
    expect(html).not.toContain('>연결된 지식</h2>');
  });

  it('emits Pagefind result metadata and ignores repeated reading chrome', async () => {
    const html = await readFile(`${basePath}/knowledge/database/b-tree-index/index.html`, 'utf8');

    expect(html).toContain('data-pagefind-meta="title"');
    expect(html).toContain('data-pagefind-meta="description"');
    expect(html).toContain('data-pagefind-meta="type"');
    expect(html).toContain('data-pagefind-meta="category:Computer Science"');
    expect(html).toContain('data-pagefind-meta="tags:B-Tree, Index, Oracle"');
    expect(html.match(/data-pagefind-ignore/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it('renders Korean category copy while retaining canonical Pagefind metadata', async () => {
    const [indexHtml, detailHtml, graphHtml] = await Promise.all([
      readFile(`${basePath}/knowledge/index.html`, 'utf8'),
      readFile(`${basePath}/knowledge/database/b-tree-index/index.html`, 'utf8'),
      readFile(`${basePath}/graph/index.html`, 'utf8'),
    ]);

    expect(indexHtml).toContain('컴퓨터 과학');
    expect(detailHtml).toContain('data-pagefind-meta="category:Computer Science"');
    expect(detailHtml).toContain('컴퓨터 과학');
    expect(graphHtml).toContain('컴퓨터 과학');
    expect(indexHtml).toContain('보안');
    expect(graphHtml).toContain('분야: 보안');
    expect(indexHtml).not.toMatch(/>Computer Science</);
    expect(detailHtml).not.toMatch(/>Computer Science</);
    expect(graphHtml).not.toMatch(/>Computer Science</);
    expect(graphHtml).not.toMatch(/>Projects</);
  });

  it('keeps the skill island free of server-only Zod code', async () => {
    const skillsHtml = await readFile(`${basePath}/skills/index.html`, 'utf8');
    const chunkPath = skillsHtml.match(/component-url="([^"]*\/SkillTree\.[^"]+\.js)"/)?.[1];
    expect(chunkPath).toBeDefined();
    const chunk = await readFile(`${basePath}${chunkPath!.replace('/gilgob', '')}`, 'utf8');

    expect(chunk).not.toMatch(/Zod(?:Error|Type|Check)|invalid_type|safeParse/);
    expect(Buffer.byteLength(chunk)).toBeLessThan(20_000);
  });

  it('builds the direct portfolio route with unlisted metadata', async () => {
    const html = await readFile(`${basePath}/portfolio/${portfolioShareId}/index.html`, 'utf8');

    expect(html).toContain('content="noindex, nofollow, noarchive, nosnippet"');
    expect(html).toMatch(/<body[^>]*data-pagefind-ignore="all"/);
    expect(html).toContain('/gilgob/projects/signal-hub/');
    expect(html).toContain('https://github.com/internalforces/SignalHub');
    expect(html).toContain('https://www.npmjs.com/package/csv-to-signal');
    expect(html).toContain('지원 산업 분야');
    expect(html).toContain('데이터 플랫폼');
    expect(html).toContain('시계열 분석');
    expect(html).toContain('핀테크 데이터');
    expect(html).toContain('개발자 도구');
  });

  it('does not emit a production route for a draft portfolio', async () => {
    await expect(access(`${basePath}/portfolio/${portfolioDraftShareId}/index.html`))
      .rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('keeps portfolio routes out of public discovery surfaces', async () => {
    await expect(access(`${basePath}/portfolio/index.html`)).rejects.toMatchObject({ code: 'ENOENT' });
    const [sitemap, rss, home, project, index] = await Promise.all([
      readFile(`${basePath}/sitemap-0.xml`, 'utf8'),
      readFile(`${basePath}/rss.xml`, 'utf8'),
      readFile(`${basePath}/index.html`, 'utf8'),
      readFile(`${basePath}/projects/signal-hub/index.html`, 'utf8'),
      readFile('.cache/content-index.json', 'utf8'),
    ]);
    for (const output of [sitemap, rss, home, project, index]) {
      expect(output).not.toContain('/portfolio/');
      expect(output).not.toContain('통합 테스트 링크 전용 포트폴리오');
    }
  });

  it('rejects duplicate portfolio share IDs instead of choosing a document', async () => {
    await writeFile(duplicatePortfolioFixture, `---
title: "중복 공유 식별자 포트폴리오"
description: "중복 공유 식별자 검증 전용 문서다."
shareId: "${publishedPortfolioShareId}"
project: "signal-hub"
targetRole: "백엔드 개발자"
targetDomains:
  primary: "데이터 플랫폼"
  subdomains: ["시계열 분석"]
period: "2026.08–현재"
projectType: "개인 프로젝트"
role: ["설계"]
tags: ["TypeScript"]
updated: 2026-08-21
draft: false
---

중복 문서 본문이다.
`, 'utf8');
    try {
      await expect(execFileAsync('npm', ['run', 'build'], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' },
        maxBuffer: 10 * 1024 * 1024,
      })).rejects.toThrow(/Duplicate portfolio shareId/i);
    } finally {
      await rm(duplicatePortfolioFixture, { force: true });
    }
  }, 60_000);
});
