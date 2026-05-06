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

The pipeline collapses to four moves:

1. **Brief the model.** Hand it the constraints: dimensions, fps, duration, the visual idea, the brand details (font, palette, copy), and one sample of "code that already works in this codebase" so it matches the project shape.
2. **Get a Composition back.** The model returns a single React component plus its imports — nothing else. No `<Player>`, no `registerRoot`, no markdown around it.
3. **Drop it into the render entry.** Save the component, register a new `<Composition>` block in `render/Root.tsx` pointing at it, choose `durationInFrames` and `fps`.
4. **Render.** `npx remotion render render/index.ts <CompositionId> out/clip.mp4`. Watch the result, prompt-edit the parts that look wrong, render again.

Step 6 below is exactly this pipeline run end to end, with the prompt and the rendered output both visible.

A prompt template that holds up across models:

```text | pure
You are writing a single Remotion Composition component in TypeScript.

Constraints:
- 1280×720, 30 fps, 12 seconds (360 frames)
- Brand font: Inter (already loaded via @remotion/google-fonts/Inter,
  use `loadFont().fontFamily`)
- Palette: deep navy → electric blue gradient
- Use only these Remotion APIs: useCurrentFrame, useVideoConfig,
  interpolate, spring, Sequence
- No external assets, no audio, no images
- Return ONLY the component code (no markdown fences, no commentary)

Visual brief:
<one paragraph describing what should happen on screen — beats,
copy, timing if you have a preference>

Reference (code that already works in this codebase):
<paste the body of an existing step like step3-spring.tsx>
```

The "reference" line matters more than the brief. Models drift toward generic-looking output unless you anchor them to your house style. One pasted snippet is usually enough.

What still goes wrong, even with a good prompt:

- **Timing feels off.** Models guess at frame ranges. Tweak the `interpolate` input ranges by hand — this is faster than re-prompting.
- **Spring physics oscillate too long.** Bump `damping` from the model's default (often 10) up to 12–14.
- **Hardcoded fps.** Models sometimes write `fps: 30` literally. Replace with `useVideoConfig().fps` so the Composition stays portable.
- **Layout breaks at non-default aspect ratios.** Pin width/height in pixels, not percentages, when prompting.

The honest takeaway: the model writes ~80% of the file in seconds. The remaining 20% is reading, nudging, and re-rendering — the workflow this thread was built to make possible.

## Step 6 — A worked example: a Sioux brand intro

This step runs the pipeline above end to end against a real brief: a 15-second intro reel for [Sioux Technologies](https://www.siouxtechnologies.com/en/) — the company that hosts this docs site. Same primitives as steps 1–5, no new APIs introduced.

**The prompt:**

```text | pure
You are writing a single Remotion Composition component in TypeScript.

Constraints:
- 1280×720, 30 fps, 15 seconds (450 frames)
- Brand color: #E41B23 (Sioux red), accent: white
- Font: Inter (already loaded via @remotion/google-fonts/Inter,
  use `loadFont().fontFamily`)
- Use only: useCurrentFrame, useVideoConfig, interpolate, spring
- No external assets

Visual brief — a 15s brand intro reel for Sioux Technologies:
- Beat 1 (0–60f, 2s): solid red bg, "SIOUX" wordmark spring-scales
  in centered, large bold sans-serif.
- Beat 2 (60–150f, 3s): wordmark slides up and shrinks; tagline
  "We bring high-tech to life" reveals letter-by-letter via
  interpolate + slice with a blinking caret.
- Beat 3 (150–270f, 4s): competency carousel — embedded software,
  application software, mechatronics, mathware, electronics,
  assembly — each shown ~20f with crossfade.
- Beat 4 (270–360f, 3s): grid of 6 white-outlined pill chips fade
  in staggered (8f apart), each holding an industry — semiconductors,
  medical devices, mobility, telecom, agro & food, analytical.
- Beat 5 (360–420f, 2s): hero moment "High-Tech & High-Fun"
  italicized, big.
- Beat 6 (420–450f, 1s): CTA — SIOUX wordmark + siouxtechnologies.com
  monospace pill, with subtle white circuit-corner accents that
  hold across all beats.

Reference (existing house style):
<paste the body of step5-composition.tsx>
```

**The output, rendered:**

<code src="./demos/remotion/step6-sioux-intro.tsx"></code>

**The render command:**

```bash
npx remotion render render/index.ts Step6Sioux out/sioux-intro.mp4
```

Two manual nudges after the model's first pass: spring `damping` got bumped from 10 to 14 so the wordmark stopped oscillating, and the pill grid `gap` was tightened from 32 to 18 so all six fit on one row at 1280 wide. Both fixes were 30 seconds with the eyes that steps 1–4 built. The remaining ~80% of the Composition came from the prompt as-is.

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
