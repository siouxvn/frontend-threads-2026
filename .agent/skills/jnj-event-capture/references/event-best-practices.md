## Key Conventions & Guidelines

### 1. Event Type Conventions

When defining events, use the correct `EventType` based on the event's purpose:

| Event Category        | EventType  | Example Event Name                      |
| --------------------- | ---------- | --------------------------------------- |
| View/Page Load events | `Other`    | `research:other:view_patient_list`      |
| CRUD operations       | `Business` | `research:business:create_patient`      |
| User interactions     | `Business` | `research:business:toggle_privacy_mode` |
| Data import/export    | `DataIO`   | `surgery:data_io:export_video`          |
| Authentication        | `Auth`     | `auth:auth:login`                       |

**Important:** View events (tracking page loads) should use `EventType.Other`, **not** `EventType.Business`.

### 2. Navigation Events vs View Events

**Do NOT create navigation events** (e.g., "user clicked to navigate to X").

**DO create View events** in the destination component/page.

| ❌ Wrong Approach                                                  | ✅ Correct Approach                                             |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Track `NAVIGATE_TO_PATIENT_DETAIL` when user clicks Edit button    | Track `VIEW_PATIENT_DETAIL` in `UpsertPatient.tsx` on page load |
| Track `NAVIGATE_TO_DASHBOARD` when user clicks Dashboard menu item | Track `VIEW_DASHBOARD` in `Dashboard.tsx` on page load          |

**Why?**

- Navigation can fail (user cancels, network error, etc.)
- The destination page is the source of truth for "user viewed X"
- Simpler and more accurate tracking

### 3. When to Use Three-Phase CRUD Pattern

Use **Three-Phase CRUD** (attempt → succeeded → failed) when the user action triggers an **async operation** that can succeed or fail.

| User Action                   | Triggers Async Operation? | Pattern              |
| ----------------------------- | ------------------------- | -------------------- |
| User applies filter           | Yes (query is triggered)  | **Three-Phase CRUD** |
| User clicks "Create" button   | Yes (API call)            | **Three-Phase CRUD** |
| User toggles a switch         | No (local state only)     | Simple Capture       |
| User navigates to a page      | No                        | Simple View Event    |
| User selects items in a table | No (local state only)     | Simple Capture       |

**Key insight:** If the action immediately triggers an API call or query (even a GET request like filtering), use Three-Phase CRUD to properly track success/failure states.

---

## Complete File Inventory

#### **Group 2: Admin Module**

##### src/app/admin/pages/user/EditUserPage.tsx

- **Pattern:** Update operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** UPDATE_USER
- **Tracked:** User ID being updated

##### src/app/admin/pages/user/useUserCreation.tsx

- **Pattern:** Create operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** CREATE_USER
- **Tracked:** Username, department

##### src/app/admin/pages/user/UserManagerPage.tsx

- **Pattern:** Status update
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** UPDATE_USER_STATUS
- **Tracked:** User ID, new status

##### src/app/admin/pages/department/useDepartmentCreation.tsx

- **Pattern:** Create operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** CREATE_DEPARTMENT
- **Tracked:** Department name

##### src/app/admin/pages/department/useDepartmentDeletion.tsx

- **Pattern:** Delete operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** DELETE_DEPARTMENT
- **Tracked:** Department ID

##### src/app/admin/pages/surgeryType/useSurgeryTypeCreation.tsx

- **Pattern:** Create operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** CREATE_SURGERY_TYPE
- **Tracked:** Type name, department ID

##### src/app/admin/pages/surgeryType/useSurgeryTypeDeletion.tsx

- **Pattern:** Delete operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** DELETE_SURGERY_TYPE
- **Tracked:** Type ID

---

#### **Group 3: Dashboard**

##### src/app/dashboard/Dashboard.tsx

- **Line:** 15
- **Pattern:** View event
- **Call:** `eventTracker.capture({ name: events.VIEW_DASHBOARD })`
- **Event:** VIEW_DASHBOARD

---

#### **Group 4: Research**

##### src/app/researchCenter/pages/MyResearch.tsx

- **Line:** 35
- **Pattern:** View event
- **Call:** `eventTracker.capture({ name: events.VIEW_MY_RESEARCH })`
- **Event:** VIEW_MY_RESEARCH

---

#### **Group 5: Surgery Center**

##### Export Operations

**src/app/surgeryCenter/components/ExportButton.hub.tsx**

- **Pattern:** Export operation (2 triplets)
- **Calls:** 5 (attempt × 2, succeeded × 2, failed × 1)
- **Events:** EXPORT_SURGERY_VIDEO, EXPORT_SURGERY_SCREENSHOT

**src/app/surgeryCenter/components/ExportButton.remote.tsx**

- **Pattern:** Export operation (2 triplets)
- **Calls:** 7 (attempt × 2, succeeded × 2, failed × 3)
- **Events:** EXPORT_SURGERY_VIDEO, EXPORT_SURGERY_SCREENSHOT
- **Extra:** Poll-based retry logic

##### Import Operations

**src/app/surgeryCenter/components/import/ImportProvider.hub.tsx**

- **Pattern:** Import operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** IMPORT_MONARCH_DATA

**src/app/surgeryCenter/components/import/ImportProvider.remote.tsx**

- **Pattern:** Import operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** IMPORT_MONARCH_DATA

##### Surgery Info & Editing

**src/app/surgeryCenter/pages/SurgeryInfo.tsx**

- **Pattern:** View event
- **Call:** 1
- **Event:** VIEW_INFORMATION

**src/app/surgeryCenter/pages/SurgeryInfo/useEditForm.ts**

- **Pattern:** Update operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** UPDATE_SURGERY_INFO
- **Tracked:** Surgery ID, fields changed

**src/app/surgeryCenter/pages/SurgeryInfo/useDelete.tsx**

- **Pattern:** Delete operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** DELETE_SURGERY
- **Tracked:** Surgery ID

**src/app/surgeryCenter/pages/report/SurgeryReport.tsx**

- **Pattern:** View + Update
- **Calls:** 4 (1 view, 3 update)
- **Events:** VIEW_REPORT, UPDATE_REPORT

**src/app/surgeryCenter/pages/SurgeryResources.tsx**

- **Pattern:** View event
- **Call:** 1
- **Event:** VIEW_RESOURCES

##### File Management Operations

**src/app/surgeryCenter/components/VideoGrid/useDeleteVideos.tsx**

- **Pattern:** Delete operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** DELETE_SURGERY_VIDEO
- **Tracked:** Video ID

**src/app/surgeryCenter/components/ScreenshotGrid/useDeleteScreenshots.tsx**

- **Pattern:** Delete operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** DELETE_SURGERY_SCREENSHOT
- **Tracked:** Screenshot ID

**src/app/surgeryCenter/components/VideoDraftList/useDeleteVideoDrafts.tsx**

- **Pattern:** Delete operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** DELETE_VIDEO_DRAFT
- **Tracked:** Draft ID

**src/app/surgeryCenter/components/VideoGrid/useRenameVideos.tsx**

- **Pattern:** Update operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** RENAME_SURGERY_VIDEO
- **Tracked:** Video ID, new name

**src/app/surgeryCenter/components/ScreenshotGrid/useRenameScreenshots.tsx**

- **Pattern:** Update operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** RENAME_SURGERY_SCREENSHOT
- **Tracked:** Screenshot ID, new name

**src/app/surgeryCenter/components/VideoDraftList/useRenameVideoDraft.tsx**

- **Pattern:** Update operation
- **Calls:** 3 (attempt, succeeded, failed)
- **Event:** RENAME_VIDEO_DRAFT
- **Tracked:** Draft ID, new name

##### Video Draft Operations

**src/app/surgeryCenter/components/VideoDraftList/DraftVideoItem.tsx**

- **Pattern:** Create event
- **Calls:** 2
- **Event:** CREATE_VIDEO_DRAFT
- **Tracked:** Draft name

**src/app/surgeryCenter/pages/VideoEditPage.tsx**

- **Pattern:** Generate operation (2 triplets)
- **Calls:** 6 (attempt × 2, succeeded × 2, failed × 2)
- **Event:** GENERATE_VIDEO_DRAFT
- **Tracked:** Draft ID, video name

---

#### **Group 6: Surgery Resources**

##### src/app/surgeryResources/components/VideoItem.tsx

- **Line:** 95
- **Pattern:** Play event
- **Call:** `eventTracker.capture({ name: createPlayVideoEvent('hub') })`
- **Event:** hub:business:play_video
- **Tracked:** Surgery ID, video ID, type, play mode

##### src/app/surgeryResources/components/ViewVideos.tsx

- **Lines:** 98, 144
- **Pattern:** Play events (2 different modes)
- **Calls:** 2
- **Events:** hub:business:play_video (2 times)
- **Tracked:** Video metadata per play mode

---
