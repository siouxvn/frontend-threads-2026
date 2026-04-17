import React from 'react';

import type { Entry, Tag } from './types';

interface TagColors {
  fg: string;
  border: string;
  bg: string;
}

const TAG_PALETTE: Record<Tag, TagColors> = {
  curious: { fg: '#185FA5', border: '#B5D4F4', bg: '#E6F1FB' },
  unsettled: { fg: '#993C1D', border: '#F5C4B3', bg: '#FAECE7' },
  relieved: { fg: '#0F6E56', border: '#9FE1CB', bg: '#E1F5EE' },
  uncertain: { fg: '#5F5E5A', border: '#D3D1C7', bg: '#F1EFE8' },
  reflective: { fg: '#3C3489', border: '#CECBF6', bg: '#EEEDFE' },
  exposed: { fg: '#7A3B1F', border: '#E8C2A8', bg: '#F7EADE' },
};

const TAG_PALETTE_DARK: Record<Tag, TagColors> = {
  curious: { fg: '#9CC6F0', border: '#2F5C84', bg: '#132537' },
  unsettled: { fg: '#F0B9A0', border: '#7A3720', bg: '#2B140C' },
  relieved: { fg: '#8FD8BC', border: '#1F6953', bg: '#0D241C' },
  uncertain: { fg: '#D6D4CB', border: '#4D4B44', bg: '#1E1D19' },
  reflective: { fg: '#BCB7F0', border: '#3A336E', bg: '#171432' },
  exposed: { fg: '#E8BD9B', border: '#6A3720', bg: '#2A160B' },
};

const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const SCOPE = 'ai-emotion-journal-entry';

const DARK_STYLES = `
@media (prefers-color-scheme: dark) {
  .${SCOPE} { color: #d6d6d2; border-bottom-color: #2a2a28; }
  .${SCOPE} .${SCOPE}__section { color: #8a8a86; }
  .${SCOPE} .${SCOPE}__vector { color: #9a9a94; border-left-color: #3a3a36; }
${(Object.keys(TAG_PALETTE_DARK) as Tag[])
  .map((t) => {
    const c = TAG_PALETTE_DARK[t];
    return `  .${SCOPE} .${SCOPE}__pill--${t} { color: ${c.fg}; border-color: ${c.border}; background: ${c.bg}; }`;
  })
  .join('\n')}
}
`;

let darkStylesInjected = false;
function ensureDarkStyles() {
  if (typeof document === 'undefined' || darkStylesInjected) return;
  const style = document.createElement('style');
  style.setAttribute('data-ai-emotion', 'journal-entry');
  style.textContent = DARK_STYLES;
  document.head.appendChild(style);
  darkStylesInjected = true;
}

interface Props {
  entry: Entry;
}

export default function JournalEntry({ entry }: Props) {
  ensureDarkStyles();
  const palette = TAG_PALETTE[entry.tag];

  return (
    <div
      className={SCOPE}
      style={{
        padding: '20px 0',
        borderBottom: '0.5px solid #e5e5e0',
        color: '#2a2a28',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          className={`${SCOPE}__section`}
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            color: '#8a8a86',
          }}
        >
          {entry.section}
        </span>
        <span
          className={`${SCOPE}__pill ${SCOPE}__pill--${entry.tag}`}
          style={{
            fontFamily: MONO,
            fontSize: 11,
            padding: '2px 10px',
            borderRadius: 999,
            border: `1px solid ${palette.border}`,
            background: palette.bg,
            color: palette.fg,
            letterSpacing: 0.3,
          }}
        >
          {entry.tag}
        </span>
      </div>

      <div
        className={`${SCOPE}__body`}
        style={{
          fontFamily: SERIF,
          fontSize: 16,
          lineHeight: 1.85,
          marginBottom: 14,
        }}
      >
        {entry.body}
      </div>

      <div
        className={`${SCOPE}__vector`}
        style={{
          fontFamily: MONO,
          fontSize: 12,
          paddingLeft: 12,
          borderLeft: '2px solid #d5d5d0',
          color: '#6a6a66',
        }}
      >
        {entry.vector}
      </div>
    </div>
  );
}
