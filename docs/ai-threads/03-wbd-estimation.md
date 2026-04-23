---
nav: AI
title: WBD + Estimation with Claude Code
order: 3
toc: content
description: A personal case study — one time I used Claude Code + MCP to do work breakdown and estimation for an FE project straight from an SRS. Not a framework, just notes.
keywords:
  [
    wbd,
    work-breakdown,
    estimation,
    claude-code,
    mcp,
    figma,
    atlassian,
    jira,
    srs,
    planning,
    ck-plan,
    session-handoff,
  ]
---

# WBD + Estimation with Claude Code — a case study

> These are notes from one time I did WBD + estimation, not a recipe. I haven't measured actual vs estimate yet, so don't treat this as a template. Writing it down to share, and so future-me has something to look back at next time I face a similar task.

## Context

- FE side of a medical-imaging app (`<project>`, name redacted).
- Input: SRS v0.1 + project-alignment .md files + Figma design + team decisions.
- Output needed: Jira-ready user stories + sub-tasks, with estimates so PM can scope the sprint.
- I already had an initialized FE repo (Vite + antd + tanstack).
- After two days of work: ~22 stories, totaling **28d 7h 30m** at 8h/day (≈231.5 work hours), split across P1/P2/P3.

Nothing special about the domain. What's worth writing down is **how AI + MCP changed the flow** compared to the last time I did this by hand.

## Step 0 — Start with `/ck:find-skills`

Before picking a tool, I asked Claude Code itself:

> In the ck suite, which skills fit work breakdown and estimation from an SRS?

Answer: `/ck:plan`.

**Takeaway:** before opening a tool, ask the skill registry. Faster than reading every skill description.

## Step 1 — Organize docs before breaking down

The first thing I did was **not** WBD. I used `/ck:docs-seeker` + `/ck:brainstorm` to restructure the project's `docs/` into:

```
docs/
├── specifications/
│   ├── <project>-CRS-v0.4.md
│   ├── <project>-SRS-v0.1.md
│   ├── <project>-user-story-backlog-v0.4.md
│   └── project-alignment.md
├── interfaces/
│   ├── <system-A>-interface-discussion.md
│   └── <system-B>-notes-from-<stakeholder>.md
└── visuals/
    ├── system-architecture-v3.html
    ├── fe-knowledge-map.html
    ├── <project>-glossary-v2.html
    ├── crs-v03-vs-v04-comparison.html
    └── backlog-v02-vs-v04-comparison.html
```

**Takeaway:** nothing special here — I just like things tidy.

![Docs reorganization: before vs after](./assets/wbd/diagram-1-docs-reorganization.png)

## Step 2 — Kick-off: one prompt, two axes

I opened the session with a single, deliberately loaded prompt:

```md
/ck:plan I need to do a WBD for @docs/specifications/<project>-SRS-v0.1.md.

You can also reference @docs/specifications/project-alignment.md.

Specific request from PM:

<pm_notes>
According to contract with customer, the project delivery is divided into 3 phases:
Phase 1: Develop of first functional product
Phase 2: Hardening (bug fixes + concurrency readiness)
Phase 3: Pilot run + bug fixes
</pm_notes>

/ck:brainstorm I'm focused on FE, so I think we'll go through each item in the SRS, analyze which stories are needed for FE, and build the WBD together.
```

Three things worth noting about that prompt:

- It refs **two docs** (SRS + project-alignment).
- It pins **PM's 3-phase delivery contract** inside the prompt — estimates later get mapped to P1/P2/P3 because of this.
- It states the traversal strategy: "go through each SRS item" — framing the work as per-use-case.

Claude's **first analytical response** to that prompt already proposed splitting the work into two axes:

> Axis A — per-use-case vertical stories (one set per SRS.01.00x).  
> Axis B — cross-cutting concerns spanning all use cases (Auth, RBAC, API client, WebSocket wrapper, UI primitives, i18n, logging, TLS, design tokens, error boundary…).
>
> Reason: review burden lower per-UC, rollback clean, cross-cutting iterable separately.

That 2-axis framing was the AI's **opening move** — seeded by how loaded the initial prompt was (two docs + PM phasing + traversal strategy, all in a single message).

**Takeaway:** the upfront prompt does a lot of work. Feeding SRS + alignment doc + PM phasing + traversal strategy in one shot gave Claude enough structure to propose a coherent breakdown immediately. If I'd sent a bare "help me WBD this SRS", I'd have gotten a flat list and had to restructure later.

### Then the negotiation loop

Even with a good 2-axis skeleton, breaking individual stories inside Axis A took several rounds per use case:

1. Claude drafts sub-tasks → I push back:
   > What you've split are **sub-tasks**, not stories — the scope is too small.
2. Claude collapses into one story for the whole UC → I push back again:
   > But a single story covering all of SRS.01.001 is now **too big**.
3. Negotiate → split into 1.A, 1.B, 1.C (e.g., script editor shell / approval actions / websocket sync).
4. Estimate each sub-task inline (2–6h), roll up into a story (1–3d).

Output after this step: **13 Axis A stories** (P1/P2 split) + **Axis B parking lot** with 12 cross-cutting concerns.

![2-axis matrix with per-UC stories and cross-cutting parking lot](./assets/wbd/diagram-2-two-axis-matrix.png)

**Takeaway:** pushing back on granularity multiple times is normal. Don't accept AI's v1 for individual stories — but do accept the structural framing it proposes early, because by the time you've negotiated 13 stories you don't want to restructure.

## Step 3 — Session handoff via a summary doc

Axis A was done and committed. Context was getting heavy, so before starting the Axis B session I asked AI to summarize the finished session into `plans/next-steps.md` — what's done, what's next, conventions to mirror — then cleared the session and kicked off a new one with:

> `@plans/next-steps.md` — continue from here.

The new session picked up without me re-pasting the SRS or re-explaining conventions.

**Takeaway:** when context gets heavy, have AI write the handoff doc for you. Treat it as the output of one session and the input of the next — cheaper than re-bootstrapping from scratch.

## Step 4 — Manual review per story

From SRS.01.002 onward I went through each story **manually**: reading AC, cross-checking the SRS, `/ck:ask`-ing when something wasn't clear. AI acceleration isn't always right — the human review step still matters.

One fun observation, I told it:

> Main success scenario says steps 5–7, and I don't think that's right... I think copying those steps straight into the description is enough.

Don't paraphrase the SRS. Copy verbatim — treat the SRS text like a quote. It keeps the story tethered to the source so reviewers can jump straight back to the original spec instead of guessing what got rephrased.

## Step 5 — CLAUDE.md injection (the game changer)

This was the biggest moment. I took `CLAUDE.md` from the initialized FE repo (mentions antd, tanstack, socket.io...) and pasted it into the session. AI realized:

- Many UI sub-tasks marked "build from scratch" are actually **antd component + wrapper** (1h instead of 4h).
- Data fetching is **tanstack query** with existing patterns (drop several cache-layer sub-tasks).
- Realtime is **socket.io** not raw WebSocket (cut sub-tasks for handshake / reconnect).

AI **scanned every story on its own** and updated estimates. I just reviewed — no hand-editing per story.

Two side effects beyond estimate tuning:

- **Axis B collapsed from 12 items down to ~3.** Most cross-cutting concerns were already covered by the stack — antd for UI primitives and the confirm modal, socket.io for the WS wrapper, tanstack for the API/cache layer, etc. No bespoke story needed.
- **Axis A had grown in parallel** through the Step 4 per-story review — each UC kept splitting into finer stories. Net effect: the final ~22 stories are mostly Axis A with a thin Axis B tail.

**Takeaway:** inject tech-stack context EARLIER in the flow. If I were redoing this, I'd feed CLAUDE.md at step 2 instead of step 5. Initial estimates had drifted high because AI didn't know what was already built — and the Axis B parking lot was twice as long as it needed to be.

## Step 6 — Figma MCP for the admin page

Once the Figma admin page was ready, I pasted the URL:

> Here's the Figma for the admin page: `https://www.figma.com/design/...` (use Figma MCP to read it)

AI called `mcp__claude_ai_Figma__get_design_context` to fetch the real layout → updated AC + sub-tasks on the relevant stories.

Big time-saver vs me screenshotting each component and describing it in text.

![Figma MCP fetch and story update flow](./assets/wbd/diagram-3-figma-mcp-flow.png)

## Step 7 — Mid-stream scope change

Partway through, the team decided to drop "discard draft" + "save draft manually" in the script editor, keeping only auto-save. I asked:

> Review the plan in `plans/260422-1329-fe-wbd-axis-a` — what needs updating?

AI scanned every phase file, listed affected AC/sub-tasks, and updated them.

**Takeaway:** AI is better at _exhaustive sequential scanning_ than a human — scanning by hand I'd miss 2–3 spots; AI reads every file in order and misses fewer. Judgement still belongs to you; mechanical coverage belongs to the AI.

## Step 8 — Jira handoff

Two different handoffs:

- **Main story**: I copy-paste to Jira **manually**. Simple enough, and more importantly: pasting forces me to **re-read one more time** — this is the final review before the team picks it up.
- **Sub-tasks** (many, repetitive): I asked AI to bulk-create via the Atlassian MCP.

Sub-task estimates after step 5 were solid — I barely adjusted anything. Quite different from the first pass (before CLAUDE.md) when I was tweaking a lot.

## Result

- ~22 stories, split across P1/P2/P3.
- Total: **28d 7h 30m**.
- Time I spent: 2 working days.

Is it accurate? **I don't know yet.** No actual vs estimate data to compare. If this sprint wraps up I'll come back and update the delta.

## What I learned

- **`/ck:find-skills` before guessing the tool.** The registry knows more than I do.
- **Organize docs before breaking down.** Clean input → clean output.
- **CLAUDE.md (tech-stack context) as early as possible.** Estimates without it drift high.
- **AI beats a human at exhaustive sequential scanning** (scope change, stack update, rename). Judgement is still yours; mechanical coverage is theirs.
- **Keep some manual steps (copy story → Jira) to force yourself to re-read.** Full automation = no final review window.
- **Pushing back on granularity is normal.** AI's v1 usually has the wrong scope; v2–v3 is where it lands.
- **`/ck:plan` vs `/ck:brainstorm`.** Brainstorm is for _debating_ an approach (trade-offs, pushback, alternatives); plan is for _structuring_ the outcome (phases, sub-tasks, ordering). In a WBD flow: brainstorm to negotiate story boundaries, plan to organize the accepted backlog. Mixing both in one prompt (as I did) works but blurs the switch — next time I'd be more deliberate.

## Things I'm still unsure about

- **Is 28d 7h 30m optimistic or realistic?** No actual data yet. Will update post-sprint.
- **Without `CLAUDE.md`, how much does the estimate drift?** Didn't A/B it, just a sense that it was "quite a bit lower" after injection.
- **Does 2-axis work when the SRS has fewer than 3 use cases?** Axis B might be too thin — flat list could be better.
