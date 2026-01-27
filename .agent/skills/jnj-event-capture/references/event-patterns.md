## Patterns Catalog

### Pattern 1: Simple View Event

**Usage:**

```typescript
useEffect(() => {
  eventTracker.capture({
    name: events.VIEW_SOMETHING,
  });
}, []);
```

**Files:**

- Dashboard.tsx - VIEW_DASHBOARD
- SurgeryInfo.tsx - VIEW_INFORMATION
- SurgeryReport.tsx - VIEW_REPORT
- SurgeryResources.tsx - VIEW_RESOURCES
- MyResearch.tsx - VIEW_MY_RESEARCH

---

### Pattern 2: Three-Phase CRUD Operation (Attempt → Succeeded → Failed)

Use this pattern for any CRUD/action that should be measured as a single user flow.

The key is to:

- Emit an Attempt event right before calling the API.
- Emit Succeeded or Failed using the same flowId.
- Always reset flowIdRef to avoid accidentally linking the next operation to the previous flow.

**Base implementation (plain async)**

```typescript
const flowIdRef = useRef<string | null>(null);

const handleOperation = async (id: string, data: unknown) => {
  // Phase 1: Attempt
  flowIdRef.current = eventTracker.attempt({
    name: events.OPERATION_ATTEMPT,
    description: { data: { id } },
    payload: {
      // optional: stable metadata only (avoid large objects)
    },
  });

  try {
    const result = await api.operation(id, data);

    // Phase 2: Success
    eventTracker.succeeded({
      flowId: flowIdRef.current!,
      name: events.OPERATION_SUCCEEDED,
      description: { data: { id } },
      payload: {
        // optional: outcome summary only
        newValue: result.value,
      },
    });

    return result;
  } catch (error: any) {
    // Phase 3: Failure
    eventTracker.failed({
      flowId: flowIdRef.current!,
      name: events.OPERATION_FAILED,
      description: { data: { id } },
      error: {
        code: String(error?.response?.status ?? 'UNKNOWN'),
        message: String(error?.message ?? 'Unknown error'),
      },
    });

    throw error;
  } finally {
    // Important: avoid leaking flowId across operations
    flowIdRef.current = null;
  }
};
```

**Usage with TanStack Query (custom hook)**

```typescript
export const useDepartmentCreation = (refetchDepartments: () => void) => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const flowIdRef = useRef<string | null>(null);

  const {
    mutate: createDepartmentMutation,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: (request: CreateDepartmentRequest) => createDepartments(request),

    onMutate: request => {
      flowIdRef.current = eventTracker.attempt({
        name: events.CREATE_DEPARTMENT,
        description: {
          data: {
            departmentName: request.names?.[0],
          },
        },
        payload: {
          // Optional. Avoid large payloads; only include what's needed for analysis.
          restfulPayload: JSON.stringify(request),
        },
      });
    },

    onSuccess: (data, request) => {
      eventTracker.succeeded({
        flowId: flowIdRef.current!,
        name: events.CREATE_DEPARTMENT,
        description: {
          data: {
            departmentName: request.names?.[0],
          },
        },
        payload: {
          departmentIds: data.map(d => d.id),
        },
      });

      message.success(t('admin.department.success'));
      refetchDepartments();
    },

    onError: (error: any, request) => {
      eventTracker.failed({
        flowId: flowIdRef.current!,
        name: events.CREATE_DEPARTMENT,
        description: {
          data: {
            departmentName: request.names?.[0],
          },
        },
        error: {
          code: String(error?.response?.status ?? 'UNKNOWN_ERROR'),
          message: String(error?.message ?? 'Unknown error'),
        },
      });

      message.error(t('admin.department.error'));
    },

    onSettled: () => {
      flowIdRef.current = null;
    },
  });

  return {
    isPending,
    isSuccess,
    createDepartmentMutation,
  };
};
```

Reference: `src\app\admin\components\newAccount\useDepartmentCreation.tsx`

**Usage with xstate statemachine**

```typescript
const [state, send] = useMachine(
  exportMachineRemote.provide({
    actors: {
      getScreenshotDownloadUrl: fromPromise(() => getSurgeryScreenshotDownloadUrl(surgeryId, id)),
      prepareExportingVideo: fromPromise(() => prepareVideoMutateAsync({ surgeryId, id })),
      trackPrepareExportingVideoStatus: fromPromise(async ({ input, signal }) => {
        const { taskId } = input;
        const result = await trackProcessingProgress({ surgeryId, id, taskId, signal });
        if (!result) {
          logger.debug('Track prepare exporting video status aborted');
          return;
        }

        return { filePath: result.filePath };
      }),
      getVideoDownloadUrl: fromPromise(() => getSurgeryVideoDownloadUrl(surgeryId, id)),
      openFilePicker: fromPromise(() => getFileHandle(getDefaultFileName(label, surgeryId, fileType), fileType)),
      download: fromPromise(({ input, signal }) => exportToClientMachine({ input, signal })),
      cancelDownload: fromPromise(({ input }) => input.writable?.abort()),
      closeDownload: fromPromise(({ input }) => input.writable?.close()),
      cancelPrepareExportingVideo: fromPromise(({ input }) => cancelPrepareExportingVideo(surgeryId, id, input.taskId)),
    },
    actions: {
      handleError: ({ context }) => {
        let errorMessage = t('common.unknownError');

        if (context.error instanceof Error) {
          errorMessage = context.error.message ? context.error.message : t('common.unknownError');
        }

        eventTracker.failed({
          flowId: flowIdRef.current!,
          name: fileType === 'video' ? events.EXPORT_SURGERY_VIDEO : events.EXPORT_SURGERY_SCREENSHOT,
          description: {
            data: {
              surgeryId,
              ...(fileType === 'video' ? { videoId: id } : { screenshotId: id }),
            },
          },
          error: {
            code: (context.error as AxiosError)?.response?.status?.toString() ?? 'UNKNOWN_ERROR',
            message: errorMessage,
          },
        });
        flowIdRef.current = null;
        logger.error(errorMessage, { error: context.error });
        setErrorMessage(errorMessage);
      },
      handleSuccess: () => {
        eventTracker.succeeded({
          flowId: flowIdRef.current!,
          name: fileType === 'video' ? events.EXPORT_SURGERY_VIDEO : events.EXPORT_SURGERY_SCREENSHOT,
          description: {
            data: {
              surgeryId,
              ...(fileType === 'video' ? { videoId: id } : { screenshotId: id }),
            },
          },
        });
        flowIdRef.current = null;
      },
      trackCancelPrepareAttempt: () => {
        if (fileType === 'video') {
          cancelPrepareFlowIdRef.current = eventTracker.attempt({
            name: events.CANCEL_VIDEO_EXPORT_PREPARATION,
            description: {
              data: {
                surgeryId,
                videoId: id,
              },
            },
            payload: { surgeryId, videoId: id },
          });
        }
      },
      trackCancelPrepareSucceeded: () => {
        if (fileType === 'video' && cancelPrepareFlowIdRef.current) {
          eventTracker.succeeded({
            flowId: cancelPrepareFlowIdRef.current,
            name: events.CANCEL_VIDEO_EXPORT_PREPARATION,
            description: {
              data: {
                surgeryId,
                videoId: id,
              },
            },
          });
          cancelPrepareFlowIdRef.current = null;
        }
      },
      trackCancelPrepareFailed: ({ context }) => {
        if (fileType === 'video' && cancelPrepareFlowIdRef.current) {
          let errorMessage = t('common.unknownError');
          if (context.error instanceof Error && context.error.message) {
            errorMessage = context.error.message;
          }

          eventTracker.failed({
            flowId: cancelPrepareFlowIdRef.current,
            name: events.CANCEL_VIDEO_EXPORT_PREPARATION,
            description: {
              data: {
                surgeryId,
                videoId: id,
              },
            },
            error: {
              code: (context.error as AxiosError)?.response?.status?.toString() ?? 'UNKNOWN_ERROR',
              message: errorMessage,
            },
          });
          cancelPrepareFlowIdRef.current = null;
        }
      },
      trackCancelDownloading: () => {
        if (fileType === 'video') {
          eventTracker.capture({
            name: events.CANCEL_VIDEO_EXPORT_DOWNLOADING,
            description: {
              data: {
                surgeryId,
                videoId: id,
              },
            },
            payload: { surgeryId, videoId: id },
          });
        }
      },
    },
  }),
  {
    input: undefined,
    inspect: loggerXstateInspector,
  },
);
```

Reference: `src\app\surgeryCenter\components\export\remoteExport\ExportButton.remote.tsx`

---

### Pattern 3: User Identification Lifecycle

**Usage:**

```typescript
// On login success
eventTracker.identify({ userId: user.userId });

// On boot (if already logged in)
if (isLoggedIn) {
  eventTracker.identify({ userId: user.userId });
}

// On logout
eventTracker.reset();
```

**File:**

- AuthProvider.tsx

---

### Pattern 4: Play Video Event with Metadata

**Usage:**

```typescript
eventTracker.capture({
  name: createPlayVideoEvent(module),
  description: {
    data: {
      surgeryId: (item as Video).surgeryId,
      videoId: item.id,
      videoName: item.label,
      videoType: (item as Video).type,
      playMode: 'inline',
      patientRecordId,
    },
  },
});
```

**Files:**

- `src\app\surgeryResources\components\videoItem\VideoItem.tsx`
- `src\app\surgeryResources\components\viewVideos\ViewVideos.tsx`

---

## Infrastructure Layer

### Core Files (7 files, 223 lines)

#### 1. eventTracker.ts (202 lines)

**Location:** `src/infrastructure/eventTracking/eventTracker.ts`

**Public API:**

```typescript
interface EventTracker {
  // Initialization
  init(config: { p: string; send: Function }): void;
  shutdown(): Promise<void>;

  // User tracking
  identify(actor: { userId: string }): void;
  reset(): void;

  // Event capture
  capture(event: CaptureEvent): void;
  attempt(event: AttemptEvent): string; // Returns flowId
  succeeded(event: SucceededEvent): void;
  failed(event: FailedEvent): void;
}
```

**Call Sites:**

- `src/main.tsx:35` - init()
- `src/App.tsx:62` - shutdown()
- `src/app/auth/AuthProvider.tsx:151` - reset()
- `src/app/auth/AuthProvider.tsx:172` - identify()
- `src/app/auth/AuthProvider.tsx:242` - identify()

#### 2. eventQueue.ts (43 lines)

**Location:** `src/infrastructure/eventTracking/eventQueue.ts`

**Features:**

- p-queue with concurrency: 1 (sequential)
- p-retry with 4 retries
- Exponential backoff: 250ms → 500ms → 1000ms → 3000ms
- `enqueue(event)` - Add to queue
- `flush()` - Wait for all pending

#### 3. Event.ts (21 lines)

**Location:** `src/infrastructure/eventTracking/Event.ts`

**Type Definitions:**

```typescript
type Event = {
  id: string; // UUID v4
  name: string; // module:type:event_name
  timestamp: string; // ISO 8601
  actor: {
    anonymousId: string;
    userId?: string;
  };
  description?: {
    key?: string; // Auto-generated
    data?: Record<string, unknown>;
  };
  payload?: Record<string, unknown>;
  context?: {
    package?: string;
    route?: string;
    os?: string;
    osVersion?: string;
    browser?: string;
    browserVersion?: string;
  };
  sessionId?: string;
};
```

#### 4. actorManager.ts (38 lines)

**Location:** `src/infrastructure/eventTracking/actorManager.ts`

**Functions:**

- `init()` - Generate anonymousId
- `identify(userId)` - Set userId
- `reset()` - Clear userId, new anonymousId
- `getActor()` - Get current actor

#### 5. contextManager.ts (38 lines)

**Location:** `src/infrastructure/eventTracking/contextManager.ts`

**Functions:**

- `init()` - Parse User-Agent, get route
- `refresh()` - Update route on navigation
- `getContext()` - Return context object

**Context Fields:**

- package: 'hub' | 'vision' | 'remote'
- route: current URL path
- os: operating system name
- osVersion: OS version
- browser: browser name
- browserVersion: browser version

#### 6. sessionManager.ts (39 lines)

**Location:** `src/infrastructure/eventTracking/sessionManager.ts`

**Functions:**

- `init()` - Create session
- `getSessionId()` - Get ID
- `end()` - End session

**Session Data:**

- id: UUID v4
- startedAt: ISO 8601
- entryRoute: initial URL
- endedAt: ISO 8601 (optional)
- exitRoute: final URL (optional)

#### 7. index.ts (3 lines)

**Location:** `src/infrastructure/eventTracking/index.ts`

**Exports:**

```typescript
export { eventTracker } from './eventTracker';
```

---

## Event Definitions

### 5 Event Definition Files

- `src/app/dashboard/events.ts`
- `src/app/admin/events.ts`
- `src/app/surgeryCenter/events.ts`
- `src/app/surgeryResources/events.ts`
- `src/app/researchCenter/events.ts`
