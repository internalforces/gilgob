<!--
Purpose:        Collection-specific method for writing reusable knowledge documents
Owner:          Content Writer
Update Trigger: Knowledge schema, status meaning, presentation, or quality expectations change
Harness Version: 1.1
-->

# Writing Knowledge Documents

Use `content/knowledge/` for an explanation that should remain useful beyond the day or project in which it was learned.

Start from `content/templates/knowledge.md`. Representative files include `content/knowledge/database/b-tree-index.md` and `content/knowledge/network/tcp-udp.md`.

## Good Fit

- A concept, mechanism, protocol, algorithm, pattern, or decision rule.
- A comparison readers can reuse.
- A consolidated answer promoted from logs or explorations.
- A stable mental model connected to other knowledge.

Use a log for a date-centered learning event, an exploration for an unanswered question, and a project document for project-specific decisions or outcomes.

## Required Status

| Status | Use when |
|---|---|
| `seed` | The core question and initial answer exist, but evidence, examples, boundaries, or links are incomplete |
| `growing` | The explanation is useful and substantially developed, but important validation, nuance, or integration remains |
| `mastered` | The document is coherent, evidence-aligned, reusable, connected, and clear about limits and common misunderstandings |

Status describes document maturity, not the author's personal expertise. A material rewrite can move a document backward when that is the honest state.

## Frontmatter

| Field group | Requirement |
|---|---|
| `title`, `description`, `category`, `tags`, `created`, `draft`, `aliases`, `featured` | Required; follow the shared contract |
| `status` | Required: `seed`, `growing`, or `mastered` |
| `updated` | Optional; use for a material revision |
| `slug` | Optional safe route override |
| `nextQuestions` | Optional concrete future questions |

See `gilgob-harness/docs/content-authoring/README.md` for exact shared field rules. `nextQuestions` is especially useful for turning missing depth into explicit future exploration.

Prefer a question-shaped title when the document explains a decision or misconception. Prefer a direct noun phrase when it serves as a reference entry.

## Recommended Structure

Use only sections that serve the topic:

1. **The question or answer:** State what the reader will understand.
2. **One-sentence model:** Give the compact mental model early.
3. **Mechanism:** Explain how it works and why.
4. **Example:** Use a concrete scenario, diagram, table, or calculation.
5. **Decision criteria:** Explain when the idea applies and when it does not.
6. **Common misunderstandings:** Correct likely overgeneralizations.
7. **Connections:** Link prerequisites, alternatives, applications, and next questions.

Do not force a heading when one paragraph answers the topic well.

## Evidence Standard

- Distinguish specification or implementation facts from analogy.
- State version or environment limits for claims that can change.
- Use primary technical sources when external validation is required.
- Label personal understanding as interpretation, not universal fact.
- Avoid absolute performance or security claims without conditions and evidence.

## Linking Standard

A mature knowledge document usually connects to at least one meaningful prerequisite, comparison, application, or open question when such a document exists. Links must help the reader; there is no link-count target.

When a referenced document does not exist, either leave an intentional unresolved link that names a real future topic or use `nextQuestions`. Do not create empty documents solely to satisfy a link.

## Anti-Patterns

- A copied article or lecture transcript with no synthesis.
- A list of definitions with no mechanism or decision value.
- A broad title containing several separable concepts.
- `mastered` status on an unverified or fragmentary note.
- An analogy presented as exact technical behavior.
- Tags and wiki-links added only for graph appearance.

## Publication Checklist

- [ ] The document answers one reusable question.
- [ ] Status matches the document's maturity.
- [ ] The explanation separates mechanism, example, and limitation.
- [ ] Important claims have adequate evidence or explicit uncertainty.
- [ ] Terms and tags match existing usage.
- [ ] Useful relationships are linked without decorative noise.
- [ ] `nextQuestions` contains concrete open questions when needed.
- [ ] Shared publication checks in `gilgob-harness/docs/content-authoring/README.md` pass.
