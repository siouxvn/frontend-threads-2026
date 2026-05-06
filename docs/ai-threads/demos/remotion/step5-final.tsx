/**
 * title: Step 5 — Code as a frame-function
 * description: Split-screen final cut. Left side types the source code; right side renders what it describes. Both are functions of the current frame.
 * defaultShowCode: false
 */
import React from 'react';

import { PlayerShell } from './shared/player-shell';
import { Step5Composition } from './shared/step5-composition';

export default function Step5Final() {
  return <PlayerShell composition={Step5Composition} />;
}
