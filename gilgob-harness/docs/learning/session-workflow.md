<!--
Purpose:        Session-scoped skill approval, interactive tutoring, and reviewed learning handoff
Owner:          Learning Facilitator and Content Writer
Update Trigger: Skill approval, session method, synthesis, or content-handoff contract changes
Harness Version: 1.1
-->

# Running a Learning Session

## Preconditions

Confirm that the learner approved one scoped topic under [Selecting a Learning Topic](topic-selection.md). Review the approved central question, prerequisites, practice, and completion evidence. Do not select skills or begin tutoring until this scope is clear.

## Skill Selection

Propose the smallest useful skill set: zero or one teaching skill, zero or one domain-support skill, and research or visualization capabilities only when needed. Use available metadata to discover installed skills. If a useful skill is unavailable, report it and offer an unskilled or evidence-based fallback; do not install it automatically.

## Initial Skill Approval

Before using any skill, present an approval request like this for each exact skill:

```text
Skill: <exact skill name>
Role: teaching | domain support
Why it is relevant: <connection to the approved topic>
Session effect: <how it changes the teaching or investigation process>
Status: This skill has not been used.
```

Ask the learner to approve all, approve a subset, request a replacement or more explanation, or continue without skills. Approval is session-scoped: an approved skill may be reused only within the current session, and every later session needs a new approval even for the same topic.

## Mid-Session Skill Approval

Pause before adding a skill that was not initially approved. Name the exact skill, its teaching or domain-support role, why the new need arose, how it would affect the current session, and that it has not been used. Wait for explicit approval before reading or invoking it. Rejected skills must not be substituted or invoked indirectly.

## Interactive Learning Rhythm

Use this focused rhythm:

```text
diagnose current understanding
  -> give one small explanation, hint, parallel example, or visual scaffold
  -> ask one focused question
  -> receive the learner's reasoning
  -> give specific correction or confirmation
  -> practice with an example, counterexample, prediction, or experiment
  -> ask the learner to explain or apply the idea
```

Diagnose before choosing teaching depth unless existing work already demonstrates it. Explain missing prerequisites directly, then return control to the learner. Use hints and parallel examples when the learner has the needed pieces. Treat prediction, teach-back, and transfer as stronger evidence than passive agreement, and preserve academic integrity for assessed work.

## Completion Evidence and Closure

Close the session when the approved completion evidence is demonstrated, the learner asks to stop, a missing prerequisite needs a separate topic, external evidence or an experiment is required, or the scope splits into independent questions. Do not infer completion from passive agreement. On closure, all skill approvals expire.

## Session Synthesis

Prepare a preview that separates:

- `Verified facts`: support each fact with code, an experiment, or a reliable source.
- `Demonstrated understanding`: include only what the learner explained, predicted, or applied.
- `Provisional judgments`: mark interpretation and anything requiring verification.
- `Corrected misunderstandings`: preserve meaningful before-and-after distinctions.
- `Open questions`: retain concrete unresolved follow-ups without implying resolution.
- `Next actions`: name a practice, investigation, or document outcome.

Include the learning goal, approved skills actually used, whether completion evidence was demonstrated, the classified findings, and a recommended collection, proposed path, document purpose, and related documents.

The synthesis serves process review and must retain the exact approved skill names actually used. The authored Knowledge Garden document serves a reader-facing audience and must omit those skill names by default unless a skill is materially relevant to the subject being taught.

## Content Proposal and Handoff

Preview the document proposal and obtain user approval before creating a file or handing off to the Content Writer. Route its dominant result through the existing [Content Authoring Guide](../content-authoring/README.md): date-centered learning events to `logs`, unresolved questions to `explorations`, verified reusable explanations to `knowledge`, and durable project decisions, results, or maintenance facts to `projects`. The Content Writer chooses the exact template and creates any approved document as `draft: true`.

## Fallback and Interruption Rules

If an approved skill becomes unavailable, report the limitation and offer an unskilled or evidence-based fallback. If evidence is unavailable, keep claims provisional or defer document creation. If the topic branches, preserve the current central question and propose separate sessions. Do not install skills, create content, or claim understanding without the required approval or evidence.

## Session Checklist

- [ ] The learner approved the topic before skill selection.
- [ ] Every used skill received explicit approval for this session.
- [ ] Any mid-session skill received separate approval before use.
- [ ] Each tutoring turn asked one focused question.
- [ ] Completion evidence was demonstrated or the limitation is recorded.
- [ ] The synthesis separates all six required categories.
- [ ] The learner approved a document proposal before Content Writer handoff.
