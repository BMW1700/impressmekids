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
  videoUrls: Record<string, string>;  // sceneKey -> signed URL
  posterUrls: Record<string, string>; // sceneKey -> poster URL
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

      // Build the list of storage paths we need to sign in a single batch.
      const pathsToSign = new Set<string>();
      const directs = new Map<string, string>(); // key -> already-resolvable URL
      for (const [key, v] of [...videoEntries, ...posterEntries]) {
        if (!v) continue;
        if (isAbsolute(v)) directs.set(key, v);
        else pathsToSign.add(v);
      }

      let signed: Record<string, string> = {};
      if (pathsToSign.size > 0) {
        const { data } = await supabase.storage
          .from(PREK_VIDEO_BUCKET)
          .createSignedUrls(Array.from(pathsToSign), TTL);
        (data ?? []).forEach((d) => { if (d.path && d.signedUrl) signed[d.path] = d.signedUrl; });
      }

      const resolve = (v: string | null | undefined): string | null => {
        if (!v) return null;
        if (isAbsolute(v)) return v;
        return signed[v] ?? null;
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
