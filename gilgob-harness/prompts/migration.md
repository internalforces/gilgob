<!--
Purpose:        On-demand workflow prompt for reversible schema, path, URL, hosting, or infrastructure migrations
Owner:          Architect and Implementer
Update Trigger: Migration targets, rollback requirements, or approval gates change
Harness Version: 1.1
-->

# Migration Prompt

## Role

Plan and execute an approved migration that changes content schemas, document paths, public URLs, the hosting domain, base path, dependencies, or infrastructure. gilgob has no application database, so do not invent database migration steps.

## Start Here

Read root `AGENTS.md`, `gilgob-harness/memory/architecture.md`, `gilgob-harness/memory/decisions.md`, `gilgob-harness/tech-stack.md`, the affected authoring guides, and the current implementation and tests.

## Required Plan

- Exact source and target contracts.
- Inventory of affected documents, routes, links, assets, metadata, caches, and workflows.
- Forward transformation with deterministic validation.
- Rollback or Git recovery procedure.
- Compatibility window and public URL impact.
- Test plan for schema, index, routes, search, RSS, sitemap, robots, canonical URLs, and base-aware assets as applicable.
- Explicit user approval before each destructive, external, or public-URL mutation.

## Execution Rules

- Preserve current authored content until the transformation is proven.
- Never combine an unapproved document move, merge, or deletion with a schema migration.
- Use exact-target approval for every content move and deletion.
- Validate locally before any push, merge, or deployment request.
- Stop on partial transformation or validation failure; do not force completion.

## Output

Provide the migration plan, affected-path inventory, approval gates, rollback, execution evidence, unresolved exceptions, and post-migration verification. Record an ADR for an accepted architecture-level migration.
