import { Button, Progress, Space, Tag, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

import type { DownloadFn, PhaseEntry, Status } from './types';

const { Text } = Typography;

const STATUS_COLOR: Record<Status, string> = {
  idle: 'default',
  connecting: 'processing',
  downloading: 'blue',
  done: 'success',
  cancelled: 'warning',
  error: 'error',
};

interface Props {
  downloader: DownloadFn;
  fileUrl: string;
  fileName?: string;
}

export function DownloadShell({
  downloader,
  fileUrl,
  fileName = 'download',
}: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [received, setReceived] = useState(0);
  const [total, setTotal] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [phases, setPhases] = useState<PhaseEntry[]>([]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const speedBuf = useRef<{ t: number; b: number }[]>([]);
  const startRef = useRef(0);

  useEffect(
    () => () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    },
    [blobUrl],
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
    const elapsedMs =
      speedBuf.current.length > 1 ? now - speedBuf.current[0].t : 1;
    setSpeed((totalB / elapsedMs) * (1000 / 1_048_576));
    setReceived((r) => r + bytes);
  }

  async function handleRun() {
    if (status === 'connecting' || status === 'downloading') return;

    speedBuf.current = [];
    startRef.current = performance.now();
    setReceived(0);
    setTotal(0);
    setSpeed(0);
    setPhases([]);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const { signal } = ctrl;

    setStatus('connecting');

    try {
      const blob = await downloader(fileUrl, signal, {
        setTotal: (n) => {
          setTotal(n);
          setStatus('downloading');
        },
        trackChunk,
        addPhase,
      });

      if (blob === null || signal.aborted) {
        addPhase('Cancelled by user');
        setStatus('cancelled');
      } else {
        setBlobUrl(URL.createObjectURL(blob));
        addPhase(
          `Done — ${(blob.size / 1_048_576).toFixed(1)} MB ready to save`,
        );
        setStatus('done');
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
    setBlobUrl((prev) => {
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
          Run
        </Button>
        <Button danger onClick={handleCancel} disabled={!isRunning}>
          Cancel
        </Button>
        <Button onClick={handleReset}>Reset</Button>
        <Tag color={STATUS_COLOR[status]}>{status}</Tag>
      </Space>

      {status !== 'idle' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress
            percent={pct}
            status={
              status === 'error'
                ? 'exception'
                : status === 'done'
                ? 'success'
                : 'active'
            }
          />
          <Text type="secondary">
            {(received / 1_048_576).toFixed(1)} MB /{' '}
            {(total / 1_048_576).toFixed(1)} MB &nbsp;|&nbsp; {speed.toFixed(1)}{' '}
            MB/s
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

      {blobUrl && (
        <a href={blobUrl} download={fileName}>
          <Button type="primary">
            Save file ({(received / 1_048_576).toFixed(0)} MB)
          </Button>
        </a>
      )}
    </Space>
  );
}
