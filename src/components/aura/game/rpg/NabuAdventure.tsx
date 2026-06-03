// Pre-K obstacle-adventure experience for Nabu the Owl.
//
// Loop (Dora-style):
//   1. Scene shows an obstacle (Nabu reacts emotionally).
//   2. Nabu says the problem + asks for help (spoken aloud).
//   3. A single big WORD card appears — the SOLUTION word.
//   4. The child reads the word into the mic.
//   5. Solution emoji animates in, obstacle is solved.
//   6. Nabu cheers, hops forward, next obstacle appears.
//   7. After all obstacles: a big celebration screen + onComplete.
//
// Every word is the literal tool that solves a visible problem — never a
// quiz, never a sight-word drill.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NabuOwl } from "./NabuOwl";
import { RPGWordReader } from "./RPGWordReader";
import { getPreKAdventure, type PreKAdventure } from "@/data/preKAdventures";
import { speak } from "@/lib/tts";
import { playCorrectPronunciation } from "@/lib/pronunciationPlayer";
import type { CampaignWorld } from "@/lib/campaignData";
import type { CampaignLevel } from "./RPGLevelSelect";

interface Props {
  world: CampaignWorld;
  level: CampaignLevel;
  onBack: () => void;
  onComplete: (stats: { wordsRead: number; correctWords: number; stars: number }) => void;
}

type Phase = "intro" | "problem" | "ask" | "reading" | "solved" | "transition" | "ending";

const FALLBACK: PreKAdventure = {
  goal: "Adventure with Nabu!",
  endingEmoji: "🎉",
  endingLine: "We did it!",
  endingSky: "from-amber-200 via-rose-200 to-pink-200",
  obstacles: [],
};

export const NabuAdventure = ({ world, level, onBack, onComplete }: Props) => {
  const adventure = useMemo<PreKAdventure>(
    () => getPreKAdventure(world.id, level.id) ?? FALLBACK,
    [world.id, level.id]
  );
  const total = adventure.obstacles.length;

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [correct, setCorrect] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  const queue = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => () => clearTimers(), []);
  useEffect(() => {
    // Reset on level change
    clearTimers();
    setIndex(0);
    setCorrect(0);
    setPhase("intro");
  }, [world.id, level.id]);

  const current = adventure.obstacles[index];

  // ── Phase driver: speak Nabu's lines and advance scripted beats ────────────
  useEffect(() => {
    if (!current && phase !== "ending") return;

    if (phase === "intro") {
      speak(adventure.goal, { rate: 0.95, pitch: 1.15 });
      queue(() => setPhase("problem"), 1800);
      return;
    }
    if (phase === "problem") {
      speak(current.problemLine, { rate: 0.95, pitch: 1.15 });
      queue(() => setPhase("ask"), 2200);
      return;
    }
    if (phase === "ask") {
      speak(current.askLine, { rate: 0.95, pitch: 1.2 });
      queue(() => setPhase("reading"), 1800);
      return;
    }
    if (phase === "solved") {
      speak(current.successLine, { rate: 1, pitch: 1.3 });
      queue(() => setPhase("transition"), 1800);
      return;
    }
    if (phase === "transition") {
      // Nabu hops forward, next obstacle (or ending) takes over.
      const next = index + 1;
      if (next >= total) {
        setPhase("ending");
      } else {
        setIndex(next);
        setPhase("problem");
      }
      return;
    }
    if (phase === "ending") {
      speak(adventure.endingLine, { rate: 0.95, pitch: 1.25 });
      queue(() => {
        const stars = correct >= total ? 3 : correct >= Math.ceil(total * 0.7) ? 2 : 1;
        onComplete({ wordsRead: total, correctWords: correct, stars });
      }, 2600);
      return;
    }
    // 'reading' is mic-driven (no auto-advance)
  }, [phase, index]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mic result handling ────────────────────────────────────────────────────
  const handleResult = useCallback(
    (isCorrect: boolean) => {
      if (phase !== "reading") return;
      if (isCorrect) {
        setCorrect((c) => c + 1);
        setPhase("solved");
      }
      // If incorrect, RPGWordReader handles echo/retry; we stay in reading.
    },
    [phase]
  );

  const handleBatchComplete = useCallback(() => {
    // Word batch is size 1 — solved/transition handles flow.
  }, []);

  const handleHearWord = () => {
    if (current) playCorrectPronunciation(current.word);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const scene = current ?? adventure.obstacles[0];
  const skyClass = phase === "ending" ? adventure.endingSky : scene?.sky ?? FALLBACK.endingSky;
  const groundClass = scene?.ground ?? "from-emerald-400 to-emerald-600";
  const showWord = phase === "reading";
  const showSolution = phase === "solved" || phase === "transition";
  const nabuMood: "happy" | "curious" | "cheer" =
    phase === "problem" ? "curious" :
    phase === "solved" || phase === "ending" || phase === "transition" ? "cheer" :
    "happy";

  const placement = scene?.solutionPlacement ?? "over";

  return (
    <div
      className={`relative h-full min-h-0 w-full overflow-hidden rounded-3xl bg-gradient-to-b ${skyClass} shadow-xl`}
    >
      {/* Soft cloud decor */}
      <div className="pointer-events-none absolute inset-0 opacity-50 select-none">
        <div className="absolute top-3 left-8 text-3xl">☁️</div>
        <div className="absolute top-10 right-12 text-2xl">☁️</div>
      </div>
      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 h-[26%] bg-gradient-to-t ${groundClass}`}
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-800 hover:bg-white/40">
            <ArrowLeft className="h-4 w-4 mr-1" /> Map
          </Button>
          <div className="truncate rounded-full bg-white/85 px-3 py-1 text-sm sm:text-base font-extrabold text-slate-800 shadow">
            {adventure.goal}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-amber-700 shadow">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            {correct}/{total}
          </div>
        </div>

        {/* ── Stage ─────────────────────────────────────────────────────── */}
        <div className="relative flex min-h-0 flex-1 items-end justify-center">
          {/* Ending celebration takes over the whole stage */}
          {phase === "ending" ? (
            <motion.div
              key="ending"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [0.7, 1.15, 1], opacity: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="flex flex-col items-center gap-3 pb-10"
            >
              <div className="text-7xl sm:text-8xl drop-shadow-lg">{adventure.endingEmoji}</div>
              <div className="rounded-2xl bg-white/95 px-6 py-3 text-center text-xl sm:text-2xl font-extrabold text-emerald-700 shadow-xl">
                {adventure.endingLine}
              </div>
              <div className="flex gap-3 text-3xl sm:text-4xl">
                <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }}>🎉</motion.span>
                <motion.span animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}>✨</motion.span>
                <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>🎊</motion.span>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Obstacle visual (left/centered) */}
              <AnimatePresence mode="wait">
                {scene && phase !== "transition" && (
                  <motion.div
                    key={`obstacle-${index}`}
                    initial={{ opacity: 0, scale: 0.6, x: 40 }}
                    animate={{ opacity: showSolution && placement === "replace" ? 0 : 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute bottom-[18%] right-[14%] text-[88px] sm:text-[120px] drop-shadow-xl select-none"
                  >
                    {scene.sceneEmoji}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Solution emoji animation */}
              <AnimatePresence>
                {showSolution && scene && (
                  <motion.div
                    key={`solution-${index}`}
                    initial={{
                      opacity: 0,
                      scale: 0.3,
                      y: placement === "onNabu" ? -40 : -120,
                    }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className={
                      placement === "onNabu"
                        ? "absolute bottom-[34%] left-[18%] text-6xl sm:text-7xl drop-shadow-xl select-none"
                        : "absolute bottom-[20%] right-[14%] text-[88px] sm:text-[120px] drop-shadow-xl select-none"
                    }
                  >
                    {scene.solutionEmoji}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nabu the Owl */}
              <motion.div
                key={`nabu-${index}-${phase}`}
                className="absolute bottom-[14%] left-[12%]"
                initial={{ x: 0 }}
                animate={
                  phase === "transition"
                    ? { x: 80, y: [0, -16, 0, -10, 0] }
                    : phase === "solved"
                    ? { y: [0, -18, 0, -10, 0], rotate: [0, -6, 6, -4, 0] }
                    : phase === "problem"
                    ? { x: [0, -6, 0], y: [0, -3, 0] }
                    : { y: [0, -6, 0] }
                }
                transition={
                  phase === "transition"
                    ? { duration: 1.4, ease: "easeInOut" }
                    : phase === "solved"
                    ? { duration: 1.4 }
                    : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <NabuOwl size={120} mood={nabuMood} />
              </motion.div>

              {/* Speech bubble */}
              <AnimatePresence mode="wait">
                {scene && (phase === "problem" || phase === "ask" || phase === "solved") && (
                  <motion.div
                    key={`bubble-${index}-${phase}`}
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.35 }}
                    className="absolute top-3 left-[24%] right-[24%] mx-auto max-w-[460px]"
                  >
                    <div className="relative rounded-2xl bg-white/95 px-4 py-2.5 text-center text-base sm:text-lg font-bold text-slate-800 shadow-xl">
                      {phase === "problem" ? scene.problemLine :
                       phase === "ask" ? scene.askLine :
                       scene.successLine}
                      <div className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-white/95" />
                    </div>
                  </motion.div>
                )}
                {phase === "intro" && (
                  <motion.div
                    key="intro-bubble"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-3 left-1/2 -translate-x-1/2 rounded-2xl bg-white/95 px-5 py-3 text-center text-lg sm:text-xl font-extrabold text-emerald-700 shadow-xl"
                  >
                    {adventure.goal}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress dots */}
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                {adventure.obstacles.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i < correct
                        ? "w-5 bg-emerald-500"
                        : i === index
                        ? "w-5 bg-slate-700"
                        : "w-2 bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Word card + mic ───────────────────────────────────────────── */}
        {phase !== "ending" && (
          <div className="flex flex-col gap-2">
            {/* Word card — appears only when the child needs to read */}
            <AnimatePresence mode="wait">
              {showWord && current && (
                <motion.div
                  key={`word-${index}`}
                  initial={{ scale: 0.7, opacity: 0, y: 20 }}
                  animate={{ scale: [0.7, 1.1, 1], opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  className="relative mx-auto w-full max-w-md rounded-2xl border-4 border-amber-300 bg-white px-6 py-3 text-center shadow-2xl"
                >
                  <div className="text-5xl sm:text-6xl font-black uppercase tracking-wide text-slate-900">
                    {current.word}
                  </div>
                  <div className="mt-1 text-3xl sm:text-4xl">{current.solutionEmoji}</div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleHearWord}
                    className="absolute -top-3 right-3 h-9 rounded-full px-3 shadow"
                  >
                    <Volume2 className="h-4 w-4 mr-1" /> Hear
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mic — always mounted while in 'reading' so the word is heard */}
            {showWord && current && (
              <div className="rounded-2xl bg-white/85 p-2 shadow-inner backdrop-blur-sm sm:p-3">
                <RPGWordReader
                  key={`prek-adv-${world.id}-${level.id}-${index}`}
                  words={[current.word]}
                  onResult={(c) => handleResult(c)}
                  onBatchComplete={handleBatchComplete}
                  disabled={false}
                  streak={0}
                  batchSize={1}
                  enableEchoRetry={true}
                  mode="fast"
                  compact
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
