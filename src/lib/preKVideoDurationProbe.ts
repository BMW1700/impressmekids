// Probes the duration of a Pre-K source video by loading it into a detached
// <video> element and reading `videoEl.duration`. Used to auto-backfill the
// `*_video_duration_seconds` columns on existing levels so the audio overlay
// editor's scene graph has accurate timing without requiring authors to
// re-upload anything.

import { supabase } from "@/integrations/supabase/client";
import { PREK_VIDEO_BUCKET } from "@/lib/preKLevelFromDb";

async function signedUrlFor(pathOrUrl: string): Promise<string | null> {
  if (/^https?:\/\//.test(pathOrUrl) || pathOrUrl.startsWith("/")) return pathOrUrl;
  const { data } = await supabase.storage
    .from(PREK_VIDEO_BUCKET)
    .createSignedUrl(pathOrUrl, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function probeVideoDuration(pathOrUrl: string): Promise<number | null> {
  const src = await signedUrlFor(pathOrUrl);
  if (!src) return null;
  return new Promise<number | null>((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    const cleanup = () => {
      v.removeAttribute("src");
      try { v.load(); } catch { /* noop */ }
    };
    const timeout = window.setTimeout(() => { cleanup(); resolve(null); }, 15000);
    v.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : null;
      cleanup();
      resolve(d);
    };
    v.onerror = () => { window.clearTimeout(timeout); cleanup(); resolve(null); };
    v.src = src;
  });
}

interface LevelLike {
  id: string;
  opening_video_url: string | null;
  closing_video_url: string | null;
  opening_video_duration_seconds: number | null;
  closing_video_duration_seconds: number | null;
}
interface WordLike {
  id: string;
  first_video_url: string | null;
  second_video_url: string | null;
  first_video_duration_seconds: number | null;
  second_video_duration_seconds: number | null;
}

// Auto-fills any missing duration columns for a level + its words. Returns the
// number of rows updated so callers can decide whether to reload state.
export async function backfillLevelVideoDurations(
  level: LevelLike,
  words: WordLike[],
): Promise<number> {
  let updated = 0;

  // Level-level (opening / closing)
  const levelPatch: Record<string, number> = {};
  if (level.opening_video_url && level.opening_video_duration_seconds == null) {
    const d = await probeVideoDuration(level.opening_video_url);
    if (d != null) levelPatch.opening_video_duration_seconds = d;
  }
  if (level.closing_video_url && level.closing_video_duration_seconds == null) {
    const d = await probeVideoDuration(level.closing_video_url);
    if (d != null) levelPatch.closing_video_duration_seconds = d;
  }
  if (Object.keys(levelPatch).length > 0) {
    const { error } = await supabase.from("prek_levels").update(levelPatch).eq("id", level.id);
    if (!error) updated++;
  }

  // Word-level (first / second)
  for (const w of words) {
    const patch: Record<string, number> = {};
    if (w.first_video_url && w.first_video_duration_seconds == null) {
      const d = await probeVideoDuration(w.first_video_url);
      if (d != null) patch.first_video_duration_seconds = d;
    }
    if (w.second_video_url && w.second_video_duration_seconds == null) {
      const d = await probeVideoDuration(w.second_video_url);
      if (d != null) patch.second_video_duration_seconds = d;
    }
    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("prek_level_words").update(patch).eq("id", w.id);
      if (!error) updated++;
    }
  }

  return updated;
}
