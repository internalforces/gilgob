<!--
Purpose:        Collection-specific method for documenting project problems, decisions, implementation, results, and lifecycle
Owner:          Content Writer and Architect
Update Trigger: Project schema, lifecycle states, presentation, or evidence expectations change
Harness Version: 1.1
-->

# Writing Project Documents

Use `content/projects/` for the durable technical and product record of a project: why it exists, what constraints shaped it, what was built, how it was verified, and what state it is in now.

Start from `content/templates/project.md`. A current example is `content/projects/signal-hub.md`.

## Good Fit

- A planned or implemented software, research, data, or creative project.
- A record of architecture, scope, commands, releases, and maintenance status.
- A public technical reference connected to a direct-share portfolio.

Keep general technical explanations in knowledge documents and link them. Keep application-targeted personal evidence in portfolio documents.

## Required Status

| Status | Use when |
|---|---|
| `idea` | Problem and possible direction exist, but implementation is not underway |
| `building` | Implementation or validation is actively progressing |
| `maintained` | The project provides its intended current value and receives maintenance or incremental improvement |
| `archived` | Active maintenance has ended; document the final state, reason, and known limitations |

Do not use `maintained` merely because a repository exists. State the actual supported scope and current version only when verified.

## Frontmatter

| Field group | Requirement |
|---|---|
| `title`, `description`, `category`, `tags`, `created`, `draft`, `aliases`, `featured` | Required; follow the shared contract |
| `status` | Required: `idea`, `building`, `maintained`, or `archived` |
| `updated` | Optional; use for a material revision or lifecycle change |
| `slug` | Optional safe route override |
| `nextQuestions` | Optional open questions |
| `repository` | Optional public HTTPS repository URL |

See `gilgob-harness/docs/content-authoring/README.md` for exact shared field rules. Do not add a private, unavailable, or guessed repository link. Use `featured: true` only when the project is intentionally selected for home-page emphasis.

## Recommended Structure

1. **Project summary:** Lead with the current value and form of the project.
2. **Problem:** Explain the real need and user or learning context.
3. **Constraints and scope:** State supported inputs, environments, and deliberate exclusions.
4. **Architecture or workflow:** Show component boundaries and data flow.
5. **Key decisions:** Explain choices, rationale, and trade-offs.
6. **Usage or reproduction:** Provide exact commands or examples when public and stable.
7. **Verification and results:** Name tests, releases, measurements, or artifacts that actually exist.
8. **Current limitations:** State known boundaries without disguising them as future promises.
9. **Related links:** Connect repository, package, knowledge, exploration, and portfolio records where useful.

## Evidence Standard

- Verify package versions, supported runtimes, commands, repository URLs, and feature lists against the project source.
- Describe personal contribution precisely; distinguish solo work, shared work, and external components.
- Use measurements only with their method, environment, and date.
- Describe planned work as planned, not delivered.
- Preserve important negative decisions and excluded scope when they explain maintainability.

## Lifecycle Updates

When status changes:

- update `updated`;
- explain what changed in the body;
- verify links and public commands;
- remove or label stale claims instead of leaving contradictory versions;
- record archival reasons and recovery or successor information for `archived` projects.

Moving to `archived` is an in-place lifecycle update, not permission to delete the project document.

## Anti-Patterns

- A feature list copied from a repository without problem or trade-off context.
- Future plans described as completed results.
- Unsupported claims such as “production-ready,” “secure,” or “high performance.”
- Hiding limitations that materially affect use.
- Duplicating a portfolio narrative verbatim.
- Updating status without updating the current-state explanation.

## Publication Checklist

- [ ] Problem, constraints, current scope, and status agree.
- [ ] Commands, versions, URLs, and supported features are verified.
- [ ] Key decisions explain rationale and trade-offs.
- [ ] Results are evidence-backed and future work is labeled.
- [ ] General knowledge and portfolio-specific evidence are linked rather than duplicated.
- [ ] Repository URL is HTTPS and intentionally public when present.
- [ ] Shared publication checks in `gilgob-harness/docs/content-authoring/README.md` pass.
