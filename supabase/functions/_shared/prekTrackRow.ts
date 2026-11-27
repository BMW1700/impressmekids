// Make sure a Pre-K timeline row (e.g. Benny Redub = 90, Benny Music = 89)
// exists AND is visible before clips are saved onto it.
//
// An upsert with ignoreDuplicates alone is not enough: if the row was deleted
// earlier (soft-delete keeps it in the table), the upsert silently skips and
// new clips land on a hidden row. So we insert-if-missing, then always revive.
// Both steps are idempotent and safe when parallel workers race.
// deno-lint-ignore no-explicit-any
export async function ensurePreKTrackRow(admin: any, args: {
  levelId: string;
  trackIndex: number;
  name: string;
  volume: number;
}): Promise<void> {
  await admin
    .from("prek_level_audio_tracks")
    .upsert(
      { level_id: args.levelId, track_index: args.trackIndex, name: args.name, volume: args.volume, muted: false },
      { onConflict: "level_id,track_index", ignoreDuplicates: true },
    );
  await admin
    .from("prek_level_audio_tracks")
    .update({ deleted_at: null })
    .eq("level_id", args.levelId)
    .eq("track_index", args.trackIndex)
    .not("deleted_at", "is", null);
}
