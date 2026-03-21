---
nav: Threads
order: 2
toc: content
description: Four ways to consume a ReadableStream — illustrated by downloading a 4K video with progress tracking and cancellation support.
keywords: [ReadableStream, async generator, observable, TransformStream, MSW, streaming]
---

# Stream Processing Patterns

The browser's Fetch API returns response bodies as a `ReadableStream` — a pull-based byte
stream that lets you process data as it arrives instead of waiting for the entire payload.
For small JSON responses, `.json()` handles everything transparently. For large payloads
like video files, audio, or real-time event feeds, consuming the stream directly gives you
control over memory, progress tracking, and cancellation.

This thread explores **four patterns for consuming a `ReadableStream`**, each with different
trade-offs. The demo scenario is concrete: download a 4K video file (over 1 GB) from a mock
backend, track per-chunk progress and rolling transfer speed, and support mid-transfer
cancellation via `AbortController`.

Each demo fetches a 4K video file (over 1 GB) imported directly as an asset URL — the same
pattern used for any static resource in a Dumi project. No artificial throttling: the file
is large enough that streaming behavior, progress, and cancellation are all observable in
real time.

:::info{title="What you'll learn"}

- How `ReadableStream`, `getReader()`, and the Reader API work under the hood
- Four consumption patterns: manual `while` loop, async generator pipeline, Observable, and `TransformStream`
- Trade-offs across composability, cancellation, backpressure, and error propagation
- Why `reader.releaseLock()` in a `finally` block matters

:::

## Pattern 1 — `while(true)` Loop <Badge>Baseline</Badge>

The simplest way to consume a `ReadableStream`: call `getReader()` to lock the stream,
then loop with `reader.read()` until `done` is `true`. Each call suspends at the `await`
until the next chunk arrives, naturally yielding control back to the event loop between
chunks.

Cancellation requires a manual `signal.aborted` check **before** each `reader.read()` call.
The `finally` block guarantees `reader.releaseLock()` runs unconditionally — skipping it
leaves the stream permanently locked, causing any future read attempt to throw.

:::warning
Check `signal.aborted` **before** `reader.read()`, not after. By the time `read()`
resolves, the chunk is already dequeued from the stream's internal buffer. Checking
only after the read means you process one extra chunk after cancellation.
:::

<code src="./demos/stream-patterns/pattern1-while-loop.tsx"></code>

## Pattern 2 — Async Generator Pipeline <Badge type="success">SDK-style</Badge>

Wrapping the reader in an async generator (`streamSource`) converts the `ReadableStream`
into an `AsyncIterable`. You then compose independent processing stages — each a generator
that `yield`s to the next — using nested `for await` loops. The result is a clean
separation of concerns: one layer reads, one tracks progress, the consumer accumulates.

The key insight is **cancellation via `break`**: when the consumer loop breaks, JavaScript
calls `.return()` on the generator iterator, which causes every `finally` block up the
chain to run automatically. `reader.releaseLock()` in `streamSource`'s `finally` is
guaranteed to execute without any manual propagation. This pull-based design also provides
natural backpressure — the producer only generates the next chunk when the consumer asks
for it. This is exactly how the [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-python)
streams tokens internally.

<code src="./demos/stream-patterns/pattern2-async-generator.tsx"></code>

## Pattern 3 — Observable <Badge type="warning">Reactive</Badge>

Observable inverts the control flow: instead of the consumer *pulling* chunks, the producer
*pushes* them to subscribers via `observer.next()`. This push-based model enables instant
cancellation — `subscription.unsubscribe()` sets a flag that stops the internal read loop
immediately, without polling an `AbortSignal` between chunks.

The trade-off is the absence of built-in backpressure: the producer pushes as fast as it
can regardless of how quickly observers process each value. For video download this is fine,
but for CPU-intensive per-chunk work (e.g., decoding, hashing) it could cause values to
pile up in observer callbacks before they are processed.

:::info
This demo implements a minimal Observable to show the core mechanics. In production,
use [RxJS](https://rxjs.dev/) — it handles scheduler integration, error boundaries,
multicasting, and a rich operator library (`debounce`, `retry`, `merge`, `switchMap`…).
:::

<code src="./demos/stream-patterns/pattern3-observable.tsx"></code>

## Pattern 4 — Web TransformStream <Badge>Native</Badge>

`TransformStream` is the browser's native answer to processing pipelines. Each stage
implements a `transform(chunk, controller)` method and calls `controller.enqueue(chunk)` to
forward data downstream. Stages connect via `.pipeThrough()`, which also wires up
backpressure automatically: if a downstream reader is slow, the upstream producer is
suspended via the stream's internal queuing strategy.

Unlike the async generator pattern, `TransformStream` is a first-class browser API that
composes natively with `fetch`, Service Workers, and platform streams like
`TextDecoderStream` or `DecompressionStream` — no transpilation needed. Cancellation
propagates through the full chain by calling `reader.cancel()` on the pipeline's terminal
reader.

<code src="./demos/stream-patterns/pattern4-transform-stream.tsx"></code>

## Comparison

|  | `while(true)` | Async Generator | Observable | TransformStream |
|--|:--:|:--:|:--:|:--:|
| **Composable** | ❌ Manual | ✅ Nested generators | ✅ `.pipe()` | ✅ `.pipeThrough()` |
| **Cancellation** | ⚠️ Manual check | ✅ `break` + `finally` | ✅ `unsubscribe()` | ✅ `cancel()` |
| **Backpressure** | ❌ None | ✅ Pull-based | ❌ Push-based | ✅ `highWaterMark` |
| **Error handling** | ⚠️ `try/catch` only | ✅ Propagates via `finally` | ✅ `observer.error` | ✅ Propagates |
| **Complexity** | Low | Medium | High | Medium |
| **Native browser API** | ✅ | ✅ | ❌ Self-implemented | ✅ |

## When to use each

:::info{title="while(true) — Use when"}
Quick scripts, one-shot reads, or debugging `ReadableStream` internals.
No composability needed. The least code for the simplest case.
:::

:::success{title="Async Generator — Use when"}
Building SDKs or libraries (this is how the Anthropic SDK streams internally).
Multi-step processing pipelines where each stage should be independently testable.
Node.js server-side streaming. When natural backpressure matters.
:::

:::warning{title="Observable — Use when"}
Handling UI events (click, scroll, input) with multiple subscribers.
WebSocket or real-time data feeds. When you need operators like `debounce`, `retry`,
`merge`, or `combineLatest` — reach for RxJS rather than rolling your own.
:::

:::info{title="TransformStream — Use when"}
Binary encoding/decoding pipelines (e.g., `TextDecoderStream`, `DecompressionStream`).
Service Workers and the Fetch API. Strict backpressure requirements.
Any context where you want zero dependencies and first-class browser integration.
:::
