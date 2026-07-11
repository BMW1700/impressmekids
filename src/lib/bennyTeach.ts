// bennyTeach — orchestrates multi-segment "teach me" playback for a word.
// Fetches each segment MP3 (cache-first via prek-word-tts edge function),
// then plays them in order with real, code-controlled silences between.
//
// Pace toggle (🐢/🚶/🏃) only stretches the *gaps* between segments — the
// audio itself is generated at kind-specific ElevenLabs speeds so it never
// sounds chipmunked or muddled.

import { supabase } from "@/integrations/supabase/client";
import {
  segmentWord,
  type Segment,
  type SegKind,
} from "@/lib/phonicsSegmenter";

export type Pace = "slow" | "normal" | "fast";

const PACE_GAP_MULT: Record<Pace, number> = {
  slow: 1.5,
  normal: 1.0,
  fast: 0.55,
};

const PACE_STORAGE_KEY = "bennyTeachPace";

export function getBennyPace(): Pace {
  try {
    const v = localStorage.getItem(PACE_STORAGE_KEY);
    if (v === "slow" || v === "normal" || v === "fast") return v;
  } catch {}
  return "slow"; // Pre-K default — parent complaint was "too fast"
}

export function setBennyPace(p: Pace) {
  try {
    localStorage.setItem(PACE_STORAGE_KEY, p);
  } catch {}
}

const urlCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

function segKey(kind: SegKind, text: string, voiceId: string | undefined) {
  return `${voiceId ?? ""}::${kind}::${text}`;
}

async function fetchSegmentUrl(
  kind: SegKind,
  text: string,
  voiceId: string | undefined,
): Promise<string | null> {
  const key = segKey(kind, text, voiceId);
  const cached = urlCache.get(key);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.functions.invoke("prek-word-tts", {
      body: { mode: "teach-segment", segmentKind: kind, segmentText: text, voiceId },
    });
    if (error || !data?.signedUrl) {
      console.warn("[bennyTeach] segment fetch failed", kind, text, error);
      return null;
    }
    urlCache.set(key, data.signedUrl as string);
    return data.signedUrl as string;
  } catch (err) {
    console.warn("[bennyTeach] segment fetch threw", err);
    return null;
  }
}

export function stopBennyTeach() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {}
    currentAudio = null;
  }
}

function playUrl(url: string, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    const audio = new Audio(url);
    audio.preload = "auto";
    currentAudio = audio;
    const done = () => {
      audio.onended = null;
      audio.onerror = null;
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    if (signal) {
      const onAbort = () => {
        try { audio.pause(); audio.src = ""; } catch {}
        done();
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }
    audio.play().catch(() => done());
  });
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

export interface TeachWordOptions {
  voiceId?: string;
  pace?: Pace;
  signal?: AbortSignal;
  onSegmentStart?: (seg: Segment, index: number) => void;
  onDone?: () => void;
}

/** Teach the child a word, sound by sound, in Benny's voice. */
export async function teachWord(word: string, opts: TeachWordOptions = {}): Promise<void> {
  const segs = segmentWord(word);
  if (segs.length === 0) return;
  const pace = opts.pace ?? getBennyPace();
  const gapMult = PACE_GAP_MULT[pace];

  stopBennyTeach();

  // Fire off every fetch in parallel — most will be $0 cache hits.
  const urlPromises = segs.map((s) => fetchSegmentUrl(s.kind, s.text, opts.voiceId));

  for (let i = 0; i < segs.length; i++) {
    if (opts.signal?.aborted) break;
    const seg = segs[i];
    opts.onSegmentStart?.(seg, i);
    const url = await urlPromises[i];
    if (url) {
      await playUrl(url, opts.signal);
    }
    if (opts.signal?.aborted) break;
    await delay(seg.gapAfterMs * gapMult, opts.signal);
  }
  opts.onDone?.();
}
