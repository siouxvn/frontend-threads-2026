# XState Machine Testing Patterns

## When to Test XState Machines

Test an XState machine when it contains **business logic** in the form of:

- State-specific **tags** that drive UI behavior (button disabled/loading states)
- **Entry actions** that update context (e.g. `assign`)
- **Guards** that branch transitions based on context
- **Async actors** (invoked services) that can succeed or fail
- **Reentry behavior** (`reenter: true`) that resets state

> ⚠️ **Do NOT test XState library internals** — trust that `createMachine`, `createActor`, and `send` work correctly.
> Focus instead on **your machine's states, transitions, context mutations, and tags**.

---

## Core Pattern: `createActor` + Real Events

**NEVER test a machine by inspecting its config object directly.** The following is WRONG:

```typescript
// ❌ BAD — testing static config, not behavior
it('should target displaying_folder_tree', () => {
  const state = createSelectingFolderPathState({ ... });
  expect(state.states.fetching_usb_folder_structures.invoke.onDone.target)
    .toBe('displaying_folder_tree');
});
```

**ALWAYS create a real actor and drive it with events:**

```typescript
// ✅ GOOD — testing actual runtime behavior
it('should transition to displaying_folder_tree when fetch resolves', async () => {
  // arrange
  const actor = createActor(machine).start();

  // act
  await waitForState(actor, s => s.matches({ selecting_folder_path: 'displaying_folder_tree' }));

  // assert
  expect(actor.getSnapshot().matches({ selecting_folder_path: 'displaying_folder_tree' })).toBe(true);
  expect(actor.getSnapshot().hasTag(TAGS.SELECT_LOADING)).toBe(false);
  actor.stop();
});
```

---

## Setup: Building a Minimal Test Machine

For **factory functions** (like `createSelectingFolderPathState`), wrap the output in a
full `createMachine` with surrounding states and provided actors:

```typescript
import { createActor, createMachine, fromPromise } from 'xstate';

const mockData = [{ id: 1, name: 'USB Drive' }];

function buildTestMachine(opts: {
  fetchImpl?: () => Promise<unknown[]>;
  onConfirmedTarget?: string;
}) {
  const fetchImpl = opts.fetchImpl ?? (() => Promise.resolve(mockData));

  return createMachine(
    {
      id: 'testHub',
      initial: 'idle',
      context: {
        t: (key: string) => `[${key}]`,   // simple i18n stub
        modalTitle: null,
        data: null,
        error: null,
      },
      states: {
        idle: {
          on: { START: 'selecting_folder_path' },
        },
        // ← Plug in the factory result directly, exactly as production code does
        selecting_folder_path: createSelectingFolderPathState({
          machineId: 'testHub',
          onFolderConfirmedTarget: opts.onConfirmedTarget ?? '#testHub.done',
          titleKey: 'test.title',
        }),
        done: { type: 'final' },
      },
    },
    {
      actors: {
        // Inject controlled async actor — each test decides resolve vs reject
        fetchUsbFolderStructures: fromPromise(fetchImpl),
      },
      actions: {
        handleError: () => { /* no-op in tests */ },
      },
    },
  );
}

function startActor(machine: ReturnType<typeof buildTestMachine>) {
  const actor = createActor(machine);
  actor.start();
  actor.send({ type: 'START' }); // enter the compound state under test
  return actor;
}
```

---

## Waiting for Async Transitions

XState actors are asynchronous. Use a polling helper instead of `waitFor` from testing-library
(which is for DOM, not XState snapshots):

```typescript
async function waitForState(
  actor: ReturnType<typeof startActor>,
  predicate: (snapshot: ReturnType<typeof actor.getSnapshot>) => boolean,
  timeoutMs = 2000,
): Promise<void> {
  const start = Date.now();
  while (!predicate(actor.getSnapshot())) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timeout waiting for state. Current: ${JSON.stringify(actor.getSnapshot().value)}`,
      );
    }
    await new Promise(r => setTimeout(r, 10));
  }
}
```

**Usage:**

```typescript
// Wait until machine reaches a specific nested state
await waitForState(actor, s =>
  s.matches({ selecting_folder_path: 'displaying_folder_tree' }),
);

// Wait for a top-level state
await waitForState(actor, s => s.matches('done'));
```

---

## Checking State and Tags

```typescript
const snapshot = actor.getSnapshot();

// ✅ Check nested compound state
expect(snapshot.matches({ selecting_folder_path: 'fetching_usb_folder_structures' })).toBe(true);

// ✅ Check top-level state
expect(snapshot.matches('idle')).toBe(true);

// ✅ Check tags (the primary way UI binds to machine state)
expect(snapshot.hasTag(TAGS.MODAL_SELECT)).toBe(true);
expect(snapshot.hasTag(TAGS.OK_DISABLED)).toBe(false);

// ✅ Check context mutations from entry/transition actions
expect(snapshot.context.usbFolderStructures).toEqual(mockData);
expect(snapshot.context.modalTitle).toBe('[test.title]');
expect(snapshot.context.error).toBeTruthy();
```

---

## Controlling the Async Actor Per Test

Each test injects its own `fetchImpl` so tests are fully isolated:

```typescript
// Test: fetch succeeds
buildTestMachine({ fetchImpl: () => Promise.resolve(mockData) });

// Test: fetch fails
buildTestMachine({ fetchImpl: () => Promise.reject(new Error('USB error')) });

// Test: fetch hangs (machine stays in fetching state)
buildTestMachine({ fetchImpl: () => new Promise(() => {}) });

// Test: first call fails, second call hangs (test RETRY behavior)
let callCount = 0;
buildTestMachine({
  fetchImpl: () => {
    callCount++;
    return callCount === 1
      ? Promise.reject(new Error('first attempt fails'))
      : new Promise(() => {}); // hang on retry
  },
});
```

---

## Cleanup

Always stop actors after each test to prevent actor subscription leaks:

```typescript
afterEach(() => {
  vi.clearAllMocks();
  // Stop actors inline in each test: actor.stop()
  // OR use a shared ref:
});

// OR — store and stop in afterEach
let actor: ReturnType<typeof startActor>;

afterEach(() => {
  actor?.stop();
  vi.clearAllMocks();
});
```

---

## Full Example: Testing a Compound State Factory

```typescript
import { createActor, createMachine, fromPromise } from 'xstate';
import { vi } from 'vitest';
import { createSelectingFolderPathState } from '@src/app/usbStorage/xstate/create-selecting-folder-path-state';
import { USB_FOLDER_SELECTION_TAGS as TAGS } from '@src/app/usbStorage/xstate/usb-folder-selection-tags';

// ... buildTestMachine and waitForState helpers defined above ...

afterEach(() => {
  vi.clearAllMocks();
});

describe('createSelectingFolderPathState — runtime behavior', () => {
  describe('fetching_usb_folder_structures', () => {
    it('should have loading tags while fetch is in flight', async () => {
      // arrange — fetch never resolves so machine stays in fetching_usb_folder_structures
      const actor = startActor(buildTestMachine({ fetchImpl: () => new Promise(() => {}) }));

      // assert
      expect(actor.getSnapshot().matches({ selecting_folder_path: 'fetching_usb_folder_structures' })).toBe(true);
      expect(actor.getSnapshot().hasTag(TAGS.SELECT_LOADING)).toBe(true);
      expect(actor.getSnapshot().hasTag(TAGS.OK_DISABLED)).toBe(true);
      expect(actor.getSnapshot().hasTag(TAGS.CANCEL_DISABLED)).toBe(true);
      actor.stop();
    });

    it('should transition to displaying_folder_tree on success', async () => {
      // arrange
      const actor = startActor(buildTestMachine({ fetchImpl: () => Promise.resolve(mockData) }));

      // act
      await waitForState(actor, s => s.matches({ selecting_folder_path: 'displaying_folder_tree' }));

      // assert
      expect(actor.getSnapshot().hasTag(TAGS.SELECT_LOADING)).toBe(false);
      expect(actor.getSnapshot().context.data).toEqual(mockData);
      actor.stop();
    });

    it('should transition to failed on error', async () => {
      // arrange
      const actor = startActor(buildTestMachine({
        fetchImpl: () => Promise.reject(new Error('USB error')),
      }));

      // act
      await waitForState(actor, s => s.matches({ selecting_folder_path: 'failed' }));

      // assert
      expect(actor.getSnapshot().hasTag(TAGS.STATUS_FAILED)).toBe(true);
      actor.stop();
    });
  });

  describe('RETRY event', () => {
    it('should re-enter fetching from failed state', async () => {
      // arrange
      let callCount = 0;
      const actor = startActor(buildTestMachine({
        fetchImpl: () => {
          callCount++;
          return callCount === 1
            ? Promise.reject(new Error('fail'))
            : new Promise(() => {}); // hang on retry
        },
      }));
      await waitForState(actor, s => s.matches({ selecting_folder_path: 'failed' }));

      // act
      actor.send({ type: 'RETRY' });

      // assert
      await waitForState(actor, s =>
        s.matches({ selecting_folder_path: 'fetching_usb_folder_structures' }),
      );
      expect(actor.getSnapshot().hasTag(TAGS.SELECT_LOADING)).toBe(true);
      actor.stop();
    });
  });

  describe('CANCEL event', () => {
    it('should return to idle from displaying_folder_tree', async () => {
      // arrange
      const actor = startActor(buildTestMachine({ fetchImpl: () => Promise.resolve(mockData) }));
      await waitForState(actor, s => s.matches({ selecting_folder_path: 'displaying_folder_tree' }));

      // act
      actor.send({ type: 'CANCEL' });

      // assert
      expect(actor.getSnapshot().matches('idle')).toBe(true);
      actor.stop();
    });
  });
});
```

---

## Tags Coverage: Use `it.each`

When verifying that multiple `{tag, subState, expected}` combinations are correct,
use `it.each` to avoid repetitive tests:

```typescript
it.each([
  [TAGS.MODAL_SELECT,    true,  'fetching_usb_folder_structures'],
  [TAGS.OK_DISABLED,     true,  'fetching_usb_folder_structures'],
  [TAGS.SELECT_LOADING,  true,  'fetching_usb_folder_structures'],
  [TAGS.CANCEL_DISABLED, true,  'fetching_usb_folder_structures'],
  [TAGS.MODAL_SELECT,    true,  'displaying_folder_tree'],
  [TAGS.OK_DISABLED,     false, 'displaying_folder_tree'],
  [TAGS.MODAL_SELECT,    true,  'failed'],
  [TAGS.STATUS_FAILED,   true,  'failed'],
  [TAGS.OK_DISABLED,     true,  'failed'],
])(
  'tag %s should be %s in %s',
  async (tag, expected, subState) => {
    const fetchImpl =
      subState === 'fetching_usb_folder_structures' ? () => new Promise<never>(() => {})
      : subState === 'displaying_folder_tree'       ? () => Promise.resolve(mockData)
      :                                               () => Promise.reject(new Error('err'));

    const actor = startActor(buildTestMachine({ fetchImpl }));
    await waitForState(actor, s => s.matches({ selecting_folder_path: subState }));

    expect(actor.getSnapshot().hasTag(tag)).toBe(expected);
    actor.stop();
  },
);
```

---

## Anti-Patterns to Avoid

| ❌ Anti-pattern | ✅ Correct approach |
|---|---|
| `expect(state.states.fetching.invoke.src).toBe(...)` | Drive actor, check `snapshot.matches(...)` |
| `expect(state.on.RETRY.target).toBe(...)` | Send `RETRY` event, verify new state with `snapshot.matches` |
| `expect(state.states.failed.tags).toContain(...)` | Drive to failed state, check `snapshot.hasTag(...)` |
| Not calling `actor.stop()` after test | Always call `actor.stop()` to prevent subscription leaks |
| Using `waitFor` from `@testing-library/react` for XState | Use a custom polling `waitForState` helper |
| Setting up fetch mocks with MSW for state machine unit tests | Inject `fetchImpl` directly via `fromPromise` in `provide()` |

---

## Reference Implementation

See actual usage in:
- `tests/app/usbStorage/xstate/create-selecting-folder-path-state.test.ts`
