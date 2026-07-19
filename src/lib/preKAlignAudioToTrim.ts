// Realigns Pre-K audio clips (redub + music) so their `trim_start_seconds`
// and `trim_end_seconds` follow the current video trims
// on the parent scene. Fixes the "audio ~0.8s ahead of video" drift that
// happens when a video is trimmed AFTER redub/music has already been
// generated. No audio regeneration, no ElevenLabs/LALAL cost — millisecond-
// locked purely by patching DB rows.

import { supabase } from "@/integrations/supabase/client";
import { buildSceneGraph } from "./preKSceneGraph";

const REDUB_TRACK_INDEX = 90;
const MUSIC_TRACK_INDEX = 89;

type SceneMap = Map<
  string,
  { trimIn: number; trimOut: number | null; raw: number }
>;

async function loadSceneMap(levelId: string): Promise<SceneMap | null> {
  const [{ data: level }, { data: words }] = await Promise.all([
    supabase.from("prek_levels").select("*").eq("id", levelId).maybeSingle(),
    supabase
      .from("prek_level_words")
      .select("*")
      .eq("level_id", levelId)
      .order("sort_order"),
  ]);
  if (!level) return null;
  const graph = buildSceneGraph(level as any, (words ?? []) as any);
  const map: SceneMap = new Map();
  for (const s of graph.scenes) {
    if (s.sourceRawDurationSeconds == null) continue;
    map.set(s.key, {
      trimIn: Number(s.sourceTrimInSeconds ?? 0),
      trimOut: s.sourceTrimOutSeconds ?? null,
      raw: Number(s.sourceRawDurationSeconds),
    });
  }
  return map;
}

/**
 * For each redub/music clip on this level, set trim_start / trim_end to match
 * the scene's current video trim. Do NOT overwrite duration_seconds here: that
 * column represents the audio file's actual duration, not the video duration.
 *
 * Returns the number of clips that were actually patched (drift found).
 */
export async function alignPreKAudioClipsToVideoTrims(
  levelId: string,
): Promise<number> {
  const sceneMap = await loadSceneMap(levelId);
  if (!sceneMap) return 0;

  const { data: clips, error } = await supabase
    .from("prek_level_audio_clips")
    .select(
      "id, anchor_scene_key, source_kind, track_index, trim_start_seconds, trim_end_seconds, duration_seconds",
    )
    .eq("level_id", levelId)
    .is("deleted_at", null)
    .in("track_index", [REDUB_TRACK_INDEX, MUSIC_TRACK_INDEX]);
  if (error || !clips) return 0;

  let patched = 0;
  const EPS = 0.01;

  for (const c of clips) {
    if (!c.anchor_scene_key) continue;
    const scene = sceneMap.get(c.anchor_scene_key);
    if (!scene) continue;

    const raw = scene.raw;
    const trimIn = scene.trimIn;
    const trimOut = scene.trimOut;

    // Redub: keep a small tail (+2s) since ElevenLabs can add a sentence tail;
    // clamp to raw. If ≥ raw, no need for a hard cut.
    // Music: mirror the video trim-out exactly so audio doesn't outlast video.
    let newTrimEnd: number | null;
    if (c.source_kind === "redub") {
      if (trimOut == null) newTrimEnd = null;
      else {
        const withTail = Math.min(raw, trimOut + 2);
        newTrimEnd = withTail >= raw - EPS ? null : withTail;
      }
    } else {
      // music (or anything else riding video trims)
      if (trimOut == null || trimOut >= raw - EPS) newTrimEnd = null;
      else newTrimEnd = trimOut;
    }

    const curTrimStart = Number(c.trim_start_seconds ?? 0);
    const curTrimEnd =
      c.trim_end_seconds == null ? null : Number(c.trim_end_seconds);
    const trimStartDrift = Math.abs(curTrimStart - trimIn) > EPS;
    const trimEndDrift =
      (curTrimEnd == null) !== (newTrimEnd == null) ||
      (curTrimEnd != null &&
        newTrimEnd != null &&
        Math.abs(curTrimEnd - newTrimEnd) > EPS);

    if (!trimStartDrift && !trimEndDrift) continue;

    const { error: upErr } = await supabase
      .from("prek_level_audio_clips")
      .update({
        trim_start_seconds: trimIn,
        trim_end_seconds: newTrimEnd,
      })
      .eq("id", c.id);
    if (!upErr) patched += 1;
  }

  return patched;
}
