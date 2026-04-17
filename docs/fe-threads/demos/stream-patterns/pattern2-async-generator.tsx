/**
 * title: Pattern 2 — Async Generator Pipeline
 * description: Three composable generator layers. Pull-based backpressure. `break` in the consumer propagates cleanup through every `finally` block up the chain.
 * defaultShowCode: false
 */
import React from 'react';

import { publicAsset } from './shared/asset-url';
import { DownloadShell } from './shared/DownloadShell';
import type { DownloadFn } from './shared/types';

// Served from docs/public/assets/ — bypasses the bundler (file is 1.8GB).
const videoSrc = publicAsset('/4K_19m_Vietnam.webm');

const download: DownloadFn = async (
  url,
  signal,
  { setTotal, trackChunk, addPhase },
) => {
  addPhase('Connecting…');
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const len = Number(res.headers.get('content-length') ?? 0);
  setTotal(len);
  addPhase(
    `Response received — Content-Length: ${(len / 1_048_576).toFixed(1)} MB`,
  );
  addPhase('Reading chunks…');

  // Layer 1 — wraps ReadableStream as an AsyncIterable
  const streamSource = async function* (stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock(); // ← runs when consumer breaks, even mid-read
    }
  };

  // Layer 2 — tracks progress, passes chunks through unchanged
  const withProgress = async function* (source: AsyncIterable<Uint8Array>) {
    for await (const chunk of source) {
      trackChunk(chunk.byteLength);
      yield chunk;
    }
  };

  // Consumer — accumulates chunks; `break` propagates cleanup up through all layers
  const chunks: Uint8Array[] = [];
  for await (const chunk of withProgress(streamSource(res.body!))) {
    if (signal.aborted) break;
    chunks.push(chunk);
  }

  if (signal.aborted) return null;
  return new Blob(chunks as unknown as BlobPart[], { type: 'video/webm' });
};

export default function Pattern2AsyncGenerator() {
  return (
    <DownloadShell
      downloader={download}
      fileUrl={videoSrc as string}
      fileName="4K_Vietnam.webm"
    />
  );
}
