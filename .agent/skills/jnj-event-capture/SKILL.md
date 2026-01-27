---
name: jnj-event-capture
description: Create or update tracking events in JnJ projects in compliance with established event conventions.
version: 1.0.0
---

# JnJ Event Capture

This skill is for **creating or updating tracking events** in JnJ projects, ensuring all events strictly follow the agreed-upon **event conventions, best practices, and patterns**.

## When to Use

Use this agent when:

- The user requests adding or updating **tracking events** for:
  - a feature
  - a component
  - a page
- The user explicitly invokes the command: `/jnj-event-capture`

## Event-Related Best Practices and Patterns

### 1. Event Best Practices

**Load**: `references/event-best-practices.md`

**Purpose**:

- **Read the "Key Conventions & Guidelines" section FIRST** - This contains critical rules for:
  - Choosing the correct `EventType` (e.g., View events use `Other`, not `Business`)
  - Deciding between Navigation events vs View events (always prefer View events in the destination page)
  - Determining when to use Three-Phase CRUD vs Simple Capture (if action triggers async operation → use Three-Phase)
- Determine which events should be tracked
- Identify events that should be avoided
- Ensure consistency in naming, granularity, and intent

**Skip if:** The user explicitly specifies the event practices to follow

### 2. Event Patterns

**Load**: `references/event-patterns.md`

**Purpose**:

- Identify the correct technical pattern for implementing events
- Ensure consistency across the codebase

**Skip if:** The user explicitly specifies the event pattern to use

### 3. Implementation steps

**Load**: `references/event-implementation.md`

**Purpose**:

- Identify steps to implement the events

## Workflow Process

1. Analyze the user request
   - Identify the relevant feature, component, or page
   - Understand the tracking intent and scope
2. Determine required events
   - Identify which events should be captured based on best practices
3. Audit existing implementation
   - Identify events (from step 2) that are:
     - already implemented
     - missing
     - partially or incorrectly implemented
4. Produce an event capture report into markdown file
   - Document missing or incomplete events
   - Propose a technical design for each event (based on the event patterns and implementation steps)
   - Present the result as a Markdown document
   - Review and confirm the approach with the user
5. Implement events
   - Proceed only after the user approves the proposed design
   - Ensure implementation follows agreed conventions and patterns

## Report Format (for Step 4)

path: `specs/feature-name/events.report.md`

```markdown
# Event Capture Report

## Relevant Files

- `path/to/file.ts` – Brief description of its role
- `path/to/another-file.ts` – Brief description
- ...

## Event Table

| Module | Type | Event Name | Pattern | Feature | Status           | Description | Payload |
| ------ | ---- | ---------- | ------- | ------- | ---------------- | ----------- | ------- |
| ...    | ...  | ...        | ...     | ...     | Exists / Missing | ...         | ...     |

Notes:

- **Status** indicates whether the event is already implemented.
- **Payload** should be specified only when applicable.
```

## References

- `references/event-best-practices.md` - Use to determine what events should or should not be created.
- `.references/event-patterns.md` - Use to determine how events should be implemented technically.
- `references/event-implementation.md` - Use to determine how to implement the events
