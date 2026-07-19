import { supabase } from "@/integrations/supabase/client";
import { PREK_VIDEO_BUCKET } from "@/lib/preKLevelFromDb";
import { SCENE_KEYS } from "@/lib/preKSceneGraph";

export const PREK_MUSIC_TRACK_INDEX = 89;
export const PREK_REDUB_TRACK_INDEX = 90;

export interface PreKIntegrityLevel {
  id: string;
  opening_video_url: string | null;
  closing_video_url: string | null;
  mute_source_video_audio?: boolean | null;
  opening_video_duration_seconds?: number | null;
  closing_video_duration_seconds?: number | null;
  opening_trim_in_seconds?: number | null;
  opening_trim_out_seconds?: number | null;
  closing_trim_in_seconds?: number | null;
  closing_trim_out_seconds?: number | null;
}

export interface PreKIntegrityWord {
  id: string;
  sort_order: number;
  word: string;
  first_video_url: string | null;
  second_video_url: string | null;
  first_video_duration_seconds?: number | null;
  second_video_duration_seconds?: number | null;
  first_trim_in_seconds?: number | null;
  first_trim_out_seconds?: number | null;
  second_trim_in_seconds?: number | null;
  second_trim_out_seconds?: number | null;
}

export interface PreKLevelHealthIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface PreKLevelHealth {
  ready: boolean;
  checkedAt: string;
  videoSceneCount: number;
  requiredVideoCount: number;
  generatedRedubCount: number;
  generatedMusicCount: number;
  issues: PreKLevelHealthIssue[];
}

interface AudioClipRow {
  id: string;
  track_index: number;
  source_kind: string | null;
  anchor_scene_key: string;
  trim_start_seconds: number | null;
  trim_end_seconds: number | null;
  duration_seconds: number | null;
}

const storagePathOnly = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return null;
  return value;
};

export function sortPreKWords<T extends { sort_order: number; id: string }>(words: T[]): T[] {
  return [...words].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

export function getPreKVideoSceneKeys(words: PreKIntegrityWord[]): string[] {
  const keys: string[] = [SCENE_KEYS.opening];
  sortPreKWords(words).forEach((_, idx) => {
    const i = idx + 1;
    keys.push(SCENE_KEYS.wordFirst(i), SCENE_KEYS.wordSecond(i));
  });
  keys.push(SCENE_KEYS.closing);
  return keys;
}

function expectedTrimByScene(level: PreKIntegrityLevel, words: PreKIntegrityWord[]) {
  const out = new Map<string, { trimIn: number; trimOut: number | null; raw: number | null }>();
  out.set(SCENE_KEYS.opening, {
    trimIn: Number(level.opening_trim_in_seconds ?? 0),
    trimOut: level.opening_trim_out_seconds == null ? null : Number(level.opening_trim_out_seconds),
    raw: level.opening_video_duration_seconds == null ? null : Number(level.opening_video_duration_seconds),
  });
  sortPreKWords(words).forEach((w, idx) => {
    const i = idx + 1;
    out.set(SCENE_KEYS.wordFirst(i), {
      trimIn: Number(w.first_trim_in_seconds ?? 0),
      trimOut: w.first_trim_out_seconds == null ? null : Number(w.first_trim_out_seconds),
      raw: w.first_video_duration_seconds == null ? null : Number(w.first_video_duration_seconds),
    });
    out.set(SCENE_KEYS.wordSecond(i), {
      trimIn: Number(w.second_trim_in_seconds ?? 0),
      trimOut: w.second_trim_out_seconds == null ? null : Number(w.second_trim_out_seconds),
      raw: w.second_video_duration_seconds == null ? null : Number(w.second_video_duration_seconds),
    });
  });
  out.set(SCENE_KEYS.closing, {
    trimIn: Number(level.closing_trim_in_seconds ?? 0),
    trimOut: level.closing_trim_out_seconds == null ? null : Number(level.closing_trim_out_seconds),
    raw: level.closing_video_duration_seconds == null ? null : Number(level.closing_video_duration_seconds),
  });
  return out;
}

export async function clearPreKGeneratedAudioForScenes(levelId: string, sceneKeys: string[]) {
  const keys = Array.from(new Set(sceneKeys.filter(Boolean)));
  if (keys.length === 0) return;

  const { data: level } = await supabase
    .from("prek_levels")
    .select("redub_audio_paths, redub_isolated_paths, music_audio_paths")
    .eq("id", levelId)
    .maybeSingle();

  const stripKeys = (value: unknown) => {
    const next = { ...((value as Record<string, string> | null) ?? {}) };
    keys.forEach((k) => delete next[k]);
    return next;
  };

  await Promise.all([
    supabase
      .from("prek_level_audio_clips")
      .update({ deleted_at: new Date().toISOString() })
      .eq("level_id", levelId)
      .in("track_index", [PREK_MUSIC_TRACK_INDEX, PREK_REDUB_TRACK_INDEX])
      .in("anchor_scene_key", keys)
      .is("deleted_at", null),
    supabase
      .from("prek_levels")
      .update({
        redub_audio_paths: stripKeys((level as any)?.redub_audio_paths),
        redub_isolated_paths: stripKeys((level as any)?.redub_isolated_paths),
        music_audio_paths: stripKeys((level as any)?.music_audio_paths),
      } as any)
      .eq("id", levelId),
  ]);
}

export async function auditPreKLevelIntegrity(
  level: PreKIntegrityLevel,
  words: PreKIntegrityWord[],
): Promise<PreKLevelHealth> {
  const issues: PreKLevelHealthIssue[] = [];
  const sorted = sortPreKWords(words);
  const expectedSceneKeys = new Set(getPreKVideoSceneKeys(sorted));
  const trimMap = expectedTrimByScene(level, sorted);
  const requiredPaths = [
    level.opening_video_url,
    level.closing_video_url,
    ...sorted.flatMap((w) => [w.first_video_url, w.second_video_url]),
  ];

  sorted.forEach((w, idx) => {
    const expected = idx + 1;
    if (w.sort_order !== expected) {
      issues.push({
        severity: "error",
        code: "sort-order-gap",
        message: `Word order is not contiguous: "${w.word || w.id}" is ${w.sort_order}, should be ${expected}.`,
      });
    }
    if (!w.word?.trim()) {
      issues.push({ severity: "error", code: "missing-word", message: `Word ${expected} is missing spoken text.` });
    }
    if (!w.first_video_url) {
      issues.push({ severity: "error", code: "missing-first-video", message: `Word ${expected} (${w.word}) is missing its first video.` });
    }
    if (!w.second_video_url) {
      issues.push({ severity: "error", code: "missing-second-video", message: `Word ${expected} (${w.word}) is missing its second video.` });
    }
  });

  if (!level.opening_video_url) issues.push({ severity: "error", code: "missing-opening", message: "Opening video is missing." });
  if (!level.closing_video_url) issues.push({ severity: "error", code: "missing-closing", message: "Closing video is missing." });

  for (const [sceneKey, t] of trimMap) {
    if (t.trimIn < 0) issues.push({ severity: "error", code: "bad-trim", message: `${sceneKey} has a negative trim-in.` });
    if (t.trimOut != null && t.trimOut <= t.trimIn) issues.push({ severity: "error", code: "bad-trim", message: `${sceneKey} trim-out must be after trim-in.` });
    if (t.raw != null && t.trimIn >= t.raw) issues.push({ severity: "error", code: "bad-trim", message: `${sceneKey} trim-in is beyond the video duration.` });
    if (t.raw != null && t.trimOut != null && t.trimOut > t.raw + 0.05) issues.push({ severity: "error", code: "bad-trim", message: `${sceneKey} trim-out is beyond the video duration.` });
  }

  const storagePaths = requiredPaths.map(storagePathOnly).filter((p): p is string => !!p);
  if (storagePaths.length > 0) {
    const { data } = await supabase.storage.from(PREK_VIDEO_BUCKET).createSignedUrls(storagePaths, 60);
    const ok = new Set((data ?? []).filter((d) => d.signedUrl).map((d) => d.path));
    storagePaths.forEach((p) => {
      if (!ok.has(p)) {
        issues.push({ severity: "error", code: "missing-storage-file", message: `Video file is missing or inaccessible: ${p.split("/").pop()}` });
      }
    });
  }

  const { data: clipRows } = await supabase
    .from("prek_level_audio_clips")
    .select("id, track_index, source_kind, anchor_scene_key, trim_start_seconds, trim_end_seconds, duration_seconds")
    .eq("level_id", level.id)
    .is("deleted_at", null)
    .in("track_index", [PREK_MUSIC_TRACK_INDEX, PREK_REDUB_TRACK_INDEX]);

  const clips = ((clipRows ?? []) as unknown as AudioClipRow[]);
  const redubAnchors = new Set(clips.filter((c) => c.track_index === PREK_REDUB_TRACK_INDEX || c.source_kind === "redub").map((c) => c.anchor_scene_key));
  const musicAnchors = new Set(clips.filter((c) => c.track_index === PREK_MUSIC_TRACK_INDEX || c.source_kind === "music").map((c) => c.anchor_scene_key));
  const hasOverlayAudio = clips.length > 0;

  clips.forEach((c) => {
    if (!expectedSceneKeys.has(c.anchor_scene_key)) {
      issues.push({ severity: "error", code: "stale-audio-anchor", message: `Generated audio is attached to old scene key ${c.anchor_scene_key}.` });
      return;
    }
    const expectedTrim = trimMap.get(c.anchor_scene_key);
    if (!expectedTrim) return;
    const actualTrimStart = Number(c.trim_start_seconds ?? 0);
    if (Math.abs(actualTrimStart - expectedTrim.trimIn) > 0.05) {
      issues.push({ severity: "error", code: "audio-trim-drift", message: `${c.anchor_scene_key} audio trim (${actualTrimStart.toFixed(2)}s) does not match video trim (${expectedTrim.trimIn.toFixed(2)}s).` });
    }
  });

  if (hasOverlayAudio) {
    expectedSceneKeys.forEach((key) => {
      if (!redubAnchors.has(key)) {
        issues.push({ severity: "error", code: "missing-redub", message: `${key} has no redub audio, but overlay audio exists so source video audio will be muted.` });
      }
    });
  }

  expectedSceneKeys.forEach((key) => {
    if (hasOverlayAudio && !musicAnchors.has(key)) {
      issues.push({ severity: "warning", code: "missing-music", message: `${key} has no music/SFX stem.` });
    }
  });

  return {
    ready: !issues.some((i) => i.severity === "error"),
    checkedAt: new Date().toISOString(),
    videoSceneCount: expectedSceneKeys.size,
    requiredVideoCount: requiredPaths.length,
    generatedRedubCount: redubAnchors.size,
    generatedMusicCount: musicAnchors.size,
    issues,
  };
}