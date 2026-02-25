# Test File Structure

## Directory Structure

Tests are organized under `tests/` folder, **mirroring the `src/` structure exactly**.

### Structure Mapping

```
src/                                tests/
├── app/                            ├── app/
│   ├── surgeryCenter/              │   ├── surgeryCenter/
│   │   ├── apis/                   │   │   ├── apis/
│   │   │   └── surgery/            │   │   │   └── surgery/
│   │   │       └── getList.ts      │   │   │       └── getList.test.ts
│   │   ├── components/             │   │   ├── components/
│   │   │   └── VideoEditor.tsx     │   │   │   └── VideoEditor.test.tsx
│   │   ├── hooks/                  │   │   ├── hooks/
│   │   │   └── useVideo.ts         │   │   │   └── useVideo.test.ts
│   │   └── utils/                  │   │   └── utils/
│   │       └── format.ts           │   │       └── format.test.ts
│   ├── researchCenter/             │   ├── researchCenter/
│   └── admin/                      │   └── admin/
├── ui/                             ├── ui/
│   ├── components/                 │   ├── components/
│   │   └── form/                   │   │   └── form/
│   │       └── FormInput.tsx       │   │       └── FormInput.test.tsx
│   └── hooks/                      │   └── hooks/
│       └── useDebouncedValue.ts    │       └── useDebouncedValue.test.ts
├── infrastructure/                 ├── infrastructure/
└── routes/                         └── routes/
    └── authentication.tsx              └── authentication.test.tsx
```

### Naming Convention

- **Test files**: `{filename}.test.ts` or `{filename}.test.tsx`
- **NOT**: `{filename}.spec.ts` (incorrect pattern in this project)
- **Module folders**: Match source exactly (e.g., `apis/surgery/` not `apis/`)

### Examples

| Source File                                        | Test File                                                 |
| -------------------------------------------------- | --------------------------------------------------------- |
| `src/app/surgeryCenter/utils/durationFormatter.ts` | `tests/app/surgeryCenter/utils/durationFormatter.test.ts` |
| `src/ui/hooks/useDebouncedValue.ts`                | `tests/ui/hooks/useDebouncedValue.test.ts`                |
| `src/ui/components/form/input/FormInput.tsx`       | `tests/ui/components/form/input/FormInput.test.tsx`       |
| `src/routes/authentication.tsx`                    | `tests/routes/authentication.test.tsx`                    |

---

## AAA Pattern (MANDATORY)

**Every test MUST follow the Arrange-Act-Assert pattern** with explicit block comments.

### Template

```typescript
it('should do something', () => {
  // arrange
  const input = 'test';
  const expected = 'TEST';

  // act
  const result = toUpperCase(input);

  // assert
  expect(result).toBe(expected);
});
```

### Block Definitions

#### 1. Arrange (Setup)

Prepare test data, mocks, and initial state.

```typescript
// arrange
const mockData = { id: 1, name: 'Test' };
const mockFn = vi.fn();
render(<Component data={mockData} onClick={mockFn} />);
```

#### 2. Act (Execute)

Perform the action being tested.

```typescript
// act
await userEvent.click(screen.getByRole('button'));
```

#### 3. Assert (Verify)

Check that the result matches expectations.

```typescript
// assert
expect(mockFn).toHaveBeenCalledWith(mockData);
expect(screen.getByText('Success')).toBeInTheDocument();
```
---

## Nested Describe Blocks

Use nested `describe` blocks to organize related tests hierarchically.

### Pattern

```typescript
describe('ComponentName or functionName', () => {
  describe('feature category 1', () => {
    it('should behavior 1', () => { ... });
    it('should behavior 2', () => { ... });
  });

  describe('feature category 2', () => {
    it('should behavior 3', () => { ... });
  });
});
```

### Example

```typescript
describe('formatDurationToChinese', () => {
  describe('Acceptance Criteria', () => {
    it('should return "1分钟" for durations from 1 to 59 seconds', () => {
      // arrange
      const input = 30;

      // act
      const result = formatDurationToChinese(input);

      // assert
      expect(result).toBe('1分钟');
    });

    it('should return empty placeholder for negative durations', () => {
      // arrange
      const input = -1;

      // act
      const result = formatDurationToChinese(input);

      // assert
      expect(result).toBe(EMPTY_PLACEHOLDER);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined inputs', () => {
      // arrange
      const inputNull = null;
      const inputUndefined = undefined;

      // act
      const resultNull = formatDurationToChinese(inputNull as any);
      const resultUndefined = formatDurationToChinese(inputUndefined as any);

      // assert
      expect(resultNull).toBe(EMPTY_PLACEHOLDER);
      expect(resultUndefined).toBe(EMPTY_PLACEHOLDER);
    });
  });

  describe('Format Validation', () => {
    it('should use correct Chinese characters', () => {
      // arrange
      const input = 3660; // 1h 1m

      // act
      const result = formatDurationToChinese(input);

      // assert
      expect(result).toContain('小时');
      expect(result).toContain('分钟');
    });
  });
});
```

---

## Test Naming Conventions

### Structure

```
it('should [expected behavior] [when condition]', ...)
```

### Examples

```typescript
// ✅ GOOD - Clear, specific, readable
it('should return empty string when input is null');
it('should display error message when API fails');
it('should disable submit button while form is submitting');

// ❌ BAD - Vague, implementation-focused
it('works correctly');
it('handles edge case');
it('state updates properly');
```

### Conditional Naming

Use `when` or `if` to specify conditions:

```typescript
it('should show loading spinner when data is fetching');
it('should hide modal when cancel button is clicked');
it('should retry request if network error occurs');
```

### Negation

Use`should not` for negative assertions:

```typescript
it('should not call API when form is invalid');
it('should not render children when loading is true');
```

---

## Comments in Tests

### AAA Block Comments (MANDATORY)

```typescript
it('...', () => {
  // arrange
  ...

  // act
  ...

  // assert
  ...
});
```

### Inline Explanatory Comments (Optional)

Add comments for complex logic or non-obvious behavior:

```typescript
it('should handle race condition', async () => {
  // arrange
  const { result } = renderHook(() => useData());

  // act
  // Trigger two simultaneous fetches
  act(() => {
    result.current.fetch();
    result.current.fetch();
  });

  // assert
  // Only one request should be made (second is ignored)
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

---

## Summary

- **Mirror `src/` structure** in `tests/` folder
- **Use `.test.ts` / `.test.tsx`** file extension
- **AAA pattern is MANDATORY** with block comments
- **Organize with nested `describe` blocks**
- **Name tests clearly** with "should + behavior + condition"
- **Add explanatory comments** for complex tests
