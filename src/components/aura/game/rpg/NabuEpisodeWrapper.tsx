// Routing:
//   Pre-K worlds (101/102/103):
//     - First we try to load a DB-backed level (admin-authored content). If
//       the DB returns a complete level with all videos, we render that.
//     - Otherwise, if the hardcoded video script exists, we render that.
//     - Otherwise → NabuAdventure (legacy emoji/sprite obstacle runner).
//   K-12 → existing RPGOneWordReader.
//
// For K-12 worlds, before mounting the reader we show CustomStoryChooser so
// the player can swap in their own story (parent / teacher / student-authored)
// for that level.

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { RPGOneWordReader } from "./RPGOneWordReader";
import { NabuAdventure } from "./NabuAdventure";
import { NabuVideoAdventure } from "./NabuVideoAdventure";
import { isPreKAdventureWorld } from "@/data/preKAdventures";
import { hasVideoLevel } from "@/data/preKAdventuresVideo";
import { usePreKVideoLevel } from "@/lib/preKLevelFromDb";
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
  // Pre-K: try DB → hardcoded video script → legacy obstacle runner.
  if (world.mode === 'prek' || isPreKAdventureWorld(world.id)) {
    return <PreKEpisodeRouter world={world} level={level} onBack={onBack} onComplete={onComplete} />;
  }

  // K-12: show the custom-story chooser, then start the reader with whichever
  // text the player selected. If they pick Default we just pass nothing.
  return <K12LevelWithChooser world={world} level={level} onBack={onBack} onComplete={onComplete} />;
};

const PreKEpisodeRouter = ({ world, level, onBack, onComplete }: Props) => {
  const levelNumber = typeof level.id === "number" ? level.id : Number(level.id);
  const { level: dbLevel, dbLevelId, loading } = usePreKVideoLevel(world.id, levelNumber);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (dbLevel) {
    return (
      <NabuVideoAdventure
        world={world}
        level={level}
        onBack={onBack}
        onComplete={onComplete}
        overrideLevel={dbLevel}
        dbLevelId={dbLevelId}
      />
    );
  }

  if (hasVideoLevel(world.id, level.id)) {
    return <NabuVideoAdventure world={world} level={level} onBack={onBack} onComplete={onComplete} />;
  }

  return <NabuAdventure world={world} level={level} onBack={onBack} onComplete={onComplete} />;
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
        levelLabel={`${world.name} · Level ${level.id}`}
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
