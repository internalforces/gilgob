<!--
Purpose:        Shared workflow and contracts for authoring, publishing, updating, and curating gilgob content
Owner:          Content Writer and Content Curator
Update Trigger: Content schemas, indexing, wiki-links, attachments, templates, or publication behavior change
Harness Version: 1.1
-->

# Content Authoring Guide

Use this guide for every content request, then load exactly one collection-specific guide.

## Choose the Collection

| The document primarily answers... | Collection | Template | Guide |
|---|---|---|---|
| “What is this, how does it work, and when is it useful?” | `knowledge` | `content/templates/knowledge.md` | `knowledge.md` |
| “What question am I investigating, and what do I know so far?” | `explorations` | `content/templates/exploration.md` | `exploration.md` |
| “What problem did this project address, what decisions were made, and what resulted?” | `projects` | `content/templates/project.md` | `project.md` |
| “What did I learn or try on this date, and what comes next?” | `logs` | `content/templates/log.md` | `log.md` |
| “How does verified project evidence support a particular job application?” | `portfolio` | `content/templates/portfolio.md` | `portfolio.md` |

If a note answers more than one question, choose its dominant purpose and link to separate documents for reusable subtopics. Do not duplicate the same long explanation across collections.

## Authoritative Contracts

Before changing fields or behavior, inspect:

- `src/lib/content/schema.ts` for field types, required values, safe paths, and HTTPS links;
- `src/lib/content/build-index.ts` for indexing, uniqueness, backlinks, related entries, and attachment warnings;
- `src/lib/content/wiki-links.ts` for wiki-link resolution;
- `src/lib/content/taxonomy.ts` for canonical category labels;
- `content/templates/*.md` for collection starters;
- `README.md` for reader and publishing workflow.

This guide explains those contracts but does not override them.

## Default Authoring Workflow

1. **Clarify the outcome.** Identify the intended reader, collection, source evidence, and whether the user intends to publish now.
2. **Choose a path.** Use a stable, descriptive POSIX path inside the collection. Use a date-prefixed filename for logs.
3. **Copy the template.** Start from the exact matching file in `content/templates/`.
4. **Keep it private while writing.** Set `draft: true` until structure, facts, links, and disclosure are ready.
5. **Write one clear purpose.** Follow the collection guide and remove empty or filler sections.
6. **Connect it.** Add useful wiki-links, aliases, tags, and next questions based on real relationships.
7. **Validate metadata.** Check fields, dates, uniqueness, status, safe paths, and HTTPS links.
8. **Verify.** Run the checks in this guide and the collection guide after the final edit.
9. **Publish intentionally.** Set `draft: false` only when publication is requested and the document is ready.

## Shared Frontmatter

The four indexed collections—knowledge, explorations, projects, and logs—share these fields.

| Field | Required | Rule |
|---|---|---|
| `title` | Yes | Non-empty; keep it distinct from every other indexed title and alias |
| `description` | Yes | One or two accurate sentences used in lists, search, and metadata |
| `category` | Yes | Non-empty stable category value |
| `tags` | Yes | Array of non-empty strings; use `[]` when none are useful |
| `created` | Yes | `YYYY-MM-DD` creation date |
| `updated` | No | `YYYY-MM-DD`; omit when unchanged, otherwise use the date of material revision |
| `draft` | Yes in templates | Boolean publication intent |
| `aliases` | Yes | Unique alternate names; use `[]` when none are needed |
| `featured` | Yes | Boolean home-page emphasis, not a general quality score |
| `slug` | No | Safe POSIX relative path overriding the file-derived route |
| `nextQuestions` | No | Array of concrete questions that deserve future exploration |

Collection-specific fields:

- Knowledge requires `status: seed | growing | mastered`.
- Explorations require `status: active | paused | complete`.
- Projects require `status: idea | building | maintained | archived` and may include an HTTPS `repository`.
- Logs do not use `status`.
- Portfolio uses a separate schema documented in `portfolio.md`.

## Categories and Tags

Prefer an existing canonical category when it fits:

- `Computer Science`
- `Data & Mathematics`
- `AI`
- `Finance`
- `Research`
- `Projects`
- `Learning`

`src/lib/content/taxonomy.ts` maps these stored values to Korean reader-facing labels and is authoritative for the exact display text.

Custom non-empty categories are accepted and display as written. Add one only when the concept does not fit an existing category and the new label will be reused.

Tag rules:

- Reuse existing spelling and capitalization for the same concept.
- Prefer a small set of retrieval signals over sentence fragments.
- Do not repeat the category solely to fill the array.
- Remember that shared tags affect related-entry ranking and graph structure.

## Titles, Aliases, Paths, and Slugs

- Indexed document titles and aliases are normalized and checked across collections.
- Duplicate aliases inside one document are invalid.
- A title may match an alias on the same document, but avoid redundant aliases.
- Explicit and derived slugs must be unique across the indexed collections.
- A slug must be a non-empty POSIX relative path with no leading slash, backslash, empty segment, `.`, `..`, query, fragment, or percent escape.
- Moving a file can change its derived slug and public URL. Route every move through Content Curator and obtain explicit approval for the exact source and target even when an explicit slug preserves the URL.

Before creating a title or alias, search:

```bash
rg -n '^title:|^aliases:' content/knowledge content/explorations content/projects content/logs
```

## Wiki-Links

Supported forms include:

```markdown
[[Document Title]]
[[Document Title|Reader label]]
[[Document Title#Section]]
```

Resolution checks relative path, direct path, exact title, exact alias, then case-insensitive title or alias. Ambiguity is an error. An unresolved wiki-link is rendered as missing and emits a warning instead of silently targeting a guess.

Linking standard:

- Link when the target supplies needed context or a valuable next step.
- Prefer a stable title or alias when it improves readability.
- Do not create links to inflate graph density.
- After renaming, moving, merging, or deleting, search and update all old titles, aliases, and paths.
- A published document linking to a draft target does not expose a production link to that draft.

## Attachments

Store material attachments below `content/attachments/` and embed them with a contained path:

```markdown
![[attachments/b-tree-diagram.svg|B-Tree structure]]
```

Rules:

- Use descriptive filenames and alt text.
- Do not use traversal, symlinks, directories, secrets, or material outside the attachment root.
- Missing optional attachments warn during index construction; a warning is still a publication defect when the document expects the asset.
- Before deleting an attachment, search every content document for its path and obtain exact-target approval.

## Draft and Publication Behavior

- Local development shows drafts for author review.
- Production excludes drafts from the applicable indexes, detail routes, RSS, sitemap, search index, graph, and relationships as implemented by the site.
- Keep `draft: true` when facts, disclosure, links, or structure are not ready.
- Setting `draft: false` is an intentional publication decision, not a formatting cleanup.
- Portfolio publication has additional privacy limits described in `portfolio.md`.

## Updating Existing Content

- Preserve the original `created` date.
- Set `updated` when the substance changes, not for invisible formatting alone.
- Re-evaluate status using the collection guide.
- Confirm title or alias changes do not break links or create ambiguity.
- Check whether changed claims need new evidence.
- Preserve useful unique material; use Content Curator for merges and deletions.

## Curation and Deletion

Content Writer may improve a document in place. Content Curator handles identity-changing operations.

Before moving, merging, archiving through removal, or deleting, Content Curator must report:

- exact source and proposed target paths;
- current and proposed public URLs;
- inbound and outbound wiki-links;
- aliases and unique information to preserve;
- material attachments;
- recovery path;
- exact approval requested.

No mutation occurs until explicit approval is received for those targets.

## Verification

During drafting:

```bash
npm run check
npm run build
```

Before publication:

```bash
npm run verify
```

Use production-equivalent validation when routes, links, assets, metadata, or portfolio output are materially affected:

```bash
SITE_URL=https://internalforces.github.io BASE_PATH=/gilgob npm run verify
SITE_URL=https://internalforces.github.io BASE_PATH=/gilgob npm run test:e2e
```

Review build warnings for unresolved wiki-links and missing attachments even when the command exits successfully.

## Publication Checklist

- [ ] The collection matches the document's dominant purpose.
- [ ] Frontmatter passes the current schema.
- [ ] Title, aliases, and slug are safe and unique.
- [ ] Dates and status describe the document honestly.
- [ ] Facts and outcomes are supported; uncertainty is explicit.
- [ ] Wiki-links and attachments resolve as intended.
- [ ] No private, secret, or NDA material is present.
- [ ] `draft` matches the intended publication state.
- [ ] The collection-specific checklist passes.
- [ ] Fresh verification completed after the final edit.
