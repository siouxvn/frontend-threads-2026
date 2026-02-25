# Async Testing Patterns

## Testing with Fake Timers

### Setup and Teardown

```typescript
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

describe('Component with timers', () => {
  beforeEach(() => {
    vi.useFakeTimers(); // Enable fake timers
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore original implementations
    vi.useRealTimers(); // Switch back to real timers
  });

  // Tests go here
});
```

**Why this is needed:**

- Prevents tests from actually waiting (faster execution)
- Makes timing deterministic (no flakiness)
- Allows precise control over time progression

---

## Advancing Time

### advanceTimersByTime()

Fast-forward time by a specific duration:

```typescript
it('should trigger callback after delay', () => {
  // arrange
  vi.useFakeTimers();
  const callback = vi.fn();
  setTimeout(callback, 1000);

  // act
  vi.advanceTimersByTime(1000);

  // assert
  expect(callback).toHaveBeenCalledOnce();

  vi.useRealTimers();
});
```

### runAllTimers()

Execute all pending timers immediately:

```typescript
it('should run all timers', () => {
  // arrange
  vi.useFakeTimers();
  const callback1 = vi.fn();
  const callback2 = vi.fn();

  setTimeout(callback1, 1000);
  setTimeout(callback2, 2000);

  // act
  vi.runAllTimers();

  // assert
  expect(callback1).toHaveBeenCalled();
  expect(callback2).toHaveBeenCalled();

  vi.useRealTimers();
});
```

### runOnlyPendingTimers()

Run only timers that are currently pending (not new ones created during execution):

```typescript
it('should run only pending timers', () => {
  // arrange
  vi.useFakeTimers();
  const callback = vi.fn(() => {
    setTimeout(callback, 1000); // Creates new timer
  });

  setTimeout(callback, 1000);

  // act
  vi.runOnlyPendingTimers();

  // assert
  expect(callback).toHaveBeenCalledOnce(); // New timer not executed

  vi.useRealTimers();
});
```

---

## Testing Debounced Code

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

  it('should debounce value changes by delay', () => {
    // arrange
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'initial' },
    });

    // act
    rerender({ value: 'updated' });

    // assert - Value should not change immediately
    expect(result.current).toBe('initial');

    // act - After delay, value should update
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // assert
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
      vi.advanceTimersByTime(100); // Partial delay
    });

    // assert
    expect(result.current).toBe('initial');

    // act - Change value again (resets timer)
    rerender({ value: 'updated2' });

    act(() => {
      vi.advanceTimersByTime(200); // Complete first delay duration
    });

    // assert - Timer was reset, so still initial
    expect(result.current).toBe('initial');

    // act - Complete second delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // assert
    expect(result.current).toBe('updated2');
  });
});
```

---

## Testing Throttled Code

```typescript
it('should throttle function calls', () => {
  // arrange
  vi.useFakeTimers();
  const callback = vi.fn();
  const throttled = throttle(callback, 1000);

  // act
  throttled(); // Call 1 - executed immediately
  throttled(); // Call 2 - ignored (within throttle window)

  act(() => {
    vi.advanceTimersByTime(500);
  });

  throttled(); // Call 3 - ignored (still within window)

  act(() => {
    vi.advanceTimersByTime(500); // Total 1000ms
  });

  throttled(); // Call 4 - executed (window expired)

  // assert
  expect(callback).toHaveBeenCalledTimes(2); // Calls 1 and 4

  vi.useRealTimers();
});
```

---

## Testing setInterval

```typescript
it('should call callback at intervals', () => {
  // arrange
  vi.useFakeTimers();
  const callback = vi.fn();

  setInterval(callback, 1000);

  // act & assert
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(callback).toHaveBeenCalledTimes(1);

  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(callback).toHaveBeenCalledTimes(2);

  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(callback).toHaveBeenCalledTimes(3);

  vi.useRealTimers();
});
```

---

## Testing Cleanup (clearTimeout/clearInterval)

```typescript
it('should clear timeout on cleanup', () => {
  // arrange
  vi.useFakeTimers();
  const callback = vi.fn();

  const timeoutId = setTimeout(callback, 1000);
  clearTimeout(timeoutId);

  // act
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  // assert
  expect(callback).not.toHaveBeenCalled();

  vi.useRealTimers();
});

it('should clear interval on cleanup', () => {
  // arrange
  vi.useFakeTimers();
  const callback = vi.fn();

  const intervalId = setInterval(callback, 1000);

  act(() => {
    vi.advanceTimersByTime(2000); // 2 calls
  });

  clearInterval(intervalId);

  // act
  act(() => {
    vi.advanceTimersByTime(2000); // Should not trigger more calls
  });

  // assert
  expect(callback).toHaveBeenCalledTimes(2);

  vi.useRealTimers();
});
```

---

## Testing Promises with waitFor

### Basic waitFor Usage

```typescript
import { waitFor } from '@testing-library/react';

it('should resolve async operation', async () => {
  // arrange
  const mockFn = vi.fn().mockResolvedValue('result');

  // act
  const promise = mockFn();

  // assert
  await waitFor(() => {
    expect(mockFn).toHaveBeenCalled();
  });

  const result = await promise;
  expect(result).toBe('result');
});
```

### waitFor Options

```typescript
await waitFor(
  () => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  },
  {
    timeout: 5000, // Max wait time (default: 1000ms)
    interval: 100, // Polling interval (default: 50ms)
    onTimeout: error => {
      console.log('Timeout error:', error);
      return error;
    },
  },
);
```

---

## Testing with act()

### Synchronous State Updates

```typescript
import { renderHook, act } from '@testing-library/react';

it('should update state synchronously', () => {
  // arrange
  const { result } = renderHook(() => React.useState(0));
  const [, setState] = result.current;

  // act
  act(() => {
    setState(10);
  });

  // assert
  const [state] = result.current;
  expect(state).toBe(10);
});
```

### Why act() is Required

```typescript
// ❌ BAD - Without act(), may fail or show warning
result.current.setValue('updated');
expect(result.current.value).toBe('updated');

// ✅ GOOD - With act(), ensures updates are flushed
act(() => {
  result.current.setValue('updated');
});
expect(result.current.value).toBe('updated');
```

---

## Testing Race Conditions

```typescript
it('should handle concurrent requests', async () => {
  // arrange
  let requestId = 0;
  server.use(
    http.get(baseURL + ENDPOINTS.getData, async () => {
      const id = ++requestId;
      const delay = id === 1 ? 1000 : 100; // First request is slow

      await new Promise(resolve => setTimeout(resolve, delay));

      return HttpResponse.json({ id });
    }),
  );

  const { result } = renderHook(() => useDataFetch(), {
    wrapper: createWrapper(),
  });

  // act - Trigger two requests
  act(() => {
    result.current.fetch(); // Request 1 (slow)
  });

  act(() => {
    result.current.fetch(); // Request 2 (fast)
  });

  // assert - Should show result from request 2 (most recent)
  await waitFor(() => {
    expect(result.current.data.id).toBe(2);
  });
});
```

---

## Testing Progress Tracking

```typescript
it('should track upload progress', async () => {
  // arrange
  const onProgress = vi.fn();

  server.use(
    http.post(baseURL + ENDPOINTS.upload, async ({ request }) => {
      // Simulate progress events
      await delay(100);
      onProgress({ loaded: 50, total: 100 });

      await delay(100);
      onProgress({ loaded: 100, total: 100 });

      return HttpResponse.json({ success: true });
    }),
  );

  // act
  await uploadFile(mockFile, { onProgress });

  // assert
  await waitFor(() => {
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith({ loaded: 100, total: 100 });
  });
});
```

---

## Testing Retry Logic

```typescript
it('should retry failed request', async () => {
  // arrange
  let attemptCount = 0;

  server.use(
    http.get(baseURL + ENDPOINTS.getData, () => {
      attemptCount++;

      if (attemptCount < 3) {
        return new HttpResponse(null, { status: 500 });
      }

      return HttpResponse.json({ data: 'success' });
    }),
  );

  // act
  const result = await fetchWithRetry(3, 100); // 3 retries, 100ms delay

  // assert
  expect(attemptCount).toBe(3);
  expect(result.data).toBe('success');
});
```

---

## Testing Exponential Backoff

```typescript
it('should use exponential backoff for retries', async () => {
  // arrange
  vi.useFakeTimers();
  const delays: number[] = [];
  let attemptCount = 0;

  const fetchWithBackoff = async () => {
    for (let i = 0; i < 3; i++) {
      attemptCount++;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      delays.push(delay);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  // act
  const promise = fetchWithBackoff();

  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
  }

  await promise;

  // assert
  expect(delays).toEqual([1000, 2000, 4000]);
  expect(attemptCount).toBe(3);

  vi.useRealTimers();
});
```

---

## Testing AbortController

```typescript
it('should cancel request when aborted', async () => {
  // arrange
  const controller = new AbortController();

  server.use(
    http.get(baseURL + ENDPOINTS.getData, async () => {
      await delay(1000);
      return HttpResponse.json({ data: 'test' });
    }),
  );

  // act
  const promise = fetchData(controller.signal);

  setTimeout(() => {
    controller.abort();
  }, 100);

  // assert
  await expect(promise).rejects.toThrow('canceled');
});
```

---

## Common Pitfalls

### ❌ Forgetting to Cleanup Timers

```typescript
// BAD - Timers leak to other tests
it('test with timer', () => {
  vi.useFakeTimers();
  // ... test code
  // ❌ Forgot vi.useRealTimers()
});

// GOOD - Always cleanup
afterEach(() => {
  vi.useRealTimers();
});
```

### ❌ Not Using act() with Timers

```typescript
// BAD - May cause warnings or failures
vi.advanceTimersByTime(1000);

// GOOD - Wrap in act()
act(() => {
  vi.advanceTimersByTime(1000);
});
```

### ❌ Mixing Real and Fake Timers

```typescript
// BAD - Inconsistent timing
vi.useFakeTimers();
await delay(1000); // Real delay, not fake!

// GOOD - Use fake timers consistently
vi.useFakeTimers();
act(() => {
  vi.advanceTimersByTime(1000);
});
```

---

## Best Practices

### ✅ DO

- Use `vi.useFakeTimers()` in `beforeEach`
- Use `vi.useRealTimers()` in `afterEach`
- Wrap time advances in `act()`
- Use `waitFor()` for async assertions
- Use `advanceTimersByTime()` for precise control
- Test both happy path and edge cases

### ❌ DON'T

- Forget to cleanup timers
- Use real delays (`await delay()`)
- Mix real and fake timers
- Advance time without `act()`
- Rely on exact timing in real timers

---

## Summary

- **vi.useFakeTimers()** / **vi.useRealTimers()** for setup/teardown
- **vi.advanceTimersByTime(ms)** to fast-forward time
- **act()** around time advances and state updates
- **waitFor()** for async assertions
- **Clean up timers** in `afterEach`
- **Test debounce, throttle, intervals** with fake timers
- **Test race conditions and retries** with MSW + waitFor
