# Parameterized Testing with it.each

## When to Use it.each

Use `it.each` when you have **multiple similar test cases** that only differ in **input values and expected outputs**.

### ✅ Use it.each For

- **Boundary value testing**
  - Testing min, max, zero, negative values
  - Example: Testing `formatDuration` with 0, 30, 60, 3600 seconds

- **Input/output combinations**
  - Same function with different inputs
  - Example: Testing `calculate(a, b)` with various a/b pairs

-**Error condition variations**

- Same error handler with different invalid inputs
- Example: Testing validation with null, undefined, empty string

- **State transition variations**
  - Same transition with different conditions
  - Example: Testing button states (disabled, loading, enabled)

### ❌ DON'T Use it.each For

- **Different test scenarios** (unrelated behaviors)
- **Tests requiring different setup/teardown**
- **Tests with complex, unique assertions**
- **Single test case** (just use `it`)

---

## Basic Syntax

### Array of Arrays

```typescript
it.each([
  [input1, expected1],
  [input2, expected2],
  [input3, expected3],
])('should return %s when input is %s', (input, expected) => {
  // arrange
  // (data from table)

  // act
  const result = functionUnderTest(input);

  // assert
  expect(result).toBe(expected);
});
```

### Array of Objects (RECOMMENDED)

```typescript
it.each([
  { input: 1, expected: 2 },
  { input: 2, expected: 4 },
  { input: 3, expected: 6 },
])('should double $input to get $expected', ({ input, expected }) => {
  // arrange
  // (data from table)

  // act
  const result = double(input);

  // assert
  expect(result).toBe(expected);
});
```

**Why objects are better:**

- ✅ Self-documenting (named properties)
- ✅ Easier to add/remove fields
- ✅ Safe to reorder columns
- ✅ Better IDE autocomplete

---

## Test Name Templates

### Using Template Literals

```typescript
it.each([
  { value: 0, result: EMPTY_PLACEHOLDER },
  { value: -1, result: EMPTY_PLACEHOLDER },
  { value: 30, result: '1分钟' },
])('should return "$result" when value is $value', ({ value, result }) => {
  // test body
});
```

**Output:**

```
✓ should return "---" when value is 0
✓ should return "---" when value is -1
✓ should return "1分钟" when value is 30
```

### Using Index

```typescript
it.each([
  { input: 'hello', output: 'HELLO' },
  { input: 'world', output: 'WORLD' },
])('case #%# should convert "$input" to "$output"', ({ input, output }) => {
  // test body
});
```

**Output:**

```
✓ case #0 should convert "hello" to "HELLO"
✓ case #1 should convert "world" to "WORLD"
```

---

## Real-World Examples

### Example 1: Boundary Value Testing

```typescript
// ✅ GOOD - Using it.each
describe('formatDurationToChinese', () => {
  it.each([
    { seconds: 0, expected: '---' },
    { seconds: 1, expected: '1分钟' },
    { seconds: 30, expected: '1分钟' },
    { seconds: 59, expected: '1分钟' },
    { seconds: 60, expected: '1分钟' },
    { seconds: 120, expected: '2分钟' },
    { seconds: 3600, expected: '1小时' },
    { seconds: 3660, expected: '1小时1分钟' },
  ])('should return "$expected" for $seconds seconds', ({ seconds, expected }) => {
    // arrange
    // (data from table)

    // act
    const result = formatDurationToChinese(seconds);

    // assert
    expect(result).toBe(expected);
  });
});
```

### Example 2: Validation Testing

```typescript
// ✅ GOOD - Testing multiple invalid inputs
describe('validateEmail', () => {
  it.each([
    { email: '', reason: 'empty string' },
    { email: 'invalid', reason: 'no @ symbol' },
    { email: '@example.com', reason: 'missing local part' },
    { email: 'user@', reason: 'missing domain' },
    { email: 'user @example.com', reason: 'contains space' },
  ])('should reject $reason: "$email"', ({ email }) => {
    // arrange
    // (email from table)

    // act
    const result = validateEmail(email);

    // assert
    expect(result.isValid).toBe(false);
  });

  it.each([{ email: 'user@example.com' }, { email: 'test.user@domain.co.uk' }, { email: 'name+tag@company.org' }])(
    'should accept valid email: "$email"',
    ({ email }) => {
      // arrange
      // (email from table)

      // act
      const result = validateEmail(email);

      // assert
      expect(result.isValid).toBe(true);
    },
  );
});
```

### Example 3: Mathematical Operations

```typescript
// ✅ GOOD - Testing calculator with multiple operations
describe('calculate', () => {
  it.each([
    { a: 1, b: 2, operation: 'add', expected: 3 },
    { a: 5, b: 3, operation: 'add', expected: 8 },
    { a: 10, b: 4, operation: 'subtract', expected: 6 },
    { a: 3, b: 7, operation: 'subtract', expected: -4 },
    { a: 4, b: 5, operation: 'multiply', expected: 20 },
    { a: 10, b: 2, operation: 'divide', expected: 5 },
  ])('should calculate $a $operation $b = $expected', ({ a, b, operation, expected }) => {
    // arrange
    // (data from table)

    // act
    const result = calculate(a, b, operation);

    // assert
    expect(result).toBe(expected);
  });
});
```

### Example 4: Component States

```typescript
// ✅ GOOD - Testing button states
describe('SubmitButton', () => {
  it.each([
    { isSubmitting: true, isValid: true, expected: 'disabled' },
    { isSubmitting: false, isValid: false, expected: 'disabled' },
    { isSubmitting: false, isValid: true, expected: 'enabled' },
  ])('should be $expected when isSubmitting=$isSubmitting and isValid=$isValid',
    ({ isSubmitting, isValid, expected }) => {
    // arrange
    render(<SubmitButton isSubmitting={isSubmitting} isValid={isValid} />);
    const button = screen.getByRole('button');

    // act
    // (no action needed, testing initial render state)

    // assert
    if (expected === 'disabled') {
      expect(button).toBeDisabled();
    } else {
      expect(button).not.toBeDisabled();
    }
  });
});
```

---

## Anti-Pattern: durationFormatter.test.ts (DO NOT COPY)

### ❌ BAD - Without it.each

```typescript
// THIS IS THE WRONG WAY - Don't copy this pattern!
describe('Edge Cases', () => {
  it('should handle exact minute boundaries', () => {
    // arrange
    // act
    const result60 = formatDurationToChinese(60);
    const result120 = formatDurationToChinese(120);
    const result1800 = formatDurationToChinese(1800);

    // assert
    expect(result60).toBe('1分钟');
    expect(result120).toBe('2分钟');
    expect(result1800).toBe('30分钟');
  });

  it('should handle exact hour boundaries', () => {
    // act
    const result3600 = formatDurationToChinese(3600);
    const result7200 = formatDurationToChinese(7200);
    const result10800 = formatDurationToChinese(10800);

    // assert
    expect(result3600).toBe('1小时');
    expect(result7200).toBe('2小时');
    expect(result10800).toBe('3小时');
  });
});
```

**Problems:**

- Multiple assertions in one test (hard to debug failures)
- Repetitive code
- Poor failure messages ("expected '1小时' received '2小时'" - which input?)
- Violates single responsibility principle

### ✅ GOOD - With it.each

```typescript
describe('formatDurationToChinese - minute boundaries', () => {
  it.each([
    { seconds: 60, expected: '1分钟' },
    { seconds: 120, expected: '2分钟' },
    { seconds: 1800, expected: '30分钟' },
  ])('should return "$expected" for $seconds seconds', ({ seconds, expected }) => {
    // arrange
    // (data from table)

    // act
    const result = formatDurationToChinese(seconds);

    // assert
    expect(result).toBe(expected);
  });
});

describe('formatDurationToChinese - hour boundaries', () => {
  it.each([
    { seconds: 3600, expected: '1小时' },
    { seconds: 7200, expected: '2小时' },
    { seconds: 10800, expected: '3小时' },
  ])('should return "$expected" for $seconds seconds', ({ seconds, expected }) => {
    // arrange
    // (data from table)

    // act
    const result = formatDurationToChinese(seconds);

    // assert
    expect(result).toBe(expected);
  });
});
```

**Benefits:**

- ✅ One assertion per test case
- ✅ Clear failure messages ("should return '1小时' for 3600 seconds")
- ✅ Easy to add more cases
- ✅ Follows AAA pattern correctly

---

## Advanced Usage

### Combining it.each with describe.each

For testing multiple functions with similar patterns:

```typescript
describe.each([
  { fn: add, operation: 'addition' },
  { fn: subtract, operation: 'subtraction' },
  { fn: multiply, operation: 'multiplication' },
])('$operation function', ({ fn, operation }) => {
  it.each([
    { a: 0, b: 0, expected: 0 },
    { a: 1, b: 1, expected: operation === 'addition' ? 2 : operation === 'subtraction' ? 0 : 1 },
  ])('should handle $a and $b', ({ a, b, expected }) => {
    expect(fn(a, b)).toBe(expected);
  });
});
```

### Using Test Data Factories

```typescript
const testCases = {
  invalidEmails: [
    { email: '', reason: 'empty' },
    { email: 'no-at-sign', reason: 'missing @' },
  ],
  validEmails: [{ email: 'user@example.com' }, { email: 'test@domain.co' }],
};

describe('validateEmail', () => {
  it.each(testCases.invalidEmails)('should reject invalid email ($reason): "$email"', ({ email }) => {
    expect(validateEmail(email).isValid).toBe(false);
  });

  it.each(testCases.validEmails)('should accept valid email: "$email"', ({ email }) => {
    expect(validateEmail(email).isValid).toBe(true);
  });
});
```

---

## Best Practices

### 1. Keep Table Data Simple

```typescript
// ✅ GOOD - Simple, flat data
it.each([
  { input: 1, output: 2 },
  { input: 2, output: 4 },
])('...', ({ input, output }) => { ... });

// ❌ BAD - Complex nested objects (hard to read)
it.each([
  {
    input: { user: { profile: { age: 25 } } },
    output: { status: 'valid', reasons: [ ... ] }
  },
])('...', ({ input, output }) => { ... });
```

### 2. Use Descriptive Property Names

```typescript
// ✅ GOOD - Clear names
it.each([
  { ageInYears: 18, isAdult: true },
  { ageInYears: 17, isAdult: false },
])('...', ({ ageInYears, isAdult }) => { ... });

// ❌ BAD - Cryptic names
it.each([
  { x: 18, y: true },
  { x: 17, y: false },
])('...', ({ x, y }) => { ... });
```

### 3. Group Related Cases in Separate it.each

```typescript
// ✅ GOOD - Separate describe blocks for different scenarios
describe('valid inputs', () => {
  it.each([...])('...', () => { ... });
});

describe('invalid inputs', () => {
  it.each([...])('...', () => { ... });
});

// ❌ BAD - Mixing unrelated cases
it.each([
  { input: 'valid@email.com', isValid: true },
  { input: '', isValid: false },
  { input: 'also-valid@test.com', isValid: true },
])('...', () => { ... }); // Hard to scan
```

### 4. Add Comments for Non-Obvious Cases

```typescript
it.each([
  { seconds: 3660, expected: '1小时1分钟' }, // 61 minutes
  { seconds: 86400, expected: '24小时' }, // Exactly 1 day
  { seconds: 90060, expected: '25小时1分钟' }, // More than 1 day
])('should format $seconds seconds as "$expected"', ({ seconds, expected }) => {
  // ...
});
```

---

## Summary

- **Use it.each** for multiple similar test cases
- **Array of objects** is the recommended format
- **Template literals** in test names for clarity
- **One assertion per test case** (not multiple in one it block)
- **Avoid anti-pattern** from `durationFormatter.test.ts`
- **Group related cases** in separate `it.each` blocks
- **Keep table data simple** and readable
