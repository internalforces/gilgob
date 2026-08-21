<!--
Purpose:        Workflow playbooks for development, content operations, review, and release preparation
Owner:          Planner and Architect
Update Trigger: Workflow order, role boundaries, or approval gates change
Harness Version: 1.1
-->

# gilgob Workflow Playbooks

_Last updated: 2026-08-21_

## General Routing

```text
Request
  -> classify the work
  -> load the smallest matching context
  -> identify approval gates
  -> perform one scoped workflow
  -> run proportional verification
  -> update durable state only when facts changed
  -> report evidence and remaining limits
```

## Feature Workflow

```text
Planner: requirement -> scoped task and definition of done
  -> Architect: design only when interfaces or structure change
  -> HUMAN APPROVAL: new dependency, infrastructure, or public interface
  -> Implementer: code and tests
  -> Tester: proportional verification
  -> Reviewer: correctness, risk, standards, and documentation
  -> HUMAN APPROVAL: push, merge, release, or deployment
```

## Bug Workflow

```text
Debugger: reproduce -> isolate root cause -> record confirmed issue
  -> Implementer: minimal fix and regression test
  -> Tester: verify original symptom and relevant suite
  -> Reviewer: inspect regression risk
  -> HUMAN APPROVAL: release or deployment
```

Diagnosis alone does not authorize a code change. A request to fix the problem does.

## Research and Architecture Workflow

```text
Researcher: question -> official sources -> option comparison -> recommendation
  -> Architect: decision and trade-offs -> ADR
  -> HUMAN APPROVAL: dependency, infrastructure, public interface, or deployment impact
  -> Planner: implementation task when requested
```

## Content Writing Workflow

```text
Content Writer: identify collection
  -> read shared guide and one collection guide
  -> copy the matching content/templates file
  -> write as draft
  -> verify claims, frontmatter, links, and attachments
  -> run collection-appropriate checks
  -> HUMAN APPROVAL when disclosure or factual certainty is unresolved
  -> publish by setting draft: false only when publication is intended
```

Use Researcher for claims that require external evidence. Use Implementer if the requested content requires a schema, layout, or runtime change.

## Content Curation Workflow

```text
Content Curator: inventory exact paths
  -> inspect titles, aliases, slugs, wiki-links, backlinks, attachments, and publication state
  -> classify each item: keep | improve | move | merge | archive | delete
  -> produce impact report with proposed paths and URLs
  -> HUMAN APPROVAL for move, merge, archive through deletion, or URL change
  -> apply only approved targets
  -> rebuild content index and site
  -> report removed or changed paths and recovery options
```

Rules:

- A file move can change the derived slug even if its body is unchanged.
- A merge must name the surviving document and explain how unique information and aliases are preserved.
- A deletion must identify inbound wiki-links and material attachments before approval.
- Prefer a recoverable move or `draft: true` when the user's goal is uncertain.
- Never interpret the existence of the Content Curator role as standing permission to delete.

## Review Workflow

```text
Reviewer: read request and diff
  -> prioritize correctness, data loss, broken links, disclosure, and regressions
  -> check AGENTS.md and applicable guide
  -> run or inspect fresh verification
  -> write findings with exact paths and evidence
  -> verdict: Approved | Request Changes
```

## Release Workflow

```text
Reviewer: verify all intended changes
  -> Tester: npm run verify and npm run test:e2e with production base path when relevant
  -> Architect: confirm architecture and dependency records are current
  -> HUMAN APPROVAL: push or merge to main
  -> GitHub Actions: verify, build, browser-test, and deploy to GitHub Pages
```

There is no separate staging environment documented in this repository. Do not claim staging validation occurred.

## Approval Summary

| Action | Approval required before mutation? |
|---|---|
| Read, inspect, search, or diagnose repository files | No |
| Edit requested code or content without public URL impact | No |
| Add or major-upgrade a dependency | Yes |
| Change deployment, domain, or base path | Yes |
| Publish uncertain or sensitive content | Yes |
| Move, merge, archive through deletion, or delete content | Yes |
| Push, merge, tag, publish, or deploy | Yes |
