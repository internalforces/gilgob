<!--
Purpose:        Canonical entry point for the approval-gated guided learning workflow
Owner:          Learning Facilitator and Content Writer
Update Trigger: Learning workflow, roles, approval gates, or durable-content contract changes
Harness Version: 1.1
-->

# Guided Learning Workflow

## Purpose

Use this workflow to select an evidence-based learning topic, conduct an interactive session with only user-approved skills, and turn reviewed results into a draft through the existing Content Writer process.

## When to Use This Workflow

Use it for a request to choose what to learn, deepen an existing topic, investigate a learning-relevant problem, assess understanding, or turn an approved learning result into durable Knowledge Garden content. Do not use it to bypass collection, publication, or destructive-content approval gates.

## Roles and Boundaries

The Learning Facilitator selects and scopes topics, proposes skills, guides interactive learning, and structures the session result. The learner approves the topic, each session's skills, and the combined session synthesis and document proposal before a content handoff. The Content Writer owns creation or in-place update of durable content under the [Content Authoring Guide](../content-authoring/README.md). Content Curator handles content identity changes such as moves, merges, and deletions.

Use the operating instructions in the [Learning Facilitator Prompt](../../prompts/learning.md). Follow [Selecting a Learning Topic](topic-selection.md) for topic choice and [Running a Learning Session](session-workflow.md) for skill approval, tutoring, and closure.

## End-to-End Flow

```text
learning request
  -> inspect related content
  -> select and approve one scoped topic
  -> propose the smallest useful skill set
  -> HUMAN APPROVAL before skill use
  -> conduct the interactive session
  -> synthesize facts, demonstrated understanding, uncertainty, corrections, and open questions
  -> if content is recommended, prepare a create-or-update document proposal
  -> HUMAN APPROVAL of the session synthesis and document proposal
  -> Content Writer creates a verified draft or updates the approved target
```

## Existing Session Result Handoff

When the user supplies an already-completed learning result and asks only for durable content, do not rerun topic selection, request retrospective skill approval, or conduct another tutoring session. Validate the supplied result against the session synthesis categories, distinguish evidence from interpretation, check whether completion was actually demonstrated, and identify any missing information.

Load the smallest relevant Content Writer guidance, check duplicates and the dominant collection, then prepare a `create` or `update` proposal. Preview the normalized synthesis and proposal together and obtain user approval of both before the Content Writer creates or updates a file. If the supplied result is insufficient, request only the missing evidence or context instead of inventing it.

## Required Approval Gates

- The learner approves or revises the topic proposal before skill selection.
- The learner explicitly approves each exact selected skill before it is read or used; approval lasts only for the current session.
- A new skill needed mid-session requires new approval before use.
- Unavailable skills are never installed automatically.
- Installing a skill requires separate explicit user approval; session-use approval is not installation approval.
- When durable content is recommended, the learner approves the session synthesis and document proposal together before a Content Writer creates or updates a file.
- Existing approval requirements still govern publishing, moving, merging, deleting, deploying, and other gated actions.

## Durable Content Contract

The session result is a reviewable input, not authored content. Route any approved proposal through the [Content Authoring Guide](../content-authoring/README.md) and choose one dominant collection. A `create` action starts from its matching template with `draft: true`; an `update` action preserves the existing document's identity, creation metadata, and publication state unless the user separately approves changing them. Do not treat an AI response as evidence, infer mastery, claim an unperformed exercise, or store a raw session transcript in `content/`.

## Context Loading

Load context in this order:

1. `AGENTS.md` and `gilgob-harness/AGENTS.md`.
2. `gilgob-harness/memory/project.md` and `gilgob-harness/memory/session.md`.
3. This learning entry guide.
4. `gilgob-harness/docs/learning/topic-selection.md` and the smallest related `content/` evidence needed to select or scope a topic.
5. `gilgob-harness/docs/learning/session-workflow.md` before selecting skills or tutoring.
6. `gilgob-harness/prompts/content-writing.md`, `gilgob-harness/docs/content-authoring/README.md`, and exactly one collection guide before preparing a durable-content proposal; defer actual authorship until the user approves the synthesis and proposal.

This keeps loading selective: related content is allowed when it is evidence for topic selection, and the smallest relevant Content Writer guidance is allowed for a valid proposal while authorship remains deferred until approval.

## Completion Checklist

- [ ] The learner approved one scoped topic.
- [ ] Every used skill had explicit approval for this session.
- [ ] The learner had an opportunity to demonstrate understanding.
- [ ] The synthesis separates facts, understanding, uncertainty, corrections, and open questions.
- [ ] The synthesis and document proposal, if any, were previewed and approved together before Content Writer handoff.
- [ ] Any new document follows the existing collection guide and remains a verified draft until separately approved for publication; any update preserves the approved target's publication state unless separately changed.
