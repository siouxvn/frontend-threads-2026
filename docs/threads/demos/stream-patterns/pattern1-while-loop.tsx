/**
 * title: Pattern 1 — while(true) Loop
 * description: Simplest approach. Manual cancellation check before each read. The `finally` block ensures the reader lock is always released.
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

  const reader = res.body!.getReader();
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      if (signal.aborted) break;               // ← check before each read
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      trackChunk(value.byteLength);
    }
  } finally {
    reader.releaseLock();                      // ← always release, even on error
  }

  if (signal.aborted) return null;
  return new Blob(chunks as unknown as BlobPart[], { type: 'video/webm' });
};

export default function Pattern1WhileLoop() {
  return (
    <DownloadShell
      downloader={download}
      fileUrl={videoSrc as string}
      fileName="4K_Vietnam.webm"
    />
  );
}
