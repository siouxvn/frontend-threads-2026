---
name: sf-create-pr-description
description: Generate a concise, review-friendly PR description by analyzing git diff between two branches. Use this skill whenever the user asks to write, create, or generate a PR description, pull request summary, or PR writeup — even if they just say "write me a PR desc" or "summarize what this branch does". Supports --update to incrementally update an existing description with only new commits.
argument-hint: '[--update] [base-branch] [current-branch-or-commit]'
disable-model-invocation: true
---

Generate a concise PR description from git diff output and save it to the project.

Check if `$ARGUMENTS` contains `--update`. If it does, go to **[Update Mode]**. Otherwise, continue with **Step 1** below.

---

## Step 1 — Gather context and fetch diff

**Read `.claude/skills/_shared/fetch-diff.md` (via the Read tool), then follow Steps 1 and 2 exactly as written there.**

If `$ARGUMENTS` is provided (after stripping `--update` if present), parse it as `[base-branch] [current-branch-or-commit]` (space-separated) and pass those as the pre-resolved branches — fetch-diff.md Step 1 handles the skip-to-Step-2 logic automatically.

fetch-diff.md is the single authoritative source for branch resolution, banned-inference rules, and AskUserQuestion format.

Read commit messages carefully — they often contain intent and context that isn't visible in the diff itself. Developers write commit messages to explain _why_ a change was made, not just _what_ changed. Use this as a hint when writing the Purpose section, but always verify against the actual code changes.

## Step 2 — Write the PR description

Read the example in [references/pr-description.md](references/pr-description.md) to understand the expected format and tone.

Generate a description that follows the **exact 4-section structure** from the example:

1. `### Purpose of this PR` — 1–2 sentences explaining _why_ this PR exists
2. `### Summary of Changes` — split into two subsections (see below)

Don't add extra sections (no "Files Changed", "Testing", "Related Issues", etc.).

### Splitting Summary of Changes

Divide the changes into two subsections inside `### Summary of Changes`:

**Primary changes** — everything that directly implements the PR's stated goal. If the PR is about adding a feature, these are the files and logic that make it work. Always present.

**Supporting changes** _(optional)_ — incidental changes that had to happen alongside the main work: deprecation fixes, config migrations, tooling tweaks, doc updates, skill/tooling updates. Omit this subsection entirely if there are none.

The distinction is about _why_ each change exists. Ask: "Would this change exist if not for the PR's goal?" If yes → primary. If it's collateral cleanup or a prerequisite fix → supporting.

Use this format:

```
#### Primary changes
- ...

#### Supporting changes
- ...
```

Omit the `#### Supporting changes` block (including the heading) when there are no supporting changes.

### Coverage rule — don't leave reviewers blind

A PR description's primary job is to make sure **no reviewer misses a meaningful change**. That includes small fixes, deprecation migrations, config tweaks, and anything that looks like a minor "chore" but actually has consequences. When in doubt, include it — just put it in the right subsection.

Conciseness is good, but not at the cost of omission. If there are 6 real changes, write 6 bullets. The goal isn't a short list — it's a complete one.

A few patterns that are easy to overlook but must be included:

- **Config migrations** (e.g., removing a deprecated option, updating paths) — these affect every developer's toolchain. Usually supporting.
- **Build/tooling changes** that change behaviour at runtime or in CI. Primary if they are the point of the PR, supporting otherwise.
- **Commits whose message says "chore" or "fix format"** — always verify the actual diff; they often contain non-trivial changes hiding behind a casual label.

Group related bullets naturally within each subsection.

---

## [Update Mode] — Incrementally update an existing PR description

This mode is for when a PR description already exists and new commits have been added to the branch. Instead of rewriting from scratch, it diffs only the new commits and weaves the new changes into the existing description.

### Update Step 1 — Load the existing description

Resolve the current branch name:

```bash
git rev-parse --abbrev-ref HEAD
```

Read the existing description from `tmp/pull-requests/<branch-name>/pr-description.md`.

If the file doesn't exist, tell the user there's no existing description to update and suggest running without `--update` to create one from scratch. Stop here.

### Update Step 2 — Ask the user which commits are new

Fetch the 3 most recent commits:

```bash
git log --oneline -3
```

Use **AskUserQuestion** to ask which commits are new:

- header: `"New commits"`
- question: `"Which commits are new since the last PR description?"`
- options: Build exactly 3 options from the commit log. Each option has a label (hash range) and a description (count prefix + summarized messages).
  - Option 1: label `"<hash> only"`, description `"Just the latest commit: <summary>"`
  - Option 2: label `"<hash1>..<hash2>"`, description `"Last two commits: <summary1> + <summary2>"`
  - Option 3: label `"<hash1>..<hash3>"`, description `"Last three commits: <summary1> + <summary2> + <summary3>"`

Keep each summary short — a few words per commit. Example: label `"377d2d41..904639b0"`, description `"Last two commits: fix failed ci/cd + improve pr-description skill"`.

### Update Step 3 — Diff only the new commits

Use the range from the user's selection to fetch the diff:

```bash
git log <range-start>..<range-end> --no-merges --format="%h %s%n%b"
git diff <range-start>..<range-end> --stat
```

Apply the same size-based strategy from `.claude/skills/_shared/fetch-diff.md` Step 2 (≤500 lines → full diff, >500 lines → per-file).

### Update Step 4 — Merge new changes into the existing description

Read the existing PR description carefully. Then:

1. **Purpose** — Update only if the new commits change or expand the PR's purpose. If the purpose is still accurate, leave it as-is.
2. **Summary of Changes** — Add new bullets for the new changes in the appropriate subsection (Primary or Supporting). Place them naturally among existing bullets — group related items together. If a new commit modifies something already described, update the existing bullet rather than adding a duplicate.
3. **Pre-merge reviews** — Re-evaluate detection rules against the full diff (old + new commits) and update bold/⚠️ indicators accordingly.
4. **Demo** — Leave untouched.

The result should read as a single coherent description, not as "old stuff + appended new stuff". A reviewer reading it for the first time shouldn't be able to tell it was written incrementally.

After merging, proceed to **Step 3 — Save the output** below to write the file.

---

## Step 3 — Save the output

Resolve the current branch name:

```bash
git rev-parse --abbrev-ref HEAD
```

Save the description to:

```
tmp/pull-requests/<branch-name>/pr-description.md
```

Create the directory if it doesn't exist. Then confirm to the user with the file path.
