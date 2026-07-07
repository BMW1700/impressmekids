// Animated "show the problem" scene for the Pre-K episode intro.
// Designed for 3-4 year olds who can't read: communicates the level's
// problem visually with looping motion. One scene per Yubi world.

import { motion } from "framer-motion";
import { YubiOwl } from "./YubiOwl";

interface Props {
  worldId: number;
  size?: number;
}

export const YubiProblemScene = ({ worldId, size = 280 }: Props) => {
  if (worldId === 101) return <SleepyVillageScene size={size} />;
  if (worldId === 102) return <BoboStuckScene size={size} />;
  if (worldId === 103) return <EchoBubbleScene size={size} />;
  return <SleepyVillageScene size={size} />;
};

// ───────────────────────────────────────────────────────────────────
// World 101 — Yubi Village is asleep. Houses snore "Zzz", sun hides
// behind a cloud, Yubi flutters in trying to wake them.
// ───────────────────────────────────────────────────────────────────
const SleepyVillageScene = ({ size }: { size: number }) => (
  <div
    className="relative"
    style={{ width: size, height: size }}
    aria-label="Yubi Village is sleeping"
  >
    {/* moon/sun hiding behind cloud */}
    <motion.div
      className="absolute"
      style={{ top: size * 0.08, left: size * 0.62 }}
      animate={{ x: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width={size * 0.32} height={size * 0.22} viewBox="0 0 80 55">
        <circle cx="30" cy="28" r="14" fill="#fde68a" />
        <ellipse cx="48" cy="32" rx="22" ry="14" fill="#ffffff" />
        <ellipse cx="32" cy="36" rx="14" ry="10" fill="#ffffff" />
      </svg>
    </motion.div>

    {/* houses with Zzz */}
    <div
      className="absolute flex items-end gap-2"
      style={{ bottom: size * 0.08, left: size * 0.08, right: size * 0.08, justifyContent: "space-around" }}
    >
      {[0, 1, 2].map((i) => (
        <SleepyHouse key={i} delay={i * 0.6} size={size * 0.22} />
      ))}
    </div>

    {/* Yubi fluttering above, looking concerned */}
    <motion.div
      className="absolute"
      style={{ left: size * 0.34, top: size * 0.22 }}
      animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <YubiOwl size={size * 0.34} mood="curious" />
    </motion.div>
  </div>
);

const SleepyHouse = ({ delay, size }: { delay: number; size: number }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 60 60">
      <polygon points="6,28 30,8 54,28" fill="#b45309" />
      <rect x="10" y="28" width="40" height="26" fill="#fbbf24" />
      <rect x="25" y="38" width="10" height="16" fill="#7c2d12" rx="2" />
      <rect x="14" y="32" width="8" height="8" fill="#fef3c7" />
      <rect x="38" y="32" width="8" height="8" fill="#fef3c7" />
    </svg>
    <motion.div
      className="absolute -top-2 right-0 text-rose-900/70 font-extrabold"
      style={{ fontSize: size * 0.34 }}
      animate={{ y: [-2, -10, -2], opacity: [0, 1, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      z
    </motion.div>
  </div>
);

// ───────────────────────────────────────────────────────────────────
// World 102 — Bobo wants to jump but is stuck/wobbly on the ground.
// ───────────────────────────────────────────────────────────────────
const BoboStuckScene = ({ size }: { size: number }) => (
  <div
    className="relative"
    style={{ width: size, height: size }}
    aria-label="Bobo cannot jump"
  >
    {/* ground */}
    <div
      className="absolute rounded-full bg-rose-200/70"
      style={{ left: size * 0.18, right: size * 0.18, bottom: size * 0.18, height: size * 0.04 }}
    />
    {/* Yubi cheering on the side */}
    <motion.div
      className="absolute"
      style={{ left: size * 0.04, top: size * 0.18 }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <YubiOwl size={size * 0.3} mood="curious" />
    </motion.div>

    {/* Bobo: round little fellow that tries to jump and flops back */}
    <motion.div
      className="absolute"
      style={{ left: size * 0.4, bottom: size * 0.16 }}
      animate={{ y: [0, -size * 0.04, 0, -size * 0.02, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", times: [0, 0.18, 0.45, 0.62, 1] }}
    >
      <svg width={size * 0.34} height={size * 0.34} viewBox="0 0 100 100">
        <ellipse cx="50" cy="92" rx="28" ry="4" fill="#000" opacity="0.15" />
        <circle cx="50" cy="58" r="32" fill="#f472b6" />
        {/* sad mouth */}
        <path d="M38 70 Q50 62 62 70" stroke="#7f1d1d" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* eyes */}
        <circle cx="40" cy="50" r="4" fill="#1a1a1a" />
        <circle cx="60" cy="50" r="4" fill="#1a1a1a" />
        {/* small droplet */}
        <ellipse cx="68" cy="58" rx="2.5" ry="4" fill="#60a5fa" />
      </svg>
    </motion.div>

    {/* dashed arrow showing "wants to go up" */}
    <motion.svg
      width={size * 0.14}
      height={size * 0.34}
      viewBox="0 0 30 90"
      className="absolute"
      style={{ left: size * 0.56, bottom: size * 0.36 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M15 85 L15 12" stroke="#be123c" strokeWidth="3" strokeDasharray="5 5" fill="none" />
      <path d="M5 18 L15 5 L25 18" stroke="#be123c" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  </div>
);

// ───────────────────────────────────────────────────────────────────
// World 103 — Echo is trapped in a wobbly sound bubble.
// ───────────────────────────────────────────────────────────────────
const EchoBubbleScene = ({ size }: { size: number }) => (
  <div
    className="relative"
    style={{ width: size, height: size }}
    aria-label="Echo is stuck in a bubble"
  >
    {/* Yubi floating above */}
    <motion.div
      className="absolute"
      style={{ left: size * 0.06, top: size * 0.1 }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <YubiOwl size={size * 0.28} mood="curious" />
    </motion.div>

    {/* the bubble + Echo inside */}
    <motion.div
      className="absolute"
      style={{ left: size * 0.32, top: size * 0.26, width: size * 0.5, height: size * 0.5 }}
      animate={{ scale: [1, 1.04, 0.98, 1], rotate: [0, 2, -2, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
          <radialGradient id="bub" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#bae6fd" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.4" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="56" fill="url(#bub)" stroke="#38bdf8" strokeWidth="2" />
        <ellipse cx="42" cy="38" rx="14" ry="7" fill="#ffffff" opacity="0.7" />
        {/* Echo: small shy creature */}
        <g transform="translate(60 70)">
          <ellipse cx="0" cy="22" rx="22" ry="3" fill="#000" opacity="0.12" />
          <circle cx="0" cy="0" r="22" fill="#a78bfa" />
          {/* covered mouth */}
          <rect x="-10" y="6" width="20" height="5" rx="2" fill="#4c1d95" />
          <circle cx="-8" cy="-4" r="3" fill="#1a1a1a" />
          <circle cx="8" cy="-4" r="3" fill="#1a1a1a" />
          {/* tiny ears */}
          <path d="M-18 -14 l-4 -10 l8 4 z" fill="#7c3aed" />
          <path d="M18 -14 l4 -10 l-8 4 z" fill="#7c3aed" />
        </g>
      </svg>
    </motion.div>

    {/* muffled sound waves trying to escape */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute rounded-full border-2 border-violet-400/60"
        style={{
          left: size * 0.5,
          top: size * 0.5,
          width: size * 0.16,
          height: size * 0.16,
          marginLeft: -size * 0.08,
          marginTop: -size * 0.08,
        }}
        animate={{ scale: [0.4, 1.6], opacity: [0.7, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
      />
    ))}
  </div>
);
