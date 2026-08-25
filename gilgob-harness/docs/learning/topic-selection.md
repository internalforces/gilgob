<!--
Purpose:        Evidence, scoping, and approval rules for choosing one learning topic
Owner:          Learning Facilitator
Update Trigger: Topic modes, selection evidence, or topic-approval contract changes
Harness Version: 1.1
-->

# Selecting a Learning Topic

## Required Evidence

Base a topic on the user's stated aim, a related `content/` document, an observed problem, or demonstrated understanding. Inspect the relevant material before drawing conclusions. Record unknown or incomplete evidence as such; a missing document is an observation, not proof that the topic is a priority.

## Seven Entry Modes

| Mode | Accepted starting evidence | Output it may support | Fabrication or overreach to avoid |
|---|---|---|---|
| Project-based | A registered document in `content/projects/` | Concepts, constraints, or design principles genuinely present in that project | Do not invent project technologies, outcomes, or constraints. |
| User-specified | A topic supplied by the user | One answerable central learning question | Do not expand a broad request into an unapproved curriculum or assume its context. |
| Existing-topic deepening | An existing knowledge, exploration, project, or log document | A deeper question, follow-up practice, or unresolved edge case | Do not duplicate the document's central question or claim an unresolved issue exists without evidence. |
| Knowledge-gap discovery | Existing documents and their meaningful relationships | A missing prerequisite or useful disconnected concept to consider | Do not claim that every absence must be studied or that a missing document proves a gap. |
| Problem-based | An observed error, test failure, review finding, or implementation difficulty | A question about the underlying mechanism | Do not invent errors, findings, causes, or a confirmed fix. |
| Goal-based | A capability or outcome the user wants | Ordered learning topics that support the goal | Do not promise the outcome or assume prerequisites, schedule, or assessment criteria. |
| Understanding check | The user's explanation or application of existing material | A follow-up topic from demonstrated gaps | Do not infer weakness or mastery beyond the learner's demonstrated explanation or practice. |

## Cross-Cutting Strategies

Use freshness review to check whether dated evidence, technologies, or practices need current confirmation before relying on them. Use technology comparison to clarify a decision among real alternatives without inventing capabilities. Use prerequisite tracing to identify concepts needed to answer the central question; it supplements the seven modes rather than creating an eighth mode.

## Scoping Workflow

1. Identify the entry mode and inspect its accepted evidence.
2. Search related indexed content for overlap, prerequisites, and useful links.
3. Narrow the request to one central question with bounded practice and completion evidence.
4. Split independent questions or missing prerequisites into separate proposals.
5. Present the topic proposal and obtain user approval before skill selection.

## Topic Proposal

Present this exact structure before selecting skills or beginning instruction:

```text
Learning topic
Selection evidence
Central question
Prerequisites
Learning stages
Practice
Completion evidence
Related existing documents
Document action: none | create | update
Target document: <existing path or not applicable>
```

Use `update` when an existing document already owns the central question and the expected durable outcome would deepen that document. Use `create` only when a separate document would have an independent purpose, and use `none` when the session does not yet warrant durable content. The user must approve or revise the topic proposal before any skill selection; the session synthesis may refine the action before the final content handoff.

## Duplicate and Boundary Rules

Search existing indexed content before proposing a new document. Prefer deepening an existing document when it already owns the same central question, carry that target forward as an `update`, and do not silently replace it with a new draft. Keep a topic to one coherent learning and assessment session, preserve unresolved branches as follow-up proposals, and do not activate candidates the user has not selected.

## Topic Approval Checklist

- [ ] The entry mode has accepted evidence.
- [ ] Evidence, assumptions, and unknowns are distinct.
- [ ] The central question is answerable in one scoped session.
- [ ] Prerequisites, practice, and completion evidence are concrete.
- [ ] Related documents were checked for duplication or useful context.
- [ ] The document action is `none`, `create`, or `update`, and any update names its existing target.
- [ ] The user approved the topic before skill selection.
