// Pre-K Video Adventure — one <video>, one steps array, one state machine.
//
// LOOP:
//   step.kind === "clip" → play, advance on onEnded
//   step.kind === "word" → freeze last frame, speak askLine, show word card,
//                          listen on mic. On match (Web Speech) advance
//                          immediately (optimistic) AND fire the audio
//                          blob + transcript at analyze-aura in the
//                          background so the kid's read flows into the
//                          same 4-ML-model spine as every other mode.
//
// Every word is captured (where consent + MediaRecorder support exist).
// Web Speech drives gameplay so the kid never waits on a network round-trip.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getVideoLevel, type VideoLevel, type VideoStep } from "@/data/preKAdventuresVideo";
import { speak, speakWordPolite, cancelSpeech } from "@/lib/tts";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { submitPreKAuraReading } from "@/lib/preKAuraSubmit";
import { speechManager } from "@/lib/speechRecognitionManager";
import type { CampaignWorld } from "@/lib/campaignData";
import type { CampaignLevel } from "./RPGLevelSelect";

interface Props {
  world: CampaignWorld;
  level: CampaignLevel;
  onBack: () => void;
  onComplete: (stats: { wordsRead: number; correctWords: number; stars: number }) => void;
}

type Phase = "tap-to-begin" | "clip" | "ask" | "reading" | "advancing" | "ending";

const MAX_ATTEMPTS = 3;
const BENNY_VOICE = { rate: 0.95, pitch: 1.15 } as const;
const EMPTY_VIDEO_STEPS: VideoStep[] = [];

// ── tiny Web Audio sparkle/chime ─────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
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
const playChime = () => playTone([784, 988, 1319], 260, "triangle", 0.15);
const playSparkle = () => playTone([1568, 1976, 2349], 140, "sine", 0.08);

const SPARKLE_STYLE_ID = "prek-video-sparkle";
const ensureSparkleStyle = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(SPARKLE_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = SPARKLE_STYLE_ID;
  el.textContent = `
@keyframes prek-vid-sparkle { 0% { transform: scale(0.2) rotate(0); opacity: 0; }
  35% { transform: scale(1.4) rotate(120deg); opacity: 1; }
  100% { transform: scale(2.2) rotate(220deg); opacity: 0; } }`;
  document.head.appendChild(el);
};

export const NabuVideoAdventure = ({ world, level, onBack, onComplete }: Props) => {
  const adventure = useMemo<VideoLevel | null>(
    () => getVideoLevel(world.id, level.id),
    [world.id, level.id]
  );

  const steps = adventure?.steps ?? EMPTY_VIDEO_STEPS;

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("tap-to-begin");
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wordsAsked, setWordsAsked] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const [lastClipPoster, setLastClipPoster] = useState<string | undefined>(undefined);

  // Refs for things that must not trigger re-renders
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timers = useRef<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);
  const wasAutoPassedRef = useRef(false);
  const advancedRef = useRef(false);

  useEffect(() => { ensureSparkleStyle(); }, []);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  const queue = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => () => {
    clearTimers();
    cancelSpeech();
    stopMicCapture();
    speechManager.forceStop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── current step & lookahead ───────────────────────────────────────────────
  const current = steps[stepIndex];
  const nextClipStep = useMemo(() => {
    for (let i = stepIndex + 1; i < steps.length; i++) {
      if (steps[i].kind === "clip") return steps[i] as Extract<VideoStep, { kind: "clip" }>;
    }
    return null;
  }, [stepIndex, steps]);

  // ── student id (for AURA telemetry) ────────────────────────────────────────
  const studentIdRef = useRef<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      studentIdRef.current = data.user?.id ?? null;
    });
  }, []);

  // ── mic capture (fire-and-forget audio for AURA) ───────────────────────────
  const startMicCapture = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("MediaRecorder" in window)) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      recordingStartRef.current = Date.now();
    } catch (err) {
      // No mic permission, low-power, etc. — game still runs on Web Speech.
      console.warn("[NabuVideo] mic capture unavailable:", err);
    }
  }, []);

  const stopMicCapture = useCallback((): { blob: Blob | null; durationSec: number } => {
    const mr = mediaRecorderRef.current;
    const stream = mediaStreamRef.current;
    let blob: Blob | null = null;
    const durationSec = (Date.now() - (recordingStartRef.current || Date.now())) / 1000;
    if (mr && mr.state !== "inactive") {
      try { mr.stop(); } catch { /* ignore */ }
    }
    if (audioChunksRef.current.length > 0) {
      blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    }
    if (stream) {
      stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    audioChunksRef.current = [];
    return { blob, durationSec };
  }, []);

  // ── Web Speech listener for the current word step ──────────────────────────
  const startListening = useCallback((expectedWord: string) => {
    speechManager.start({
      owner: "reader",
      continuous: true,
      interimResults: true,
      onResult: (transcript, alternatives, isFinal) => {
        if (!isFinal) return;
        const candidates = [transcript, ...alternatives];
        const matched = candidates.some((c) => isWordMatchLenient(c, expectedWord));
        if (matched) {
          handleMatch(transcript || expectedWord);
        } else {
          // Only count finals as misses (avoid interim noise)
          handleMiss(transcript);
        }
      },
      onError: (e) => {
        console.warn("[NabuVideo] speech error:", e);
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopListening = useCallback(() => {
    speechManager.stop("reader");
  }, []);

  // ── phase driver ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!adventure) return;
    if (phase === "tap-to-begin") return;

    advancedRef.current = false;
    clearTimers();

    if (!current) {
      setPhase("ending");
      return;
    }

    if (current.kind === "clip") {
      // Video element will start playing via key change + autoPlay.
      // onEnded callback handles advance.
      setLastClipPoster(current.poster);
      return;
    }

    if (current.kind === "word") {
      if (phase !== "ask") return;
      // Freeze on the previous clip's last frame (the <video> just naturally
      // stays paused at its current frame). Narrate stem, then start listening.
      setAttempts(0);
      wasAutoPassedRef.current = false;
      setWordsAsked((n) => n + 1);
      speak(current.askLine, BENNY_VOICE);
      queue(() => {
        setPhase("reading");
        // Kick off mic capture + Web Speech.
        startMicCapture();
        startListening(current.word);
      }, 1100);
      return;
    }
  }, [stepIndex, phase, adventure]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── word read handlers ─────────────────────────────────────────────────────
  const advanceFromWord = useCallback(
    (matched: boolean, spokenWord: string, autoPassed: boolean) => {
      if (advancedRef.current) return;
      advancedRef.current = true;
      if (!current || current.kind !== "word") return;

      stopListening();
      const { blob, durationSec } = stopMicCapture();

      // Fire-and-forget AURA submission so every Pre-K read hits the same
      // 4-ML-model spine as the rest of the platform.
      const sid = studentIdRef.current;
      if (sid && adventure) {
        submitPreKAuraReading({
          studentId: sid,
          audioBlob: blob,
          transcript: spokenWord,
          durationSeconds: durationSec,
          matched,
          context: {
            level_id: adventure.id,
            step_index: stepIndex,
            expected_word: current.word,
            attempts: attempts + 1,
            auto_passed: autoPassed,
          },
        });
      }

      if (matched && !autoPassed) {
        setCorrect((c) => c + 1);
        playChime();
        playSparkle();
        setShowSparkle(true);
        window.setTimeout(() => setShowSparkle(false), 700);
      }

      cancelSpeech();
      setPhase("advancing");
      queue(() => {
        const next = stepIndex + 1;
        if (next >= steps.length) {
          setPhase("ending");
        } else {
          setStepIndex(next);
          setPhase(steps[next].kind === "clip" ? "clip" : "ask");
        }
      }, 600);
    },
    [current, stepIndex, steps, adventure, attempts, stopListening, stopMicCapture]
  );

  const handleMatch = useCallback(
    (spokenWord: string) => {
      advanceFromWord(true, spokenWord, false);
    },
    [advanceFromWord]
  );

  const handleMiss = useCallback(
    (spokenWord: string) => {
      if (!current || current.kind !== "word") return;
      setAttempts((a) => {
        const next = a + 1;
        if (next >= MAX_ATTEMPTS) {
          wasAutoPassedRef.current = true;
          window.setTimeout(() => {
            advanceFromWord(false, spokenWord, true);
            speak("Nice try! Let's keep going!", BENNY_VOICE);
          }, 500);
        } else if (next === 2) {
          // Scaffold on 2nd miss — model the word for them to echo.
          window.setTimeout(() => speakWordPolite(current.word, 1200), 400);
        }
        return next;
      });
    },
    [current, advanceFromWord]
  );

  const handleSkip = () => {
    if (!current || current.kind !== "word") return;
    wasAutoPassedRef.current = true;
    advanceFromWord(false, "", true);
  };
  const handleTapContinue = () => {
    if (!current || current.kind !== "word") return;
    wasAutoPassedRef.current = true;
    advanceFromWord(false, "", true);
  };
  const handleHearWord = () => {
    if (current && current.kind === "word") speakWordPolite(current.word, 300);
  };
  const handleReplayBubble = () => {
    if (current && current.kind === "word") speak(current.askLine, BENNY_VOICE);
  };

  // ── tap-to-begin satisfies iOS autoplay restriction ────────────────────────
  const handleBegin = () => {
    setPhase(steps[0]?.kind === "clip" ? "clip" : "ask");
  };

  // ── clip onEnded → next step ───────────────────────────────────────────────
  const handleClipEnded = () => {
    if (!current || current.kind !== "clip") return;
    // capture last frame info so the upcoming word step holds the picture
    setLastClipPoster(undefined);
    const next = stepIndex + 1;
    if (next >= steps.length) {
      setPhase("ending");
    } else {
      setStepIndex(next);
      setPhase(steps[next].kind === "clip" ? "clip" : "ask");
    }
  };

  // ── ending → onComplete ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "ending") return;
    if (adventure) speak(adventure.endingLine, BENNY_VOICE);
    queue(() => {
      const stars = wordsAsked === 0
        ? 1
        : correct >= wordsAsked
        ? 3
        : correct >= Math.ceil(wordsAsked * 0.7)
        ? 2
        : 1;
      onComplete({ wordsRead: wordsAsked, correctWords: correct, stars });
    }, 2400);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!adventure) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-bold text-slate-700">This level isn't ready yet.</p>
        <Button onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>
    );
  }

  // ── derived UI bits ────────────────────────────────────────────────────────
  const isWordPhase = phase === "ask" || phase === "reading";
  const wordStep = isWordPhase && current && current.kind === "word" ? current : null;
  const clipStep = current && current.kind === "clip" ? current : null;
  const showTapFallback = phase === "reading" && attempts >= 1;

  // Find the "active video" src — current clip, or last clip we played
  // (so during word phases we hold the frozen last frame).
  const activeVideoSrc = (() => {
    if (clipStep) return clipStep.src;
    // Walk backwards to find the most recent clip.
    for (let i = stepIndex - 1; i >= 0; i--) {
      const s = steps[i];
      if (s.kind === "clip") return s.src;
    }
    return null;
  })();

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-3xl bg-black shadow-xl">
      {/* ── Video layer ─────────────────────────────────────────────────── */}
      {activeVideoSrc && phase !== "tap-to-begin" && phase !== "ending" && (
        <video
          ref={videoRef}
          key={activeVideoSrc}
          className="absolute inset-0 h-full w-full object-cover"
          src={activeVideoSrc}
          poster={lastClipPoster}
          autoPlay={!!clipStep}
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          aria-hidden
          tabIndex={-1}
          draggable={false}
          onEnded={handleClipEnded}
        />
      )}

      {/* Preload the next clip in the background so swap is instant. */}
      {nextClipStep && (
        <video
          key={`preload-${nextClipStep.src}`}
          src={nextClipStep.src}
          preload="auto"
          muted
          playsInline
          className="hidden"
          aria-hidden
        />
      )}

      {/* ── Tap-to-begin gate (satisfies iOS autoplay user-gesture) ──── */}
      {phase === "tap-to-begin" && (
        <button
          onClick={handleBegin}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-rose-200 via-amber-200 to-emerald-200 p-6"
          aria-label="Begin the story"
        >
          <div className="rounded-3xl bg-white/95 px-8 py-6 text-center shadow-2xl">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {adventure.goal}
            </div>
            <div className="mt-4 text-base font-bold text-rose-600">Tap to begin →</div>
          </div>
        </button>
      )}

      {/* ── HUD (chrome) ────────────────────────────────────────────────── */}
      {phase !== "tap-to-begin" && (
        <div className="relative z-10 flex h-full min-h-0 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="bg-white/80 text-slate-800 hover:bg-white"
            >
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
                className="bg-white/80 text-slate-700 hover:bg-white"
                aria-label="Skip this word"
              >
                <SkipForward className="h-4 w-4 mr-1" /> Skip
              </Button>
            ) : (
              <div className="w-[68px]" />
            )}
          </div>

          {/* Stage area */}
          <div className="relative flex min-h-0 flex-1 items-end justify-center">
            {/* Sparkle on correct */}
            {showSparkle && (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl"
                style={{ animation: "prek-vid-sparkle 0.7s ease-out forwards" }}
              >
                ✨
              </div>
            )}

            {/* Ending overlay */}
            {phase === "ending" && (
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
            )}

            {/* askLine bubble */}
            <AnimatePresence mode="wait">
              {wordStep && (
                <motion.button
                  key={`bubble-${stepIndex}`}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onClick={handleReplayBubble}
                  className="absolute top-3 left-1/2 -translate-x-1/2 w-[min(540px,82%)] cursor-pointer"
                  aria-label="Replay line"
                >
                  <div className="relative flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-center text-base sm:text-lg font-bold text-slate-800 shadow-xl">
                    <Volume2 className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <span className="flex-1">{wordStep.askLine}</span>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Progress dots — one per word step */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {steps
                .filter((s) => s.kind === "word")
                .map((_, i) => {
                  const active = i === wordsAsked - 1 && (phase === "ask" || phase === "reading");
                  const done = i < correct || (i < wordsAsked - 1);
                  return (
                    <motion.div
                      key={i}
                      animate={{ scale: active ? 1.15 : 1 }}
                      className={`h-3 rounded-full transition-all ${
                        i < correct
                          ? "w-8 bg-gradient-to-r from-emerald-400 to-emerald-600 shadow"
                          : active
                          ? "w-8 bg-slate-700/80"
                          : done
                          ? "w-8 bg-amber-300/80"
                          : "w-3 bg-white/70"
                      }`}
                    />
                  );
                })}
            </div>
          </div>

          {/* Word card */}
          {wordStep && phase === "reading" && (
            <div className="flex flex-col gap-2">
              <motion.div
                key={`word-${stepIndex}`}
                initial={{ scale: 0.7, opacity: 0, y: 20 }}
                animate={{ scale: [0.7, 1.1, 1], opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
                className="relative mx-auto w-full max-w-md rounded-2xl border-4 border-amber-300 bg-white px-6 py-3 text-center shadow-2xl"
              >
                <div className="text-5xl sm:text-6xl font-black uppercase tracking-wide text-slate-900">
                  {wordStep.word}
                </div>
                <div className="mt-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600">
                  <Mic className="h-3 w-3" /> Your turn!
                </div>
                <button
                  onClick={handleHearWord}
                  className="absolute right-2 top-2 rounded-full bg-amber-100 p-1.5 text-amber-700 shadow hover:bg-amber-200"
                  aria-label="Hear the word"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </motion.div>

              {showTapFallback && (
                <Button
                  size="lg"
                  onClick={handleTapContinue}
                  className="mx-auto w-full max-w-md bg-rose-500 text-white shadow-xl hover:bg-rose-600"
                >
                  Tap to continue →
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
