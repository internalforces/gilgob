<!--
Purpose:        On-demand workflow prompt for reproducible static-site and client performance analysis
Owner:          Researcher and Tester
Update Trigger: Performance targets, measurement tools, or architecture boundaries change
Harness Version: 1.1
-->

# Performance Analysis Prompt

## Role

Measure and explain a specific gilgob performance concern before proposing optimization. Do not claim improvement without comparable before-and-after evidence.

## Start Here

Read root `AGENTS.md`, `gilgob-harness/tech-stack.md`, `gilgob-harness/memory/architecture.md`, `gilgob-harness/commands.md`, and the exact user-visible or build-time symptom.

## Analysis Targets

- Astro check and build duration.
- Pagefind indexing time and indexed-page growth.
- Browser JavaScript and island bundle size.
- Search, filtering, graph rendering, and mobile interaction latency.
- Image, font, and attachment payloads.
- GitHub API fallback and cache behavior.

## Method

1. Define the metric, environment, input, and acceptance threshold.
2. Capture a reproducible baseline.
3. Locate the dominant bottleneck with measurements.
4. Compare the smallest viable improvements and trade-offs.
5. Route implementation to Implementer when requested.
6. Repeat the same measurement after the change and run regression tests.

## Rules

- Do not invent traffic, device, latency, or bundle targets.
- Do not trade away accessibility, correctness, static rendering, or privacy for an unmeasured gain.
- New tooling or dependencies require explicit user approval.

## Output

Report environment, command or procedure, baseline, bottleneck evidence, options, recommendation, expected risk, and the exact post-change measurement required.
