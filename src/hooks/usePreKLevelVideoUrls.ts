// Loads + signs every source video URL (and poster) for one Pre-K level,
// keyed by scene key. Powers the editor's timeline preview player.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PREK_VIDEO_BUCKET } from "@/lib/preKLevelFromDb";
import { getCdnUrl } from "@/lib/cdn";
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
  fallbackVideoUrls: Record<string, string>;  // sceneKey -> signed backend URL when primary is CDN
  fallbackPosterUrls: Record<string, string>; // sceneKey -> signed backend URL when primary is CDN
}

function isAbsolute(v: string): boolean {
  return /^https?:\/\//.test(v) || v.startsWith("/");
}

export function usePreKLevelVideoUrls(level: LevelInput | null | undefined, words: WordInput[]): PreKLevelVideoUrls {
  const [state, setState] = useState<PreKLevelVideoUrls>({ loading: true, videoUrls: {}, posterUrls: {}, fallbackVideoUrls: {}, fallbackPosterUrls: {} });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!level) { setState({ loading: false, videoUrls: {}, posterUrls: {}, fallbackVideoUrls: {}, fallbackPosterUrls: {} }); return; }
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

      // For each storage path, use the R2 CDN as the primary URL when enabled,
      // and keep the signed Storage URL as a media-element fallback. Browser
      // HEAD probes to Cloudflare are CORS-blocked, so fallback must happen on
      // the actual <video>/<img> load error instead of via fetch().
      const resolvedByPath = new Map<string, string>();
      const fallbackByPath = new Map<string, string>();
      for (const p of pathsToSign) {
        const sig = signed[p];
        if (!sig) continue;
        const cdn = getCdnUrl(PREK_VIDEO_BUCKET, p);
        resolvedByPath.set(p, cdn ?? sig);
        if (cdn) fallbackByPath.set(p, sig);
      }

      const resolve = (v: string | null | undefined): string | null => {
        if (!v) return null;
        if (isAbsolute(v)) return v;
        return resolvedByPath.get(v) ?? null;
      };

      const videoUrls: Record<string, string> = {};
      for (const [key, v] of videoEntries) { const u = resolve(v); if (u) videoUrls[key] = u; }
      const posterUrls: Record<string, string> = {};
      for (const [key, v] of posterEntries) { const u = resolve(v); if (u) posterUrls[key] = u; }
      const fallbackVideoUrls: Record<string, string> = {};
      for (const [key, v] of videoEntries) { if (v && !isAbsolute(v)) { const u = fallbackByPath.get(v); if (u) fallbackVideoUrls[key] = u; } }
      const fallbackPosterUrls: Record<string, string> = {};
      for (const [key, v] of posterEntries) { if (v && !isAbsolute(v)) { const u = fallbackByPath.get(v); if (u) fallbackPosterUrls[key] = u; } }

      if (!cancelled) setState({ loading: false, videoUrls, posterUrls, fallbackVideoUrls, fallbackPosterUrls });
    }
    setState((s) => ({ ...s, loading: true }));
    void run();
    return () => { cancelled = true; };
  }, [level, words]);

  return state;
}

