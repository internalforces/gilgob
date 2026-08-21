<!--
Purpose:        Durable system structure, data flow, component boundaries, and architecture constraints
Owner:          Architect
Update Trigger: A component boundary, data flow, runtime contract, or deployment architecture changes
Harness Version: 1.1
-->

# Architecture: gilgob

_Last updated: 2026-08-21_

## System Overview

gilgob is a static, file-backed Knowledge Garden. Markdown and MDX documents are validated, indexed, linked, rendered, and search-indexed at build time. Preact islands provide targeted interactivity without becoming the source of content state.

## Primary Data Flow

```text
Author in Obsidian or editor
  -> content/ Markdown or MDX
  -> Astro glob collection loaders
  -> Zod frontmatter schemas
  -> custom content-index integration
     -> unique title, alias, and slug validation
     -> wiki-link and attachment parsing
     -> backlinks, related entries, and graph derivation
     -> .cache/content-index.json
  -> Astro pages and layouts
  -> dist/ static routes and content-assets
  -> Pagefind static search index
  -> GitHub Pages
```

## Major Components

| Component | Responsibility | Depends on |
|---|---|---|
| `content/` | Authored documents, attachments, templates, skill data, and Obsidian settings | Human or agent authorship |
| `src/content.config.ts` | Collection loaders and schema binding | `src/lib/content/schema.ts` |
| `src/lib/content/schema.ts` | Frontmatter contracts | Astro Zod |
| `src/lib/content/build-index.ts` | Index construction, uniqueness, links, backlinks, related entries, and graph data | Schemas, wiki-links, attachments, filesystem |
| `src/lib/markdown/remark-obsidian.ts` | Obsidian wiki-link and embed rendering | Generated content index |
| `src/layouts/` | Shared reading and portfolio presentation | Normalized collection entries |
| `src/pages/` | Static indexes, details, feeds, robots, graph, and portfolio routes | Queries, layouts, site config |
| Preact islands | Search, filtering, navigation, graph, and skill-tree interaction | Server-rendered data or static endpoints |
| `scripts/build-search.mjs` | Pagefind post-build indexing | Astro static output |
| `.github/workflows/deploy.yml` | Verify, browser-test, build, cache, and deploy | GitHub Actions and Pages |

## Content Boundaries

- `knowledge`, `explorations`, `projects`, and `logs` participate in the custom content index, graph, backlinks, and related-entry derivation.
- `portfolio` uses its own schema and direct-share route and is deliberately excluded from public discovery surfaces.
- Attachments are material files under `content/attachments/`; the build copies only contained regular files.
- Generated cache and static output are disposable derivatives, not authored sources.

## Rendering Boundaries

- Astro renders semantic static HTML as the baseline.
- Preact enhances only interaction that benefits from client state.
- Server-only schema and filesystem code must not enter client bundles.
- All internal URLs and copied assets must respect `SITE_CONFIG.base`.

## Failure Behavior

- Invalid frontmatter fails schema validation.
- Unsafe or duplicate slugs, titles, or aliases fail index construction.
- Ambiguous wiki-links fail resolution; unresolved links and optional missing attachments warn rather than silently targeting the wrong document.
- Drafts are filtered from production surfaces.
- GitHub API failures fall back to cached or safe empty data.

## Architecture Constraints

- No application database or runtime API server is part of the current architecture.
- Do not make browser JavaScript responsible for core content availability.
- Preserve static production output and base-aware routing.
- Preserve portfolio non-discovery and privacy metadata.
- Schema changes require tests, migration-impact review, and authoring-guide updates.

## Decision Summary

See `decisions.md` for complete records.

| Decision | Choice | Date |
|---|---|---|
| Agent context | AI Development Harness v1.1 Standard tier | 2026-08-21 |
| Harness language | English | 2026-08-21 |
