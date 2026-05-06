import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

const MONO_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

const TOKEN = {
  keyword:
    /\b(const|let|var|return|import|from|export|default|function|if|else|true|false|null|undefined)\b/g,
  string: /(['"`])(?:(?=(\\?))\2.)*?\1/g,
  comment: /(\/\/[^\n]*)/g,
  number: /\b\d+(\.\d+)?\b/g,
  builtin:
    /\b(useCurrentFrame|useVideoConfig|interpolate|spring|Sequence|TransitionSeries)\b/g,
  jsxTag: /(<\/?[A-Za-z][A-Za-z0-9]*)/g,
};

type Style = React.CSSProperties;

const colors = {
  base: '#c9d1d9',
  keyword: '#79c0ff',
  string: '#ffa657',
  comment: '#8b949e',
  number: '#d2a8ff',
  builtin: '#7ee787',
  jsxTag: '#ff7b72',
};

// Wrap matches of `regex` in <span> with the given color.
// Returns an array of React nodes (strings + spans).
function highlight(text: string): React.ReactNode[] {
  // Build a list of [start, end, color] segments. First match wins per index.
  const claimed = new Array<string | null>(text.length).fill(null);
  const passes: Array<[RegExp, string]> = [
    [TOKEN.comment, colors.comment],
    [TOKEN.string, colors.string],
    [TOKEN.keyword, colors.keyword],
    [TOKEN.builtin, colors.builtin],
    [TOKEN.jsxTag, colors.jsxTag],
    [TOKEN.number, colors.number],
  ];
  for (const [re, color] of passes) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      for (let i = m.index; i < m.index + m[0].length; i++) {
        if (claimed[i] === null) claimed[i] = color;
      }
    }
  }
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const color = claimed[i];
    let j = i;
    while (j < text.length && claimed[j] === color) j++;
    const chunk = text.slice(i, j);
    if (color) nodes.push(<span style={{ color }}>{chunk}</span>);
    else nodes.push(chunk);
    i = j;
  }
  return nodes;
}

export interface CodeTypewriterProps {
  source: string;
  startFrame?: number;
  endFrame: number;
  fontSize?: number;
  showLineNumbers?: boolean;
  style?: Style;
}

export function CodeTypewriter({
  source,
  startFrame = 0,
  endFrame,
  fontSize = 22,
  showLineNumbers = true,
  style,
}: CodeTypewriterProps) {
  const frame = useCurrentFrame();
  const charsRevealed = Math.floor(
    interpolate(frame, [startFrame, endFrame], [0, source.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const visible = source.slice(0, charsRevealed);
  const isTyping = frame >= startFrame && frame < endFrame;
  const caretVisible = isTyping ? frame % 30 < 15 : false;
  const lines = visible.split('\n');

  return (
    <pre
      style={{
        margin: 0,
        padding: '32px 28px',
        fontFamily: MONO_STACK,
        fontSize,
        lineHeight: 1.55,
        color: colors.base,
        background: '#0d1117',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        whiteSpace: 'pre',
        ...style,
      }}
    >
      <code style={{ fontFamily: MONO_STACK }}>
        {lines.map((line, idx) => (
          <div key={idx} style={{ display: 'flex' }}>
            {showLineNumbers && (
              <span
                style={{
                  color: '#484f58',
                  width: '2.5em',
                  textAlign: 'right',
                  paddingRight: '1em',
                  userSelect: 'none',
                }}
              >
                {idx + 1}
              </span>
            )}
            <span style={{ flex: 1 }}>
              {highlight(line)}
              {idx === lines.length - 1 && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '0.55em',
                    height: '1em',
                    background: caretVisible ? colors.base : 'transparent',
                    verticalAlign: 'text-bottom',
                    marginLeft: 1,
                  }}
                />
              )}
            </span>
          </div>
        ))}
      </code>
    </pre>
  );
}
