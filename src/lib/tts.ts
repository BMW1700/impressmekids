// Browser Web Speech API helper for Pre-K Benny speech bubbles.
// $0/month — no server, no key. Respects a user-controlled toggle stored in
// localStorage under "nabu.tts.enabled" (default ON). When the toggle is off,
// speak() is a no-op so the rest of the UI stays fully usable.
//
// One stable, kid-friendly voice is selected once on boot and reused for
// every utterance so the narrator sounds like the same character every time.

import { useEffect, useState } from "react";

const STORAGE_KEY = "nabu.tts.enabled";
const EVENT_NAME = "nabu-tts-changed";

export function isTtsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // Default: ON.
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function setTtsEnabled(next: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  } catch {
    /* ignore */
  }
  if (!next) {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  }
}

export function useTtsSetting(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => isTtsEnabled());
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setEnabled(typeof detail === "boolean" ? detail : isTtsEnabled());
    };
    window.addEventListener(EVENT_NAME, onChange as EventListener);
    return () => window.removeEventListener(EVENT_NAME, onChange as EventListener);
  }, []);
  return [
    enabled,
    (next) => {
      setTtsEnabled(next);
      setEnabled(next);
    },
  ];
}

// ── Stable narrator voice selection ─────────────────────────────────────────
// Web Speech voices load asynchronously in Chrome. We pick once and cache.
let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceQueryAttempted = false;

// Ordered by "best kid-friendly US English female" we want.
const PREFERRED_VOICE_NAMES = [
  "Google US English",
  "Samantha",
  "Karen",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Zira - English (United States)",
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Zira",
];

function pickNarratorVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices.length) return null;

  for (const name of PREFERRED_VOICE_NAMES) {
    const v = voices.find((vv) => vv.name === name);
    if (v) return v;
  }
  // Fall back: any en-US female-flagged, then any en-US, then any en-*.
  const enUS = voices.filter((v) => v.lang === "en-US");
  const female = enUS.find((v) => /female|samantha|karen|aria|jenny|zira/i.test(v.name));
  return female ?? enUS[0] ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}

function ensureNarratorVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const synth = window.speechSynthesis;
  if (!synth) return null;
  if (cachedVoice) return cachedVoice;
  cachedVoice = pickNarratorVoice();
  if (!cachedVoice && !voiceQueryAttempted) {
    voiceQueryAttempted = true;
    // Trigger async voice load; will be picked up next call.
    synth.onvoiceschanged = () => {
      cachedVoice = pickNarratorVoice();
    };
  }
  return cachedVoice;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  // Warm up early.
  ensureNarratorVoice();
}

interface SpeakOptions {
  rate?: number; // 0.1 – 10, default 0.95 (slightly slower, kid-friendly)
  pitch?: number; // 0 – 2, default 1.15 (warmer, friendlier)
  volume?: number; // 0 – 1, default 1
  lang?: string; // default "en-US"
  /** When false, don't cancel speech that's currently playing. Default true. */
  interrupt?: boolean;
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (typeof window === "undefined") return;
  if (!isTtsEnabled()) return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    if (opts.interrupt !== false) {
      synth.cancel();
    } else if (synth.speaking) {
      // Don't stack utterances — drop this one.
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1.15;
    u.volume = opts.volume ?? 1;
    u.lang = opts.lang ?? "en-US";
    const voice = ensureNarratorVoice();
    if (voice) u.voice = voice;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

/**
 * Speak a word, but politely wait (up to capMs) for any in-flight narration
 * to finish first. Used by the "Hear it" button so tapping it doesn't chop
 * off the narrator mid-sentence.
 */
export function speakWordPolite(word: string, capMs = 500): void {
  if (typeof window === "undefined") return;
  if (!isTtsEnabled()) return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  const start = Date.now();
  const tryNow = () => {
    if (!synth.speaking || Date.now() - start >= capMs) {
      speak(word, { rate: 0.8, pitch: 1.1, interrupt: true });
    } else {
      window.setTimeout(tryNow, 60);
    }
  };
  tryNow();
}

export function cancelSpeech(): void {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}
