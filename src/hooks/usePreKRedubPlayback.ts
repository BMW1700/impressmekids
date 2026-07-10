// usePreKRedubPlayback — plays Benny redub MP3 clips in sync with the video.
//
// The parent component fires sceneEvent { sceneKey, edge } as each video scene
// starts/ends. When a redub MP3 exists for that scene, we start it on "start"
// and stop it on "end". The parent should also mute the source video so we
// don't double-hear the original take.

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PREK_VIDEO_BUCKET } from "@/lib/preKLevelFromDb";
import type { PreKAudioMixerEvent } from "@/hooks/usePreKAudioMixerRuntime";

interface Options {
  levelId: string | null;
  event: PreKAudioMixerEvent | null;
  enabled?: boolean;
}

export function usePreKRedubPlayback({ levelId, event, enabled = true }: Options) {
  const [signedUrlsByScene, setSignedUrlsByScene] = useState<Record<string, string>>({});
  const [hasRedub, setHasRedub] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load redub_audio_paths for this level and sign them.
  useEffect(() => {
    let cancelled = false;
    if (!levelId || !enabled) { setSignedUrlsByScene({}); setHasRedub(false); return; }
    (async () => {
      const { data } = await supabase
        .from("prek_levels")
        .select("redub_audio_paths")
        .eq("id", levelId)
        .maybeSingle();
      const paths = (data?.redub_audio_paths as Record<string, string> | null) ?? {};
      const entries = Object.entries(paths).filter(([, v]) => !!v);
      if (entries.length === 0) {
        if (!cancelled) { setSignedUrlsByScene({}); setHasRedub(false); }
        return;
      }
      const pathList = entries.map(([, p]) => p);
      const { data: signed } = await supabase.storage
        .from(PREK_VIDEO_BUCKET)
        .createSignedUrls(pathList, 60 * 60 * 4);
      const pathToUrl: Record<string, string> = {};
      (signed ?? []).forEach((s) => { if (s.path && s.signedUrl) pathToUrl[s.path] = s.signedUrl; });
      const bySceneKey: Record<string, string> = {};
      for (const [sceneKey, storagePath] of entries) {
        if (pathToUrl[storagePath]) bySceneKey[sceneKey] = pathToUrl[storagePath];
      }
      if (!cancelled) {
        setSignedUrlsByScene(bySceneKey);
        setHasRedub(Object.keys(bySceneKey).length > 0);
      }
    })();
    return () => { cancelled = true; };
  }, [levelId, enabled]);

  // React to scene start/end events.
  useEffect(() => {
    if (!enabled || !event) return;
    const url = signedUrlsByScene[event.sceneKey];
    if (!url) return; // no redub for this scene — leave source audio alone

    // Stop any prior playback
    const stop = () => {
      const a = audioRef.current;
      if (a) { try { a.pause(); } catch { /* noop */ } audioRef.current = null; }
    };

    if (event.edge === "end") { stop(); return; }
    // start
    stop();
    const a = new Audio(url);
    a.preload = "auto";
    audioRef.current = a;
    a.play().catch(() => { /* autoplay might reject before first tap; harmless */ });
  }, [event, signedUrlsByScene, enabled]);

  useEffect(() => () => {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch { /* noop */ } }
  }, []);

  return useMemo(() => ({ hasRedub, signedUrlsByScene }), [hasRedub, signedUrlsByScene]);
}
