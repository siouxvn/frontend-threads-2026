export type Status =
  | 'idle'
  | 'connecting'
  | 'downloading'
  | 'done'
  | 'cancelled'
  | 'error';

export interface PhaseEntry {
  elapsed: number;
  message: string;
}

export interface ProgressCallbacks {
  /** Set the total expected bytes (transitions UI to 'downloading'). */
  setTotal: (bytes: number) => void;
  /** Record bytes received in this chunk for speed and progress tracking. */
  trackChunk: (bytes: number) => void;
  /** Append a timestamped message to the phase log. */
  addPhase: (message: string) => void;
}

/**
 * Streams a file from `url` and returns the completed Blob,
 * or null if the download was cancelled via `signal`.
 * Should throw on non-abort errors.
 */
export type DownloadFn = (
  url: string,
  signal: AbortSignal,
  cb: ProgressCallbacks,
) => Promise<Blob | null>;
