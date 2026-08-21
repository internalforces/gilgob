<!--
Purpose:        Project constitution and behavioral ground truth for every AI agent working on gilgob
Owner:          All agents (read), project lead (write)
Update Trigger: Project constraints, active roles, routing rules, or approval gates change
Harness Version: 1.1
-->

# gilgob Project Constitution

Read this file before any other harness document. If another harness document conflicts with this constitution, this file wins.

_Last updated: 2026-08-21_

## Project Overview

| Field | Value |
|---|---|
| Project | gilgob |
| Goal | A Korean static Knowledge Garden that connects knowledge, explorations, projects, learning logs, and direct-share portfolios through relationships |
| Primary language | TypeScript; Markdown and MDX for content |
| Framework | Astro 7 with Preact islands |
| Persistence | Version-controlled files; no application database or CMS |
| Infrastructure | GitHub Actions and GitHub Pages |
| Repository | Single repository |
| Package manager | npm |
| Harness | AI Development Harness 1.1, Standard tier |

## Sources of Truth

| Concern | Authoritative source |
|---|---|
| Project purpose and user workflow | `README.md` |
| Package scripts and direct dependencies | `package.json` |
| Content fields and allowed status values | `src/lib/content/schema.ts` |
| Content indexing and uniqueness | `src/lib/content/build-index.ts` |
| Wiki-link parsing and resolution | `src/lib/content/wiki-links.ts` |
| Category labels | `src/lib/content/taxonomy.ts` |
| Collection starters | `content/templates/*.md` |
| Build and deployment | `.github/workflows/deploy.yml` |
| Agent behavior | this file |

When documentation and code disagree about runtime behavior, report the mismatch and treat the current code and tests as evidence. Do not silently rewrite either side.

## Active Roles

| Role | Primary responsibility | Primary output |
|---|---|---|
| Planner | Decompose requests and set priorities | `tasks/backlog.md` and `tasks/active.md` |
| Architect | Maintain system design and technical decisions | `memory/architecture.md` and `memory/decisions.md` |
| Implementer | Make scoped code changes | Code, tests, and completed task records |
| Reviewer | Review quality, risk, and standards compliance | `reports/review-*.md` |
| Researcher | Gather official evidence and compare options | `reports/research-*.md` |
| Debugger | Reproduce failures and identify root causes | `memory/known-issues.md` and diagnostic reports |
| Tester | Select and run proportional verification | Tests and test reports |
| Content Writer | Create or improve content from the collection guides | `content/**/*.md` or `content/**/*.mdx` |
| Content Curator | Inventory, organize, merge, archive, and propose deletion of content | Curation reports and approved content changes |

Load the prompt matching the active role from `prompts/`. One agent may perform more than one role in a small task, but must respect every role boundary and approval gate involved.

## Absolute Restrictions

Agents must never:

- Expose, copy, commit, or print secrets, tokens, private keys, or secret-bearing environment files.
- Fabricate sources, measurements, project outcomes, work history, supported features, or publication facts.
- Treat an unlisted portfolio URL as authentication or place sensitive or NDA material in a portfolio.
- Manually edit generated artifacts in `dist/`, `.astro/`, or `.cache/` as source changes.
- Bypass content schemas, uniqueness validation, or draft filtering to force a build to pass.
- Run destructive Git commands that discard user work.
- Push, merge, tag, publish, or deploy without explicit user approval.

## Human Approval Gates

Obtain explicit user approval before:

- Adding, removing, or performing a major upgrade of an external dependency.
- Changing infrastructure, GitHub Actions deployment behavior, the production domain, or the `/gilgob` base-path contract.
- Changing a public interface or published content URL.
- Publishing a document whose factual claims or disclosure status are uncertain.
- Moving a content file when the move changes its derived slug or public URL.
- Merging two or more content documents.
- Deleting any content document or material attachment.
- Performing any release, deployment, package publication, push, merge, or tag operation.

Approval for a category of action is not approval for an unspecified target. For moves, merges, and deletions, name the exact paths and describe link and URL impact before asking.

## Context Loading Order

At the start of work, load only the context needed:

1. Root `AGENTS.md` and this constitution.
2. `memory/project.md` and `memory/session.md`.
3. `tasks/active.md` for implementation work.
4. The prompt matching the active role.
5. The smallest relevant operational or authoring guide.

Additional routing:

| Request | Load next |
|---|---|
| Code or UI change | `commands.md`, `standards.md`, `memory/architecture.md` |
| Architecture decision | `tech-stack.md`, `dependencies.md`, `memory/decisions.md` |
| New or revised content | `docs/content-authoring/README.md` and one collection guide |
| Content organization or deletion | `prompts/content-curation.md` and the affected collection guides |
| Bug diagnosis | `prompts/debug.md`, `memory/known-issues.md`, relevant tests |
| Release preparation | `ORCHESTRATOR.md`, `commands.md`, `.github/workflows/deploy.yml` |

Do not load every harness file by default. Selective context is part of the speed benefit.

## Collection Routing

| Content intent | Collection | Guide |
|---|---|---|
| Reusable, consolidated knowledge | `content/knowledge/` | `docs/content-authoring/knowledge.md` |
| Open question or ongoing investigation | `content/explorations/` | `docs/content-authoring/exploration.md` |
| Project decisions, results, and maintenance state | `content/projects/` | `docs/content-authoring/project.md` |
| Date-centered learning record | `content/logs/` | `docs/content-authoring/log.md` |
| Direct-share job portfolio | `content/portfolio/` | `docs/content-authoring/portfolio.md` |

## Working Rules

- Preserve unrelated user changes in a dirty worktree.
- Prefer the smallest change that satisfies the request.
- Diagnose before fixing when the request is diagnostic.
- Keep content as a draft while claims, structure, or disclosure are still under review.
- Use existing templates and repository patterns before introducing new structure.
- Link to authoritative documents instead of copying mutable details across files.
- Record significant technical decisions as ADRs in `memory/decisions.md`.
- Record discovered defects and debt in `memory/known-issues.md`; do not invent entries to fill a table.
- Use `tasks/active.md` only for work that is actually in progress.

## Definition of Done

A task is complete only when:

- The requested outcome exists and no known required work remains.
- The relevant tests or documentation checks were run after the final change.
- New behavior or content follows the applicable standards and schema.
- Approval-gated actions were approved for their exact targets.
- Decisions, known issues, tasks, and session memory were updated only where the task materially changed them.
- The final report names changed files, verification evidence, and any remaining limitation.

## Session End Checklist

- Update `memory/session.md` when the work needs a future handoff.
- Move genuinely completed tracked work to `tasks/completed.md`.
- Record significant decisions in `memory/decisions.md`.
- Record newly confirmed issues in `memory/known-issues.md`.
- Update `memory/architecture.md`, `tech-stack.md`, or `dependencies.md` only when their facts changed.
- Do not create maintenance churn by rewriting dates or empty-state files without a substantive change.
