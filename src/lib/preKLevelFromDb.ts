// Resolves a Pre-K video level from the database (prek_worlds / prek_levels /
// prek_level_words) into the same VideoLevel shape that the cinematic runner
// already consumes. Returns null if no DB level exists OR if any required
// video URL is missing — callers should fall back to the hardcoded data file.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VideoLevel, VideoStep } from "@/data/preKAdventuresVideo";

export const PREK_VIDEO_BUCKET = "prek-level-videos";

/**
 * If `value` looks like a full URL (http(s) or /__l5e/ asset path) we return
 * it as-is. Otherwise we treat it as a storage path inside the prek bucket
 * and request a 1-hour signed URL.
 */
async function resolveUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  const { data, error } = await supabase.storage
    .from(PREK_VIDEO_BUCKET)
    .createSignedUrl(value, 60 * 60);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export interface PreKDbLevelRow {
  id: string;
  world_id: string;
  level_number: number;
  title: string;
  goal: string;
  ending_line: string;
  opening_video_url: string | null;
  closing_video_url: string | null;
  is_published: boolean;
}

export interface PreKDbWordRow {
  id: string;
  level_id: string;
  sort_order: number;
  word: string;
  ask_line: string;
  success_line: string;
  first_video_url: string | null;
  second_video_url: string | null;
  hold_poster_url: string | null;
}

/** Fetch a DB level + words by world_number + level_number. */
export async function fetchPreKDbLevel(
  worldNumber: number,
  levelNumber: number,
): Promise<{ level: PreKDbLevelRow; words: PreKDbWordRow[] } | null> {
  const { data: world } = await supabase
    .from("prek_worlds")
    .select("id")
    .eq("world_number", worldNumber)
    .maybeSingle();
  if (!world) return null;

  const { data: level } = await supabase
    .from("prek_levels")
    .select(
      "id, world_id, level_number, title, goal, ending_line, opening_video_url, closing_video_url, is_published",
    )
    .eq("world_id", world.id)
    .eq("level_number", levelNumber)
    .maybeSingle();
  if (!level) return null;

  const { data: words } = await supabase
    .from("prek_level_words")
    .select(
      "id, level_id, sort_order, word, ask_line, success_line, first_video_url, second_video_url, hold_poster_url",
    )
    .eq("level_id", level.id)
    .order("sort_order", { ascending: true });

  return { level: level as PreKDbLevelRow, words: (words ?? []) as PreKDbWordRow[] };
}

/**
 * Build a runtime VideoLevel from DB rows. Returns null if any required
 * video URL is missing (e.g. the seeded Visit Grandma level has no DB videos
 * yet — we fall back to the hardcoded data file in that case).
 */
export async function buildVideoLevelFromDb(
  worldNumber: number,
  levelNumber: number,
): Promise<VideoLevel | null> {
  const fetched = await fetchPreKDbLevel(worldNumber, levelNumber);
  if (!fetched) return null;
  const { level, words } = fetched;

  const opening = await resolveUrl(level.opening_video_url);
  const closing = await resolveUrl(level.closing_video_url);
  if (!opening || !closing || words.length === 0) return null;

  const steps: VideoStep[] = [{ kind: "clip", src: opening }];

  for (const w of words) {
    const first = await resolveUrl(w.first_video_url);
    const second = await resolveUrl(w.second_video_url);
    const poster = await resolveUrl(w.hold_poster_url);
    if (!first || !second) return null;

    steps.push({ kind: "clip", src: first, poster: poster ?? undefined });
    steps.push({
      kind: "word",
      word: w.word,
      askLine: w.ask_line,
      successLine: w.success_line || undefined,
      holdPoster: poster ?? undefined,
    });
    steps.push({ kind: "clip", src: second });
  }

  steps.push({ kind: "clip", src: closing });

  return {
    id: `db-w${worldNumber}-l${levelNumber}`,
    goal: level.goal || level.title,
    endingLine: level.ending_line || "",
    steps,
  };
}

/**
 * Hook: load DB-backed VideoLevel; null while loading or if none/incomplete.
 * Caller should fall back to the hardcoded data file when this returns null
 * after `loading` flips false.
 */
export function usePreKVideoLevel(worldNumber: number, levelNumber: number) {
  const [level, setLevel] = useState<VideoLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    buildVideoLevelFromDb(worldNumber, levelNumber)
      .then((v) => {
        if (!cancelled) {
          setLevel(v);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLevel(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [worldNumber, levelNumber]);

  return { level, loading };
}
