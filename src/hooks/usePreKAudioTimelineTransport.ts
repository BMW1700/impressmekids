// Editor-only deterministic audio transport for the Pre-K timeline.
//
// Unlike the gameplay mixer, this does not react to scene edges. It owns the
// playhead: every tick it decides which clips should be audible at the current
// timeline second, starts those clips at the correct audio offset, and hard
// stops everything else. This prevents old preview audio from leaking across
// scrubs, restarts, and overlapping clip regions, even when clips sit on
// different visual tracks.

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PreKAudioClip, PreKAudioTrack } from "@/hooks/usePreKAudioMix";
import type { SceneGraph } from "@/lib/preKSceneGraph";
import { resolveClip } from "@/lib/preKClipResolve";

interface UseArgs {
  graph: SceneGraph;
  tracks: PreKAudioTrack[];
  clips: PreKAudioClip[];
  signedUrls: Record<string, string>;
  masterVolume: number;
  enabled: boolean;
  playheadSec: number;
  soloTrackIndex?: number | null;
  muteAll?: boolean;
}

interface ClipState {
  el: HTMLAudioElement;
  storagePath: string;
  playing: boolean;
}

export interface PreKAudioTimelineTransportHandle {
  stopAll: () => void;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function audioTimeForClip(clip: PreKAudioClip, clipStartSec: number, playheadSec: number) {
  const rate = Math.max(0.05, clip.playback_rate || 1);
  const timelineOffset = Math.max(0, playheadSec - clipStartSec);
  return Math.max(0, (clip.trim_start_seconds || 0) + timelineOffset * rate);
}

export function usePreKAudioTimelineTransport({
  graph,
  tracks,
  clips,
  signedUrls,
  masterVolume,
  enabled,
  playheadSec,
  soloTrackIndex = null,
  muteAll = false,
}: UseArgs): PreKAudioTimelineTransportHandle {
  const statesRef = useRef<Map<string, ClipState>>(new Map());
  const activeRef = useRef<Set<string>>(new Set());

  const tracksByIndex = useMemo(() => new Map(tracks.map((t) => [t.track_index, t])), [tracks]);

  const hardStopClip = useCallback((clipId: string, resetTime = false) => {
    const st = statesRef.current.get(clipId);
    if (!st) return;
    try { st.el.pause(); } catch { /* noop */ }
    try { st.el.volume = 0; } catch { /* noop */ }
    if (resetTime) {
      try { st.el.currentTime = 0; } catch { /* noop */ }
    }
    st.playing = false;
    activeRef.current.delete(clipId);
  }, []);

  const stopAll = useCallback(() => {
    for (const id of Array.from(statesRef.current.keys())) hardStopClip(id, true);
    activeRef.current.clear();
  }, [hardStopClip]);

  const ensureState = useCallback((clip: PreKAudioClip): ClipState | null => {
    const url = signedUrls[clip.storage_path];
    if (!url) return null;

    let st = statesRef.current.get(clip.id);
    if (st && st.storagePath === clip.storage_path) return st;

    if (st) hardStopClip(clip.id, true);
    const el = new Audio(url);
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    el.volume = 0;
    st = { el, storagePath: clip.storage_path, playing: false };
    statesRef.current.set(clip.id, st);
    return st;
  }, [hardStopClip, signedUrls]);

  useEffect(() => {
    if (!enabled || muteAll) {
      stopAll();
      return;
    }

    let desired: { clip: PreKAudioClip; startSec: number; endSec: number } | null = null;

    for (const clip of clips) {
      const track = tracksByIndex.get(clip.track_index);
      if (!track || track.muted) continue;
      if (soloTrackIndex !== null && clip.track_index !== soloTrackIndex) continue;
      if (!signedUrls[clip.storage_path]) continue;

      const resolved = resolveClip(clip, graph);
      if (playheadSec < resolved.startSec || playheadSec >= resolved.endSec) continue;

      const current = desired;
      if (
        !current ||
        resolved.startSec > current.startSec ||
        (resolved.startSec === current.startSec && clip.sort_order > current.clip.sort_order)
      ) {
        desired = { clip, startSec: resolved.startSec, endSec: resolved.endSec };
      }
    }

    const desiredIds = new Set(desired ? [desired.clip.id] : []);

    for (const id of Array.from(activeRef.current)) {
      if (!desiredIds.has(id)) hardStopClip(id, true);
    }

    if (desired) {
      const { clip, startSec } = desired;
      const track = tracksByIndex.get(clip.track_index);
      const st = ensureState(clip);
      if (!track || !st) return;

      const rate = Math.max(0.05, clip.playback_rate || 1);
      const targetAudioTime = audioTimeForClip(clip, startSec, playheadSec);
      const targetVolume = clamp01((clip.volume ?? 1) * (track.volume ?? 1) * masterVolume);

      try { st.el.loop = clip.duration_mode === "fill-level" || clip.duration_mode === "fill-scene" || clip.loop_clip; } catch { /* noop */ }
      try { st.el.playbackRate = rate; } catch { /* noop */ }
      try { st.el.volume = targetVolume; } catch { /* noop */ }

      const drift = Math.abs((st.el.currentTime || 0) - targetAudioTime);
      if (!st.playing || st.el.paused || drift > 0.35) {
        try { st.el.currentTime = targetAudioTime; } catch { /* noop */ }
      }

      if (!st.playing || st.el.paused) {
        st.playing = true;
        activeRef.current.add(clip.id);
        st.el.play().catch(() => {
          st.playing = false;
          activeRef.current.delete(clip.id);
        });
      }
    }
  }, [clips, enabled, ensureState, graph, hardStopClip, masterVolume, muteAll, playheadSec, signedUrls, soloTrackIndex, stopAll, tracksByIndex]);

  useEffect(() => () => {
    for (const [, st] of statesRef.current) {
      try { st.el.pause(); } catch { /* noop */ }
      try { st.el.src = ""; } catch { /* noop */ }
    }
    statesRef.current.clear();
    activeRef.current.clear();
  }, []);

  return useMemo(() => ({ stopAll }), [stopAll]);
}