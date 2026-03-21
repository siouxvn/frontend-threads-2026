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

### Per-function folder split

When a source file exports **multiple functions** and each has a substantial number of tests, split them into separate test files under a subdirectory named after the source file (without extension):

```
src/
└── utils/
    └── select-search-schema-processor.ts  ← exports enrichSelectSearchOptionsMap, injectSelectSearchCallbacks

tests/
└── utils/
    └── select-search-saved-values-pipeline/    ← folder named after the logical group (or source file)
        ├── enrichSelectSearchOptionsMap.test.ts
        ├── injectSelectSearchCallbacks.test.ts
        └── pipeline-integration.test.ts        ← cross-function integration scenarios
```

**Rule:** Each file name is the function name → the outer `describe` in the file should be the **feature/behavior**, NOT the function name (the file already provides that context).

### Examples

| Source File                                        | Test File                                                 |
| -------------------------------------------------- | --------------------------------------------------------- |
| `src/app/surgeryCenter/utils/durationFormatter.ts` | `tests/app/surgeryCenter/utils/durationFormatter.test.ts` |
| `src/ui/hooks/useDebouncedValue.ts`                | `tests/ui/hooks/useDebouncedValue.test.ts`                |
| `src/ui/components/form/input/FormInput.tsx`       | `tests/ui/components/form/input/FormInput.test.tsx`       |
| `src/routes/authentication.tsx`                    | `tests/routes/authentication.test.tsx`                    |

---

## Test Constants Pattern

For connected components that call APIs, centralize test fixture IDs and computed URL strings at the top of the file.

```typescript
import { userTokenRequiredApi } from '@src/infrastructure/net';
import { RESEARCH_ENDPOINTS } from '@src/app/researchCenter/apis/research/endpoints';
import { USER_TOKEN_ENDPOINTS } from '@src/app/auth/apis/userToken/endpoints';

// Fixture IDs — single source of truth for all test data
const TEST_IDS = {
  researchId: 'r-1',
  recordId: 'rec-1',
  userId: 'u-1',
} as const;

// Derived API URLs — computed once, reused in MSW handlers
const baseURL = userTokenRequiredApi.defaults.baseURL as string;
const API_URLS = {
  patientRecord: baseURL + RESEARCH_ENDPOINTS.getPatientRecord(TEST_IDS.researchId, TEST_IDS.recordId),
  userProfile: baseURL + USER_TOKEN_ENDPOINTS.profile(TEST_IDS.userId),
} as const;
```

**Rule:** Never hard-code URL strings or test IDs inline inside `server.use()` handlers — always reference `API_URLS` and `TEST_IDS`.

---

## SELECTORS + testHelpers Pattern

For component tests, centralize `data-testid` strings and common query/action helpers to avoid magic strings scattered across tests.

```typescript
// Centralized data-testid strings — prevents magic string duplication
const SELECTORS = {
  downloadButton: 'download-button',
  modal: 'usb-modal',
  modalOk: 'modal-ok',
  modalCancel: 'modal-cancel',
} as const;

// Reusable query/action/wait helpers
const testHelpers = {
  getDownloadButton: () => screen.getByTestId(SELECTORS.downloadButton),
  clickDownloadButton: async () => await userEvent.click(testHelpers.getDownloadButton()),
  getModal: () => screen.getByTestId(SELECTORS.modal),
  queryModal: () => screen.queryByTestId(SELECTORS.modal),
  waitForModalClosed: async () => await waitFor(() => expect(testHelpers.queryModal()).toBeNull()),
  clickOk: async () => await userEvent.click(screen.getByTestId(SELECTORS.modalOk)),
};
```

**Rule:** `SELECTORS` holds raw strings `as const`; `testHelpers` holds functions that use `SELECTORS`. Never access `screen.getByTestId('...')` in test bodies with inline strings.

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

### File-per-function rule

When a test file is dedicated to a single function (e.g., `enrichSelectSearchOptionsMap.test.ts`), the **file name already names the function** — do NOT repeat it as the outermost `describe`. Start directly at the **feature/behavior** level.

> For component test files (e.g., `VideoEditor.test.tsx`) that test multiple concerns, an outer `describe('<ComponentName>', ...)` wrapper is still appropriate.

### Describe hierarchy

| Context                       | Top-level `describe`                  | Example                                                          |
| ----------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| **Per-function test file**    | The **feature / observable behavior** | `describe('synthetic options from saved composite values', ...)` |
| **Component / multi-concern** | The component / module under test     | `describe('VideoEditor', ...)`                                   |
| `it` / `it.each`              | **Condition + expected outcome**      | `'should skip enrichment when keyword is active'`                |

### Sub-feature nesting

Related sub-behaviors belong **inside** their parent feature `describe`, not as sibling top-level describes.

```typescript
// ✅ CORRECT – sub-features nested inside the feature they qualify
describe('synthetic options generation from saved composite values (code::name)', () => {
  it.each([...])(
    'should create synthetic option for $condition and leave $otherField untouched',
    ({ ... }) => { ... },
  );

  it('should create synthetic options for ALL items when a field has multiple saved values', ...);
  it('should NOT add a duplicate entry when saved value already exists in API options', ...);

  describe('keyword is active while enriching', () => {
    it('should skip synthetic entry for the field whose keyword is non-empty', ...);
    it('should still enrich the OTHER field when only one keyword is active', ...);
  });

  describe('plain string value (no code::name format)', () => {
    it.each([...])(...)
  });

  describe('edge cases', () => {
    it('should return optionsMap unchanged when formValues is undefined', ...);
    it('should NOT mutate the original optionsMap', ...);
  });
});
```

This produces clean, hierarchical terminal output:

```
✓ synthetic options generation from saved composite values (code::name) (9)
    ✓ should create synthetic option for single saved diseaseName and leave surgeryName untouched
    ✓ should create synthetic option for single saved surgeryName and leave diseaseName untouched
    ✓ should create synthetic options for ALL items when a field has multiple saved values
    ✓ should NOT add a duplicate entry when saved value already exists in API options
    ✓ keyword is active while enriching (2)
        ✓ should skip synthetic entry for the field whose keyword is non-empty
        ✓ should still enrich the OTHER field when only one keyword is active
    ✓ plain string value (no code::name format) (3)
        ✓ should handle no "::" separator: "高血压"
        ✓ should handle empty code part: "::原发性高血压"
    ✓ edge cases (3)
        ✓ should return optionsMap unchanged when formValues is undefined
```

### ✅ GOOD — One describe per feature, conditions inside it/it.each

```typescript
// ✅ CORRECT – one describe for the feature, it.each for the conditions
describe('synthetic options generation from saved composite values (code::name)', () => {
  it.each([
    { condition: 'single saved diseaseName', field: 'diseaseName', arrayKey: 'pastHistory', ... },
    { condition: 'single saved surgeryName', field: 'surgeryName', arrayKey: 'surgeryHistoryList', ... },
  ])(
    'should create synthetic option for $condition and leave $otherField untouched',
    ({ ... }) => { ... },
  );
});
```

### ❌ BAD — Wrapping a per-function file in a function-name describe

```typescript
// ❌ WRONG – file is already named enrichSelectSearchOptionsMap.test.ts,
//            no need to repeat the function name as the outermost describe
describe('enrichSelectSearchOptionsMap', () => {
  describe('synthetic options generation ...', () => { ... });
  describe('edge cases', () => { ... });
});
```

### ❌ BAD — Splitting the same feature into multiple sibling describes

```typescript
// ❌ WRONG – these two describes test the SAME feature: synthetic option generation
describe('single saved diseaseName in pastHistory[]', () => {
  it('should create synthetic option ...');
});

describe('single saved surgeryName in surgeryHistoryList[]', () => {
  it('should create synthetic option ...');
});
```

### ❌ BAD — Sub-features as top-level siblings instead of nested inside parent

```typescript
// ❌ WRONG – "keyword active" is a sub-behavior of synthetic options generation,
//            but it is placed as a sibling at the top level
describe('synthetic options generation from saved composite values (code::name)', () => {
  it.each([...])(...);
});

describe('keyword is active while enriching', () => {   // ← should be INSIDE the parent describe
  it('should skip when keyword is non-empty', ...);
});
```

### When to use a new describe vs. a new it

- **New `describe`**: Different **feature area** or **behavior category** (e.g., "keyword active state", "immutability", "edge cases")
- **New `it`**: Different **condition or input** for the _same_ feature → prefer `it.each` if structure is identical

### Example — per-function file

```typescript
// File: enrichSelectSearchOptionsMap.test.ts
// ✅ No outer describe wrapping the function name — file name handles that

describe('synthetic options generation from saved composite values (code::name)', () => {
  it.each([
    { condition: 'single saved diseaseName', field: 'diseaseName', ... },
    { condition: 'single saved surgeryName', field: 'surgeryName', ... },
  ])(
    'should create synthetic option for $condition and leave $otherField untouched',
    ({ field, arrayKey, value, expectedLabel, otherField }) => {
      // arrange
      const optionsMap = emptyOptionsMap();
      const formValues = { [arrayKey]: [{ [field]: value }] };

      // act
      const result = enrichSelectSearchOptionsMap(optionsMap, formValues);

      // assert
      expect(result[field]).toEqual([{ label: expectedLabel, value }]);
      expect(result[otherField]).toEqual([]);
    },
  );

  describe('keyword is active while enriching', () => {
    it('should skip synthetic entry for the field whose keyword is non-empty', () => {
      // arrange
      const optionsMap = emptyOptionsMap();
      const formValues = { pastHistory: [{ diseaseName: 'I10::原发性高血压' }] };
      const keywordMap = { diseaseName: '血压', surgeryName: '' };

      // act
      const result = enrichSelectSearchOptionsMap(optionsMap, formValues, keywordMap);

      // assert
      expect(result.diseaseName).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should return optionsMap unchanged when formValues is undefined', () => {
      // arrange
      const optionsMap = emptyOptionsMap();

      // act
      const result = enrichSelectSearchOptionsMap(optionsMap, undefined);

      // assert
      expect(result).toEqual(optionsMap);
    });
  });
});
```

### Example — component/multi-concern file

```typescript
// File: VideoEditor.test.tsx
// ✅ Outer describe IS appropriate here since file covers a whole component

describe('VideoEditor', () => {
  describe('Acceptance Criteria', () => {
    it('should return "1分钟" for durations from 1 to 59 seconds', () => {
      // arrange / act / assert ...
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined inputs', () => {
      // arrange / act / assert ...
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

## Lifecycle Hooks and Cleanup

Use `beforeEach` for setup and **prioritize `afterEach` for cleanup** to ensure tests do not pollute each other.

### 1. Setup with `beforeEach`

Use this to initialize data or reset common state before each test if it's simpler than doing it in the Arrange block of every test.

### 2. Cleanup with `afterEach` (CRITICAL)

Always perform cleanup in `afterEach` to guarantee a clean environment for the following tests, regardless of whether the current test passed or failed.

```typescript
afterEach(() => {
  // ✅ Clear mock call history and results
  vi.clearAllMocks();

  // ✅ Restore real timers if fake timers were used
  if (vi.isMockFunction(setTimeout)) {
    vi.useRealTimers();
  }
});
```

### 3. Global Cleanup vs. Local Cleanup

- **Global**: Common cleanup like `localStorage.clear()` is handled in `setupTests.ts`.
- **Local**: File-specific mocks or timers created within a test file MUST be cleaned up within that same file's `afterEach`.

---

## Summary

- **Mirror `src/` structure** in `tests/` folder
- **Use `.test.ts` / `.test.tsx`** file extension
- **AAA pattern is MANDATORY** with block comments
- **Organize with nested `describe` blocks**
- **Prioritize cleanup in `afterEach`** (e.g., `vi.clearAllMocks()`)
- **Name tests clearly** with "should + behavior + condition"
- **Add explanatory comments** for complex tests
