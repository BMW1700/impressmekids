// Pre-K: the story now lives INSIDE the level (see NabuPreKStoryScene which
// the reader renders in place of the battle row). No before/after overlays —
// each correct word IS the story beat. This wrapper is now a thin pass-through
// kept for API compatibility with AuraPractice.

import { RPGOneWordReader } from "./RPGOneWordReader";
import type { CampaignWorld } from "@/lib/campaignData";
import type { CampaignLevel } from "./RPGLevelSelect";

interface CompleteStats {
  wordsRead: number;
  correctWords: number;
  stars: number;
}

interface Props {
  world: CampaignWorld;
  level: CampaignLevel;
  onBack: () => void;
  onComplete: (stats: CompleteStats) => void;
}

export const NabuEpisodeWrapper = ({ world, level, onBack, onComplete }: Props) => {
  return (
    <RPGOneWordReader
      world={world}
      level={level}
      onBack={onBack}
      onComplete={onComplete}
    />
  );
};
