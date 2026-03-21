/**
 * title: Pattern 4 — Web TransformStream
 * description: Native browser API. Compose processing stages with `.pipeThrough()`. Built-in backpressure via `highWaterMark`. Cancellation propagates through the full pipeline.
 * defaultShowCode: false
 */
// @ts-ignore — webpack resolves .webm as a URL string
import videoSrc from '../../../assets/4K_19m_Vietnam.webm';
import React from 'react';
import { DownloadShell } from './shared/DownloadShell';
import type { DownloadFn } from './shared/types';

const download: DownloadFn = async (url, signal, { setTotal, trackChunk, addPhase }) => {
  addPhase('Connecting…');
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const len = Number(res.headers.get('content-length') ?? 0);
  setTotal(len);
  addPhase(`Response received — Content-Length: ${(len / 1_048_576).toFixed(1)} MB`);
  addPhase('Reading chunks…');

  const chunks: Uint8Array[] = [];

  // Stage 1 — track progress, pass chunks through unchanged
  const progressTransform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      trackChunk(chunk.byteLength);
      controller.enqueue(chunk);
    },
  });

  // Stage 2 — accumulate chunks for final blob creation
  const collectTransform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      chunks.push(chunk);
      controller.enqueue(chunk);
    },
  });

  // Chain stages with pipeThrough — backpressure flows automatically
  const pipeline = res.body!
    .pipeThrough(progressTransform)
    .pipeThrough(collectTransform);

  const reader = pipeline.getReader();
  try {
    while (true) {
      if (signal.aborted) {
        await reader.cancel(); // ← propagates cancellation through the full chain
        break;
      }
      const { done } = await reader.read();
      if (done) break;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch (_) {
      // reader may already be released after cancel()
    }
  }

  if (signal.aborted) return null;
  return new Blob(chunks as unknown as BlobPart[], { type: 'video/webm' });
};

export default function Pattern4TransformStream() {
  return (
    <DownloadShell
      downloader={download}
      fileUrl={videoSrc as string}
      fileName="4K_Vietnam.webm"
    />
  );
}
