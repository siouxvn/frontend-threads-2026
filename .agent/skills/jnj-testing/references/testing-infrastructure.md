# Testing Infrastructure

## Framework Overview

JnJ Monarch Hub uses the following testing stack:

- **Vitest** - Fast unit test framework (Vite-native)
- **jsdom** - Simulated browser environment for Node.js
- **@testing-library/react** v16 - Component testing utilities
- **@testing-library/user-event** v14 - User interaction simulation
- **MSW** (Mock Service Worker) - API mocking
- **Vitest UI** - Visual test runner

---

## Vitest Configuration

### File Location: `vitest.config.ts`

### Global Imports

With `globals: true`, these are available everywhere:

```typescript
// No need to import these
describe('...', () => {
  beforeEach(() => { ... });
  afterEach(() => { ... });
  beforeAll(() => { ... });
  afterAll(() => { ... });

  it('...', () => {
    expect(value).toBe(expected);
  });
});
```

However, **explicit imports are REQUIRED** for:

```typescript
import { vi } from 'vitest'; // Mock utilities
```

---

## Global Test Setup

### File Location: `tests/setupTests.ts`

---

## Path Aliases

Configured in both `vitest.config.ts` and `tsconfig.json`:

```typescript
resolve: {
  alias: {
    '@src': path.resolve(__dirname, 'src'),
    '@tests': path.resolve(__dirname, 'tests'),
  },
}
```

**Usage in tests:**

```typescript
// ✅ GOOD - Use aliases
import { formatDuration } from '@src/app/surgeryCenter/utils/durationFormatter';
import { mockUsers } from '@tests/__mocks__/users';

// ❌ BAD - Relative paths
import { formatDuration } from '../../../../src/app/surgeryCenter/utils/durationFormatter';
```

---

## Available Testing Utilities

### From Vitest

```typescript
import { vi } from 'vitest';

// Mocking
vi.fn(); // Mock function
vi.spyOn(object, 'method'); // Spy on method
vi.mock('@src/module'); // Mock entire module
vi.mocked(fn); // Type-safe mock access
vi.hoisted(() => {}); // Hoist mock definition

// Timers
vi.useFakeTimers(); // Enable fake timers
vi.useRealTimers(); // Restore real timers
vi.advanceTimersByTime(1000); // Fast-forward time
vi.runAllTimers(); // Run all pending timers

// Cleanup
vi.clearAllMocks(); // Clear mock history
vi.restoreAllMocks(); // Restore original implementations
vi.clearAllTimers(); // Clear pending timers
```

### From @testing-library/react

```typescript
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Component rendering
const { rerender, unmount } = render(<Component />);

// Querying
screen.getByRole('button', { name: /submit/i });
screen.getByText('Hello');
screen.getByLabelText('Email');
screen.queryByText('Optional');  // Returns null if not found

// User interactions
await userEvent.click(button);
await userEvent.type(input, 'text');
await userEvent.selectOptions(select, 'option1');

// Async utilities
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// React state updates
act(() => {
  result.current.doSomething();
});
```

### From @testing-library/react (Hooks)

```typescript
import { renderHook } from '@testing-library/react';

const { result, rerender, unmount } = renderHook(() => useMyHook(props));

// Access hook return value
expect(result.current.value).toBe(expected);

// Update hook props
rerender({ newProp: 'value' });
```

---

## Running Tests

### Commands

```bash
# Run all tests
yarn test

# Run a specific test
yarn test path/to/your/test-file.test.ts

# Validate safety and syntax errors for test files
yarn tsc:check-tests
```
---

## Summary

- **Vitest** with **jsdom** for fast, isolated tests
- **@testing-library/react** for component testing
- **MSW** for API mocking (covered in separate reference)
- **Global setup** handles browser API mocks
- **Path aliases** for clean imports
