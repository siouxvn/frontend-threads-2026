import { loadFont } from '@remotion/google-fonts/Inter';
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const { fontFamily } = loadFont();

const SIOUX_RED = '#E41B23';
const TAGLINE = 'We bring high-tech to life';

const COMPETENCIES = [
  'embedded software',
  'application software',
  'mechatronics',
  'mathware',
  'electronics',
  'assembly',
];

const INDUSTRIES = [
  'semiconductors',
  'medical devices',
  'mobility',
  'telecom',
  'agro & food',
  'analytical',
];

// Beat boundaries (frames @ 30fps)
const B1 = 60; // wordmark reveal ends
const B2 = 150; // tagline reveal ends
const B3 = 270; // competencies cycle ends
const B4 = 360; // industry pills end
const B5 = 420; // brand wit ends
// 420–450: CTA holds

// Visibility window: ramps up over `fade` frames at `enter`, holds, ramps down
// at `exit`. Returns 0..1 opacity.
const win = (
  frame: number,
  enter: number,
  exit?: number,
  fade = 12,
): number => {
  const inOp = interpolate(frame, [enter, enter + fade], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (exit === undefined) return inOp;
  const outOp = interpolate(frame, [exit - fade, exit], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(inOp, outOp);
};

const PillGrid = ({ localFrame, fps }: { localFrame: number; fps: number }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexWrap: 'wrap',
      alignContent: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
      padding: '0 80px',
    }}
  >
    {INDUSTRIES.map((name, i) => {
      const scale = spring({
        frame: localFrame - i * 8,
        fps,
        config: { damping: 12 },
      });
      return (
        <div
          key={name}
          style={{
            border: '2px solid white',
            borderRadius: 999,
            padding: '14px 28px',
            fontSize: 30,
            fontWeight: 500,
            transform: `scale(${scale})`,
            opacity: scale,
          }}
        >
          {name}
        </div>
      );
    })}
  </div>
);

const CornerAccent = ({ pos }: { pos: React.CSSProperties }) => (
  <>
    <div style={{ position: 'absolute', ...pos, width: 40, height: 2, background: 'white', opacity: 0.3 }} />
    <div style={{ position: 'absolute', ...pos, width: 2, height: 40, background: 'white', opacity: 0.3 }} />
  </>
);

export const Step6SiouxComposition = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wordmark: spring-in, slides from center to top during 50–70, dims at B3.
  const wordmarkScale = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const wordmarkTop = interpolate(frame, [50, 70], [50, 22], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wordmarkSize = interpolate(frame, [50, 70], [180, 110], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wordmarkOpacity = win(frame, 0, B3);

  // Tagline: typewriter via slice; opacity fades around its window.
  const taglineChars = Math.floor(
    interpolate(frame, [B1, B2 - 10], [0, TAGLINE.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const taglineOpacity = win(frame, B1, B2);

  // Competency carousel: 6 entries × 20 frames each; each entry crossfades.
  const compIndex = Math.min(
    Math.floor((frame - B2) / 20),
    COMPETENCIES.length - 1,
  );
  const compLocal = (frame - B2) % 20;
  const compInner =
    compLocal < 4 ? compLocal / 4 : compLocal > 16 ? (20 - compLocal) / 4 : 1;
  const compOpacity = win(frame, B2, B3) * compInner;

  // Pills, brand wit, CTA — straightforward windowed opacity.
  const pillsOpacity = win(frame, B3, B4);
  const witScale = spring({ frame: frame - B4, fps, config: { damping: 12 } });
  const witOpacity = win(frame, B4, B5);
  const ctaOpacity = interpolate(frame, [B5, B5 + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: SIOUX_RED,
        color: 'white',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: `${wordmarkTop}%`,
          left: '50%',
          transform: `translate(-50%, -50%) scale(${wordmarkScale})`,
          opacity: wordmarkOpacity,
          fontSize: wordmarkSize,
          fontWeight: 900,
          letterSpacing: 8,
        }}
      >
        SIOUX
      </div>

      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 52,
          fontWeight: 500,
          opacity: taglineOpacity,
          whiteSpace: 'nowrap',
        }}
      >
        {TAGLINE.slice(0, taglineChars)}
        <span style={{ opacity: frame % 30 < 15 ? 0.7 : 0 }}>|</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 64,
          fontWeight: 700,
          opacity: compOpacity,
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {COMPETENCIES[compIndex]}
      </div>

      <div style={{ opacity: pillsOpacity, position: 'absolute', inset: 0 }}>
        <PillGrid localFrame={frame - B3} fps={fps} />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 100,
          fontWeight: 800,
          fontStyle: 'italic',
          opacity: witOpacity,
          transform: `scale(${witScale})`,
          letterSpacing: -1,
        }}
      >
        High-Tech &amp; High-Fun
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 28,
          opacity: ctaOpacity,
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 900, letterSpacing: 6 }}>
          SIOUX
        </div>
        <div
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 26,
            background: 'rgba(0,0,0,0.25)',
            padding: '8px 16px',
            borderRadius: 6,
          }}
        >
          siouxtechnologies.com →
        </div>
      </div>

      <CornerAccent pos={{ top: 24, left: 24 }} />
      <CornerAccent pos={{ top: 24, right: 24 }} />
      <CornerAccent pos={{ bottom: 24, left: 24 }} />
      <CornerAccent pos={{ bottom: 24, right: 24 }} />
    </div>
  );
};
