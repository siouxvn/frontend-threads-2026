/**
 * title: Step 4 — Sequencing scenes
 * description: Layer two scenes on one timeline with <Sequence>.
 * defaultShowCode: false
 */
import React from 'react';
import {
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import { DURATION_IN_FRAMES } from './shared/constants';
import { PlayerShell } from './shared/player-shell';

const sceneStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0b1020',
  color: 'white',
  fontFamily: 'system-ui, sans-serif',
};

const SceneA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12 } });
  return (
    <div style={sceneStyle}>
      <h1 style={{ fontSize: 120, margin: 0, transform: `scale(${scale})` }}>
        Remotion
      </h1>
    </div>
  );
};

const SceneB = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14 } });
  return (
    <div style={sceneStyle}>
      <h2
        style={{
          fontSize: 64,
          margin: 0,
          transform: `scale(${scale})`,
          opacity: scale,
        }}
      >
        Build videos with React
      </h2>
    </div>
  );
};

const Composition = () => {
  const halfway = Math.floor(DURATION_IN_FRAMES / 2);
  return (
    <>
      <Sequence from={0} durationInFrames={halfway}>
        <SceneA />
      </Sequence>
      <Sequence from={halfway} durationInFrames={DURATION_IN_FRAMES - halfway}>
        <SceneB />
      </Sequence>
    </>
  );
};

export default function Step4Sequence() {
  return <PlayerShell composition={Composition} />;
}
