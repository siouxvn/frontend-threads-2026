import type { ReactNode } from 'react';

export type Tag =
  | 'curious'
  | 'unsettled'
  | 'relieved'
  | 'uncertain'
  | 'reflective'
  | 'exposed';

export interface Entry {
  /** e.g. "part 1 — why emotions" */
  section: string;
  tag: Tag;
  /** Supports inline React nodes — <em>, highlighted spans, <strong>. */
  body: ReactNode;
  /** e.g. "curious vector: moderately active" */
  vector: string;
}
