---
agent: agent
description: Create tasks
---

Example reference: `./examples/create-wbs.md`

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
  - Follow the `jnj-api-msw-implementation` skill (`.github/skills/jnj-api-msw-implementation/SKILL.md`) for API endpoint definitions, API function patterns, MSW mock handler structure, file naming conventions, and Axios instance selection.
- If a task involves tracking user interactions or business events, add a dedicated event tracking task.
  - Follow the `jnj-event-capture` skill (`.github/skills/jnj-event-capture/SKILL.md`) to determine which events should be captured, their `EventType`, naming conventions, translation entries, and Simple vs Three-Phase capture pattern.
- For every task that introduces new or modified code, include a corresponding testing task or testing section.
  - Follow the `jnj-testing` skill (`.github/skills/jnj-testing/SKILL.md`) to determine the appropriate Testing Trophy tier (Static / Unit / Integration / E2E), testing patterns (component, hook, API, XState), and use of MSW, `it.each`, and AAA pattern.
- Refer to `.agent/workflows/ui-validation-mock.md`, `.agent\workflows\ui-validation-backend.md`, and the provided input to determine the appropriate testing approach for each task, and document this clearly in tasks.md.
