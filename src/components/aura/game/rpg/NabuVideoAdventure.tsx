// Pre-K Video Adventure — one <video>, one steps array, one state machine.
//
// LOOP:
//   step.kind === "clip" → play, advance on onEnded
//   step.kind === "word" → pause on last frame, hold an opaque poster overlay,
//                          show word card, listen on the mic. On match advance
//                          immediately AND fire AURA telemetry in the
//                          background.
//
// NO-BLEED TRANSITIONS:
//   Before any video src change we raise an opaque black veil that fully
//   covers the stage. Only after the veil is opaque do we swap the <video>
//   src. The veil only fades back out after the new clip's first frame is
//   actually painted (onPlaying). This guarantees a frame from the outgoing
//   scene can never visually bleed into the incoming scene.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getVideoLevel, type VideoLevel, type VideoStep } from "@/data/preKAdventuresVideo";
import { speak, cancelSpeech } from "@/lib/tts";
import { submitPreKAuraReading } from "@/lib/preKAuraSubmit";
import { RPGWordReader } from "./RPGWordReader";
import type { CampaignWorld } from "@/lib/campaignData";
import type { CampaignLevel } from "./RPGLevelSelect";

interface Props {
  world: CampaignWorld;
  level: CampaignLevel;
  onBack: () => void;
  onComplete: (stats: { wordsRead: number; correctWords: number; stars: number }) => void;
}

type Phase = "tap-to-begin" | "clip" | "ask" | "reading" | "advancing" | "ending";

const BENNY_VOICE = { rate: 0.95, pitch: 1.15 } as const;
const EMPTY_VIDEO_STEPS: VideoStep[] = [];

// Veil timing — kept slow & calm so it reads as a deliberate fade, not a flash.
const VEIL_FADE_IN_MS = 450;
const VEIL_FADE_OUT_MS = 500;
const VEIL_SAFETY_MS = 1200;

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

  // No-bleed transition machinery.
  // `mountedSrc` is what the <video> element is actually loading; it only
  // changes while the veil is fully opaque.
  const [mountedSrc, setMountedSrc] = useState<string | null>(null);
  const [veilOpaque, setVeilOpaque] = useState(true);
  const [playBlocked, setPlayBlocked] = useState(false);
  // While true, we render an opaque "freeze" image on top of the video so the
  // word card sits on a guaranteed-stable picture even if the underlying
  // <video> tries to rewind/replay on iOS.
  const [holdPoster, setHoldPoster] = useState<string | null>(null);

  // Refs for things that must not trigger re-renders
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timers = useRef<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);
  const advancedRef = useRef(false);
  const askedStepRef = useRef<number>(-1);
  const playTokenRef = useRef(0);
  const expectFirstFrameRef = useRef(false);

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── current step & lookahead ───────────────────────────────────────────────
  const current = steps[stepIndex];
  const firstClipSrc = useMemo(() => {
    const firstClip = steps.find((s): s is Extract<VideoStep, { kind: "clip" }> => s.kind === "clip");
    return firstClip?.src ?? null;
  }, [steps]);
  const nextClipStep = useMemo(() => {
    for (let i = stepIndex + 1; i < steps.length; i++) {
      if (steps[i].kind === "clip") return steps[i] as Extract<VideoStep, { kind: "clip" }>;
    }
    return null;
  }, [stepIndex, steps]);

  useEffect(() => {
    if (phase !== "tap-to-begin") return;
    if (!firstClipSrc) return;
    setMountedSrc(firstClipSrc);
  }, [firstClipSrc, phase]);

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

  // ── No-bleed transition helpers ────────────────────────────────────────────
  //
  // swapToClip(src) raises the veil, waits for it to be fully opaque, swaps
  // the mounted <video> src, then drops the veil only after onPlaying paints
  // the first frame of the new clip.
  const playMountedVideo = useCallback((allowMutedFallback = true) => {
    const v = videoRef.current;
    if (!v) return;
    const token = ++playTokenRef.current;
    setPlayBlocked(false);
    try {
      const p = v.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          if (token !== playTokenRef.current) return;
          if (!allowMutedFallback) {
            setPlayBlocked(true);
            return;
          }
          try {
            v.muted = true;
            const mutedPlay = v.play();
            if (mutedPlay && typeof mutedPlay.catch === "function") {
              mutedPlay.catch(() => token === playTokenRef.current && setPlayBlocked(true));
            }
          } catch {
            setPlayBlocked(true);
          }
        });
      }
    } catch {
      if (allowMutedFallback) {
        try {
          v.muted = true;
          void v.play();
        } catch {
          setPlayBlocked(true);
        }
      } else {
        setPlayBlocked(true);
      }
    }
  }, []);

  const swapToClip = useCallback((nextSrc: string, immediate = false) => {
    setVeilOpaque(true);
    setHoldPoster(null); // freeze frame no longer needed once we leave a word
    expectFirstFrameRef.current = true;
    const doSwap = () => {
      setMountedSrc(nextSrc);
      // Safety: if onPlaying never fires (codec hiccup), drop veil anyway.
      queue(() => {
        if (expectFirstFrameRef.current) {
          expectFirstFrameRef.current = false;
          setVeilOpaque(false);
          setPlayBlocked(true);
        }
      }, VEIL_SAFETY_MS);
    };
    if (immediate) doSwap();
    else queue(doSwap, VEIL_FADE_IN_MS);
  }, []);

  // freezeForWord(posterUrl) pauses the underlying <video> at its last frame
  // and pins an opaque poster image on top so the word card sits on a totally
  // stable picture — no possibility of the video peeking through.
  const freezeForWord = useCallback((posterUrl: string | undefined) => {
    const v = videoRef.current;
    if (v) {
      try { v.pause(); } catch { /* ignore */ }
    }
    setHoldPoster(posterUrl ?? null);
    // The veil should already be down here; ensure it is.
    setVeilOpaque(false);
  }, []);

  // ── phase driver ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!adventure) return;
    if (phase === "tap-to-begin") return;

    if (!current) {
      setPhase("ending");
      return;
    }

    if (current.kind === "clip") {
      if (phase !== "clip") return;
      advancedRef.current = false;
      clearTimers();
      // If the mounted src doesn't already match this clip, swap with veil.
      if (mountedSrc !== current.src) {
        swapToClip(current.src, mountedSrc === null);
      } else {
        // Same src already mounted (rare); just ensure veil is down.
        setVeilOpaque(false);
        setHoldPoster(null);
        playMountedVideo();
      }
      return;
    }

    if (current.kind === "word") {
      if (phase !== "ask") return;
      if (askedStepRef.current === stepIndex) return;
      askedStepRef.current = stepIndex;
      advancedRef.current = false;
      clearTimers();
      cancelSpeech();
      setAttempts(0);
      setWordsAsked((n) => n + 1);
      // Freeze the picture immediately so the bubble + card sit on a stable
      // image (no chance of bleed from the just-ended clip).
      freezeForWord(current.holdPoster);
      queue(() => {
        setPhase("reading");
        startMicCapture();
      }, 250);
      return;
    }
  }, [stepIndex, phase, adventure, mountedSrc, current, swapToClip, freezeForWord, startMicCapture, playMountedVideo]);

  // ── word read handlers ─────────────────────────────────────────────────────
  const advanceFromWord = useCallback(
    (matched: boolean, spokenWord: string, autoPassed: boolean) => {
      if (advancedRef.current) return;
      advancedRef.current = true;
      if (!current || current.kind !== "word") return;

      const { blob, durationSec } = stopMicCapture();

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
    [current, stepIndex, steps, adventure, attempts, stopMicCapture]
  );

  const handleReaderResult = useCallback(
    (matched: boolean, spokenWord: string) => {
      setAttempts((a) => a + 1);
      advanceFromWord(matched, spokenWord, !matched);
    },
    [advanceFromWord]
  );

  const handleReaderMiss = useCallback(() => {
    setAttempts((a) => a + 1);
  }, []);

  const handleSkip = () => {
    if (!current || current.kind !== "word") return;
    advanceFromWord(false, "", true);
  };

  // ── tap-to-begin satisfies iOS autoplay restriction ────────────────────────
  const handleBegin = () => {
    // Prime the audio context with the user gesture.
    getCtx();
    const v = videoRef.current;
    if (v) {
      try {
        v.muted = false;
        v.currentTime = 0;
      } catch { /* ignore */ }
      playMountedVideo();
    } else if (firstClipSrc) {
      expectFirstFrameRef.current = true;
      setMountedSrc(firstClipSrc);
    }
    setPhase(steps[0]?.kind === "clip" ? "clip" : "ask");
  };

  // ── clip onEnded → next step ───────────────────────────────────────────────
  const handleClipEnded = () => {
    if (!current || current.kind !== "clip") return;
    const next = stepIndex + 1;
    if (next >= steps.length) {
      // Final clip: hold the veil down, fall into ending overlay.
      setPhase("ending");
      return;
    }
    const nextStep = steps[next];
    if (nextStep.kind === "word") {
      // Next is a word — freeze current frame, no src change needed.
      setStepIndex(next);
      setPhase("ask");
    } else {
      setStepIndex(next);
      setPhase("clip");
    }
  };

  // Video element fires onPlaying once the first frame is actually painted —
  // that's our cue to drop the veil safely.
  const handleVideoPlaying = () => {
    setPlayBlocked(false);
    if (expectFirstFrameRef.current) {
      expectFirstFrameRef.current = false;
      // Small extra delay keeps the fade feeling cinematic.
      queue(() => setVeilOpaque(false), 80);
    }
  };

  const handleVideoReady = () => {
    if (phase !== "tap-to-begin") playMountedVideo();
  };

  const handleVideoError = () => {
    expectFirstFrameRef.current = false;
    setVeilOpaque(false);
    setPlayBlocked(true);
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

  const wordStep =
    (phase === "ask" || phase === "reading") && current && current.kind === "word"
      ? current
      : null;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-3xl bg-black shadow-xl">
      {/* ── Single video layer (no overlap, no AnimatePresence) ─────────── */}
      {mountedSrc && (
        <video
          ref={videoRef}
          key={mountedSrc}
          className="absolute inset-0 h-full w-full object-cover"
          src={mountedSrc}
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          aria-hidden
          tabIndex={-1}
          draggable={false}
          onLoadedData={handleVideoReady}
          onCanPlay={handleVideoReady}
          onPlaying={handleVideoPlaying}
          onError={handleVideoError}
          onEnded={handleClipEnded}
        />
      )}

      {/* ── Freeze-frame overlay for word phases (kills any chance of bleed) ─ */}
      {holdPoster && (
        <img
          src={holdPoster}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* ── Preload next clip in the background so swap is instant ──────── */}
      {nextClipStep && nextClipStep.src !== mountedSrc && (
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

      {/* ── Opaque transition veil — covers EVERYTHING during swaps ─────── */}
      <div
        className="pointer-events-none absolute inset-0 z-30 bg-black"
        style={{
          opacity: veilOpaque ? 1 : 0,
          transition: `opacity ${veilOpaque ? VEIL_FADE_IN_MS : VEIL_FADE_OUT_MS}ms ease-in-out`,
        }}
        aria-hidden
      />

      {/* ── Tap-to-begin gate (satisfies iOS autoplay user-gesture) ────── */}
      {phase === "tap-to-begin" && (
        <button
          onClick={handleBegin}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-rose-200 via-amber-200 to-emerald-200 p-6"
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

      {phase !== "tap-to-begin" && playBlocked && (
        <button
          onClick={() => playMountedVideo(false)}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          aria-label="Resume story video"
        >
          <span className="rounded-3xl bg-white px-8 py-5 text-xl font-extrabold text-slate-900 shadow-2xl">
            Tap to keep playing
          </span>
        </button>
      )}

      {/* ── HUD (chrome) ────────────────────────────────────────────────── */}
      {phase !== "tap-to-begin" && (
        <div className="relative z-20 flex h-full min-h-0 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
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
                <motion.div
                  key={`bubble-${stepIndex}`}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 w-[min(540px,82%)]"
                >
                  <div className="relative flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-center text-base sm:text-lg font-bold text-slate-800 shadow-xl">
                    <Volume2 className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <span className="flex-1">{wordStep.askLine}</span>
                  </div>
                </motion.div>
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
              </motion.div>

              <div className="mx-auto rounded-2xl bg-white/90 px-3 py-2 shadow-xl backdrop-blur-sm">
                <RPGWordReader
                  key={`reader-${stepIndex}-${wordStep.word}`}
                  words={[wordStep.word]}
                  batchSize={1}
                  compact
                  autoStart
                  hideWordQueue
                  enableEchoRetry={false}
                  onResult={handleReaderResult}
                  onMiss={(_, __) => handleReaderMiss()}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
