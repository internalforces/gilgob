<!--
Purpose:        Append-only record of significant project and Harness decisions in ADR form
Owner:          Architect and Researcher
Update Trigger: A significant technical or operational decision is accepted, superseded, or deprecated
Harness Version: 1.1
-->

# Decision Log: gilgob

_Last updated: 2026-08-21_

## ADR Format

```markdown
### ADR-NNN: Decision title

- Date: YYYY-MM-DD
- Status: Proposed | Accepted | Deprecated | Superseded
- Decided by: user or named role

Context: Why a decision was needed.

Decision: What was chosen.

Rationale: Why it was chosen.

Trade-offs: Costs and limitations.

Consequences: What future work must respect.
```

## ADR-001: Adopt AI Development Harness v1.1

- **Date:** 2026-08-21
- **Status:** Accepted
- **Decided by:** User

**Context:** Agent tasks were taking too long because project structure, commands, constraints, and completion criteria had to be rediscovered.

**Decision:** Adopt AI Development Harness v1.1 at the Standard tier, with a root discovery file and the full Harness under `gilgob-harness/`.

**Rationale:** A concise root entry point gives automatic discovery, while the dedicated directory keeps detailed operational context organized and selectively loadable.

**Trade-offs:** The Harness creates maintenance work and can become harmful if it drifts from code or duplicates mutable details.

**Consequences:** Agents read the constitution first, load only relevant guides, and update Harness facts when the corresponding project contract changes.

## ADR-002: Write Harness documentation in English

- **Date:** 2026-08-21
- **Status:** Accepted
- **Decided by:** User

**Context:** The authored Knowledge Garden is Korean, but the user requested English for agent-operating documentation.

**Decision:** Write the root agent entry point and all documents under `gilgob-harness/` in English. User-facing Knowledge Garden content remains Korean unless a request specifies otherwise.

**Rationale:** English operational documents provide consistent agent instructions while preserving the site's Korean reader experience.

**Trade-offs:** Contributors must keep the boundary between internal Harness language and published content language explicit.

**Consequences:** New or updated Harness documents use English; collection guides remind Content Writer to author site content in Korean by default.
