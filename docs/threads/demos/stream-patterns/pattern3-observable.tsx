/**
 * title: Pattern 3 — Observable (from scratch)
 * description: Push-based model built from first principles. Instant unsubscribe via a cancellation flag. No backpressure — shows the trade-off vs pull-based patterns.
 * defaultShowCode: false
 */
import React from 'react';

// @ts-ignore — webpack resolves .webm as a URL string
import videoSrc from '../../../assets/4K_19m_Vietnam.webm';
import { DownloadShell } from './shared/DownloadShell';
import type { DownloadFn } from './shared/types';

// ── Minimal Observable implementation ───────────────────────────────────────

interface Observer<T> {
  next: (value: T) => void;
  complete: () => void;
  error: (err: unknown) => void;
}

interface Subscription {
  unsubscribe: () => void;
}

class Observable<T> {
  constructor(private _fn: (obs: Observer<T>) => Subscription) {}

  subscribe(obs: Observer<T>): Subscription {
    return this._fn(obs);
  }

  pipe(op: (src: Observable<T>) => Observable<T>): Observable<T> {
    return op(this);
  }
}

function fromStream(
  stream: ReadableStream<Uint8Array>,
): Observable<Uint8Array> {
  return new Observable<Uint8Array>((observer) => {
    const reader = stream.getReader();
    let cancelled = false;

    (async () => {
      try {
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (cancelled) break;
          if (done) {
            observer.complete();
            break;
          }
          observer.next(value);
        }
      } catch (e) {
        if (!cancelled) observer.error(e);
      } finally {
        try {
          reader.releaseLock();
        } catch (_) {}
      }
    })();

    return {
      unsubscribe() {
        cancelled = true; // ← instant: stops the loop on the next iteration
      },
    };
  });
}

function tap<T>(fn: (value: T) => void) {
  return (source: Observable<T>): Observable<T> =>
    new Observable<T>((observer) =>
      source.subscribe({
        next: (v) => {
          fn(v);
          observer.next(v);
        },
        complete: () => observer.complete(),
        error: (e) => observer.error(e),
      }),
    );
}

// ── Download function ─────────────────────────────────────────────────────

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

  const chunks: Uint8Array[] = [];

  await new Promise<void>((resolve, reject) => {
    const sub = fromStream(res.body!)
      .pipe(
        tap((chunk: Uint8Array) => {
          chunks.push(chunk);
          trackChunk(chunk.byteLength);
        }),
      )
      .subscribe({
        next: () => {},
        complete: resolve,
        error: reject,
      });

    // Bridge AbortSignal → unsubscribe (instant cancellation)
    function onAbort() {
      sub.unsubscribe();
      resolve(); // let caller check signal.aborted
    }

    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });

  if (signal.aborted) return null;
  return new Blob(chunks as unknown as BlobPart[], { type: 'video/webm' });
};

export default function Pattern3Observable() {
  return (
    <DownloadShell
      downloader={download}
      fileUrl={videoSrc as string}
      fileName="4K_Vietnam.webm"
    />
  );
}
