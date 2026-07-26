import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RPGEnemy } from '@/lib/rpgBattleData';
import { SoundEffects } from '@/lib/pronunciationPlayer';
import {
  getBossSpectacle,
  isBossType,
  type BossPhase,
} from '@/lib/rpgBossSpectacle';

const spectacleSounds = new SoundEffects();

interface RPGBossSpectacleProps {
  enemy: RPGEnemy;
  currentHp: number;
  maxHp: number;
}

/**
 * Cinematic overlay for boss fights.
 * - Fires a 2s entrance banner on first mount for boss/final_boss enemies.
 * - Fires a 1.6s phase-transition burst whenever HP crosses a threshold.
 * Purely additive: renders nothing for non-boss enemies and does not touch combat state.
 */
export const RPGBossSpectacle = ({ enemy, currentHp, maxHp }: RPGBossSpectacleProps) => {
  const spectacle = getBossSpectacle(enemy.id);
  const isBoss = isBossType(enemy.type);

  const [showEntrance, setShowEntrance] = useState(isBoss);
  const [activePhase, setActivePhase] = useState<BossPhase | null>(null);
  const [firedPhaseIds, setFiredPhaseIds] = useState<Set<number>>(new Set());

  // Entrance auto-dismiss + stinger. The cue is synthesized on the fly, so
  // there is no asset load that could delay the animation.
  useEffect(() => {
    if (!showEntrance) return;
    spectacleSounds.bossEntranceStinger();
    const t = setTimeout(() => setShowEntrance(false), 2200);
    return () => clearTimeout(t);
  }, [showEntrance]);

  // Watch HP for phase transitions.
  useEffect(() => {
    if (!isBoss || showEntrance || maxHp <= 0) return;
    const ratio = currentHp / maxHp;
    for (let i = 0; i < spectacle.phases.length; i++) {
      const phase = spectacle.phases[i];
      if (ratio <= phase.hpThreshold && !firedPhaseIds.has(i)) {
        setActivePhase(phase);
        spectacleSounds.bossPhaseCue();
        setFiredPhaseIds((prev) => {
          const next = new Set(prev);
          next.add(i);
          return next;
        });
        const t = setTimeout(() => setActivePhase(null), 1600);
        return () => clearTimeout(t);
      }
    }
  }, [currentHp, maxHp, isBoss, showEntrance, spectacle.phases, firedPhaseIds]);

  if (!isBoss) return null;

  return (
    <AnimatePresence>
      {showEntrance && (
        <motion.div
          key="entrance"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.75)' }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="text-center px-6"
          >
            <div
              className="text-xs md:text-sm font-black tracking-[0.3em] mb-3"
              style={{ color: spectacle.entranceColor }}
            >
              {spectacle.worldLabel}
            </div>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-7xl md:text-8xl mb-3"
            >
              {spectacle.entranceEmoji}
            </motion.div>
            <div
              className="text-4xl md:text-6xl font-black text-white mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
              style={{ textShadow: `0 0 30px ${spectacle.entranceColor}` }}
            >
              {enemy.name}
            </div>
            <div
              className="text-lg md:text-xl font-bold italic mb-4"
              style={{ color: spectacle.entranceColor }}
            >
              {spectacle.title}
            </div>
            <div className="text-sm md:text-base text-white/70 italic max-w-md mx-auto">
              "{spectacle.entranceQuote}"
            </div>
          </motion.div>
        </motion.div>
      )}

      {activePhase && (
        <motion.div
          key={`phase-${activePhase.mechanicName}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-0 top-1/3 z-[95] flex flex-col items-center pointer-events-none"
        >
          <motion.div
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 0.2, repeat: Infinity }}
            className="px-8 py-4 rounded-lg shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${activePhase.mechanicColor}, ${activePhase.mechanicColor}dd)`,
              boxShadow: `0 0 40px ${activePhase.mechanicColor}`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{activePhase.mechanicEmoji}</span>
              <span className="text-2xl md:text-3xl font-black text-white tracking-widest">
                {activePhase.mechanicName}
              </span>
              <span className="text-4xl">{activePhase.mechanicEmoji}</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 px-4 py-2 rounded-md bg-black/70 text-white text-sm md:text-base italic max-w-md text-center"
          >
            "{activePhase.taunt}"
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
