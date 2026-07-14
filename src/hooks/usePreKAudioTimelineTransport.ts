// Editor-only deterministic audio transport for the Pre-K timeline.
//
// Unlike the gameplay mixer, this does not react to scene edges. It owns the
// playhead: every tick it decides which clips should be audible at the current
// timeline second, starts those clips at the correct audio offset, and hard
// stops everything else. This prevents old preview audio from leaking across
// scrubs, restarts, and overlapping clip regions, even when clips sit on
// different visual tracks.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  loaded: boolean;
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

function audioBoundsForClip(clip: PreKAudioClip) {
  const start = Math.max(0, clip.trim_start_seconds || 0);
  const rawEnd = clip.trim_end_seconds ?? clip.duration_seconds ?? Number.POSITIVE_INFINITY;
  const end = Math.max(start + 0.1, rawEnd);
  return { start, end, length: Math.max(0.1, end - start), finite: Number.isFinite(end) };
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
  const [loadVersion, setLoadVersion] = useState(0);

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
    st = { el, storagePath: clip.storage_path, playing: false, loaded: el.readyState >= 1 };
    const markLoaded = () => {
      const current = statesRef.current.get(clip.id);
      if (!current || current.loaded) return;
      current.loaded = true;
      setLoadVersion((n) => n + 1);
    };
    el.addEventListener("loadedmetadata", markLoaded);
    el.addEventListener("canplay", markLoaded);
    el.addEventListener("loadeddata", markLoaded);
    statesRef.current.set(clip.id, st);
    try { el.load(); } catch { /* noop */ }
    return st;
  }, [hardStopClip, signedUrls]);

  useEffect(() => {
    if (!enabled || muteAll) {
      stopAll();
      return;
    }

    // Per-track winner: allow every track to play its topmost active clip in
    // parallel (Redub on track 90 + Music on track 89 must both be audible).
    const desiredByTrack = new Map<number, { clip: PreKAudioClip; startSec: number; endSec: number }>();

    for (const clip of clips) {
      const track = tracksByIndex.get(clip.track_index);
      if (!track || track.muted) continue;
      if (soloTrackIndex !== null && clip.track_index !== soloTrackIndex) continue;
      if (!signedUrls[clip.storage_path]) continue;

      const resolved = resolveClip(clip, graph);
      if (playheadSec < resolved.startSec || playheadSec >= resolved.endSec) continue;

      const current = desiredByTrack.get(clip.track_index);
      if (
        !current ||
        resolved.startSec > current.startSec ||
        (resolved.startSec === current.startSec && clip.sort_order > current.clip.sort_order)
      ) {
        desiredByTrack.set(clip.track_index, { clip, startSec: resolved.startSec, endSec: resolved.endSec });
      }
    }

    const desiredIds = new Set<string>();
    for (const w of desiredByTrack.values()) desiredIds.add(w.clip.id);

    for (const id of Array.from(activeRef.current)) {
      if (!desiredIds.has(id)) hardStopClip(id, true);
    }

    for (const { clip, startSec } of desiredByTrack.values()) {
      const track = tracksByIndex.get(clip.track_index);
      const st = ensureState(clip);
      if (!track || !st) continue;
      if (!st.loaded) {
        // Do not play until metadata exists. Browsers can ignore currentTime on
        // fresh audio elements, which starts redubs at 0 instead of trim-in.
        continue;
      }

      const rate = Math.max(0.05, clip.playback_rate || 1);
      const bounds = audioBoundsForClip(clip);
      const loopsWithinWindow = clip.duration_mode === "fill-level" || clip.duration_mode === "fill-scene" || clip.loop_clip;
      let targetAudioTime = audioTimeForClip(clip, startSec, playheadSec);
      if (loopsWithinWindow && bounds.finite && targetAudioTime >= bounds.end) {
        targetAudioTime = bounds.start + ((targetAudioTime - bounds.start) % bounds.length);
      } else if (!loopsWithinWindow && targetAudioTime >= bounds.end) {
        hardStopClip(clip.id, true);
        continue;
      }
      const targetVolume = clamp01((clip.volume ?? 1) * (track.volume ?? 1) * masterVolume);

      try { st.el.loop = false; } catch { /* noop */ }
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
  }, [clips, enabled, ensureState, graph, hardStopClip, loadVersion, masterVolume, muteAll, playheadSec, signedUrls, soloTrackIndex, stopAll, tracksByIndex]);

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