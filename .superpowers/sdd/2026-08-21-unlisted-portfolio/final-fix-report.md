# Unlisted Portfolio Final Fix Report

## Scope

- Added deterministic duplicate `shareId` protection before portfolio static paths are returned.
- Added production-build coverage for a `draft: true` portfolio route exclusion.
- Made the search exclusion check reject Pagefind error and unavailable terminal states.
- Corrected portfolio authoring guidance and replaced the predictable template share ID with an opaque-looking prefix.

## RED/GREEN evidence

### Duplicate share ID

- **RED** — With the duplicate assertion absent, ran:

  ```bash
  npm test -- tests/integration/content-routes.test.ts
  ```

  Result: **15 tests, 1 failed**. `rejects duplicate portfolio share IDs instead of choosing a document` received a resolved production build rather than the required rejection. Astro logged that `/portfolio/8c5e1a7d3b92-signal-hub` conflicted with the same route, demonstrating the silent-selection risk.
- **GREEN** — Restored the explicit assertion and ran the same command:

  ```bash
  npm test -- tests/integration/content-routes.test.ts
  ```

  Result: **1 file passed, 15 tests passed**. The duplicate fixture now makes the production build reject with `Duplicate portfolio shareId`.

### Draft portfolio route

- **RED** — Temporarily replaced the production draft filter with `.filter(() => true)` and ran:

  ```bash
  npm test -- tests/integration/content-routes.test.ts
  ```

  Result: **15 tests, 1 failed**. `does not emit a production route for a draft portfolio` found `dist/portfolio/b91d2e4f6a80-draft-fixture/index.html` instead of receiving `ENOENT`.
- **GREEN** — Restored `.filter((entry) => !isProductionBuild() || !entry.data.draft)` and ran:

  ```bash
  npm test -- tests/integration/content-routes.test.ts
  ```

  Result: **1 file passed, 15 tests passed**. The draft portfolio route is absent from the production output.

## Covering commands and results

```bash
npm test -- tests/integration/content-routes.test.ts
```

Result: **1 file passed, 15 tests passed**.

```bash
npm run build
```

Result: Astro check reported **0 errors, 0 warnings, 0 hints**; static build completed with **17 pages**; Pagefind indexed **8 pages**.

```bash
npx playwright test tests/e2e/search.spec.ts --grep "does not expose the unlisted portfolio through search"
```

Result: **1 passed**. The strengthened test confirms Pagefind did not reach either terminal failure state before asserting that no portfolio URL is shown.

```bash
npm run verify
```

Result: passed once as requested — Astro checks reported **0 errors, 0 warnings, 0 hints**; Vitest reported **17 files and 177 tests passed**; static build completed with **17 pages** and Pagefind indexed **8 pages**.

## Files changed

- `src/pages/portfolio/[shareId].astro`
- `tests/integration/content-routes.test.ts`
- `tests/e2e/search.spec.ts`
- `content/templates/portfolio.md`
- `README.md`
- `.superpowers/sdd/2026-08-21-unlisted-portfolio/final-fix-report.md`

## Self-review

- Duplicate detection runs before draft filtering, so duplicate IDs are rejected deterministically even when one duplicate is a draft.
- Portfolio remains absent from `ContentKind`, public queries, custom index, RSS, graph, sitemap logic, and navigation; no changes were made to those exclusions.
- The existing exact robots meta and body-level Pagefind exclusion are unchanged.
- README documents portfolio-only fields separately and explicitly states opaque IDs reduce accidental discovery but do not authenticate access.
- Fixture files are removed in `finally` blocks; `git diff --check` is clean.
