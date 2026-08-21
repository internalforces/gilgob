<!--
Purpose:        Current project snapshot and the first durable context file agents read
Owner:          All agents (read), Planner (write)
Update Trigger: Version, public contract, project phase, or overall status materially changes
Harness Version: 1.1
-->

# Project: gilgob

_Last updated: 2026-08-21_

## Summary

gilgob is a Korean static Knowledge Garden for connecting reusable knowledge, open explorations, project records, date-centered learning logs, and direct-share portfolios. The version-controlled `content/` directory is both the Obsidian Vault and the source for Astro Content Collections.

## Current State

| Field | Value |
|---|---|
| Package version | `1.0.0` |
| Phase | Public static site under active maintenance |
| Public URL | `https://internalforces.github.io/gilgob/` |
| Default base path | `/gilgob` |
| Product roadmap | No committed roadmap |
| Overall status | No active issue is recorded in Harness memory |

The absence of a recorded issue is not proof that the repository is defect-free. Inspect current tests and behavior for each task.

## Technology Summary

| Field | Value |
|---|---|
| Runtime | Node.js 22 |
| Language | TypeScript; Markdown and MDX content |
| Framework | Astro 7 with Preact islands |
| Persistence | Version-controlled files; generated JSON cache |
| Infrastructure | GitHub Actions and GitHub Pages |
| Repository | Single repository |

## Key Paths

```text
content/                     Authored Knowledge Garden and Obsidian Vault
content/templates/           Collection frontmatter starters
src/lib/content/             Schemas, indexing, queries, and wiki-links
src/pages/                   Static route definitions
src/layouts/                 Shared page layouts
tests/unit/                  Logic tests
tests/integration/           Build and route integration tests
tests/e2e/                   Playwright acceptance tests
gilgob-harness/              AI Development Harness
```

## Current Contracts

- Production output is static.
- Drafts are visible in local development and excluded from production discovery and routes as implemented by each collection.
- Direct-share portfolios are unlisted and excluded from search, RSS, sitemap, and public indexes; they are not authenticated.
- Content titles, aliases, and slugs must satisfy the uniqueness and safety validation in `src/lib/content/`.
- GitHub activity data is public build-time data with a cached or empty fallback.

## Recent Harness Changes

| Date | Change |
|---|---|
| 2026-08-21 | Adopted AI Development Harness v1.1 Standard tier and English harness documentation |

## Project Constraints

- Preserve `content/` as the single authored source; do not add a separate CMS or copy pipeline without approval.
- Preserve the `/gilgob` base-path contract unless the hosting configuration is intentionally changed with approval.
- Do not publish secrets, sensitive personal information, or NDA material.
- Do not invent content facts or project outcomes.
- Obtain exact-target approval before moving, merging, or deleting content.
