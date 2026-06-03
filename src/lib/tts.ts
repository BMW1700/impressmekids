// Browser Web Speech API helper for Pre-K Nabu speech bubbles.
// $0/month — no server, no key. Respects a user-controlled toggle stored in
// localStorage under "nabu.tts.enabled" (default ON). When the toggle is off,
// speak() is a no-op so the rest of the UI stays fully usable.

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

interface SpeakOptions {
  rate?: number; // 0.1 – 10, default 0.95 (slightly slower, kid-friendly)
  pitch?: number; // 0 – 2, default 1.15 (warmer, friendlier)
  volume?: number; // 0 – 1, default 1
  lang?: string; // default "en-US"
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (typeof window === "undefined") return;
  if (!isTtsEnabled()) return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1.15;
    u.volume = opts.volume ?? 1;
    u.lang = opts.lang ?? "en-US";
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

export function cancelSpeech(): void {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}
