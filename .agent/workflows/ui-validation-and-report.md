---
description: Implement Features in This Repository (with UI Validation and report)
---

A workflow for implementing requested features in this repository, validating changes via the UI, and producing a before/after check with screenshots.

1. Check for special testing requirements from the user
   - Review the user’s request for any specific testing instructions (e.g., target pages, breakpoints, browsers, scenarios, test data).
   - If special requirements exist, follow them.
   - If not, proceed with the default steps below.

2. Ensure yarn dev:mock is running
   - Verify whether yarn dev:mock is already running in any existing instance/session.
   - If it is not running, start it by executing: `yarn dev:mock`

3. Sign in using the provided credentials
   - Log in with:
      - Username: user
      - Password: user123

4. Capture “before” screenshots
   - Navigate to all relevant screens related to the requested change.
   - Take screenshots before making any code changes.
   - Ensure the screenshots clearly show the current UI state (including any relevant error messages, layout issues, or user flows).

5. Implement the requested changes
   - Apply the modifications according to the user’s requirements.
   - Keep changes scoped to what is requested and consistent with existing patterns in the codebase.

6. Capture “after” screenshots
   - Revisit the same relevant screens after implementing the changes.
   - Take screenshots after the update.
   - Ensure the “after” screenshots match the “before” coverage for direct comparison.

7. Write a Markdown report and collect artifacts
   - Create a Markdown report (.md) in the /ui-report folder.
   - Copy all relevant screenshots into the same /ui-report folder.
   - The report must include:
     - A brief summary of the change
     - A list of affected screens/flows
     - Before/After sections with embedded screenshots (or clearly linked files)
     - Any notes about testing performed, assumptions, or limitations


### Notes

- When opening a new browser tab for testing, close any previously opened tab to reduce memory usage.
- Focus on visual correctness, layout consistency, and basic interaction flows.
- Repeat the validation loop as needed until the UI meets expectations.
