// Pre-K (worlds 101/102/103) → continuous obstacle/word/solution adventure
// (NabuAdventure). K-12 → existing RPGOneWordReader.

import { RPGOneWordReader } from "./RPGOneWordReader";
import { NabuAdventure } from "./NabuAdventure";
import { isPreKAdventureWorld } from "@/data/preKAdventures";
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
  if (isPreKAdventureWorld(world.id)) {
    return (
      <NabuAdventure world={world} level={level} onBack={onBack} onComplete={onComplete} />
    );
  }
  return (
    <RPGOneWordReader world={world} level={level} onBack={onBack} onComplete={onComplete} />
  );
};
