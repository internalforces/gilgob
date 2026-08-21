<!--
Purpose:        Approved design for the gilgob AI Development Harness
Owner:          Architect
Update Trigger: Harness scope, structure, roles, language policy, or safety boundaries change
Harness Version: 1.1
-->

# gilgob AI Development Harness Design

## Purpose

Introduce AI Development Harness v1.1 so agents do not have to rediscover project structure, commands, constraints, and completion criteria for every task. The Harness covers development work and consistent workflows for writing, reviewing, organizing, moving, merging, archiving, and deleting Knowledge Garden content.

## Verified Project Context

- gilgob is an existing single repository.
- It uses TypeScript, Astro 7, Preact, Markdown, and MDX.
- It has no application database or separate CMS. `content/` is both the Obsidian Vault and the Astro Content Collections source.
- It uses npm, GitHub Actions, and GitHub Pages.
- It has five content collections: `knowledge`, `explorations`, `projects`, `logs`, and `portfolio`.
- No product roadmap is currently committed. The Harness roadmap remains an explicit empty state until the user approves future direction.

## Selected Structure

Use a Standard Harness with a concise root discovery file and an isolated Harness directory:

```text
AGENTS.md
gilgob-harness/
├── .harness-version
├── AGENTS.md
├── ORCHESTRATOR.md
├── commands.md
├── standards.md
├── tech-stack.md
├── dependencies.md
├── roadmap.md
├── memory/
├── tasks/
├── prompts/
├── reports/
└── docs/
    └── content-authoring/
        ├── README.md
        ├── knowledge.md
        ├── exploration.md
        ├── project.md
        ├── log.md
        └── portfolio.md
```

The root `AGENTS.md` provides automatic discovery and essential non-negotiable rules. Detailed, selectively loadable operating context lives under `gilgob-harness/`. Every documented repository path is repository-root-relative.

## Roles

### Active Roles

| Role | Responsibility | Primary output | Human gate |
|---|---|---|---|
| Planner | Requirement decomposition and priorities | `gilgob-harness/tasks/` | An XL task that cannot be decomposed |
| Architect | Structure and technical decisions | Architecture memory and ADRs | Dependency or infrastructure change |
| Implementer | Scoped code implementation | Code, tests, and completed tasks | Public interface or security-sensitive change |
| Reviewer | Quality and standards review | Review reports | Merge and deployment |
| Researcher | Official evidence and option comparison | Research reports | None for read-only research |
| Debugger | Reproduction and root-cause analysis | Known issues and diagnostic reports | External-state mutation or secret access |
| Tester | Unit, integration, build, and E2E evidence | Tests and test reports | None for local verification |
| Content Writer | New documents and in-place improvement | `content/**/*.md(x)` | Uncertain facts or disclosure |
| Content Curator | Inventory, organization, merge, archive, and deletion proposals | Curation reports and approved content changes | Every move, merge, or deletion |

### Specialized On-Demand Workflows

The Standard tier also provides prompts for refactoring, release preparation, security review, performance analysis, and migrations. These workflows are routed to the active roles whose permissions fit the request; they do not create additional standing roles.

Content Curator must inventory the exact paths, titles, aliases, explicit or derived slugs, URLs, wiki-links, backlinks, attachments, and unique information before proposing identity-changing work. Every document move, merge, or deletion requires explicit user approval for exact targets, regardless of whether an explicit slug preserves the public URL.

## Content Authoring Harness

### Shared Guide

`gilgob-harness/docs/content-authoring/README.md` defines this workflow:

1. Select the collection that matches the document's dominant purpose.
2. Copy the corresponding file from `content/templates/`.
3. Fill frontmatter according to `src/lib/content/schema.ts`.
4. Check title, alias, and slug uniqueness.
5. Add genuine wiki-links, attachments, tags, and next questions.
6. Keep `draft: true` while facts, structure, or disclosure are unfinished.
7. Apply the collection-specific checklist and fresh verification.
8. Set `draft: false` only for intentional publication.

The shared guide documents safe relative slugs, HTTPS external links, attachment containment, wiki-link resolution, drafts, publication, and curation approval gates.

### Collection Guides

- `knowledge.md`: reusable concepts, evidence, examples, misconceptions, links, and `seed -> growing -> mastered` maturity.
- `exploration.md`: questions, hypotheses, evidence, counterevidence, current judgment, stopping rules, and `active -> paused | complete` status.
- `project.md`: problems, constraints, decisions, structure, verification, results, limitations, and `idea -> building -> maintained -> archived` lifecycle.
- `log.md`: date-centered learning events, actions, lessons, and promotion into reusable knowledge or explorations; no status field.
- `portfolio.md`: role- and domain-targeted evidence, personal contribution, decisions, results, limitations, disclosure review, direct-share privacy, and non-authentication warning.

Each guide provides a compact required/optional frontmatter table, recommended body structure, evidence standard, anti-patterns, status or lifecycle guidance where applicable, and a publication checklist.

## Prompts and Workflows

`gilgob-harness/prompts/content-writing.md` selects one collection guide, uses the existing template, distinguishes facts from interpretation, and routes external-evidence gaps to Researcher.

`gilgob-harness/prompts/content-curation.md` uses this sequence:

```text
inventory
  -> detect duplication, staleness, and incorrect placement
  -> analyze link, URL, slug, and attachment impact
  -> recommend keep | improve | move | merge | archive | delete
  -> exact-target user approval for every move, merge, or deletion
  -> minimum approved mutation
  -> content index and build verification
  -> impact and recovery report
```

If content work requires a schema, layout, or runtime change, Content Writer or Content Curator routes the change to Planner, Architect, or Implementer instead of silently changing code.

## Documentation and State Policy

- Harness version is `1.1`; tier is `standard`.
- The root entry point, Harness documents, design, and implementation plan are English.
- Generated Harness documents use the unified Purpose, Owner, Update Trigger, and Harness Version header.
- All paths are repository-root-relative.
- The roadmap contains no invented milestone or feature.
- Task files contain no invented backlog.
- Memory records only repository-verified state and accepted decisions.
- Dependency changes, deployment, public URL changes, every document move or merge, document deletion, and secret access use explicit user approval gates.

## Verification Design

The completed Harness must pass:

1. Standard-tier manifest validation, including nine active-role prompts and five specialized workflow prompts.
2. Unified-header validation for the root entry point, Harness Markdown, design, and plan.
3. English-prose validation for every Harness-related document.
4. Unfinished-token validation.
5. Repository-root-relative local-path validation.
6. Role-to-prompt and routing consistency checks.
7. Contradictory task-state checks.
8. `npm run verify` to prove compatibility with the current Astro project.

## Out of Scope

- Changing `content/templates/*.md`.
- Rewriting, moving, merging, or deleting current content.
- Creating product roadmap items.
- Changing deployment or GitHub settings.
- Adding dependencies.
