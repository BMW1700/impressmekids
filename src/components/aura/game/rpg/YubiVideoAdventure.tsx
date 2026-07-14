// Pre-K Video Adventure — one steps array, one state machine, TWO video layers
// for true crossfade transitions (no black, no frozen still).
//
// LOOP:
//   step.kind === "clip" → play, advance on onEnded
//   step.kind === "word" → pause on last frame, hold an opaque poster overlay,
//                          show word card, listen on the mic. On match advance
//                          immediately AND fire AURA telemetry in the
//                          background.
//
// SEAMLESS TRANSITIONS:
//   Two <video> elements (primary / incoming) sit stacked. When we need to
//   switch clips, the incoming element loads + starts the next src, and on
//   its onPlaying we crossfade primary→incoming over CROSSFADE_MS. Both
//   videos are actually playing during the dissolve, so the audience never
//   sees a freeze or a black frame.

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
import { usePreKAudioMix } from "@/hooks/usePreKAudioMix";
import { usePreKAudioMixerRuntime, type PreKAudioMixerEvent } from "@/hooks/usePreKAudioMixerRuntime";
import { sceneKeyForStep, SCENE_KEYS } from "@/lib/preKSceneGraph";

interface Props {
  world: CampaignWorld;
  level: CampaignLevel;
  onBack: () => void;
  onComplete: (stats: { wordsRead: number; correctWords: number; stars: number }) => void;
  /** Optional DB-loaded level override. When provided, takes precedence over the hardcoded data file. */
  overrideLevel?: VideoLevel | null;
  /** Database level UUID — when set, loads & plays the audio overlay mix and applies source-video mute. */
  dbLevelId?: string | null;
}

type Phase = "tap-to-begin" | "clip" | "ask" | "reading" | "advancing" | "ending";

const BENNY_VOICE = { rate: 0.95, pitch: 1.15 } as const;
const EMPTY_VIDEO_STEPS: VideoStep[] = [];

// Single seamless crossfade timing — used for every clip→clip and word→clip
// transition. Long enough to feel cinematic, short enough to keep pace.
const CROSSFADE_MS = 600;
const POSTER_FADE_OUT_MS = 500;

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

type Slot = "A" | "B";
const otherSlot = (s: Slot): Slot => (s === "A" ? "B" : "A");

export const YubiVideoAdventure = ({ world, level, onBack, onComplete, overrideLevel, dbLevelId }: Props) => {
  const adventure = useMemo<VideoLevel | null>(
    () => overrideLevel ?? getVideoLevel(world.id, level.id),
    [overrideLevel, world.id, level.id]
  );

  const steps = adventure?.steps ?? EMPTY_VIDEO_STEPS;

  // Number of "word" steps — needed to compute scene keys from step index.
  const wordCount = useMemo(() => steps.filter((s) => s.kind === "word").length, [steps]);

  // Audio overlay mix (no-op when dbLevelId is null)
  const mix = usePreKAudioMix(dbLevelId ?? null);
  const [sceneEvent, setSceneEvent] = useState<PreKAudioMixerEvent | null>(null);
  const emitScene = useCallback((sceneKey: string, edge: "start" | "end") => {
    setSceneEvent({ sceneKey, edge, isWordCard: sceneKey.endsWith("-card") });
  }, []);
  const mixerHandle = usePreKAudioMixerRuntime({
    tracks: mix.tracks,
    clips: mix.clips,
    signedUrls: mix.signedUrls,
    masterVolume: mix.settings.audio_master_volume,
    enabled: !!dbLevelId,
    event: sceneEvent,
  });
  // Whenever an audio clip is anchored to a scene (redub track 90 or music
  // track 89), we mute the source video's audio so the redub voice isn't
  // fighting the original take.
  const hasOverlayAudio = useMemo(
    () => mix.clips.some((c) => c.track_index === 89 || c.track_index === 90),
    [mix.clips]
  );
  const muteSourceVideo = (!!dbLevelId && mix.settings.mute_source_video_audio) || hasOverlayAudio;
  const overlayAudioReady = useMemo(
    () => !dbLevelId || (!mix.loading && mixerHandle.ready && mix.clips.every((c) => !!mix.signedUrls[c.storage_path])),
    [dbLevelId, mix.clips, mix.loading, mix.signedUrls, mixerHandle.ready]
  );


  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("tap-to-begin");
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [scoreCredit, setScoreCredit] = useState(0);
  const [wordsAsked, setWordsAsked] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);

  // ── Two-video crossfade machinery ─────────────────────────────────────────
  // slotSrc[A|B] each independently hold a clip src. activeSlot is the one
  // currently visible/audible. When swapping clips, we load the new src on
  // the OTHER slot, wait for its onPlaying, then crossfade activeSlot.
  const [slotSrc, setSlotSrc] = useState<{ A: string | null; B: string | null }>({ A: null, B: null });
  const [activeSlot, setActiveSlot] = useState<Slot>("A");
  const [crossfading, setCrossfading] = useState(false); // both videos visible during dissolve
  const [playBlocked, setPlayBlocked] = useState(false);

  // Word-phase freeze overlay (covers paused video while child reads).
  const [holdPoster, setHoldPoster] = useState<string | null>(null);
  const [holdPosterVisible, setHoldPosterVisible] = useState(false);

  // Refs
  const videoRefs = useRef<{ A: HTMLVideoElement | null; B: HTMLVideoElement | null }>({ A: null, B: null });
  const timers = useRef<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);
  const advancedRef = useRef(false);
  const askedStepRef = useRef<number>(-1);
  const activeSlotRef = useRef<Slot>("A");
  // Slot we're currently waiting on for first-frame paint during a swap.
  const incomingSlotRef = useRef<Slot | null>(null);

  useEffect(() => { ensureSparkleStyle(); }, []);

  useEffect(() => {
    setStepIndex(0);
    setAttempts(0);
    setCorrect(0);
    setScoreCredit(0);
    setWordsAsked(0);
    advancedRef.current = false;
    askedStepRef.current = -1;
  }, [adventure?.id]);

  // ── Scene-event emission for the audio overlay mixer ─────────────────────
  // We emit `end` for the previous scene when stepIndex changes so fill-scene
  // and fill-level clips can fade out. Video-scene `start` is deferred until
  // handleVideoPlaying — only once the swapped-in <video> actually paints.
  // Word-card scenes have no video onPlaying event, so they must start
  // immediately; otherwise a stale card key can fire on the next clip and make
  // redub audio seem muted, late, or out of order.
  const prevSceneRef = useRef<string | null>(null);
  const pendingSceneStartRef = useRef<string | null>(null);
  const emittedSceneStartsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!dbLevelId) return;
    if (phase === "tap-to-begin") return;
    const sceneKey = sceneKeyForStep(stepIndex, wordCount);
    const stepForScene = steps[stepIndex];
    if (prevSceneRef.current === sceneKey) return;
    if (prevSceneRef.current) emitScene(prevSceneRef.current, "end");
    prevSceneRef.current = sceneKey;
    if (stepForScene?.kind === "clip") {
      pendingSceneStartRef.current = sceneKey;
      emittedSceneStartsRef.current.delete(sceneKey);
    } else {
      pendingSceneStartRef.current = null;
      if (!emittedSceneStartsRef.current.has(sceneKey)) {
        emittedSceneStartsRef.current.add(sceneKey);
        emitScene(sceneKey, "start");
      }
    }
  }, [stepIndex, phase, dbLevelId, wordCount, emitScene, steps]);

  // Emit a final closing-end when we reach the ending phase, so fill-* clips fade.
  useEffect(() => {
    if (!dbLevelId) return;
    if (phase !== "ending") return;
    if (prevSceneRef.current) {
      emitScene(prevSceneRef.current, "end");
      prevSceneRef.current = null;
      pendingSceneStartRef.current = null;
      emittedSceneStartsRef.current.clear();
    }
  }, [phase, dbLevelId, emitScene]);


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

  // src → {trimIn, trimOut} lookup used by the <video> elements to seek to
  // the in-point on load and synthesize an early "ended" at the out-point.
  // Non-destructive: the file in storage is untouched.
  const trimsBySrc = useMemo(() => {
    const m = new Map<string, { trimIn: number; trimOut: number | null }>();
    for (const s of steps) {
      if (s.kind !== "clip") continue;
      const tIn = typeof s.trimIn === "number" && s.trimIn > 0 ? s.trimIn : 0;
      const tOut = typeof s.trimOut === "number" && s.trimOut > 0 ? s.trimOut : null;
      if (tIn > 0 || tOut !== null) m.set(s.src, { trimIn: tIn, trimOut: tOut });
      if ((tIn > 0 || tOut !== null) && s.fallbackSrc) m.set(s.fallbackSrc, { trimIn: tIn, trimOut: tOut });
    }
    return m;
  }, [steps]);

  const fallbackBySrc = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of steps) {
      if (s.kind === "clip" && s.fallbackSrc) m.set(s.src, s.fallbackSrc);
    }
    return m;
  }, [steps]);


  // Initial mount — put first clip on slot A so tap-to-begin can hit play.
  useEffect(() => {
    if (phase !== "tap-to-begin") return;
    if (!firstClipSrc) return;
    setSlotSrc((s) => (s.A === firstClipSrc ? s : { ...s, A: firstClipSrc }));
    setActiveSlot("A");
    activeSlotRef.current = "A";
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
      console.warn("[YubiVideo] mic capture unavailable:", err);
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

  // ── Playback helper ────────────────────────────────────────────────────────
  const playSlot = useCallback((slot: Slot, allowMutedFallback = true) => {
    const v = videoRefs.current[slot];
    if (!v) return;
    setPlayBlocked(false);
    try {
      const p = v.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          if (!allowMutedFallback) { setPlayBlocked(true); return; }
          try {
            v.muted = true;
            const mp = v.play();
            if (mp && typeof mp.catch === "function") mp.catch(() => setPlayBlocked(true));
          } catch { setPlayBlocked(true); }
        });
      }
    } catch {
      if (allowMutedFallback) {
        try { v.muted = true; void v.play(); } catch { setPlayBlocked(true); }
      } else {
        setPlayBlocked(true);
      }
    }
  }, []);

  // ── Crossfade swap: load nextSrc on idle slot, fade when it plays ─────────
  const swapToClip = useCallback((nextSrc: string) => {
    const cur = activeSlotRef.current;
    const incoming = otherSlot(cur);

    // Already showing this src? nothing to do.
    if (slotSrc[cur] === nextSrc) {
      playSlot(cur);
      return;
    }
    // Already loaded on the other slot? just trigger the fade path.
    incomingSlotRef.current = incoming;
    setSlotSrc((s) => ({ ...s, [incoming]: nextSrc }));
    // The incoming <video> will mount/remount on the next render due to the
    // new src+key; onPlaying for that slot finishes the crossfade.
  }, [slotSrc, playSlot]);

  // freeze current frame and pin opaque poster on top so the word card sits
  // on a totally stable image.
  const freezeForWord = useCallback((posterUrl: string | undefined) => {
    const v = videoRefs.current[activeSlotRef.current];
    if (v) { try { v.pause(); } catch { /* ignore */ } }
    setHoldPoster(posterUrl ?? null);
    setHoldPosterVisible(!!posterUrl);
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
      const cur = activeSlotRef.current;
      if (slotSrc[cur] === current.src) {
        // First clip after tap-to-begin already mounted on active slot.
        // Make sure holdPoster (if any) fades off and just play.
        if (holdPoster) {
          setHoldPosterVisible(false);
          queue(() => setHoldPoster(null), POSTER_FADE_OUT_MS + 40);
        }
        playSlot(cur);
      } else {
        swapToClip(current.src);
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
      freezeForWord(current.holdPoster);
      queue(() => {
        setPhase("reading");
        startMicCapture();
      }, 250);
      return;
    }
  }, [stepIndex, phase, adventure, current, slotSrc, swapToClip, freezeForWord, startMicCapture, playSlot, holdPoster]);

  // ── word read handlers ─────────────────────────────────────────────────────
  const advanceFromWord = useCallback(
    (
      matched: boolean,
      spokenWord: string,
      autoPassed: boolean,
      options: {
        retried?: boolean;
        attemptsOverride?: number;
        scoreCredit?: number;
        firstAttemptMissed?: boolean;
      } = {}
    ) => {
      if (advancedRef.current) return;
      advancedRef.current = true;
      if (!current || current.kind !== "word") return;

      const { blob, durationSec } = stopMicCapture();

      const sid = studentIdRef.current;
      if (sid && adventure) {
        const credit = options.scoreCredit ?? (matched && !autoPassed ? 1 : 0);
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
            attempts: options.attemptsOverride ?? attempts + 1,
            auto_passed: autoPassed,
            retried: options.retried ?? false,
            first_attempt_missed: options.firstAttemptMissed ?? false,
            score_credit: credit,
            outcome: options.retried
              ? "retry_correct"
              : matched && !autoPassed
              ? "first_try_correct"
              : autoPassed
              ? "skipped"
              : "missed",
          },
        });
      }

      const credit = options.scoreCredit ?? (matched && !autoPassed ? 1 : 0);
      setScoreCredit((s) => s + credit);

      if (matched && !autoPassed) {
        if (!options.retried) setCorrect((c) => c + 1);
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
      }, 350);
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
    if (!overlayAudioReady) return;
    getCtx();
    if (dbLevelId && steps[0]?.kind === "clip") {
      const sceneKey = sceneKeyForStep(0, wordCount);
      prevSceneRef.current = sceneKey;
      pendingSceneStartRef.current = sceneKey;
      emittedSceneStartsRef.current.delete(sceneKey);
    }
    const v = videoRefs.current[activeSlotRef.current];
    if (v) {
      try {
        // Respect the per-level mute_source_video_audio setting; only unmute
        // when the level keeps its baked-in narration.
        v.muted = muteSourceVideo;
        const srcForTrim = v.currentSrc || firstClipSrc || "";
        const trim = trimsBySrc.get(srcForTrim);
        v.currentTime = trim?.trimIn ?? 0;
      } catch { /* ignore */ }
      playSlot(activeSlotRef.current);
    }
    setPhase(steps[0]?.kind === "clip" ? "clip" : "ask");
  };

  // Track which slots are still waiting to confirm a trim-in seek before we
  // allow them to start playing (prevents a one-frame flash of the original
  // pre-trim opening on Safari/iOS).
  const pendingTrimSeekRef = useRef<{ A: boolean; B: boolean }>({ A: false, B: false });

  // Seek a slot's <video> to its trim-in point if one is configured.
  const seekToTrimIn = (slot: Slot) => {
    const v = videoRefs.current[slot];
    if (!v) return;
    const src = v.currentSrc || v.src;
    const trim = trimsBySrc.get(src);
    if (!trim || trim.trimIn <= 0) {
      pendingTrimSeekRef.current[slot] = false;
      return;
    }
    try {
      if (Math.abs(v.currentTime - trim.trimIn) > 0.05) {
        pendingTrimSeekRef.current[slot] = true;
        v.currentTime = trim.trimIn;
      } else {
        pendingTrimSeekRef.current[slot] = false;
      }
    } catch { /* noop */ }
  };

  const handleVideoSeeked = (slot: Slot) => {
    if (pendingTrimSeekRef.current[slot]) {
      pendingTrimSeekRef.current[slot] = false;
      // Now safe to start playback — first painted frame will be the trimmed-in one.
      if (incomingSlotRef.current === slot || slot === activeSlotRef.current) {
        playSlot(slot);
      }
    }
  };

  // Synthesize an early "ended" when playback reaches the trim-out point.
  const handleTimeUpdate = (slot: Slot) => {
    if (slot !== activeSlotRef.current) return;
    const v = videoRefs.current[slot];
    if (!v) return;
    const src = v.currentSrc || v.src;
    const trim = trimsBySrc.get(src);
    if (!trim?.trimOut) return;
    if (v.currentTime >= trim.trimOut - 0.02) {
      try { v.pause(); } catch { /* noop */ }
      handleClipEnded(slot);
    }
  };


  // ── clip onEnded → next step ───────────────────────────────────────────────
  // If the redub audio anchored to this scene still has an unplayed tail,
  // freeze on the last video frame until the audio finishes. This is what
  // makes the last word/syllable always play out instead of getting chopped
  // when the source video's cut lands earlier than the redub's end.
  const holdAdvanceTimerRef = useRef<number | null>(null);
  const advanceAfterClip = (slot: Slot) => {
    if (slot !== activeSlotRef.current) return;
    if (!current || current.kind !== "clip") return;
    const next = stepIndex + 1;
    if (next >= steps.length) {
      setPhase("ending");
      return;
    }
    const nextStep = steps[next];
    setStepIndex(next);
    setPhase(nextStep.kind === "word" ? "ask" : "clip");
  };
  const handleClipEnded = (slot: Slot) => {
    // Only react to the active slot ending. (Old, faded-out slot can also fire
    // ended after a swap; ignore those.)
    if (slot !== activeSlotRef.current) return;
    if (!current || current.kind !== "clip") return;

    const sceneKey = prevSceneRef.current;
    const HOLD_CAP_MS = 3000;
    const started = Date.now();
    const tryAdvance = () => {
      const busy = sceneKey ? mixerHandle.isSceneAudioBusy(sceneKey) : false;
      const elapsed = Date.now() - started;
      if (busy && elapsed < HOLD_CAP_MS) {
        // Freeze on last frame: pause the active video (it's already at end)
        // and re-check shortly.
        const v = videoRefs.current[slot];
        if (v) { try { v.pause(); } catch { /* noop */ } }
        holdAdvanceTimerRef.current = window.setTimeout(tryAdvance, 120);
        return;
      }
      holdAdvanceTimerRef.current = null;
      advanceAfterClip(slot);
    };
    tryAdvance();
  };
  useEffect(() => () => {
    if (holdAdvanceTimerRef.current) window.clearTimeout(holdAdvanceTimerRef.current);
  }, []);

  // ── Crossfade trigger: incoming slot just painted its first frame ─────────
  const handleVideoPlaying = (slot: Slot) => {
    setPlayBlocked(false);
    // Fire the pending scene-start now — only once the video is actually
    // producing frames. This guarantees the redub audio starts exactly when
    // the paired video frame is on screen, eliminating the 3–4 s drift that
    // came from firing scene-start on the React step-change effect.
    if (pendingSceneStartRef.current && slot === (incomingSlotRef.current ?? activeSlotRef.current)) {
      const sceneKey = pendingSceneStartRef.current;
      const expectedSceneKey = sceneKeyForStep(stepIndex, wordCount);
      pendingSceneStartRef.current = null;
      if (current?.kind === "clip" && sceneKey === expectedSceneKey) {
        emittedSceneStartsRef.current.add(sceneKey);
        emitScene(sceneKey, "start");
      }
    }
    // If this is the slot we're crossfading IN to, kick off the dissolve.
    if (incomingSlotRef.current === slot) {
      incomingSlotRef.current = null;
      setCrossfading(true);
      // Flip active immediately so opacity transitions reflect it.
      activeSlotRef.current = slot;
      setActiveSlot(slot);
      // Fade out the hold poster (if word→clip) in parallel with the video
      // crossfade — both ride the same easing window.
      if (holdPoster) setHoldPosterVisible(false);
      // After the dissolve, clear the outgoing slot's src to release memory
      // and stop the (now hidden) old video.
      queue(() => {
        const prev = otherSlot(slot);
        const prevVideo = videoRefs.current[prev];
        if (prevVideo) {
          try { prevVideo.pause(); } catch { /* ignore */ }
        }
        setSlotSrc((s) => ({ ...s, [prev]: null }));
        setCrossfading(false);
        if (holdPoster) setHoldPoster(null);
      }, CROSSFADE_MS + 40);
    }
  };

  const handleVideoReady = (slot: Slot) => {
    if (phase === "tap-to-begin") return;
    // If a trim-in seek is still pending for this slot, wait for `seeked`
    // before starting playback — handleVideoSeeked will call playSlot.
    if (pendingTrimSeekRef.current[slot]) return;
    // If this slot is the incoming swap target, start it playing so onPlaying fires.
    if (incomingSlotRef.current === slot) {
      playSlot(slot);
    }
  };

  const handleVideoError = (slot: Slot) => {
    const currentSrc = slotSrc[slot] || videoRefs.current[slot]?.currentSrc || videoRefs.current[slot]?.src || "";
    const fallback = fallbackBySrc.get(currentSrc);
    if (fallback && fallback !== currentSrc) {
      setSlotSrc((s) => ({ ...s, [slot]: fallback }));
      window.setTimeout(() => {
        try { videoRefs.current[slot]?.load(); } catch { /* ignore */ }
      }, 0);
      return;
    }
    if (incomingSlotRef.current === slot) {
      incomingSlotRef.current = null;
    }
    setPlayBlocked(true);
  };

  // ── ending → onComplete ────────────────────────────────────────────────────
  const onCompleteFiredRef = useRef(false);

  const fireOnComplete = useCallback(() => {
    if (onCompleteFiredRef.current) return;
    onCompleteFiredRef.current = true;
    const stars = wordsAsked === 0
      ? 1
      : scoreCredit >= wordsAsked
      ? 3
      : scoreCredit >= wordsAsked * 0.7
      ? 2
      : 1;
    console.debug('[YubiVideoAdventure] onComplete', { wordsAsked, scoreCredit, stars });
    onComplete({ wordsRead: wordsAsked, correctWords: Math.round(scoreCredit), stars });
  }, [onComplete, wordsAsked, scoreCredit]);

  useEffect(() => {
    if (phase !== "ending") return;
    if (adventure) speak(adventure.endingLine, BENNY_VOICE);
    queue(() => { fireOnComplete(); }, 2400);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Failsafe: if the child taps "Back" AFTER having answered every word
  // (scoreCredit > 0 and asked at least one word), still credit the run so
  // partial completions persist to the DB and the village unlocks correctly.
  const handleBack = useCallback(() => {
    if (!onCompleteFiredRef.current && wordsAsked > 0 && scoreCredit > 0) {
      fireOnComplete();
    }
    onBack();
  }, [fireOnComplete, onBack, wordsAsked, scoreCredit]);

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

  const renderSlot = (slot: Slot) => {
    const src = slotSrc[slot];
    if (!src) return null;
    const isActive = activeSlot === slot;
    return (
      <video
        ref={(el) => { videoRefs.current[slot] = el; }}
        key={`${slot}-${src}`}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        playsInline
        muted={muteSourceVideo}
        preload="auto"
        controls={false}
        disablePictureInPicture
        aria-hidden
        tabIndex={-1}
        draggable={false}
        style={{
          opacity: isActive ? 1 : crossfading ? 0 : 0,
          transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
          zIndex: isActive ? 2 : 1,
        }}
        onLoadedMetadata={() => seekToTrimIn(slot)}
        onLoadedData={() => { seekToTrimIn(slot); handleVideoReady(slot); }}
        onCanPlay={() => handleVideoReady(slot)}
        onSeeked={() => handleVideoSeeked(slot)}
        onPlaying={() => handleVideoPlaying(slot)}
        onTimeUpdate={() => handleTimeUpdate(slot)}
        onError={() => handleVideoError(slot)}
        onEnded={() => handleClipEnded(slot)}
      />
    );
  };

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
      {/* ── Two-video crossfade layer ───────────────────────────────────── */}
      {renderSlot("A")}
      {renderSlot("B")}

      {/* ── Freeze-frame overlay for word phases. Sits above both videos.
            Fades out gently in parallel with the word→clip crossfade. ──── */}
      {holdPoster && (
        <img
          src={holdPoster}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            opacity: holdPosterVisible ? 1 : 0,
            transition: `opacity ${POSTER_FADE_OUT_MS}ms ease-in-out`,
          }}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full object-cover"
        />
      )}

      {/* ── Preload next clip in the background so swap is instant ──────── */}
      {nextClipStep && nextClipStep.src !== slotSrc.A && nextClipStep.src !== slotSrc.B && (
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
            <div className="mt-4 text-base font-bold text-rose-600">
              {overlayAudioReady ? "Tap to begin →" : "Loading audio…"}
            </div>
          </div>
        </button>
      )}

      {phase !== "tap-to-begin" && playBlocked && (
        <button
          onClick={() => playSlot(activeSlotRef.current, false)}
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
        <div className="relative z-30 flex h-full min-h-0 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
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
                  onRetrySuccess={(_, spokenWord, retryAttempts) => {
                    advanceFromWord(true, spokenWord || wordStep.word, false, {
                      retried: true,
                      attemptsOverride: retryAttempts ?? 2,
                      scoreCredit: 0.6,
                      firstAttemptMissed: true,
                    });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
