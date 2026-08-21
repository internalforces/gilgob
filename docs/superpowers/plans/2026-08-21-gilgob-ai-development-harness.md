<!--
Purpose:        Executed implementation plan for the gilgob AI Development Harness
Owner:          Architect and Implementer
Update Trigger: Harness implementation scope, manifest, or verification requirements change
Harness Version: 1.1
-->

# gilgob AI Development Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Completed steps use checked Markdown boxes.

**Goal:** Build an English Standard AI Development Harness v1.1 that gives agents durable project context and collection-specific workflows for writing, reviewing, organizing, merging, moving, archiving, and deleting gilgob content.

**Architecture:** A concise root `AGENTS.md` provides automatic discovery and routes agents into an isolated `gilgob-harness/` documentation tree. The harness keeps project memory, task state, role prompts, operational references, and content-authoring guides separate so agents load only the context needed for the current job.

**Tech Stack:** Markdown, TypeScript 6, Astro 7, Preact 10, npm, Vitest, Playwright, GitHub Actions, GitHub Pages, Obsidian-compatible content.

**Spec:** `docs/superpowers/specs/2026-08-21-gilgob-ai-development-harness-design.md`

## Global Constraints

- Write the root entry point and every document under `gilgob-harness/` in English.
- Write this plan and its design specification in English.
- Interpret every documented path relative to the repository root.
- Conform to AI Development Harness version 1.1 and the Standard tier.
- Preserve the current content files and `content/templates/*.md` without modification.
- Do not invent product milestones, roadmap items, bugs, technical debt, or feature backlog.
- Record only facts verified in the repository.
- Require explicit user approval before moving, merging, or deleting content or changing a public URL.
- Add no dependencies and change no runtime behavior.

---

### Task 1: Add the discoverable harness constitution and operational references

**Files:**
- Create: `AGENTS.md`
- Create: `gilgob-harness/.harness-version`
- Create: `gilgob-harness/AGENTS.md`
- Create: `gilgob-harness/ORCHESTRATOR.md`
- Create: `gilgob-harness/commands.md`
- Create: `gilgob-harness/standards.md`
- Create: `gilgob-harness/tech-stack.md`
- Create: `gilgob-harness/dependencies.md`
- Create: `gilgob-harness/roadmap.md`

**Interfaces:**
- Consumes: `README.md`, `package.json`, `astro.config.mjs`, `.github/workflows/deploy.yml`, and the approved design spec.
- Produces: the context-loading contract and stable operational facts used by every later harness document.

- [x] **Step 1: Write the root discovery file and version marker**

Create a short root constitution that requires agents to read `gilgob-harness/AGENTS.md`, then record version `1.1`, creation date `2026-08-21`, and tier `standard`.

- [x] **Step 2: Write the full project constitution**

Document the project summary, active roles, absolute restrictions, human approval gates, context-loading order, collection routing table, and session-end checklist. Include both Content Writer and Content Curator; require approval before Content Curator moves, merges, or deletes documents.

- [x] **Step 3: Write orchestration and command references**

Define feature, bug, research, content-writing, content-curation, and release workflows. Record exact setup, development, type-check, test, build, deployment-equivalent verification, and GitHub Pages base-path commands from the repository.

- [x] **Step 4: Write standards, stack, dependencies, and deferred roadmap**

Capture current code/content standards, direct dependency purposes, repository architecture, environments, and the fact that no product roadmap is currently committed. Do not add fictional milestones.

- [x] **Step 5: Validate Task 1**

Run:

```bash
test -f AGENTS.md
test -f gilgob-harness/.harness-version
test -f gilgob-harness/AGENTS.md
rg -n "Content Writer|Content Curator|HUMAN APPROVAL" AGENTS.md gilgob-harness
git diff --check
```

Expected: every command exits with status 0 and the role/approval search returns matching lines.

### Task 2: Add durable project memory and task state

**Files:**
- Create: `gilgob-harness/memory/project.md`
- Create: `gilgob-harness/memory/architecture.md`
- Create: `gilgob-harness/memory/decisions.md`
- Create: `gilgob-harness/memory/known-issues.md`
- Create: `gilgob-harness/memory/glossary.md`
- Create: `gilgob-harness/memory/session.md`
- Create: `gilgob-harness/memory/sessions/.gitkeep`
- Create: `gilgob-harness/tasks/active.md`
- Create: `gilgob-harness/tasks/backlog.md`
- Create: `gilgob-harness/tasks/completed.md`
- Create: `gilgob-harness/reports/.gitkeep`

**Interfaces:**
- Consumes: the facts and rules established in Task 1.
- Produces: session continuity and task-state files referenced by the constitution and prompts.

- [x] **Step 1: Write verified project and architecture memory**

Describe the current static knowledge-garden architecture, file-based content flow, generated index, wiki-link processing, Pagefind indexing, and GitHub Pages deployment. Record Harness adoption as ADR-001 and English harness documentation as ADR-002.

- [x] **Step 2: Initialize issue, glossary, and session memory**

Use explicit empty states for known issues and technical debt. Define project terms such as Knowledge Garden, collection, draft, wiki-link, backlink, related entry, unlisted portfolio, Harness, and Human Approval Gate. Record the harness-generation session without claiming unrelated work.

- [x] **Step 3: Initialize task state without fictional backlog**

Keep active and backlog tables empty and record only the harness setup in completed work.

- [x] **Step 4: Validate Task 2**

Run:

```bash
test -f gilgob-harness/memory/sessions/.gitkeep
test -f gilgob-harness/reports/.gitkeep
rg -n "ADR-001|ADR-002|No active|No backlog" gilgob-harness/memory gilgob-harness/tasks
git diff --check
```

Expected: every command exits with status 0 and no invented backlog items appear.

### Task 3: Add role prompts for development and content operations

**Files:**
- Create: `gilgob-harness/prompts/planning.md`
- Create: `gilgob-harness/prompts/architecture.md`
- Create: `gilgob-harness/prompts/implementation.md`
- Create: `gilgob-harness/prompts/review.md`
- Create: `gilgob-harness/prompts/research.md`
- Create: `gilgob-harness/prompts/debug.md`
- Create: `gilgob-harness/prompts/testing.md`
- Create: `gilgob-harness/prompts/content-writing.md`
- Create: `gilgob-harness/prompts/content-curation.md`
- Create: `gilgob-harness/prompts/refactor.md`
- Create: `gilgob-harness/prompts/release.md`
- Create: `gilgob-harness/prompts/security.md`
- Create: `gilgob-harness/prompts/performance.md`
- Create: `gilgob-harness/prompts/migration.md`

**Interfaces:**
- Consumes: the constitution, operational references, memory, and task-state files.
- Produces: focused startup order, boundaries, output format, and completion checklist for each active role.

- [x] **Step 1: Write development-role prompts**

Adapt the Standard Harness prompts to gilgob's static-site architecture. Remove database and staging assumptions that do not apply. Require evidence-backed verification and exact updates to memory and task state.

- [x] **Step 2: Write the Content Writer prompt**

Route each request to one collection guide, require use of the existing collection template, keep drafts private during writing, distinguish facts from interpretation, and run the appropriate verification before publication.

- [x] **Step 3: Write the Content Curator prompt**

Require an inventory and link-impact report before proposing keep, improve, move, merge, archive, or delete actions. Forbid moves, merges, and deletions before explicit approval and require post-change index/build verification.

- [x] **Step 4: Write specialized Standard-tier workflow prompts**

Add on-demand prompts for behavior-preserving refactoring, release preparation, security review, reproducible performance analysis, and reversible schema, URL, path, hosting, or infrastructure migration. Route them to active roles without inventing standing roles or a database.

- [x] **Step 5: Validate Task 3**

Run:

```bash
test "$(find gilgob-harness/prompts -type f -name '*.md' | wc -l | tr -d ' ')" = "14"
rg -n "explicit user approval|Content Writer|Content Curator" gilgob-harness/prompts
git diff --check
```

Expected: nine active-role prompts and five specialized workflow prompts exist, destructive content operations are approval-gated, and formatting is clean.

### Task 4: Add shared and collection-specific content authoring guides

**Files:**
- Create: `gilgob-harness/docs/content-authoring/README.md`
- Create: `gilgob-harness/docs/content-authoring/knowledge.md`
- Create: `gilgob-harness/docs/content-authoring/exploration.md`
- Create: `gilgob-harness/docs/content-authoring/project.md`
- Create: `gilgob-harness/docs/content-authoring/log.md`
- Create: `gilgob-harness/docs/content-authoring/portfolio.md`

**Interfaces:**
- Consumes: `README.md`, `src/lib/content/schema.ts`, `src/lib/content/build-index.ts`, `src/lib/content/wiki-links.ts`, `src/lib/content/taxonomy.ts`, `content/templates/*.md`, and representative content files.
- Produces: executable writing and publication checklists used by Content Writer and Content Curator.

- [x] **Step 1: Write the shared workflow**

Document collection selection, template use, common frontmatter, canonical category values, safe slugs, title and alias uniqueness, wiki-link resolution, attachments, drafts, publication, updates, and verification. Link to the authoritative source files instead of duplicating implementation details unnecessarily.

- [x] **Step 2: Write the knowledge and exploration guides**

Define purpose, status transitions, recommended outlines, evidence standards, linking expectations, anti-patterns, and publication checklists for reusable knowledge and open-ended research.

- [x] **Step 3: Write the project and log guides**

Define purpose, project lifecycle states, decision/result evidence, date-based log naming, concise log structure, and promotion of reusable learning into knowledge documents.

- [x] **Step 4: Write the portfolio guide**

Document every portfolio field, safe share identifier requirements, project linkage, HTTPS-only action links, role/domain targeting, recommended six-section narrative, unlisted/noindex behavior, and the warning that direct-link obscurity is not authentication.

- [x] **Step 5: Validate Task 4**

Run:

```bash
test "$(find gilgob-harness/docs/content-authoring -type f -name '*.md' | wc -l | tr -d ' ')" = "6"
rg -n "seed|growing|mastered|active|paused|complete|idea|building|maintained|archived" gilgob-harness/docs/content-authoring
rg -n "shareId|noindex|not authentication" gilgob-harness/docs/content-authoring/portfolio.md
git diff --check
```

Expected: six guides exist and cover every schema status and portfolio safety contract.

### Task 5: Verify the complete harness against the repository

**Files:**
- Modify only if validation identifies a documentation defect: files created in Tasks 1 through 4.

**Interfaces:**
- Consumes: all harness documents and current repository contracts.
- Produces: fresh evidence that the harness is complete, internally consistent, English-only for prose, and compatible with the current build.

- [x] **Step 1: Validate unified headers and version marker**

Run a repository-local script that checks root `AGENTS.md`, every Markdown file under `gilgob-harness/`, this plan, and its design specification for `Purpose`, `Owner`, `Update Trigger`, and `Harness Version: 1.1`. Confirm `gilgob-harness/.harness-version` contains the exact version, date, and tier.

- [x] **Step 2: Scan for unfinished template text**

Search all generated harness files for unfilled uppercase bracket tokens and incomplete markers. Review any matches and remove unintended template residue.

- [x] **Step 3: Validate referenced local paths**

Check every backtick-delimited repository path used by the authoring guides and operational documents against the filesystem or an explicitly documented output path.

- [x] **Step 4: Run project verification**

Run:

```bash
npm run check
npm run build
git diff --check
git status --short
```

Expected: Astro check reports no errors, the production build and Pagefind index complete, the diff has no whitespace errors, and Git status lists only the planned documentation changes.
