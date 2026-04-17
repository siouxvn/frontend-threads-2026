# Project-Specific Docs Conventions

---

## Navigation Structure

Two nav sections, rendered in this order:

| Folder             | Nav label | `nav.order` |
| ------------------ | --------- | ----------- |
| `docs/fe-threads/` | Frontend  | 1           |
| `docs/ai-threads/` | AI        | 2           |

Each section has:

- `index.md` — section landing page (`order: 0`, sets `nav.title` and `nav.order`)
- Numbered articles — `01-<slug>.md`, `02-<slug>.md`, … (use `order:` frontmatter to control sort)

**When adding a new article**, increment the next available number for the section. Check existing filenames first.

---

## Thread Demo Convention

Demo files live under `docs/<section>/demos/<thread-name>/`.

When a thread compares multiple implementations of the same concept, use this structure:

```
docs/<section>/demos/<thread-name>/
├── shared/
│   ├── types.ts          # shared types and interfaces
│   └── <Shell>.tsx       # shared UI shell (boilerplate hidden from "Show Code")
├── pattern1-foo.tsx      # focused demo: core logic only
├── pattern2-bar.tsx
└── ...
```

### Principle: "Show Code" should teach the concept, not boilerplate

- Extract all UI state management, progress tracking, event handlers, and rendering into the shared `Shell.tsx`.
- Each pattern file imports the shell and passes only its concept-specific function.
- This keeps "Show Code" focused on what the thread is actually teaching.

### Pattern file template

```tsx
/**
 * title: Pattern N — Name
 * description: One-line summary of what makes this pattern distinct.
 * defaultShowCode: false
 */
import { Shell } from './shared/Shell';
import type { CoreFn } from './shared/types';

const coreFn: CoreFn = async (/* ... */) => {
  // ← only the interesting logic lives here
};

export default function PatternN() {
  return <Shell fn={coreFn} />;
}
```

### Referencing demos in the article markdown

```md
<code src="./demos/<thread-name>/pattern1-foo.tsx"></code>
<code src="./demos/<thread-name>/pattern2-bar.tsx"></code>
```

---

## Article Frontmatter Template

```yaml
---
title: Article Title
order: 1 # sort within the section
nav:
  title: Frontend # or AI — must match the section's nav.title
  order: 1 # must match the section's nav.order
---
```

---

## Existing Thread Index

| Section    | File                    | Topic                                   |
| ---------- | ----------------------- | --------------------------------------- |
| fe-threads | `01-local-settings.md`  | `useSettings` hook — typed localStorage |
| fe-threads | `02-stream-patterns.md` | Stream consumption patterns (4 demos)   |
| fe-threads | `03-oauth.md`           | OAuth 2.0 flow                          |
| ai-threads | `01-ai-agent-teams.md`  | AI agent teams research                 |
