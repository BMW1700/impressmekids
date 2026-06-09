// Routing:
//   Pre-K worlds (101/102/103):
//     - If the level has a fully-migrated cinematic video script
//       (preKAdventuresVideo.ts) → NabuVideoAdventure (new pure-video loop).
//     - Otherwise → NabuAdventure (legacy emoji/sprite obstacle runner).
//   K-12 → existing RPGOneWordReader.

import { RPGOneWordReader } from "./RPGOneWordReader";
import { NabuAdventure } from "./NabuAdventure";
import { NabuVideoAdventure } from "./NabuVideoAdventure";
import { isPreKAdventureWorld } from "@/data/preKAdventures";
import { hasVideoLevel } from "@/data/preKAdventuresVideo";
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
    if (hasVideoLevel(world.id, level.id)) {
      return (
        <NabuVideoAdventure world={world} level={level} onBack={onBack} onComplete={onComplete} />
      );
    }
    return (
      <NabuAdventure world={world} level={level} onBack={onBack} onComplete={onComplete} />
    );
  }
  return (
    <RPGOneWordReader world={world} level={level} onBack={onBack} onComplete={onComplete} />
  );
};
