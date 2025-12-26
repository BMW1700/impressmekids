import { motion } from "framer-motion";
import { GrogCharacter, GrogState, EnemyType } from "./GrogCharacter";
import { PlayerCharacter, PlayerState, PlayerGender } from "./PlayerCharacter";
import { EnergyBeamEffect, BeamType } from "./EnergyBeamEffect";
import { useState, useEffect } from "react";
import { Heart, Swords } from "lucide-react";

interface BattleArenaProps {
  // Enemy state
  enemyType: EnemyType;
  enemyHealthPercent: number;
  enemyState: GrogState;
  enemyTaunt?: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyName: string;
  
  // Player state
  playerHealthPercent: number;
  playerState: PlayerState;
  playerGender?: PlayerGender;
  currentStreak: number;
  playerHp: number;
  playerMaxHp: number;
  
  // Effects
  showPlayerDamage?: number;
  showEnemyDamage?: number;
  
  // Beam effects
  triggerAttackBeam?: number;
  triggerDamageBeam?: number;
  triggerPowerBeam?: number;
  isCriticalHit?: boolean;
}

export const BattleArena = ({
  enemyType,
  enemyHealthPercent,
  enemyState,
  enemyTaunt,
  enemyHp,
  enemyMaxHp,
  enemyName,
  playerHealthPercent,
  playerState,
  playerGender = 'knight',
  currentStreak,
  playerHp,
  playerMaxHp,
  showPlayerDamage,
  showEnemyDamage,
  triggerAttackBeam,
  triggerDamageBeam,
  triggerPowerBeam,
  isCriticalHit = false,
}: BattleArenaProps) => {
  const [showAttackBeam, setShowAttackBeam] = useState(false);
  const [showDamageBeam, setShowDamageBeam] = useState(false);
  const [showPowerBeam, setShowPowerBeam] = useState(false);
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

  // Trigger power beam (player -> enemy, purple fire!)
  useEffect(() => {
    if (triggerPowerBeam && triggerPowerBeam > 0) {
      setShowPowerBeam(true);
      const timer = setTimeout(() => setShowPowerBeam(false), 600);
      return () => clearTimeout(timer);
    }
  }, [triggerPowerBeam]);

  return (
    <div className="relative bg-gradient-to-b from-muted/30 to-muted/60 rounded-xl p-3 min-h-[140px]">
      {/* Battle background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,120,120,0.3)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      {/* Characters and Health Bars container */}
      <div className="relative flex items-center justify-between px-2">
        {/* Player (left side) - with health bar */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-1"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Player Health Bar - Above Character */}
          <div className="w-20 space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-pink-500" />
              <span className="text-xs font-bold">You</span>
            </div>
            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
              <motion.div
                className={`h-full ${
                  playerHealthPercent > 60 ? 'bg-gradient-to-r from-pink-500 to-rose-400' :
                  playerHealthPercent > 30 ? 'bg-gradient-to-r from-orange-500 to-amber-400' :
                  'bg-gradient-to-r from-red-600 to-red-400'
                }`}
                animate={{ width: `${playerHealthPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-center text-[10px] text-muted-foreground">{playerHp}/{playerMaxHp}</div>
          </div>
          
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
          <div className="text-xl font-black text-muted-foreground/30">VS</div>
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
        <EnergyBeamEffect
          show={showPowerBeam}
          type="power"
          direction="left-to-right"
        />

        {/* Enemy (right side) - with health bar */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-1"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Enemy Health Bar - Above Character */}
          <div className="w-20 space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <Swords className="w-3 h-3 text-red-500" />
              <span className="text-xs font-bold truncate">{enemyName}</span>
            </div>
            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
              <motion.div
                className={`h-full ${
                  enemyHealthPercent > 60 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                  enemyHealthPercent > 30 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                  'bg-gradient-to-r from-red-500 to-rose-400'
                }`}
                animate={{ width: `${enemyHealthPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-center text-[10px] text-muted-foreground">{enemyHp}/{enemyMaxHp}</div>
          </div>
          
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
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-orange-500/50 to-transparent"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  );
};
