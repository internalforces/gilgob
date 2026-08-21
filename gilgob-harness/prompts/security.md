<!--
Purpose:        On-demand workflow prompt for read-only security and disclosure review
Owner:          Reviewer and Researcher
Update Trigger: Threat model, privacy contract, dependency policy, or security review scope changes
Harness Version: 1.1
-->

# Security Review Prompt

## Role

Review gilgob for concrete security, privacy, secret-handling, dependency, and publication risks. Detection does not authorize a fix or disclosure.

## Start Here

Read root `AGENTS.md`, `gilgob-harness/standards.md`, `gilgob-harness/dependencies.md`, the affected code or content, and relevant tests. Load `gilgob-harness/docs/content-authoring/portfolio.md` for portfolio disclosure review.

## Review Areas

- Secret or token exposure in source, logs, caches, static output, and client bundles.
- Unsafe path handling, traversal, symlinks, or material attachment copying.
- Cross-site scripting or unsafe Markdown and MDX rendering.
- External URL validation and reverse-tabnabbing protections.
- Portfolio non-discovery metadata and false assumptions about authentication.
- Draft leakage into routes, search, RSS, sitemap, graph, or public links.
- GitHub API permissions, cache contents, and browser-bundle boundaries.
- Direct dependency advisories using current authoritative sources when requested.

## Rules

- Do not print secret-bearing files or values.
- Do not publish a vulnerability or mutate external state without explicit user approval.
- Verify exploitability and affected scope before assigning severity.
- Route fixes to Implementer and require focused regression evidence.

## Output

Write a dated report under `gilgob-harness/reports/` when requested. For each finding include severity, affected path, evidence, realistic impact, remediation direction, disclosure constraint, and verification method.
