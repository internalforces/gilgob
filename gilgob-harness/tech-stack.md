<!--
Purpose:        Current technology choices, architecture pattern, and environment contracts
Owner:          Architect
Update Trigger: Runtime, framework, architecture, hosting, or environment contract changes
Harness Version: 1.1
-->

# gilgob Technology Stack

_Last updated: 2026-08-21_

## Stack Overview

| Layer | Technology | Current contract | Purpose |
|---|---|---|---|
| Runtime | Node.js | 22 in README and CI | Build, tests, and tooling |
| Language | TypeScript | `^6.0.3` development dependency | Strict application and test code |
| Static framework | Astro | `^7.2.4` | Content collections, layouts, routes, and static output |
| Interactive islands | Preact | `^10.29.8` | Search, filters, navigation, graph, and skill-tree interaction |
| Content | Markdown and MDX | Astro content collections | Knowledge Garden documents |
| Validation | Astro Zod | bundled through Astro | Frontmatter and structured-data schemas |
| Unit/integration tests | Vitest | `^4.1.11` | Logic and static integration tests |
| Browser tests | Playwright | `^1.62.1` | Routes, accessibility, search, graph, and responsive behavior |
| Search | Pagefind | `^1.5.2` | Static full-text search indexing and UI |
| Graph | Cytoscape | `^3.34.1` | Knowledge graph visualization |
| Motion | GSAP | `^3.15.0` | Client-side motion |
| Package manager | npm | lockfile committed | Reproducible installation and scripts |
| CI/CD | GitHub Actions | `.github/workflows/deploy.yml` | Verification, build, browser tests, and Pages deployment |
| Hosting | GitHub Pages | `/gilgob` base path | Public static site |

Exact direct dependency ranges are maintained in `package.json` and summarized in `gilgob-harness/dependencies.md`.

## Architecture Pattern

gilgob is a static, file-backed content site with selective client islands.

```text
content/**/*.md(x)
  -> Astro collection loaders and Zod schemas
  -> custom content index
     -> unique titles, aliases, and slugs
     -> wiki-links, backlinks, related entries, and graph data
     -> attachment checks
  -> Astro pages and layouts
  -> static HTML and assets
  -> Pagefind index
  -> GitHub Pages
```

There is no application database, API server, CMS, or documented staging environment.

## Key Boundaries

- `content/` is the authored source and an Obsidian Vault.
- `src/lib/content/` owns content contracts, indexing, query behavior, and wiki-link semantics.
- `src/layouts/` and `src/pages/` own rendered routes and metadata.
- `.cache/content-index.json` is generated state used by the build and development integration.
- `dist/` is generated static output.
- Preact islands add interaction without moving content ownership into the browser.

## Environments

| Environment | Purpose | Contract |
|---|---|---|
| Local development | Authoring and iteration, including drafts | `npm run dev` |
| Local production-equivalent | Static validation with public URL behavior | `SITE_URL=https://internalforces.github.io BASE_PATH=/gilgob` |
| CI | Reproducible verify, build, and browser acceptance | Node.js 22 on GitHub Actions |
| Production | Public static Knowledge Garden | `https://internalforces.github.io/gilgob/` |

## Change Policy

- New runtime or external service: user approval and ADR required.
- Major dependency upgrade: user approval, dependency review, and full quality gate required.
- Domain or base-path change: user approval plus canonical URL, Open Graph, RSS, robots, sitemap, link, asset, and browser validation.
- Content schema change: architecture review, migration impact analysis, tests, and authoring-guide updates.
