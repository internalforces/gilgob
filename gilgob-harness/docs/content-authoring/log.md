<!--
Purpose:        Collection-specific method for concise, date-centered learning logs
Owner:          Content Writer
Update Trigger: Log schema, naming, presentation, or promotion workflow changes
Harness Version: 1.1
-->

# Writing Learning Logs

Use `content/logs/` for a compact record of what was learned, tried, observed, or decided on a particular date.

Start from `content/templates/log.md`. A current example is `content/logs/2026-08-20-oracle-hierarchical-query.md`.

## Good Fit

- A learning session or experiment tied to a date.
- A short record of a command, failure, correction, or insight.
- A bridge from immediate experience to a reusable knowledge or exploration document.

Use knowledge for a fully reusable explanation, exploration for an open investigation, and project for durable project state.

## Filename and Frontmatter

Prefer:

```text
content/logs/YYYY-MM-DD-short-topic.md
```

The filename date should normally match `created`. If the document is written later about an earlier learning event, keep `created` honest and explain the context in the body.

| Field group | Requirement |
|---|---|
| `title`, `description`, `category`, `tags`, `created`, `draft`, `aliases`, `featured` | Required; follow the shared contract |
| `updated` | Optional; use for a material correction or follow-up |
| `slug` | Optional safe route override |
| `nextQuestions` | Optional follow-up questions |
| `status` | Not supported; omit it |

See `gilgob-harness/docs/content-authoring/README.md` for exact shared field rules.

## Recommended Structure

A short log may use paragraphs or these headings:

1. **Context:** What task or question triggered the learning?
2. **What I tried:** Commands, examples, or reasoning steps.
3. **What I learned:** The smallest accurate takeaway.
4. **What was difficult or surprising:** Failure mode or corrected assumption.
5. **Next action:** A concrete follow-up, wiki-link, or `nextQuestions` entry.

Keep the event visible. Do not rewrite a log into a timeless tutorial while leaving it in the log collection.

## Promotion Workflow

When a log contains reusable knowledge:

1. create or update the appropriate knowledge document;
2. synthesize the explanation instead of copying raw chronology;
3. link the log to the knowledge document;
4. link the knowledge document back only when the learning history helps readers;
5. keep the log as evidence of the learning path unless deletion is separately approved.

An unresolved question may instead become an exploration document.

## Anti-Patterns

- A daily diary entry with no learning signal relevant to the garden.
- A large reference article disguised as a dated log.
- Commands without the problem, result, or lesson.
- Backdating or overstating what was understood at the time.
- Adding a status field copied from another collection.
- Deleting the log automatically after promoting its knowledge.

## Publication Checklist

- [ ] Filename and `created` date are coherent.
- [ ] The learning event, action, and takeaway are concrete.
- [ ] Commands and results are accurate enough to reuse.
- [ ] Reusable conclusions link to knowledge or exploration when appropriate.
- [ ] No unsupported `status` field is present.
- [ ] Shared publication checks in `gilgob-harness/docs/content-authoring/README.md` pass.
