# Recruiter Portfolio PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signal Hub 프로젝트를 채용 담당자가 빠르게 이해할 수 있는 링크 전용 웹 포트폴리오로 개편하고, 같은 콘텐츠에서 A4 세로 한 페이지에 독립 화면 두 개가 들어가는 공식 제출용 PDF를 재현 가능하게 생성한다.

**Architecture:** `content/portfolio/*.md`의 구조화 frontmatter를 웹과 PDF의 단일 원본으로 사용한다. Astro 포트폴리오 레이아웃은 웹 상세 화면과 인쇄 전용 2-up 화면을 함께 렌더링하고 CSS media query가 출력 범위를 결정한다. 공식 PDF 명령은 프로덕션 빌드와 임시 preview를 실행한 뒤 Playwright Chromium으로 같은 URL을 인쇄하고, 필수 DOM과 PDF 1페이지 계약을 검증한 파일만 최종 경로로 원자적으로 교체한다.

**Tech Stack:** Astro 7, Astro Content Collections, TypeScript, Zod, Markdown, CSS print media, Vitest, Playwright Chromium, `pdf-lib`, pypdf, Poppler

**Spec:** `docs/superpowers/specs/2026-08-21-recruiter-portfolio-pdf-design.md`

## Global Constraints

- 공통 지원자 정보는 이름 `손명관`, 이메일 `tarmk0801@gmail.com`, GitHub `https://github.com/internalforces`만 저장한다. 전화번호는 코드, HTML과 PDF에 넣지 않는다.
- 공통 직함을 만들지 않고 프로젝트 문서의 `targetRole`을 사용한다.
- 포트폴리오는 인증 페이지가 아니다. 기존처럼 직접 URL로만 접근하며 검색, 공개 목록, RSS, sitemap, 지식 그래프와 일반 내비게이션에서 제외한다.
- 웹과 PDF에 서로 다른 콘텐츠 사본을 만들지 않는다. Markdown frontmatter와 본문이 유일한 원본이다.
- 출력물은 A4 portrait 한 페이지이며, 독립된 가로형 화면 두 개를 위아래에 배치한다. 한 화면을 억지로 축소하거나 두 번째 물리 페이지로 넘기지 않는다.
- 흰색과 밝은 회색을 기본으로 하고 파란색은 작은 강조에만 사용한다. 넓은 검정·진한 파랑 배경을 금지한다.
- 인쇄 본문은 8.5pt 이상, 보조 문구는 8pt 이상, 화면 제목은 약 22pt를 유지한다.
- 자동 PDF 생성이 실패하면 기존의 정상 PDF를 덮어쓰지 않는다.
- 기존 사용자 변경은 보존하며 각 작업 전에 `git status --short`로 겹치는 파일을 확인한다.
- 실제 PDF를 처음 생성하기 직전에 PDF skill의 artifact marker를 정확히 한 번 실행한다.

---

## File Map

- `src/lib/content/schema.ts`: 프로젝트 포트폴리오 구조화 데이터와 고정 개수 계약
- `content/portfolio/signal-hub.md`: Signal Hub 채용 메시지, 수치, 기능, 기술 판단과 검증 근거
- `content/templates/portfolio.md`: 다른 직무 프로젝트도 재사용할 수 있는 완전한 작성 템플릿
- `README.md`: 새 frontmatter 계약, 웹 확인과 공식 PDF 생성법
- `src/config/portfolio.ts`: 공개 가능한 공통 지원자 이름·이메일·GitHub
- `src/layouts/BaseLayout.astro`: 일반 사이트 chrome을 선택적으로 숨기는 `siteChrome` 계약
- `src/components/portfolio/PortfolioToolbar.astro`: 웹 전용 지원자·외부 링크·인쇄 버튼
- `src/components/portfolio/PortfolioMiniGraphic.astro`: 선택적인 trend, threshold, window 미니 시각화
- `src/components/portfolio/PortfolioOverview.astro`: 첫 번째 독립 화면
- `src/components/portfolio/PortfolioEvidence.astro`: 두 번째 독립 화면
- `src/layouts/PortfolioLayout.astro`: 두 화면, 상세 Markdown과 채용 문의 조합
- `src/styles/portfolio.css`: 반응형 웹과 A4 2-up 인쇄 레이아웃
- `scripts/lib/portfolio-pdf.mjs`: CLI 인자, 파일명과 PDF 페이지 수 검증의 순수 함수
- `scripts/export-portfolio-pdf.mjs`: preview·Chromium·임시 파일 생명주기
- `package.json`, `package-lock.json`: `portfolio:pdf` 명령과 `pdf-lib` 개발 의존성
- `.gitignore`: `output/pdf/` 생성물 제외
- `tests/unit/content-schema.test.ts`: 구조화 frontmatter의 유효·무효 경계
- `tests/unit/portfolio-pdf.test.ts`: PDF CLI 순수 함수와 한 페이지 검증
- `tests/integration/base-layout.test.ts`: 선택적 site chrome 계약
- `tests/integration/content-routes.test.ts`: 빌드 결과, 개인정보, 미노출과 화면 구조 계약
- `tests/e2e/portfolio.spec.ts`: 인쇄 버튼, print media, 키보드, reduced motion과 overflow
- `tests/e2e/search.spec.ts`: 개편 후에도 검색에서 제외되는 계약
- `tests/e2e/accessibility.spec.ts`: 포트폴리오 serious/critical 접근성 회귀
- `tests/e2e/mobile.spec.ts`: 포트폴리오 모바일 가로 overflow 회귀

---

### Task 1: Structured Portfolio Content Contract

**Files:**
- Modify: `tests/unit/content-schema.test.ts`
- Modify: `src/lib/content/schema.ts`
- Modify: `content/templates/portfolio.md`
- Modify: `content/portfolio/signal-hub.md`
- Modify: `tests/integration/content-routes.test.ts`
- Modify: `README.md`

**Interfaces:**
- Extends `portfolioSchema` with `headline`, `metrics`, `story`, `capabilities`, `ownership`, `architecture`, `decisions`, `validation`, `currentScope`, `nextStep`
- Requires exactly four metrics, three capabilities, three decisions and four validation proofs
- Requires two through four architecture nodes and three through six validation steps
- Keeps existing `targetRole`, `targetDomains`, links, draft and safe `shareId` contracts

- [ ] **Step 1: Expand the valid unit-test fixture**

Add the following fields to the existing `portfolio` fixture in `tests/unit/content-schema.test.ts`:

```ts
headline: '재현 가능한 데이터 처리를 실제 배포까지 연결했습니다.',
metrics: [
  { value: '약 4주', label: '개발 기간', detail: '2026-07-27 첫 커밋부터' },
  { value: '83', label: '자동화 테스트', detail: '15개 테스트 파일' },
  { value: '9', label: '워크스페이스', detail: '앱 1 · 커넥터 3 · 패키지 5' },
  { value: '0.3.0', label: 'npm 공개 버전', detail: 'Node.js 20 · 22 · 24' },
],
story: {
  problem: '전체 운영 플랫폼 없이 시계열 규칙을 먼저 검증하기 어려웠습니다.',
  approach: 'CSV 입력과 명시적인 규칙 기반 탐지기에 범위를 집중했습니다.',
  result: '같은 입력에서 같은 신호와 중복 없는 저장 결과를 재현합니다.',
},
capabilities: [
  { title: '연속 변화율', summary: '인접 값의 변화를 탐지합니다.', evidence: '동일 입력에서 같은 신호 ID', visual: 'trend' },
  { title: '임계값 통과', summary: '기준선의 상향·하향 통과를 찾습니다.', evidence: '방향과 시점을 명시', visual: 'threshold' },
  { title: '시간 윈도우 변화', summary: '지정 기간의 누적 변화를 비교합니다.', evidence: '24시간 변화율 25%', visual: 'window' },
],
ownership: ['모노레포 아키텍처', '탐지·점수화', 'SQLite 저장', 'CLI·테스트·npm 배포'],
architecture: [
  { label: 'INPUT', title: 'CSV Connector', detail: '시계열 행 정규화' },
  { label: 'CORE', title: 'Detector + Score', detail: '규칙 기반 신호 생성' },
  { label: 'OUTPUT', title: 'SQLite + JSON', detail: '멱등 저장과 정렬 출력' },
],
decisions: [
  { title: '결정론적 신호 ID', implementation: '입력과 규칙으로 ID를 생성했습니다.', impact: '재실행 결과를 비교할 수 있습니다.' },
  { title: 'SQLite 멱등 저장', implementation: 'TEXT PRIMARY KEY와 INSERT OR IGNORE를 사용했습니다.', impact: '동일 신호의 중복 적재를 막습니다.' },
  { title: '단방향 패키지 경계', implementation: '입력→코어→저장·출력 방향을 유지했습니다.', impact: '책임과 배포 단위를 분리합니다.' },
],
validation: {
  steps: ['build', '83 tests', 'typecheck', 'audit', 'isolated install', 'real CLI run'],
  proofs: [
    { value: '2', label: '격리 환경 생성 신호' },
    { value: '25%', label: '24시간 변화율' },
    { value: '1', label: '소비자 data.db' },
    { value: '0', label: '패키지 내부 DB' },
  ],
  command: 'npm run release:check',
},
currentScope: 'CSV 입력과 로컬 CLI 실행을 지원하며 외부 서비스 커넥터는 포함하지 않습니다.',
nextStep: 'CSV 파싱과 외부 커넥터 경계를 강화하되 결정론과 멱등성 계약을 유지합니다.',
```

- [ ] **Step 2: Add boundary tests for every collection size**

Add parameterized rejection tests that remove or append one item at each boundary:

```ts
it.each([
  ['metrics', { metrics: portfolio.metrics.slice(0, 3) }],
  ['capabilities', { capabilities: [...portfolio.capabilities, portfolio.capabilities[0]] }],
  ['architecture minimum', { architecture: portfolio.architecture.slice(0, 1) }],
  ['architecture maximum', { architecture: [...portfolio.architecture, portfolio.architecture[0], portfolio.architecture[1]] }],
  ['decisions', { decisions: portfolio.decisions.slice(0, 2) }],
  ['validation steps minimum', { validation: { ...portfolio.validation, steps: ['build', 'test'] } }],
  ['validation steps maximum', { validation: { ...portfolio.validation, steps: ['1', '2', '3', '4', '5', '6', '7'] } }],
  ['validation proofs', { validation: { ...portfolio.validation, proofs: portfolio.validation.proofs.slice(0, 3) } }],
])('rejects an invalid portfolio %s count', (_name, override) => {
  expect(() => portfolioSchema.parse({ ...portfolio, ...override })).toThrow();
});

it('accepts a capability without a decorative visual', () => {
  const capabilities = portfolio.capabilities.map(({ visual: _visual, ...capability }) => capability);
  expect(portfolioSchema.parse({ ...portfolio, capabilities }).capabilities).toEqual(capabilities);
});
```

- [ ] **Step 3: Run the schema test and verify RED**

Run: `npx vitest run tests/unit/content-schema.test.ts`

Expected: FAIL because Zod currently strips the unknown structured fields, so the new boundary cases incorrectly parse instead of throwing.

- [ ] **Step 4: Implement the Zod contract**

Define reusable schemas immediately above `portfolioSchema` and compose them into it:

```ts
const portfolioMetricSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().min(1),
});

const portfolioCapabilitySchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  evidence: z.string().min(1),
  visual: z.enum(['trend', 'threshold', 'window']).optional(),
});
```

Use the same non-empty string rule for all story, architecture, decision and proof properties, then extend `portfolioSchema` with:

```ts
headline: z.string().min(1),
metrics: z.array(portfolioMetricSchema).length(4),
story: z.object({
  problem: z.string().min(1),
  approach: z.string().min(1),
  result: z.string().min(1),
}),
capabilities: z.array(portfolioCapabilitySchema).length(3),
ownership: z.array(z.string().min(1)).min(1),
architecture: z.array(portfolioArchitectureNodeSchema).min(2).max(4),
decisions: z.array(portfolioDecisionSchema).length(3),
validation: z.object({
  steps: z.array(z.string().min(1)).min(3).max(6),
  proofs: z.array(portfolioProofSchema).length(4),
  command: z.string().min(1).optional(),
}),
currentScope: z.string().min(1),
nextStep: z.string().min(1),
```

- [ ] **Step 5: Migrate every portfolio document and fixture in the same slice**

Replace `content/templates/portfolio.md` with a complete neutral example containing all required fields and no backend-only assumption except its editable example `targetRole`. Update `content/portfolio/signal-hub.md` with the exact evidence in the approved spec and retain the existing detailed Markdown headings below frontmatter.

Update all three raw portfolio frontmatters created inside `tests/integration/content-routes.test.ts`—published fixture, draft fixture and duplicate-share fixture—with schema-valid metrics, story, three capabilities, ownership, two architecture nodes, three decisions, three validation steps, four proofs, `currentScope` and `nextStep`. The published fixture uses the approved Signal Hub headline plus `TEXT PRIMARY KEY` and `INSERT OR IGNORE` decision evidence required by Task 3. Draft and duplicate fixtures may use compact generic copy. Keep their current `shareId`, draft and duplicate-ID purpose unchanged.

Update the README portfolio authoring paragraph so it names all required structured fields and states the four/three/three/four fixed counts and architecture/validation ranges.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npx vitest run tests/unit/content-schema.test.ts tests/integration/content-routes.test.ts`

Expected: PASS; the integration build accepts every migrated fixture and still rejects a duplicate `shareId`.

- [ ] **Step 7: Commit the content contract**

```bash
git add src/lib/content/schema.ts content/templates/portfolio.md content/portfolio/signal-hub.md tests/unit/content-schema.test.ts tests/integration/content-routes.test.ts README.md
git commit -m "feat: structure recruiter portfolio evidence"
```

---

### Task 2: Candidate Profile and Portfolio-Only Chrome

**Files:**
- Create: `src/config/portfolio.ts`
- Modify: `tests/integration/base-layout.test.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `tests/integration/content-routes.test.ts`
- Modify: `src/layouts/PortfolioLayout.astro`

**Interfaces:**
- Exports `PORTFOLIO_PROFILE` with `name`, `email`, `github`
- Adds `siteChrome?: boolean` to `BaseLayout.astro`, defaulting to `true`
- Portfolio layout calls `<BaseLayout siteChrome={false}>`
- Keeps the skip link and `<main id="main-content">` for keyboard accessibility

- [ ] **Step 1: Write failing profile and chrome tests**

Extend `tests/integration/base-layout.test.ts`:

```ts
test('base layout can suppress site chrome without removing main content', async () => {
  const source = await readFile('src/layouts/BaseLayout.astro', 'utf8');
  expect(source).toContain('siteChrome?: boolean');
  expect(source).toContain('siteChrome = true');
  expect(source).toContain('{siteChrome && <SiteHeader />}');
  expect(source).toContain('{siteChrome && <SearchDialog');
  expect(source).toContain('{siteChrome && <SiteFooter />}');
  expect(source).toContain('<main id="main-content"');
});
```

Extend the built portfolio route test to assert `손명관`, `tarmk0801@gmail.com`, `https://github.com/internalforces`, and the fixture `targetRole`, while asserting that the global labels `통합 검색 열기` and `모바일 메뉴 열기` are absent. Assert `<private phone>` is absent.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npx vitest run tests/integration/base-layout.test.ts tests/integration/content-routes.test.ts`

Expected: FAIL because `siteChrome` and the candidate profile do not exist.

- [ ] **Step 3: Add the public profile constant**

Create `src/config/portfolio.ts`:

```ts
export const PORTFOLIO_PROFILE = {
  name: '손명관',
  email: 'tarmk0801@gmail.com',
  github: 'https://github.com/internalforces',
} as const;
```

- [ ] **Step 4: Make BaseLayout chrome optional**

Add `siteChrome?: boolean` to `Props`, default it to `true`, and conditionally render only `SiteHeader`, `SearchDialog` and `SiteFooter`. Do not conditionally remove the skip link, main element, metadata, font or reduced-motion rules.

Pass `siteChrome={false}` from `PortfolioLayout.astro`. Temporarily render the profile name, `mailto:` email, GitHub and `entry.data.targetRole` in the existing portfolio header so the slice is green before the full redesign.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npx vitest run tests/integration/base-layout.test.ts tests/integration/content-routes.test.ts`

Expected: PASS; normal layouts retain their chrome by default and the portfolio page has only its own candidate links.

- [ ] **Step 6: Commit the layout boundary**

```bash
git add src/config/portfolio.ts src/layouts/BaseLayout.astro src/layouts/PortfolioLayout.astro tests/integration/base-layout.test.ts tests/integration/content-routes.test.ts
git commit -m "feat: isolate portfolio presentation chrome"
```

---

### Task 3: Recruiter Overview and Evidence Screens

**Files:**
- Create: `src/components/portfolio/PortfolioToolbar.astro`
- Create: `src/components/portfolio/PortfolioMiniGraphic.astro`
- Create: `src/components/portfolio/PortfolioOverview.astro`
- Create: `src/components/portfolio/PortfolioEvidence.astro`
- Modify: `src/layouts/PortfolioLayout.astro`
- Replace: `src/styles/portfolio.css`
- Modify: `tests/integration/content-routes.test.ts`

**Interfaces:**
- `PortfolioOverview` and `PortfolioEvidence` accept `entry: CollectionEntry<'portfolio'>`
- Each screen uses `.portfolio-screen`, an `aria-labelledby` heading and its own footer
- `.portfolio-print-sheet` contains exactly two direct `.portfolio-screen` children
- Root article exposes `data-portfolio-project={entry.data.project}` for the PDF exporter
- Detail Markdown remains visible on web and is marked `.portfolio-detail`

- [ ] **Step 1: Add failing static-output assertions**

In the direct route integration test, assert:

```ts
expect(html).toContain('data-portfolio-project="signal-hub"');
expect(html.match(/class="portfolio-screen/g)).toHaveLength(2);
expect(html).toContain('재현 가능한 데이터 처리를 실제 배포까지 연결했습니다.');
expect(html).toContain('무엇을 만들었는가');
expect(html).toContain('왜 신뢰할 수 있는가');
expect(html).toContain('문제');
expect(html).toContain('선택');
expect(html).toContain('결과');
expect(html).toContain('TEXT PRIMARY KEY');
expect(html).toContain('INSERT OR IGNORE');
expect(html).toContain('현재 범위');
expect(html).toContain('다음 단계');
expect(html).toContain('portfolio-detail');
```

Also assert the light-print contract in the CSS source: `@page`, `size: A4 portrait`, `.portfolio-print-sheet`, and `@media print`; reject broad dark fills with a targeted assertion that the screen background is `#fff` or `var(--portfolio-paper)`.

- [ ] **Step 2: Run the route test and verify RED**

Run: `npx vitest run tests/integration/content-routes.test.ts`

Expected: FAIL because the two-screen structure and recruiter copy are not rendered.

- [ ] **Step 3: Build the toolbar**

`PortfolioToolbar.astro` reads `PORTFOLIO_PROFILE`, renders name, GitHub, `mailto:` email and a `<button type="button" data-print-portfolio>PDF로 저장</button>`. Add a module script that registers one click handler and calls `window.print()`. The toolbar has `aria-label="포트폴리오 도구"` and the print button uses text rather than an icon-only label.

- [ ] **Step 4: Build the optional mini graphics**

`PortfolioMiniGraphic.astro` accepts:

```ts
interface Props {
  visual?: 'trend' | 'threshold' | 'window';
}
```

When `visual` is absent, render no SVG and let the capability copy occupy the full card. For the three variants, render small inline SVGs with `aria-hidden="true"`, `fill="none"`, current-color strokes and no dark background:

- `trend`: rising line with three points
- `threshold`: horizontal threshold and one crossing line
- `window`: two endpoints joined across a labeled bracket

The textual title, summary and evidence remain outside the SVG, so information never depends on color or graphics.

- [ ] **Step 5: Build screen 1**

`PortfolioOverview.astro` renders:

1. Screen header: `손명관`, `entry.data.targetRole`, `PROJECT 01 · 무엇을 만들었는가`
2. `entry.data.headline` as the single level-one heading for the page
3. Four metrics in a four-column definition list
4. Problem→Choice→Result story in three connected light cards
5. Three capabilities with optional mini graphics
6. Ownership chips and a footer with email and `화면 1 · 프로젝트 개요`

Use semantic `section`, `h2`, `h3`, `dl`, `dt`, `dd` and lists. Do not repeat another `h1` in screen 2 or the Markdown body.

- [ ] **Step 6: Build screen 2**

`PortfolioEvidence.astro` renders:

1. Screen header: project title, `entry.data.projectType`, `PROJECT 02 · 왜 신뢰할 수 있는가`
2. Architecture nodes in document order with arrow separators that collapse to vertical flow on mobile
3. Three decision cards, each pairing `implementation` and `impact`
4. Validation steps as an ordered pipeline and optional monospace command
5. Four proof values in a light grid
6. `currentScope` and `nextStep` as two bordered notes
7. Footer with email and `화면 2 · 기술 근거`

- [ ] **Step 7: Recompose PortfolioLayout**

Keep the current action link derivation. Render this order:

```astro
<BaseLayout
  title={entry.data.title}
  description={entry.data.description}
  robots="noindex, nofollow, noarchive, nosnippet"
  searchable={false}
  siteChrome={false}
>
  <article class="portfolio-page" data-portfolio-project={entry.data.project}>
    <PortfolioToolbar />
    <div class="portfolio-print-sheet">
      <PortfolioOverview entry={entry} />
      <PortfolioEvidence entry={entry} />
    </div>
    <section class="portfolio-detail" aria-labelledby="portfolio-detail-title">
      <h2 id="portfolio-detail-title">상세 기술 기록</h2>
      <div class="prose"><slot /></div>
      <nav class="portfolio-actions" aria-label="프로젝트 링크">
        {actionLinks.map((link, index) => (
          <a href={link.href} target={index === 0 ? undefined : '_blank'} rel={index === 0 ? undefined : 'noreferrer'}>
            {link.label}
          </a>
        ))}
      </nav>
    </section>
    <aside class="portfolio-contact" aria-labelledby="portfolio-contact-title">
      <h2 id="portfolio-contact-title">함께 이야기하고 싶다면</h2>
      <a href={`mailto:${PORTFOLIO_PROFILE.email}`}>{PORTFOLIO_PROFILE.email}</a>
      <a href={PORTFOLIO_PROFILE.github}>GitHub</a>
    </aside>
  </article>
</BaseLayout>
```

The contact area links to email and GitHub. Do not add phone, public download URLs or site navigation.

- [ ] **Step 8: Implement responsive web and fixed print CSS**

Define local tokens at `.portfolio-page`:

```css
--portfolio-ink: #13213a;
--portfolio-muted: #5f6f86;
--portfolio-blue: #1263ef;
--portfolio-line: #d6deea;
--portfolio-soft: #f3f6fa;
--portfolio-blue-soft: #eef4ff;
--portfolio-paper: #fff;
```

For web, keep a centered `min(100% - 2rem, 90rem)` canvas, generous screen padding and 1–4 column grids according to viewport. At `max-width: 48rem`, make story, capability, architecture and decision grids one column and metrics two columns. Ensure long links and monospace commands use `overflow-wrap: anywhere`.

For print, use this invariant skeleton:

```css
@page {
  size: A4 portrait;
  margin: 8mm;
}

@media print {
  html,
  body {
    background: #fff !important;
  }

  .portfolio-toolbar,
  .portfolio-detail,
  .portfolio-contact {
    display: none !important;
  }

  .portfolio-page {
    padding: 0;
  }

  .portfolio-print-sheet {
    display: grid;
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
    gap: 4mm;
    width: 194mm;
    height: 281mm;
    margin: 0;
  }

  .portfolio-screen {
    min-width: 0;
    min-height: 0;
    padding: 4mm 5mm 3mm;
    border: 0.3mm solid #cfd8e6;
    break-inside: avoid;
    overflow: hidden;
    background: #fff !important;
  }
}
```

Inside print media, use approximately 22pt for the screen 1 headline, 13–15pt for section titles, 8.5–9pt for body copy and at least 8pt for labels. Remove shadows, animation and sticky positioning. Give both `.portfolio-screen` elements explicit internal grid rows so extra vertical space is distributed through sections rather than left as one blank block at the bottom.

- [ ] **Step 9: Run focused checks and verify GREEN**

Run:

```bash
npm run check
npx vitest run tests/integration/content-routes.test.ts
```

Expected: Astro type checking passes and the production HTML contains two screens, all approved evidence and no global site chrome.

- [ ] **Step 10: Commit the presentation slice**

```bash
git add src/components/portfolio src/layouts/PortfolioLayout.astro src/styles/portfolio.css tests/integration/content-routes.test.ts
git commit -m "feat: build recruiter portfolio screens"
```

---

### Task 4: Browser Interaction, Print Mode, Accessibility, and Responsive Tests

**Files:**
- Create: `tests/e2e/portfolio.spec.ts`
- Modify: `tests/e2e/search.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/mobile.spec.ts`
- Modify if tests expose issues: `src/components/portfolio/*.astro`
- Modify if tests expose issues: `src/styles/portfolio.css`

**Interfaces:**
- `[data-print-portfolio]` calls `window.print()` exactly once per click
- Print media shows exactly two `.portfolio-screen` elements and hides toolbar/detail/contact
- Reduced motion keeps all portfolio content visible
- Desktop and 390px mobile viewport have no horizontal overflow

- [ ] **Step 1: Write the portfolio E2E tests**

Create `tests/e2e/portfolio.spec.ts` with `portfolioPath = pagePath('/portfolio/8c5e1a7d3b92-signal-hub/')` and these tests:

```ts
test('shows candidate, project value and four evidence metrics', async ({ page }) => {
  await page.goto(portfolioPath, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1, name: '재현 가능한 데이터 처리를 실제 배포까지 연결했습니다.' })).toBeVisible();
  await expect(page.getByText('손명관').first()).toBeVisible();
  await expect(page.getByText('백엔드 개발자').first()).toBeVisible();
  await expect(page.locator('.portfolio-metrics > *')).toHaveCount(4);
  await expect(page.locator('.portfolio-screen')).toHaveCount(2);
});

test('opens the browser print dialog from the toolbar', async ({ page }) => {
  await page.goto(portfolioPath);
  await page.evaluate(() => {
    (window as typeof window & { __printCalls?: number }).__printCalls = 0;
    window.print = () => { (window as typeof window & { __printCalls?: number }).__printCalls! += 1; };
  });
  await page.getByRole('button', { name: 'PDF로 저장' }).click();
  await expect.poll(() => page.evaluate(() => (
    (window as typeof window & { __printCalls?: number }).__printCalls
  ))).toBe(1);
});
```

Add tests that:

- tab to the print button and activate it with Enter
- call `page.emulateMedia({ media: 'print' })`, then expect two screens visible and `.portfolio-toolbar`, `.portfolio-detail`, `.portfolio-contact` hidden
- create a context with `reducedMotion: 'reduce'` and assert both screen headings are visible without waiting for animation
- check desktop `scrollWidth <= clientWidth`
- set 390×844 viewport and repeat the overflow assertion

- [ ] **Step 2: Update existing regression suites**

In `tests/e2e/search.spec.ts`, change only the portfolio page expectations to the new level-one headline and keep the search exclusion query `격리된 릴리스 검증 경로` if it remains in the detailed body.

Append `/portfolio/8c5e1a7d3b92-signal-hub/` to the route arrays in `tests/e2e/accessibility.spec.ts` and `tests/e2e/mobile.spec.ts`.

- [ ] **Step 3: Run the focused browser tests and verify RED or expose layout faults**

Run:

```bash
npx playwright test tests/e2e/portfolio.spec.ts tests/e2e/search.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/mobile.spec.ts
```

Expected before final fixes: the new tests either fail on missing interaction hooks or reveal concrete overflow/accessibility issues. Do not loosen assertions to hide a defect.

- [ ] **Step 4: Fix only observed interaction and layout failures**

Keep button behavior in the toolbar module script. Add visible focus styles using the existing global focus token. Ensure decorative SVGs stay `aria-hidden`; headings and link names must be unique enough for screen readers. Adjust grid minimums, `min-width: 0` and wrapping where overflow is observed. Do not reduce print text below the approved minimums.

- [ ] **Step 5: Run the browser tests and verify GREEN**

Run the same focused Playwright command.

Expected: all portfolio, search exclusion, accessibility and mobile overflow tests pass.

- [ ] **Step 6: Commit the browser behavior slice**

```bash
git add tests/e2e/portfolio.spec.ts tests/e2e/search.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/mobile.spec.ts src/components/portfolio src/styles/portfolio.css
git commit -m "test: verify portfolio print experience"
```

---

### Task 5: Deterministic One-Page PDF Export and Visual QA

**Files:**
- Create: `tests/unit/portfolio-pdf.test.ts`
- Create: `scripts/lib/portfolio-pdf.mjs`
- Create: `scripts/export-portfolio-pdf.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Modify: `README.md`
- Modify if PDF inspection exposes issues: `src/styles/portfolio.css`

**Interfaces:**
- Command: `npm run portfolio:pdf -- --share-id 8c5e1a7d3b92-signal-hub`
- Output: `output/pdf/sonmyeonggwan-signal-hub-project-portfolio.pdf`
- `parsePortfolioPdfArgs(argv)` accepts one safe `--share-id` value
- `portfolioPdfFilename(project)` accepts a safe project slug and returns the deterministic filename
- `assertSinglePagePdf(bytes)` resolves for exactly one page and rejects every other count
- Final output is replaced only after DOM, page count and file checks pass

- [ ] **Step 1: Write failing unit tests for CLI helpers**

Create `tests/unit/portfolio-pdf.test.ts`:

```ts
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  assertSinglePagePdf,
  parsePortfolioPdfArgs,
  portfolioPdfFilename,
} from '../../scripts/lib/portfolio-pdf.mjs';

describe('portfolio PDF helpers', () => {
  it('parses one safe share id', () => {
    expect(parsePortfolioPdfArgs(['--share-id', '8c5e1a7d3b92-signal-hub'])).toEqual({
      shareId: '8c5e1a7d3b92-signal-hub',
    });
  });

  it.each([[], ['--share-id'], ['--share-id', '../signal-hub'], ['--unknown', 'value']])
    ('rejects invalid arguments %j', (argv) => {
      expect(() => parsePortfolioPdfArgs(argv)).toThrow();
    });

  it('builds a deterministic safe filename', () => {
    expect(portfolioPdfFilename('signal-hub')).toBe('sonmyeonggwan-signal-hub-project-portfolio.pdf');
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
});
```

- [ ] **Step 2: Add the dependency and verify RED**

Run:

```bash
npm install --save-dev pdf-lib
npx vitest run tests/unit/portfolio-pdf.test.ts
```

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement pure PDF helpers**

Create `scripts/lib/portfolio-pdf.mjs` with one shared safe ID regex `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, strict argument count, actionable error messages and:

```js
export async function assertSinglePagePdf(bytes) {
  const document = await PDFDocument.load(bytes);
  const count = document.getPageCount();
  if (count !== 1) {
    throw new Error(`Portfolio PDF must contain exactly one page; received ${count}.`);
  }
}
```

`portfolioPdfFilename` must reject unsafe slugs before interpolation. Do not accept output paths from user input.

- [ ] **Step 4: Run helper tests and verify GREEN**

Run: `npx vitest run tests/unit/portfolio-pdf.test.ts`

Expected: all helper tests pass.

- [ ] **Step 5: Implement the exporter lifecycle**

Create `scripts/export-portfolio-pdf.mjs` using Node built-ins and `chromium` imported directly from the installed `@playwright/test` package:

1. Parse the share ID before starting processes.
2. Find an available localhost port with `node:net` and close the probe server.
3. Spawn `npm run preview -- --host 127.0.0.1 --port ${String(port)}` as an argument array with `ASTRO_PREVIEW_BACKGROUND=0`.
4. Poll the base URL with bounded attempts; include captured preview stderr in startup failures.
5. Launch Chromium, navigate to `${baseUrl}/portfolio/${shareId}/`, require HTTP success and wait for `document.fonts.ready`.
6. Switch to print media and assert one `[data-portfolio-project]`, exactly two visible `.portfolio-screen` elements and visible text `손명관`, `tarmk0801@gmail.com`, `무엇을 만들었는가`, `왜 신뢰할 수 있는가`.
7. Read the safe `data-portfolio-project` value and derive the final filename with `portfolioPdfFilename`.
8. Create `output/pdf`, write Chromium output to `.${filename}.${process.pid}.tmp.pdf` inside that same directory with:

```js
await page.pdf({
  path: temporaryPath,
  format: 'A4',
  preferCSSPageSize: true,
  printBackground: true,
  displayHeaderFooter: false,
});
```

9. Read the temporary file, assert non-zero bytes and call `assertSinglePagePdf`.
10. Rename the validated temporary file to the final path. Because both files are in the same directory, the successful POSIX rename is atomic.
11. In `finally`, close Chromium, terminate preview and remove only the known temporary file when it still exists.

Catch the missing-browser launch error and print `npx playwright install chromium`. Never delete or truncate the existing final file on a failed run.

- [ ] **Step 6: Wire the command and documentation**

Add to `package.json`:

```json
"portfolio:pdf": "npm run build && node scripts/export-portfolio-pdf.mjs"
```

Add `output/pdf/` to `.gitignore`. In README, document the exact command, expected output, browser-print fallback, Chromium recovery command and the fact that official generation fails unless the PDF remains exactly one page.

- [ ] **Step 7: Run code-level verification**

Run:

```bash
npm run verify
npx playwright test tests/e2e/portfolio.spec.ts tests/e2e/search.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/mobile.spec.ts
```

Expected: all unit, integration, build and focused browser suites pass.

- [ ] **Step 8: Load the bundled PDF runtime and mark the first artifact operation**

Use `codex_app__load_workspace_dependencies` to locate the bundled Python/Poppler runtime. Immediately before the first real PDF creation command, run exactly once:

```bash
node container_tools/mark_artifact_operation_started.mjs \
  --operation-kind create \
  --expected-output-count 1 \
  --output-format pdf
```

If the dependency loader reports an absolute marker path, use that exact path. Do not repeat the marker when regenerating the same artifact during this task.

- [ ] **Step 9: Generate the official PDF**

Run:

```bash
npm run portfolio:pdf -- --share-id 8c5e1a7d3b92-signal-hub
```

Expected: `output/pdf/sonmyeonggwan-signal-hub-project-portfolio.pdf` exists and the command reports one validated page.

- [ ] **Step 10: Inspect PDF structure and extracted text**

Run `pdfinfo` against the output and assert `Pages: 1` and A4 portrait dimensions. Use bundled Python with `pypdf` to extract page text and assert these strings:

```text
손명관
Signal Hub
tarmk0801@gmail.com
재현 가능한 데이터 처리를 실제 배포까지 연결했습니다.
83
0.3.0
TEXT PRIMARY KEY
INSERT OR IGNORE
```

Failure of any text assertion is a release failure, not a warning.

- [ ] **Step 11: Render the PDF to PNG and inspect it directly**

Create a task-specific temporary directory with `mktemp -d`, run `pdftoppm -png -r 160` on the official PDF, then inspect the single PNG with the image viewer. Verify all of the following visually:

- two complete independent screens fit on one A4 page
- neither screen has a large unused block at its bottom
- body and labels are readable at normal PDF zoom
- no clipping, overlap, orphan label or horizontal truncation
- background is white/light and contains no broad dark ink-heavy region
- grayscale structure remains understandable without relying on blue

If inspection fails, adjust only `src/styles/portfolio.css` or content density, rerun Steps 9–11 without rerunning the artifact marker, and keep the 8pt minimum.

- [ ] **Step 12: Verify failed export preserves the last good PDF**

Record the output checksum, run the exporter with a nonexistent safe ID, assert a non-zero exit, and compare the checksum again:

```bash
shasum -a 256 output/pdf/sonmyeonggwan-signal-hub-project-portfolio.pdf
npm run portfolio:pdf -- --share-id 8c5e1a7d3b92-does-not-exist
shasum -a 256 output/pdf/sonmyeonggwan-signal-hub-project-portfolio.pdf
```

Expected: the invalid command fails and both checksums are identical.

- [ ] **Step 13: Commit the exporter and final print corrections**

```bash
git add scripts/lib/portfolio-pdf.mjs scripts/export-portfolio-pdf.mjs tests/unit/portfolio-pdf.test.ts package.json package-lock.json .gitignore README.md src/styles/portfolio.css
git commit -m "feat: export one-page project portfolio PDF"
```

- [ ] **Step 14: Final clean-tree and regression check**

Run:

```bash
npm run verify
npm run test:e2e
git status --short
```

Expected: both quality gates pass. `git status --short` contains no uncommitted source changes; the ignored PDF remains available at the expected output path for submission.

---

## Completion Evidence

The implementation is complete only when all of these are true:

- Signal Hub direct URL renders candidate identity, project-specific role, four metrics, problem→choice→result, three capabilities, ownership, architecture, three decisions, release pipeline, four proof values, current scope and next step.
- General site header, search and footer are absent from the portfolio while skip-link, main landmark, noindex and Pagefind exclusion remain.
- The phone number is absent from generated HTML and PDF.
- The page remains absent from sitemap, RSS, public content index and Pagefind results.
- Browser print uses the same two portfolio screens as the web page.
- The official command produces exactly one A4 portrait page at the deterministic path.
- Text extraction contains all required identity and technical evidence.
- The latest rendered PNG has been visually reviewed and shows two readable, light, fully occupied screens without clipping or excessive blank space.
- A failed regeneration leaves the last valid PDF byte-for-byte unchanged.
