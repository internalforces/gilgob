# Learning Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate an approval-gated, skill-assisted learning workflow into the existing documentation-based gilgob Harness.

**Architecture:** Add one Learning Facilitator prompt and three focused learning guides, then route learning requests through the existing constitution, orchestrator, and content-authoring workflow. Keep the feature entirely in English Markdown Harness documentation; reuse existing content collections and templates without changing application code, schemas, dependencies, routes, or publication behavior.

**Tech Stack:** English Markdown operational documentation, existing `gilgob-harness/` conventions, shell-based documentation validation, Git.

**Spec:** `docs/superpowers/specs/2026-08-24-learning-harness-design.md`

## Global Constraints

- Preserve `content/` as the authored source of truth and do not modify current content documents.
- Add no custom Codex skill, executable learning tool, dependency, external service, schema, route, or template.
- Require explicit user approval before every skill is first used in a learning session; approval expires when that session ends.
- Require additional approval before adding a skill during an active session.
- Never install an unavailable skill automatically.
- Treat AI output as instruction or synthesis, not evidence by itself.
- Create learning content only through the existing Content Writer workflow and default every generated document to `draft: true`.
- Do not infer mastery, completed learning, project facts, failures, or sources.
- Write all new and revised Harness documentation in English.
- Preserve unrelated tracked and untracked user changes; stage and commit only the files named by each task.

---

### Task 1: Add the Learning Facilitator and core learning guides

**Files:**
- Create: `gilgob-harness/prompts/learning.md`
- Create: `gilgob-harness/docs/learning/README.md`
- Create: `gilgob-harness/docs/learning/topic-selection.md`
- Create: `gilgob-harness/docs/learning/session-workflow.md`
- Modify: `gilgob-harness/tasks/active.md:10-31`

**Interfaces:**
- Consumes: the role, selective-context, approval, and content restrictions in `gilgob-harness/AGENTS.md`; collection contracts in `gilgob-harness/docs/content-authoring/README.md`; approved behavior in the design spec.
- Produces: one canonical learning entry point at `gilgob-harness/docs/learning/README.md`, a role prompt at `gilgob-harness/prompts/learning.md`, and two linked operational guides used by Task 2 routing.

- [ ] **Step 1: Verify that the new learning files do not exist**

Run:

```bash
test ! -e gilgob-harness/prompts/learning.md \
  && test ! -e gilgob-harness/docs/learning/README.md \
  && test ! -e gilgob-harness/docs/learning/topic-selection.md \
  && test ! -e gilgob-harness/docs/learning/session-workflow.md
```

Expected: exit status 0, confirming this task creates a new boundary rather than overwriting undocumented files.

- [ ] **Step 2: Record HARNESS-002 as active**

Replace the empty active-task state with this entry and set `_Last updated_` to `2026-08-24`:

```markdown
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
```

Keep the existing `## Entry Format` section after the active task.

- [ ] **Step 3: Create the Learning Facilitator prompt**

Create `gilgob-harness/prompts/learning.md` with the standard Harness comment header and these exact top-level sections:

```markdown
# Learning Facilitator Prompt

## Role
## Start Here
## Topic Contract
## Skill Approval Gate
## Session Method
## Synthesis and Handoff
## Boundaries
## Output
```

The prompt must require this startup order:

1. root `AGENTS.md` and `gilgob-harness/AGENTS.md`;
2. `gilgob-harness/docs/learning/README.md`;
3. `gilgob-harness/docs/learning/topic-selection.md` when selecting or revising a topic;
4. `gilgob-harness/docs/learning/session-workflow.md` before selecting skills or tutoring;
5. related `content/` documents and the Content Writer guides only when proposing durable content.

State explicitly that the facilitator proposes exact skill names and roles but does not read or invoke a selected skill before user approval. State that installed-skill discovery may use available metadata, while unavailable skills are reported rather than installed. Require one focused question per tutoring turn, demonstrated understanding before completion claims, a structured synthesis preview, and user approval before Content Writer handoff.

- [ ] **Step 4: Create the learning entry guide**

Create `gilgob-harness/docs/learning/README.md` with the standard Harness comment header and these top-level sections:

```markdown
# Guided Learning Workflow

## Purpose
## When to Use This Workflow
## Roles and Boundaries
## End-to-End Flow
## Required Approval Gates
## Durable Content Contract
## Context Loading
## Completion Checklist
```

The end-to-end flow must be:

```text
learning request
  -> inspect related content
  -> select and approve one scoped topic
  -> propose the smallest useful skill set
  -> HUMAN APPROVAL before skill use
  -> conduct the interactive session
  -> synthesize facts, demonstrated understanding, uncertainty, corrections, and open questions
  -> HUMAN APPROVAL of the document proposal
  -> Content Writer creates a verified draft
```

Link directly to `gilgob-harness/docs/learning/topic-selection.md`, `gilgob-harness/docs/learning/session-workflow.md`, `gilgob-harness/prompts/learning.md`, and `gilgob-harness/docs/content-authoring/README.md` instead of copying their mutable details.

- [ ] **Step 5: Create the topic-selection guide**

Create `gilgob-harness/docs/learning/topic-selection.md` with the standard Harness comment header and these top-level sections:

```markdown
# Selecting a Learning Topic

## Required Evidence
## Seven Entry Modes
## Cross-Cutting Strategies
## Scoping Workflow
## Topic Proposal
## Duplicate and Boundary Rules
## Topic Approval Checklist
```

Define these seven modes exactly: Project-based, User-specified, Existing-topic deepening, Knowledge-gap discovery, Problem-based, Goal-based, and Understanding check. For each mode, name the accepted starting evidence, the output it may support, and the fabrication or overreach to avoid. Define freshness review, technology comparison, and prerequisite tracing as cross-cutting strategies.

Require the topic proposal to contain `Learning topic`, `Selection evidence`, `Central question`, `Prerequisites`, `Learning stages`, `Practice`, `Completion evidence`, and `Related existing documents`. Require user topic approval before skill selection.

- [ ] **Step 6: Create the session workflow guide**

Create `gilgob-harness/docs/learning/session-workflow.md` with the standard Harness comment header and these top-level sections:

```markdown
# Running a Learning Session

## Preconditions
## Skill Selection
## Initial Skill Approval
## Mid-Session Skill Approval
## Interactive Learning Rhythm
## Completion Evidence and Closure
## Session Synthesis
## Content Proposal and Handoff
## Fallback and Interruption Rules
## Session Checklist
```

Include an initial approval template that names each skill, labels it as teaching or domain support, explains why it is relevant and how it affects the session, and says it has not been used. Define approval as session-scoped, permit reuse only within that session, and require new approval for mid-session additions and every later session.

Require synthesis into `Verified facts`, `Demonstrated understanding`, `Provisional judgments`, `Corrected misunderstandings`, `Open questions`, and `Next actions`. Route the dominant result to `logs`, `explorations`, `knowledge`, or `projects` through the existing authoring guide. Require a preview and user approval before file creation.

- [ ] **Step 7: Validate the core learning files**

Run:

```bash
for file in \
  gilgob-harness/prompts/learning.md \
  gilgob-harness/docs/learning/README.md \
  gilgob-harness/docs/learning/topic-selection.md \
  gilgob-harness/docs/learning/session-workflow.md; do
  head -n 6 "$file" | rg -q 'Purpose:'
  head -n 6 "$file" | rg -q 'Owner:'
  head -n 6 "$file" | rg -q 'Update Trigger:'
  head -n 6 "$file" | rg -q 'Harness Version: 1.1'
done
rg -n '^## (Seven Entry Modes|Initial Skill Approval|Mid-Session Skill Approval|Session Synthesis)$' \
  gilgob-harness/docs/learning/topic-selection.md \
  gilgob-harness/docs/learning/session-workflow.md
rg -n 'Project-based|User-specified|Existing-topic deepening|Knowledge-gap discovery|Problem-based|Goal-based|Understanding check' \
  gilgob-harness/docs/learning/topic-selection.md
rg -n '\b(TODO|TBD)\b' \
  gilgob-harness/prompts/learning.md \
  gilgob-harness/docs/learning || true
git diff --check -- gilgob-harness/prompts/learning.md gilgob-harness/docs/learning gilgob-harness/tasks/active.md
```

Expected: all header and required-section checks pass; all seven modes are found; the unfinished-token scan prints nothing; `git diff --check` prints nothing.

- [ ] **Step 8: Commit the core workflow**

```bash
git add -- \
  gilgob-harness/prompts/learning.md \
  gilgob-harness/docs/learning/README.md \
  gilgob-harness/docs/learning/topic-selection.md \
  gilgob-harness/docs/learning/session-workflow.md \
  gilgob-harness/tasks/active.md
git commit -m "docs(harness): add guided learning workflow"
```

### Task 2: Route learning requests and connect content handoff

**Files:**
- Modify: `AGENTS.md:10-19`
- Modify: `gilgob-harness/AGENTS.md:12,48-62,91-116`
- Modify: `gilgob-harness/ORCHESTRATOR.md:10-115`
- Modify: `gilgob-harness/docs/content-authoring/README.md:10-47`

**Interfaces:**
- Consumes: the canonical learning paths and approval contract created in Task 1.
- Produces: automatic project routing from a learning request to the Learning Facilitator, then a controlled handoff into existing collection authoring.

- [ ] **Step 1: Confirm that the current routing does not yet mention the learning guide**

Run:

```bash
! rg -n 'docs/learning/README.md|Learning Facilitator|Guided Learning Workflow' \
  AGENTS.md \
  gilgob-harness/AGENTS.md \
  gilgob-harness/ORCHESTRATOR.md \
  gilgob-harness/docs/content-authoring/README.md
```

Expected: exit status 0 before these files are modified.

- [ ] **Step 2: Add the root discovery route**

Add this non-negotiable rule to `AGENTS.md` without duplicating the detailed workflow:

```markdown
- Route requests to select a study topic, conduct an interactive learning session, or draft learning from a session through `gilgob-harness/docs/learning/README.md`.
```

- [ ] **Step 3: Add the Learning Facilitator to the constitution**

Set `_Last updated_` to `2026-08-24`. Add this Active Roles row:

```markdown
| Learning Facilitator | Select scoped learning topics, obtain skill approval, guide sessions, and synthesize demonstrated learning | Reviewed session synthesis and Content Writer handoff |
```

Add this context-loading route:

```markdown
| Learning topic selection or interactive study | `gilgob-harness/prompts/learning.md` and `gilgob-harness/docs/learning/README.md` |
```

Add a human approval gate stating that every skill proposed for a learning session requires explicit approval before first use and that a new skill added mid-session requires additional approval. Keep dependency installation as the existing separate approval gate.

- [ ] **Step 4: Add learning playbooks to the orchestrator**

Set `_Last updated_` to `2026-08-24`. Insert these workflows before Content Writing Workflow:

```text
Learning Facilitator: inspect evidence -> propose one scoped topic
  -> HUMAN APPROVAL: topic and completion evidence
  -> propose the smallest useful skill set
  -> HUMAN APPROVAL: every selected skill before use
  -> conduct diagnosis, scaffolded learning, practice, and teach-back
  -> present classified session synthesis and document proposal
  -> HUMAN APPROVAL: durable document proposal
  -> Content Writer: create and verify draft content
```

Add a short rule that topic selection uses `gilgob-harness/docs/learning/topic-selection.md`, session execution uses `gilgob-harness/docs/learning/session-workflow.md`, and no skill approval carries into another learning session.

Add two rows to Approval Summary:

```markdown
| Approve the scoped topic and completion evidence before a learning session | Yes |
| Use a selected skill for the first time in the current learning session | Yes |
```

- [ ] **Step 5: Connect learning synthesis to content authoring**

Add a `## Learning Session Handoff` section after `## Choose the Collection`. State that Content Writer begins only after the user approves the Learning Facilitator's synthesis and document proposal. Require Content Writer to re-check duplicates, evidence, dominant collection, and `draft: true`; prohibit treating AI dialogue as evidence or inferring mastery.

Use this routing table:

| Session result | Collection |
|---|---|
| Date-centered event, attempt, or correction | `logs` |
| Unresolved central question with a next action | `explorations` |
| Verified reusable explanation | `knowledge` |
| Durable project decision, result, or maintenance state | `projects` |

- [ ] **Step 6: Validate routing and link targets**

Run:

```bash
test -f gilgob-harness/docs/learning/README.md
test -f gilgob-harness/docs/learning/topic-selection.md
test -f gilgob-harness/docs/learning/session-workflow.md
test -f gilgob-harness/prompts/learning.md
rg -n 'Learning Facilitator|docs/learning/README.md' \
  AGENTS.md gilgob-harness/AGENTS.md gilgob-harness/ORCHESTRATOR.md
rg -n 'Learning Session Handoff|draft: true|AI dialogue' \
  gilgob-harness/docs/content-authoring/README.md
rg -n '\b(TODO|TBD)\b' \
  AGENTS.md gilgob-harness/AGENTS.md gilgob-harness/ORCHESTRATOR.md \
  gilgob-harness/docs/content-authoring/README.md || true
git diff --check -- \
  AGENTS.md gilgob-harness/AGENTS.md gilgob-harness/ORCHESTRATOR.md \
  gilgob-harness/docs/content-authoring/README.md
```

Expected: all targets exist; routing and handoff terms are found; the unfinished-token scan and `git diff --check` print nothing.

- [ ] **Step 7: Commit the routing integration**

```bash
git add -- \
  AGENTS.md \
  gilgob-harness/AGENTS.md \
  gilgob-harness/ORCHESTRATOR.md \
  gilgob-harness/docs/content-authoring/README.md
git commit -m "docs(harness): route approval-gated learning sessions"
```

### Task 3: Record the decision, verify the Harness, and close the task

**Files:**
- Modify: `gilgob-harness/memory/decisions.md:10,63`
- Modify: `gilgob-harness/tasks/active.md:10-32`
- Modify: `gilgob-harness/tasks/completed.md:10-18`

**Interfaces:**
- Consumes: the complete learning workflow and routing from Tasks 1 and 2.
- Produces: an accepted durable decision, fresh verification evidence, no active HARNESS-002 entry, and an append-only completion record.

- [ ] **Step 1: Append the accepted architecture decision**

Set `_Last updated_` to `2026-08-24` and append:

```markdown
## ADR-003: Integrate approval-gated guided learning into the Harness

- **Date:** 2026-08-24
- **Status:** Accepted
- **Decided by:** User

**Context:** The Knowledge Garden needs a repeatable way to select study topics, learn through dialogue, and convert demonstrated understanding into durable draft content without treating AI output as evidence.

**Decision:** Add a documentation-based Learning Facilitator workflow to `gilgob-harness/`. Every proposed skill requires explicit approval before first use in a learning session, new mid-session skills require additional approval, and all approvals expire when the session ends. Approved session synthesis enters the existing Content Writer workflow instead of creating a new collection or runtime system.

**Rationale:** This reuses installed teaching and domain skills while keeping the user in control of the learning method and preserving the current file-backed content architecture.

**Trade-offs:** The workflow is instruction-enforced rather than programmatically enforced, available skills vary by environment, and explicit approval adds a step before tutoring begins.

**Consequences:** Learning requests load the learning prompt and guide, skill selection remains minimal and session-scoped, unavailable skills are never installed automatically, and durable learning content remains subject to existing evidence, draft, schema, and verification rules.
```

- [ ] **Step 2: Run the complete pure-Harness documentation gate**

Run:

```bash
harness_files=(
  gilgob-harness/prompts/learning.md
  gilgob-harness/docs/learning/README.md
  gilgob-harness/docs/learning/topic-selection.md
  gilgob-harness/docs/learning/session-workflow.md
  gilgob-harness/AGENTS.md
  gilgob-harness/ORCHESTRATOR.md
  gilgob-harness/docs/content-authoring/README.md
  gilgob-harness/memory/decisions.md
  gilgob-harness/tasks/active.md
  gilgob-harness/tasks/completed.md
)
for file in "${harness_files[@]}"; do
  head -n 6 "$file" | rg -q 'Purpose:'
  head -n 6 "$file" | rg -q 'Owner:'
  head -n 6 "$file" | rg -q 'Update Trigger:'
  head -n 6 "$file" | rg -q 'Harness Version: 1.1'
done
test -f gilgob-harness/docs/learning/README.md
test -f gilgob-harness/docs/learning/topic-selection.md
test -f gilgob-harness/docs/learning/session-workflow.md
test -f gilgob-harness/prompts/learning.md
rg -n 'Project-based|User-specified|Existing-topic deepening|Knowledge-gap discovery|Problem-based|Goal-based|Understanding check' \
  gilgob-harness/docs/learning/topic-selection.md
rg -n 'explicit.*approval|session' \
  gilgob-harness/prompts/learning.md \
  gilgob-harness/docs/learning/session-workflow.md \
  gilgob-harness/AGENTS.md
rg -n 'Verified facts|Demonstrated understanding|Provisional judgments|Corrected misunderstandings|Open questions|Next actions' \
  gilgob-harness/docs/learning/session-workflow.md
rg -n '\b(TODO|TBD)\b' "${harness_files[@]}" AGENTS.md || true
git diff --check -- AGENTS.md gilgob-harness
```

Expected: every header, file, topic mode, approval term, and synthesis category check passes; unfinished-token scan and `git diff --check` print nothing.

- [ ] **Step 3: Review the scoped diff against the design acceptance criteria**

Run:

```bash
git diff -- \
  AGENTS.md \
  gilgob-harness/AGENTS.md \
  gilgob-harness/ORCHESTRATOR.md \
  gilgob-harness/prompts/learning.md \
  gilgob-harness/docs/learning \
  gilgob-harness/docs/content-authoring/README.md \
  gilgob-harness/memory/decisions.md \
  gilgob-harness/tasks/active.md \
  gilgob-harness/tasks/completed.md
```

Expected: only the approved learning Harness files and routing, decision, and task records differ; no content, source, dependency, schema, template, generated, or deployment file appears.

- [ ] **Step 4: Move HARNESS-002 from active to completed**

After Steps 2 and 3 pass, restore `gilgob-harness/tasks/active.md` to its empty-state text with `_Last updated: 2026-08-24_`. Add this append-only row to `gilgob-harness/tasks/completed.md` and set its update date to `2026-08-24`:

```markdown
| HARNESS-002 | Add approval-gated topic selection, interactive learning, session synthesis, and draft-content handoff | 2026-08-24 | Architect, Learning Facilitator, Content Writer, and Implementer | Harness header, path, routing, approval, synthesis, unfinished-token, scoped-diff, and `git diff --check` validation |
```

- [ ] **Step 5: Re-run final checks after task-record updates**

Run:

```bash
rg -n 'No active operational task is recorded' gilgob-harness/tasks/active.md
rg -n '^\| HARNESS-002 \|' gilgob-harness/tasks/completed.md
rg -n '\b(TODO|TBD)\b' \
  AGENTS.md \
  gilgob-harness/AGENTS.md \
  gilgob-harness/ORCHESTRATOR.md \
  gilgob-harness/prompts/learning.md \
  gilgob-harness/docs/learning \
  gilgob-harness/docs/content-authoring/README.md \
  gilgob-harness/memory/decisions.md \
  gilgob-harness/tasks/active.md \
  gilgob-harness/tasks/completed.md || true
git diff --check -- AGENTS.md gilgob-harness
git status --short
```

Expected: the empty active state and HARNESS-002 completion row are found; unfinished-token scan and `git diff --check` print nothing; `git status --short` shows only scoped implementation changes plus pre-existing unrelated user files.

- [ ] **Step 6: Commit the accepted decision and completion evidence**

```bash
git add -- \
  gilgob-harness/memory/decisions.md \
  gilgob-harness/tasks/active.md \
  gilgob-harness/tasks/completed.md
git commit -m "docs(harness): record guided learning decision"
```

- [ ] **Step 7: Confirm repository state without touching unrelated files**

Run:

```bash
git log -4 --oneline
git status --short
```

Expected: the three implementation commits are visible after the design commit; pre-existing `.impeccable/design.json`, `DESIGN.md`, and `content/explorations/` remain untracked and unmodified unless their state was independently changed by the user.
