---
description: UI Validation Workflow
---

### Purpose

A workflow for validating UI changes, identifying visual or layout issues, and iterating until the UI meets expectations.

### Steps

1. Ensure yarn dev:mock is running
   - Verify whether yarn dev:mock is already running in any existing instance/session.
   - If it is not running, start it by executing: `yarn dev:mock`

2. Sign in using the provided credentials
   - Log in with:
      - Username: user
      - Password: user123

3. Validate UI
   - Navigate to all screens affected by the recent code changes.
   - Verify that:
      - The UI matches the expected behavior and layout.
      - Components are properly aligned and styled.
      - No visual regressions or unintended side effects are present.

4. Iterate on issues
   - If any UI issues are found:
      - Fix the issues in the codebase.
      - Revisit the affected screens.
      - Repeat the validation step until all issues are resolved.

### Notes

- When opening a new browser tab for testing, close any previously opened tab to reduce memory usage.
- Focus on visual correctness, layout consistency, and basic interaction flows.
- Repeat the validation loop as needed until the UI meets expectations.
