<!--
Purpose:        Track confirmed bugs, technical debt, and temporary workarounds without inventing work
Owner:          Debugger and Reviewer
Update Trigger: An issue is confirmed, severity changes, a workaround is adopted, or an issue is resolved
Harness Version: 1.1
-->

# Known Issues: gilgob

_Last updated: 2026-08-22_

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

### ISS-001: Compact pull request events emptied GitHub activity data

- Severity: Medium
- Found: 2026-08-22
- Status: Resolved
- Affected paths: `src/lib/github/fetch-github.ts`, `tests/unit/github-stats.test.ts`

Reproduction: Normalize the current compact public `PullRequestEvent` shape, whose pull request object provides an API `url` but no `html_url`. The normalizer rejected the event, and a cache miss caused the build-time GitHub activity result to become empty.

Expected behavior: Supported public pull request events produce safe `github.com` activity links without requiring a browser URL from the API payload.

Root cause: Pull request normalization required `pull_request.html_url`, while the current events API returns compact pull request objects with `pull_request.url` instead.

Workaround: A previously populated cache could preserve stale activity data, but no reliable workaround existed on a cache miss.

Permanent direction: Resolved by accepting either URL field as input evidence, always constructing the canonical public pull request link from the validated repository and number, and covering compact and misleading URL payloads with regression tests.
