/** Per-scene override that lets the original video audio play on chosen clips. */
export type PreKOriginalAudioMode = "mix" | "original_only";
export type PreKOriginalAudioEntry = {
  mode: PreKOriginalAudioMode;
  /** Seconds of the original sound cut from the clip's start (video time). */
  trimStartSec: number;
  /** Seconds of the original sound cut from the clip's end. */
  trimEndSec: number;
  fadeInSec: number;
  fadeOutSec: number;
};
export type PreKOriginalAudioMap = Record<string, PreKOriginalAudioEntry>;

export const PREK_REDUB_TRACK_INDEX = 90;
export const DEFAULT_ORIGINAL_FADE_SEC = 0.4;

const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback);

export function makeOriginalAudioEntry(mode: PreKOriginalAudioMode, prev?: PreKOriginalAudioEntry): PreKOriginalAudioEntry {
  return prev
    ? { ...prev, mode }
    : { mode, trimStartSec: 0, trimEndSec: 0, fadeInSec: DEFAULT_ORIGINAL_FADE_SEC, fadeOutSec: DEFAULT_ORIGINAL_FADE_SEC };
}

/** Accepts the old string format ("mix") and the new object format. */
export function parseOriginalAudioMap(raw: unknown): PreKOriginalAudioMap {
  const out: PreKOriginalAudioMap = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === "mix" || v === "original_only") {
      out[k] = { mode: v, trimStartSec: 0, trimEndSec: 0, fadeInSec: 0, fadeOutSec: 0 };
    } else if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (o.mode !== "mix" && o.mode !== "original_only") continue;
      out[k] = {
        mode: o.mode,
        trimStartSec: num(o.trimStartSec),
        trimEndSec: num(o.trimEndSec),
        fadeInSec: num(o.fadeInSec),
        fadeOutSec: num(o.fadeOutSec),
      };
    }
  }
  return out;
}

export function originalAudioMode(map: PreKOriginalAudioMap, key: string | null | undefined): PreKOriginalAudioMode | undefined {
  return key ? map[key]?.mode : undefined;
}

/** Should the source video be muted for this scene? */
export function shouldMuteSourceForScene(
  globalMute: boolean,
  sceneKey: string | null | undefined,
  map: PreKOriginalAudioMap,
): boolean {
  if (sceneKey && map[sceneKey]) return false;
  return globalMute;
}

/**
 * Volume (0–1) for the original sound at video time `tSec`. Scenes without an
 * override return 1 (mute is handled separately by shouldMuteSourceForScene).
 */
export function originalAudioGainAt(
  sceneKey: string | null | undefined,
  tSec: number,
  durationSec: number,
  map: PreKOriginalAudioMap,
): number {
  const e = sceneKey ? map[sceneKey] : undefined;
  if (!e) return 1;
  const start = e.trimStartSec;
  const end = Number.isFinite(durationSec) && durationSec > 0 ? durationSec - e.trimEndSec : Infinity;
  if (tSec < start || tSec > end) return 0;
  let g = 1;
  if (e.fadeInSec > 0) g = Math.min(g, (tSec - start) / e.fadeInSec);
  if (e.fadeOutSec > 0 && end !== Infinity) g = Math.min(g, (end - tSec) / e.fadeOutSec);
  return Math.max(0, Math.min(1, g));
}

/**
 * Keeps a video's volume following the trim window. Returns a stop function.
 * A short per-frame ramp avoids clicks.
 */
export function followOriginalAudioGain(
  video: HTMLVideoElement,
  getSceneKey: () => string | null | undefined,
  getMap: () => PreKOriginalAudioMap,
): () => void {
  let raf = 0;
  const tick = () => {
    const target = originalAudioGainAt(getSceneKey(), video.currentTime || 0, video.duration, getMap());
    const cur = video.volume;
    const next = Math.abs(target - cur) < 0.02 ? target : cur + (target - cur) * 0.35;
    if (next !== cur) { try { video.volume = next; } catch { /* iOS: volume is read-only */ } }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); try { video.volume = 1; } catch { /* noop */ } };
}

/** Drop redub clips on scenes set to "original only". Music/SFX stays. */
export function filterClipsForOriginalAudio<T extends { track_index: number; anchor_scene_key: string; source_kind?: string | null }>(
  clips: T[],
  map: PreKOriginalAudioMap,
): T[] {
  return clips.filter((c) => {
    const isRedub = c.track_index === PREK_REDUB_TRACK_INDEX || c.source_kind === "redub";
    return !(isRedub && map[c.anchor_scene_key]?.mode === "original_only");
  });
}
