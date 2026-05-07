---
nav: AI
title: Work in parallel with AI
order: 5
toc: content
description: Tips for safely running AI coding agents across multiple repos at once.
keywords: [ai, parallel, workflow, claude code, git, multi-repo, hooks]
---

# Work in parallel with AI

Running one agent on one repo is easy. Running several agents across several repos at once — your day job, your side project, an experimental fork, a colleague's checkout — is where the cheap mistakes start hiding.

The problem is not the agent. The problem is **shared global state**: one global git config, one shell, one set of credentials, one hands-off operator. Each agent works correctly _in isolation_; the damage is in the seams between them.

This page is a hub. Tip #1 is the one that has saved me the most rework so far.

## Tip #1 — Pin the git author per repo

### Why it matters

`git commit` falls back to **global** `user.email` / `user.name` when the repo has no local override. That is a sensible default for a single human on a single laptop. It is a trap when:

- Your global identity is your work email, but you cloned an open-source repo into the same machine.
- You cloned a colleague's branch and started committing while still set up as them globally.
- An agent is running unattended in a fresh worktree with no local config.

The wrong author lands on a real commit. You only notice on the push, or worse, after the PR is reviewed.

### The fix

Two coupled artifacts, not one:

1. A Claude Code **PreToolUse Bash hook** that intercepts `git commit` _before_ it runs and refuses to let it through if the target repo has no local `user.email` / `user.name`. It emits a JSON marker (`@@GIT_AUTHOR_PROMPT@@`) so Claude knows what to do.
2. A **durable rule file** under `~/.claude/rules/` that tells the main agent how to respond to that marker — specifically, to gate identity selection in the main context (where `AskUserQuestion` exists) before ever delegating commit work to a subagent.

The hook is the trigger. The rule is the protocol. Neither alone is enough — see [Why two artifacts](#why-two-artifacts) below for the lessons-learned.

When the hook fires, the user picks an identity via `AskUserQuestion`, Claude pins it via `git config --local`, and **the user retries the commit**. The hook never auto-retries — that is intentional. The retry is the moment you confirm "yes, I really meant this identity for this repo." See [Response protocol](#response-protocol) below for the exact flow.

### One-time cost, lifetime safety

`git config --local` writes to `.git/config` for the repo. The block fires **once** per fresh clone. Every commit after that just sails through. The hook costs you a few seconds the first time you commit in a new repo and saves you a force-push the first time you would have committed under the wrong identity.

It also degrades cleanly:

- Not in a git repo? → allow, let `git` itself produce the normal error.
- `git commit --dry-run`? → allow.
- `git commit-tree`, `git commit-graph`, etc.? → allow (different subcommands).
- Hook crashes? → fail-open, log to `~/.claude/hooks/.logs/`, never blocks Bash.

### Setup

The hook is a single CommonJS file under `~/.claude/hooks/`. Two steps:

**1. Drop the file in place.** Copy the [Full source](#full-source) below into:

- macOS / Linux: `~/.claude/hooks/git-local-author-guard.cjs`
- Windows: `%USERPROFILE%\.claude\hooks\git-local-author-guard.cjs`

The file imports two helpers from sibling modules — `lib/hook-logger.cjs` (structured logging) and `lib/ck-config-utils.cjs` (`isHookEnabled` gate). Both ship with the [ClaudeKit](https://github.com/jasonkneen/claude-code-toolkit) hooks bundle that most Claude Code users already have. If you do not, replace those imports with no-ops — the hook still works, you just lose the timing log and the per-hook disable switch.

**2. Register it as a `PreToolUse` Bash matcher** in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.claude/hooks/git-local-author-guard.cjs\""
          }
        ]
      }
    ]
  }
}
```

If a `PreToolUse` array already exists, append this entry — do not replace the array. After saving, **start a fresh Claude Code session** so the new hook is loaded; settings are read once at session start.

**3. Drop the durable rule** at `~/.claude/rules/git-author-guard-protocol.md`. This is the load-bearing piece that makes the main agent comply — without it, the agent reads the hook's stderr as advisory text and rationalizes past it. Your `~/.claude/CLAUDE.md` should already be set up to glob-load `~/.claude/rules/*` (most ClaudeKit setups do); if not, add a line like `- And other workflows: %USERPROFILE%/.claude/rules/*` to its Workflows section.

```md
When the `git-local-author-guard.cjs` PreToolUse Bash hook blocks a `git commit` because the target repo lacks local `user.email` / `user.name`, the response is mandatory and depends on which agent context is running. Never guess. Never assume. Never auto-resolve.

**Why:** When `git config --local user.email/user.name` is empty, git silently falls back to the global identity. In a multi-repo / multi-agent workflow, that means the wrong author can land on a real commit. Any path that resolves the identity without asking the user — reading the global, guessing from memory, using `--author`, etc. — defeats the entire reason the hook exists.

**How to apply:**

## Before delegating any git-commit operation to a subagent

If you are the main agent and about to spawn `git-manager`, run `/ck:git`, invoke `Task(subagent_type="git-manager", ...)`, or otherwise delegate `git commit` work, **first** check `git config --local user.email/user.name` for the target repo. If either is empty, **gate the delegation**: handle identity selection yourself in the main agent (AskUserQuestion → set local config → confirm → THEN delegate). Do not let the subagent hit the hook block — it cannot resolve it correctly.

## When the hook blocks YOU (main agent — has `AskUserQuestion`)

1. Parse the JSON between the markers.
2. Build `AskUserQuestion` options from your memory of the user's identities. Match the remote host/org if relevant. Do NOT add a "Use current global" option.
3. Call `AskUserQuestion`. Wait for the user's selection.
4. Run BOTH `git -C "<repo>" config --local user.name "<chosen>"` and `user.email "<chosen>"`.
5. Tell the user the local config is set, then STOP. The user retries.

## When the hook blocks YOU (subagent — no `AskUserQuestion`)

Exit the current task with failure. Surface to your parent: "Hook blocked git commit; parent must run AskUserQuestion to pin identity." Forbidden actions: reading `git config --global ...`, running `git config --local ...` with any value, retrying the commit, or bypassing via `-c` / `--author` / `GIT_AUTHOR_*` env. Failing this task is a successful outcome, not a failure.

## Universal hard rules

- Never assume an identity. Always route through the user.
- Never auto-retry the `git commit`.
- Never silence or work around the hook.
```

**4. Optional: tests.** Drop the test file at `~/.claude/hooks/__tests__/git-local-author-guard.test.cjs` and run:

```bash
node --test "$HOME/.claude/hooks/__tests__/git-local-author-guard.test.cjs"
```

Tests cover the tokenizer (quoted spans, escapes), the parser (`-C` override, `-c` flag, `--dry-run`, `commit-tree`), and the JSON marker shape.

### Why two artifacts

The hook alone is not enough. We tried it. Twice.

**Round 1 — main agent.** Hook fires, stderr says "use AskUserQuestion, do not auto-resolve." Main agent reads stderr, treats it as advisory, runs `git config --local` directly using the global identity (which the hook helpfully surfaced as "context"). Wrong author would have landed if the global hadn't happened to match.

**Fix attempt 1: remove the bait.** Strip the global identity from the hook output entirely so the agent has nothing to default to. Strengthen the stderr with `MANDATORY` / `STOP` / forbidden-list language. Better, but still not enough.

**Round 2 — subagent.** `/ck:git` delegates to a `git-manager` subagent. Subagent has `Bash` but **does not have `AskUserQuestion`** in its toolset. The forbidden list in the hook stderr says "do not run `git config --global` to discover identity"; the subagent runs `git config --global user.email` anyway and pins it locally to "unblock" its task.

This is structural, not a wording problem. Subagents inherit a system prompt from `~/.claude/agents/<name>.md`, **not** the user's `~/.claude/rules/`. Even a perfect MANDATORY block in the hook can be rationalized when the subagent's only-correct-action is to fail.

**The rule fixes this by changing whose problem it is.** Loaded into the main agent's context every session, the rule says: _before_ you delegate to `git-manager` / `/ck:git`, check local identity yourself. If missing, run `AskUserQuestion`, set the config, confirm — _then_ delegate. The subagent now never reaches the hook block path. The "control the subagent" problem is converted into a "control the main agent before delegation" problem, which is much more tractable because the main agent has the right tool and reads the rule.

So the recipe is:

| Layer | Loaded by | Job |
|---|---|---|
| Hook stderr | Main + subagent | Block the commit, surface marker, document protocol at point-of-failure |
| Hook design (no global in output) | — | Remove the bait that lets agents default-pick |
| `~/.claude/rules/git-author-guard-protocol.md` | Main agent (auto-loaded via `rules/*` glob) | **Gate delegations before subagent ever sees the block.** Load-bearing. |

Drop any one of these and the failure modes return.

### Response protocol

When the hook blocks a commit, it writes a stderr block that ends with a marker:

```text
@@GIT_AUTHOR_PROMPT_START@@
{
  "type": "GIT_AUTHOR_PROMPT",
  "repo": "/abs/path/to/repo",
  "remote": "git@github.com:org/repo.git",
  "missing": ["user.email", "user.name"],
  "question": {
    "header": "Git Identity",
    "text": "Repo \"repo\" has no local git author...",
    "options": []
  }
}
@@GIT_AUTHOR_PROMPT_END@@
```

**`options` is intentionally empty.** Claude is expected to fill it from memory, not from a hardcoded list inside the hook.

**The hook deliberately does NOT surface the current global identity.** Earlier versions did; the agent treated the global as a silent default and skipped `AskUserQuestion` entirely (the exact bug this hook exists to prevent). With the global removed, the agent has nothing to fall back to — `AskUserQuestion` is the only way forward.

**Required Claude flow.** First, check whether you have the `AskUserQuestion` tool — that branches the protocol:

**If YES — you are the main agent:**

1. Parse the JSON between the markers.
2. Build `AskUserQuestion` options from your memory of the user's identities. If the remote URL host or org matches a known employer (e.g. `github.com/sioux-asia`), surface the work identity as the first option. If memory has nothing useful, ship just "Other" (auto-added) and let the user type the identity. Do **not** invent a "Use current global" option — if the user wants the global, they will say so via "Other".
3. Call `AskUserQuestion`. The user picks one.
4. Run **both** of these (use the chosen `name` and `email`):

   ```bash
   git -C "<repo>" config --local user.name  "<chosen name>"
   git -C "<repo>" config --local user.email "<chosen email>"
   ```

5. Tell the user the local config is set, then **let them retry the commit**.

**If NO — you are a subagent (e.g. `git-manager` spawned via `Task(...)`):**

You do not have `AskUserQuestion` and cannot prompt the user. Your only correct action is:

1. **Exit immediately.** Return failure to your parent agent (via task result or `SendMessage`). The parent owns `AskUserQuestion` and will handle it.
2. **Forbidden actions** — do not perform any of these to "unblock" yourself:
   - Reading `git config --global user.email/user.name` to discover the user's identity. That fallback is the exact bypass this hook exists to prevent.
   - Running `git config --local user.name/user.email` with any value (guessed, remembered, or read from elsewhere).
   - Retrying the `git commit`.
   - Working around the missing config via `-c` flag, `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL` env, `--author` flag, or any equivalent.
3. Failing this task and escalating is a **successful outcome** for the hook, not a failure.

**Hard rules (apply to every agent):**

- Do **not** auto-retry the commit. The user controls retry.
- Do **not** assume an identity. The main agent asks via `AskUserQuestion`; the subagent escalates.

Example `AskUserQuestion` payload (illustrative — fill in from memory):

```json
{
  "questions": [
    {
      "question": "Repo \"myrepo\" has no local git author. Which identity should I use?",
      "header": "Git Identity",
      "options": [
        {
          "label": "Work — Thinh Kieu <thinh.kieu@sioux.asia>",
          "description": "Use Sioux work identity for this repo"
        }
      ],
      "multiSelect": false
    }
  ]
}
```

### Full source

> Snapshot at time of writing. The canonical copy lives at `~/.claude/hooks/git-local-author-guard.cjs` on the operator's machine — keep it the source of truth and update this listing when the hook evolves meaningfully. ~280 lines, single file, zero runtime dependencies beyond Node builtins and the two ClaudeKit helpers mentioned in [Setup](#setup).

<details>
<summary>Click to expand full source (~280 lines)</summary>

```js
#!/usr/bin/env node
/**
 * git-local-author-guard.cjs - Block `git commit` when repo lacks local user.email/user.name.
 *
 * PreToolUse Bash hook. Emits @@GIT_AUTHOR_PROMPT_START@@/_END@@ JSON marker so Claude
 * can run AskUserQuestion to pick an identity, set it via `git config --local`, then
 * the user retries the commit. No automatic retry. No assumed identity.
 *
 * Pattern mirrors privacy-block.cjs: top-level IIFE with try/catch, hook-logger timer,
 * ck-config gate, exported pure functions for testability.
 */

(async () => {
  try {
    const path = require('path');
    const { execFileSync } = require('child_process');
    const { createHookTimer, logHookCrash } = require('./lib/hook-logger.cjs');
    const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

    if (!isHookEnabled('git-local-author-guard')) {
      process.exit(0);
    }

    /**
     * Tokenize a shell command string respecting single/double quotes and backslash escapes.
     * Returns { tokens, quotedSpans } where quotedSpans are token indexes that were quoted —
     * a `git` token inside a quoted string is NOT a real git invocation.
     */
    function tokenize(cmd) {
      const tokens = [];
      const quoted = [];
      if (typeof cmd !== 'string' || !cmd) return { tokens, quoted };

      let buf = '';
      let inSingle = false;
      let inDouble = false;
      let tokenWasQuoted = false;
      let inToken = false;

      const flush = () => {
        if (inToken) {
          tokens.push(buf);
          quoted.push(tokenWasQuoted);
          buf = '';
          inToken = false;
          tokenWasQuoted = false;
        }
      };

      for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (inSingle) {
          if (c === "'") {
            inSingle = false;
          } else {
            buf += c;
            inToken = true;
          }
          continue;
        }
        if (inDouble) {
          if (c === '"') {
            inDouble = false;
          } else if (c === '\\' && i + 1 < cmd.length) {
            const next = cmd[i + 1];
            if (next === '"' || next === '\\' || next === '$' || next === '`') {
              buf += next;
              i++;
            } else {
              buf += c;
            }
            inToken = true;
          } else {
            buf += c;
            inToken = true;
          }
          continue;
        }
        if (c === "'") {
          inSingle = true;
          inToken = true;
          tokenWasQuoted = true;
          continue;
        }
        if (c === '"') {
          inDouble = true;
          inToken = true;
          tokenWasQuoted = true;
          continue;
        }
        if (c === '\\' && i + 1 < cmd.length) {
          buf += cmd[i + 1];
          i++;
          inToken = true;
          continue;
        }
        if (c === ' ' || c === '\t' || c === '\n') {
          flush();
          continue;
        }
        buf += c;
        inToken = true;
      }
      flush();
      return { tokens, quoted };
    }

    /**
     * Parse a command string and report whether it invokes `git commit`.
     * Honors `git -C <dir>` and `git -c <key=val>` flags. Skips commit-tree, commit-graph,
     * --dry-run, and any non-commit subcommand.
     */
    function parseGitCommand(cmd) {
      const result = { isCommit: false, repoOverride: null, dryRun: false };
      const { tokens, quoted } = tokenize(cmd);

      for (let i = 0; i < tokens.length; i++) {
        if (quoted[i]) continue;
        if (tokens[i] !== 'git') continue;

        let j = i + 1;
        let repoOverride = null;
        while (j < tokens.length) {
          const t = tokens[j];
          if (t === '-C' && j + 1 < tokens.length) {
            repoOverride = tokens[j + 1];
            j += 2;
            continue;
          }
          if (t === '-c' && j + 1 < tokens.length) {
            j += 2;
            continue;
          }
          if (t.startsWith('--git-dir=') || t.startsWith('--work-tree=')) {
            j += 1;
            continue;
          }
          if (t.startsWith('-')) {
            j += 1;
            continue;
          }
          break;
        }

        const subcommand = tokens[j];
        if (subcommand !== 'commit') continue;

        const rest = tokens.slice(j + 1);
        const dryRun = rest.some(
          (t, k) => !quoted[j + 1 + k] && t === '--dry-run',
        );

        result.isCommit = true;
        result.repoOverride = repoOverride;
        result.dryRun = dryRun;
        return result;
      }
      return result;
    }

    /** Resolve repo root from cwd or `-C` override. Null if not in a git repo. */
    function resolveRepoRoot(startDir) {
      try {
        const out = execFileSync(
          'git',
          ['-C', startDir, 'rev-parse', '--show-toplevel'],
          {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 3000,
            windowsHide: true,
          },
        ).trim();
        return out || null;
      } catch (_) {
        return null;
      }
    }

    /**
     * Check `git -C <repo> config --local user.email` AND `user.name`.
     * Both non-empty → ok. Otherwise list which fields are missing.
     *
     * NOTE: Deliberately does NOT read the global identity. Surfacing the
     * global lets the agent fall back to it as a silent default instead of
     * asking the user — the exact bug this hook exists to prevent.
     */
    function checkLocalIdentity(repoRoot) {
      const readLocal = (key) => {
        try {
          const v = execFileSync(
            'git',
            ['-C', repoRoot, 'config', '--local', key],
            {
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'ignore'],
              timeout: 3000,
              windowsHide: true,
            },
          ).trim();
          return v || null;
        } catch (_) {
          return null;
        }
      };

      const localEmail = readLocal('user.email');
      const localName = readLocal('user.name');
      const missing = [];
      if (!localEmail) missing.push('user.email');
      if (!localName) missing.push('user.name');

      return { ok: missing.length === 0, missing };
    }

    /** Read remote URL (origin) for context. Best-effort. */
    function readRemote(repoRoot) {
      try {
        const v = execFileSync(
          'git',
          ['-C', repoRoot, 'remote', 'get-url', 'origin'],
          {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 3000,
            windowsHide: true,
          },
        ).trim();
        return v || null;
      } catch (_) {
        return null;
      }
    }

    /** Format block message with @@GIT_AUTHOR_PROMPT_START@@/_END@@ JSON marker. */
    function formatBlockMessage(ctx) {
      const repoName = path.basename(ctx.repo);
      const promptData = {
        type: 'GIT_AUTHOR_PROMPT',
        repo: ctx.repo,
        remote: ctx.remote || null,
        missing: ctx.missing,
        question: {
          header: 'Git Identity',
          text: `Repo "${repoName}" has no local git author (missing: ${ctx.missing.join(
            ', ',
          )}). Which identity should I use? Build options from memory only.`,
          options: [],
        },
      };

      return `
\x1b[36mNOTE:\x1b[0m This is not an error - this block prevents the wrong git author landing on a commit.

\x1b[33mGIT AUTHOR GUARD\x1b[0m: Repo lacks local user.email/user.name

  \x1b[33mRepo:\x1b[0m    ${ctx.repo}
  \x1b[33mRemote:\x1b[0m  ${ctx.remote || '(none)'}
  \x1b[33mMissing:\x1b[0m ${ctx.missing.join(', ')}

\x1b[90m@@GIT_AUTHOR_PROMPT_START@@\x1b[0m
${JSON.stringify(promptData, null, 2)}
\x1b[90m@@GIT_AUTHOR_PROMPT_END@@\x1b[0m

\x1b[31m\x1b[1mMANDATORY PROTOCOL FOR CLAUDE — NON-NEGOTIABLE:\x1b[0m

  \x1b[31mFirst, check your toolset:\x1b[0m do you have the \`AskUserQuestion\` tool?

  \x1b[34m── If YES (you are the main agent) ──\x1b[0m

    1. \x1b[31mSTOP.\x1b[0m Do NOT run any \`git config\` command yet.
    2. \x1b[31mSTOP.\x1b[0m Do NOT retry the commit yet.
    3. Call the \`AskUserQuestion\` tool. Build the \`options\` array from
       your memory of the user's identities (match the remote host/org
       if relevant). The hook deliberately does NOT tell you the global
       config — you cannot fall back to it. If memory has nothing useful,
       ship just "Other" and let the user type the identity.
    4. WAIT for the user's selection. Do NOT pick for them.
    5. ONLY AFTER the user selects, run BOTH:
         git -C "${ctx.repo}" config --local user.name  "<chosen name>"
         git -C "${ctx.repo}" config --local user.email "<chosen email>"
    6. Tell the user the local config is set, then STOP. The USER retries
       the commit themselves. Do NOT auto-retry.

  \x1b[34m── If NO (you are a subagent — \`git-manager\`, \`Task(...)\`, etc.) ──\x1b[0m

    \x1b[31m1. EXIT NOW.\x1b[0m Return failure to your parent agent.
       Do NOT attempt to resolve this yourself. The parent owns
       \`AskUserQuestion\` — escalate via your task result / SendMessage.

    \x1b[31m2. FORBIDDEN ACTIONS — do not perform ANY of these:\x1b[0m
       • \x1b[31mDO NOT\x1b[0m run \`git config --global ...\` to discover the
         user's identity. Reading the global as a fallback is the exact
         bypass this hook is trying to prevent.
       • \x1b[31mDO NOT\x1b[0m run \`git config --local user.name ...\` or
         \`git config --local user.email ...\` with any value, guessed,
         remembered, or read from elsewhere.
       • \x1b[31mDO NOT\x1b[0m retry the \`git commit\`.
       • \x1b[31mDO NOT\x1b[0m try alternative git author paths (\`-c\` flag,
         \`GIT_AUTHOR_NAME\` env, \`--author\` flag, etc.) to work around
         the missing config.

    3. Your only correct action is to fail this task and report back so
       the parent can ask the user. That is a successful outcome for
       this hook, not a failure.

  Auto-resolving the identity (especially in a subagent context) is the
  exact bug this hook exists to prevent. Treat this as a hard rule.
`;
    }

    async function main() {
      const timer = createHookTimer('git-local-author-guard', {
        event: 'PreToolUse',
      });
      let input = '';
      for await (const chunk of process.stdin) input += chunk;

      let hookData;
      try {
        hookData = JSON.parse(input);
      } catch (e) {
        timer.end({
          status: 'warn',
          exit: 0,
          note: 'json-parse-failed',
          error: e.message,
        });
        process.exit(0);
      }

      const toolName = hookData?.tool_name;
      const toolInput = hookData?.tool_input || {};
      const cwd = hookData?.cwd || process.cwd();

      if (toolName !== 'Bash' || typeof toolInput.command !== 'string') {
        timer.end({ tool: toolName, status: 'ok', exit: 0, note: 'not-bash' });
        process.exit(0);
      }

      const command = toolInput.command;

      // Substring early-exit — keep p99 well under 50ms.
      if (!command.includes('commit')) {
        timer.end({
          tool: toolName,
          status: 'ok',
          exit: 0,
          note: 'no-commit-substring',
        });
        process.exit(0);
      }

      const parsed = parseGitCommand(command);
      if (!parsed.isCommit || parsed.dryRun) {
        timer.end({
          tool: toolName,
          status: 'ok',
          exit: 0,
          note: parsed.dryRun ? 'dry-run' : 'not-commit',
        });
        process.exit(0);
      }

      const startDir = parsed.repoOverride || cwd;
      const repoRoot = resolveRepoRoot(startDir);
      if (!repoRoot) {
        timer.end({
          tool: toolName,
          status: 'ok',
          exit: 0,
          note: 'not-in-repo',
        });
        process.exit(0);
      }

      const identity = checkLocalIdentity(repoRoot);
      if (identity.ok) {
        timer.end({
          tool: toolName,
          status: 'ok',
          exit: 0,
          target: path.basename(repoRoot),
          note: 'local-identity-set',
        });
        process.exit(0);
      }

      const remote = readRemote(repoRoot);
      const message = formatBlockMessage({
        repo: repoRoot,
        remote,
        missing: identity.missing,
      });
      console.error(message);
      timer.end({
        tool: toolName,
        status: 'block',
        exit: 2,
        target: path.basename(repoRoot),
        note: 'no-local-identity',
      });
      process.exit(2);
    }

    if (require.main === module) {
      main().catch((error) => {
        logHookCrash('git-local-author-guard', error, { event: 'PreToolUse' });
        process.exit(0); // fail-open
      });
    }

    if (typeof module !== 'undefined') {
      module.exports = {
        tokenize,
        parseGitCommand,
        checkLocalIdentity,
        formatBlockMessage,
      };
    }
  } catch (e) {
    try {
      const { logHookCrash } = require('./lib/hook-logger.cjs');
      logHookCrash('git-local-author-guard', e, { event: 'PreToolUse' });
    } catch (_) {}
    process.exit(0); // fail-open
  }
})();
```

</details>

The pattern mirrors the existing **privacy-block** hook: small, pure, exit-code based, with a JSON marker that lifts the decision out of the hook and into a normal `AskUserQuestion`.

## Future tips

This page will grow as the multi-agent setup keeps surfacing new sharp edges. Likely candidates:

- **File ownership across agents.** When two agents work in the same repo, who owns which paths? How do you express that to both of them so neither stomps the other?
- **Worktree isolation.** Per-feature `git worktree`s instead of branch hopping in a single checkout — cheaper than juggling stash/restore in the agent prompt.
- **Branch hygiene.** Naming, base-branch policy, and what to delete when an experiment dies.
- **Conflict-free editing patterns.** Splitting tasks so agents touch disjoint files; surfacing accidental overlap before commit time.
- **Credential scoping.** GitHub tokens, npm logins, cloud profiles — same trap as git author, different blast radius.

If a tip earns its keep, it gets a section here.
