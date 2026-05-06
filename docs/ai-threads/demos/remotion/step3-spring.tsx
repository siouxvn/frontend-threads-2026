/**
 * title: Step 3 — Spring physics
 * description: Replace a linear interpolate with spring() for natural, frame-rate-independent motion.
 * defaultShowCode: false
 */
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { PlayerShell } from './shared/player-shell';

const Composition = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // spring() returns 0..1 on a physical curve.
  // Use it as a scale driver — title bounces in instead of fading.
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.6 },
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
      <h1
        style={{
          fontSize: 120,
          margin: 0,
          transform: `scale(${scale})`,
        }}
      >
        Remotion
      </h1>
    </div>
  );
};

export default function Step3Spring() {
  return <PlayerShell composition={Composition} />;
}
