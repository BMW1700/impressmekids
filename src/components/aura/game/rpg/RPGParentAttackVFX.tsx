import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Cinematic ability VFX for parent attacks in RPG PvP.
 * Each ability gets a distinct, brief, "addictive" animation that flies from
 * the parent's side (right) toward the kid's hero (left).
 */
export type ParentAttackKind =
  | 'fireball'
  | 'lightning'
  | 'ice_blast'
  | 'wind_slash'
  | 'generic';

interface RPGParentAttackVFXProps {
  kind: ParentAttackKind | null;
  fireKey: number; // changes whenever a new attack should play
  onDone?: () => void;
  /** Travel direction. Default 'rightToLeft' preserves existing parent→hero behavior. */
  direction?: 'rightToLeft' | 'leftToRight';
  /** When true, render absolutely inside the nearest positioned parent instead of fixed full-screen. */
  contained?: boolean;
}

const DURATION_MS = 1100;

export const RPGParentAttackVFX = ({ kind, fireKey, onDone, direction = 'rightToLeft', contained = false }: RPGParentAttackVFXProps) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!kind) return;
    setActive(true);
    const t = setTimeout(() => {
      setActive(false);
      onDone?.();
    }, DURATION_MS);
    return () => clearTimeout(t);
  }, [fireKey, kind, onDone]);

  if (!kind || !active) return null;

  return (
    <AnimatePresence>
      <div className="pointer-events-none fixed inset-0 z-[75] overflow-hidden">
        {kind === 'fireball' && <FireballVFX />}
        {kind === 'lightning' && <LightningVFX />}
        {kind === 'ice_blast' && <IceVFX />}
        {kind === 'wind_slash' && <WindVFX />}
        {kind === 'generic' && <GenericVFX />}
      </div>
    </AnimatePresence>
  );
};

// ─── Fireball: a flaming orb arcing right→left with a tail and impact burst ───
const FireballVFX = () => (
  <>
    {/* Screen tint */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.25, 0] }}
      transition={{ duration: 1, times: [0, 0.6, 1] }}
      className="absolute inset-0 bg-orange-500"
    />
    {/* Fireball travelling */}
    <motion.div
      initial={{ right: '15%', top: '50%', scale: 0.6, opacity: 0 }}
      animate={{
        right: ['15%', '70%'],
        top: ['50%', '55%'],
        scale: [0.6, 1.4, 1.2],
        opacity: [0, 1, 1, 0],
      }}
      transition={{ duration: 0.7, ease: 'easeIn' }}
      className="absolute -translate-y-1/2 w-24 h-24 rounded-full"
      style={{
        background: 'radial-gradient(circle at 35% 35%, #fff7c2 0%, #ffb24a 35%, #ff5a1f 65%, #7a1500 100%)',
        boxShadow: '0 0 40px 18px rgba(255,120,30,0.75), 0 0 90px 30px rgba(255,80,20,0.4)',
      }}
    >
      {/* Inner flicker */}
      <motion.div
        animate={{ scale: [0.9, 1.1, 0.95] }}
        transition={{ duration: 0.25, repeat: 3 }}
        className="absolute inset-2 rounded-full bg-yellow-200/70 mix-blend-screen"
      />
    </motion.div>
    {/* Trail particles */}
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ right: '15%', top: `${48 + i * 0.6}%`, opacity: 0 }}
        animate={{
          right: ['15%', '68%'],
          opacity: [0, 0.9, 0],
          scale: [0.4, 1, 0.2],
        }}
        transition={{ duration: 0.8, delay: 0.05 + i * 0.04, ease: 'easeIn' }}
        className="absolute w-4 h-4 rounded-full bg-orange-400 blur-sm"
      />
    ))}
    {/* Impact burst on the hero (left) */}
    <motion.div
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: [0, 1, 0], scale: [0.2, 1.6, 2.2] }}
      transition={{ duration: 0.45, delay: 0.7, ease: 'easeOut' }}
      className="absolute left-[20%] top-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
      style={{
        background: 'radial-gradient(circle, #fffbe3 0%, #ffae3b 40%, transparent 70%)',
        boxShadow: '0 0 60px 30px rgba(255,180,60,0.8)',
      }}
    />
  </>
);

// ─── Lightning: flash + jagged bolt from sky to hero ───
const LightningVFX = () => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.85, 0, 0.6, 0] }}
      transition={{ duration: 0.6, times: [0, 0.15, 0.3, 0.45, 0.7] }}
      className="absolute inset-0 bg-yellow-100"
    />
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <motion.polyline
        points="20,0 22,15 17,30 24,42 18,55 25,72 20,90"
        fill="none"
        stroke="#fff8a8"
        strokeWidth="0.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ filter: 'drop-shadow(0 0 6px #fff48a) drop-shadow(0 0 14px #ffe34d)' }}
      />
      <motion.polyline
        points="20,0 22,15 17,30 24,42 18,55 25,72 20,90"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.25"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </svg>
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 1.8] }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="absolute left-[20%] top-[80%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
      style={{
        background: 'radial-gradient(circle, #fffacd 0%, #ffd700 35%, transparent 70%)',
        boxShadow: '0 0 50px 20px rgba(255,236,100,0.85)',
      }}
    />
  </>
);

// ─── Ice: shards flying + frosty overlay ───
const IceVFX = () => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.35, 0.2, 0] }}
      transition={{ duration: 1 }}
      className="absolute inset-0 bg-cyan-300 mix-blend-overlay"
    />
    {Array.from({ length: 14 }).map((_, i) => {
      const startTop = 20 + Math.random() * 60;
      const delay = Math.random() * 0.25;
      return (
        <motion.div
          key={i}
          initial={{ right: '15%', top: `${startTop}%`, opacity: 0, rotate: 0 }}
          animate={{
            right: ['15%', '78%'],
            top: [`${startTop}%`, `${startTop + (Math.random() * 10 - 5)}%`],
            opacity: [0, 1, 1, 0],
            rotate: [0, 240],
          }}
          transition={{ duration: 0.85, delay, ease: 'easeIn' }}
          className="absolute"
          style={{
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: '18px solid rgba(186,230,253,0.95)',
            filter: 'drop-shadow(0 0 6px #67e8f9)',
          }}
        />
      );
    })}
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: [0, 1, 0], scale: [0.3, 1.4, 1.8] }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="absolute left-[20%] top-1/2 -translate-y-1/2 w-36 h-36 rounded-full"
      style={{
        background: 'radial-gradient(circle, #e0f2fe 0%, #38bdf8 50%, transparent 75%)',
        boxShadow: '0 0 40px 18px rgba(125,211,252,0.85)',
      }}
    />
  </>
);

// ─── Wind: horizontal slash lines + green tint ───
const WindVFX = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ right: '15%', top: `${30 + i * 7}%`, opacity: 0, scaleX: 0.3 }}
        animate={{
          right: ['15%', '80%'],
          opacity: [0, 1, 0],
          scaleX: [0.3, 1.4, 0.6],
        }}
        transition={{ duration: 0.55, delay: i * 0.06, ease: 'easeIn' }}
        className="absolute h-1 w-40 rounded-full bg-emerald-300"
        style={{
          boxShadow: '0 0 12px rgba(110,231,183,0.85), 0 0 24px rgba(52,211,153,0.6)',
        }}
      />
    ))}
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: [0, 1, 0], scale: [0.3, 1.4, 1.8] }}
      transition={{ duration: 0.45, delay: 0.55 }}
      className="absolute left-[20%] top-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
      style={{
        background: 'radial-gradient(circle, #d1fae5 0%, #10b981 45%, transparent 75%)',
        boxShadow: '0 0 40px 18px rgba(52,211,153,0.7)',
      }}
    />
  </>
);

// ─── Fallback: a generic energy pulse ───
const GenericVFX = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.4 }}
    animate={{ opacity: [0, 1, 0], scale: [0.4, 1.6, 2.1] }}
    transition={{ duration: 0.7 }}
    className="absolute left-[20%] top-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
    style={{
      background: 'radial-gradient(circle, #fff 0%, #c084fc 45%, transparent 70%)',
      boxShadow: '0 0 50px 20px rgba(192,132,252,0.85)',
    }}
  />
);

/** Map a parent ability id to its VFX kind. */
export const abilityIdToAttackKind = (id: string | undefined | null): ParentAttackKind => {
  switch (id) {
    case 'fireball': return 'fireball';
    case 'lightning': return 'lightning';
    case 'ice_blast': return 'ice_blast';
    case 'wind_slash': return 'wind_slash';
    default: return 'generic';
  }
};
