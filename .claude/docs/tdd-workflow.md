# TDD Workflow — Red-Green-Refactor

This workflow applies to **application and business logic code** (services, hooks, utils, components).

## When NOT to apply TDD

Do NOT apply the Red-Green-Refactor cycle for:
- Installing and configuring tools, frameworks, and dependencies
- Project setup, scaffolding, and boilerplate
- Config files (vite.config.ts, tsconfig.json, tailwind.config.js, etc.)
- CI/CD, linting, formatting setup
- Documentation and README changes
- Refactoring that doesn't change behavior (moving files, renaming)
- Pure type definitions (types.ts, interfaces)

When asked to set up or install something — just do it directly.

## Step 1 — Plan (SPEC)

- Analyze the requirement
- List all functions/methods/modules needed
- Describe expected behaviors (Given-When-Then)
- Get confirmation before writing any code or tests

## Step 2 — Test (RED)

- Write failing tests in Vitest for each listed behavior
- Names describe behavior: `it('should return empty array when inbox has no items')`
- Pattern: Arrange → Act → Assert
- Run `npx vitest run` — confirm all new tests FAIL
- Show test output. Do NOT proceed until red.

## Step 3 — Implement (GREEN)

- Write MINIMUM code to make each failing test pass
- No extra features, no optimizations, no "nice to haves"
- Run `npx vitest run` after each function — show output

## Step 4 — Refactor (CLEAN)

- Improve code while keeping all tests green
- Run `npx vitest run` after each change — show output

## Rules

- Never write implementation before its test exists
- Never skip the failing-test confirmation step
- Always show test run output at each phase transition (red → green)
- One assertion per test when possible
- Mock external dependencies (Google API, IndexedDB/Dexie) with `vi.fn()`, `vi.spyOn()`, `vi.mock()`
- Use `it.each` for parameterized / data-driven tests
- When modifying existing code: verify a test exists first; if not, write a characterization test before changing anything
- If asked to add a feature, start by listing behaviors and asking for confirmation