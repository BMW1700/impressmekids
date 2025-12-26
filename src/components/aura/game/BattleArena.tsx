import { motion } from "framer-motion";
import { GrogCharacter, GrogState, EnemyType } from "./GrogCharacter";
import { PlayerCharacter, PlayerState, PlayerGender } from "./PlayerCharacter";
import { EnergyBeamEffect, BeamType } from "./EnergyBeamEffect";
import { useState, useEffect } from "react";

interface BattleArenaProps {
  // Enemy state
  enemyType: EnemyType;
  enemyHealthPercent: number;
  enemyState: GrogState;
  enemyTaunt?: string;
  
  // Player state
  playerHealthPercent: number;
  playerState: PlayerState;
  playerGender?: PlayerGender;
  currentStreak: number;
  
  // Effects
  showPlayerDamage?: number;
  showEnemyDamage?: number;
  
  // Beam effects
  triggerAttackBeam?: number;
  triggerDamageBeam?: number;
  isCriticalHit?: boolean;
}

export const BattleArena = ({
  enemyType,
  enemyHealthPercent,
  enemyState,
  enemyTaunt,
  playerHealthPercent,
  playerState,
  playerGender = 'knight',
  currentStreak,
  showPlayerDamage,
  showEnemyDamage,
  triggerAttackBeam,
  triggerDamageBeam,
  isCriticalHit = false,
}: BattleArenaProps) => {
  const [showAttackBeam, setShowAttackBeam] = useState(false);
  const [showDamageBeam, setShowDamageBeam] = useState(false);
  const [attackCritical, setAttackCritical] = useState(false);

  // Trigger attack beam (player -> enemy)
  useEffect(() => {
    if (triggerAttackBeam && triggerAttackBeam > 0) {
      setAttackCritical(isCriticalHit);
      setShowAttackBeam(true);
      const timer = setTimeout(() => setShowAttackBeam(false), 500);
      return () => clearTimeout(timer);
    }
  }, [triggerAttackBeam, isCriticalHit]);

  // Trigger damage beam (enemy -> player)
  useEffect(() => {
    if (triggerDamageBeam && triggerDamageBeam > 0) {
      setShowDamageBeam(true);
      const timer = setTimeout(() => setShowDamageBeam(false), 500);
      return () => clearTimeout(timer);
    }
  }, [triggerDamageBeam]);

  return (
    <div className="relative bg-gradient-to-b from-muted/30 to-muted/60 rounded-xl p-4 min-h-[180px]">
      {/* Battle background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,120,120,0.3)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      {/* Characters container */}
      <div className="relative flex items-center justify-between px-4">
        {/* Player (left side) */}
        <motion.div
          className="relative z-10"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <PlayerCharacter
            state={playerState}
            healthPercent={playerHealthPercent}
            gender={playerGender}
            showDamage={showPlayerDamage}
            currentStreak={currentStreak}
          />
        </motion.div>

        {/* VS indicator in center */}
        <motion.div
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-2xl font-black text-muted-foreground/30">VS</div>
        </motion.div>

        {/* Energy beam effects layer */}
        <EnergyBeamEffect
          show={showAttackBeam}
          type="attack"
          direction="left-to-right"
          isCritical={attackCritical}
        />
        <EnergyBeamEffect
          show={showDamageBeam}
          type="damage"
          direction="right-to-left"
        />

        {/* Enemy (right side) */}
        <motion.div
          className="relative z-10"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GrogCharacter
            state={enemyState}
            healthPercent={enemyHealthPercent}
            enemyType={enemyType}
            taunt={enemyTaunt}
            showDamage={showEnemyDamage}
          />
        </motion.div>
      </div>

      {/* Streak fire effect at bottom */}
      {currentStreak >= 5 && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-orange-500/50 to-transparent"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  );
};
