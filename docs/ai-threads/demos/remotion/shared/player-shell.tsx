import { Player } from '@remotion/player';
import React from 'react';

import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from './constants';

export interface PlayerShellProps {
  composition: React.ComponentType;
  durationInFrames?: number;
  inputProps?: Record<string, unknown>;
}

export function PlayerShell({
  composition,
  durationInFrames = DURATION_IN_FRAMES,
  inputProps,
}: PlayerShellProps) {
  if (typeof window === 'undefined') return null;

  return (
    <Player
      component={composition}
      durationInFrames={durationInFrames}
      compositionWidth={WIDTH}
      compositionHeight={HEIGHT}
      fps={FPS}
      controls
      loop
      inputProps={inputProps}
      style={{ width: '100%', aspectRatio: `${WIDTH} / ${HEIGHT}` }}
    />
  );
}
