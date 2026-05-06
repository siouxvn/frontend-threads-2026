/**
 * title: Step 5 — Final cut
 * description: Combine spring + sequencing + transitions + a Google Font into a polished intro.
 * defaultShowCode: false
 */
import { loadFont } from '@remotion/google-fonts/Inter';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { DURATION_IN_FRAMES } from './shared/constants';
import { PlayerShell } from './shared/player-shell';

const { fontFamily } = loadFont();

const GRADIENT =
  'linear-gradient(135deg, #0b1020 0%, #1b2a6b 50%, #00b4ff 100%)';

const sceneStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: GRADIENT,
  color: 'white',
  fontFamily,
};

const SceneA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.6 },
  });
  return (
    <div style={sceneStyle}>
      <h1
        style={{
          fontSize: 140,
          margin: 0,
          fontWeight: 800,
          letterSpacing: -2,
          transform: `scale(${scale})`,
        }}
      >
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
          fontWeight: 600,
          opacity: scale,
          transform: `translateY(${(1 - scale) * 20}px)`,
        }}
      >
        Build videos with React
      </h2>
    </div>
  );
};

const FADE_FRAMES = 20;
const FIRST_HALF = Math.floor(DURATION_IN_FRAMES / 2);
const SECOND_HALF = DURATION_IN_FRAMES - FIRST_HALF + FADE_FRAMES;

const Composition = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={FIRST_HALF}>
        <SceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={SECOND_HALF}>
        <SceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export default function Step5Final() {
  return <PlayerShell composition={Composition} />;
}
