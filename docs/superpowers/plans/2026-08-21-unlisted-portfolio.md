# Unlisted Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 공개 프로젝트 문서와 독립적으로 공존하며 직접 공유 링크로만 접근하는 취업용 포트폴리오 컬렉션과 Signal Hub 케이스 스터디를 제공한다.

**Architecture:** `portfolio`는 Astro 콘텐츠 컬렉션에는 등록하지만 기존 `ContentKind`, 공개 콘텐츠 쿼리와 커스텀 지식 인덱스에는 포함하지 않는다. 전용 정적 라우트와 레이아웃만 컬렉션을 읽고, sitemap 필터·robots 메타·Pagefind 전체 제외 속성으로 미노출 계약을 지킨다.

**Tech Stack:** Astro 7, Astro Content Collections, TypeScript, Zod, Markdown, Vitest, Playwright, Pagefind

**Spec:** `docs/superpowers/specs/2026-08-21-unlisted-portfolio-design.md`

## Global Constraints

- 포트폴리오는 인증형 비공개 페이지가 아니라 직접 URL을 아는 사람이 접근하는 미노출 페이지다.
- 기존 `knowledge`, `explorations`, `projects`, `logs` 컬렉션과 `ContentKind` 계약은 변경하지 않는다.
- 공개 프로젝트·홈·내비게이션에서 포트폴리오로 들어오는 링크를 만들지 않는다.
- 포트폴리오를 공개 콘텐츠 인덱스, RSS, Pagefind, sitemap, 지식 그래프, 백링크와 관련 문서에서 제외한다.
- 외부 링크는 HTTPS만 허용하고 검증되지 않은 성과 수치는 작성하지 않는다.
- 기존 작업 트리의 `content/projects/signal-hub.md`, `src/layouts/ContentLayout.astro`, `tests/integration/content-routes.test.ts` 변경을 보존한다.

---

## File Structure

- `src/lib/content/schema.ts`: 독립 `portfolioSchema`와 안전한 공유 식별자 검증
- `src/content.config.ts`: `content/portfolio` 로더 등록
- `content/templates/portfolio.md`: Obsidian 포트폴리오 작성 템플릿
- `src/layouts/BaseLayout.astro`: 페이지별 robots 지시문과 Pagefind 전체 제외 옵션
- `src/layouts/PortfolioLayout.astro`: 채용 케이스 스터디 전용 정보 구조
- `src/styles/portfolio.css`: 포트폴리오 헤더, 메타데이터, 역할, 링크와 본문 스타일
- `src/pages/portfolio/[shareId].astro`: 초안 필터와 `shareId` 기반 정적 상세 경로
- `astro.config.mjs`: `/portfolio/` sitemap 제외
- `content/portfolio/signal-hub.md`: 첫 링크 전용 케이스 스터디
- `tests/unit/content-schema.test.ts`: 포트폴리오 데이터 계약
- `tests/integration/base-layout.test.ts`: robots와 Pagefind 제외 옵션의 렌더링 계약
- `tests/integration/content-routes.test.ts`: 빌드 산출물의 직접 접근 및 미노출 계약. 기존 사용자 테스트 뒤에만 추가
- `tests/e2e/search.spec.ts`: 실제 Pagefind 검색에서 포트폴리오가 나오지 않는지 검증
- `README.md`: 새 템플릿과 링크 전용 보안 모델 안내

---

### Task 1: Portfolio Schema and Collection

**Files:**
- Modify: `tests/unit/content-schema.test.ts`
- Modify: `src/lib/content/schema.ts`
- Modify: `src/content.config.ts`
- Create: `content/portfolio/.gitkeep`
- Create: `content/templates/portfolio.md`

**Interfaces:**
- Produces: `portfolioSchema` exported from `src/lib/content/schema.ts`
- Produces: Astro collection key `portfolio`
- Produces: frontmatter fields `title`, `description`, `shareId`, `project`, `targetRole`, `period`, `projectType`, `role`, `tags`, `updated`, `draft`, `repository`, `package`, `demo`

- [ ] **Step 1: Write failing schema tests**

Import `portfolioSchema`, add a valid portfolio fixture, add rejection cases for `../secret`, values containing `/`, `%2f`, `?`, `#`, a missing role array, and `http://` external links, and add `portfolio` to the template validation table.

```ts
const portfolio = {
  title: 'Signal Hub 포트폴리오',
  description: '결정론적 시계열 분석 엔진을 설계하고 배포한 과정이다.',
  shareId: '8c5e1a7d3b92-signal-hub',
  project: 'signal-hub',
  targetRole: '백엔드 개발자',
  period: '2026.08–현재',
  projectType: '개인 프로젝트',
  role: ['아키텍처 설계', 'CLI와 분석 엔진 구현', 'npm 배포'],
  tags: ['TypeScript', 'SQLite', 'CLI'],
  updated: '2026-08-21',
  draft: false,
  repository: 'https://github.com/internalforces/SignalHub',
  package: 'https://www.npmjs.com/package/csv-to-signal',
};

it('accepts an unlisted portfolio case study', () => {
  expect(portfolioSchema.parse(portfolio).shareId).toBe(portfolio.shareId);
});

it.each(['../secret', 'nested/share', 'encoded%2fpath', 'query?x=1', 'fragment#x'])
  ('rejects unsafe portfolio share id %s', (shareId) => {
    expect(() => portfolioSchema.parse({ ...portfolio, shareId })).toThrow();
  });
```

- [ ] **Step 2: Run the schema test and verify RED**

Run: `npx vitest run tests/unit/content-schema.test.ts`

Expected: FAIL because `portfolioSchema` and `content/templates/portfolio.md` do not exist.

- [ ] **Step 3: Implement the minimal schema, collection and template**

Export a single-segment `shareIdSchema`, reuse the existing safe project slug and HTTPS URL validators, and register the collection without adding it to `ContentKind`.

```ts
const shareIdSchema = z.string().min(12).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'shareId는 소문자 영숫자와 하이픈으로 구성된 안전한 단일 경로여야 합니다.',
);

export const portfolioSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  shareId: shareIdSchema,
  project: safeSlugSchema,
  targetRole: z.string().min(1),
  period: z.string().min(1),
  projectType: z.string().min(1),
  role: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).min(1),
  updated: z.coerce.date(),
  draft: z.boolean().default(true),
  repository: httpsUrlSchema.optional(),
  package: httpsUrlSchema.optional(),
  demo: httpsUrlSchema.optional(),
});
```

Create `content/portfolio/.gitkeep` so an empty collection base exists before the first case study is published.

- [ ] **Step 4: Run the schema test and verify GREEN**

Run: `npx vitest run tests/unit/content-schema.test.ts`

Expected: all schema tests PASS with no warnings.

- [ ] **Step 5: Commit the schema slice**

```bash
git add src/lib/content/schema.ts src/content.config.ts content/portfolio/.gitkeep content/templates/portfolio.md tests/unit/content-schema.test.ts
git commit -m "feat: add unlisted portfolio collection"
```

---

### Task 2: Portfolio Route, Layout, and Indexing Controls

**Files:**
- Modify: `tests/integration/base-layout.test.ts`
- Modify: `tests/integration/content-routes.test.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Create: `src/layouts/PortfolioLayout.astro`
- Create: `src/styles/portfolio.css`
- Create: `src/pages/portfolio/[shareId].astro`
- Modify: `astro.config.mjs`

**Interfaces:**
- Consumes: Astro `portfolio` collection and `portfolioSchema`
- Produces: `BaseLayout` props `robots?: string` and `searchable?: boolean`
- Produces: static route `/portfolio/${entry.data.shareId}/`
- Produces: `PortfolioLayout` prop `entry: CollectionEntry<'portfolio'>`

- [ ] **Step 1: Write failing BaseLayout contract tests**

Add source-level assertions that `BaseLayout` accepts a custom robots value and applies `data-pagefind-ignore="all"` to `body` when `searchable` is false.

```ts
test('base layout supports unlisted pages', async () => {
  const source = await readFile('src/layouts/BaseLayout.astro', 'utf8');
  expect(source).toContain('robots?: string');
  expect(source).toContain('searchable?: boolean');
  expect(source).toContain("data-pagefind-ignore={searchable ? undefined : 'all'}");
});
```

- [ ] **Step 2: Add failing production route assertions**

Extend the existing `beforeAll` setup to create `content/portfolio/__integration-unlisted.md` with `shareId: 8c5e1a7d3b92-route-fixture`, then remove only that fixture after the build. Append tests after the user's current related-knowledge test. Assert the fixture share route, robots directive, `body` Pagefind exclusion, outbound links, absent `/portfolio/index.html`, absent sitemap/RSS/home/content-index references, and absent public links to `/portfolio/`.

```ts
const portfolioFixture = 'content/portfolio/__integration-unlisted.md';

await writeFile(portfolioFixture, `---
title: "통합 테스트 링크 전용 포트폴리오"
description: "직접 링크 접근과 공개 표면 제외를 검증한다."
shareId: "8c5e1a7d3b92-route-fixture"
project: "signal-hub"
targetRole: "백엔드 개발자"
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
```

Add `rm(portfolioFixture, { force: true })` to the existing `finally` cleanup array so the test never changes the committed portfolio content.

```ts
const portfolioShareId = '8c5e1a7d3b92-route-fixture';

it('builds the direct portfolio route with unlisted metadata', async () => {
  const html = await readFile(`${basePath}/portfolio/${portfolioShareId}/index.html`, 'utf8');
  expect(html).toContain('content="noindex, nofollow, noarchive, nosnippet"');
  expect(html).toMatch(/<body[^>]*data-pagefind-ignore="all"/);
  expect(html).toContain('/gilgob/projects/signal-hub/');
  expect(html).toContain('https://github.com/internalforces/SignalHub');
  expect(html).toContain('https://www.npmjs.com/package/csv-to-signal');
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
```

- [ ] **Step 3: Run focused tests and verify RED**

Run: `npx vitest run tests/integration/base-layout.test.ts tests/integration/content-routes.test.ts`

Expected: FAIL because the route, layout props, portfolio content and sitemap exclusion do not exist.

- [ ] **Step 4: Implement BaseLayout controls**

Keep the existing `noindex` boolean for the 404 page and add explicit props for the portfolio.

```astro
export interface Props {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  robots?: string;
  searchable?: boolean;
}

const {
  title,
  description,
  image,
  noindex = false,
  robots,
  searchable = true,
} = Astro.props;
const robotsContent = robots ?? (noindex ? 'noindex, nofollow' : undefined);
```

Render `robotsContent` in the head and set `data-pagefind-ignore={searchable ? undefined : 'all'}` on `body`.

- [ ] **Step 5: Implement the route and dedicated layout**

Filter drafts with the existing production helper, generate `shareId` params only, render a hero with target role, period, project type, roles, tags and optional action links, and wrap Markdown in `.prose`. Pass these controls to `BaseLayout`:

```astro
<BaseLayout
  title={entry.data.title}
  description={entry.data.description}
  robots="noindex, nofollow, noarchive, nosnippet"
  searchable={false}
>
```

Use `withBase(`/projects/${entry.data.project}/`)` for the public technical-document link. Do not render backlinks, related documents, a portfolio index link or a public-entry link.

- [ ] **Step 6: Exclude portfolio from sitemap**

Configure the existing integration without changing RSS or public queries.

```js
sitemap({
  filter: (page) => !new URL(page).pathname.includes('/portfolio/'),
})
```

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `npx vitest run tests/integration/base-layout.test.ts tests/integration/content-routes.test.ts`

Expected: route assertions PASS while all existing route assertions remain green.

- [ ] **Step 8: Commit the route slice**

```bash
git add astro.config.mjs src/layouts/BaseLayout.astro src/layouts/PortfolioLayout.astro src/styles/portfolio.css src/pages/portfolio/'[shareId].astro' tests/integration/base-layout.test.ts tests/integration/content-routes.test.ts
git commit -m "feat: render unlisted portfolio routes"
```

---

### Task 3: Signal Hub Case Study and Search Exclusion

**Files:**
- Modify: `tests/e2e/search.spec.ts`
- Create: `content/portfolio/signal-hub.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: portfolio share route `8c5e1a7d3b92-signal-hub`
- Produces: unique non-public search phrase `격리된 릴리스 검증 경로`

- [ ] **Step 1: Write the failing Pagefind search test**

Add an end-to-end test that first proves the direct portfolio route contains the unique phrase, then opens the search dialog, searches that phrase, and confirms no result link targets `/portfolio/`. Follow the existing search-dialog helpers and selectors already present in `tests/e2e/search.spec.ts`.

```ts
test('does not expose the unlisted portfolio through search', async ({ page }) => {
  await page.goto(pagePath('/portfolio/8c5e1a7d3b92-signal-hub/'));
  await expect(page.getByRole('heading', { level: 1, name: 'Signal Hub · 백엔드 포트폴리오' })).toBeVisible();
  await expect(page.getByText('격리된 릴리스 검증 경로')).toBeVisible();

  await page.goto(pagePath('/'), { waitUntil: 'networkidle' });
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: '통합 검색' });
  await dialog.getByRole('searchbox', { name: '지식 전체 검색' }).fill('격리된 릴리스 검증 경로');
  await expect(dialog.getByRole('status')).toContainText('일치하는 지식을 찾지 못했습니다');
  await expect(dialog.getByRole('option')).toHaveCount(0);
  await expect(page.locator('a[href*="/portfolio/"]')).toHaveCount(0);
});
```

- [ ] **Step 2: Run the focused E2E test and verify RED**

Run: `npm run build && npx playwright test tests/e2e/search.spec.ts --grep "unlisted portfolio"`

Expected: FAIL on the direct-page heading assertion because the approved Signal Hub portfolio document does not exist yet.

- [ ] **Step 3: Write the Signal Hub portfolio Markdown**

Use the approved frontmatter and the six standard sections. State only facts already present in the public project documentation: deterministic signal generation, SQLite idempotency, package boundaries, release verification, npm version 0.3.0, supported Node release lines and current limitations. Include the exact phrase `격리된 릴리스 검증 경로` in the release verification section so the Pagefind exclusion test has a unique query.

- [ ] **Step 4: Document authoring and security behavior**

Add `content/templates/portfolio.md` to the README template list and explain that portfolio documents are direct-link unlisted pages, excluded from public discovery but not protected by authentication. Document that `shareId` must be explicitly set and that sensitive or NDA material must not be stored.

- [ ] **Step 5: Rebuild and verify GREEN**

Run: `npm run build && npx playwright test tests/e2e/search.spec.ts --grep "unlisted portfolio"`

Expected: the direct page contains the unique phrase and search returns no `/portfolio/` result.

- [ ] **Step 6: Commit the content slice**

```bash
git add content/portfolio/signal-hub.md README.md tests/e2e/search.spec.ts
git commit -m "docs: add Signal Hub portfolio case study"
```

---

### Task 4: Full Verification and Requirement Audit

**Files:**
- Verify only; change only files required to resolve observed failures

**Interfaces:**
- Consumes: all preceding slices
- Produces: fresh evidence for every completion claim

- [ ] **Step 1: Run formatting and whitespace checks**

Run: `git diff --check`

Expected: no output and exit code 0.

- [ ] **Step 2: Run the complete static verification gate**

Run: `npm run verify`

Expected: Astro check, all Vitest tests, production build and Pagefind build PASS.

- [ ] **Step 3: Run complete browser coverage**

Run: `npm run test:e2e`

Expected: every Playwright test PASS, including direct portfolio rendering, no public navigation entry and search exclusion.

- [ ] **Step 4: Audit generated discovery outputs**

Run:

```bash
rg -n "portfolio|Signal Hub · 백엔드 포트폴리오|격리된 릴리스 검증 경로" dist/sitemap-0.xml dist/rss.xml dist/index.html .cache/content-index.json
```

Expected: no matches.

Run:

```bash
rg -n "noindex, nofollow, noarchive, nosnippet|data-pagefind-ignore=\"all\"|/gilgob/projects/signal-hub/" dist/portfolio/8c5e1a7d3b92-signal-hub/index.html
```

Expected: all three contracts match.

- [ ] **Step 5: Inspect the final diff without disturbing user changes**

Run: `git status --short && git diff --stat && git diff --check`

Expected: pre-existing user changes remain present, implementation files are intentional, and no whitespace errors exist.
