// Resolves a Pre-K video level from the database (prek_worlds / prek_levels /
// prek_level_words) into the same VideoLevel shape that the cinematic runner
// already consumes. Returns null if no DB level exists OR if any required
// video URL is missing — callers should fall back to the hardcoded data file.
//
// Performance design:
//   - One world lookup, one level lookup, one words lookup (the words query
//     can't be folded into the level query without a join helper because
//     PostgREST embeds add latency). All signed-URL resolutions then fire in
//     a single Promise.all batch so ~20 Storage roundtrips collapse to one
//     wall-clock wait.
//   - Built levels are memoized in a module-level cache keyed by
//     `${worldNumber}:${levelNumber}` so re-opening a level in the same
//     session is instant. Cache TTL matches the signed-URL TTL (7 days) with
//     a safety margin.
//   - `prefetchPreKVideoLevel` lets the level-select grid warm the cache
//     before the player taps.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VideoLevel, VideoStep } from "@/data/preKAdventuresVideo";

export const PREK_VIDEO_BUCKET = "prek-level-videos";

// Signed URLs live for 7 days; cache them for 6 to be safe.
const CACHE_TTL_MS = 6 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  level: VideoLevel | null;
  dbLevelId: string | null;
  expiresAt: number;
}

// Module-level in-memory cache. Survives navigation, dies on full reload.
const levelCache = new Map<string, CacheEntry>();
// De-duplicate concurrent in-flight builds for the same level.
const inflight = new Map<string, Promise<CacheEntry>>();

const cacheKey = (world: number, level: number) => `${world}:${level}`;

/**
 * Resolve a storage path / URL to a playable URL. Pass-through for full URLs
 * and asset paths; signed URL for storage paths. Caller is expected to batch
 * these in a Promise.all.
 */
async function resolveUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  const { data, error } = await supabase.storage
    .from(PREK_VIDEO_BUCKET)
    .createSignedUrl(value, 60 * 60 * 24 * 7);
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
  opening_trim_in_seconds: number | null;
  opening_trim_out_seconds: number | null;
  closing_trim_in_seconds: number | null;
  closing_trim_out_seconds: number | null;
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
  first_trim_in_seconds: number | null;
  first_trim_out_seconds: number | null;
  second_trim_in_seconds: number | null;
  second_trim_out_seconds: number | null;
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
      "id, world_id, level_number, title, goal, ending_line, opening_video_url, closing_video_url, is_published, opening_trim_in_seconds, opening_trim_out_seconds, closing_trim_in_seconds, closing_trim_out_seconds",
    )
    .eq("world_id", world.id)
    .eq("level_number", levelNumber)
    .maybeSingle();
  if (!level) return null;

  const { data: words } = await supabase
    .from("prek_level_words")
    .select(
      "id, level_id, sort_order, word, ask_line, success_line, first_video_url, second_video_url, hold_poster_url, first_trim_in_seconds, first_trim_out_seconds, second_trim_in_seconds, second_trim_out_seconds",
    )
    .eq("level_id", level.id)
    .order("sort_order", { ascending: true });

  return { level: level as PreKDbLevelRow, words: (words ?? []) as PreKDbWordRow[] };
}

function trimOrUndef(n: number | null | undefined): number | undefined {
  return n === null || n === undefined ? undefined : Number(n);
}

/**
 * Build a runtime VideoLevel from DB rows. Parallelizes ALL signed-URL
 * requests so a 6-word level takes the time of one Storage roundtrip rather
 * than ~20 sequential ones. Returns both the built level and the DB level id
 * in one pass — no second fetch needed.
 */
async function buildLevelEntry(
  worldNumber: number,
  levelNumber: number,
): Promise<CacheEntry> {
  const fetched = await fetchPreKDbLevel(worldNumber, levelNumber);
  if (!fetched) return { level: null, dbLevelId: null, expiresAt: Date.now() + CACHE_TTL_MS };
  const { level, words } = fetched;

  // Collect every storage path / URL up front, resolve them in parallel.
  const paths: (string | null)[] = [];
  paths.push(level.opening_video_url);
  paths.push(level.closing_video_url);
  for (const w of words) {
    paths.push(w.first_video_url);
    paths.push(w.second_video_url);
    paths.push(w.hold_poster_url);
  }

  const resolved = await Promise.all(paths.map((p) => resolveUrl(p)));

  const opening = resolved[0];
  const closing = resolved[1];
  if (!opening || !closing || words.length === 0) {
    return { level: null, dbLevelId: level.id, expiresAt: Date.now() + CACHE_TTL_MS };
  }

  const steps: VideoStep[] = [{
    kind: "clip",
    src: opening,
    trimIn: trimOrUndef(level.opening_trim_in_seconds),
    trimOut: trimOrUndef(level.opening_trim_out_seconds),
  }];

  let offset = 2;
  for (const w of words) {
    const first = resolved[offset];
    const second = resolved[offset + 1];
    const poster = resolved[offset + 2];
    offset += 3;
    if (!first || !second) {
      return { level: null, dbLevelId: level.id, expiresAt: Date.now() + CACHE_TTL_MS };
    }

    steps.push({
      kind: "clip",
      src: first,
      poster: poster ?? undefined,
      trimIn: trimOrUndef(w.first_trim_in_seconds),
      trimOut: trimOrUndef(w.first_trim_out_seconds),
    });
    steps.push({
      kind: "word",
      word: w.word,
      askLine: w.ask_line,
      successLine: w.success_line || undefined,
      holdPoster: poster ?? undefined,
    });
    steps.push({
      kind: "clip",
      src: second,
      trimIn: trimOrUndef(w.second_trim_in_seconds),
      trimOut: trimOrUndef(w.second_trim_out_seconds),
    });
  }

  steps.push({
    kind: "clip",
    src: closing,
    trimIn: trimOrUndef(level.closing_trim_in_seconds),
    trimOut: trimOrUndef(level.closing_trim_out_seconds),
  });

  const videoLevel: VideoLevel = {
    id: `db-w${worldNumber}-l${levelNumber}`,
    goal: level.goal || level.title,
    endingLine: level.ending_line || "",
    steps,
  };

  return {
    level: videoLevel,
    dbLevelId: level.id,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}

/** Public: build + cache + dedupe. Safe to call many times concurrently. */
export async function buildVideoLevelFromDb(
  worldNumber: number,
  levelNumber: number,
): Promise<{ level: VideoLevel | null; dbLevelId: string | null }> {
  const key = cacheKey(worldNumber, levelNumber);
  const cached = levelCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { level: cached.level, dbLevelId: cached.dbLevelId };
  }
  let pending = inflight.get(key);
  if (!pending) {
    pending = buildLevelEntry(worldNumber, levelNumber).then((entry) => {
      levelCache.set(key, entry);
      inflight.delete(key);
      return entry;
    }).catch((err) => {
      inflight.delete(key);
      throw err;
    });
    inflight.set(key, pending);
  }
  const entry = await pending;
  return { level: entry.level, dbLevelId: entry.dbLevelId };
}

/**
 * Fire-and-forget warmup. Call from the level-select grid to load the level
 * data before the player taps. Failures are swallowed — this is best-effort.
 */
export function prefetchPreKVideoLevel(worldNumber: number, levelNumber: number): void {
  const key = cacheKey(worldNumber, levelNumber);
  const cached = levelCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return;
  if (inflight.has(key)) return;
  void buildVideoLevelFromDb(worldNumber, levelNumber).catch(() => {});
}

/** Synchronous cache peek — returns the cached level if it's already built. */
export function getCachedPreKVideoLevel(
  worldNumber: number,
  levelNumber: number,
): { level: VideoLevel | null; dbLevelId: string | null } | null {
  const cached = levelCache.get(cacheKey(worldNumber, levelNumber));
  if (!cached || cached.expiresAt <= Date.now()) return null;
  return { level: cached.level, dbLevelId: cached.dbLevelId };
}

/**
 * Drop the cached entry for a given world+level so the next build pulls fresh
 * data (trim marks, new uploads, edited copy). Called by the CMS after every
 * mutation so the player never serves stale builds.
 */
export function invalidatePreKLevelCache(worldNumber: number, levelNumber: number): void {
  const key = cacheKey(worldNumber, levelNumber);
  levelCache.delete(key);
  inflight.delete(key);
}

/**
 * DB-id variant: the editor only knows the level UUID, not the world/level
 * numbers, so we scan the cache and clear the matching entry. Cheap because
 * the cache is tiny (one entry per visited level).
 */
export function invalidatePreKLevelCacheByDbId(dbLevelId: string): void {
  for (const [key, entry] of levelCache.entries()) {
    if (entry.dbLevelId === dbLevelId) {
      levelCache.delete(key);
      inflight.delete(key);
    }
  }
}

/**
 * Hook: load DB-backed VideoLevel. If the cache already has it, returns
 * synchronously with `loading=false` on the very first render — no spinner.
 */
export function usePreKVideoLevel(worldNumber: number, levelNumber: number) {
  const initial = getCachedPreKVideoLevel(worldNumber, levelNumber);
  const [level, setLevel] = useState<VideoLevel | null>(initial?.level ?? null);
  const [dbLevelId, setDbLevelId] = useState<string | null>(initial?.dbLevelId ?? null);
  const [loading, setLoading] = useState(initial === null);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedPreKVideoLevel(worldNumber, levelNumber);
    if (cached) {
      setLevel(cached.level);
      setDbLevelId(cached.dbLevelId);
      setLoading(false);
      return () => { cancelled = true; };
    }
    setLoading(true);
    buildVideoLevelFromDb(worldNumber, levelNumber)
      .then(({ level, dbLevelId }) => {
        if (cancelled) return;
        setLevel(level);
        setDbLevelId(dbLevelId);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLevel(null);
        setDbLevelId(null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [worldNumber, levelNumber]);

  return { level, dbLevelId, loading };
}
