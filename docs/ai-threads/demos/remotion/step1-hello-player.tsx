/**
 * title: Step 1 — Hello, Player
 * description: A static Composition mounted inside <Player>. No animation yet.
 * defaultShowCode: false
 */
import React from 'react';

import { PlayerShell } from './shared/player-shell';

const Composition = () => {
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
      <h1 style={{ fontSize: 120, margin: 0 }}>Remotion</h1>
    </div>
  );
};

export default function Step1HelloPlayer() {
  return <PlayerShell composition={Composition} />;
}
