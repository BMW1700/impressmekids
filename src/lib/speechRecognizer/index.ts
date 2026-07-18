/**
 * Speech recognizer adapter — one API, two backends.
 *
 * Web: uses window.SpeechRecognition / webkitSpeechRecognition (Web Speech API).
 * iOS/Android via Capacitor: uses @capacitor-community/speech-recognition
 * when installed and running on a native platform.
 *
 * Both backends return plain string transcripts. The Challenge Meter operates
 * on those transcripts inside `wordMatchingModes.ts`, so strictness is
 * identical across web and native — no threshold knobs live in the recognizer.
 */

import { Capacitor } from '@capacitor/core';

export interface RecognitionResult {
  transcript: string;
  isFinal: boolean;
  alternatives: string[];
  confidence: number;
}

export interface RecognizerHandle {
  stop: () => Promise<void> | void;
}

export interface StartOptions {
  language?: string;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult: (r: RecognitionResult) => void;
  onError?: (err: unknown) => void;
  onEnd?: () => void;
}

const isNative = () => {
  try {
    return Capacitor.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
};

async function startNative(opts: StartOptions): Promise<RecognizerHandle> {
  try {
    // Dynamic import so the web bundle doesn't require the native module.
    const mod: any = await import('@capacitor-community/speech-recognition').catch(() => null);
    if (!mod?.SpeechRecognition) {
      // Plugin not installed — fall back to web recognizer if available.
      return startWeb(opts);
    }
    const SR = mod.SpeechRecognition;
    await SR.requestPermissions?.();
    const listener = SR.addListener?.('partialResults', (data: { matches: string[] }) => {
      const alts = data?.matches ?? [];
      opts.onResult({
        transcript: alts[0] ?? '',
        isFinal: false,
        alternatives: alts,
        confidence: 1,
      });
    });
    await SR.start({
      language: opts.language ?? 'en-US',
      maxResults: opts.maxAlternatives ?? 5,
      prompt: '',
      partialResults: opts.interimResults ?? true,
      popup: false,
    });
    return {
      stop: async () => {
        try { await SR.stop(); } catch { /* ignore */ }
        try { listener?.remove?.(); } catch { /* ignore */ }
        opts.onEnd?.();
      },
    };
  } catch (err) {
    opts.onError?.(err);
    return { stop: () => {} };
  }
}

function startWeb(opts: StartOptions): RecognizerHandle {
  const Ctor: any =
    (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
    null;
  if (!Ctor) {
    opts.onError?.(new Error('Speech recognition not supported in this browser'));
    return { stop: () => {} };
  }
  const rec = new Ctor();
  rec.lang = opts.language ?? 'en-US';
  rec.interimResults = opts.interimResults ?? true;
  rec.continuous = true;
  rec.maxAlternatives = opts.maxAlternatives ?? 5;

  rec.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const alternatives: string[] = [];
      for (let j = 0; j < result.length; j++) alternatives.push(result[j].transcript);
      opts.onResult({
        transcript: alternatives[0] ?? '',
        isFinal: result.isFinal,
        alternatives,
        confidence: result[0]?.confidence ?? 0,
      });
    }
  };
  rec.onerror = (e: any) => opts.onError?.(e);
  rec.onend = () => opts.onEnd?.();
  try { rec.start(); } catch (err) { opts.onError?.(err); }

  return {
    stop: () => {
      try { rec.stop(); } catch { /* ignore */ }
    },
  };
}

export async function startRecognition(opts: StartOptions): Promise<RecognizerHandle> {
  if (isNative()) return startNative(opts);
  return startWeb(opts);
}

/**
 * IMPORTANT: Neither Web Speech nor iOS SFSpeechRecognizer expose a
 * strictness knob — they only return transcripts. All strictness tuning
 * in YubiLearn happens in the matcher (wordMatchingModes.ts) driven by the
 * per-student Challenge Meter setting. This adapter guarantees the matcher
 * receives identical inputs on both platforms.
 */
