/**
 * title: Step 6 — Sioux brand intro (LLM-generated)
 * description: A 15-second Sioux Technologies brand intro reel — produced from the prompt template above and rendered as MP4 via the same render entry as step 5.
 * defaultShowCode: false
 */
import React from 'react';

import { PlayerShell } from './shared/player-shell';
import { Step6SiouxComposition } from './shared/step6-sioux-composition';

export default function Step6SiouxIntro() {
  return <PlayerShell composition={Step6SiouxComposition} durationInFrames={530} />;
}
