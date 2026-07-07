// Pre-K in-level story scene. Replaces the K-12 "battle row" (enemy + knight)
// for worlds 101/102/103. Yubi the Owl is the main character on screen; the
// child's voice is what advances the scene. Each correct word ticks `progress`
// forward and a visible scene beat plays out — sleepy houses light up, Bobo
// bounces higher, Echo's bubble cracks, etc. No before/after overlays.

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { YubiOwl } from "./YubiOwl";

interface Props {
  worldId: number;
  progress: number;    // number of words/phrases read correctly so far
  total: number;       // total words/phrases in this level
  celebrating: boolean; // allDone — show big payoff
  lastTick: number;    // increments on every correct read → triggers burst
}

export const YubiPreKStoryScene = ({ worldId, progress, total, celebrating, lastTick }: Props) => {
  if (worldId === 101) return <SleepyVillageScene progress={progress} total={total} celebrating={celebrating} lastTick={lastTick} />;
  if (worldId === 102) return <BoboBounceScene progress={progress} total={total} celebrating={celebrating} lastTick={lastTick} />;
  if (worldId === 103) return <EchoBubbleScene progress={progress} total={total} celebrating={celebrating} lastTick={lastTick} />;
  return null;
};

// ─────────────────────────────────────────────────────────────────────
// Shared: floating Yubi (owl) that reacts to ticks
// ─────────────────────────────────────────────────────────────────────
const YubiFloater = ({ lastTick, size = 110, x = "50%", y = "30%", mood = "happy" as const }: {
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
      <YubiOwl size={size} mood={mood} />
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
// WORLD 101 — Sleepy Yubi Village
// As the child reads, the sky brightens, houses light up one at a time,
// and the sun rises. Yubi flutters across the village cheering.
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

      {/* Yubi fluttering across — moves with progress */}
      <YubiFloater
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
// WORLD 102 — Yubi Flies to the Moon
// Each correct word flaps Yubi's wings and lifts him higher in the sky
// toward a glowing moon. By the end he reaches it and the moon smiles.
// ─────────────────────────────────────────────────────────────────────
const BoboBounceScene = ({ progress, total, celebrating, lastTick }: Omit<Props, "worldId">) => {
  const ratio = total > 0 ? Math.min(1, progress / total) : 0;
  // Yubi's vertical position: starts low (10%) and climbs to the moon (~78%)
  const yubiY = `${88 - ratio * 68}%`;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border-2 border-white/60 shadow-inner"
      style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #6d28d9 55%, #fb923c 100%)" }}
    >
      {/* Stars in the night sky */}
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white"
          style={{
            left: `${(i * 67) % 92 + 4}%`,
            top: `${(i * 41) % 55 + 4}%`,
            fontSize: 10 + (i % 4) * 4,
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
        >
          ✦
        </motion.div>
      ))}

      {/* The moon — Yubi's goal. Grows + smiles as Yubi gets closer. */}
      <motion.div
        className="absolute"
        style={{ left: "50%", top: "12%", transform: "translateX(-50%)" }}
        animate={{ scale: 1 + ratio * 0.25, y: [0, -4, 0] }}
        transition={{ scale: { duration: 0.8 }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
      >
        <svg width="110" height="110" viewBox="0 0 110 110">
          <defs>
            <radialGradient id="moonGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#fff7d6" />
              <stop offset="70%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="rgba(253,230,138,0)" />
            </radialGradient>
          </defs>
          <circle cx="55" cy="55" r="55" fill="url(#moonGlow)" opacity={0.4 + ratio * 0.5} />
          <circle cx="55" cy="55" r="34" fill="#fef9c3" stroke="#eab308" strokeWidth="2" />
          {/* moon craters */}
          <circle cx="44" cy="48" r="4" fill="#fde68a" opacity="0.7" />
          <circle cx="66" cy="60" r="3" fill="#fde68a" opacity="0.7" />
          <circle cx="58" cy="42" r="2" fill="#fde68a" opacity="0.7" />
          {/* eyes that open as Yubi approaches */}
          {ratio > 0.3 && (
            <>
              <circle cx="46" cy="52" r="2" fill="#1f2937" />
              <circle cx="64" cy="52" r="2" fill="#1f2937" />
            </>
          )}
          {/* smile that appears at the end */}
          {ratio > 0.7 && (
            <path d="M44 64 Q55 74 66 64" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
        </svg>
      </motion.div>

      {/* Drifting clouds Yubi passes through */}
      {[20, 70].map((left, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${left}%`, top: `${30 + i * 25}%` }}
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 7 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="70" height="34" viewBox="0 0 80 40">
            <ellipse cx="40" cy="22" rx="32" ry="14" fill="white" opacity="0.55" />
            <ellipse cx="22" cy="24" rx="14" ry="10" fill="white" opacity="0.55" />
            <ellipse cx="58" cy="24" rx="16" ry="10" fill="white" opacity="0.55" />
          </svg>
        </motion.div>
      ))}

      {/* Trail of feathers / sparkles showing where Yubi has been */}
      {Array.from({ length: progress }).map((_, i) => (
        <motion.div
          key={`trail-${i}`}
          className="absolute text-yellow-200"
          style={{
            left: `${42 + ((i * 7) % 18) - 9}%`,
            top: `${82 - (i / Math.max(1, total)) * 60}%`,
            fontSize: 16,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.9, 0.5], scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          ✦
        </motion.div>
      ))}

      {/* YUBI — the hero, climbing the sky */}
      <motion.div
        className="absolute"
        style={{ left: "50%", transform: "translate(-50%, -50%)" }}
        animate={{ top: yubiY }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <motion.div
          key={`yubi-flap-${lastTick}`}
          animate={{ y: [0, -10, 0, -6, 0], rotate: [0, -6, 6, -4, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <YubiOwl size={celebrating ? 130 : 110} mood={celebrating ? "cheer" : "happy"} />
        </motion.div>
        {/* Flap lines */}
        <motion.div
          key={`flap-${lastTick}`}
          className="absolute -left-6 top-1/2 text-white/80 text-xl"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: [0, 1, 0], x: -10 }}
          transition={{ duration: 0.6 }}
        >
          ≈
        </motion.div>
        <motion.div
          key={`flap2-${lastTick}`}
          className="absolute -right-6 top-1/2 text-white/80 text-xl"
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: [0, 1, 0], x: 10 }}
          transition={{ duration: 0.6 }}
        >
          ≈
        </motion.div>
      </motion.div>

      <SparkleBurst tick={lastTick} x="50%" y={yubiY} />
      {celebrating && <Confetti />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// WORLD 103 — Yubi's Voice Wakes the Night
// Yubi's hoot starts tiny. Each correct word makes his sound waves
// grow bigger until they fill the whole sky and stars sparkle in time.
// ─────────────────────────────────────────────────────────────────────
const EchoBubbleScene = ({ progress, total, celebrating, lastTick }: Omit<Props, "worldId">) => {
  const ratio = total > 0 ? Math.min(1, progress / total) : 0;
  // How many concentric song rings to show
  const rings = Math.max(1, Math.min(5, progress + 1));
  // Sky brightens with Yubi's growing song
  const skyTop = interpolateColor("#1e1b4b", "#312e81", ratio);
  const skyBot = interpolateColor("#4c1d95", "#a78bfa", ratio);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border-2 border-white/60 shadow-inner"
      style={{ background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBot} 100%)` }}
    >
      {/* Stars that pulse to Yubi's song */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-100"
          style={{
            left: `${(i * 59) % 94 + 3}%`,
            top: `${(i * 37) % 70 + 4}%`,
            fontSize: 10 + (i % 4) * 5,
          }}
          animate={{
            opacity: [0.3, 0.4 + ratio * 0.6, 0.3],
            scale: [1, 1 + ratio * 0.4, 1],
          }}
          transition={{ duration: 1.6 + (i % 3) * 0.4, repeat: Infinity, delay: i * 0.1 }}
        >
          ★
        </motion.div>
      ))}

      {/* A friendly listening tree at the bottom that lights up */}
      <svg
        className="absolute"
        style={{ left: "8%", bottom: "8%" }}
        width="80"
        height="120"
        viewBox="0 0 80 120"
      >
        <rect x="34" y="70" width="12" height="50" fill="#78350f" rx="2" />
        <circle cx="40" cy="60" r="34" fill={ratio > 0.3 ? "#34d399" : "#065f46"} />
        {ratio > 0.5 && <circle cx="32" cy="54" r="3" fill="#fef3c7" />}
        {ratio > 0.5 && <circle cx="48" cy="58" r="3" fill="#fef3c7" />}
      </svg>
      <svg
        className="absolute"
        style={{ right: "8%", bottom: "8%" }}
        width="70"
        height="100"
        viewBox="0 0 80 120"
      >
        <rect x="34" y="70" width="12" height="50" fill="#78350f" rx="2" />
        <circle cx="40" cy="60" r="32" fill={ratio > 0.6 ? "#34d399" : "#065f46"} />
        {ratio > 0.7 && <circle cx="40" cy="56" r="3" fill="#fef3c7" />}
      </svg>

      {/* SONG RINGS — emanate from Yubi, grow with progress */}
      <div className="absolute" style={{ left: "50%", top: "52%", transform: "translate(-50%, -50%)" }}>
        {Array.from({ length: rings }).map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full border-[3px] border-yellow-200"
            style={{
              left: "50%",
              top: "50%",
              width: 80 + i * 40,
              height: 80 + i * 40,
              marginLeft: -(80 + i * 40) / 2,
              marginTop: -(80 + i * 40) / 2,
              opacity: 0.5,
            }}
            animate={{ scale: [0.6, 1.4], opacity: [0.7, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* YUBI — the singer, glowing with his song */}
      <motion.div
        className="absolute"
        style={{ left: "50%", top: "52%", transform: "translate(-50%, -50%)" }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* glow halo grows with progress */}
        <div
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 120 + ratio * 80,
            height: 120 + ratio * 80,
            background: "radial-gradient(circle, rgba(254,240,138,0.55) 0%, rgba(254,240,138,0) 70%)",
          }}
        />
        <motion.div
          key={`yubi-sing-${lastTick}`}
          animate={{ scale: [1, 1.18, 1], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <YubiOwl size={celebrating ? 140 : 120} mood={celebrating ? "cheer" : "happy"} />
        </motion.div>
        {/* Music notes popping out per tick */}
        <AnimatePresence>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`note-${lastTick}-${i}`}
              className="absolute text-yellow-100 font-bold"
              style={{ left: "50%", top: "30%", fontSize: 22 + i * 4 }}
              initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: (i - 1) * 50,
                y: -60 - i * 10,
                rotate: (i - 1) * 20,
              }}
              transition={{ duration: 1.2, delay: i * 0.1 }}
            >
              ♪
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <SparkleBurst tick={lastTick} x="50%" y="38%" />
      {celebrating && <Confetti />}
    </div>
  );
};


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
