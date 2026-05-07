---
nav:
  title: AI
  order: 2
group:
  title: Work in parallel with AI
  order: 5
title: Future tips
order: 99
toc: content
description: Likely candidates for the next entries in the Work in parallel with AI series.
keywords: [ai, parallel, workflow, claude code, multi-repo]
---

# Future tips

This series will grow as the multi-agent setup keeps surfacing new sharp edges. Likely candidates:

- **File ownership across agents.** When two agents work in the same repo, who owns which paths? How do you express that to both of them so neither stomps the other?
- **Worktree isolation.** Per-feature `git worktree`s instead of branch hopping in a single checkout — cheaper than juggling stash/restore in the agent prompt.
- **Branch hygiene.** Naming, base-branch policy, and what to delete when an experiment dies.
- **Conflict-free editing patterns.** Splitting tasks so agents touch disjoint files; surfacing accidental overlap before commit time.
- **Credential scoping.** GitHub tokens, npm logins, cloud profiles — same trap as git author, different blast radius.

If a tip earns its keep, it gets its own deep-dive page in this group.
