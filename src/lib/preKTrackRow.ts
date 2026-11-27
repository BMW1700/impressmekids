import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Make sure a Pre-K timeline row exists and is visible before clips are saved
 * onto it. Inserts when missing, then revives it if it was deleted earlier —
 * otherwise new clips would land on a hidden row.
 */
export async function ensurePreKTrackRow(
  client: SupabaseClient,
  args: { levelId: string; trackIndex: number; name: string; volume: number },
): Promise<void> {
  await client
    .from("prek_level_audio_tracks")
    .upsert(
      { level_id: args.levelId, track_index: args.trackIndex, name: args.name, volume: args.volume, muted: false },
      { onConflict: "level_id,track_index", ignoreDuplicates: true },
    );
  await client
    .from("prek_level_audio_tracks")
    .update({ deleted_at: null })
    .eq("level_id", args.levelId)
    .eq("track_index", args.trackIndex)
    .not("deleted_at", "is", null);
}

export interface HiddenClipRow {
  trackIndex: number;
  clipCount: number;
  label: string;
}

/** Live clips sitting on a row that is missing or deleted — they'd be invisible on the timeline. */
export function findHiddenClipRows(
  tracks: { track_index: number }[],
  clips: { track_index: number; source_kind?: string | null }[],
): HiddenClipRow[] {
  const visible = new Set(tracks.map((t) => t.track_index));
  const byIndex = new Map<number, { count: number; kinds: Set<string> }>();
  for (const c of clips) {
    if (visible.has(c.track_index)) continue;
    const entry = byIndex.get(c.track_index) ?? { count: 0, kinds: new Set<string>() };
    entry.count += 1;
    if (c.source_kind) entry.kinds.add(c.source_kind);
    byIndex.set(c.track_index, entry);
  }
  return [...byIndex.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([trackIndex, e]) => ({
      trackIndex,
      clipCount: e.count,
      label: trackIndex === 90 || e.kinds.has("redub") ? "Benny (Redub)"
        : trackIndex === 89 || e.kinds.has("music") ? "Benny (Music)"
        : `Track ${trackIndex + 1}`,
    }));
}

/** Volume a restored row should get. */
export function defaultVolumeForRow(trackIndex: number): number {
  return trackIndex === 89 ? 0.8 : 1.0;
}
