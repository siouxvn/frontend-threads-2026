# Fetch Diff — Shared Procedure

Follow these two steps to resolve branch names and fetch the diff between them.
Both `<base>` and `<current>` should be treated as resolved values after Step 1.

## Step 1 — Resolve branches

If the caller already provided both branches (e.g. from `$ARGUMENTS`), skip straight to Step 2.

Otherwise, **MUST use the AskUserQuestion tool** to ask the user.

**Banned inference sources — do NOT derive `<base>` or `<current>` from any of these:**

- Hook injections (any `Branch:` field in `## Plan Context`, `## Session`, or similar blocks)
- VSCode/IDE system prompt git hints (e.g. "Main branch: ...", "Current branch: ...")
- CLAUDE.md mentions of branches (`main`, `master`, `develop`)
- Git state commands: `git rev-parse`, `git branch`, `git status`, `git log`
- Conventions ("main is usually the base") or "it's obvious from context"

Asking is mandatory even if both branches seem obvious. The user wants to confirm explicitly.

First, gather the data needed to build the options. Run these two commands:

```bash
git branch -a --format="%(refname:short)" | head -10
git rev-parse --abbrev-ref HEAD
```

Then call **AskUserQuestion** with **two questions** in a single call.
Build all options **strictly from the git command output** — never invent or assume branch names.
The tool supports a maximum of **4 defined options** per question; "Other" is added automatically and lets the user type any branch name freely.

**Question 1 — Base branch**

- header: `"Base branch"`
- question: `"Which branch is the base (the branch being targeted)?"`
- Fill up to 4 options using this priority order (stop when 4 slots are filled):
  1. Common base branches that exist in the git output: `main`, `master`, `develop` — local copy first, then `origin/` counterpart (e.g. `main` then `origin/main`, as separate options)
  2. `origin/<current-HEAD>` if it exists — add description `"Remote counterpart of current branch"`
  3. Any remaining local branches from the git output

**Question 2 — Current branch**

- header: `"Current branch"`
- question: `"Which branch is the current one being reviewed?"`
- Fill up to 2 options using this priority order:
  1. The current HEAD local branch (from `git rev-parse`) — add `"(Recommended)"` to the label
  2. `origin/<current-HEAD>` if it exists

For both questions: include both the local and `origin/` version as **separate options** when both appear in the git output. Do not merge them.

Use the answers as `<base>` and `<current>`. If the user answered "Other", use whatever text they typed.

## Step 2 — Fetch the diff

Use the three-dot diff to capture exactly what the current branch contributes relative to the base.
This excludes commits already in the base, giving a clean view of what this branch adds — regardless of
whether base has moved forward since branching.

```bash
git log <base>..<current> --no-merges --format="%h %s%n%b"
git diff <base>...<current> --stat
```

**Check diff size** from the `--stat` summary line (e.g. `12 files changed, 847 insertions(+), 203 deletions(-)`):

- **≤ 500 lines total** — fetch the full diff at once:

  ```bash
  git diff <base>...<current>
  ```

- **> 500 lines** — fetch per file to stay focused:
  1. Get the file list:
     ```bash
     git diff <base>...<current> --name-only
     ```
  2. Skip generated files (`routeTree.gen.ts`) and lock files (`package-lock.json`, `yarn.lock`) —
     changes there are consequences of other changes, not intent.
  3. Read domain/feature files first, config and infra files last:
     ```bash
     git diff <base>...<current> -- <file>
     ```
