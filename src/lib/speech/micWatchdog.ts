/**
 * Shared microphone recovery helpers.
 *
 * Both the RPG reader (`RPGWordReader`) and the singleton
 * `speechRecognitionManager` use these so restart behaviour is identical:
 *
 *  - exponential backoff instead of a flat hot-loop retry (Chrome rate-limits
 *    rapid SpeechRecognition.start() calls and will eventually stop serving
 *    them entirely, which is what made the mic "die after a while")
 *  - a heartbeat watchdog that cold-restarts a session that should be
 *    listening but has produced no activity.
 */

const BACKOFF_STEPS_MS = [150, 300, 600, 1200, 2000, 2500];

/** Backoff delay for the Nth consecutive failure (0-indexed). */
export function backoffDelay(failureCount: number): number {
  if (failureCount <= 0) return BACKOFF_STEPS_MS[0];
  return BACKOFF_STEPS_MS[Math.min(failureCount, BACKOFF_STEPS_MS.length - 1)];
}

/** Detach every handler so a dead recognition object goes fully inert. */
export function detachRecognition(rec: any): void {
  if (!rec) return;
  try { rec.onstart = null; } catch { /* ignore */ }
  try { rec.onresult = null; } catch { /* ignore */ }
  try { rec.onerror = null; } catch { /* ignore */ }
  try { rec.onend = null; } catch { /* ignore */ }
  try { rec.onaudiostart = null; } catch { /* ignore */ }
  try { rec.onspeechend = null; } catch { /* ignore */ }
}

/** Detach handlers and hard-abort. A recognition object is single-use. */
export function killRecognition(rec: any): void {
  if (!rec) return;
  detachRecognition(rec);
  try {
    if (typeof rec.abort === 'function') rec.abort();
    else rec.stop?.();
  } catch { /* ignore */ }
}

export interface WatchdogOptions {
  /** How often to check, ms. */
  intervalMs?: number;
  /** True when the caller still wants the mic open. */
  shouldBeListening: () => boolean;
  /** Milliseconds since the last observed mic activity (start / result). */
  msSinceActivity: () => number;
  /** True when a session is currently starting or running. */
  isBusy: () => boolean;
  /** Called when the watchdog decides a cold restart is required. */
  onRecover: () => void;
  /** Stall threshold before recovery kicks in. */
  stallMs?: number;
}

export function startMicWatchdog(opts: WatchdogOptions): () => void {
  const interval = opts.intervalMs ?? 2000;
  const stall = opts.stallMs ?? 4000;

  const id = setInterval(() => {
    try {
      if (!opts.shouldBeListening()) return;
      if (opts.isBusy() && opts.msSinceActivity() < stall) return;
      if (opts.msSinceActivity() < stall) return;
      console.warn('[MicWatchdog] Mic stalled — cold restarting session');
      opts.onRecover();
    } catch (e) {
      console.log('[MicWatchdog] tick failed', e);
    }
  }, interval);

  return () => clearInterval(id);
}
