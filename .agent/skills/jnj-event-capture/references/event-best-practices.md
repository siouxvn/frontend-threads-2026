# Event Best Practices

This guide helps you determine **which events to track** and **which to avoid**. Focus on conceptual decisions, not implementation details (see `event-patterns.md` for implementation).

---

## Quick Decision Framework

Use this flowchart to decide whether to create an event:

```
┌────────────────────────────────────────────────────────────────┐
│                    USER ACTION OCCURRED                        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────┐
            │ Does it provide business value  │
            │ to know this action happened?   │
            └─────────────────────────────────┘
                    │               │
                   YES              NO ──────► DO NOT TRACK
                    │
                    ▼
            ┌─────────────────────────────────┐
            │ Is it a navigation action       │
            │ (clicking link/button to go     │
            │ to another page)?               │
            └─────────────────────────────────┘
                    │               │
                   YES              NO
                    │               │
                    ▼               ▼
         Track VIEW event      Continue below
         in DESTINATION        (track at source)
         page instead
                                    │
                                    ▼
            ┌─────────────────────────────────┐
            │ Does it trigger an async        │
            │ operation (API call/query)?     │
            └─────────────────────────────────┘
                    │               │
                   YES              NO
                    │               │
                    ▼               ▼
            Use Three-Phase    Use Simple Capture
            CRUD Pattern       Pattern
```

---

## ✅ Events You SHOULD Track

### 1. Page/View Events

Track when a user **successfully views** a page or major section.

| Event Type   | Example               | Why Track                                   |
| ------------ | --------------------- | ------------------------------------------- |
| Page load    | `VIEW_DASHBOARD`      | Know which pages are most visited           |
| Detail view  | `VIEW_PATIENT_DETAIL` | Track user engagement with specific records |
| Section view | `VIEW_REPORT`         | Understand feature usage                    |

**Rules:**

- Track in the **destination** component, not when clicking to navigate
- Use `EventType.Other` (not `Business`)
- Include relevant context (e.g., `researchId`, `patientId`)

### 2. CRUD Operations

Track Create, Read, Update, Delete operations that **persist data**.

| Operation | Example                               | Pattern          |
| --------- | ------------------------------------- | ---------------- |
| Create    | `CREATE_PATIENT`, `CREATE_DEPARTMENT` | Three-Phase CRUD |
| Update    | `UPDATE_SURGERY_INFO`, `RENAME_VIDEO` | Three-Phase CRUD |
| Delete    | `DELETE_SURGERY`, `DELETE_SCREENSHOT` | Three-Phase CRUD |

**Rules:**

- Always use Three-Phase pattern (attempt → succeeded → failed)
- Track the entity ID and relevant metadata
- Include error details on failure

### 3. Data Import/Export

Track when users move data in or out of the system.

| Operation | Example                | Why Track                     |
| --------- | ---------------------- | ----------------------------- |
| Export    | `EXPORT_SURGERY_VIDEO` | Know what data users extract  |
| Import    | `IMPORT_MONARCH_DATA`  | Track data ingestion patterns |

**Rules:**

- Use `EventType.DataIO`
- Use Three-Phase pattern (can fail)
- Include file type, size if available

### 4. Significant User Interactions

Track interactions that **change the user's experience** or indicate intent.

| Interaction    | Example               | Why Track                        |
| -------------- | --------------------- | -------------------------------- |
| Toggle feature | `TOGGLE_PRIVACY_MODE` | Know feature adoption            |
| Filter data    | `FILTER_PATIENT_LIST` | Understand search patterns       |
| Play media     | `PLAY_VIDEO`          | Track content engagement         |
| Select items   | `SELECT_ALL_PATIENTS` | Understand batch operation usage |

**Rules:**

- Only track if it provides actionable insights
- Include the state change (e.g., `isEnabled: true/false`)

### 5. Authentication Events

Track user session lifecycle.

| Event          | Example           |
| -------------- | ----------------- |
| Login          | `LOGIN`           |
| Logout         | `LOGOUT`          |
| Session expire | `SESSION_EXPIRED` |

---

## ❌ Events You Should NOT Track

### 1. Navigation Events (Anti-pattern)

**❌ DON'T:** Track "user clicked to go to X"

```typescript
// ❌ WRONG - Don't do this
onClick={() => {
  eventTracker.capture({ name: 'NAVIGATE_TO_PATIENT_DETAIL' });
  navigate('/patient/123');
}}
```

**✅ DO:** Track View event in destination page

```typescript
// ✅ CORRECT - In PatientDetail.tsx
useEffect(() => {
  eventTracker.capture({ name: 'VIEW_PATIENT_DETAIL' });
}, []);
```

**Why?**

- Navigation can fail (network error, auth redirect, user cancels)
- You'll get duplicate data (click + view)
- Destination page is the source of truth

### 2. Every Button Click

**❌ DON'T:** Track every UI interaction without business purpose

```typescript
// ❌ WRONG - No business value
eventTracker.capture({ name: 'CLICK_SUBMIT_BUTTON' });
eventTracker.capture({ name: 'CLICK_CANCEL_BUTTON' });
eventTracker.capture({ name: 'HOVER_MENU_ITEM' });
```

**✅ DO:** Track the meaningful outcome instead

```typescript
// ✅ CORRECT - Track what the button did
eventTracker.attempt({ name: 'CREATE_PATIENT' });
```

### 3. Form Field Changes

**❌ DON'T:** Track every keystroke or field change

```typescript
// ❌ WRONG - Too granular
onChange={e => {
  eventTracker.capture({ name: 'CHANGE_PATIENT_NAME', data: e.target.value });
}}
```

**✅ DO:** Track when form is submitted

```typescript
// ✅ CORRECT - Track the submission
onSubmit={() => {
  eventTracker.attempt({ name: 'UPDATE_PATIENT_INFO' });
}}
```

### 4. UI State Changes (No Persistence)

**❌ DON'T:** Track temporary UI states

```typescript
// ❌ WRONG - No business value
eventTracker.capture({ name: 'OPEN_DROPDOWN' });
eventTracker.capture({ name: 'CLOSE_MODAL' });
eventTracker.capture({ name: 'EXPAND_ACCORDION' });
```

**Exception:** Track if the state change is a meaningful feature toggle (e.g., `TOGGLE_PRIVACY_MODE`)

### 5. Automatic/System Events

**❌ DON'T:** Track things triggered automatically without user action

```typescript
// ❌ WRONG - Not user-initiated
useEffect(() => {
  eventTracker.capture({ name: 'DATA_LOADED' }); // Auto-triggered
}, [data]);
```

**Exception:** Track system events that have business meaning (e.g., `SESSION_EXPIRED`)

---

## Event Naming Conventions

### Format

```
module:type:action_entity
```

### Modules

| Module      | Description              | Example                            |
| ----------- | ------------------------ | ---------------------------------- |
| `research`  | Research center features | `research:business:create_patient` |
| `surgery`   | Surgery center features  | `surgery:data_io:export_video`     |
| `admin`     | Admin panel features     | `admin:business:create_user`       |
| `dashboard` | Dashboard features       | `dashboard:other:view_dashboard`   |
| `auth`      | Authentication           | `auth:auth:login`                  |

### Types

| Type       | When to Use              | Example                            |
| ---------- | ------------------------ | ---------------------------------- |
| `Other`    | View/page load events    | `research:other:view_patient_list` |
| `Business` | CRUD, user interactions  | `research:business:create_patient` |
| `DataIO`   | Import/export operations | `surgery:data_io:export_video`     |
| `Auth`     | Authentication events    | `auth:auth:login`                  |

### Action Naming

Use `action_entity` format:

```
✅ view_patient_list      (view + entity)
✅ create_patient         (action + entity)
✅ toggle_privacy_mode    (action + feature)
✅ filter_patient_list    (action + target)
✅ export_surgery_video   (action + entity)

❌ patient_list_view      (wrong order)
❌ patientCreate          (camelCase not allowed)
❌ click_button           (too generic)
```

---

## Payload Guidelines

### What to Include

| Always Include                    | Sometimes Include      | Never Include        |
| --------------------------------- | ---------------------- | -------------------- |
| Entity IDs (patientId, surgeryId) | Operation metadata     | Sensitive PII        |
| User context (from system)        | Filter/search criteria | Passwords            |
| Timestamp (automatic)             | Result counts          | Full response bodies |
| Action result (success/fail)      | Error codes/messages   | Large data blobs     |

### Example Payloads

```typescript
// View event - minimal context
{
  name: 'research:other:view_patient_detail',
  description: {
    data: {
      patientId: '123',
      researchId: '456'
    }
  }
}

// CRUD event - include operation details
{
  name: 'research:business:create_patient',
  description: {
    data: {
      patientId: '123',
      researchId: '456'
    }
  },
  payload: {
    surgeryType: 'knee_replacement'
  }
}

// Error event - include error details
{
  name: 'research:business:create_patient',
  error: {
    code: '400',
    message: 'Patient already exists'
  }
}
```

---

## Decision Checklist

Before creating a new event, answer these questions:

- [ ] **Business value**: Will this data help make product decisions?
- [ ] **Not navigation**: Am I tracking a view, not a click-to-navigate?
- [ ] **Right granularity**: Am I tracking outcomes, not every interaction?
- [ ] **Correct type**: Am I using the right EventType?
- [ ] **Correct pattern**: Three-Phase for async, Simple for sync?
- [ ] **Proper naming**: Does it follow `module:type:action_entity`?
- [ ] **Minimal payload**: Am I only including necessary data?

---

## Reference: Existing Events by Category

For implementation examples, refer to these existing events:

### View Events

- `VIEW_DASHBOARD` - Dashboard.tsx
- `VIEW_MY_RESEARCH` - MyResearch.tsx
- `VIEW_PATIENT_LIST` - PatientList.tsx
- `VIEW_PATIENT_DETAIL` - UpsertPatient.tsx
- `VIEW_INFORMATION` - SurgeryInfo.tsx
- `VIEW_REPORT` - SurgeryReport.tsx
- `VIEW_RESOURCES` - SurgeryResources.tsx

### CRUD Events (Three-Phase)

- `CREATE_PATIENT`, `CREATE_USER`, `CREATE_DEPARTMENT`, `CREATE_SURGERY_TYPE`
- `UPDATE_USER`, `UPDATE_USER_STATUS`, `UPDATE_SURGERY_INFO`, `UPDATE_REPORT`
- `DELETE_SURGERY`, `DELETE_DEPARTMENT`, `DELETE_SURGERY_TYPE`
- `RENAME_SURGERY_VIDEO`, `RENAME_SURGERY_SCREENSHOT`, `RENAME_VIDEO_DRAFT`

### Data I/O Events

- `EXPORT_SURGERY_VIDEO`, `EXPORT_SURGERY_SCREENSHOT`
- `IMPORT_MONARCH_DATA`

### Interaction Events

- `TOGGLE_PRIVACY_MODE` - PatientList.tsx
- `FILTER_PATIENT_LIST` - useAggregatedPatients.tsx
- `SELECT_ALL_PATIENTS` - PatientList.tsx
- `PLAY_VIDEO` - VideoItem.tsx, ViewVideos.tsx
