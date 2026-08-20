# gilgob Knowledge Garden Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Obsidian Vault를 직접 콘텐츠 원본으로 사용하는 한국어 Astro Knowledge Garden을 만들고 검색, 백링크, 스킬 트리, 지식 그래프, GitHub 활동 통계를 GitHub Pages에 정적으로 배포한다.

**Architecture:** 저장소 루트의 `content/`를 Astro Content Collections가 읽고, 별도 콘텐츠 인덱서가 위키링크·백링크·그래프 파생 데이터를 `.cache/`에 생성한다. 대부분의 페이지는 정적 HTML이며 검색, 필터, 그래프만 지연 로드되는 클라이언트 아일랜드를 사용한다. 외부 GitHub 데이터는 빌드 시 수집하고 캐시 실패 시에도 사이트 빌드를 유지한다.

**Tech Stack:** Node 22, npm 10, Astro 7.2.4, TypeScript strict, Preact 10.29.8, Cytoscape 3.34.1, Pagefind 1.5.2, Unified Markdown, GSAP, Vitest 4.1.11, Playwright 1.62.1, GitHub Actions/Pages

**Spec:** `docs/superpowers/specs/2026-08-20-gilgob-knowledge-garden-design.md`

## Global Constraints

- 사이트 이름은 `gilgob`, 작성자와 GitHub 사용자명은 `internalforces`다.
- 사용자 인터페이스는 전체 한국어이며 기술 용어와 문서 제목은 원문 표기를 허용한다.
- `content/` 자체가 Obsidian Vault이며 게시를 위해 파일을 다른 폴더로 복사하지 않는다.
- 정적 GitHub Pages 배포를 유지하고 런타임 서버나 데이터베이스를 추가하지 않는다.
- 기본 Pages URL은 `https://internalforces.github.io/gilgob/`이다.
- 밝은 테마만 제공하며 Quiet System 75%, Midnight Lab UI 25%의 시각 방향을 따른다.
- 모든 상호작용은 키보드로 사용할 수 있고 `prefers-reduced-motion`을 존중한다.
- 공개 빌드에서 `draft: true` 문서를 제외한다.
- 필수 메타데이터, 중복 slug·별칭, 잘못된 스킬 문서 참조는 빌드를 실패시킨다.
- 해결되지 않은 위키링크, 선택적 첨부, GitHub API 실패는 경고 또는 빈 상태로 처리한다.

---

## Planned File Map

### Configuration and tooling

- `package.json`: exact scripts and dependencies.
- `astro.config.mjs`: integrations, base-aware site URL, Unified Markdown processor.
- `tsconfig.json`: Astro strict TypeScript settings.
- `vitest.config.ts`: unit and integration test environment.
- `playwright.config.ts`: built-site browser tests.
- `scripts/build-search.mjs`: non-fatal Pagefind wrapper with an explicit unavailable marker.
- `.github/workflows/deploy.yml`: test, build, cache, scheduled GitHub Pages deployment.

### Content source and schema

- `content/{knowledge,explorations,projects,logs}/`: Obsidian-authored Markdown and MDX.
- `content/data/skills.yaml`: explicit skill hierarchy and status.
- `content/templates/*.md`: four Obsidian authoring templates.
- `content/.obsidian/{app,templates}.json`: shared attachment and template settings.
- `src/content.config.ts`: Astro collection registration.
- `src/lib/content/schema.ts`: reusable Zod schemas and inferred types.
- `src/lib/content/types.ts`: normalized records, link tokens, graph data contracts.

### Content derivation

- `src/lib/content/wiki-links.ts`: AST-based token extraction and resolution.
- `src/lib/content/build-index.ts`: file scan, duplicate validation, backlinks, related entries, graph edges.
- `src/lib/content/index-store.ts`: `.cache/content-index.json` serialization and loading.
- `src/integrations/content-index.ts`: Astro/Vite build and watch integration.
- `src/lib/markdown/remark-obsidian.ts`: wiki link, embed, and callout rendering.

### UI and pages

- `src/layouts/BaseLayout.astro`, `ContentLayout.astro`: document shell and reading layout.
- `src/components/navigation/*`: header, mobile menu, breadcrumbs.
- `src/components/home/*`: hero, field index, signal panels, recent content, projects.
- `src/components/content/*`: metadata, cards, filters, backlinks, table of contents.
- `src/components/search/SearchDialog.tsx`: Pagefind keyboard command palette.
- `src/components/skills/SkillTree.tsx`: accessible expandable skill hierarchy.
- `src/components/graph/KnowledgeGraph.tsx`: Cytoscape graph and text fallback.
- `src/components/github/*`: contribution calendar and recent activity.
- `src/pages/*`: home, indexes, dynamic content routes, skills, graph, RSS, 404.
- `src/styles/{tokens,global,content}.css`: design tokens, layout, prose styles.

### Tests

- `tests/unit/*`: schema, wiki links, index, graph, skills, GitHub normalization.
- `tests/integration/*`: content rendering, drafts, generated routes, search metadata.
- `tests/e2e/*`: navigation, command search, filters, graph, mobile, accessibility.
- `tests/e2e/helpers.ts`: GitHub Pages base-aware browser paths.

---

### Task 1: Astro foundation and executable quality gates

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/env.d.ts`
- Create: `src/config/site.ts`
- Create: `src/pages/index.astro`
- Create: `scripts/build-search.mjs`
- Test: `tests/unit/site-config.test.ts`

**Interfaces:**
- Consumes: approved site identity and default GitHub Pages URL.
- Produces: `SITE_CONFIG`, `withBase(path: string): string`, and npm scripts used by every later task.

- [ ] **Step 1: Install the pinned foundation dependencies**

Run:

```bash
npm init -y
npm pkg set name=gilgob type=module
npm pkg set private=true --json
npm install astro@7.2.4 @astrojs/preact@6.0.4 preact@10.29.8 @astrojs/mdx@7.0.7 @astrojs/sitemap@3.7.3 @astrojs/rss@4.0.19 @astrojs/markdown-remark@7.2.4 gsap cytoscape@3.34.1 pagefind@1.5.2 @pagefind/default-ui@1.5.2 gray-matter fast-glob unified remark-parse unist-util-visit js-yaml
npm install -D typescript @astrojs/check vitest@4.1.11 @playwright/test@1.62.1 @axe-core/playwright @types/cytoscape @types/js-yaml
```

Set scripts in `package.json` exactly to:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build && node scripts/build-search.mjs",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "verify": "npm run check && npm run test && npm run build"
  }
}
```

`scripts/build-search.mjs` launches the local `node_modules/.bin/pagefind` binary with `--site dist`. On non-zero exit it prints `[search] Pagefind 인덱스를 생성하지 못했습니다.`, creates `dist/pagefind/unavailable.json` containing `{"available":false}`, and exits successfully so the static pages remain deployable.

- [ ] **Step 2: Write the failing site configuration test**

```ts
// tests/unit/site-config.test.ts
import { describe, expect, it } from 'vitest';
import { SITE_CONFIG, withBase } from '../../src/config/site';

describe('site config', () => {
  it('keeps the approved Korean identity and Pages base path', () => {
    expect(SITE_CONFIG.name).toBe('gilgob');
    expect(SITE_CONFIG.author).toBe('internalforces');
    expect(SITE_CONFIG.locale).toBe('ko-KR');
    expect(withBase('/knowledge')).toBe('/gilgob/knowledge');
  });
});
```

- [ ] **Step 3: Run the test and verify the missing module failure**

Run: `npm test -- tests/unit/site-config.test.ts`

Expected: FAIL because `src/config/site.ts` does not exist.

- [ ] **Step 4: Implement the site configuration and Astro config**

```ts
// src/config/site.ts
const base = (process.env.BASE_PATH ?? '/gilgob').replace(/\/$/, '');

export const SITE_CONFIG = {
  name: 'gilgob',
  author: 'internalforces',
  locale: 'ko-KR',
  github: 'https://github.com/internalforces',
  site: process.env.SITE_URL ?? 'https://internalforces.github.io',
  base,
} as const;

export function withBase(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.base}${normalized}`.replace(/\/+/g, '/');
}
```

Configure `astro.config.mjs` with `site`, `base`, `output: 'static'`, Preact, MDX, sitemap, and the Unified processor. Extend `astro/tsconfigs/strict` in `tsconfig.json`; set Vitest to `environment: 'node'`; set Playwright `webServer.command` to `npm run preview -- --host 127.0.0.1` and `baseURL` to the base-aware preview URL.

Create a minimal `src/pages/index.astro` with `<html lang="ko"><title>gilgob</title><main><h1>gilgob</h1></main>` so every intermediate task has a buildable static route; Task 8 replaces its body with the approved homepage.

- [ ] **Step 5: Run the foundation checks**

Run: `npm test -- tests/unit/site-config.test.ts && npm run check`

Expected: the unit test passes and Astro type checking reports no errors.

- [ ] **Step 6: Commit the foundation**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts playwright.config.ts scripts/build-search.mjs src/env.d.ts src/config/site.ts src/pages/index.astro tests/unit/site-config.test.ts
git commit -m "chore: scaffold Astro knowledge garden"
```

### Task 2: Typed content collections and Obsidian Vault

**Files:**
- Create: `src/lib/content/schema.ts`
- Create: `src/content.config.ts`
- Create: `content/.obsidian/app.json`
- Create: `content/.obsidian/templates.json`
- Create: `content/templates/{knowledge,exploration,project,log}.md`
- Create: `content/knowledge/database/b-tree-index.md`
- Create: `content/explorations/llm-watermark.md`
- Create: `content/projects/signal-hub.md`
- Create: `content/logs/2026-08-20-oracle-hierarchical-query.md`
- Test: `tests/unit/content-schema.test.ts`

**Interfaces:**
- Consumes: Astro `glob()` loader and ISO frontmatter from the spec.
- Produces: `commonSchema`, four collection schemas, `ContentFrontmatter`, and typed collections named `knowledge`, `explorations`, `projects`, `logs`.

- [ ] **Step 1: Write failing schema tests**

```ts
// tests/unit/content-schema.test.ts
import { describe, expect, it } from 'vitest';
import { knowledgeSchema, projectSchema } from '../../src/lib/content/schema';

const common = {
  title: 'B-Tree는 왜 DB Index에 사용될까?',
  description: 'B-Tree 인덱스를 설명한다.',
  category: 'Database',
  tags: ['B-Tree', 'Index'],
  created: '2026-08-20',
  draft: false,
  aliases: ['B-Tree Index'],
};

describe('content schemas', () => {
  it('coerces dates and accepts knowledge status', () => {
    const value = knowledgeSchema.parse({ ...common, status: 'mastered' });
    expect(value.created).toBeInstanceOf(Date);
  });

  it('rejects a project-only status in knowledge', () => {
    expect(() => knowledgeSchema.parse({ ...common, status: 'building' })).toThrow();
  });

  it('accepts the project lifecycle', () => {
    expect(projectSchema.parse({ ...common, status: 'maintained' }).status).toBe('maintained');
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- tests/unit/content-schema.test.ts`

Expected: FAIL because `src/lib/content/schema.ts` is missing.

- [ ] **Step 3: Implement the collection schemas**

```ts
// src/lib/content/schema.ts
import { z } from 'astro/zod';

export const commonSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  created: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  aliases: z.array(z.string().min(1)).default([]),
  featured: z.boolean().default(false),
  slug: z.string().min(1).optional(),
});

export const knowledgeSchema = commonSchema.extend({
  status: z.enum(['seed', 'growing', 'mastered']),
});
export const explorationSchema = commonSchema.extend({
  status: z.enum(['active', 'paused', 'complete']),
});
export const projectSchema = commonSchema.extend({
  status: z.enum(['idea', 'building', 'maintained', 'archived']),
  repository: z.string().url().optional(),
});
export const logSchema = commonSchema;

export type ContentFrontmatter = z.infer<typeof commonSchema> & { status?: string };
```

Register each collection in `src/content.config.ts` using `glob({ pattern: '**/*.(md|mdx)', base: './content/<folder>', retainBody: true })` and its exact schema.

- [ ] **Step 4: Add Vault settings, templates, and four Korean fixtures**

Set `content/.obsidian/app.json` to:

```json
{
  "attachmentFolderPath": "attachments",
  "newFileLocation": "folder",
  "showUnsupportedFiles": true
}
```

Set `content/.obsidian/templates.json` to `{"folder":"templates","dateFormat":"YYYY-MM-DD","timeFormat":"HH:mm"}`. Each template contains all fields valid for its collection; example documents use approved categories and include links such as `[[B-Tree는 왜 DB Index에 사용될까?]]`.

- [ ] **Step 5: Verify schemas and Astro content sync**

Run: `npm test -- tests/unit/content-schema.test.ts && npx astro sync && npm run check`

Expected: all schema tests pass and Astro generates collection types without validation errors.

- [ ] **Step 6: Commit the Vault model**

```bash
git add src/lib/content/schema.ts src/content.config.ts content tests/unit/content-schema.test.ts
git commit -m "feat: add typed Obsidian content collections"
```

### Task 3: Wiki-link parser and deterministic resolver

**Files:**
- Create: `src/lib/content/types.ts`
- Create: `src/lib/content/wiki-links.ts`
- Test: `tests/unit/wiki-links.test.ts`

**Interfaces:**
- Consumes: normalized Markdown source and `ContentIndex.documents`.
- Produces: `parseWikiLinks(markdown: string): WikiLinkToken[]`, `resolveWikiLink(token: WikiLinkToken, sourceId: string, index: ContentIndex): ResolvedWikiLink`, and shared content types.

- [ ] **Step 1: Define the shared types**

```ts
// src/lib/content/types.ts
export type ContentKind = 'knowledge' | 'explorations' | 'projects' | 'logs';

export interface WikiLinkToken {
  raw: string;
  target: string;
  heading?: string;
  label: string;
  embed: boolean;
}

export interface ContentRecord {
  id: string;
  kind: ContentKind;
  slug: string;
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  aliases: string[];
  status?: string;
  created: string;
  updated: string;
  draft: boolean;
  featured: boolean;
  sourcePath: string;
  outgoing: string[];
  backlinks: string[];
  related: string[];
}

export interface GraphNode { id: string; label: string; kind: 'document' | 'category' | 'tag'; group: string; url?: string }
export interface GraphEdge { id: string; source: string; target: string; kind: 'wikilink' | 'category' | 'tag' }
export interface GraphData { nodes: GraphNode[]; edges: GraphEdge[] }
export interface ContentIndex { documents: ContentRecord[]; graph: GraphData; generatedAt: string }
export interface ResolvedWikiLink { found: boolean; href?: string; documentId?: string; label: string; heading?: string }
```

- [ ] **Step 2: Write parser and resolver tests**

```ts
// tests/unit/wiki-links.test.ts
import { describe, expect, it } from 'vitest';
import { parseWikiLinks, resolveWikiLink } from '../../src/lib/content/wiki-links';
import type { ContentIndex } from '../../src/lib/content/types';

it('parses aliases, headings, embeds, and ignores code', () => {
  const source = '[[B-Tree#왜 필요한가|인덱스]] ![[attachments/tree.png]] `[[무시]]`\n```sql\n[[무시2]]\n```';
  expect(parseWikiLinks(source).map(({ target, heading, label, embed }) => ({ target, heading, label, embed }))).toEqual([
    { target: 'B-Tree', heading: '왜 필요한가', label: '인덱스', embed: false },
    { target: 'attachments/tree.png', heading: undefined, label: 'attachments/tree.png', embed: true },
  ]);
});

it('resolves a normalized alias and preserves the heading', () => {
  const index = { documents: [{ id: 'knowledge/database/b-tree', title: 'B-Tree', aliases: ['B-Tree Index'], url: '/knowledge/database/b-tree' }], graph: { nodes: [], edges: [] }, generatedAt: '' } as ContentIndex;
  const token = parseWikiLinks('[[B-Tree Index#구조]]')[0];
  expect(resolveWikiLink(token, 'source', index)).toMatchObject({ found: true, href: '/knowledge/database/b-tree#구조' });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run: `npm test -- tests/unit/wiki-links.test.ts`

Expected: FAIL because parser and resolver exports are missing.

- [ ] **Step 4: Implement AST-based extraction and ordered resolution**

Use `unified().use(remarkParse).parse(markdown)` and visit only `text` nodes, which automatically excludes fenced and inline code. Parse `![[target#heading|label]]` with `/(!?)\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g`. Normalize targets using `value.normalize('NFC').trim()`.

Resolver order is exact relative source path, exact title, exact alias, then case-folded title or alias. Append `#${encodeURIComponent(heading)}` after resolution. Return `{ found: false, label, heading }` for unresolved targets and throw `AmbiguousWikiLinkError` when one resolution stage has multiple matches.

- [ ] **Step 5: Verify parser behavior**

Run: `npm test -- tests/unit/wiki-links.test.ts`

Expected: both tests pass, including Korean heading and ignored code cases.

- [ ] **Step 6: Commit wiki-link contracts**

```bash
git add src/lib/content/types.ts src/lib/content/wiki-links.ts tests/unit/wiki-links.test.ts
git commit -m "feat: parse and resolve Obsidian wiki links"
```

### Task 4: Content index, backlinks, related entries, and graph derivation

**Files:**
- Create: `src/lib/content/build-index.ts`
- Create: `src/lib/content/index-store.ts`
- Create: `src/integrations/content-index.ts`
- Modify: `astro.config.mjs`
- Test: `tests/unit/content-index.test.ts`
- Test fixture: `tests/fixtures/content-index/{knowledge,explorations}/`
- Test fixture: `tests/fixtures/duplicate-alias/knowledge/`

**Interfaces:**
- Consumes: `ContentRecord`, schema parsers, wiki-link parser/resolver.
- Produces: `buildContentIndex(contentRoot: string): Promise<ContentIndex>`, `writeContentIndex(index: ContentIndex, path: string): Promise<void>`, `readContentIndex(path?: string): ContentIndex`, `contentIndexIntegration(): AstroIntegration`.

- [ ] **Step 1: Write the failing derivation tests**

```ts
// tests/unit/content-index.test.ts
import { describe, expect, it } from 'vitest';
import { buildContentIndex } from '../../src/lib/content/build-index';

describe('content index', () => {
  it('builds backlinks and deduplicated relation edges', async () => {
    const index = await buildContentIndex('tests/fixtures/content-index');
    const source = index.documents.find((item) => item.title === '인덱스 탐구');
    const target = index.documents.find((item) => item.title === 'B-Tree');
    expect(source?.outgoing).toEqual([target?.id]);
    expect(target?.backlinks).toEqual([source?.id]);
    expect(index.graph.edges.filter((edge) => edge.kind === 'wikilink')).toHaveLength(1);
  });

  it('fails on duplicate aliases', async () => {
    await expect(buildContentIndex('tests/fixtures/duplicate-alias')).rejects.toThrow('중복 별칭');
  });
});
```

- [ ] **Step 2: Run tests and verify missing implementation**

Run: `npm test -- tests/unit/content-index.test.ts`

Expected: FAIL because `build-index.ts` does not exist.

- [ ] **Step 3: Implement index generation**

Scan `**/*.{md,mdx}` under the four content folders with `fast-glob`, parse frontmatter using `gray-matter`, validate using the matching schema, and normalize dates to `YYYY-MM-DD`. Use the explicit `slug` or the POSIX relative file path without extension. Build document URLs from the collection kind and slug.

For each document:

1. Parse and resolve outgoing non-embed links.
2. Add reverse backlinks.
3. Score related documents as `4 * explicitLink + 2 * sharedCategory + sharedTagCount`.
4. Keep the highest five positive related scores, breaking ties by title.
5. Emit one document node, one category node, and unique tag nodes.
6. Deduplicate edges using `${kind}:${source}:${target}`.

Validate duplicate slug, title, and alias before relation calculation. Unresolved links use `console.warn('[content] 해결되지 않은 링크: ...')` and remain outside outgoing edges.

For every embed token beginning with `attachments/`, resolve the file below `content/`; print `[content] 누락된 첨부: <path>` when absent and continue the build.

- [ ] **Step 4: Implement the store and Astro integration**

`writeContentIndex` writes atomically through `.cache/content-index.tmp.json` then renames it. `readContentIndex` throws a Korean instruction to restart the build if the cache is absent. The Astro integration runs generation in a Vite `buildStart` hook and listens for `add`, `change`, and `unlink` events under `content/` during development, debouncing regeneration by 80ms and invalidating the module graph.

Register `contentIndexIntegration()` before Preact/MDX in `astro.config.mjs`.

- [ ] **Step 5: Run unit and content build checks**

Run: `npm test -- tests/unit/content-index.test.ts && npm run check`

Expected: backlinks, duplicate validation, and type checking pass.

- [ ] **Step 6: Commit derived content data**

```bash
git add src/lib/content src/integrations/content-index.ts astro.config.mjs tests/unit/content-index.test.ts tests/fixtures
git commit -m "feat: derive backlinks and knowledge graph"
```

### Task 5: Obsidian Markdown rendering

**Files:**
- Create: `src/lib/markdown/remark-obsidian.ts`
- Create: `src/styles/content.css`
- Modify: `astro.config.mjs`
- Test: `tests/unit/remark-obsidian.test.ts`

**Interfaces:**
- Consumes: `readContentIndex`, wiki token parser, base-path helper.
- Produces: `remarkObsidian(options: { index?: ContentIndex; indexPath?: string; base: string }): Plugin` that transforms wiki links, embeds, and callouts. Exactly one of `index` or `indexPath` is required.

- [ ] **Step 1: Write the failing Markdown transformation test**

```ts
// tests/unit/remark-obsidian.test.ts
import { expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { remarkObsidian } from '../../src/lib/markdown/remark-obsidian';

it('turns resolved and unresolved wiki links into semantic nodes', async () => {
  const tree = unified().use(remarkParse).use(remarkObsidian, {
    index: { documents: [{ id: 'knowledge/b-tree', title: 'B-Tree', aliases: [], url: '/knowledge/b-tree' }], graph: { nodes: [], edges: [] }, generatedAt: '' },
    base: '/repo',
  }).parse('[[B-Tree]] [[없는 글]]');
  const transformed = await unified().use(remarkParse).use(remarkObsidian, {
    index: { documents: [{ id: 'knowledge/b-tree', title: 'B-Tree', aliases: [], url: '/knowledge/b-tree' }], graph: { nodes: [], edges: [] }, generatedAt: '' },
    base: '/repo',
  }).run(tree);
  expect(JSON.stringify(transformed)).toContain('/repo/knowledge/b-tree');
  expect(JSON.stringify(transformed)).toContain('wiki-link--missing');
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- tests/unit/remark-obsidian.test.ts`

Expected: FAIL because the remark plugin is missing.

- [ ] **Step 3: Implement text-node replacement, embeds, and callouts**

Visit `text` nodes and split only the matched wiki-link ranges. Resolved links become mdast `link` nodes with a `data.hProperties.className` of `wiki-link`; unresolved links become `span` nodes with `wiki-link wiki-link--missing` and `aria-label="아직 작성되지 않은 문서"`. Image embeds become `image` nodes only when the target begins with `attachments/`; their URL is `${base}/content-assets/<encoded path>`.

Transform blockquotes whose first paragraph begins with `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`, or `[!CAUTION]` into `<aside>` semantics with Korean labels `노트`, `팁`, `경고`, `중요`, `주의`. Add focused prose CSS for links, callouts, tables, code, figures, and missing links.

- [ ] **Step 4: Register Unified Markdown and attachment copying**

Configure `unified({ remarkPlugins: [[remarkObsidian, { indexPath: '.cache/content-index.json', base: SITE_CONFIG.base }]] })`. Extend the content integration to copy `content/attachments/` to `dist/<base>/content-assets/` in `astro:build:done`, preserving subdirectories.

- [ ] **Step 5: Verify the renderer**

Run: `npm test -- tests/unit/remark-obsidian.test.ts && npm run build`

Expected: transformed links are present, the sample documents build, and Pagefind completes.

- [ ] **Step 6: Commit Markdown support**

```bash
git add src/lib/markdown src/styles/content.css src/integrations/content-index.ts astro.config.mjs tests/unit/remark-obsidian.test.ts
git commit -m "feat: render Obsidian Markdown syntax"
```

### Task 6: Base visual system, navigation, and responsive shell

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/navigation/SiteHeader.astro`
- Create: `src/components/navigation/MobileMenu.tsx`
- Create: `src/components/navigation/SiteFooter.astro`
- Create: `src/pages/404.astro`
- Test: `tests/integration/base-layout.test.ts`

**Interfaces:**
- Consumes: `SITE_CONFIG`, `withBase`, approved Korean labels.
- Produces: `BaseLayout` props `{ title: string; description: string; image?: string; noindex?: boolean }` and global class contracts used by all pages.

- [ ] **Step 1: Write the failing shell test**

```ts
// tests/integration/base-layout.test.ts
import { expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';

test('base layout exposes Korean navigation and accessibility hooks', async () => {
  const source = await readFile('src/layouts/BaseLayout.astro', 'utf8');
  expect(source).toContain('lang="ko"');
  expect(source).toContain('본문 바로가기');
  expect(source).toContain('prefers-reduced-motion');
  expect(source).toContain('gilgob');
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- tests/integration/base-layout.test.ts`

Expected: FAIL because the layout does not exist.

- [ ] **Step 3: Implement tokens and the base layout**

Define these required tokens:

```css
:root {
  --canvas: #f6f8fb;
  --surface: #ffffff;
  --ink: #0d1b36;
  --muted: #65708a;
  --line: #dce3ec;
  --primary: #1d63ff;
  --signal: #37c998;
  --danger: #c43d4b;
  --radius: 12px;
  --content-max: 1280px;
  --reading-max: 760px;
}
```

`BaseLayout` sets canonical and Open Graph metadata, imports all global styles, includes a visible-on-focus skip link, header, `<main id="main-content">`, and footer. Use a wide two-line maximum hero class, a 12-column grid above 960px, and one-column mobile flow below 720px. Add reduced-motion CSS that sets animation duration to `0.01ms` and disables smooth scrolling.

- [ ] **Step 4: Implement navigation behavior**

Desktop links are `홈`, `지식`, `탐구`, `프로젝트`, `학습 기록`, `스킬 트리`, `지식 그래프`. `MobileMenu.tsx` uses a real button with `aria-expanded`, closes on Escape and route selection, and restores focus to the trigger. Header includes GitHub and search buttons with Korean accessible labels.

- [ ] **Step 5: Verify shell and build**

Run: `npm test -- tests/integration/base-layout.test.ts && npm run check`

Expected: shell test and Astro type check pass.

- [ ] **Step 6: Commit the visual foundation**

```bash
git add src/styles src/layouts/BaseLayout.astro src/components/navigation src/pages/404.astro tests/integration/base-layout.test.ts
git commit -m "feat: add responsive gilgob site shell"
```

### Task 7: Content queries, indexes, filters, and article routes

**Files:**
- Create: `src/lib/content/queries.ts`
- Create: `src/components/content/ContentCard.astro`
- Create: `src/components/content/ContentFilters.tsx`
- Create: `src/components/content/Backlinks.astro`
- Create: `src/layouts/ContentLayout.astro`
- Create: `src/pages/{knowledge,explorations,projects,logs}/index.astro`
- Create: `src/pages/{knowledge,explorations,projects,logs}/[...slug].astro`
- Test: `tests/unit/content-queries.test.ts`
- Test: `tests/integration/content-routes.test.ts`

**Interfaces:**
- Consumes: four Astro collections and `ContentIndex`.
- Produces: `getPublicEntries(kind?: ContentKind): Promise<NormalizedEntry[]>`, `getEntryRelations(id: string): { backlinks: ContentRecord[]; related: ContentRecord[] }`, and static route pages.

- [ ] **Step 1: Write query tests**

```ts
// tests/unit/content-queries.test.ts
import { expect, it } from 'vitest';
import { filterAndSortEntries } from '../../src/lib/content/queries';

it('removes drafts in production and sorts by updated date', () => {
  const rows = [
    { id: 'a', data: { draft: false, created: new Date('2026-08-01'), updated: new Date('2026-08-20') } },
    { id: 'b', data: { draft: true, created: new Date('2026-08-21') } },
    { id: 'c', data: { draft: false, created: new Date('2026-08-10') } },
  ];
  expect(filterAndSortEntries(rows, true).map((row) => row.id)).toEqual(['a', 'c']);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- tests/unit/content-queries.test.ts`

Expected: FAIL because query helpers are missing.

- [ ] **Step 3: Implement content queries and static routes**

`filterAndSortEntries(entries, production)` excludes drafts when `production` is true and sorts by `updated ?? created` descending, then title ascending. Dynamic route `getStaticPaths()` returns `{ params: { slug }, props: { entry } }`; render entries with Astro `render(entry)` and use `ContentLayout`.

Define `NormalizedEntry` in `queries.ts` as `{ id: string; kind: ContentKind; slug: string; url: string; data: ContentFrontmatter; body: string }` so cards, filters, home statistics, and search metadata share one interface.

`ContentLayout` contains Korean type/status labels, creation/update dates, reading body, desktop table of contents, backlinks, related entries, and `다음 탐구 질문` when frontmatter supplies `nextQuestions: string[]`. Update the schemas to make `nextQuestions` an optional common field.

- [ ] **Step 4: Implement shareable filters**

`ContentFilters.tsx` receives serialized entries and initial `URLSearchParams`, filters by type/category/tag/status, updates the query string with `history.replaceState`, and announces result count through `aria-live="polite"`. The page always renders the complete static list first; the island enhances it after hydration.

- [ ] **Step 5: Verify routes, drafts, and filters**

Run: `npm test -- tests/unit/content-queries.test.ts tests/integration/content-routes.test.ts && npm run build`

Expected: public routes exist, draft fixture is absent from `dist`, and query metadata is rendered.

- [ ] **Step 6: Commit content browsing**

```bash
git add src/lib/content/queries.ts src/lib/content/schema.ts src/components/content src/layouts/ContentLayout.astro src/pages/knowledge src/pages/explorations src/pages/projects src/pages/logs tests
git commit -m "feat: add content indexes and reading pages"
```

### Task 8: Homepage and knowledge-growth signals

**Files:**
- Create: `src/lib/content/stats.ts`
- Create: `src/components/home/{Hero,FieldIndex,SignalPanel,RecentLearning,FeaturedProjects}.astro`
- Create: `src/scripts/home-motion.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/unit/content-stats.test.ts`

**Interfaces:**
- Consumes: public normalized entries, `skills.yaml` aggregate from Task 10 when present.
- Produces: `calculateContentStats(entries): ContentStats` and the complete C+B homepage.

- [ ] **Step 1: Write statistics tests**

```ts
// tests/unit/content-stats.test.ts
import { expect, it } from 'vitest';
import { calculateContentStats } from '../../src/lib/content/stats';

it('counts documents, connections, categories, and active explorations', () => {
  const stats = calculateContentStats([
    { kind: 'knowledge', category: 'Database', outgoing: ['b'] },
    { kind: 'explorations', category: 'AI', status: 'active', outgoing: [] },
  ]);
  expect(stats).toMatchObject({ documents: 2, connections: 1, categories: 2, activeExplorations: 1 });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- tests/unit/content-stats.test.ts`

Expected: FAIL because the statistics module is missing.

- [ ] **Step 3: Implement the approved homepage structure**

Render in this order: header, two-line hero `지식을 연결하고, 배움을 축적합니다.`, full-width search trigger, field index, three-column signal panel, recent learning, featured projects, GitHub activity slot, and high-contrast footer action. Use real Korean sample content and never render numeric placeholder values.

The signal panel columns are `현재 탐구 중`, `스킬 신호`, `지식 성장`. `지식 성장` shows document count, connection count, and a subtle CSS radar field; it does not imply a percentage increase until at least two dated months exist.

- [ ] **Step 4: Add restrained GSAP motion**

`home-motion.ts` imports `gsap` and `ScrollTrigger`, skips all setup when `matchMedia('(prefers-reduced-motion: reduce)').matches`, reveals hero/search once, and animates visible progress bars from zero to their semantic `aria-valuenow`. Kill every ScrollTrigger during `astro:before-swap` to avoid duplicate handlers.

- [ ] **Step 5: Verify homepage data and static output**

Run: `npm test -- tests/unit/content-stats.test.ts && npm run build`

Expected: stats test passes and `dist/index.html` includes all Korean section titles and real counts.

- [ ] **Step 6: Commit the homepage**

```bash
git add src/lib/content/stats.ts src/components/home src/scripts/home-motion.ts src/pages/index.astro tests/unit/content-stats.test.ts
git commit -m "feat: build gilgob knowledge dashboard"
```

### Task 9: Korean Pagefind command search

**Files:**
- Create: `src/components/search/SearchDialog.tsx`
- Create: `src/components/search/SearchTrigger.astro`
- Create: `src/lib/search/pagefind.ts`
- Modify: content route templates with Pagefind metadata.
- Test: `tests/unit/search-controller.test.ts`
- Test: `tests/e2e/search.spec.ts`

**Interfaces:**
- Consumes: Pagefind browser API under `${SITE_CONFIG.base}/pagefind/pagefind.js`.
- Produces: `createSearchController(loader): SearchController`, command dialog opened by `Ctrl/Command + K`, and indexed result metadata.

- [ ] **Step 1: Write the controller test**

```ts
// tests/unit/search-controller.test.ts
import { expect, it, vi } from 'vitest';
import { createSearchController } from '../../src/lib/search/pagefind';

it('loads Pagefind once and suppresses stale query results', async () => {
  const search = vi.fn(async (term: string) => ({ results: [{ id: term }] }));
  const loader = vi.fn(async () => ({ search }));
  const controller = createSearchController(loader);
  await Promise.all([controller.query('데이터'), controller.query('데이터베이스')]);
  expect(loader).toHaveBeenCalledTimes(1);
  expect(controller.currentQuery()).toBe('데이터베이스');
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- tests/unit/search-controller.test.ts`

Expected: FAIL because the search controller is missing.

- [ ] **Step 3: Implement lazy search and Korean IME behavior**

The controller memoizes the Pagefind module promise, increments a request sequence for each query, and ignores responses whose sequence is not current. `SearchDialog.tsx` does not search while `compositionstart` is active, waits 120ms after `compositionend` or normal input, and exposes loading, empty, and error states in Korean.

Define `SearchModule` as `{ search(query: string): Promise<{ results: Array<{ id: string; data(): Promise<PagefindResult> }> }> }` and `SearchController` as `{ query(value: string): Promise<PagefindResult[]>; currentQuery(): string }`. Before dynamic import, fetch `pagefind/unavailable.json`; treat HTTP 200 as a Korean unavailable state instead of throwing.

Keyboard contract: `Ctrl/Command + K` opens, ArrowUp/ArrowDown moves selection, Enter navigates, Escape closes and restores trigger focus. Results display title, description excerpt, type, and category.

- [ ] **Step 4: Add Pagefind indexing metadata**

Mark the article root with `data-pagefind-body`; emit `data-pagefind-meta="title"`, `type`, `category`, and comma-separated tags. Add `data-pagefind-ignore` to global navigation, filters, backlinks, related items, and footer. Set `<html lang="ko">` so Pagefind applies Korean-aware indexing.

- [ ] **Step 5: Verify unit and browser search**

Run: `npm run build && npm test -- tests/unit/search-controller.test.ts && npx playwright test tests/e2e/search.spec.ts`

Expected: Pagefind directory exists, Korean query finds the B-Tree document, and the keyboard focus cycle passes.

- [ ] **Step 6: Commit search**

```bash
git add src/components/search src/lib/search src/layouts src/pages tests/unit/search-controller.test.ts tests/e2e/search.spec.ts
git commit -m "feat: add Korean command search"
```

### Task 10: Skill tree and explicit progress model

**Files:**
- Create: `content/data/skills.yaml`
- Create: `src/lib/skills/schema.ts`
- Create: `src/lib/skills/load-skills.ts`
- Create: `src/components/skills/SkillTree.tsx`
- Create: `src/pages/skills.astro`
- Test: `tests/unit/skills.test.ts`

**Interfaces:**
- Consumes: `ContentIndex.documents` and YAML nodes.
- Produces: `loadSkills(path: string, index: ContentIndex): Promise<SkillTreeData>` and status counts `{ mastered, learning, planned, percent }`.

- [ ] **Step 1: Write validation and progress tests**

```ts
// tests/unit/skills.test.ts
import { expect, it } from 'vitest';
import { calculateSkillProgress, validateSkillLinks } from '../../src/lib/skills/load-skills';

it('calculates progress from explicit status, not article count', () => {
  const result = calculateSkillProgress([
    { id: 'dfs', status: 'mastered' },
    { id: 'dp', status: 'learning' },
    { id: 'graph', status: 'planned' },
  ]);
  expect(result).toEqual({ mastered: 1, learning: 1, planned: 1, percent: 50 });
});

it('rejects a missing related document', () => {
  expect(() => validateSkillLinks([{ id: 'dfs', related: ['knowledge/missing'] }], [])).toThrow('존재하지 않는 관련 문서');
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- tests/unit/skills.test.ts`

Expected: FAIL because skill helpers are missing.

- [ ] **Step 3: Implement YAML schema and aggregate rules**

YAML root has `fields[]`; each field has `id`, `label`, `children[]`; leaf nodes have `id`, `label`, `status: mastered|learning|planned`, and `related: string[]`. Percent uses weights mastered `1`, learning `0.5`, planned `0`, rounded to the nearest integer. Throw with the exact field and skill IDs for unknown document references.

Define `SkillTreeData` as `{ fields: SkillField[]; progress: SkillProgress }`, `SkillProgress` as `{ mastered: number; learning: number; planned: number; percent: number }`, and recursive `SkillField`/`SkillNode` Zod schemas in `src/lib/skills/schema.ts`.

- [ ] **Step 4: Build the accessible tree UI**

Use nested lists as the source semantics. Field disclosure buttons expose `aria-expanded`; status labels are `습득`, `학습 중`, `예정`; each related entry is a normal anchor. Progress bars include `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-valuenow`. The page summary shows overall and field-level progress.

- [ ] **Step 5: Verify skill links and page build**

Run: `npm test -- tests/unit/skills.test.ts && npm run build`

Expected: explicit status calculation passes and every related slug resolves.

- [ ] **Step 6: Commit skills**

```bash
git add content/data/skills.yaml src/lib/skills src/components/skills src/pages/skills.astro tests/unit/skills.test.ts
git commit -m "feat: add linked skill tree"
```

### Task 11: Interactive knowledge graph with text fallback

**Files:**
- Create: `src/lib/graph/filter.ts`
- Create: `src/components/graph/KnowledgeGraph.tsx`
- Create: `src/components/graph/GraphFallback.astro`
- Create: `src/pages/graph.astro`
- Test: `tests/unit/graph-filter.test.ts`
- Test: `tests/e2e/graph.spec.ts`

**Interfaces:**
- Consumes: `ContentIndex.graph`.
- Produces: `filterGraph(graph: GraphData, filter: GraphFilter): GraphData`, Cytoscape visualization, and equivalent nested link list.

- [ ] **Step 1: Write deterministic graph filter tests**

```ts
// tests/unit/graph-filter.test.ts
import { expect, it } from 'vitest';
import { filterGraph } from '../../src/lib/graph/filter';
import type { GraphData } from '../../src/lib/content/types';

it('keeps matching documents and their directly connected taxonomy nodes', () => {
  const graph: GraphData = {
    nodes: [
      { id: 'doc:a', label: 'A', kind: 'document', group: 'AI' },
      { id: 'doc:b', label: 'B', kind: 'document', group: 'Database' },
      { id: 'category:ai', label: 'AI', kind: 'category', group: 'AI' },
    ],
    edges: [{ id: 'category:doc:a:category:ai', source: 'doc:a', target: 'category:ai', kind: 'category' }],
  };
  expect(filterGraph(graph, { categories: ['AI'], kinds: [], tags: [] }).nodes.map((node) => node.id)).toEqual(['doc:a', 'category:ai']);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- tests/unit/graph-filter.test.ts`

Expected: FAIL because graph filtering is missing.

- [ ] **Step 3: Implement graph filtering and Cytoscape lifecycle**

Filter document nodes first, include only taxonomy nodes connected to retained documents, then include edges whose endpoints both remain. Sort nodes and edges by ID for stable snapshots.

Export `GraphFilter` as `{ categories: string[]; kinds: ContentKind[]; tags: string[] }`; empty arrays mean no restriction for that facet.

`KnowledgeGraph.tsx` dynamically imports Cytoscape on mount, uses document/category/tag visual classes, and destroys the instance on unmount. Clicking a node updates an adjacent details panel; Enter on a focused item performs the same action. Disable animation under reduced motion. At widths below 720px, initialize an ego graph around the first or selected document instead of all nodes.

- [ ] **Step 4: Add filters and semantic fallback**

Filters include 분야, 글 유형, 태그 and expose active counts. `GraphFallback.astro` renders every document heading followed by its outgoing and incoming normal links. Keep the fallback visible to assistive technology and available inside a `그래프 대신 목록 보기` disclosure.

- [ ] **Step 5: Verify graph behavior**

Run: `npm test -- tests/unit/graph-filter.test.ts && npm run build && npx playwright test tests/e2e/graph.spec.ts`

Expected: filter results are deterministic, the canvas mounts only on `/graph`, node selection updates the details panel, and fallback links work.

- [ ] **Step 6: Commit graph exploration**

```bash
git add src/lib/graph src/components/graph src/pages/graph.astro tests/unit/graph-filter.test.ts tests/e2e/graph.spec.ts
git commit -m "feat: add accessible knowledge graph"
```

### Task 12: GitHub contribution and activity statistics

**Files:**
- Create: `src/lib/github/types.ts`
- Create: `src/lib/github/fetch-github.ts`
- Create: `src/lib/github/cache.ts`
- Create: `src/components/github/ContributionCalendar.astro`
- Create: `src/components/github/RecentActivity.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/unit/github-stats.test.ts`
- Fixture: `tests/fixtures/github/{graphql,events}.json`

**Interfaces:**
- Consumes: `GITHUB_TOKEN`, fixed username `internalforces`, `.cache/github-stats.json`.
- Produces: `getGitHubStats(options): Promise<GitHubStats | null>` with contribution weeks, total contributions, recent public events, `fetchedAt`, and `stale`.

- [ ] **Step 1: Write normalization and fallback tests**

```ts
// tests/unit/github-stats.test.ts
import { expect, it, vi } from 'vitest';
import { getGitHubStats } from '../../src/lib/github/fetch-github';

it('uses a stale cache when GraphQL fails', async () => {
  const cached = { total: 42, weeks: [], events: [], fetchedAt: '2026-08-19T00:00:00.000Z', stale: false };
  const result = await getGitHubStats({
    username: 'internalforces',
    token: 'test',
    request: vi.fn().mockRejectedValue(new Error('rate limit')),
    readCache: vi.fn().mockResolvedValue(cached),
    writeCache: vi.fn(),
  });
  expect(result).toMatchObject({ total: 42, stale: true });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- tests/unit/github-stats.test.ts`

Expected: FAIL because the GitHub module is missing.

- [ ] **Step 3: Implement build-time requests and cache fallback**

POST to `https://api.github.com/graphql` with a query for `user(login: $login) { contributionsCollection(from: $from, to: $to) { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount color } } } } }`. Fetch `GET /users/internalforces/events/public?per_page=30` with the same bearer token and GitHub API version header.

Normalize only PushEvent, PullRequestEvent, IssuesEvent, CreateEvent, and ReleaseEvent into Korean action labels. On request failure, return cached data with `stale: true`; when no cache exists return `null` and log one warning without exposing the token.

Define `GitHubStats` in `types.ts` as `{ total: number; weeks: ContributionWeek[]; events: GitHubActivity[]; fetchedAt: string; stale: boolean }`; each day contains ISO `date`, numeric `count`, and API `color`, while each activity contains `id`, `repository`, `label`, `url`, and `createdAt`.

- [ ] **Step 4: Render accessible activity components**

The contribution calendar uses CSS grid cells with `aria-label="2026년 8월 20일, 기여 3회"`, month labels, a total summary, and a screen-reader table. Recent activity shows repository, Korean action, and relative date without claiming completeness. A stale cache displays `마지막으로 확인된 활동` and the fetch date. `null` renders `GitHub 통계를 불러오지 못했습니다.`.

- [ ] **Step 5: Verify API fixtures and no-token build**

Run: `npm test -- tests/unit/github-stats.test.ts && GITHUB_TOKEN= npm run build`

Expected: fixture normalization and stale fallback pass; no-token build completes with the empty state.

- [ ] **Step 6: Commit GitHub statistics**

```bash
git add src/lib/github src/components/github src/pages/index.astro tests/unit/github-stats.test.ts tests/fixtures/github
git commit -m "feat: add resilient GitHub activity stats"
```

### Task 13: SEO, GitHub Pages deployment, accessibility, and final verification

**Files:**
- Create: `src/pages/rss.xml.ts`
- Create: `src/pages/robots.txt.ts`
- Create: `public/favicon.svg`
- Create: `public/og-default.svg`
- Create: `.github/workflows/deploy.yml`
- Create: `tests/e2e/navigation.spec.ts`
- Create: `tests/e2e/mobile.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/helpers.ts`
- Create: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: all public content pages, npm verification scripts, GitHub token and Pages artifact APIs.
- Produces: deployable Pages artifact, RSS, sitemap, robots policy, accessibility test report, and authoring documentation.

- [ ] **Step 1: Write final browser acceptance tests**

```ts
// tests/e2e/accessibility.spec.ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { pagePath } from './helpers';

for (const path of ['/', '/knowledge/', '/skills/', '/graph/']) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(pagePath(path));
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  });
}
```

`tests/e2e/helpers.ts` exports `pagePath(path: string)` and prefixes `/gilgob` unless `BASE_PATH` is explicitly set. All E2E specifications use this helper rather than root-absolute paths.

Navigation tests assert every Korean global link, skip-link focus, active location, and a custom 404. Mobile tests use a 390×844 viewport and assert menu focus restoration, collapsed table of contents, horizontal-overflow absence, and graph list fallback.

- [ ] **Step 2: Run acceptance tests and record current failures**

Run: `npm run build && npx playwright test tests/e2e/navigation.spec.ts tests/e2e/mobile.spec.ts tests/e2e/accessibility.spec.ts`

Expected: tests expose any missing SEO routes, mobile behavior, or accessibility labels before the final implementation.

- [ ] **Step 3: Add feeds, crawl metadata, and default brand assets**

`rss.xml.ts` combines all public collections and sorts by update date. `robots.txt.ts` points to the base-aware sitemap. `favicon.svg` is a simple lowercase `g` wordmark using the primary blue; `og-default.svg` contains `gilgob`, `internalforces`, and `지식을 연결하고, 배움을 축적합니다.` with no raster dependency.

- [ ] **Step 4: Add the GitHub Pages workflow**

Workflow triggers on `push` to `main`, `workflow_dispatch`, and cron `17 18 * * *` (03:17 KST). Grant `contents: read`, `pages: write`, `id-token: write`. Use Node 22, `npm ci`, `npm run verify`, Playwright browser installation, E2E tests, `withastro/action@v6.1.2`, and `actions/deploy-pages@v4`. Pass `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`, `SITE_URL: https://internalforces.github.io`, and `BASE_PATH: /gilgob` only to build steps. Restore/save `.cache/github-stats.json` with `actions/cache` and a date-based key plus `github-stats-` restore prefix.

- [ ] **Step 5: Document the author workflow**

README sections are: 로컬 실행, Obsidian에서 `content/` 열기, 네 글 템플릿, frontmatter 표, 위키링크와 첨부 규칙, 초안 게시, 테스트, GitHub Pages 설정, 커스텀 도메인 전환. Include exact commands `npm ci`, `npm run dev`, `npm run verify`, and the GitHub Pages source setting `GitHub Actions`.

- [ ] **Step 6: Run the complete verification suite**

Run:

```bash
npm run verify
npx playwright install chromium
npm run test:e2e
git status --short
```

Expected: type checking, all unit/integration tests, Astro build, Pagefind indexing, and all browser tests pass; Git status contains only intentional final files.

- [ ] **Step 7: Commit the release-ready site**

```bash
git add .github README.md public src/pages/rss.xml.ts src/pages/robots.txt.ts tests/e2e .gitignore
git commit -m "feat: prepare gilgob for GitHub Pages"
```

- [ ] **Step 8: Review the finished branch**

Run:

```bash
git log --oneline --decorate -15
git diff main~13..main --stat
npm run verify
npm run test:e2e
```

Expected: thirteen focused implementation commits after the design and plan commits, no skipped verification, and a release-ready static site.
