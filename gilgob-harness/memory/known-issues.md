<!--
Purpose:        Track confirmed bugs, technical debt, and temporary workarounds without inventing work
Owner:          Debugger and Reviewer
Update Trigger: An issue is confirmed, severity changes, a workaround is adopted, or an issue is resolved
Harness Version: 1.1
-->

# Known Issues: gilgob

_Last updated: 2026-08-23_

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

### ISS-002: Mobile menu kept the desktop page inert after resize

- Severity: High
- Found: 2026-08-23
- Status: Resolved
- Affected paths: `src/components/navigation/MobileMenu.tsx`, `tests/e2e/mobile.spec.ts`

Reproduction: Open the mobile menu at a viewport below `52rem`, then resize above the mobile breakpoint. The menu becomes hidden by CSS, but `body.menu-open` and `inert` remain on the page.

Expected behavior: Leaving the mobile breakpoint closes the menu and releases the page scroll and interaction locks.

Root cause: The Preact menu state did not observe the CSS breakpoint, so hiding the component did not trigger the open-state effect cleanup.

Workaround: Narrow the viewport again to close the menu, or reload the page.

Permanent direction: Resolved by closing the menu when the shared `52rem` media query stops matching and covering the resize path with a browser regression test.

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
