# Dumi v2 Markdown Syntax Reference

Source: https://d.umijs.org/guide/markdown

---

## Frontmatter

```yaml
---
title: Page Title # shown in <title> and sidebar; auto-derived from first # heading
order: 1 # sidebar sort (lower = first)
nav:
  title: Guide
  order: 1
  second: Mobile # 2-level nav (dumi ≥ 2.2), or { title, order }
group:
  title: Basics
  order: 0
description: SEO meta # <meta name="description">
keywords: [a, b] # <meta name="keywords">
debug: true # dev-only page (hidden in production build)
toc: content # 'content' = right-side ToC | false = no ToC | 'sidebar' (default)
sidebar: false # hide sidebar on this page
demo:
  cols: 2 # demo columns
  tocDepth: 4 # ToC heading depth for demos
---
```

Homepage frontmatter (default theme):

```yaml
---
hero:
  title: ft2026
  description: Description text
  actions:
    - text: Get Started
      link: /getting-started
features:
  - emoji: 🚀
    title: Fast
    description: HTML allowed here
---
```

---

## Alert Containers

```md
:::info{title="Optional Title"}
Info message.
:::

:::success
Success message.
:::

:::warning
Warning message.
:::

:::error
Error message.
:::
```

---

## Code Group (dumi ≥ 2.3.0) — tabbed code blocks

````md
:::code-group

```bash [npm]
npm install ft2026
```

```bash [yarn]
yarn add ft2026
```

```ts [config.ts] {3}
// line 3 highlighted
export default {};
```

:::
````

The `[label]` after the language sets the tab label. Line highlighting `{3}` works inside code-group blocks.

---

## Line Highlighting in Code Blocks

````md
```tsx {1,3-5,8}
// lines 1, 3-5, 8 are highlighted
```
````

---

## Live Demo Blocks

`jsx`/`tsx` code blocks are automatically rendered as live React demos:

````md
```tsx
import React from 'react';
export default () => <h1>Hello!</h1>;
```
````

Add `| pure` to prevent rendering as a demo:

````md
```tsx | pure
// static code block, not rendered as demo
```
````

---

## External Demo File

```md
<code src="./demos/MyDemo.tsx"></code>
<code src="./demos/MyDemo.tsx" title="Title" description="Desc" inline compact background="#f0f0f0"></code>
```

`<code>` attributes (`title`, `description`, etc.) override the demo file's own JSDoc frontmatter.

Development-only attributes:

```md
<code src="./demos/MyDemo.tsx" debug></code> <!-- dev-only demo -->
<code src="./demos/MyDemo.tsx" only></code> <!-- parse only this demo during dev -->
```

### Demo frontmatter (JSDoc comment at top of demo `.tsx` file)

```tsx
/**
 * title: Demo Title
 * description: Supports **Markdown**
 * inline: true           # embed directly, no wrapper card
 * compact: true          # no padding
 * background: '#f6f7f9'  # background color / gradient / image
 * transform: true        # position:fixed children become relative to wrapper
 * debug: true            # dev-only demo
 * iframe: true           # full isolation via iframe (sets compact automatically)
 * defaultShowCode: false # collapse source code by default (always set this explicitly)
 */
```

---

## Built-in Components

```md
<!-- Badge -->

### My Heading <Badge>info</Badge>

### Warning <Badge type="warning">warning</Badge>

<!-- types: info (default) | warning | error | success -->

<!-- File Tree (dumi ≥ 2.2) -->
<Tree>
  <ul>
    <li>
      src
      <small>Source folder</small>
      <ul>
        <li>index.ts<small>Entry point</small></li>
      </ul>
    </li>
  </ul>
</Tree>
```

---

## Embed Another Markdown File

```md
<embed src="/path/to/file.md"></embed>
<embed src="/path/to/file.md#L5"></embed> <!-- single line -->
<embed src="/path/to/file.md#L1-L10"></embed> <!-- line range -->
<embed src="/path/to/file.md#RE-/^[^\r\n]+/"></embed> <!-- regex -->
```

---

## Routing Conventions

| File path             | Route                                   |
| --------------------- | --------------------------------------- |
| `docs/hello.md`       | `/hello`                                |
| `docs/hello/index.md` | `/hello`                                |
| `docs/HelloWorld.md`  | `/hello-world` (CamelCase → kebab-case) |
| `src/Button/index.md` | `/components/button`                    |
| `_hidden.md`          | ignored (underscore prefix)             |
| `.hidden.md`          | ignored (dot prefix)                    |

`index.md` and `README.md` represent the folder itself (no slug suffix).
