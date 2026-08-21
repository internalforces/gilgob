<!--
Purpose:        Shared meanings for project-specific content, architecture, and Harness terms
Owner:          All agents (contribute), Content Curator (maintain)
Update Trigger: A project term is introduced, renamed, or changes meaning
Harness Version: 1.1
-->

# gilgob Glossary

_Last updated: 2026-08-21_

## Project Terms

| Term | Meaning |
|---|---|
| Knowledge Garden | A relationship-centered collection of evolving knowledge rather than a chronological blog |
| Collection | One Astro content group with a dedicated source directory and schema |
| Knowledge | Consolidated, reusable explanation stored under `content/knowledge/` |
| Exploration | An open question or investigation stored under `content/explorations/` |
| Project | A record of a project's problem, decisions, results, and lifecycle stored under `content/projects/` |
| Learning log | A date-centered learning record stored under `content/logs/` |
| Direct-share portfolio | An unlisted job portfolio reachable by `shareId`, excluded from public discovery, and not authenticated |
| Draft | Content visible during local development but excluded from production surfaces according to collection routing |
| Slug | The relative public route identifier, derived from the file path unless explicitly provided |
| Wiki-link | Obsidian-style `[[target]]` link resolved against paths, titles, and aliases |
| Backlink | A document that links to the current document through a resolved wiki-link |
| Related entry | A document selected from explicit links, category match, and shared tags |
| Attachment | A material file under `content/attachments/` embedded through an Obsidian-style link |
| Canonical category | A stable stored category value mapped to reader-facing Korean text by `src/lib/content/taxonomy.ts` |

## Harness Terms

| Term | Meaning |
|---|---|
| Harness | The complete agent operating-document system under `gilgob-harness/`, plus the root entry point |
| Constitution | `gilgob-harness/AGENTS.md`, the highest-priority project-specific agent rules |
| Session | One bounded agent work period with a goal and handoff state |
| Active task | Work that is genuinely in progress and recorded in `gilgob-harness/tasks/active.md` |
| ADR | Architecture Decision Record stored in `gilgob-harness/memory/decisions.md` |
| Human Approval Gate | A checkpoint where the agent must name the exact action and wait for user approval before mutation |
| Content Writer | Role responsible for creating and improving documents |
| Content Curator | Role responsible for inventory, organization, merge, archive, and deletion proposals |
