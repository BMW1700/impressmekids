/** Per-scene override that lets the original video audio play on chosen clips. */
export type PreKOriginalAudioMode = "mix" | "original_only";
export type PreKOriginalAudioMap = Record<string, PreKOriginalAudioMode>;

export const PREK_REDUB_TRACK_INDEX = 90;

export function parseOriginalAudioMap(raw: unknown): PreKOriginalAudioMap {
  const out: PreKOriginalAudioMap = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === "mix" || v === "original_only") out[k] = v;
  }
  return out;
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

/** Drop redub clips on scenes set to "original only". Music/SFX stays. */
export function filterClipsForOriginalAudio<T extends { track_index: number; anchor_scene_key: string; source_kind?: string | null }>(
  clips: T[],
  map: PreKOriginalAudioMap,
): T[] {
  return clips.filter((c) => {
    const isRedub = c.track_index === PREK_REDUB_TRACK_INDEX || c.source_kind === "redub";
    return !(isRedub && map[c.anchor_scene_key] === "original_only");
  });
}
