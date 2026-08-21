<!--
Purpose:        Human-readable map of direct dependencies and external services
Owner:          Architect and Implementer
Update Trigger: A direct dependency or external service is added, removed, or materially changed
Harness Version: 1.1
-->

# gilgob Dependencies

_Last updated: 2026-08-21_

`package.json` and `package-lock.json` are authoritative for package names, versions, and transitive dependencies. This file explains why direct dependencies exist.

## Runtime Dependencies

| Package | Declared range | Purpose |
|---|---:|---|
| `astro` | `^7.2.4` | Static site framework and content collections |
| `@astrojs/markdown-remark` | `^7.2.4` | Markdown processing integration |
| `@astrojs/mdx` | `^7.0.7` | MDX content support |
| `@astrojs/preact` | `^6.0.4` | Preact islands in Astro |
| `@astrojs/rss` | `^4.0.19` | RSS generation |
| `@astrojs/sitemap` | `^3.7.3` | Sitemap generation with portfolio filtering |
| `preact` | `^10.29.8` | Interactive UI islands |
| `@fontsource-variable/geist` | `^5.3.0` | Self-hosted variable font assets |
| `@pagefind/default-ui` | `^1.5.2` | Static search interface |
| `pagefind` | `^1.5.2` | Static search indexing |
| `cytoscape` | `^3.34.1` | Knowledge graph rendering |
| `gsap` | `^3.15.0` | Motion and animation |
| `fast-glob` | `^3.3.3` | Content file discovery |
| `gray-matter` | `^4.0.3` | Markdown frontmatter parsing |
| `js-yaml` | `^5.3.0` | YAML data parsing |
| `remark-parse` | `^11.0.0` | Markdown syntax tree parsing |
| `unified` | `^11.0.5` | Markdown processor pipeline |
| `unist-util-visit` | `^5.1.0` | Markdown syntax tree traversal |

## Development Dependencies

| Package | Declared range | Purpose |
|---|---:|---|
| `@astrojs/check` | `^0.9.10` | Astro and TypeScript checking |
| `typescript` | `^6.0.3` | Static typing and compiler services |
| `vitest` | `^4.1.11` | Unit and integration testing |
| `@playwright/test` | `^1.62.1` | Browser acceptance testing |
| `@axe-core/playwright` | `^4.13.0` | Automated accessibility assertions |
| `@types/cytoscape` | `^3.21.9` | Cytoscape TypeScript declarations |
| `@types/js-yaml` | `^4.0.9` | js-yaml TypeScript declarations |

## External Services

| Service | Purpose | Data or authentication |
|---|---|---|
| GitHub API | Public contribution and recent-activity data during builds | Build-time `GITHUB_TOKEN`; cached in `.cache/github-stats.json` |
| GitHub Actions | Verification, build, browser tests, cache, and deployment | Repository-scoped workflow permissions |
| GitHub Pages | Static hosting | Deployment identity token from GitHub Actions |

The browser bundle must not contain `GITHUB_TOKEN`. API failures use cached or safe empty state as implemented in `src/lib/github/`.

## Change Policy

- New dependency: explicit user approval before installation or manifest changes.
- Major upgrade: explicit user approval, review of compatibility and security impact, and full verification.
- Minor or patch update: scoped request, package-lock review, and proportional tests.
- Removal: search all runtime, test, build, and documentation usage before changing manifests.
- Security remediation: report evidence and impact, obtain approval for the mutation, then verify the affected surface and full build.
