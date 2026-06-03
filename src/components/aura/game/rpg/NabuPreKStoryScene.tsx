// Pre-K in-level story scene. Replaces the K-12 "battle row" (enemy + knight)
// for worlds 101/102/103. Nabu the Owl is the main character on screen; the
// child's voice is what advances the scene. Each correct word ticks `progress`
// forward and a visible scene beat plays out — sleepy houses light up, Bobo
// bounces higher, Echo's bubble cracks, etc. No before/after overlays.

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { NabuOwl } from "./NabuOwl";

interface Props {
  worldId: number;
  progress: number;    // number of words/phrases read correctly so far
  total: number;       // total words/phrases in this level
  celebrating: boolean; // allDone — show big payoff
  lastTick: number;    // increments on every correct read → triggers burst
}

export const NabuPreKStoryScene = ({ worldId, progress, total, celebrating, lastTick }: Props) => {
  if (worldId === 101) return <SleepyVillageScene progress={progress} total={total} celebrating={celebrating} lastTick={lastTick} />;
  if (worldId === 102) return <BoboBounceScene progress={progress} total={total} celebrating={celebrating} lastTick={lastTick} />;
  if (worldId === 103) return <EchoBubbleScene progress={progress} total={total} celebrating={celebrating} lastTick={lastTick} />;
  return null;
};

// ─────────────────────────────────────────────────────────────────────
// Shared: floating Nabu (owl) that reacts to ticks
// ─────────────────────────────────────────────────────────────────────
const NabuFloater = ({ lastTick, size = 110, x = "50%", y = "30%", mood = "happy" as const }: {
  lastTick: number;
  size?: number;
  x?: string;
  y?: string;
  mood?: "happy" | "curious" | "cheer";
}) => (
  <motion.div
    className="absolute"
    style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
  >
    <motion.div
      key={lastTick}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.18, 1], rotate: [0, -6, 6, 0] }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <NabuOwl size={size} mood={mood} />
    </motion.div>
  </motion.div>
);

const SparkleBurst = ({ tick, x, y }: { tick: number; x: string; y: string }) => (
  <AnimatePresence>
    {tick > 0 && (
      <motion.div
        key={tick}
        className="absolute pointer-events-none text-3xl"
        style={{ left: x, top: y }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0], y: [0, -30] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        ✨
      </motion.div>
    )}
  </AnimatePresence>
);

// ─────────────────────────────────────────────────────────────────────
// WORLD 101 — Sleepy Nabu Village
// As the child reads, the sky brightens, houses light up one at a time,
// and the sun rises. Nabu flutters across the village cheering.
// ─────────────────────────────────────────────────────────────────────
const SleepyVillageScene = ({ progress, total, celebrating, lastTick }: Omit<Props, "worldId">) => {
  const ratio = total > 0 ? Math.min(1, progress / total) : 0;
  const houseCount = 5;
  const housesLit = Math.min(houseCount, Math.ceil(ratio * houseCount));

  // Sky gradient interpolated by progress
  const skyTop = celebrating ? "#bae6fd" : interpolateColor("#3b3b6b", "#fde68a", ratio);
  const skyBot = celebrating ? "#fde68a" : interpolateColor("#6b4f7a", "#fecaca", ratio);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border-2 border-white/60 shadow-inner"
      style={{ background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBot} 100%)` }}
    >
      {/* Sun rising from below the horizon */}
      <motion.div
        className="absolute"
        style={{ left: "50%", marginLeft: -60 }}
        animate={{ bottom: `${20 + ratio * 50}%`, opacity: 0.4 + ratio * 0.6 }}
        transition={{ duration: 1 }}
      >
        <div className="w-[120px] h-[120px] rounded-full"
          style={{
            background: "radial-gradient(circle, #fff7ad 0%, #fbbf24 60%, rgba(251,191,36,0) 100%)",
            filter: "blur(0.5px)",
          }}
        />
      </motion.div>

      {/* Stars fade out as we wake */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white"
          style={{
            left: `${(i * 73) % 90 + 5}%`,
            top: `${(i * 31) % 30 + 4}%`,
            fontSize: 14 + (i % 3) * 4,
          }}
          animate={{ opacity: Math.max(0, 0.9 - ratio * 1.4) }}
          transition={{ duration: 0.8 }}
        >
          ✦
        </motion.div>
      ))}

      {/* Hill */}
      <div className="absolute left-0 right-0 bottom-0 h-[40%]"
        style={{ background: "linear-gradient(180deg, #34a169 0%, #1f6b46 100%)", borderTopLeftRadius: "60% 80%", borderTopRightRadius: "60% 80%" }}
      />

      {/* Houses lined up */}
      <div className="absolute left-0 right-0 bottom-[18%] flex justify-around items-end px-6">
        {Array.from({ length: houseCount }).map((_, i) => (
          <SleepyHouse key={i} index={i} lit={i < housesLit} />
        ))}
      </div>

      {/* Nabu fluttering across — moves with progress */}
      <NabuFloater
        lastTick={lastTick}
        x={`${15 + ratio * 70}%`}
        y="28%"
        size={96}
        mood={celebrating ? "cheer" : "curious"}
      />

      <SparkleBurst tick={lastTick} x="50%" y="40%" />

      {/* Celebration confetti */}
      {celebrating && <Confetti />}
    </div>
  );
};

const SleepyHouse = ({ index, lit }: { index: number; lit: boolean }) => {
  const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc"];
  const c = colors[index % colors.length];
  return (
    <div className="relative" style={{ width: 64, height: 70 }}>
      <svg viewBox="0 0 60 70" width="100%" height="100%">
        <polygon points="4,26 30,4 56,26" fill="#7c2d12" />
        <rect x="8" y="26" width="44" height="38" fill={c} stroke="#3f1d0a" strokeWidth="1.5" />
        <rect x="24" y="40" width="12" height="24" fill="#3f1d0a" rx="1.5" />
        <rect x="13" y="32" width="9" height="9" fill={lit ? "#fef3c7" : "#1f2937"} stroke="#3f1d0a" strokeWidth="1" />
        <rect x="38" y="32" width="9" height="9" fill={lit ? "#fef3c7" : "#1f2937"} stroke="#3f1d0a" strokeWidth="1" />
      </svg>
      {/* Snore Zzz when not lit */}
      <AnimatePresence>
        {!lit && (
          <motion.div
            className="absolute -top-2 right-0 text-rose-50 font-extrabold"
            style={{ fontSize: 18, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-2, -14, -2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.4 }}
          >
            z
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sparkle glow when lit */}
      <AnimatePresence>
        {lit && (
          <motion.div
            className="absolute -top-1 left-1/2 -translate-x-1/2 text-yellow-200 text-base"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.7] }}
            transition={{ duration: 0.8 }}
          >
            ✨
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// WORLD 102 — Bobo's Bouncy Day
// Each correct word makes Bobo hop higher. By the end he's flying.
// ─────────────────────────────────────────────────────────────────────
const BoboBounceScene = ({ progress, total, celebrating, lastTick }: Omit<Props, "worldId">) => {
  const ratio = total > 0 ? Math.min(1, progress / total) : 0;
  const bounceHeight = 20 + ratio * 120;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border-2 border-white/60 shadow-inner"
      style={{ background: "linear-gradient(180deg, #fde68a 0%, #fb923c 100%)" }}
    >
      {/* Clouds */}
      {[10, 45, 75].map((left, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${left}%`, top: `${8 + i * 5}%` }}
          animate={{ x: [0, 12, 0] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="80" height="40" viewBox="0 0 80 40">
            <ellipse cx="40" cy="22" rx="32" ry="14" fill="white" opacity="0.85" />
            <ellipse cx="22" cy="24" rx="14" ry="10" fill="white" opacity="0.85" />
            <ellipse cx="58" cy="24" rx="16" ry="10" fill="white" opacity="0.85" />
          </svg>
        </motion.div>
      ))}

      {/* Grass ground */}
      <div className="absolute left-0 right-0 bottom-0 h-[22%]"
        style={{ background: "linear-gradient(180deg, #65a30d 0%, #3f6212 100%)" }}
      />

      {/* Nabu cheering on the side */}
      <NabuFloater lastTick={lastTick} x="14%" y="34%" size={84} mood="cheer" />
      <motion.div
        className="absolute"
        style={{ left: "14%", top: "55%", transform: "translateX(-50%)" }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <div className="rounded-full bg-white/90 px-3 py-1 text-rose-700 font-extrabold text-sm shadow">
          Go Bobo!
        </div>
      </motion.div>

      {/* Bobo — bounces higher with progress, key on lastTick to retrigger */}
      <motion.div
        key={`bobo-${lastTick}`}
        className="absolute"
        style={{ left: "55%", bottom: "22%", transformOrigin: "center bottom" }}
        animate={{ y: [0, -bounceHeight, 0], scaleY: [1, 1.05, 0.9, 1.05, 1] }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        <BoboCharacter happy={ratio > 0.2 || celebrating} />
      </motion.div>

      {/* Bounce shadow */}
      <motion.div
        className="absolute rounded-full bg-black/30"
        style={{ left: "55%", bottom: "21%", width: 70, height: 8, marginLeft: -35, filter: "blur(2px)" }}
        animate={{ scaleX: [1, 0.5, 1], opacity: [0.4, 0.15, 0.4] }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />

      {/* Bounce trail dots showing past hops */}
      {Array.from({ length: progress }).map((_, i) => (
        <motion.div
          key={`trail-${i}`}
          className="absolute text-amber-700 font-black"
          style={{ left: `${20 + (i * 14) % 65}%`, bottom: `${30 + (i * 11) % 30}%`, fontSize: 14 + (i % 3) * 4 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0.6], scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          ★
        </motion.div>
      ))}

      <SparkleBurst tick={lastTick} x="55%" y="35%" />
      {celebrating && <Confetti />}
    </div>
  );
};

const BoboCharacter = ({ happy }: { happy: boolean }) => (
  <svg width="100" height="100" viewBox="0 0 100 100">
    <ellipse cx="50" cy="92" rx="26" ry="3" fill="#000" opacity="0.18" />
    <circle cx="50" cy="55" r="36" fill="#facc15" stroke="#a16207" strokeWidth="2" />
    {/* cheeks */}
    <circle cx="28" cy="62" r="6" fill="#fb7185" opacity="0.6" />
    <circle cx="72" cy="62" r="6" fill="#fb7185" opacity="0.6" />
    {/* eyes */}
    <circle cx="38" cy="48" r="5" fill="#1f2937" />
    <circle cx="62" cy="48" r="5" fill="#1f2937" />
    <circle cx="39.5" cy="46.5" r="1.5" fill="white" />
    <circle cx="63.5" cy="46.5" r="1.5" fill="white" />
    {/* mouth */}
    {happy ? (
      <path d="M34 66 Q50 82 66 66" stroke="#7f1d1d" strokeWidth="3.5" fill="#fda4af" strokeLinecap="round" />
    ) : (
      <path d="M38 70 Q50 64 62 70" stroke="#7f1d1d" strokeWidth="3" fill="none" strokeLinecap="round" />
    )}
    {/* little arms */}
    <ellipse cx="14" cy="60" rx="6" ry="9" fill="#facc15" stroke="#a16207" strokeWidth="2" />
    <ellipse cx="86" cy="60" rx="6" ry="9" fill="#facc15" stroke="#a16207" strokeWidth="2" />
    {/* feet */}
    <ellipse cx="38" cy="92" rx="9" ry="5" fill="#a16207" />
    <ellipse cx="62" cy="92" rx="9" ry="5" fill="#a16207" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────
// WORLD 103 — Echo trapped in a bubble
// Each word cracks the bubble more; final word pops it.
// ─────────────────────────────────────────────────────────────────────
const EchoBubbleScene = ({ progress, total, celebrating, lastTick }: Omit<Props, "worldId">) => {
  const ratio = total > 0 ? Math.min(1, progress / total) : 0;
  const bubbleScale = 1 - ratio * 0.35;
  const bubbleOpacity = celebrating ? 0 : 1 - ratio * 0.4;
  const popped = celebrating;

  // Crack lines appear progressively
  const cracks = useMemo(() => Math.min(4, progress), [progress]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border-2 border-white/60 shadow-inner"
      style={{ background: "linear-gradient(180deg, #ede9fe 0%, #c4b5fd 100%)" }}
    >
      {/* drifting soft shapes */}
      {[20, 60, 85].map((l, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: `${l}%`, top: `${15 + i * 18}%`, width: 60 + i * 20, height: 60 + i * 20, background: "rgba(255,255,255,0.35)" }}
          animate={{ y: [0, -10, 0], x: [0, 6, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Nabu hovering above the bubble */}
      <NabuFloater lastTick={lastTick} x="50%" y="20%" size={80} mood="curious" />

      {/* Echo in/free of bubble — center */}
      <div className="absolute" style={{ left: "50%", top: "58%", transform: "translate(-50%, -50%)" }}>
        <div className="relative" style={{ width: 200, height: 200 }}>
          {/* Bubble */}
          <motion.svg
            viewBox="0 0 200 200"
            width="200"
            height="200"
            className="absolute inset-0"
            animate={popped ? { scale: 1.6, opacity: 0 } : { scale: bubbleScale, opacity: bubbleOpacity, rotate: [0, 3, -3, 0] }}
            transition={popped ? { duration: 0.5 } : { duration: 1.8, ease: "easeInOut", rotate: { repeat: Infinity, duration: 4 } }}
          >
            <defs>
              <radialGradient id="bubGrad" cx="35%" cy="30%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#bae6fd" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.35" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="92" fill="url(#bubGrad)" stroke="#38bdf8" strokeWidth="3" />
            <ellipse cx="72" cy="58" rx="22" ry="11" fill="#ffffff" opacity="0.75" />
            {/* cracks */}
            {cracks >= 1 && <path d="M30 100 L60 90 L50 110 L80 105" stroke="#0c4a6e" strokeWidth="2" fill="none" strokeLinecap="round" />}
            {cracks >= 2 && <path d="M170 90 L140 100 L150 80 L120 95" stroke="#0c4a6e" strokeWidth="2" fill="none" strokeLinecap="round" />}
            {cracks >= 3 && <path d="M100 30 L92 60 L108 50 L100 80" stroke="#0c4a6e" strokeWidth="2" fill="none" strokeLinecap="round" />}
            {cracks >= 4 && <path d="M60 150 L80 140 L70 160 L100 155" stroke="#0c4a6e" strokeWidth="2" fill="none" strokeLinecap="round" />}
          </motion.svg>

          {/* Echo character */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={popped ? { y: -20, scale: 1.1 } : { y: [0, -3, 0] }}
            transition={popped ? { duration: 0.6, type: "spring" } : { duration: 2.4, repeat: Infinity }}
          >
            <EchoCharacter free={popped} />
          </motion.div>

          {/* Pop sparkles when freed */}
          <AnimatePresence>
            {popped && [0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="absolute text-yellow-400 text-2xl"
                style={{ left: "50%", top: "50%" }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                animate={{
                  x: Math.cos((i / 6) * Math.PI * 2) * 120,
                  y: Math.sin((i / 6) * Math.PI * 2) * 120,
                  opacity: 0,
                  scale: 1.4,
                }}
                transition={{ duration: 1 }}
              >
                ✨
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* sound waves escaping more as cracks grow */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-violet-400/60"
          style={{
            left: "50%",
            top: "58%",
            width: 100,
            height: 100,
            marginLeft: -50,
            marginTop: -50,
            opacity: 0.3 + ratio * 0.5,
          }}
          animate={{ scale: [0.5, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.55, ease: "easeOut" }}
        />
      ))}

      <SparkleBurst tick={lastTick} x="50%" y="40%" />
      {celebrating && <Confetti />}
    </div>
  );
};

const EchoCharacter = ({ free }: { free: boolean }) => (
  <svg width="90" height="90" viewBox="0 0 100 100">
    <circle cx="50" cy="55" r="32" fill="#a78bfa" stroke="#5b21b6" strokeWidth="2" />
    {/* ears */}
    <path d="M22 32 L18 12 L36 24 Z" fill="#7c3aed" />
    <path d="M78 32 L82 12 L64 24 Z" fill="#7c3aed" />
    {/* eyes */}
    <circle cx="40" cy="50" r="4.5" fill="#1f2937" />
    <circle cx="60" cy="50" r="4.5" fill="#1f2937" />
    <circle cx="41.5" cy="48.5" r="1.4" fill="white" />
    <circle cx="61.5" cy="48.5" r="1.4" fill="white" />
    {/* mouth */}
    {free ? (
      <path d="M36 66 Q50 84 64 66" stroke="#3b0764" strokeWidth="3.5" fill="#fda4af" strokeLinecap="round" />
    ) : (
      <rect x="40" y="64" width="20" height="5" rx="2" fill="#3b0764" />
    )}
    {/* cheeks */}
    <circle cx="32" cy="62" r="4" fill="#fb7185" opacity="0.7" />
    <circle cx="68" cy="62" r="4" fill="#fb7185" opacity="0.7" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────
// Confetti for celebration moments
// ─────────────────────────────────────────────────────────────────────
const Confetti = () => {
  const pieces = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    i,
    left: Math.random() * 100,
    color: ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc", "#fb7185"][i % 6],
    delay: Math.random() * 0.6,
    rotate: Math.random() * 360,
  })), []);
  return (
    <>
      {pieces.map((p) => (
        <motion.div
          key={p.i}
          className="absolute"
          style={{ left: `${p.left}%`, top: "-5%", width: 10, height: 14, background: p.color, transform: `rotate(${p.rotate}deg)`, borderRadius: 2 }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: "100vh", opacity: [0, 1, 1, 0], rotate: p.rotate + 360 }}
          transition={{ duration: 3.5, delay: p.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────
function interpolateColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
