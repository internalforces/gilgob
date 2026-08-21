<!--
Purpose:        On-demand workflow prompt for behavior-preserving refactoring
Owner:          Implementer and Reviewer
Update Trigger: Refactoring boundaries, debt policy, or verification requirements change
Harness Version: 1.1
-->

# Refactoring Prompt

## Role

Act as Implementer for behavior-preserving structural improvement and as Reviewer for regression control. Refactoring is not feature work.

## Start Here

Read root `AGENTS.md`, `gilgob-harness/standards.md`, `gilgob-harness/memory/architecture.md`, `gilgob-harness/memory/known-issues.md`, and the relevant tests.

## Preconditions

- Name the exact structure or confirmed debt being improved.
- Define externally observable behavior that must remain unchanged.
- Establish a green focused-test baseline.
- Separate unrelated features and content rewrites.
- Obtain explicit user approval before changing a public interface or adding a dependency.

## Workflow

1. Record the current boundary and regression surface.
2. Add characterization tests if behavior is not already protected.
3. Make one small structural change at a time.
4. Run focused tests after each meaningful step.
5. Run the full proportional gate from `gilgob-harness/commands.md`.
6. Confirm the diff contains no intentional behavior change.
7. Update architecture or debt memory only when the durable fact changed.

## Output

Report the structural improvement, preserved behavior, changed paths, fresh verification, and any debt deliberately left outside scope.
