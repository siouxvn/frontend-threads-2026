# Event Testing Guide

This guide explains how to verify that tracking events are being sent correctly during development and testing.

> ## 💡 Recommendation
>
> **Use Method 4 (Persistent Interceptor)** as the default approach for testing events. It:
>
> - Survives page navigations (essential for View events that trigger on page load)
> - Works consistently across all scenarios
> - Saves time by not losing data when pages refresh/navigate
>
> **When to use other methods:**
>
> - Method 1-2: Quick manual checks when you're already on the page
> - Method 3: Same-page interactions that don't cause navigation

---

## Method 1: MSW Console Logs

When running in dev mode with `yarn dev:mock`, **MSW (Mock Service Worker)** intercepts all API calls and logs them to the browser console.

### Steps:

1. Open browser DevTools (F12 or right-click → Inspect)
2. Go to **Console** tab
3. Filter console logs by typing `event-logs` in the search box
4. Trigger the action that should send the event
5. Look for logs like:
   ```
   [MSW] POST /core/api/event-logs (200 OK)
   ```

### What to check:

- Verify the event is sent **exactly once** (not duplicated due to StrictMode)
- Check the request body contains correct event name and payload

---

## Method 2: JavaScript Event Interceptor

Use this method when you need to programmatically count and verify events **on the same page** (no navigation).

### Setup Interceptor (Run in Console):

```javascript
// Setup event tracking interceptor
(() => {
  window.eventTrackingLogs = [];
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    if (url && url.includes('/core/api/event-logs')) {
      try {
        const options = args[1] || {};
        const body = JSON.parse(options.body);
        window.eventTrackingLogs.push({
          eventName: body.name,
          timestamp: new Date().toISOString(),
          payload: body,
        });
        console.log('📊 Event captured:', body.name);
      } catch (e) {
        console.error('Failed to parse event body');
      }
    }
    return originalFetch.apply(this, args);
  };

  console.log('✅ Event tracking interceptor ready');
})();
```

### Check Captured Events:

```javascript
// View all captured events
console.table(window.eventTrackingLogs);

// Count events by name
const counts = window.eventTrackingLogs.reduce((acc, e) => {
  acc[e.eventName] = (acc[e.eventName] || 0) + 1;
  return acc;
}, {});
console.log('Event counts:', counts);

// Filter specific event
window.eventTrackingLogs.filter(e => e.eventName === 'research:other:view_patient_list');
```

---

## Method 3: Persistent Interceptor ⭐ RECOMMENDED

Use localStorage to track events across page navigations. **This is the recommended method** because it works for all scenarios including View events that fire on page load.

```javascript
// Setup persistent interceptor
(() => {
  localStorage.setItem('eventTrackingLogs', '[]');

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    if (url && url.includes('/core/api/event-logs')) {
      let logs = JSON.parse(localStorage.getItem('eventTrackingLogs') || '[]');
      try {
        const body = JSON.parse(args[1]?.body);
        logs.push({
          eventName: body.name,
          time: new Date().toISOString(),
        });
        localStorage.setItem('eventTrackingLogs', JSON.stringify(logs));
        console.log('📊 Event logged to localStorage:', body.name);
      } catch (e) {}
    }
    return originalFetch.apply(this, args);
  };

  console.log('✅ Persistent interceptor ready');
})();

// Check logs (run in any page)
JSON.parse(localStorage.getItem('eventTrackingLogs'));

// Clear logs
localStorage.removeItem('eventTrackingLogs');
```

---

## Common Issues & How to Detect Them

### 1. Duplicate Events (StrictMode Issue)

**Symptom**: Same event sent twice on page load

**How to detect**:

```javascript
// Count events - should be 1, not 2
window.eventTrackingLogs.filter(e => e.eventName === 'research:other:view_patient_list').length;
```

**Solution**: Use `useRef` pattern (see `event-patterns.md`, Pattern 1)

### 2. Missing Events

**Symptom**: Event not appearing in logs

**Causes**:

- Event code not reached (check component lifecycle)
- `eventTracker` not imported
- Event name typo
- Dependency issue in useEffect

### 3. Wrong Event Data

**Symptom**: Event sent but with incorrect/missing payload

**How to detect**:

```javascript
// Check specific event payload
window.eventTrackingLogs.find(e => e.eventName === 'research:other:view_patient_list')?.payload;
```

---

## Quick Reference: Testing Checklist

For each event you implement, verify:

- [ ] Event fires exactly **once** (not duplicated)
- [ ] Event fires at the **correct time** (on action trigger)
- [ ] Event name follows naming convention (`module:type:event_name`)
- [ ] Payload contains all required data
- [ ] Event does NOT fire during component unmount
- [ ] Event properly handles re-renders (for View events, use ref guard)

---

## Testing Phases

> 🚨 **CRITICAL REMINDER FOR ALL PHASES**
>
> **Before starting ANY testing phase, you MUST ask the user for the test URL if it is not explicitly provided in the context.**
>
> Common mistakes to AVOID:
>
> - ❌ Assuming `http://localhost:3000` (this is almost always WRONG)
> - ❌ Starting browser testing without confirming the URL first
> - ❌ Making up URLs based on guesses
>
> **Correct approach:**
>
> 1. Check if users provided the test URL/path in the prompt
> 2. If not provided → **ASK**: "What is the full test URL (domain:port/path) to navigate to?"

Complete event verification requires 3 phases. Use arguments to run specific phases:

| Argument  | Phase   | Description                                        |
| --------- | ------- | -------------------------------------------------- |
| `test`    | All     | Run all 3 phases sequentially                      |
| `test:p1` | Phase 1 | Mock mode - verify events trigger correctly        |
| `test:p2` | Phase 2 | Backend - verify events saved & displayed in admin |
| `test:p3` | Phase 3 | Export - verify Excel export & translations        |

---

### Phase 1: Mock Mode Verification (`test:p1`)

**Purpose:** Verify events are triggered correctly in the browser.

**Environment:**

- Run: `yarn dev:mock`
- Login: `user` / `user123`

> ⛔ **Review the CRITICAL REMINDER above before proceeding.**

**Steps:**

1. **Start dev server** in mock mode

   ```bash
   yarn dev:mock
   ```

2. **Open browser** and navigate to login page

3. **Setup persistent interceptor** (Method 4)

   ```javascript
   // Run in browser console
   (() => {
     localStorage.setItem('eventTrackingLogs', '[]');
     const originalFetch = window.fetch;
     window.fetch = async function (...args) {
       const url = typeof args[0] === 'string' ? args[0] : args[0].url;
       if (url && url.includes('/core/api/event-logs')) {
         let logs = JSON.parse(localStorage.getItem('eventTrackingLogs') || '[]');
         try {
           const body = JSON.parse(args[1]?.body);
           logs.push({
             eventName: body.name,
             time: new Date().toISOString(),
             description: body.description,
           });
           localStorage.setItem('eventTrackingLogs', JSON.stringify(logs));
           console.log('📊 Event:', body.name);
         } catch (e) {}
       }
       return originalFetch.apply(this, args);
     };
     console.log('✅ Interceptor ready');
   })();
   ```

4. **Login** with `user` / `user123`

5. **Navigate** to the test URL provided by user

6. **Trigger each event** by performing the relevant actions

7. **Collect logs**

   ```javascript
   JSON.parse(localStorage.getItem('eventTrackingLogs'));
   ```

8. **Generate Phase 1 Report**

**Report Format (Phase 1):**

- **🚨 IMPORTANT:** The report MUST be output to a **markdown file** at the specified path, NOT just printed in chat.

> **📋 REPORT REQUIREMENTS:**
>
> 1. **Events Summary Table** - List ALL expected events with their trigger action and count
> 2. **Raw Logs Section** - Include the FULL JSON output from `localStorage.getItem('eventTrackingLogs')` including:
>    - Event name (full format: `module:type:event_name`)
>    - Timestamp
>    - Description/Payload data
> 3. **Three-Phase Coverage** - For CRUD events, explicitly verify all phases:
>    - `_attempt` event (before API call)
>    - `_succeeded` event (on success)
>    - `_failed` event (on error) - if not tested, note "Not tested (requires simulated failure)"

````markdown
# Event Testing Report - Phase 1 (Mock Mode)

**Date:** YYYY-MM-DD
**Test URL:** [URL provided by user]
**Environment:** yarn dev:mock
**User:** user / user123

## Events Summary

| #   | Event Name                                 | Triggered By | Expected | Captured | Status        |
| --- | ------------------------------------------ | ------------ | -------- | -------- | ------------- |
| 1   | research:other:view_patient_list           | Page load    | 1        | 1        | ✅ Pass       |
| 2   | research:business:create_patient_attempt   | Click Create | 1        | 1        | ✅ Pass       |
| 3   | research:business:create_patient_succeeded | API success  | 1        | 1        | ✅ Pass       |
| 4   | research:business:create_patient_failed    | API error    | 1        | 0        | ⏭️ Not tested |

## Raw Logs (Full JSON)

```json
[
  {
    "eventName": "research:other:view_patient_list",
    "time": "2026-01-28T09:15:23.456Z",
    "description": {
      "data": {
        "researchId": "abc-123"
      }
    }
  },
  {
    "eventName": "research:business:create_patient_attempt",
    "time": "2026-01-28T09:16:45.123Z",
    "description": {
      "data": {
        "patientId": "P001",
        "researchId": "abc-123"
      }
    }
  }
]
```

## Payload Verification

| Event                  | Expected Payload Fields | Captured Fields                          | Match |
| ---------------------- | ----------------------- | ---------------------------------------- | ----- |
| view_patient_list      | researchId              | researchId: "abc-123"                    | ✅    |
| create_patient_attempt | patientId, researchId   | patientId: "P001", researchId: "abc-123" | ✅    |

## Issues Found

- [List any issues: duplicates, missing events, wrong payloads, missing payload fields]
- If `_failed` events were not tested, note: "Failed events not tested - requires simulated API failure"

## Phase 1 Result: ✅ PASS / ❌ FAIL
````

---

### Phase 2: Backend Integration (`test:p2`)

**Purpose:** Verify events are saved to backend and displayed correctly in admin panel.

**Environment:**

- Run: `yarn dev` (connects to real backend)
- Test User: `thinh_user` / `123456789`
- Admin User: `thinh_admin` / `123456789`

> ⛔ **Review the CRITICAL REMINDER above before proceeding.**

**Steps:**

1. **Login as test user** (`thinh_user` / `123456789`)
2. **Reproduce all actions** from Phase 1
   - Navigate to the same test URL
   - Trigger the same events
   - Note the **exact time** of each action
3. **Logout**
4. **Login as admin** (`thinh_admin` / `123456789`)
5. **Navigate to Admin → Behavior Monitor (行为监控) page**
6. **Apply filters:**
   - User: `Thinh Kieu (user)`
     - **⚠️ Note:** The user dropdown may require **scrolling down** if the target user is not immediately visible. If cannot select, ask user to select.
   - Date: Today's date (test date)
     - **⚠️ Note:** This is a **date-range picker**. You must select **both start and end dates** (select the same date for both to filter a single day).
7. **Verify in events table:**
   - [ ] All triggered events appear in the table
   - [ ] Event names display correctly
   - [ ] Translations show correctly (Chinese)
   - [ ] Timestamps match approximate trigger times
   - [ ] User info is correct
8. **Generate Phase 2 Report**
   - **🚨 IMPORTANT:** The report MUST be output to a **markdown file** at the specified path, NOT just printed in chat.

**Report Format (Phase 2):**

> **📋 REPORT REQUIREMENTS:**
>
> 1. **Complete Three-Phase Coverage** - For each CRUD operation, list ALL three phases:
>    - `_attempt` - The "尝试" / "Attempting" event
>    - `_succeeded` - The "成功" / "Success" event
>    - `_failed` - The "失败" / "Failed" event
> 2. **Explicit Status for Each Phase:**
>    - ✅ Pass - Event found and translation correct
>    - ❌ Fail - Event missing or translation wrong
>    - ⏭️ Not tested - Event requires specific conditions (e.g., API error) that were not simulated
> 3. **If an event was NOT tested**, you MUST explain why (e.g., "Requires simulated API failure")

```markdown
# Event Testing Report - Phase 2 (Backend Integration)

**Date:** YYYY-MM-DD
**Test URL:** [URL]
**Environment:** yarn dev (real backend)
**Test User:** thinh_user
**Admin User:** thinh_admin

## Filter Applied

- User: Thinh Kieu (user)
- Date: YYYY-MM-DD

## Events Verification

### Simple View Events

| #   | Event Name        | Expected Translation | Displayed Translation | Time  | Status  |
| --- | ----------------- | -------------------- | --------------------- | ----- | ------- |
| 1   | view_patient_list | 查看患者列表         | 查看患者列表          | 09:15 | ✅ Pass |

### Three-Phase CRUD Events

> **⚠️ For each CRUD operation, verify ALL three phases:**

#### CREATE Operation

| Phase   | Event Suffix             | Expected Translation | Displayed Translation       | Time     | Status        |
| ------- | ------------------------ | -------------------- | --------------------------- | -------- | ------------- |
| Attempt | create_patient_attempt   | 创建患者档案         | 用户尝试创建患者档案 "P001" | 09:16:01 | ✅ Pass       |
| Success | create_patient_succeeded | 创建患者档案成功     | 患者档案 "P001" 创建成功    | 09:16:02 | ✅ Pass       |
| Failed  | create_patient_failed    | 创建患者档案失败     | -                           | -        | ⏭️ Not tested |

> **Note on Failed Events:** failed events require API errors to trigger. If not tested, state: "Not tested - requires simulated API failure or network error."

#### UPDATE Operation

| Phase   | Event Suffix         | Expected Translation | Displayed Translation | Time | Status        |
| ------- | -------------------- | -------------------- | --------------------- | ---- | ------------- |
| Attempt | update_xxx_attempt   | ...                  | ...                   | ...  | ...           |
| Success | update_xxx_succeeded | ...                  | ...                   | ...  | ...           |
| Failed  | update_xxx_failed    | ...                  | ...                   | ...  | ⏭️ Not tested |

#### DELETE Operation

| Phase   | Event Suffix         | Expected Translation | Displayed Translation | Time | Status        |
| ------- | -------------------- | -------------------- | --------------------- | ---- | ------------- |
| Attempt | delete_xxx_attempt   | ...                  | ...                   | ...  | ...           |
| Success | delete_xxx_succeeded | ...                  | ...                   | ...  | ...           |
| Failed  | delete_xxx_failed    | ...                  | ...                   | ...  | ⏭️ Not tested |

## Screenshot

[Attach screenshot of admin events table with filters applied]

## Untested Events Summary

| Event                 | Reason Not Tested              |
| --------------------- | ------------------------------ |
| create_patient_failed | Requires simulated API failure |
| update_xxx_failed     | Requires simulated API failure |
| delete_xxx_failed     | Requires simulated API failure |

## Issues Found

- [List any issues: missing events, wrong translations, etc.]

## Phase 2 Result: ✅ PASS / ❌ FAIL
```

---

### Phase 3: Excel Export Verification (`test:p3`)

**Purpose:** Verify exported Excel file contains correct events and translations.

**Environment:**

- Same as Phase 2 (already logged in as admin)

> ⛔ **Review the CRITICAL REMINDER above before proceeding.** Ensure filters from Phase 2 are still applied.

> 🚨 **CRITICAL LIMITATION:**
>
> AI agents **cannot interact with native OS file dialogs** (e.g., Windows folder picker). Therefore, the export download must be performed **manually by the user**.

---

#### 🛑🛑🛑 MANDATORY STOP POINT 🛑🛑🛑

> **AFTER CLICKING THE EXPORT BUTTON, YOU MUST IMMEDIATELY STOP AND WAIT FOR USER INPUT.**
>
> - ❌ **DO NOT** continue to step 4 or any subsequent steps.
> - ❌ **DO NOT** assume the file has been downloaded.
> - ❌ **DO NOT** make up a file path or guess the download location.
> - ❌ **DO NOT** start any new browser subagent tasks.
>
> ✅ **YOU MUST** ask the user: _"Please download the Excel file and provide the absolute file path (e.g., `C:\Users\username\Downloads\events_export.xlsx`)."_
>
> ✅ **YOU MUST** wait for the user's response with the file path before proceeding.

---

**Steps:**

1. **Keep the same filters** from Phase 2:
   - User: `Thinh Kieu (user)` (scroll down in dropdown if not visible, if cannot select, ask user to select)
   - Date: Test date (use date-range picker, select same start and end date)

2. **Click Export** button
   - A system folder picker dialog will appear on the user's screen.

3. **🛑 STOP HERE - ASK USER FOR FILE PATH 🛑**
   - Output this message to the user:
     > **📥 Export button clicked!**
     >
     > Please complete the download:
     >
     > 1. Select a folder in the system dialog (e.g., `Downloads`)
     > 2. Click "Select Folder" to save the Excel file
     > 3. After download completes, provide the **absolute file path** here
     >
     > Example: `C:\Users\username\Downloads\events_export.xlsx`
   - **DO NOT PROCEED** until the user provides the file path.

4. **AI will analyze Excel file** (only after receiving file path from user):
   - [ ] All events from Phase 2 are present
   - [ ] Event names/translations are correct (Chinese)
   - [ ] Columns have correct headers
   - [ ] Data matches what was shown in admin table

5. **Generate Phase 3 Report**
   - **🚨 IMPORTANT:** The report MUST be output to a **markdown file** at the specified path, NOT just printed in chat.

**Report Format (Phase 3):**

```markdown
# Event Testing Report - Phase 3 (Excel Export)

**Date:** YYYY-MM-DD
**Exported File:** [filename.xlsx]
**Filter Applied:** User: Thinh Kieu (user), Date: YYYY-MM-DD

## Export Verification

| #   | Event Name        | Translation in Excel | Expected     | Status  |
| --- | ----------------- | -------------------- | ------------ | ------- |
| 1   | view_patient_list | 查看患者列表         | 查看患者列表 | ✅ Pass |
| 2   | create_patient    | 创建患者             | 创建患者     | ✅ Pass |
| 3   | ...               | ...                  | ...          | ...     |

## Excel File Details

- Total rows: [number]
- Columns: [list columns]
- File size: [size]

## Issues Found

- [List any issues: missing events, wrong translations, formatting issues]

## Phase 3 Result: ✅ PASS / ❌ FAIL
```

---

### Combined Report (when running `test`)

> 🚨 **IMPORTANT - REPORT OUTPUT:**
>
> All reports (Phase 1, 2, 3, or Combined) **MUST be written to a markdown file**.
>
> - **File path:** `specs/[feature-name]/events.test-report.md`
> - Do NOT just output the report in chat - always create/update the file.
> - If the file exists, update it. If not, create it.

When running all phases, combine reports into a single document:

```markdown
# Event Testing Report - Complete

**Feature:** [Feature name]
**Date:** YYYY-MM-DD
**Tester:** [Agent/Human]

## Summary

| Phase   | Description            | Result            |
| ------- | ---------------------- | ----------------- |
| Phase 1 | Mock Mode Verification | ✅ PASS / ❌ FAIL |
| Phase 2 | Backend Integration    | ✅ PASS / ❌ FAIL |
| Phase 3 | Excel Export           | ✅ PASS / ❌ FAIL |

## Overall Result: ✅ ALL PASS / ❌ ISSUES FOUND

---

[Include detailed reports from each phase below]
```

**Report Output Path:** `specs/[feature-name]/events.test-report.md`
