<!--
Purpose:        Code, content, review, testing, security, and Git standards for gilgob
Owner:          Reviewer
Update Trigger: Repository conventions, quality gates, or content contracts change
Harness Version: 1.1
-->

# gilgob Standards

_Last updated: 2026-08-21_

## General Standard

- Preserve current behavior unless the request explicitly changes it.
- Prefer small, focused files and changes with one clear responsibility.
- Follow existing local patterns before introducing a new convention.
- Explain trade-offs when a choice affects public URLs, content disclosure, build behavior, or maintainability.
- Use evidence from current files and fresh command output; do not guess project facts.

## TypeScript and Astro

- Use strict TypeScript as configured by `astro/tsconfigs/strict`.
- Use two-space indentation, single-quoted JavaScript and TypeScript strings, and semicolons, matching current source files.
- Use `camelCase` for variables and functions, `PascalCase` for components and types, and `UPPER_SNAKE_CASE` for constants.
- Keep server-only modules out of browser islands.
- Keep URLs and asset paths base-aware through the existing site configuration helpers.
- Do not introduce a line-length or coverage threshold that the repository does not enforce.

## Content

- Write user-facing Knowledge Garden content in Korean unless the user requests another language.
- Write harness documents in English.
- Use the matching file in `content/templates/` as the frontmatter starting point.
- Keep `title`, `description`, canonical category, dates, publication state, aliases, and collection status accurate.
- Keep titles, aliases, and slugs unique across indexed public content.
- Use `draft: true` while a document is incomplete, unverified, or not approved for publication.
- Link related knowledge with wiki-links when the relationship helps the reader; do not add decorative links solely to increase graph density.
- Put material attachments under `content/attachments/` and use contained paths.
- Do not publish sensitive, private, NDA, or secret material.

See `docs/content-authoring/README.md` and the collection-specific guide for executable checklists.

## Documentation

- Lead with purpose and the action the reader should take.
- Link to authoritative code or documents instead of duplicating volatile details.
- Include exact commands and paths where they help the reader act.
- Separate facts, interpretations, and future ideas.
- Update the owner and trigger metadata when a harness document's responsibility changes.
- Record significant technical decisions in `memory/decisions.md`.

## Testing

| Change type | Minimum evidence |
|---|---|
| Pure harness documentation | Header, link/path, unfinished-token, and `git diff --check` validation |
| Draft content | `npm run check` and `npm run build` |
| Published content | `npm run verify`; add base-path E2E when routes or assets are affected |
| TypeScript logic | Focused Vitest test plus `npm test` and `npm run check` |
| UI, routing, search, accessibility, or browser behavior | Relevant Playwright test plus the static quality gate |
| Deployment or base-path behavior | Production base-path verify and E2E commands |

Do not claim a check passed without fresh output from that check after the final relevant edit.

## Security and Privacy

- Never hardcode or expose secrets.
- Treat `GITHUB_TOKEN` as build-time server-only data.
- Validate external links as HTTPS where the content schema requires them.
- Preserve `noindex`, `nofollow`, search exclusion, RSS exclusion, and sitemap exclusion for direct-share portfolios.
- Remember that a high-entropy `shareId` reduces accidental discovery but provides no authentication.

## Git

Use concise conventional commit subjects where a commit is requested or part of an approved workflow:

```text
feat(scope): subject
fix(scope): subject
docs(scope): subject
refactor(scope): subject
test(scope): subject
chore(scope): subject
```

- Do not discard unrelated user changes.
- Do not rewrite history or use destructive reset commands without explicit approval.
- Do not push, merge, tag, or release without explicit approval.

## Review Checklist

- [ ] The change matches the request and does not expand scope silently.
- [ ] Project facts come from current authoritative sources.
- [ ] Relevant approval gates were satisfied.
- [ ] Content and code follow their applicable contracts.
- [ ] Tests or documentation checks are proportional and fresh.
- [ ] No generated artifact, secret, or unrelated file was intentionally edited.
- [ ] Durable memory changed only if a durable fact changed.
