# Hook Testing Patterns

## Basic Hook Testing

Use `renderHook` from `@testing-library/react` to test custom React hooks.

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMyHook } from '@src/path/to/useMyHook';

describe('useMyHook', () => {
  it('should return initial value', () => {
    // arrange
    // (no setup needed)

    // act
    const { result } = renderHook(() => useMyHook());

    // assert
    expect(result.current.value).toBe(initialValue);
  });
});
```

---

## Accessing Hook Return Value

```typescript
const { result } = renderHook(() => useMyHook());

result.current; // Access the hook's return value
```

---

## Testing Hook with Arguments

```typescript
it('should accept initial value', () => {
  // arrange
  const initialValue = 'test';

  // act
  const { result } = renderHook(() => useMyHook(initialValue));

  // assert
  expect(result.current.value).toBe(initialValue);
});
```

---

## Testing Hook Updates

### Using act()

```typescript
import { act } from '@testing-library/react';

it('should update value when setValue is called', () => {
  // arrange
  const { result } = renderHook(() => useMyHook('initial'));

  // act
  act(() => {
    result.current.setValue('updated');
  });

  // assert
  expect(result.current.value).toBe('updated');
});
```

### Why act() is needed

`act()` ensures React state updates and effects are processed before assertions.

```typescript
// ❌ BAD - Without act()
result.current.setValue('updated');
expect(result.current.value).toBe('updated'); // May fail (race condition)

// ✅ GOOD - With act()
act(() => {
  result.current.setValue('updated');
});
expect(result.current.value).toBe('updated'); // Always correct
```

---

## Re-rendering Hook with New Props

```typescript
it('should update when props change', () => {
  // arrange
  const { result, rerender } = renderHook(({ value }) => useMyHook(value), { initialProps: { value: 'initial' } });

  expect(result.current.value).toBe('initial');

  // act
  rerender({ value: 'updated' });

  // assert
  expect(result.current.value).toBe('updated');
});
```

---

## Testing Hooks with Dependencies

### React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

it('should fetch data', async () => {
  // arrange
  server.use(
    http.get(baseURL + ENDPOINTS.getData, () => {
      return HttpResponse.json({ data: 'test' });
    })
  );

  // act
  const { result } = renderHook(() => useMyDataHook(), {
    wrapper: createWrapper(),
  });

  // assert
  await waitFor(() => {
    expect(result.current.data).toEqual({ data: 'test' });
  });
});
```

### Context Provider

```typescript
const TestProvider = ({ children }: { children: React.ReactNode }) => (
  <MyContext.Provider value={{ theme: 'dark' }}>
    {children}
  </MyContext.Provider>
);

it('should use context value', () => {
  // arrange
  // (wrapper provides context)

  // act
  const { result } = renderHook(() => useMyContext(), {
    wrapper: TestProvider,
  });

  // assert
  expect(result.current.theme).toBe('dark');
});
```

---

## Testing Async Hooks

### Using waitFor

```typescript
import { waitFor } from '@testing-library/react';

it('should load data asynchronously', async () => {
  // arrange
  const { result } = renderHook(() => useAsyncData());

  // act
  // (hook starts fetching automatically)

  // assert
  expect(result.current.isLoading).toBe(true);

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

---

## Testing Hooks with Timers

### Debounced Hook Example

```typescript
import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { useDebouncedValue } from '@src/ui/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    // arrange
    // (no setup needed)

    // act
    const { result } = renderHook(() => useDebouncedValue('initial', 300));

    // assert
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes by delay', () => {
    // arrange
    const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
      initialProps: { value: 'initial', delay: 300 },
    });

    expect(result.current).toBe('initial');

    // act
    rerender({ value: 'updated', delay: 300 });

    // assert
    // Value should not change immediately
    expect(result.current).toBe('initial');

    // After delay, value should update
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('updated');
  });

  it('should cancel pending update on new value', () => {
    // arrange
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'initial' },
    });

    // act
    rerender({ value: 'updated1' });

    act(() => {
      vi.advanceTimersByTime(100); // Advance less than delay
    });

    // assert
    expect(result.current).toBe('initial');

    // act - Change value again before delay completes
    rerender({ value: 'updated2' });

    act(() => {
      vi.advanceTimersByTime(200); // Advance the rest of the first delay
    });

    // assert - Should still be initial, as timer was reset
    expect(result.current).toBe('initial');

    // act - Advance the new delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // assert
    expect(result.current).toBe('updated2');
  });
});
```

---

## Testing Cleanup (useEffect)

```typescript
it('should cleanup on unmount', () => {
  // arrange
  const cleanup = vi.fn();
  const useHookWithCleanup = () => {
    React.useEffect(() => {
      return cleanup;
    }, []);
  };

  // act
  const { unmount } = renderHook(() => useHookWithCleanup());
  unmount();

  // assert
  expect(cleanup).toHaveBeenCalledOnce();
});
```

---

## Testing Error Handling

```typescript
it('should handle error state', async () => {
  // arrange
  server.use(
    http.get(baseURL + ENDPOINTS.getData, () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  // act
  const { result } = renderHook(() => useDataFetch(), {
    wrapper: createWrapper(),
  });

  // assert
  await waitFor(() => {
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });
});
```

---

## Testing XState Hooks

```typescript
import { useMachine } from '@xstate/react';
import { renderHook, act } from '@testing-library/react';

it('should transition states on events', () => {
  // arrange
  const { result } = renderHook(() => useMachine(myMachine));
  const [initialState] = result.current;

  expect(initialState.value).toBe('idle');

  // act
  act(() => {
    const [, send] = result.current;
    send({ type: 'START' });
  });

  // assert
  const [newState] = result.current;
  expect(newState.value).toBe('running');
});

it('should update context on transition', () => {
  // arrange
  const { result } = renderHook(() => useMachine(counterMachine));

  // act
  act(() => {
    const [, send] = result.current;
    send({ type: 'INCREMENT' });
  });

  // assert
  const [state] = result.current;
  expect(state.context.count).toBe(1);
});
```

---

## Testing Local Storage Hooks

```typescript
it('should persist value to localStorage', () => {
  // arrange
  const key = 'testKey';
  const value = 'testValue';

  // act
  const { result } = renderHook(() => useLocalStorage(key, value));

  act(() => {
    result.current.setValue(value);
  });

  // assert
  expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
});

it('should read value from localStorage on mount', () => {
  // arrange
  const key = 'testKey';
  const value = 'storedValue';
  vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(value));

  // act
  const { result } = renderHook(() => useLocalStorage(key, 'default'));

  // assert
  expect(result.current.value).toBe(value);
  expect(localStorage.getItem).toHaveBeenCalledWith(key);
});
```

---

## Common Patterns

### Testing Multiple Calls

```typescript
it('should batch multiple updates', () => {
  // arrange
  const { result } = renderHook(() => useCounter());

  // act
  act(() => {
    result.current.increment();
    result.current.increment();
    result.current.increment();
  });

  // assert
  expect(result.current.count).toBe(3);
});
```

### Testing Race Conditions

```typescript
it('should ignore stale requests', async () => {
  // arrange
  let requestCount = 0;
  server.use(
    http.get(baseURL + ENDPOINTS.getData, async () => {
      requestCount++;
      const delay = requestCount === 1 ? 1000 : 100; // First is slow
      await new Promise(resolve => setTimeout(resolve, delay));
      return HttpResponse.json({ id: requestCount });
    }),
  );

  const { result } = renderHook(() => useDataFetch(), {
    wrapper: createWrapper(),
  });

  // act
  act(() => {
    result.current.fetch(); // First request (slow)
  });

  act(() => {
    result.current.fetch(); // Second request (fast)
  });

  // assert
  await waitFor(() => {
    expect(result.current.data.id).toBe(2); // Should use second response
  });
});
```

---

## Best Practices

### ✅ DO

- Use `renderHook` for testing hooks
- Use `act()` for state updates
- Use `waitFor()` for async updates
- Test hook behavior, not implementation
- Provide wrappers for context/providers
- Cleanup timers in `afterEach`

### ❌ DON'T

- Test React internals (useState, useEffect)
- Access internal hook state directly
- Forget `act()` for synchronous updates
- Mix real and fake timers
- Test hooks inside components (test the hook directly)

---

## Summary

- **renderHook** from @testing-library/react
- **act()** for state updates
- **waitFor()** for async hooks
- **rerender()** to test prop changes
- **wrapper** for providers (Query, Context)
- **vi.useFakeTimers()** for debounce/throttle
- **Test behavior**, not implementation details
