# Learning Harness Design

## Status

- Date: 2026-08-24
- Status: Approved in conversation, pending implementation
- Decision owner: User
- Implementation model: Documentation-based integration with the existing `gilgob-harness/`

## Purpose

Add a project-local learning workflow that helps the user select what to study, conduct an interactive learning session with explicitly approved skills, and turn demonstrated learning into a reviewed draft in the existing Knowledge Garden.

The workflow must preserve `content/` as the authored source, reuse the current collections and templates, and avoid adding dependencies, runtime services, schemas, or public routes.

## Scope

The implementation will:

- add a `Learning Facilitator` role to the Harness;
- define seven ways to generate a learning topic;
- define a session-scoped approval gate for every selected skill;
- guide interactive learning through diagnosis, scaffolding, practice, and teach-back;
- separate verified facts, demonstrated understanding, provisional judgments, corrected misunderstandings, and open questions;
- hand approved session results to the existing Content Writer workflow;
- create content only as `draft: true` unless a separate publication request is approved;
- document fallback behavior when a skill or evidence source is unavailable.

The implementation will not:

- add a custom Codex skill, executable learning tool, dependency, or external service;
- change the Astro application, content schemas, content templates, public URLs, or deployment behavior;
- persist raw conversation transcripts in `content/`;
- automatically install unavailable skills;
- infer that the user has mastered a topic;
- automatically move, merge, delete, or publish content.

## Roles and Boundaries

### Learning Facilitator

The Learning Facilitator owns the learning process:

1. identify or generate a scoped learning topic;
2. inspect related project content;
3. establish the central question, prerequisites, practice, and completion evidence;
4. select the smallest useful set of available skills;
5. obtain explicit user approval before using any selected skill;
6. conduct the learning session using only approved skills;
7. assess understanding only from the user's explanation, application, or observed practice;
8. structure the session result for review and handoff.

### Content Writer

The existing Content Writer owns durable content creation:

1. search for duplicate or overlapping documents;
2. select exactly one dominant collection for each proposed document;
3. start from the matching template;
4. distinguish evidence, user understanding, interpretation, and open questions;
5. create the approved document as `draft: true`;
6. connect useful existing documents and run collection-appropriate verification.

The Learning Facilitator does not bypass the Content Writer's schema, authorship, disclosure, or verification rules.

## Harness Files

### New files

```text
gilgob-harness/
├── prompts/
│   └── learning.md
└── docs/
    └── learning/
        ├── README.md
        ├── topic-selection.md
        └── session-workflow.md
```

- `prompts/learning.md` defines the Learning Facilitator role, startup context, operating rules, boundaries, and output.
- `docs/learning/README.md` is the learning workflow entry point and shared contract.
- `docs/learning/topic-selection.md` defines topic generation, scoping, duplication checks, and the topic proposal format.
- `docs/learning/session-workflow.md` defines skill approval, interactive tutoring, session closure, synthesis, and Content Writer handoff.

### Existing files to update

- `AGENTS.md`: route learning requests to the project learning guide.
- `gilgob-harness/AGENTS.md`: add the Learning Facilitator role and context-loading route.
- `gilgob-harness/ORCHESTRATOR.md`: add learning-topic and interactive-learning playbooks.
- `gilgob-harness/docs/content-authoring/README.md`: connect learning results to the existing collection-selection contract.
- `gilgob-harness/memory/decisions.md`: record the accepted documentation-based learning Harness and session-scoped skill approval decision.
- `gilgob-harness/tasks/active.md` and `gilgob-harness/tasks/completed.md`: track the implementation without altering unrelated task history.

The implementation must not modify existing untracked user files or generated output.

## Topic Generation

The Learning Facilitator supports seven entry modes.

| Mode | Starting evidence | Intended result |
|---|---|---|
| Project-based | A registered document in `content/projects/` | Extract concepts, constraints, and design principles that are genuinely present in the project |
| User-specified | A topic supplied by the user | Narrow the topic to one answerable central learning question |
| Existing-topic deepening | An existing knowledge, exploration, project, or log document | Produce a deeper question, follow-up practice, or unresolved edge case |
| Knowledge-gap discovery | Existing documents and their meaningful relationships | Identify missing prerequisites or useful disconnected concepts without claiming that every absence must be studied |
| Problem-based | An observed error, test failure, review finding, or implementation difficulty | Convert the concrete problem into a question about the underlying mechanism |
| Goal-based | A capability or outcome the user wants | Decompose the outcome into ordered learning topics |
| Understanding check | The user's explanation or application of existing material | Select a follow-up topic from demonstrated gaps rather than assumed weakness |

Freshness review, technology comparison, and prerequisite tracing are cross-cutting strategies, not additional entry modes.

### Topic proposal

Before selecting skills or beginning instruction, present:

```text
Learning topic
Selection evidence
Central question
Prerequisites
Learning stages
Practice
Completion evidence
Related existing documents
```

The user approves or revises this scope before skill selection.

### Topic safeguards

- Search existing indexed content before proposing a new document.
- Prefer deepening an existing document when it already owns the same central question.
- Split topics that cannot be learned or assessed coherently in one session.
- Do not invent project technologies, failures, review findings, or knowledge gaps.
- Treat a missing document as an observation, not proof of a learning priority.
- Activate only the topic selected by the user; leave other candidates as proposals.

## Skill Approval Contract

No skill may be used for a learning session before the user explicitly approves it.

### Selection policy

Recommend the smallest useful combination:

- zero or one teaching skill;
- zero or one domain skill;
- research or visualization capabilities only when needed.

Prefer an available learning-oriented skill for conceptual tutoring, but do not assume that it is installed or approved. Domain skills supplement the teaching method; they do not replace the learning workflow.

### Approval request

Before invoking a skill, show:

- the exact skill name;
- whether it is the teaching or domain skill;
- why it is relevant to the approved topic;
- what it will change about the learning process;
- a clear statement that it has not yet been used.

The user may approve all, approve a subset, request a replacement, request more explanation, or continue without skills.

### Approval lifetime

- Approval applies only to the current learning session.
- An approved skill may be reused within that session without repeated approval.
- Every new session requires a new approval, even for the same topic.
- A newly needed skill pauses the session and requires additional approval.
- Rejected skills must not be substituted or invoked indirectly.
- Skill installation is a separate action and requires its own explicit approval.

If an approved skill becomes unavailable, report the limitation and offer an unskilled or evidence-based fallback. Do not install it automatically.

## Interactive Learning Session

After topic and skill approval, use this rhythm:

```text
diagnose current understanding
  -> give one small explanation, hint, parallel example, or visual scaffold
  -> ask one focused question
  -> receive the user's reasoning
  -> give specific correction or confirmation
  -> practice with an example, counterexample, prediction, or experiment
  -> ask the user to explain or apply the idea
```

### Session rules

- Diagnose before choosing the teaching depth unless the user's work already demonstrates it.
- Keep each turn focused; do not present a wall of questions.
- Explain directly when prerequisites are missing, then return control to the learner.
- Use hints and parallel examples when the learner has the necessary pieces.
- Treat prediction, teach-back, and transfer to a new case as stronger evidence than passive agreement.
- Correct errors specifically instead of hiding them behind generic praise.
- Do not infer learning outcomes the user has not demonstrated.
- Distinguish a tutoring request from a request to complete assessed work and preserve academic integrity when applicable.

### Session closure

Close the session when one of these conditions is met:

- the approved completion evidence has been demonstrated;
- the user asks to stop;
- a missing prerequisite should become a separate learning topic;
- external evidence or an experiment is required before continuing;
- the scope has split into independent questions.

Skill approvals expire when the session closes.

## Session Synthesis

Do not write a content file immediately when the session ends. First classify and show the result:

| Category | Required treatment |
|---|---|
| Verified facts | Identify supporting code, experiment, or reliable source |
| Demonstrated understanding | Record only what the user explained, predicted, or applied |
| Provisional judgments | Mark as interpretation or requiring verification |
| Corrected misunderstandings | Preserve the meaningful before-and-after distinction |
| Open questions | Keep concrete follow-up questions without implying resolution |
| Next actions | Name a practice, investigation, or document outcome |

The preview must include:

- learning goal;
- approved skills actually used;
- whether the completion evidence was demonstrated;
- classified session findings;
- recommended collection, proposed path, document purpose, and related documents.

The user approves the document proposal before the Content Writer creates a file.

## Content Routing

Use the existing collection contract:

| Dominant result | Collection |
|---|---|
| A date-centered learning event | `content/logs/` |
| An unresolved central question or investigation | `content/explorations/` |
| A verified and reusable explanation | `content/knowledge/` |
| A durable project decision, result, or maintenance fact | `content/projects/` |

Prefer one representative document from a session. Propose multiple documents only when each has an independent purpose.

### Draft safeguards

- Start every generated learning document with `draft: true`.
- Do not copy the raw transcript into authored content.
- Do not use an AI response as evidence by itself.
- Do not record exercises, results, or understanding that did not occur.
- Mark uncertainty explicitly when evidence is incomplete.
- Do not expose skill names in reader-facing content unless they are materially relevant to the subject.
- Do not assign `mastered` or `complete` from AI judgment alone.
- Prefer `seed` for a new knowledge draft; use `growing` only when the content evidence supports it.
- Use `active` for an exploration that has an open question and defined next action.

Publication, content moves, merges, and deletions remain governed by the existing approval gates.

## Error and Fallback Behavior

- If no relevant skill is available or approved, continue with the documented general learning workflow when the user agrees.
- If evidence is unavailable, keep the claim provisional or defer document creation; never fabricate support.
- If the topic branches, preserve the current question and propose separate follow-up sessions.
- If a content identity change is needed, hand off to Content Curator before mutation.
- If a schema, UI, runtime, or dependency change becomes necessary, stop the content workflow and route to the appropriate project role.

## Verification

The initial implementation changes only Harness documentation. It must pass:

- required Harness header checks;
- internal path and link target checks;
- unfinished-token scans for `TODO`, `TBD`, placeholders, or empty required sections;
- `git diff --check`;
- focused review of every changed file against this design.

Future learning-content creation follows the existing verification contract:

- draft content: `npm run check` and `npm run build`;
- publication: `npm run verify`;
- production-equivalent checks when routes, links, assets, metadata, or navigation are materially affected.

## Acceptance Criteria

The learning Harness is complete when:

1. a learning request routes to one documented entry point;
2. all seven topic-generation modes have evidence and scoping rules;
3. no skill can be used before session-scoped user approval;
4. adding a skill mid-session requires a new approval;
5. the session workflow requires diagnosis, active learner participation, and demonstrated understanding;
6. synthesis separates facts, demonstrated understanding, provisional judgments, corrections, and open questions;
7. document creation requires a reviewed proposal and uses the existing Content Writer workflow;
8. generated learning content defaults to `draft: true` and existing collection templates;
9. no dependency, schema, application, route, template, or publication behavior changes;
10. all Harness documentation checks pass without altering unrelated user files.

