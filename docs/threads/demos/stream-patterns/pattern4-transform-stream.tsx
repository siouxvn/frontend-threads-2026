/**
 * title: Pattern 4 — Web TransformStream
 * description: Native browser API. Compose processing stages with `.pipeThrough()`. Built-in backpressure via `highWaterMark`. Cancellation propagates through the full pipeline.
 * defaultShowCode: true
 */
import { Button, Progress, Space, Tag, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore — webpack resolves .webm as a URL string
import videoSrc from '../../../assets/4K_19m_Vietnam.webm';

const { Text } = Typography;

type Status = 'idle' | 'connecting' | 'downloading' | 'done' | 'cancelled' | 'error';

interface PhaseEntry {
  elapsed: number;
  message: string;
}

const STATUS_COLOR: Record<Status, string> = {
  idle: 'default',
  connecting: 'processing',
  downloading: 'blue',
  done: 'success',
  cancelled: 'warning',
  error: 'error',
};

export default function Pattern4TransformStream() {
  const [status, setStatus] = useState<Status>('idle');
  const [received, setReceived] = useState(0);
  const [total, setTotal] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [phases, setPhases] = useState<PhaseEntry[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const speedBuf = useRef<{ t: number; b: number }[]>([]);
  const startRef = useRef(0);

  useEffect(
    () => () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    },
    [videoUrl],
  );

  function addPhase(message: string) {
    const elapsed = Math.round(performance.now() - startRef.current);
    setPhases((p) => [...p, { elapsed, message }]);
  }

  function trackChunk(bytes: number) {
    const now = performance.now();
    speedBuf.current.push({ t: now, b: bytes });
    speedBuf.current = speedBuf.current.filter((e) => now - e.t < 500);
    const totalB = speedBuf.current.reduce((s, e) => s + e.b, 0);
    const elapsedMs = speedBuf.current.length > 1 ? now - speedBuf.current[0].t : 1;
    setSpeed((totalB / elapsedMs) * (1000 / 1_048_576));
    setReceived((r) => r + bytes);
  }

  function finalize(chunks: Uint8Array[]) {
    const blob = new Blob(chunks as unknown as BlobPart[], { type: 'video/webm' });
    setVideoUrl(URL.createObjectURL(blob));
    addPhase('Done — blob created, video ready');
    setStatus('done');
  }

  async function handleRun() {
    if (status === 'connecting' || status === 'downloading') return;

    speedBuf.current = [];
    startRef.current = performance.now();
    setReceived(0);
    setTotal(0);
    setSpeed(0);
    setPhases([]);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const { signal } = ctrl;

    setStatus('connecting');
    addPhase('Connecting…');

    try {
      const res = await fetch(videoSrc as string, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const len = Number(res.headers.get('content-length') ?? 0);
      setTotal(len);
      addPhase(`Response received — Content-Length: ${(len / 1_048_576).toFixed(1)} MB`);
      setStatus('downloading');
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

      if (signal.aborted) {
        addPhase('Cancelled by user');
        setStatus('cancelled');
      } else {
        finalize(chunks);
      }
    } catch (e: any) {
      if (signal.aborted || e?.name === 'AbortError') {
        addPhase('Cancelled by user');
        setStatus('cancelled');
      } else {
        addPhase(`Error: ${e?.message ?? 'Unknown error'}`);
        setStatus('error');
      }
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  function handleReset() {
    abortRef.current?.abort();
    speedBuf.current = [];
    setStatus('idle');
    setReceived(0);
    setTotal(0);
    setSpeed(0);
    setPhases([]);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  const pct = total > 0 ? Math.round((received / total) * 100) : 0;
  const isRunning = status === 'connecting' || status === 'downloading';

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        <Button type="primary" onClick={handleRun} disabled={isRunning}>
          ▶ Run
        </Button>
        <Button danger onClick={handleCancel} disabled={!isRunning}>
          ⏹ Cancel
        </Button>
        <Button onClick={handleReset}>↺ Reset</Button>
        <Tag color={STATUS_COLOR[status]}>{status}</Tag>
      </Space>

      {status !== 'idle' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress
            percent={pct}
            status={
              status === 'error' ? 'exception' : status === 'done' ? 'success' : 'active'
            }
          />
          <Text type="secondary">
            {(received / 1_048_576).toFixed(1)} MB / {(total / 1_048_576).toFixed(1)} MB
            &nbsp;|&nbsp; {speed.toFixed(1)} MB/s
          </Text>
        </Space>
      )}

      {phases.length > 0 && (
        <div
          style={{
            background: '#f6f8fa',
            borderRadius: 6,
            padding: '8px 12px',
            fontFamily: 'monospace',
            fontSize: 12,
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {phases.map((p, i) => (
            <div key={i}>
              <span style={{ color: '#888' }}>[{p.elapsed}ms]</span> {p.message}
            </div>
          ))}
        </div>
      )}

      {videoUrl && (
        <video
          controls
          autoPlay
          src={videoUrl}
          style={{ width: '100%', maxHeight: 360, borderRadius: 6 }}
        />
      )}
    </Space>
  );
}
