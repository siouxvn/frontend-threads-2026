# Event Report Template

Use this template when creating event capture reports. Replace all `{{PLACEHOLDER}}` values with actual content.

---

# Event Capture Report - {{FEATURE_NAME}}

## Relevant Files

- `path/to/main-component.tsx` - Main component description
- `path/to/hook.ts` - Hook or utility description
- `path/to/events.ts` - Event definitions file
- ...

## Event Table

| Module     | Type     | Event Name           | Pattern          | Feature            | Status  | Description                                               | Payload         |
| ---------- | -------- | -------------------- | ---------------- | ------------------ | ------- | --------------------------------------------------------- | --------------- |
| {{module}} | other    | `view_{{feature}}`   | Simple View      | View {{Feature}}   | Missing | Track when user views the {{feature}}                     | `{ id }`        |
| {{module}} | business | `create_{{entity}}`  | Three-Phase CRUD | Create {{Entity}}  | Missing | Track {{entity}} creation attempts, success, and failures | `{ entityId }`  |
| {{module}} | business | `toggle_{{feature}}` | Simple Capture   | Toggle {{Feature}} | Missing | Track when user toggles {{feature}}                       | `{ isEnabled }` |

**Pattern Types:**

- **Simple View** - For page/component view tracking (use `EventType.Other`)
- **Simple Capture** - For instant actions without async operations (use `EventType.Business`)
- **Three-Phase CRUD** - For async operations: Attempt → Succeeded → Failed (use `EventType.Business`)

**Status Values:**

- `Exists` - Event is already implemented
- `Missing` - Event needs to be implemented
- `Partial` - Event exists but needs updates

---

## Technical Design

### 1. {{Event Name}} Event

**Pattern:** {{Pattern Type}}  
**Location:** `{{FilePath}}` - {{where in the file}}

```typescript
// Code example showing the implementation
```

---

### 2. {{Event Name}} Event (Three-Phase CRUD)

**Pattern:** Three-Phase CRUD Operation (Attempt → Succeeded → Failed)  
**Location:** `{{FilePath}}` - {{where in the file}}

{{Brief explanation of why this pattern is used}}

```typescript
// Code example showing the Three-Phase implementation
```

---

## Event Definitions Update

**File:** `src/app/{{module}}/events.ts`

```typescript
import { EventModule, EventType } from '../eventTracking';

// View events (use EventType.Other)
const VIEW_{{FEATURE}} = `${EventModule.{{Module}}}:${EventType.Other}:view_{{feature}}`;

// Business events (use EventType.Business)
const CREATE_{{ENTITY}} = `${EventModule.{{Module}}}:${EventType.Business}:create_{{entity}}`;
const UPDATE_{{ENTITY}} = `${EventModule.{{Module}}}:${EventType.Business}:update_{{entity}}`;
const DELETE_{{ENTITY}} = `${EventModule.{{Module}}}:${EventType.Business}:delete_{{entity}}`;

export const events = {
  VIEW_{{FEATURE}},
  CREATE_{{ENTITY}},
  UPDATE_{{ENTITY}},
  DELETE_{{ENTITY}},
};
```

---

## Translation Updates

**File:** `src/infrastructure/localize/languages/eventLog.json`

> ⚠️ **IMPORTANT:** For Three-Phase CRUD events, you must define separate translations for `_attempt`, `_succeeded`, and `_failed` suffixes.
>
> **Do NOT include `{{error}}` in `_failed` descriptions!** The error details are displayed separately by the admin UI.

Add translations for the new events:

```json
{
  "{{module}}": {
    "view_{{feature}}": {
      "name": "查看{{Feature_CN}}",
      "description": "用户查看{{Feature_CN}}"
    },
    "create_{{entity}}_attempt": {
      "name": "创建{{Entity_CN}}",
      "description": "用户尝试创建{{Entity_CN}} \"{{entityId}}\""
    },
    "create_{{entity}}_succeeded": {
      "name": "创建{{Entity_CN}}成功",
      "description": "{{Entity_CN}} \"{{entityId}}\" 创建成功"
    },
    "create_{{entity}}_failed": {
      "name": "创建{{Entity_CN}}失败",
      "description": "创建{{Entity_CN}} \"{{entityId}}\" 失败"
    },
    "toggle_{{feature}}": {
      "name": "切换{{Feature_CN}}",
      "description": "用户{{isEnabled}}{{Feature_CN}}"
    }
  }
}
```

### Translation Naming Conventions

| Pattern                  | Name Format (Chinese)    | Description Format                    |
| ------------------------ | ------------------------ | ------------------------------------- |
| Simple View              | 查看{{Feature}}          | 用户查看{{Feature}}                   |
| Simple Capture           | {{Action}}{{Feature}}    | 用户{{Action}}{{Feature}}             |
| Three-Phase `_attempt`   | {{Action}}{{Entity}}     | 用户尝试{{Action}}{{Entity}} "{{id}}" |
| Three-Phase `_succeeded` | {{Action}}{{Entity}}成功 | {{Entity}} "{{id}}" {{Action}}成功    |
| Three-Phase `_failed`    | {{Action}}{{Entity}}失败 | {{Action}}{{Entity}} "{{id}}" 失败    |

---

## Notes

- **Status** indicates whether the event is already implemented.
- **Payload** should be specified only when applicable.
- **View events** use `EventType.Other` (not `EventType.Business`) following the project conventions.
- {{Add feature-specific notes here}}

---

## Checklist

Before marking this report as complete, verify:

- [ ] All events are listed in the Event Table
- [ ] Each event has a Technical Design section with code example
- [ ] Event Definitions are added to the module's `events.ts`
- [ ] Translations are provided for all events (with Three-Phase suffixes where applicable)
- [ ] No `{{error}}` placeholders in `_failed` translations
