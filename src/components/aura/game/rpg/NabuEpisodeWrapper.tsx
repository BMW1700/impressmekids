// Routing:
//   Pre-K worlds (101/102/103):
//     - If the level has a fully-migrated cinematic video script
//       (preKAdventuresVideo.ts) → NabuVideoAdventure (new pure-video loop).
//     - Otherwise → NabuAdventure (legacy emoji/sprite obstacle runner).
//   K-12 → existing RPGOneWordReader.
//
// For K-12 worlds, before mounting the reader we show CustomStoryChooser so
// the player can swap in their own story (parent / teacher / student-authored)
// for that level.

import { useState } from "react";
import { RPGOneWordReader } from "./RPGOneWordReader";
import { NabuAdventure } from "./NabuAdventure";
import { NabuVideoAdventure } from "./NabuVideoAdventure";
import { isPreKAdventureWorld } from "@/data/preKAdventures";
import { hasVideoLevel } from "@/data/preKAdventuresVideo";
import { CustomStoryChooser, type StorySource } from "@/components/customStories/CustomStoryChooser";
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
  // Pre-K: cinematic / legacy paths — never editable, no chooser.
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

  // K-12: show the custom-story chooser, then start the reader with whichever
  // text the player selected. If they pick Default we just pass nothing.
  return <K12LevelWithChooser world={world} level={level} onBack={onBack} onComplete={onComplete} />;
};

const K12LevelWithChooser = ({ world, level, onBack, onComplete }: Props) => {
  const [chooserOpen, setChooserOpen] = useState(true);
  const [source, setSource] = useState<StorySource | null>(null);

  if (!source) {
    return (
      <CustomStoryChooser
        open={chooserOpen}
        onOpenChange={(open) => {
          if (!open) {
            setChooserOpen(false);
            // Closing the chooser without picking = treat as default + go back.
            onBack();
          }
        }}
        target={{ kind: "rpg_level", worldId: world.id, levelId: level.id }}
        levelLabel={`${world.title} · Level ${level.id}`}
        defaultStoryLabel="Built-in story"
        onConfirm={(s) => {
          setSource(s);
          setChooserOpen(false);
        }}
      />
    );
  }

  const override = source.kind === "custom"
    ? { overrideText: source.story.body, overrideTitle: source.story.title }
    : {};

  return (
    <RPGOneWordReader
      world={world}
      level={level}
      onBack={onBack}
      onComplete={onComplete}
      {...override}
    />
  );
};
