---
nav: AI
title: Remotion — Build Videos with React
order: 4
toc: content
description: A linear, build-as-you-go tutorial for Remotion. Five live Player demos plus a CLI guide for rendering to MP4.
keywords:
  [
    remotion,
    video,
    react,
    player,
    interpolate,
    spring,
    sequence,
    transitions,
    google-fonts,
    mp4,
  ]
---

# Remotion — Build Videos with React

[Remotion](https://www.remotion.dev/) is a framework that lets you author videos in React. Components describe each frame; a render pipeline turns them into MP4. The mental model is small:

- A **Composition** is a React tree rendered once per frame.
- **Frame number** is the only input that changes — everything else (motion, opacity, position) is a function of the current frame.
- The **Player** mounts that composition in a browser and scrubs frames in real time. The **CLI renderer** does the same headlessly and stitches frames into video.

This thread builds a small intro reel for Remotion itself — five steps, each adding exactly one concept on top of the last. The browser previews are real Remotion Players. MP4 rendering is covered as a CLI section at the end.

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

## Render to MP4 (CLI)

The Player is great for iteration, but to ship a video you render it headlessly with the CLI. This requires one more package and a tiny `Root.tsx` that registers the Composition.

```bash
npm i -D @remotion/cli @remotion/bundler @remotion/renderer
```

Create a `remotion/Root.tsx` that wraps the same Composition you tested in step 5:

```tsx | pure
import { Composition } from 'remotion';

import Step5Final from '../docs/ai-threads/demos/remotion/step5-final';
// In a real project, extract the Composition out of the Player wrapper
// and import that directly here. The Player wrapper exists only for the docs.

export const RemotionRoot = () => {
  return (
    <Composition
      id="Intro"
      component={Step5Final}
      durationInFrames={450}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
```

Register the root in `remotion/index.ts`:

```tsx | pure
import { registerRoot } from 'remotion';

import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
```

Then render:

```bash
npx remotion render remotion/index.ts Intro out/intro.mp4
```

Output formats supported by the renderer include `mp4` (default), `webm`, `gif`, and `png-sequence` (one PNG per frame for downstream tooling). Pass `--codec=h264 --crf=18` for higher quality, or `--scale=2` to render at 2× resolution and downscale.

:::info
The CLI render runs headless Chromium, which is **not** wired into this docs site's CI. Run renders on your own machine. The Player demo on this page is what readers see in the browser.
:::

## What's next

This thread covers the smallest path from "blank page" to "rendered MP4". For real production work, the [Remotion docs](https://www.remotion.dev/docs/) go deeper into:

- [Audio](https://www.remotion.dev/docs/audio) — sync narration, music beds, and trim clips.
- [Captions](https://www.remotion.dev/docs/captions) — Whisper transcripts wired into Sequences.
- [Charts](https://www.remotion.dev/docs/animating-charts) — animating data with Recharts/D3 inside Compositions.
- [3D scenes](https://www.remotion.dev/docs/three) — Three.js / React Three Fiber inside Remotion.
- [Lambda rendering](https://www.remotion.dev/docs/lambda) — render long videos in parallel on AWS.

The mental model stays the same the whole way down: every frame is a function of the frame number. The rest is composition.
