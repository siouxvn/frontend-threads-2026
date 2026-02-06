---
agent: agent
description: Create tasks
---

Example reference: `examples/create-wbs.md`

Based on the user input, analyze the current system and generate a complete `tasks.md` file in the same folder as the input.

Guidelines:

- Each task should correspond to exactly one Acceptance Criterion from the input.
- If the input contains technical requirements or implementation notes, create one or more pre-tasks to address these technical prerequisites first.
  - For example, if a refactor from A to B is required, create an initial task for the refactor, followed by subsequent tasks mapped to the Acceptance Criteria.
- For every task, clearly specify:
  - Expected outcome
  - High-level technical design
  - Testing approach
- If a task requires creating an API or a mocked API, explicitly describe the technical design for that API.
