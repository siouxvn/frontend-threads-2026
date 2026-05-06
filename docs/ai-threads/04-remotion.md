---
nav: AI
title: Remotion — the bridge between an idea and an MP4
order: 4
toc: content
description: Why Remotion is the bridge layer that lets an LLM go from "make me a video" to a real MP4 — plus a build-as-you-go tutorial of the primitives that power that pipeline.
keywords:
  [
    remotion,
    video,
    react,
    player,
    interpolate,
    spring,
    sequence,
    ai-generated-video,
    llm,
    mp4,
  ]
---

# Remotion — the bridge between an idea and an MP4

A few years ago, "I want a 15-second product reel" meant After Effects, six hours, and a designer who knew what they were doing. In 2026 it can mean: prompt an LLM, paste the output into a render command, ship the MP4. That bridge is real, and the load-bearing piece on the dev side is **[Remotion](https://www.remotion.dev/)** — a framework that lets you author videos in React.

This is why Remotion belongs in an AI-threads section even though Remotion itself contains no AI. Sora and the other prompt-to-video models eat the "give me a creative scene" use case, but the moment you need video that is **structured, branded, data-driven, or repeatable** — explainer videos, captioned shorts, dashboards-rendered-as-clips, daily auto-generated reels — those models are the wrong tool. You want a programmable canvas. The LLM writes the program; Remotion runs it.

The mental model is small enough that an LLM can hold it in head:

- A **Composition** is a React tree rendered once per frame.
- **Frame number** is the only input that changes — every visual property (motion, opacity, position) is a function of `useCurrentFrame()`.
- The **Player** mounts that composition in a browser and scrubs frames in real time. The **CLI renderer** does the same headlessly and stitches frames into video with FFmpeg.

This thread builds a small intro reel for Remotion itself — five steps, each adding exactly one concept on top of the last. Treat the steps as the vocabulary you need so an LLM's output makes sense to you when you read it. At the end, a "Let an LLM write it" section closes the loop with a real prompt and the actual code it produced.

> All five demos share a `<PlayerShell>` component that wraps a Composition in `<Player>` with sane defaults. Click "Show Code" on any demo to see only the concept under teaching — the boilerplate stays out of the way.

## Step 1 — Hello, Player

Mount a Composition. No animation. The point is to verify the Player renders, the resolution is right, and the playback bar works.

A Composition is just a React component. Inside `<Player>` it gets re-rendered on every frame, but if nothing in the tree depends on the frame, the output looks static — and that is fine for the first step.

<code src="./demos/remotion/step1-hello-player.tsx"></code>

:::info
Compositions must be rendered _inside_ a `<Player>` (or inside the CLI renderer). Calling Remotion hooks like `useCurrentFrame()` outside that context throws. The shell takes care of it.
:::

## Step 2 — interpolate + useCurrentFrame

This is the Remotion mental model in a single line: **read the current frame, map it to a number, use that number as a style value**.

`interpolate(frame, [inputRange], [outputRange], options)` is a clamp-friendly wrapper around `lerp`. Combined with `extrapolateRight: 'clamp'` it produces a fade that stops at 1.0 instead of running off forever.

<code src="./demos/remotion/step2-interpolate.tsx"></code>

`interpolate` is great for direct mappings, but linear motion looks robotic. The next step replaces it with a physical curve.

## Step 3 — Spring physics

`spring()` returns a value from 0 to 1 along a damped-oscillator curve. The shape depends on `damping`, `stiffness`, and `mass`. It is **frame-rate independent** — `useVideoConfig().fps` lets the function compute the same curve at 30, 60, or 120 fps.

Use it the same way you used `interpolate`: as a driver. Multiply by an end value, plug into `transform: scale(...)`, opacity, translation — anywhere a CSS number lives.

<code src="./demos/remotion/step3-spring.tsx"></code>

`spring` for entrances and exits, `interpolate` for direct frame-to-value mappings. Most production scenes mix both.

## Step 4 — Sequencing scenes

A real video is rarely a single composition. `<Sequence from={N} durationInFrames={D}>` lets you place any sub-tree at frame `N` for `D` frames on the same timeline. Inside that subtree, `useCurrentFrame()` is **rebased to start at 0** — so each scene can reuse the same spring/interpolate code without offsets.

<code src="./demos/remotion/step4-sequence.tsx"></code>

That covers placement. The next step adds polish — fonts, gradients, and a transition between the scenes.

## Step 5 — Code as a frame-function

Steps 1–4 each isolated one primitive. The final cut puts them all on screen at once — and pulls a meta trick: the demo is a **split-screen**. The left side types the source code character by character. The right side renders the result of that source code. Both panels are pure functions of `useCurrentFrame()`.

The source code shown on the left is exactly the shape of code an LLM produces when you prompt for "make me an animated title in Remotion" — a Composition function, `useCurrentFrame`, `spring`, an `<h1>` styled with a transform. Nothing the model couldn't write in one shot. The point of steps 1–4 was to give you the eyes to read this output, not the muscle memory to type it.

The typewriter is not a sequence of `<Sequence>` blocks. It is one line of math:

```tsx | pure
const charsRevealed = Math.floor(
  interpolate(frame, [0, endFrame], [0, source.length], {
    extrapolateRight: 'clamp',
  }),
);
const visible = source.slice(0, charsRevealed);
```

That is the whole framework in 6 lines: read the frame, map it to a number, slice a string. Add a blinking caret (`frame % 30 < 15`) and minimal regex-based syntax highlighting and you have an editor on screen.

The right panel is a mini-reel that boots up after the code finishes typing:

| Frame range | Beat |
| --- | --- |
| 0–130 | "Compiling" — three pulsing dots while the code types |
| 130–220 | Title `Remotion` springs in (uses the same `spring()` from step 3) |
| 220–340 | Tagline `Build videos with React` fades + lifts (uses `interpolate`) |
| 280–380 | Whole right group scales 1.0 → 1.04 — a subtle camera push |
| 340–450 | `remotion.dev →` CTA fades in, holds |

A linear-gradient background drives a slow hue shift across the entire reel — `interpolate(frame, [0, 450], [220, 280])` feeding `hsl()`. Inter is loaded via `@remotion/google-fonts/Inter` for headlines; the editor stays on the system monospace stack so it matches the host font you would see in VS Code.

<code src="./demos/remotion/step5-final.tsx"></code>

:::info
The shared `<CodeTypewriter>` lives in `./demos/remotion/shared/code-typewriter.tsx`. It is reusable boilerplate — pass any source string and a frame range. The interesting code is everything else in this step.
:::

:::warning
The Player preview is a **fast approximation**, not the final render. Codec, font hinting, and color profile differ between the in-browser player and the CLI MP4 output. Treat the Player as your fast feedback loop and verify the final cut by running an actual `remotion render`.
:::

## Let an LLM write it

The reason to learn the primitives is not so you can hand-author every reel. It is so you can read what an LLM produces, fix the parts that drift, and ship.

The prompt does not need to be a checklist. It can be one sentence — _"make me a 15-second Remotion intro for X"_ — and a competent agent will ask back about the things that matter (dimensions, fps, brand colour, font, which APIs to constrain to, the visual idea, duration). Two-word answers are usually enough. The structured 25-line "constraints + visual brief + reference" prompt only exists inside the model's working memory; you do not have to type it.

The one move that consistently lifts output quality regardless of model: **paste a working snippet from this codebase as a "match this style" reference.** Without it, models drift toward generic loose-style code. With it, your house style wins.

If you are using Claude Code, two skills from [claudekit.cc](https://claudekit.cc/) make this a single command:

- [`/ck:brainstorm`](https://claudekit.cc/skills/brainstorm) — drives the clarifying-question phase. Takes your one-line brief, reads the codebase for context, and asks back the 2–4 questions it actually needs answered before writing code.
- [`/ck:remotion`](https://claudekit.cc/skills/remotion) — Remotion-specific knowledge baked in (Player vs CLI render, frame-as-function mental model, the API surface used in steps 1–4). Saves the model from guessing at imports or hallucinating APIs.

Step 6 below is exactly this workflow run end to end, with the actual conversation visible.

## Step 6 — A worked example: a Sioux brand intro

A real run of the pipeline above against a real brief: a brand intro reel for [Sioux Technologies](https://www.siouxtechnologies.com/en/) — the company that hosts this docs site. Same primitives as steps 1–5, no new APIs.

**The actual conversation:**

```text | pure
You: Research siouxtechnologies.com and make a Remotion intro
     for Sioux. Could be step 6.

Me:  [Read the site, pulled the brand details — orange #f15d03
     accented with white, tagline "We bring high-tech to life",
     6 competencies, 6 target industries. Proposed a 6-beat
     structure (wordmark spring → tagline letter reveal →
     competency carousel → industry pill grid → "High-Tech &
     High-Fun" hero → CTA). Asked four questions:]

     1. OK to use the SIOUX wordmark + brand color?
     2. Frame as the worked example for "Let an LLM write it"?
     3. Show the literal prompt in the article?
     4. 15s or 10s?

You: Yes / yes / yes / 15s.

Me:  [Generated the bare Composition, registered it in
     render/Root.tsx, embedded the demo in the article.]

You (later): Sioux turns 30 in 2026 — add a final dedication
     beat: "Happy 30th anniversary of Sioux. From Thinh Kieu,
     with love."

Me:  [Extended duration 450→510 frames (15s→17s), added a
     spring-fade dedication beat after the CTA at 450–510.]

You (later): The competencies and markets in the demo don't
     match the actual nav on the Sioux site. Use the real labels.

Me:  [Replaced the 6 lowercase competencies with the 7 Title-
     Cased ones from the site nav (Mechanics was missing) and
     the 6 markets with their actual labels (Semicon, Analytical,
     Medical, Mobility & Infra, Telecom, Agro & Food). Extended
     beat 3 by one entry × 20 frames; total 530.]
```

**The output, rendered:**

<code src="./demos/remotion/step6-sioux-intro.tsx"></code>

**The render command:**

```bash
npx remotion render render/index.ts Step6Sioux out/sioux-intro.mp4
```

Real fixes after the first pass — none predicted by the model, all spotted by eye after watching the Player loop:

- **Brand color was wrong.** The corporate-logo SVG had `#E41B23` (red) in its geometric motif, so the model defaulted to that. The actual Sioux primary is `#f15d03` (orange) — a one-line swap once you spot it.
- **Competency labels overflowed.** "Embedded Software" and "Application Software" wrapped to two lines and threw off the centred layout. Fix: drop `fontSize` from 88 to 64 and pin `whiteSpace: nowrap`.
- **Industry pill rows split to top and bottom.** `flexWrap: wrap` on a full-frame container with default `align-content: stretch` pushed the rows apart. Fix: add `alignContent: 'center'` so the rows hug the middle.
- **Competencies and markets did not match the site.** The model summarised the brand from one page and dropped one item plus standardised the casing. Fix: copy the lists verbatim from the site's nav menus.

Each fix was a single property in the Composition. Steps 1–4 are what made them visible at all.

## Render to MP4 (CLI)

The Player is for fast iteration. To ship a video you render it headlessly. The CLI bundles your Composition with webpack, opens a headless Chromium, and writes one frame at a time before stitching them with FFmpeg.

The trick: the **bare Composition** must be importable without a `<Player>` wrapper around it. In this repo we extracted [`Step5Composition`](https://github.com/siouxvn/frontend-threads-2026/blob/main/docs/ai-threads/demos/remotion/shared/step5-composition.tsx) so both the Player demo above and the CLI render reuse the same source.

Install the CLI (already in this repo's `devDependencies`):

```bash
npm i -D @remotion/cli@4.0.457
```

[`render/Root.tsx`](https://github.com/siouxvn/frontend-threads-2026/blob/main/render/Root.tsx) registers the bare Composition under an id you can render by name:

```tsx | pure
import React from 'react';
import { Composition } from 'remotion';

import { Step5Composition } from '../docs/ai-threads/demos/remotion/shared/step5-composition';

export const RemotionRoot = () => {
  return (
    <Composition
      id="Step5"
      component={Step5Composition}
      durationInFrames={450}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
```

[`render/index.ts`](https://github.com/siouxvn/frontend-threads-2026/blob/main/render/index.ts) is a one-liner:

```tsx | pure
import { registerRoot } from 'remotion';

import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
```

Render:

```bash
# Default: 1280×720 mp4 to out/step5.mp4
npx remotion render render/index.ts Step5 out/step5.mp4

# Higher quality, 2× supersample then downscale
npx remotion render render/index.ts Step5 out/step5.mp4 --scale=2 --crf=18

# WebM
npx remotion render render/index.ts Step5 out/step5.webm --codec=vp9
```

The first run downloads a pinned Chromium (~150 MB) into `node_modules/@remotion/`. Subsequent renders skip that step.

Output formats include `mp4` (default, h264), `webm`, `gif`, and `png-sequence`. `--scale` supersamples; `--crf` controls quality (lower = better, 18 is high quality, 23 is default).

:::info
The CLI render is **not** wired into this docs site's CI — running headless Chromium in GitHub Actions is fine but slow and not needed here. Run renders locally. `out/` is gitignored.
:::

## What this unlocks

Once "an LLM produces a Composition" is a tool in your belt, the interesting work moves up a level — to deciding what to point it at. A few patterns worth playing with:

- **Daily auto-renders driven by data.** Cron job → fetch yesterday's metrics → prompt LLM with the numbers and a Composition template → `remotion render` → upload. End-state: a 30-second highlight reel that did not exist this morning.
- **Captioned shortform.** Whisper transcribes a podcast clip → LLM picks the best 60 seconds and writes a `<Sequence>` per phrase with its own animation. This is the entire shape of products like SubMagic and Captions.ai, built on top of Remotion.
- **Branded explainer videos at request volume.** Customer pastes a paragraph, an LLM writes a Composition that walks through the key points with the company's font and palette, render returns a link.
- **Long-form charts that show their work.** D3-rendered chart inside a Composition, animated frame by frame. The model writes the animation logic; you supply the data.

For deeper work the [Remotion docs](https://www.remotion.dev/docs/) cover [audio](https://www.remotion.dev/docs/audio), [captions](https://www.remotion.dev/docs/captions), [charts](https://www.remotion.dev/docs/animating-charts), [3D / R3F](https://www.remotion.dev/docs/three), and [Lambda rendering](https://www.remotion.dev/docs/lambda) for parallel cloud renders.

The mental model stays the same the whole way down: every frame is a function of the frame number. The rest — including who or what writes that function — is composition.
