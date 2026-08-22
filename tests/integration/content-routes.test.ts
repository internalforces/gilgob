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
const koreanMobileNumberPattern = /(?:^|[^0-9])010(?:[ -]?[0-9]{4}){2}(?![0-9])/;

function decodeHtmlAttribute(value: string) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#34;', '"')
    .replaceAll('&#x22;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function portfolioRequiredText(html: string) {
  const serialized = html.match(/data-portfolio-pdf-required-text="([^"]+)"/)?.[1];
  if (!serialized) throw new Error('Missing portfolio PDF required-text payload.');
  return JSON.parse(decodeHtmlAttribute(serialized)) as string[];
}

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
project: "route-fixture"
targetRole: "플랫폼 엔지니어"
targetDomains:
  primary: "개발자 생산성"
  subdomains: ["정적 생성", "품질 자동화", "문서 도구"]
period: "2026.08"
projectType: "통합 테스트 프로젝트"
role: ["검증", "자동화"]
tags: ["Astro", "Vitest"]
updated: 2026-08-21
draft: false
headline: "구조화된 라우트 근거를 별도 프로젝트로 검증했습니다."
metrics:
  - value: "6일"
    label: "검증 기간"
    detail: "격리된 통합 흐름"
  - value: "12"
    label: "라우트 검사"
    detail: "공개와 비공개 경계"
  - value: "3"
    label: "품질 단계"
    detail: "check · test · build"
  - value: "1.2.3"
    label: "픽스처 버전"
    detail: "별도 콘텐츠 근거"
story:
  problem: "정적 출력이 원본 콘텐츠를 반영하는지 분리해 확인해야 했습니다."
  approach: "실제 프로젝트와 다른 구조화된 픽스처를 게시했습니다."
  result: "각 페이지가 자신의 검증 토큰을 제공함을 확인합니다."
capabilities:
  - title: "경로 생성"
    summary: "게시 대상의 정적 경로를 만듭니다."
    evidence: "직접 링크 응답"
  - title: "검색 제외"
    summary: "공개 탐색 표면에서 제외합니다."
    evidence: "noindex와 Pagefind 제외"
  - title: "출력 검증"
    summary: "페이지별 구조화 근거를 확인합니다."
    evidence: "서로 다른 필수 토큰"
    visual: "window"
ownership: ["픽스처 설계", "라우트 검증", "출력 검사"]
architecture:
  - label: "SOURCE"
    title: "Markdown Fixture"
    detail: "구조화된 입력"
  - label: "OUTPUT"
    title: "Static Portfolio"
    detail: "격리된 직접 링크"
decisions:
  - title: "콘텐츠 유도 토큰"
    implementation: "현재 픽스처의 구조화된 필드에서 토큰을 만듭니다."
    impact: "다른 프로젝트 값을 재사용하지 않습니다."
  - title: "직접 링크 격리"
    implementation: "검색과 사이트맵 표면에서 포트폴리오를 제외합니다."
    impact: "공유 식별자를 아는 경우에만 접근합니다."
  - title: "실패 우선 검증"
    implementation: "빌드 출력에 독립적인 기대값을 적용합니다."
    impact: "콘텐츠 회귀를 즉시 발견합니다."
validation:
  steps: ["check", "test", "build"]
  proofs:
    - value: "2"
      label: "독립 포트폴리오"
    - value: "12"
      label: "라우트 검사"
    - value: "3"
      label: "품질 단계"
    - value: "0"
      label: "공개 탐색 노출"
  command: "npm run verify"
currentScope: "정적 라우트와 페이지별 검증 토큰 생성을 확인합니다."
nextStep: "추가 프로젝트 픽스처로 콘텐츠 독립성을 확장합니다."
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
headline: "초안 포트폴리오의 구조화된 근거입니다."
metrics:
  - value: "1"
    label: "기간"
    detail: "초안"
  - value: "2"
    label: "검증"
    detail: "기본 흐름"
  - value: "3"
    label: "구성"
    detail: "입력 처리 출력"
  - value: "0.1.0"
    label: "버전"
    detail: "초안 배포본"
story:
  problem: "초안 문제를 정리합니다."
  approach: "작은 흐름으로 검증합니다."
  result: "검증 가능한 결과를 만듭니다."
capabilities:
  - title: "입력"
    summary: "입력을 받습니다."
    evidence: "입력 기록"
  - title: "처리"
    summary: "규칙을 적용합니다."
    evidence: "처리 기록"
  - title: "출력"
    summary: "결과를 제공합니다."
    evidence: "출력 기록"
ownership: ["설계"]
architecture:
  - label: "INPUT"
    title: "Input"
    detail: "입력 처리"
  - label: "OUTPUT"
    title: "Output"
    detail: "결과 출력"
decisions:
  - title: "범위"
    implementation: "핵심 흐름만 구현합니다."
    impact: "검증 시간을 줄입니다."
  - title: "경계"
    implementation: "책임을 분리합니다."
    impact: "변경을 추적합니다."
  - title: "검증"
    implementation: "자동화된 검사를 실행합니다."
    impact: "결과를 반복 확인합니다."
validation:
  steps: ["build", "test", "check"]
  proofs:
    - value: "1"
      label: "입력"
    - value: "1"
      label: "처리"
    - value: "1"
      label: "출력"
    - value: "0"
      label: "오류"
currentScope: "초안의 기본 흐름을 지원합니다."
nextStep: "검증 범위를 확장합니다."
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

  it.each(['knowledge', 'explorations', 'projects', 'logs'])('builds the %s index route', async (kind) => {
    const indexHtml = await readFile(`${basePath}/${kind}/index.html`, 'utf8');
    expect(indexHtml).toContain('data-content-list');
    expect(indexHtml).toContain('aria-live="polite"');
  });

  it.each(['knowledge', 'projects', 'logs'])('renders public cards in the %s index', async (kind) => {
    const indexHtml = await readFile(`${basePath}/${kind}/index.html`, 'utf8');
    expect(indexHtml).toContain('data-filter-card');
    expect(indexHtml).toContain('data-pagefind-meta="type:');
  });

  it('renders the empty exploration index without the deleted exploration route', async () => {
    const indexHtml = await readFile(`${basePath}/explorations/index.html`, 'utf8');

    expect(indexHtml).toContain('전체 0개 중 0개');
    expect(indexHtml).not.toContain('data-filter-card');
    await expect(access(`${basePath}/explorations/llm-watermark/index.html`)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.each([
    ['knowledge', 'database/b-tree-index'],
    ['projects', 'signal-hub'],
    ['logs', '2026-08-20-oracle-hierarchical-query'],
  ])('builds the %s detail route', async (kind, slug) => {
    const detailHtml = await readFile(`${basePath}/${kind}/${slug}/index.html`, 'utf8');

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
    const [html, publishedHtml, portfolioCss] = await Promise.all([
      readFile(`${basePath}/portfolio/${portfolioShareId}/index.html`, 'utf8'),
      readFile(`${basePath}/portfolio/${publishedPortfolioShareId}/index.html`, 'utf8'),
      readFile('src/styles/portfolio.css', 'utf8'),
    ]);
    const fixtureRequiredText = portfolioRequiredText(html);
    const publishedRequiredText = portfolioRequiredText(publishedHtml);

    expect(html).toContain('content="noindex, nofollow, noarchive, nosnippet"');
    expect(html).toMatch(/<body[^>]*data-pagefind-ignore="all"/);
    expect(html).toContain('data-portfolio-project="route-fixture"');
    expect(html.match(/class="portfolio-screen/g)).toHaveLength(2);
    expect(html).toContain('구조화된 라우트 근거를 별도 프로젝트로 검증했습니다.');
    expect(html).toContain('프로젝트 개요');
    expect(html).toContain('설계와 검증');
    expect(html).toContain('문제');
    expect(html).toContain('방식');
    expect(html).toContain('결과');
    expect(html).toContain('구현한 기능');
    expect(html).toMatch(/<span class="portfolio-mini-graphic__label">24h<\/span>\s*<svg/);
    expect(html).toContain('현재 픽스처의 구조화된 필드에서 토큰을 만듭니다.');
    expect(html).toContain('지원 범위');
    expect(html).toContain('다음 개선');
    expect(html).toContain('portfolio-detail');
    expect(html).toContain('/gilgob/projects/route-fixture/');
    expect(html).toContain('관련 분야');
    expect(html).toContain('개발자 생산성');
    expect(html).toContain('정적 생성');
    expect(html).toContain('품질 자동화');
    expect(html).toContain('문서 도구');
    expect(html).toContain('손명관');
    expect(html).toContain('tarmk0801@gmail.com');
    expect(html).toContain('https://github.com/internalforces');
    expect(html).toContain('플랫폼 엔지니어');
    expect(html).not.toContain('통합 검색 열기');
    expect(html).not.toContain('모바일 메뉴 열기');
    expect(html).not.toMatch(koreanMobileNumberPattern);
    expect(publishedHtml).not.toMatch(koreanMobileNumberPattern);
    expect(fixtureRequiredText).toEqual(expect.arrayContaining([
      '손명관',
      'tarmk0801@gmail.com',
      '통합 테스트 링크 전용 포트폴리오',
      '구조화된 라우트 근거를 별도 프로젝트로 검증했습니다.',
      '6일',
      '12',
      '3',
      '1.2.3',
      '현재 픽스처의 구조화된 필드에서 토큰을 만듭니다.',
    ]));
    expect(publishedRequiredText).toEqual(expect.arrayContaining([
      '손명관',
      'tarmk0801@gmail.com',
      'Signal Hub · CSV 시계열 분석 CLI',
      'CSV 시계열 데이터를 신호로 바꾸는 CLI를 설계해 npm에 배포했습니다.',
      '83',
      '0.3.0',
      '신호 ID를 기본키로 두고 INSERT OR IGNORE로 저장합니다.',
    ]));
    expect(fixtureRequiredText).not.toEqual(publishedRequiredText);
    expect(portfolioCss).toContain('@page');
    expect(portfolioCss).toContain('size: A4 portrait');
    expect(portfolioCss).toContain('.portfolio-print-sheet');
    expect(portfolioCss).toContain('@media print');
    expect(portfolioCss).toMatch(/\.portfolio-screen\s*\{[^}]*background:\s*(?:#fff|var\(--portfolio-paper\))/s);
    expect(portfolioCss).toMatch(/@media print[\s\S]*?\.portfolio-mini-graphic__label\s*\{[^}]*font-size:\s*8pt/);
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
headline: "중복 공유 식별자 검증용 구조화된 근거입니다."
metrics:
  - value: "1"
    label: "기간"
    detail: "검증"
  - value: "2"
    label: "테스트"
    detail: "기본 흐름"
  - value: "3"
    label: "구성"
    detail: "입력 처리 출력"
  - value: "0.1.0"
    label: "버전"
    detail: "검증 배포본"
story:
  problem: "중복 식별자를 확인합니다."
  approach: "같은 공유 식별자를 사용합니다."
  result: "빌드가 중복을 거부합니다."
capabilities:
  - title: "입력"
    summary: "입력을 받습니다."
    evidence: "입력 기록"
  - title: "처리"
    summary: "규칙을 적용합니다."
    evidence: "처리 기록"
  - title: "출력"
    summary: "결과를 제공합니다."
    evidence: "출력 기록"
ownership: ["검증"]
architecture:
  - label: "INPUT"
    title: "Input"
    detail: "입력 처리"
  - label: "OUTPUT"
    title: "Output"
    detail: "결과 출력"
decisions:
  - title: "범위"
    implementation: "핵심 흐름만 구현합니다."
    impact: "검증 시간을 줄입니다."
  - title: "경계"
    implementation: "책임을 분리합니다."
    impact: "변경을 추적합니다."
  - title: "검증"
    implementation: "자동화된 검사를 실행합니다."
    impact: "결과를 반복 확인합니다."
validation:
  steps: ["build", "test", "check"]
  proofs:
    - value: "1"
      label: "입력"
    - value: "1"
      label: "처리"
    - value: "1"
      label: "출력"
    - value: "0"
      label: "오류"
currentScope: "중복 식별자 검증 흐름을 지원합니다."
nextStep: "중복 검증 범위를 확장합니다."
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
