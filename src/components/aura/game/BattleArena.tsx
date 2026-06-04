import { motion } from "framer-motion";
import { GrogCharacter, GrogState } from "./GrogCharacter";
import { type EnemyType } from "@/lib/battleMechanics";
import { PlayerCharacter, PlayerState, PlayerGender } from "./PlayerCharacter";
import { EnergyBeamEffect } from "./EnergyBeamEffect";
import { useState, useEffect } from "react";
import { GoblinGuard, GoblinState } from "./characters/GoblinGuard";
import { SirValor, KnightState } from "./characters/SirValor";
import { SirValorVideo, useTransientValorMood } from "./characters/SirValorVideo";
import { ParticleBurst } from "./effects/ParticleBurst";
import { ImpactFlash } from "./effects/ImpactFlash";
import { VerbAnimationLayer } from "./effects/VerbAnimationLayer";
import { useScreenShake } from "@/hooks/useScreenShake";
import { useVerbAnimation, type VerbTrigger } from "@/hooks/useVerbAnimation";

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

  // Verb animation: fires when student correctly reads a known verb.
  triggerVerb?: VerbTrigger;

  // Custom avatars
  ellaAvatarUrl?: string;
  grogAvatarUrl?: string;

  // Use premium sprites
  usePremiumSprites?: boolean;
}

// Map states between old and new
const mapToGoblinState = (state: GrogState): GoblinState => {
  switch (state) {
    case 'hit': return 'hit';
    case 'attacking': return 'attacking';
    case 'defeated': return 'defeated';
    case 'taunting': return 'taunting';
    default: return 'idle';
  }
};

const mapToKnightState = (state: PlayerState): KnightState => {
  switch (state) {
    case 'hit': return 'hit';
    case 'attacking': return 'attacking';
    case 'defeated': return 'defeated';
    case 'victory': return 'victory';
    default: return 'idle';
  }
};

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
  triggerVerb,
  ellaAvatarUrl,
  grogAvatarUrl,
  usePremiumSprites = true,
}: BattleArenaProps) => {
  const [showAttackBeam, setShowAttackBeam] = useState(false);
  const [showDamageBeam, setShowDamageBeam] = useState(false);
  const [attackCritical, setAttackCritical] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [impactTrigger, setImpactTrigger] = useState(0);
  const { shakeStyle, shake, criticalShake } = useScreenShake();
  const verb = useVerbAnimation(triggerVerb);
  const verbTransform = verb?.descriptor.kind === 'transform' ? verb : null;
  const verbEmoji = verb?.descriptor.kind === 'emoji' ? verb : null;

  // Trigger attack beam (player -> enemy)
  useEffect(() => {
    if (triggerAttackBeam && triggerAttackBeam > 0) {
      setAttackCritical(isCriticalHit);
      setShowAttackBeam(true);
      
      // Trigger screen shake and particles when beam hits
      setTimeout(() => {
        if (isCriticalHit) {
          criticalShake();
        } else {
          shake({ intensity: 3, duration: 150 });
        }
        setParticleTrigger(prev => prev + 1);
        setImpactTrigger(prev => prev + 1);
      }, 300);
      
      const timer = setTimeout(() => setShowAttackBeam(false), 500);
      return () => clearTimeout(timer);
    }
  }, [triggerAttackBeam, isCriticalHit, shake, criticalShake]);

  // Trigger damage beam (enemy -> player)
  useEffect(() => {
    if (triggerDamageBeam && triggerDamageBeam > 0) {
      setShowDamageBeam(true);
      
      // Screen shake when player takes damage
      setTimeout(() => {
        shake({ intensity: 4, duration: 200 });
      }, 300);
      
      const timer = setTimeout(() => setShowDamageBeam(false), 500);
      return () => clearTimeout(timer);
    }
  }, [triggerDamageBeam, shake]);

  return (
    <motion.div 
      className="relative bg-gradient-to-b from-muted/30 to-muted/60 rounded-xl p-4 min-h-[180px]"
      style={shakeStyle}
    >
      {/* Battle background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,120,120,0.3)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      {/* Particle effects layer */}
      <ParticleBurst
        trigger={particleTrigger}
        x={75}
        y={50}
        count={isCriticalHit ? 15 : 8}
        colors={isCriticalHit ? ['#FFD700', '#FF6B6B', '#FFFFFF'] : ['#FF6B6B', '#FFA500', '#FFFFFF']}
        size={isCriticalHit ? 'large' : 'medium'}
      />

      {/* Impact flash */}
      <ImpactFlash
        trigger={impactTrigger}
        type={isCriticalHit ? 'critical' : 'hit'}
        position={{ x: 75, y: 50 }}
      />

      {/* Characters container */}
      <div className="relative flex items-center justify-between px-4">
        {/* Player (left side) */}
        <motion.div
          className="relative z-10"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {usePremiumSprites ? (
            <SirValor
              state={mapToKnightState(playerState)}
              healthPercent={playerHealthPercent}
              currentStreak={currentStreak}
              size="medium"
            />
          ) : (
            <PlayerCharacter
              state={playerState}
              healthPercent={playerHealthPercent}
              gender={playerGender}
              showDamage={showPlayerDamage}
              currentStreak={currentStreak}
              avatarUrl={ellaAvatarUrl}
            />
          )}
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
          <motion.div
            key={verbTransform?.id ?? 'enemy-base'}
            className="relative"
            style={{ transformOrigin: 'center center' }}
            animate={verbTransform?.descriptor.kind === 'transform' ? verbTransform.descriptor.animate : undefined}
          >
            {usePremiumSprites ? (
              <GoblinGuard
                state={mapToGoblinState(enemyState)}
                healthPercent={enemyHealthPercent}
                size="medium"
              />
            ) : (
              <GrogCharacter
                state={enemyState}
                healthPercent={enemyHealthPercent}
                enemyType={enemyType}
                taunt={enemyTaunt}
                showDamage={showEnemyDamage}
                avatarUrl={grogAvatarUrl}
              />
            )}
            <VerbAnimationLayer
              descriptor={verbEmoji?.descriptor.kind === 'emoji' ? verbEmoji.descriptor : null}
              id={verbEmoji?.id ?? null}
              anchor={{ x: 60, y: 75 }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Streak fire effect at bottom */}
      {currentStreak >= 5 && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-orange-500/50 to-transparent animate-streak-fire"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};
