/**
 * Castle Swarm — Boss Spell-Break Minigame
 *
 * On boss waves the boss "casts an incantation": a sequence of 4 short words.
 * The player must read them aloud in order before a timer runs out. Reuses
 * RPGWordReader in `mode="fast"` so we don't add any new mic stack.
 *
 *   - Success → onResult(true, wordsRead) — caller deals heavy boss damage.
 *   - Timeout → onResult(false, wordsRead) — caller damages the player castle.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { RPGWordReader } from "../rpg/RPGWordReader";
import { playChantBroken, playBossLaugh } from "./sfx";

export type SpellBreakGradeBand = "K-2" | "3-5" | "6-12";

interface Props {
  words: string[];                                       // exactly 4 short words
  durationMs?: number;                                   // overrides gradeBand default
  gradeBand?: SpellBreakGradeBand;
  phonemeLabel?: string;                                 // e.g. "/sh/"
  onResult: (broken: boolean, wordsRead: number) => void;
}

const DURATION_BY_BAND: Record<SpellBreakGradeBand, number> = {
  "K-2": 7000,
  "3-5": 6000,
  "6-12": 5000,
};

export const BossSpellBreak = ({ words, durationMs, gradeBand = "3-5", phonemeLabel, onResult }: Props) => {
  const effectiveDuration = durationMs ?? DURATION_BY_BAND[gradeBand];
  const [readCount, setReadCount] = useState(0);
  const [revealCount, setRevealCount] = useState(0);
  const [now, setNow] = useState(() => performance.now());
  const startedAtRef = useRef(performance.now());
  const settledRef = useRef(false);
  const readCountRef = useRef(0);

  // Reveal words one-by-one (letter-card stagger) for kid-friendly drama.
  useEffect(() => {
    const id = window.setInterval(() => {
      setRevealCount(c => (c < words.length ? c + 1 : c));
    }, 280);
    return () => clearInterval(id);
  }, [words.length]);

  // Keep latest onResult in a ref so parent re-renders never restart the RAF.
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  // Ticking timer + auto-fail on timeout.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = performance.now();
      setNow(t);
      if (settledRef.current) return;
      if (t - startedAtRef.current >= effectiveDuration) {
        settledRef.current = true;
        playBossLaugh();
        onResultRef.current(false, readCountRef.current);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [effectiveDuration]);

  const remainingMs = Math.max(0, effectiveDuration - (now - startedAtRef.current));
  const remainingPct = Math.max(0, Math.min(1, remainingMs / effectiveDuration));
  const ringColor =
    remainingPct > 0.5 ? "stroke-cyan-300"
    : remainingPct > 0.2 ? "stroke-amber-300"
    : "stroke-rose-400";

  const handleResult = (correct: boolean, _spoken: string, wordIndex: number) => {
    if (settledRef.current) return;
    if (!correct) return; // misses don't end the chant — keep trying
    if (wordIndex !== readCountRef.current) return; // out-of-order; ignore
    readCountRef.current += 1;
    setReadCount(readCountRef.current);
    if (readCountRef.current >= words.length) {
      settledRef.current = true;
      playChantBroken();
      // Small celebratory delay so the user sees the last card shatter.
      setTimeout(() => onResultRef.current(true, readCountRef.current), 350);
    }
  };

  // Feed words to the reader — the reader internally tracks its own index;
  // we accept correct hits only when they match the next-required word.
  const readerWords = useMemo(() => words, [words]);

  const circumference = 2 * Math.PI * 28;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      aria-label="Boss spell-break"
    >
      {/* Pulsing red rim — "something big is happening" tell */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ boxShadow: ["inset 0 0 40px rgba(244,63,94,0.4)", "inset 0 0 90px rgba(244,63,94,0.7)", "inset 0 0 40px rgba(244,63,94,0.4)"] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />

      <div className="relative flex items-center gap-3 mb-2">
        <Sparkles className="w-5 h-5 text-rose-300 animate-pulse" />
        <h2 className="text-rose-100 font-black text-lg sm:text-2xl tracking-widest drop-shadow uppercase">
          Break the Chant!
        </h2>
        <Sparkles className="w-5 h-5 text-rose-300 animate-pulse" />
      </div>

      {phonemeLabel && (
        <div className="relative mb-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-300/70 text-amber-100 text-xs sm:text-sm font-bold tracking-wider">
          Hunt for <span className="text-amber-300 font-black">{phonemeLabel}</span>
        </div>
      )}

      {/* Timer ring */}
      <div className="relative mb-3">
        <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
          <circle cx="34" cy="34" r="28" className="stroke-slate-700/70" strokeWidth="6" fill="none" />
          <circle
            cx="34" cy="34" r="28"
            className={`${ringColor} transition-colors`}
            strokeWidth="6" fill="none" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - remainingPct)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-white font-black text-lg">
          {Math.ceil(remainingMs / 1000)}
        </div>
      </div>

      {/* Word cards */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4 max-w-full">
        <AnimatePresence>
          {words.map((w, i) => {
            const revealed = i < revealCount;
            const isDone = i < readCount;
            const isActive = i === readCount && revealed;
            return (
              <motion.div
                key={`${w}-${i}`}
                initial={{ scale: 0.5, opacity: 0, y: 10 }}
                animate={
                  isDone
                    ? { scale: [1, 1.25, 0], opacity: [1, 1, 0], rotate: [0, -8, 12] }
                    : revealed
                    ? { scale: 1, opacity: 1, y: 0 }
                    : { scale: 0.5, opacity: 0, y: 10 }
                }
                transition={{ duration: isDone ? 0.45 : 0.3 }}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg border-2 font-black text-base sm:text-2xl tracking-wider shadow-lg select-none
                  ${isActive
                    ? "bg-amber-100 text-rose-900 border-amber-300 ring-4 ring-amber-300/60 animate-pulse"
                    : "bg-stone-100 text-rose-950 border-stone-400"}`}
              >
                {w}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Word reader (compact, fast mode) */}
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-rose-700/60 p-1.5">
        <RPGWordReader
          key={`spell-break-${startedAtRef.current}`}
          words={readerWords}
          onResult={handleResult}
          batchSize={readerWords.length}
          enableEchoRetry={false}
          mode="fast"
          compact
        />
      </div>

      <p className="mt-2 text-rose-200/80 text-xs sm:text-sm font-semibold tracking-wide">
        Read all {words.length} words aloud — fast!
      </p>
    </motion.div>
  );
};
