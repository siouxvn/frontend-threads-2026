# Testing Philosophy

## Testing Trophy Model

JnJ Monarch Hub follows the **Testing Trophy Model** (not the testing pyramid), which prioritizes different types of tests based on their cost-benefit ratio for frontend applications.

```
                /-------------\
               /      E2E      \
              /-----------------\
        /------------------------------\
       /                                \
      |            Integration           |
       \                                /
        \------------------------------/
              \------------------/
                \     Unit     /
                  \----------/
                   /--------\
                 /            \
                |    Static    |
                 \            /
                /--------------\
```

### Priority Order (Top to Bottom)

1. **Integration Tests** (Highest Priority)
   - Test multiple units working together
   - Test user workflows and interactions
   - Provide the best confidence-to-cost ratio
   - Example: Testing a form submission that calls an API and updates UI

2. **E2E Tests** (High Priority, but expensive)
   - Test the entire application flow
   - Run in real browser environment
   - Slow and brittle, use sparingly for critical paths only
   - Example: Complete user registration → login → data export flow

3. **Unit Tests** (Medium Priority)
   - Test individual functions/utilities in isolation
   - Fast and reliable, but limited confidence
   - Best for pure functions, utilities, and helpers
   - Example: Testing `formatDurationToChinese(3600)` returns `"1小时"`

4. **Static Analysis** (Baseline)
   - TypeScript type checking
   - ESLint for code quality
   - Automatically enforced by IDE and CI/CD
---

## Testing Principles

### ✅ DO Test

1. **Business logic & utilities**
   - Data transformations, calculations, algorithms
   - Validation rules and error handling
   - API request/response handling
   - State management logic (stores, reducers, selectors)

2. **Custom hooks**
   - Data fetching hooks (loading/success/error states)
   - Hooks that encapsulate complex side effects
   - Hooks shared across multiple components

3. **Services & adapters**
   - API service functions
   - Data mapping / normalization
   - Authentication flows

4. **Critical user workflows** (integration level)
   - Form submission and validation feedback
   - Key navigation flows (login → dashboard → action)
   - Export/import and data persistence paths

5. **Edge cases and errors**
   - Boundary values (0, -1, null, undefined, empty arrays)
   - Network failures and timeouts
   - Race conditions

### ❌ DON'T Test

1. **Pure UI rendering of antd/third-party components**
   - Don't assert that `<Button>` renders a `<button>` element
   - Don't snapshot-test antd Form layouts — they change with library upgrades
   - Don't pixel/snapshot test purely decorative components

2. **Framework/library internals**
   - React rendering mechanics
   - Antd component behavior
   - TanStack Router routing logic
   - XState state machine transitions (already tested by library)

3. **Implementation details**
   - Internal component state variables
   - Private functions (test through public API)
   - CSS class names and component hierarchy

4. **Third-party libraries**
   - Axios HTTP client, DOMPurify, Date-fns, etc.
   - Trust their own test suites

5. **Mocked data**
   - Don't assert that mocked functions return mocked values
   - Test the real integration points instead

> **Why?** This project is UI-heavy with antd and complex form rendering. Snapshot/pixel tests for UI components are fragile — they break on minor library upgrades and provide little confidence. Coverage efforts should go where real business logic lives.

---

## Test Coverage Strategy

> ⚠️ **Coverage target philosophy**: Avoid chasing high overall coverage (>70%) for a UI-heavy project.
> Antd forms and component rendering code are fragile to test and provide low ROI.
> Focus coverage on **business logic, utils, services, and hooks** — where real decisions happen.

---

## Testing Mindset

### Think Like a User

```typescript
// ❌ BAD - Testing implementation
it('should set loading state to true', () => {
  const { result } = renderHook(() => useData());
  expect(result.current.loading).toBe(true);
});

// ✅ GOOD - Testing user-visible behavior
it('should show loading spinner while fetching data', () => {
  render(<DataComponent />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### Test Behavior, Not Structure

```typescript
// ❌ BAD - Testing structure
it('should render UserCard with correct props', () => {
  const { container } = render(<UserList users={mockUsers} />);
  const userCard = container.querySelector('.user-card');
  expect(userCard).toHaveAttribute('data-user-id', '123');
});

// ✅ GOOD - Testing behavior
it('should display user name when user is clicked', async () => {
  render(<UserList users={mockUsers} />);
  await userEvent.click(screen.getByRole('button', { name: /view user/i }));
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

### Write Maintainable Tests

```typescript
// ❌ BAD - Brittle test
it('should render 3 items', () => {
  render(<List items={items} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
});

// ✅ GOOD - Resilient test
it('should render all provided items', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  render(<List items={items} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(items.length);
});
```

---

## Summary

- **Prioritize integration tests** over unit tests
- **Test user behavior**, not implementation details
- **Think like a user**, not like a developer
- **Keep tests simple and maintainable**
