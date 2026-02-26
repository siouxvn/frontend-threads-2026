---
name: jnj-testing
description: Write comprehensive tests for JnJ projects following Testing Trophy Model and established testing conventions.
version: 1.0.0
---

# JnJ Testing Implementation

This skill is for **writing comprehensive tests** in JnJ projects, ensuring all tests strictly follow the agreed-upon **testing conventions, best practices, and patterns** based on the **Testing Trophy Model**.

## Arguments

- **default** (no argument needed): Execute the full workflow process (steps 1-6)
- **plan**: Execute planning phase only (steps 1-3) - analyze code, determine test cases, and produce test plan
- **impl**: Execute implementation phase only (step 4) - check context for existing test plan; if not found, ask user for clarification
- **verify**: Execute verification phase only (step 5-6) - run tests, verify coverage, and produce test report

## When to Use

Use this skill when:

- The user requests writing **tests** for:
  - a new feature
  - a module
  - a component
  - a hook
  - a utility function
  - an API function
  - a state machine
- The user explicitly invokes the command: `/jnj-testing`
- Implementing new features that require test coverage
- Refactoring existing code that lacks tests

## Testing Best Practices and Patterns

### 1. Testing Philosophy

**Load**: `references/testing-philosophy.md`

**Purpose**: Essential for the planning phase to prioritize and define high-ROI test cases.

### 2. Testing Infrastructure

**Load**: `references/testing-infrastructure.md`

**Purpose**: Essential for implementation; defines the environment setup, path aliases, and core utilities.

### 3. Test File Structure

**Load**: `references/test-file-structure.md`

**Purpose**: Essential for implementation; standardizes test organization, naming conventions, and the mandatory AAA pattern.

### 4. Component Testing Patterns

**Load**: `references/component-testing.md`

**Purpose**:

- Learn how to test React components using @testing-library/react
- Understand user-centric testing approach
- Know how to test different component types (pure UI, connected, form)

### 5. Hook Testing Patterns

**Load**: `references/hook-testing.md`

**Purpose**:

- Learn how to test custom React hooks using renderHook
- Understand async hook testing with waitFor
- Know how to handle dependencies (React Query, XState)

### 6. API Testing Patterns

**Load**: `references/api-testing.md`

**Purpose**:

- Learn MSW (Mock Service Worker) setup for API testing
- **CRITICAL**: Understand the FormData upload exception (spy instead of MSW)
- Know how to test error scenarios and retry logic

### 7. Parameterized Testing with it.each

**Load**: `references/parameterized-testing.md`

**Purpose**:

- **CRITICAL**: Learn when and how to use `it.each` for multiple test cases
- Understand the correct pattern vs anti-pattern (durationFormatter.test.ts is WRONG example)
- Know how to structure test data tables effectively

**When to use it.each:**

- Testing multiple input/output combinations
- Boundary value testing
- Error condition variations

### 8. Testing Async Code

**Load**: `references/async-testing.md`

**Purpose**:

- Learn how to use fake timers (vi.useFakeTimers)
- Understand waitFor and act patterns
- Know how to test debounced/throttled code

### 9. XState Machine Testing

**Load**: `references/xstate-machine-testing.md`

**Purpose**:

- **CRITICAL**: Learn how to test XState v5 machines using `createActor` + real events
- Understand why testing static config objects is WRONG (anti-pattern)
- Know how to inject controlled async actors (`fromPromise`) per test
- Learn the `waitForState` polling helper pattern for async transitions
- Know how to assert `snapshot.matches()`, `snapshot.hasTag()`, and `snapshot.context`

**When to use:**

- Testing factory functions that produce XState state node configs
- Testing compound states with entry actions, guards, or async invocations
- Testing that `tags` correctly reflect state (which drives UI behavior)

## Workflow Process

1. **Analyze** the code to be tested
   - Identify the type (component, hook, utility, API, state machine)
   - Understand the functionality and dependencies
   - Review existing tests (if any)

2. **Determine** required test cases
   - Happy path scenarios
   - Edge cases and boundary conditions
   - Error scenarios
   - User interactions (for components)
   - State transitions (for machines)

3. **Produce** a test plan document
   - List all test cases with descriptions
   - Identify testing approach for each case
   - Document mock data requirements
   - Present as a Markdown document for review

   **Required output format** for each file in the plan:

   ```markdown
   #### <ID>: `path/to/file.ts`

   **File test:** `tests/path/to/file.test.ts`
   **Level:** [Static | Unit | Integration | E2E]  ← Testing Trophy tier based on `references/testing-philosophy.md`
   **Effort:** [LOW | MEDIUM | HIGH] | **Impact:** [LOW | MEDIUM | HIGH]

   \```
   describe('functionOrComponentName')
     ├── should handle happy path
     ├── should handle edge case (null, empty, boundary)
     ├── should handle error scenario
     └── should handle [other scenario]
   \```
   ```

4. **Implement** tests
   - Follow AAA pattern with clear block comments
   - Use it.each for parameterized tests when appropriate
   - Apply MSW for API mocking (or spy for FormData)
   - Follow Testing Trophy prioritization

5. **Run** tests and verify coverage
   - Execute tests: `npm run test`
   - Check coverage: `npm run test:coverage`
   - Ensure no console errors or warnings
   - Verify all assertions pass

6. **Produce** test report
   - Document test results
   - Report coverage metrics
   - Identify any gaps or issues
   - Recommend next steps

## Testing Checklist

Before marking tests as complete, verify:

- [ ] All test files follow `tests/` structure mirroring `src/`
- [ ] All tests use AAA pattern with `// arrange`, `// act`, `// assert` comments
- [ ] Parameterized tests use `it.each` instead of multiple similar `it` blocks
- [ ] API tests use MSW handlers (except FormData uploads which use spy)
- [ ] Component tests focus on user behavior, not implementation
- [ ] Async code uses `vi.useFakeTimers` and `act()` where needed
- [ ] **XState tests use `createActor` + real events — NEVER check static config object properties**
- [ ] **XState tests always call `actor.stop()` after each test**
- [ ] **XState async actors are injected via `fromPromise(fetchImpl)` in `provide()` — NOT mocked with MSW**
- [ ] Proper cleanup is performed in `afterEach` (e.g., `vi.clearAllMocks()`, `vi.useRealTimers()`)
- [ ] No calls to `console.log` in tests (use proper assertions)
- [ ] All tests pass without warnings

## Common Pitfalls to Avoid

1. **Testing implementation details** instead of behavior
   - ❌ BAD: Testing internal state values
   - ✅ GOOD: Testing rendered output and user interactions

2. **Not using it.each for similar cases**
   - ❌ BAD: Multiple `it` blocks testing same logic with different values
   - ✅ GOOD: Single `it.each` with test data table

3. **Missing AAA comments**
   - ❌ BAD: Code without clear sections
   - ✅ GOOD: `// arrange`, `// act`, `// assert` comments

4. **Forgetting to cleanup timers/mocks**
   - ❌ BAD: Not clearing mocks or timers, or doing it only in `beforeEach` (can lead to unexpected state for subsequent tests)
   - ✅ GOOD: Prioritize `afterEach` for global cleanup to ensure a clean slate for the next test case.
     ```typescript
     afterEach(() => {
       vi.clearAllMocks();
       vi.useRealTimers();
     });
     ```

5. **Using MSW for FormData uploads**
   - ❌ BAD: MSW handler for FormData (doesn't work in jsdom)
   - ✅ GOOD: Spy on axios instance directly

6. **Testing XState machine config instead of behavior**
   - ❌ BAD: `expect(state.states.fetching.invoke.src).toBe('fetchUsbFolderStructures')`
   - ✅ GOOD: Create a real actor, send events, assert `snapshot.matches()` and `snapshot.hasTag()`
   - See `references/xstate-machine-testing.md` for complete patterns

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-25  
**Maintainer**: JnJ Monarch Hub Team
