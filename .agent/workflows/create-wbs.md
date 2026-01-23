---
description: Create tasks
---

Example reference: `.agent/workflow-examples/create-wbs.md`

Based on the user input, analyze the current system and generate a complete `tasks.md` file in the same folder as the input.

Guidelines:

- Each task may correspond to a single Acceptance Criterion from the input.
- For every task, clearly specify:
  - Expected outcome
  - High-level technical design
  - Testing approach
- If a task requires creating an API or a mocked API, explicitly describe the technical design for that API.
- Refer to `.agent/workflows/ui-validation.md` and the provided input to determine the appropriate testing approach for each task, and document this clearly in tasks.md.
