// Wraps RPGOneWordReader with a story shell for Pre-K: opening problem from
// Nabu the Owl → existing reader → celebration. The reader itself, mic,
// speech recognition, scoring, stars, and unlock thresholds are untouched.

import { useState, useCallback } from "react";
import { RPGOneWordReader } from "./RPGOneWordReader";
import { NabuEpisodeIntroOverlay } from "./NabuEpisodeIntroOverlay";
import { NabuEpisodeOutroOverlay } from "./NabuEpisodeOutroOverlay";
import {
  getEpisodeOpening,
  getEpisodeCelebration,
  isNabuPreKWorld,
} from "@/lib/nabuStoryCopy";
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
  const isPreK = isNabuPreKWorld(world.id);
  const intro = isPreK ? getEpisodeOpening(world.id, level.id) : null;
  const outro = isPreK ? getEpisodeCelebration(world.id, level.id) : null;

  type Phase = "intro" | "play" | "outro";
  // If anything is missing or this isn't Pre-K, skip the shell entirely.
  const [phase, setPhase] = useState<Phase>(intro && outro ? "intro" : "play");
  const [pendingStats, setPendingStats] = useState<CompleteStats | null>(null);

  const handleReaderComplete = useCallback(
    (stats: CompleteStats) => {
      if (isPreK && outro) {
        setPendingStats(stats);
        setPhase("outro");
      } else {
        onComplete(stats);
      }
    },
    [isPreK, outro, onComplete]
  );

  const finish = useCallback(() => {
    if (pendingStats) onComplete(pendingStats);
  }, [pendingStats, onComplete]);

  return (
    <div className="relative h-full w-full">
      <RPGOneWordReader
        world={world}
        level={level}
        onBack={onBack}
        onComplete={handleReaderComplete}
      />
      {phase === "intro" && intro && (
        <NabuEpisodeIntroOverlay intro={intro} worldId={world.id} onStart={() => setPhase("play")} />
      )}
      {phase === "outro" && outro && (
        <NabuEpisodeOutroOverlay outro={outro} onContinue={finish} />
      )}
    </div>
  );
};
