// Pre-K obstacle-adventure experience for Benny the Dog.
//
// Loop (Dora-style):
//   1. Scene shows an obstacle (Benny reacts).
//   2. Benny says the problem + asks for help (spoken aloud).
//   3. A single big WORD card appears — the SOLUTION word.
//   4. The child reads the word into the mic. (After 2 misses a giant
//      "Tap to continue" button appears so a broken mic is never a dead end.
//      After 3 misses we auto-pass with a kind line.)
//   5. Solution emoji animates in, obstacle is solved (sparkle + chime).
//   6. Benny cheers, hops forward, next obstacle appears.
//   7. After all obstacles: a big celebration screen + onComplete.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NabuScene } from "./NabuScene";
import { RPGWordReader } from "./RPGWordReader";
import { getPreKAdventure, type PreKAdventure } from "@/data/preKAdventures";
import riverStreamVideo from "@/assets/river-stream-bg.mp4.asset.json";
import riverStreamPoster from "@/assets/river-stream-poster.jpg.asset.json";
import { speak, speakWordPolite } from "@/lib/tts";
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
  goal: "Adventure with Benny!",
  endingEmoji: "🎉",
  endingLine: "We did it!",
  endingSky: "from-amber-200 via-rose-200 to-pink-200",
  obstacles: [],
};

// ── Tiny Web Audio sound helpers (no asset loading needed) ──────────────────
let audioCtx: AudioContext | null = null;
const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch { return null; }
  }
  return audioCtx;
};
const playTone = (freqs: number[], durMs = 220, type: OscillatorType = "sine", gainVal = 0.18) => {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(gainVal, now + i * 0.08 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + durMs / 1000);
    o.connect(g).connect(ctx.destination);
    o.start(now + i * 0.08);
    o.stop(now + i * 0.08 + durMs / 1000 + 0.05);
  });
};
const playChime = () => playTone([784, 988, 1319], 260, "triangle", 0.15); // G5-B5-E6
const playBonk = () => playTone([220, 165], 180, "sine", 0.12);
const playSparkle = () => playTone([1568, 1976, 2349], 140, "sine", 0.08);

// Ensure keyframes for sparkle burst.
const SPARKLE_STYLE_ID = "prek-sparkle-keyframes";
const ensureSparkleStyle = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(SPARKLE_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = SPARKLE_STYLE_ID;
  el.textContent = `
@keyframes prek-sparkle-pop {
  0%   { transform: scale(0.2) rotate(0deg); opacity: 0; }
  35%  { transform: scale(1.4) rotate(120deg); opacity: 1; }
  100% { transform: scale(2.2) rotate(220deg); opacity: 0; }
}
@keyframes prek-mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(244,114,182,0.55); }
  50%      { box-shadow: 0 0 0 18px rgba(244,114,182,0); }
}
@keyframes prek-hear-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}
`;
  document.head.appendChild(el);
};

const MAX_ATTEMPTS = 3;

export const NabuAdventure = ({ world, level, onBack, onComplete }: Props) => {
  const adventure = useMemo<PreKAdventure>(
    () => getPreKAdventure(world.id, level.id) ?? FALLBACK,
    [world.id, level.id]
  );
  const total = adventure.obstacles.length;

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [correct, setCorrect] = useState(0);
  const [bennyMood, setBennyMood] = useState<"idle" | "walk" | "jump" | "celebrate" | "sad" | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const wasAutoPassedRef = useRef(false);
  const timers = useRef<number[]>([]);
  const moodTimer = useRef<number | null>(null);

  useEffect(() => { ensureSparkleStyle(); }, []);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  const queue = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => () => clearTimers(), []);
  useEffect(() => {
    clearTimers();
    setIndex(0);
    setCorrect(0);
    setAttempts(0);
    setPhase("intro");
  }, [world.id, level.id]);

  // Reset attempt counter whenever the obstacle changes.
  useEffect(() => { setAttempts(0); wasAutoPassedRef.current = false; }, [index]);

  const current = adventure.obstacles[index];

  // ── Phase driver: tightened pacing ─────────────────────────────────────────
  useEffect(() => {
    if (!current && phase !== "ending") return;

    // Single fixed voice profile so Benny sounds like Benny in every phase.
    const BENNY = { rate: 0.95, pitch: 1.15 } as const;

    if (phase === "intro") {
      // Goal already names Benny — don't double-say it.
      speak(adventure.goal, BENNY);
      queue(() => setPhase("problem"), 2000);
      return;
    }
    if (phase === "problem") {
      speak(current.problemLine, BENNY);
      queue(() => setPhase("ask"), 2200);
      return;
    }
    if (phase === "ask") {
      speak(current.askLine, BENNY);
      // Tight gap so the WORD card appears right after the cloze stem and
      // the child can complete the sentence without losing it.
      queue(() => setPhase("reading"), 900);
      return;
    }
    if (phase === "reading") {
      // Do NOT auto-pronounce the target word. The kid should attempt it
      // cold by reading the letters. Pronunciation is only offered as a
      // scaffold after the 2nd miss, or via the "Hear it" button.
      return;
    }
    if (phase === "solved") {
      // Let the sparkle/chime play first, then narrate the success line so
      // they don't all hit the ear in the same 200ms.
      const line = wasAutoPassedRef.current
        ? "Nice try! Let's keep going!"
        : current.successLine;
      queue(() => speak(line, BENNY), 350);
      queue(() => setPhase("transition"), 2000);
      return;
    }
    if (phase === "transition") {
      queue(() => {
        const next = index + 1;
        if (next >= total) {
          setPhase("ending");
        } else {
          setIndex(next);
          setPhase("problem");
        }
      }, 2600);
      return;
    }
    if (phase === "ending") {
      speak(adventure.endingLine, BENNY);
      queue(() => {
        const stars = correct >= total ? 3 : correct >= Math.ceil(total * 0.7) ? 2 : 1;
        onComplete({ wordsRead: total, correctWords: correct, stars });
      }, 2600);
      return;
    }
  }, [phase, index]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mood + reward FX ───────────────────────────────────────────────────────
  const flashMood = useCallback((m: "celebrate" | "sad", ms: number) => {
    setBennyMood(m);
    if (moodTimer.current) window.clearTimeout(moodTimer.current);
    moodTimer.current = window.setTimeout(() => setBennyMood(null), ms);
  }, []);

  const triggerWin = useCallback((autoPassed: boolean) => {
    wasAutoPassedRef.current = autoPassed;
    if (!autoPassed) {
      setCorrect((c) => c + 1);
      playChime();
      playSparkle();
      setShowSparkle(true);
      window.setTimeout(() => setShowSparkle(false), 700);
    }
    flashMood("celebrate", 1800);
    setPhase("solved");
  }, [flashMood]);

  const handleResult = useCallback(
    (isCorrect: boolean) => {
      if (phase !== "reading") return;
      if (isCorrect) {
        triggerWin(false);
      } else {
        playBonk();
        flashMood("sad", 1200);
        setAttempts((a) => {
          const next = a + 1;
          if (next >= MAX_ATTEMPTS) {
            // Auto-pass so the kid is never stuck.
            window.setTimeout(() => triggerWin(true), 600);
          } else if (next === 2) {
            // Scaffold on 2nd miss: model the word for them to echo.
            window.setTimeout(() => speakWordPolite(current.word, 1200), 500);
          }
          return next;
        });
      }
    },
    [phase, flashMood, triggerWin]
  );

  const handleSkip = () => triggerWin(true);
  const handleTapContinue = () => triggerWin(true);
  const handleHearWord = () => current && speakWordPolite(current.word, 300);
  const handleReplayBubble = (line: string) =>
    speak(line, { rate: 0.95, pitch: 1.15 });

  // ── Render ─────────────────────────────────────────────────────────────────
  const scene = current ?? adventure.obstacles[0];
  const skyClass = phase === "ending" ? adventure.endingSky : scene?.sky ?? FALLBACK.endingSky;
  const showWord = phase === "reading";
  const scenePhase = phase === "intro" ? "problem" : phase === "ending" ? "solved" : phase;
  // Show the warm "Tap to continue" after the first miss so a stuck kid is
  // never further than one tap from progress.
  const showTapFallback = phase === "reading" && attempts >= 1;
  const currentBubble =
    phase === "problem" ? scene?.problemLine :
    phase === "ask" ? scene?.askLine :
    phase === "solved" ? (wasAutoPassedRef.current ? "Great try! Let's keep going!" : scene?.successLine) :
    null;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-3xl shadow-xl">
      <div className={`absolute inset-0 bg-gradient-to-b ${skyClass}`} />

      {scene && phase !== "ending" && (
        <NabuScene
          word={scene.word}
          phase={scenePhase as "problem" | "ask" | "reading" | "solved" | "transition"}
          index={index}
          mood={bennyMood}
          solutionEmoji={scene.solutionEmoji}
        />
      )}

      <div className="relative z-10 flex h-full min-h-0 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-800 hover:bg-white/60">
            <ArrowLeft className="h-4 w-4 mr-1" /> Map
          </Button>
          <div className="truncate rounded-full bg-white/95 px-4 py-1.5 text-sm sm:text-base font-extrabold text-slate-800 shadow">
            {adventure.goal}
          </div>
          {phase === "reading" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-slate-700 hover:bg-white/60"
              aria-label="Skip this word"
            >
              <SkipForward className="h-4 w-4 mr-1" /> Skip
            </Button>
          ) : (
            <div className="w-[68px]" />
          )}
        </div>

        {/* ── Stage overlay (speech + progress + sparkle) ───────────────── */}
        <div className="relative flex min-h-0 flex-1 items-end justify-center">
          {/* Sparkle burst on correct */}
          {showSparkle && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl"
                 style={{ animation: "prek-sparkle-pop 0.7s ease-out forwards" }}>
              ✨
            </div>
          )}

          {phase === "ending" ? (
            <motion.div
              key="ending"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [0.7, 1.15, 1], opacity: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="flex flex-col items-center gap-3 pb-10"
            >
              <div className="rounded-3xl bg-white/95 px-8 py-6 text-center shadow-2xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                  {adventure.endingLine}
                </div>
                <div className="mt-3 flex justify-center gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + i * 0.25, type: "spring", stiffness: 220 }}
                      onAnimationStart={() => i === 0 && playChime()}
                    >
                      <span className="text-5xl">⭐</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Speech bubble — tap to replay */}
              <AnimatePresence mode="wait">
                {currentBubble && (
                  <motion.button
                    key={`bubble-${index}-${phase}`}
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleReplayBubble(currentBubble)}
                    className="absolute top-3 left-1/2 -translate-x-1/2 w-[min(540px,82%)] cursor-pointer"
                    aria-label="Replay line"
                  >
                    <div className="relative flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-center text-base sm:text-lg font-bold text-slate-800 shadow-xl">
                      <Volume2 className="h-4 w-4 flex-shrink-0 text-slate-500" />
                      <span className="flex-1">{currentBubble}</span>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Progress dots — bigger, juicier */}
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {adventure.obstacles.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: i === index ? 1.15 : 1 }}
                    className={`h-3 rounded-full transition-all ${
                      i < correct
                        ? "w-8 bg-gradient-to-r from-emerald-400 to-emerald-600 shadow"
                        : i === index
                        ? "w-8 bg-slate-700/80"
                        : "w-3 bg-white/70"
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
                  <div className="mt-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600">
                    <Mic className="h-3 w-3" /> Your turn!
                  </div>
                  <button
                    onClick={handleHearWord}
                    className="absolute -top-5 right-3 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg ring-4 ring-sky-200 hover:bg-sky-600"
                    style={{ animation: "prek-hear-pulse 1.4s ease-in-out infinite" }}
                    aria-label="Hear the word"
                  >
                    <Volume2 className="h-7 w-7" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mic — bigger pulsing affordance + tap-fallback after 2 misses */}
            {showWord && current && (
              <div
                className="rounded-2xl bg-white/90 p-2 shadow-inner backdrop-blur-sm sm:p-3"
                style={{ animation: "prek-mic-pulse 1.6s ease-in-out infinite" }}
              >
                <RPGWordReader
                  key={`prek-adv-${world.id}-${level.id}-${index}`}
                  words={[current.word]}
                  onResult={(c) => handleResult(c)}
                  onBatchComplete={() => { /* size-1 batch */ }}
                  disabled={false}
                  streak={0}
                  batchSize={1}
                  enableEchoRetry={true}
                  mode="fast"
                  compact
                  autoStart={true}
                />
                {showTapFallback && (
                  <button
                    onClick={handleTapContinue}
                    className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-3 text-base font-extrabold text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition"
                  >
                    Tap here to continue →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
