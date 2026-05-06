import React from 'react';
import { Composition } from 'remotion';

import { Step5Composition } from '../docs/ai-threads/demos/remotion/shared/step5-composition';

// CLI render entry — registers Compositions for `npx remotion render`.
// Each <Composition> below maps to a render id (e.g. "Step5").
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Step5"
        component={Step5Composition}
        durationInFrames={450}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
