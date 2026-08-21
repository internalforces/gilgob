<!--
Purpose:        Exact local setup, development, validation, and production-equivalent commands
Owner:          Implementer and Tester
Update Trigger: package scripts, runtime requirements, base path, or CI workflow changes
Harness Version: 1.1
-->

# gilgob Command Reference

_Last updated: 2026-08-21_

Run commands from the repository root.

## Requirements

- Node.js 22
- npm
- Chromium installed through Playwright for browser tests

## Setup

```bash
npm ci
npx playwright install chromium
```

No application database, migration, seed, or local environment file is required for the documented default workflow.

## Development

```bash
npm run dev
```

The development server includes draft content. Do not use its visibility as evidence that a draft will be published.

## Focused Validation

```bash
npm run check       # Astro and TypeScript checks
npm test            # Vitest unit and integration tests
npm run build       # Check, static build, and Pagefind indexing
npm run test:e2e    # Playwright acceptance tests
```

Watch mode:

```bash
npm run test:watch
```

## Full Static Quality Gate

```bash
npm run verify
```

`npm run verify` executes `npm run check`, `npm test`, and `npm run build` in sequence.

## Production Base-Path Validation

The default public URL contract is `https://internalforces.github.io/gilgob/` with base path `/gilgob`.

```bash
SITE_URL=https://internalforces.github.io BASE_PATH=/gilgob npm run verify
SITE_URL=https://internalforces.github.io BASE_PATH=/gilgob npm run test:e2e
```

Use this form when a change affects links, assets, canonical URLs, navigation, RSS, sitemap output, search, or routing.

## Preview

Build first, then preview the static output:

```bash
npm run build
npm run preview
```

## Content-Only Changes

Minimum checks for a draft content edit:

```bash
npm run check
npm run build
```

Use the full static quality gate before publication. Add production base-path browser tests when the content adds routes, attachments, complex Markdown, portfolio links, or navigation-sensitive behavior.

## Deployment

There is no local deployment command. The workflow in `.github/workflows/deploy.yml` deploys after a successful `main` push, a manual workflow dispatch, or its scheduled run.

Agents must not push, dispatch the workflow, or deploy without explicit user approval.

## Generated Paths

The following are outputs or caches, not editing targets:

- `.astro/`
- `.cache/`
- `dist/`
- `test-results/`

Delete or regenerate them only as part of a scoped diagnostic or build workflow; never treat manual edits there as source changes.
