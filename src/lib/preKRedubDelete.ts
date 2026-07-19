// Deletes a scene's redub: soft-deletes the timeline clip on track 90,
// clears the scene entry from prek_levels.redub_audio_paths + redub_isolated_paths,
// so the row goes back to "not yet redubbed" and the stale isolated stem
// cache is busted (next Redub click will re-isolate cleanly).

import { supabase } from "@/integrations/supabase/client";

const REDUB_TRACK_INDEX = 90;

export async function deletePreKRedub(levelId: string, sceneKey: string): Promise<void> {
  // 1. Soft-delete the redub timeline clip for this scene.
  await supabase
    .from("prek_level_audio_clips")
    .update({ deleted_at: new Date().toISOString() })
    .eq("level_id", levelId)
    .eq("track_index", REDUB_TRACK_INDEX)
    .eq("anchor_scene_key", sceneKey)
    .eq("source_kind", "redub")
    .is("deleted_at", null);

  // 2. Strip the scene entry from JSONB paths so the UI shows "no redub yet"
  //    and the next run doesn't reuse a stale isolated stem.
  const { data } = await supabase
    .from("prek_levels")
    .select("redub_audio_paths, redub_isolated_paths")
    .eq("id", levelId)
    .maybeSingle();
  if (!data) return;
  const audio = { ...((data.redub_audio_paths as Record<string, string> | null) ?? {}) };
  const iso = { ...(((data as any).redub_isolated_paths as Record<string, string> | null) ?? {}) };
  delete audio[sceneKey];
  delete iso[sceneKey];
  await supabase
    .from("prek_levels")
    .update({ redub_audio_paths: audio, redub_isolated_paths: iso } as any)
    .eq("id", levelId);
}
