<!--
Purpose:        Collection-specific method for writing open questions and evolving investigations
Owner:          Content Writer and Researcher
Update Trigger: Exploration schema, status meaning, research workflow, or quality expectations change
Harness Version: 1.1
-->

# Writing Exploration Documents

Use `content/explorations/` when the central value is the investigation itself and the conclusion is incomplete, conditional, or still changing.

Start from `content/templates/exploration.md`. A current example is `content/explorations/llm-watermark.md`.

## Good Fit

- A question with competing explanations.
- A technical feasibility or reliability investigation.
- A hypothesis that needs evidence or an experiment.
- A decision whose uncertainty and rejected options are worth preserving.

When the answer becomes stable and reusable, synthesize it into a knowledge document and link both documents instead of disguising the original exploration as if it were always settled.

## Required Status

| Status | Use when |
|---|---|
| `active` | Investigation is currently progressing or has a defined next action |
| `paused` | Work is intentionally stopped; record why and what would resume it |
| `complete` | The original question has a supported answer, a documented decision, or an explicit conclusion that further work is not worthwhile |

`complete` does not mean absolute certainty. It means the exploration has met its stated decision or learning goal.

## Frontmatter

Use the shared fields from `README.md` plus exploration status. The title should expose the question or tension. The description should state what is being tested, compared, or decided.

Use `nextQuestions` for new questions that are outside the current investigation's stopping rule.

## Recommended Structure

1. **Question:** Make it answerable and scoped.
2. **Why it matters:** State the reader or decision affected.
3. **Current context:** Record verified starting facts and constraints.
4. **Hypotheses or options:** List plausible answers before favoring one.
5. **Evidence:** Separate observations, source findings, experiments, and assumptions.
6. **Counterevidence and limits:** Record what weakens each hypothesis.
7. **Current judgment:** State the best provisional answer and confidence.
8. **Next action or stopping rule:** Define what happens next or why the work is complete.

For a long investigation, add dated updates so readers can see how the conclusion evolved without rewriting history.

## Research Standard

- Prefer primary sources and record version or publication date when relevant.
- State search scope and important evidence not found.
- Do not convert correlation, a single example, or an analogy into causation.
- Preserve contradictory evidence.
- Make the boundary between quoted source facts and personal inference clear.

## Status Transitions

- `active -> paused`: add the blocking reason and a concrete resume condition.
- `paused -> active`: record what changed and the new next action.
- `active -> complete`: answer the original question and show how evidence meets the stopping rule.
- Any status -> `active`: allowed when new evidence materially reopens the original question; explain why.

## Anti-Patterns

- A vague topic with no question or decision.
- A preferred conclusion written before alternatives are considered.
- A list of links without synthesis.
- `complete` status with no answer or stopping rationale.
- Deleting failed hypotheses that explain the final judgment.
- Expanding scope whenever a new question appears.

## Publication Checklist

- [ ] The question is scoped and decision-relevant.
- [ ] Facts, hypotheses, evidence, and judgment are distinguishable.
- [ ] Counterevidence and uncertainty are visible.
- [ ] Status and next action or stopping rule agree.
- [ ] New reusable conclusions are linked or promoted appropriately.
- [ ] External sources are primary and current enough for the claim.
- [ ] Shared publication checks in `README.md` pass.
