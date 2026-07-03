// Loads + signs every source video URL (and poster) for one Pre-K level,
// keyed by scene key. Powers the editor's timeline preview player.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PREK_VIDEO_BUCKET } from "@/lib/preKLevelFromDb";
import { getCdnUrl, resolveCdnOrFallback } from "@/lib/cdn";
import { SCENE_KEYS } from "@/lib/preKSceneGraph";

// 7 days — Pre-K videos are immutable (new upload = new path), so a long TTL
// lets a CDN / browser cache hold the bytes between sessions.
const TTL = 60 * 60 * 24 * 7;

interface LevelInput {
  opening_video_url?: string | null;
  closing_video_url?: string | null;
}
interface WordInput {
  id: string;
  sort_order: number;
  first_video_url?: string | null;
  second_video_url?: string | null;
  hold_poster_url?: string | null;
}

export interface PreKLevelVideoUrls {
  loading: boolean;
  videoUrls: Record<string, string>;  // sceneKey -> resolved URL
  posterUrls: Record<string, string>; // sceneKey -> resolved URL
}

function isAbsolute(v: string): boolean {
  return /^https?:\/\//.test(v) || v.startsWith("/");
}

export function usePreKLevelVideoUrls(level: LevelInput | null | undefined, words: WordInput[]): PreKLevelVideoUrls {
  const [state, setState] = useState<PreKLevelVideoUrls>({ loading: true, videoUrls: {}, posterUrls: {} });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!level) { setState({ loading: false, videoUrls: {}, posterUrls: {} }); return; }
      const videoEntries: Array<[string, string | null | undefined]> = [];
      const posterEntries: Array<[string, string | null | undefined]> = [];

      videoEntries.push([SCENE_KEYS.opening, level.opening_video_url]);
      videoEntries.push([SCENE_KEYS.closing, level.closing_video_url]);
      const sorted = [...words].sort((a, b) => a.sort_order - b.sort_order);
      sorted.forEach((w, idx) => {
        const i = idx + 1;
        videoEntries.push([SCENE_KEYS.wordFirst(i), w.first_video_url]);
        videoEntries.push([SCENE_KEYS.wordSecond(i), w.second_video_url]);
        // Poster of the *first* video covers the word-card freeze-frame
        posterEntries.push([SCENE_KEYS.wordFirst(i), w.hold_poster_url]);
      });

      // Always sign every relative storage path. The signed URL is the
      // guaranteed-working fallback; the R2 CDN is a free-egress optimization
      // layered on top when the file has actually been mirrored.
      const directs = new Map<string, string>(); // key -> already-resolvable URL
      const pathsToSign = new Set<string>();
      for (const [key, v] of [...videoEntries, ...posterEntries]) {
        if (!v) continue;
        if (isAbsolute(v)) { directs.set(key, v); continue; }
        pathsToSign.add(v);
      }

      const signed: Record<string, string> = {};
      if (pathsToSign.size > 0) {
        const { data } = await supabase.storage
          .from(PREK_VIDEO_BUCKET)
          .createSignedUrls(Array.from(pathsToSign), TTL);
        (data ?? []).forEach((d) => { if (d.path && d.signedUrl) signed[d.path] = d.signedUrl; });
      }

      // For each storage path, prefer the R2 CDN when a HEAD probe confirms
      // it exists there; otherwise use the signed Storage URL. Probes run in
      // parallel and are cached module-wide, so a level costs at most one
      // HEAD per unique path per session.
      const resolvedByPath = new Map<string, string>();
      await Promise.all(
        Array.from(pathsToSign).map(async (p) => {
          const sig = signed[p];
          if (!sig) return;
          if (!getCdnUrl(PREK_VIDEO_BUCKET, p)) {
            resolvedByPath.set(p, sig);
            return;
          }
          const url = await resolveCdnOrFallback(PREK_VIDEO_BUCKET, p, sig);
          resolvedByPath.set(p, url);
        }),
      );

      const resolve = (v: string | null | undefined): string | null => {
        if (!v) return null;
        if (isAbsolute(v)) return v;
        return resolvedByPath.get(v) ?? null;
      };

      const videoUrls: Record<string, string> = {};
      for (const [key, v] of videoEntries) { const u = resolve(v); if (u) videoUrls[key] = u; }
      const posterUrls: Record<string, string> = {};
      for (const [key, v] of posterEntries) { const u = resolve(v); if (u) posterUrls[key] = u; }

      if (!cancelled) setState({ loading: false, videoUrls, posterUrls });
    }
    setState((s) => ({ ...s, loading: true }));
    void run();
    return () => { cancelled = true; };
  }, [level, words]);

  return state;
}

