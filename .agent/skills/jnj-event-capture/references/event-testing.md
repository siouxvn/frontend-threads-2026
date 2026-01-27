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

## Method 2: DevTools Network Tab

### Steps:

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Filter by `XHR` or `Fetch` request type
4. Type `event-logs` in the filter box
5. Trigger the action that should send the event
6. Click on the request to see details

### What to check:

- **Request Payload**: Verify event name and data are correct
- **Request Count**: Ensure only 1 request is sent per action

---

## Method 3: JavaScript Event Interceptor

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

## Method 4: Persistent Interceptor ⭐ RECOMMENDED

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
