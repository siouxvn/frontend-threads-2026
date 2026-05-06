/**
 * title: Step 2 — interpolate + useCurrentFrame
 * description: Drive opacity from frame number — the Remotion mental model in 5 lines.
 * defaultShowCode: false
 */
import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

import { PlayerShell } from './shared/player-shell';

const Composition = () => {
  const frame = useCurrentFrame();

  // Frame 0..30 maps linearly to opacity 0..1, then clamps.
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1020',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 120, margin: 0, opacity }}>Remotion</h1>
    </div>
  );
};

export default function Step2Interpolate() {
  return <PlayerShell composition={Composition} />;
}
