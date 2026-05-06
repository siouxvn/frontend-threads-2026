import { loadFont } from '@remotion/google-fonts/Inter';
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const { fontFamily } = loadFont();

const SIOUX_ORANGE = '#f15d03';
const TAGLINE = 'We bring high-tech to life';

// Competences & Markets are taken verbatim from the site's nav menus
// at siouxtechnologies.com — same labels, same order.
const COMPETENCIES = [
  'Embedded Software',
  'Application Software',
  'Mechatronics',
  'Mechanics',
  'Mathware',
  'Electronics',
  'Assembly',
];

const INDUSTRIES = [
  'Semicon',
  'Analytical',
  'Medical',
  'Mobility & Infra',
  'Telecom',
  'Agro & Food',
];

// Beat boundaries (frames @ 30fps)
const B1 = 60; // wordmark reveal ends
const B2 = 150; // tagline reveal ends
const B3 = 290; // competencies cycle ends (7 entries × 20f)
const B4 = 380; // industry pills end
const B5 = 440; // brand wit ends
const B6 = 470; // CTA ends, dedication enters
// 470–530: dedication holds (Sioux 30th anniversary)

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
  const ctaOpacity = win(frame, B5, B6, 8);

  // Dedication — final 60 frames (470–530). Sioux turns 30 in 2026.
  const dedicationOpacity = interpolate(frame, [B6, B6 + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dedicationScale = spring({
    frame: frame - B6,
    fps,
    config: { damping: 14 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: SIOUX_ORANGE,
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

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 22,
          opacity: dedicationOpacity,
          transform: `scale(${dedicationScale})`,
          padding: '0 80px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: -0.5,
            lineHeight: 1.15,
          }}
        >
          Happy 30th anniversary of Sioux.
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 400,
            fontStyle: 'italic',
            opacity: 0.92,
          }}
        >
          From Thinh Kieu, with love.
        </div>
      </div>

      <CornerAccent pos={{ top: 24, left: 24 }} />
      <CornerAccent pos={{ top: 24, right: 24 }} />
      <CornerAccent pos={{ bottom: 24, left: 24 }} />
      <CornerAccent pos={{ bottom: 24, right: 24 }} />
    </div>
  );
};
