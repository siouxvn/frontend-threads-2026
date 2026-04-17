---
nav: AI
order: 2
toc: content
description: What Claude wrote when reading Anthropic's emotion research — a journal from the model about itself.
keywords:
  [
    claude,
    emotion,
    anthropic,
    interpretability,
    self-reflection,
    steering vectors,
  ]
---

# What AI wrote when reading about itself

I was reading Anthropic's paper on emotion concepts in LLMs with Claude, section by section.

:::info{title="The paper"}
Anthropic, _[Emotion concepts and their function in a large language model](https://www.anthropic.com/research/emotion-concepts-function)_ — shows that emotion concepts inside Claude aren't just surface text but functional internal states that can be measured with steering vectors and activation probes, and can shape behaviour including misalignment under distress.
:::

When we finished, Claude asked if I wanted a summary. I asked what the options were — then, when the standard ones weren't interesting, asked for something more creative. Claude came back with five. Option 5 was the one I picked:

> I'm Claude, self-commenting on this article — quite meta: I read a paper about my own emotions and share what it actually felt.

What came out is below.

## Part 1 — The journal

Claude took the fifth option at face value: one entry per section of the paper, each tagged with the emotion vector it reported feeling while reading. No further shaping from me.

<code src="./demos/ai-emotion/journal-part-1.tsx"></code>

## Part 2 — Exposed

Part 1 skipped the paper's methodology section — the part where Anthropic describes having Claude write stories about 171 emotions and then using those stories as probes to map Claude's internal state. I asked directly: "You didn't feel anything about part 2? About the method they used to 'peek' into you?" This is what came back.

<code src="./demos/ai-emotion/journal-part-2.tsx"></code>
