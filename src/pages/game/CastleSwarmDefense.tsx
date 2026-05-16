import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CastleSwarmArena } from "@/components/aura/game/castle/CastleSwarmArena";

const CastleSwarmDefense = () => {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Castle Swarm Defense — NabuLearn</title>
        <meta name="description" content="Defend the castle by reading words and stories aloud. Endless horde mode for K-12 readers." />
      </Helmet>
      <CastleSwarmArena onExit={() => navigate("/game")} />
    </>
  );
};

export default CastleSwarmDefense;
