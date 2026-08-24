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

The Learning Facilitator selects and scopes topics, proposes skills, guides interactive learning, and structures the session result. The learner approves the topic, each session's skills, and any document proposal. The Content Writer owns creation of durable drafts under the [Content Authoring Guide](../content-authoring/README.md). Content Curator handles content identity changes such as moves, merges, and deletions.

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
  -> HUMAN APPROVAL of the document proposal
  -> Content Writer creates a verified draft
```

## Required Approval Gates

- The learner approves or revises the topic proposal before skill selection.
- The learner explicitly approves each exact selected skill before it is read or used; approval lasts only for the current session.
- A new skill needed mid-session requires new approval before use.
- Unavailable skills are never installed automatically.
- Installing a skill requires separate explicit user approval; session-use approval is not installation approval.
- The learner approves a document proposal before a Content Writer creates a file.
- Existing approval requirements still govern publishing, moving, merging, deleting, deploying, and other gated actions.

## Durable Content Contract

The session result is a reviewable input, not authored content. Route any approved proposal through the [Content Authoring Guide](../content-authoring/README.md), choose one dominant collection, use its matching template, and create it as `draft: true`. Do not treat an AI response as evidence, infer mastery, claim an unperformed exercise, or store a raw session transcript in `content/`.

## Context Loading

Load context in this order:

1. `AGENTS.md` and `gilgob-harness/AGENTS.md`.
2. `gilgob-harness/memory/project.md` and `gilgob-harness/memory/session.md`.
3. This learning entry guide.
4. `gilgob-harness/docs/learning/topic-selection.md` and the smallest related `content/` evidence needed to select or scope a topic.
5. `gilgob-harness/docs/learning/session-workflow.md` before selecting skills or tutoring.
6. `gilgob-harness/prompts/content-writing.md`, `gilgob-harness/docs/content-authoring/README.md`, and exactly one collection guide only after the user approves a durable-content proposal.

This keeps loading selective: related content is allowed when it is evidence for topic selection, while Content Writer guidance remains deferred until an approved handoff.

## Completion Checklist

- [ ] The learner approved one scoped topic.
- [ ] Every used skill had explicit approval for this session.
- [ ] The learner had an opportunity to demonstrate understanding.
- [ ] The synthesis separates facts, understanding, uncertainty, corrections, and open questions.
- [ ] A document proposal, if any, was previewed and approved before Content Writer handoff.
- [ ] Any resulting document follows the existing collection guide and remains a verified draft until separately approved for publication.
