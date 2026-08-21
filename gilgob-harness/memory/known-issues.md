<!--
Purpose:        Track confirmed bugs, technical debt, and temporary workarounds without inventing work
Owner:          Debugger and Reviewer
Update Trigger: An issue is confirmed, severity changes, a workaround is adopted, or an issue is resolved
Harness Version: 1.1
-->

# Known Issues: gilgob

_Last updated: 2026-08-21_

## Active Bugs

No active bug is recorded in Harness memory.

## Technical Debt

No technical-debt item is recorded in Harness memory.

## Recording Rule

Add an entry only after reproducing or otherwise confirming the issue. A failing command without root-cause evidence may be recorded as an investigation, but not as a confirmed defect in a specific component.

## Issue Format

```markdown
### ISS-NNN: Issue title

- Severity: Critical | High | Medium | Low
- Found: YYYY-MM-DD
- Status: Investigating | Confirmed | Resolved
- Affected paths: exact repository paths

Reproduction: Exact steps and observed output.

Expected behavior: The verified contract.

Root cause: Confirmed cause, or explicitly state that it is still unknown.

Workaround: Temporary safe path, if one exists.

Permanent direction: Proposed fix scope and required approval gates.
```

## Resolved Issues

No resolved issue has been archived in Harness memory.
