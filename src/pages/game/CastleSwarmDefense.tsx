import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CastleSwarmArena, CastleRunMode } from "@/components/aura/game/castle/CastleSwarmArena";
import { CastleCampaignSelect } from "@/components/aura/game/castle/CastleCampaignSelect";

const CastleSwarmDefense = () => {
  const navigate = useNavigate();
  const [run, setRun] = useState<CastleRunMode | null>(null);
  const [runKey, setRunKey] = useState(0);
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
          onExit={() => setRun(null)}
          onPlayAgain={() => setRunKey(k => k + 1)}
        />
      ) : (
        <CastleCampaignSelect
          onBack={() => navigate("/game")}
          onPickEndless={() => setRun({ kind: "endless" })}
          onPickDaily={(seed) => setRun({ kind: "daily", seed })}
          onPickCampaign={(level) => setRun({ kind: "campaign", level })}
        />
      )}
    </>
  );
};

export default CastleSwarmDefense;
