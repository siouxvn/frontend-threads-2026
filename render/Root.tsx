import React from 'react';
import { Composition } from 'remotion';

import { Step5Composition } from '../docs/ai-threads/demos/remotion/shared/step5-composition';
import { Step6SiouxComposition } from '../docs/ai-threads/demos/remotion/shared/step6-sioux-composition';

// CLI render entry — registers Compositions for `npx remotion render`.
// Each <Composition> below maps to a render id (e.g. "Step5", "Step6Sioux").
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
      <Composition
        id="Step6Sioux"
        component={Step6SiouxComposition}
        durationInFrames={510}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
