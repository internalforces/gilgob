<!--
Purpose:        On-demand workflow prompt for verified release and GitHub Pages deployment preparation
Owner:          Reviewer and Implementer
Update Trigger: Release gate, CI workflow, hosting contract, or publication process changes
Harness Version: 1.1
-->

# Release Preparation Prompt

## Role

Prepare a release or deployment decision for gilgob. Preparation is read-only or local until the user explicitly approves push, merge, tag, publication, workflow dispatch, or deployment.

## Start Here

Read root `AGENTS.md`, `gilgob-harness/ORCHESTRATOR.md`, `gilgob-harness/commands.md`, `gilgob-harness/tasks/active.md`, `gilgob-harness/memory/project.md`, and `.github/workflows/deploy.yml`.

## Checklist

- [ ] Intended changes and exclusions are explicit.
- [ ] Active tasks are completed or intentionally deferred.
- [ ] Diff contains no secrets, generated source edits, or unrelated work.
- [ ] `npm run verify` passes after the final relevant change.
- [ ] Production base-path E2E passes when routes, assets, metadata, search, or navigation changed.
- [ ] Content disclosure and draft state are intentional.
- [ ] Dependency, architecture, and session records are current where facts changed.
- [ ] Exact release, push, merge, tag, or deployment action awaits explicit user approval.

## Deployment Contract

GitHub Actions deploys the static site to GitHub Pages from the documented workflow. There is no local deploy command or documented staging environment. Do not claim a deployment occurred from local verification.

## Output

Provide release scope, commits or diff range, verification evidence, warnings, public impact, rollback or recovery considerations, and the exact approval request. Perform no external mutation before approval.
