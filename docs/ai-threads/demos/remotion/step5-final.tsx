/**
 * title: Step 5 — Code as a frame-function
 * description: Split-screen final cut. Left side types the source code; right side renders what it describes. Both are functions of the current frame.
 * defaultShowCode: false
 */
import { loadFont } from '@remotion/google-fonts/Inter';
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

import { CodeTypewriter } from './shared/code-typewriter';
import { PlayerShell } from './shared/player-shell';

const { fontFamily } = loadFont();

const SOURCE = `import { spring, useCurrentFrame } from 'remotion';

const Title = () => {
  const frame = useCurrentFrame();
  const scale = spring({
    frame,
    fps: 30,
    config: { damping: 12 },
  });
  return (
    <h1 style={{ transform: \`scale(\${scale})\` }}>
      Remotion
    </h1>
  );
};`;

const TYPE_END = 130;
const TITLE_IN = 130;
const TAGLINE_IN = 220;
const CTA_IN = 340;

const Dot = ({ opacity }: { opacity: number }) => (
  <span
    style={{
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: 'white',
      opacity,
    }}
  />
);

const RightPanel = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient hue shifts subtly through the reel.
  const hue = interpolate(frame, [0, 450], [220, 280], {
    extrapolateRight: 'clamp',
  });
  const background = `linear-gradient(135deg,
    hsl(${hue}, 70%, 14%) 0%,
    hsl(${hue + 20}, 65%, 28%) 60%,
    hsl(${hue + 40}, 75%, 50%) 100%)`;

  // "Compiling..." dot pulse while code is still typing.
  const compileFrame = frame;
  const dot1 = (Math.sin(compileFrame * 0.3) + 1) / 2;
  const dot2 = (Math.sin(compileFrame * 0.3 - 1) + 1) / 2;
  const dot3 = (Math.sin(compileFrame * 0.3 - 2) + 1) / 2;

  // Title — springs in after typing finishes.
  const titleScale = spring({
    frame: frame - TITLE_IN,
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.6 },
  });

  // Tagline — fades + lifts after title is seated.
  const taglineProgress = spring({
    frame: frame - TAGLINE_IN,
    fps,
    config: { damping: 14 },
  });

  // CTA — gentle fade-in.
  const ctaOpacity = interpolate(frame, [CTA_IN, CTA_IN + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Camera-like zoom on the whole right group from frame 280 onwards.
  const cameraScale = interpolate(frame, [280, 380], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const compiling = frame < TITLE_IN;

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        background,
        color: 'white',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      {compiling && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 12,
            opacity: 0.5,
          }}
        >
          <Dot opacity={dot1} />
          <Dot opacity={dot2} />
          <Dot opacity={dot3} />
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          transform: `scale(${cameraScale})`,
          opacity: compiling ? 0 : 1,
        }}
      >
        <h1
          style={{
            fontSize: 96,
            margin: 0,
            fontWeight: 800,
            letterSpacing: -2,
            transform: `scale(${titleScale})`,
          }}
        >
          Remotion
        </h1>
        <h2
          style={{
            fontSize: 32,
            margin: 0,
            fontWeight: 500,
            opacity: taglineProgress,
            transform: `translateY(${(1 - taglineProgress) * 20}px)`,
          }}
        >
          Build videos with React
        </h2>
        <div
          style={{
            marginTop: 24,
            fontSize: 22,
            opacity: ctaOpacity,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            background: 'rgba(0,0,0,0.25)',
            padding: '8px 16px',
            borderRadius: 6,
          }}
        >
          remotion.dev →
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 24,
          fontSize: 14,
          opacity: 0.45,
          letterSpacing: 1,
        }}
      >
        powered by Remotion
      </div>
    </div>
  );
};

const Composition = () => {
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <div style={{ flex: 1, height: '100%' }}>
        <CodeTypewriter source={SOURCE} startFrame={0} endFrame={TYPE_END} />
      </div>
      <div style={{ flex: 1, height: '100%' }}>
        <RightPanel />
      </div>
    </div>
  );
};

export default function Step5Final() {
  return <PlayerShell composition={Composition} />;
}
