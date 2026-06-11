import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CastleSwarmArena, CastleRunMode } from "@/components/aura/game/castle/CastleSwarmArena";
import { CastleCampaignSelect } from "@/components/aura/game/castle/CastleCampaignSelect";
import { CustomStoryChooser, type StorySource } from "@/components/customStories/CustomStoryChooser";
import { getGradeMode, getStoredTheme } from "@/lib/gameTheme";

const CastleSwarmDefense = () => {
  const navigate = useNavigate();
  const [run, setRun] = useState<CastleRunMode | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [pendingRun, setPendingRun] = useState<CastleRunMode | null>(null);
  const [override, setOverride] = useState<{ text?: string; title?: string }>({});

  const gradeMode = getGradeMode(getStoredTheme());
  const castleBand: "K-5" | "6-12" = gradeMode === "6to12" ? "6-12" : "K-5";

  const startWithChooser = (next: CastleRunMode) => setPendingRun(next);

  const handleSource = (source: StorySource) => {
    if (source.kind === "custom") {
      setOverride({ text: source.story.body, title: source.story.title });
    } else {
      setOverride({});
    }
    setRun(pendingRun);
    setPendingRun(null);
  };

  return (
    <>
      <Helmet>
        <title>Castle Swarm Defense — NabuLearn</title>
        <meta name="description" content="Defend the castle by reading words and stories aloud. Campaign, Endless, and Daily Challenge for K-12 readers." />
      </Helmet>
      {run ? (
        <CastleSwarmArena
          key={runKey}
          mode={run}
          overrideText={override.text}
          overrideTitle={override.title}
          onExit={() => { setRun(null); setOverride({}); }}
          onPlayAgain={() => setRunKey(k => k + 1)}
        />
      ) : (
        <CastleCampaignSelect
          onBack={() => navigate("/game")}
          onPickEndless={() => startWithChooser({ kind: "endless" })}
          onPickDaily={(seed) => startWithChooser({ kind: "daily", seed })}
          onPickCampaign={(level) => startWithChooser({ kind: "campaign", level })}
        />
      )}

      <CustomStoryChooser
        open={!!pendingRun}
        onOpenChange={(open) => { if (!open) setPendingRun(null); }}
        target={{ kind: "castle_band", castleBand }}
        levelLabel={`Castle Swarm · ${castleBand}`}
        defaultStoryLabel="Built-in Castle Swarm story"
        onConfirm={handleSource}
      />
    </>
  );
};

export default CastleSwarmDefense;
