---
name: sf-dumi-docs
description: Use when creating, editing, or reviewing any file under docs/ — markdown articles, thread index pages, and demo components (.tsx under docs/*/demos/). Covers Dumi v2 markdown syntax, thread/demo structure conventions, and navigation ordering for this project. Trigger on "add a new thread", "create a demo", "write docs for X", "update the thread index", "add a pattern demo", "fix the docs sidebar", or any task touching docs/ content.
---

# Dumi Docs Skill

## Scope

**In scope:** Dumi v2 markdown authoring under `docs/`, demo `.tsx` files under `docs/<section>/demos/`, thread index pages, `nav`/`group`/`order` frontmatter, live/external demo embedding, shared-shell demo pattern.

**Out of scope:** Library source under `src/` (use `frontend-development`), `.dumirc.ts` build config, GitHub Pages deployment, non-Dumi doc frameworks. If asked about these, decline and redirect.

## Progressive disclosure

Quick-reference is inline below — handle common tasks without reading references. Load a reference file only when the inline rules are insufficient.

| Reference                                                                | Load when                                                                                                                              |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| [references/project-conventions.md](./references/project-conventions.md) | Creating/restructuring threads, demo folders, or nav sections; need existing thread index                                              |
| [references/dumi-syntax.md](./references/dumi-syntax.md)                 | Need exact syntax for alerts, code groups, badges, embeds, line highlighting, routing rules, or homepage `hero`/`features` frontmatter |

## Workflows

### Add a new thread article

1. Pick section: `docs/fe-threads/` (Frontend, `nav.order: 1`) or `docs/ai-threads/` (AI, `nav.order: 2`).
2. Check existing filenames in that section — increment: `docs/<section>/NN-<kebab-slug>.md`.
3. Write frontmatter (see "Article frontmatter" below) and content.
4. If adding demos, use the shared-shell pattern below.

### Add or modify a demo

1. Place demo under `docs/<section>/demos/<thread-name>/`.
2. If thread compares multiple patterns, extract UI boilerplate into `shared/Shell.tsx`. Pattern files contain only core logic and render `<Shell fn={coreFn} />`.
3. Add JSDoc frontmatter at top (see "Demo frontmatter" below) — **always set `defaultShowCode: false`**.
4. Import from `'ft2026'`, not relative paths into `src/`.
5. Reference from article: `<code src="./demos/<thread-name>/pattern-name.tsx"></code>`.

### Edit markdown content

- For alerts, code groups, badges, embeds → load `references/dumi-syntax.md`.
- For thread placement / nav ordering / existing thread list → load `references/project-conventions.md`.

## Inline quick-reference

### Article frontmatter

```yaml
---
title: Article Title
order: 1 # sort within the section
nav:
  title: Frontend # or "AI" — must match the section's nav.title
  order: 1 # must match the section's nav.order (Frontend=1, AI=2)
---
```

### Demo frontmatter (JSDoc at top of `.tsx`)

```tsx
/**
 * title: Pattern N — Name
 * description: One-line summary.
 * defaultShowCode: false
 */
import { Shell } from './shared/Shell';
import type { CoreFn } from './shared/types';

const coreFn: CoreFn = async (/* ... */) => {
  // only the interesting logic lives here
};

export default function PatternN() {
  return <Shell fn={coreFn} />;
}
```

### Embedding a demo in markdown

```md
<code src="./demos/<thread-name>/pattern-name.tsx"></code>
```

### Static code block (no live render)

Append `| pure` to the language tag:

````md
```tsx | pure
// static, not rendered as a live demo
```
````

### Demo folder layout

```
docs/<section>/demos/<thread-name>/
├── shared/
│   ├── types.ts          # shared types
│   └── Shell.tsx         # shared UI shell — "Show Code" reader skips this
├── pattern1-foo.tsx      # focused demo: core logic only
└── pattern2-bar.tsx
```

## Critical rules (apply without reading references)

- **Always set `defaultShowCode: false`** in every demo's JSDoc frontmatter — Dumi may show code by default when the field is absent, leaking boilerplate before the user clicks "Show Code".
- **Import from the package name**: `import { X } from 'ft2026'`. Never reach into `../../src/...` from demo files — it breaks the simulated published-package view.
- **`| pure`** after the language tag renders a code block as static instead of a live demo. Use for code shown for reading, not execution.
- **Demo frontmatter lives in a JSDoc comment** (`/** ... */`) at the top of the `.tsx` file — not in YAML, not in `<code>` attributes (attributes override but don't replace).
- **File naming**: articles use `NN-<kebab-slug>.md` (two-digit prefix); demo folders match the thread slug; pattern files are kebab-case.
- **`nav.title` and `nav.order` must match** across all articles in a section — mismatch creates duplicate nav entries.

## Writing style

- Imperative voice, concise. Sacrifice grammar for brevity.
- Link to internal threads with relative paths, not absolute URLs.
- Code blocks get a language tag (`tsx`, `bash`, `md`) so syntax highlighting and live-demo rendering work correctly.
