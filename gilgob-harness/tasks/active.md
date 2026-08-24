<!--
Purpose:        Track tasks that are genuinely in progress after the Harness becomes operational
Owner:          Planner and Implementer
Update Trigger: A tracked task starts, changes scope, becomes blocked, or completes
Harness Version: 1.1
-->

# Active Tasks: gilgob

_Last updated: 2026-08-24_

### HARNESS-002: Add an approval-gated guided learning workflow

- Owner: Architect, Learning Facilitator, Content Writer, and Implementer
- Priority: High
- Started: 2026-08-24
- Related decision or report: `docs/superpowers/specs/2026-08-24-learning-harness-design.md`

Description: Integrate topic generation, per-session skill approval, interactive learning, reviewed synthesis, and draft-content handoff into the existing documentation-based Harness.

Definition of done:

- [ ] Learning requests route through one canonical guide with all seven topic-selection modes.
- [ ] Every selected skill requires explicit, session-scoped approval before use.
- [ ] Session synthesis separates evidence, demonstrated understanding, provisional judgment, corrections, and open questions.
- [ ] Existing collection and draft safeguards govern every proposed learning document.
- [ ] Pure Harness documentation verification passes after the final edit.

Blockers: None.

## Entry Format

```markdown
### TASK-NNN: Task title

- Owner: active role
- Priority: High | Medium | Low
- Started: YYYY-MM-DD
- Related decision or report: path, or None

Description: Concrete requested outcome.

Definition of done:

- [ ] Verifiable condition
- [ ] Required tests or documentation checks

Blockers: None, or exact blocking condition.
```
