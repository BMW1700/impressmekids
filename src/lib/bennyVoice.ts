// bennyVoice — cached ElevenLabs TTS playback for Pre-K word pronunciation.
//
// Falls back to Web Speech (playCorrectPronunciation) if the edge function
// fails or ElevenLabs is unreachable, so we never leave a child in silence.

import { supabase } from "@/integrations/supabase/client";
import { playCorrectPronunciation, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

export type BennyVoiceMode = "say" | "teach";

const urlCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

// Optional per-app default; individual worlds can override with `default_redub_voice_id`.
const DEFAULT_VOICE_ID: string | undefined = undefined;

function cacheKey(word: string, voiceId: string | undefined, mode: BennyVoiceMode) {
  return `${voiceId ?? ""}::${mode}::${word.toLowerCase().trim()}`;
}

async function fetchSignedUrl(
  word: string,
  voiceId: string | undefined,
  mode: BennyVoiceMode,
): Promise<string | null> {
  const key = cacheKey(word, voiceId, mode);
  const cached = urlCache.get(key);
  if (cached) return cached;

  const { data, error } = await supabase.functions.invoke("prek-word-tts", {
    body: { word, voiceId, mode },
  });
  if (error || !data?.signedUrl) {
    console.warn("[bennyVoice] edge function failed:", error);
    return null;
  }
  urlCache.set(key, data.signedUrl as string);
  return data.signedUrl as string;
}

export function stopBenny() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {}
    currentAudio = null;
  }
}

export interface SpeakBennyOptions {
  mode?: BennyVoiceMode;
  voiceId?: string;
  volume?: number;
}

export async function speakBenny(word: string, opts: SpeakBennyOptions = {}): Promise<void> {
  const mode = opts.mode ?? "say";
  const voiceId = opts.voiceId ?? DEFAULT_VOICE_ID;
  const volume = opts.volume ?? 1.0;

  // Unlock Web Speech in case we fall back
  unlockSpeechSynthesis();
  stopBenny();

  const url = await fetchSignedUrl(word, voiceId, mode);
  if (!url) {
    // Fallback to browser TTS so the child still hears something
    playCorrectPronunciation(word);
    return;
  }

  try {
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.preload = "auto";
    currentAudio = audio;
    await audio.play();
  } catch (err) {
    console.warn("[bennyVoice] playback failed, falling back to Web Speech:", err);
    playCorrectPronunciation(word);
  }
}
