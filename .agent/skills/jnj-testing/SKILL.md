---
name: jnj-testing
description: "**WORKFLOW SKILL** — Write, plan, review, and verify tests for JnJ Monarch Hub projects. USE FOR: any request to write or fix tests (unit, integration, component, hook, API, state machine, XState); adding test coverage to new or existing features; reviewing test quality; any message containing \"test\", \"spec\", \"viết test\", \"thêm test\", \"kiểm tra\", \"coverage\". CRITICAL RULES ENFORCED (read skill BEFORE coding): Testing Trophy prioritization — favor component + integration tests over pure unit tests; AAA pattern mandatory in every it() block; MSW for all HTTP mocking — NEVER mock @tanstack/react-query or API modules directly; real QueryClient+QueryClientProvider for React Query tests; SELECTORS as const + testHelpers pattern; react-i18next already globally mocked in setupTests.ts. DO NOT USE FOR: non-test implementation, debugging production errors."
version: 1.0.0
---

# JnJ Testing Implementation

This skill is for **writing comprehensive tests** in JnJ projects, ensuring all tests strictly follow the agreed-upon **testing conventions, best practices, and patterns** based on the **Testing Trophy Model**.

## ⚠️ Critical Rules — Read Before Writing Any Test Code

These rules are non-negotiable and are the most commonly missed. Apply them in **every single test**.

### Rule 1 — AAA Pattern is MANDATORY in every `it()` block

Every test must have explicit inline comments: `// arrange`, `// act`, `// assert`.

```typescript
it('should show option from saved value', async () => {
  // arrange
  const values = savedValuesFor({ pastHistory: [{ diseaseName: 'I10::高血压' }] });

  // act
  renderComponent(values);

  // assert
  await waitFor(() => expect(screen.getByText('高血压')).toBeTruthy());
});
```

### Rule 2 — MSW for HTTP mocking. NEVER mock `@tanstack/react-query` or API modules directly

```typescript
// ❌ WRONG — kills real data flow, hides bugs
vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));
vi.mock('@src/app/researchCenter/apis', () => ({ getPatientRecord: vi.fn() }));

// ✅ CORRECT — real hooks + real functions + MSW intercepts HTTP
const server = setupServer();
const createWrapper = () => { /* QueryClient + QueryClientProvider */ };

server.use(
  http.get(baseURL + RESEARCH_ENDPOINTS.getPatientRecord('r-1', 'rec-1'), () =>
    HttpResponse.json(recordMock)
  ),
);
render(<Component />, { wrapper: createWrapper() });
```

### Rule 3 — Testing Trophy: always ask "what level is this?"

Priority: **Integration > Component > Unit > Static**

- **Component tests** → render `<Component />` with real React Query + MSW. The default for UI work.
- **Integration tests** → test multiple units/hooks together through a real data flow.
- **Unit tests** → only for pure utility/calculation/formatting functions.
- **Static tests** → TypeScript type checks. Already handled by `tsc`.

Do NOT default to unit tests when a component or integration test gives more confidence.

### Rule 4 — SELECTORS + testHelpers. No magic strings in test bodies

```typescript
// Always define these at module level
const SELECTORS = {
  submitButton: 'submit-btn',
  errorMessage: 'error-msg',
} as const;

const testHelpers = {
  clickSubmit: async () => await userEvent.click(screen.getByTestId(SELECTORS.submitButton)),
  waitForError: async () => waitFor(() => expect(screen.getByTestId(SELECTORS.errorMessage)).toBeTruthy()),
};
```

### Rule 5 — Do NOT re-mock globally mocked modules

`tests/setupTests.ts` already mocks: **`react-i18next`**, `@src/app/stream`, `@src/infrastructure/localize/localizeServices`.
Do **not** add `vi.mock('react-i18next', ...)` in individual test files.

---

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

   ````markdown
   #### <ID>: `path/to/file.ts`

   **File test:** `tests/path/to/file.test.ts`
   **Level:** [Static | Unit | Integration | E2E] ← Testing Trophy tier based on `references/testing-philosophy.md`
   **Effort:** [LOW | MEDIUM | HIGH] | **Impact:** [LOW | MEDIUM | HIGH]

   \```
   describe('functionOrComponentName')
   ├── should handle happy path
   ├── should handle edge case (null, empty, boundary)
   ├── should handle error scenario
   └── should handle [other scenario]
   \```
   ````

4. **Implement** tests
   - Follow AAA pattern with clear block comments
   - Use it.each for parameterized tests when appropriate
   - Apply MSW for API mocking (or spy for FormData)
   - Follow Testing Trophy prioritization

5. **Run** tests and verify coverage
   - Execute tests: `yarn test`
   - Check coverage: `yarn test:cov`
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
- [ ] Component tests that use React Query use real `QueryClient` + `QueryClientProvider` via `createWrapper()` — **NEVER mock `@tanstack/react-query` directly**
- [ ] MSW lifecycle hooks present: `beforeAll(server.listen)`, `afterAll(server.close)`, `afterEach(server.resetHandlers + vi.clearAllMocks)`
- [ ] `data-testid` strings are centralized in a `SELECTORS as const` object — no magic strings inline in test bodies
- [ ] Common query/action/wait helpers are placed in a `testHelpers` object
- [ ] Fixture IDs use `TEST_IDS as const`; computed API URLs use `API_URLS as const` derived from real endpoint functions
- [ ] `react-i18next` is **NOT** mocked per-test (already mocked globally in `setupTests.ts`)
- [ ] `@src/ui/components` is mocked using `@tests/mocks/ui-components` via async import pattern
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
