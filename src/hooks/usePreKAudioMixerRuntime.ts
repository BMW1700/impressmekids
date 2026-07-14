// PreKAudioMixer — runtime hook that plays the per-level audio overlay mix in
// response to scene-change events from YubiVideoAdventure.
//
// Routing per clip:
//   HTMLAudioElement → MediaElementSourceNode → clipGain → trackGain[i]
//                    → masterGain → ctx.destination
//
// If createMediaElementSource throws (element already attached), we fall back
// to direct el.volume control so mute/solo/master still work.
//
// Modes:
//   - fixed       : play one-shot at anchor + offset
//   - fill-scene  : play+loop while the anchor scene is active; fade out on scene-end
//   - fill-level  : play+loop the entire level; pauses on word-card scenes if
//                   pause_on_word_card = true
//   - span-videos : play continuously from start-anchor to end-anchor; pause
//                   when a word-card begins; resume when next video scene starts
//
// **Mutual exclusivity**: starting any clip first stops every other clip on
// the same track_index (DAW semantics). Use a new track for overlap.

import { useEffect, useMemo, useRef } from "react";
import type { PreKAudioClip, PreKAudioTrack } from "@/hooks/usePreKAudioMix";

const FADE_RAMP_SEC = 0.03;
const CARD_FADE_SEC = 0.15;
const SCENE_END_FADE_SEC = 0.2;
const STOP_FADE_SEC = 0.05;

type SceneEdge = "start" | "end";

export interface PreKAudioMixerEvent {
  sceneKey: string;
  edge: SceneEdge;
  isWordCard: boolean;
}

interface UseArgs {
  tracks: PreKAudioTrack[];
  clips: PreKAudioClip[];
  signedUrls: Record<string, string>;
  masterVolume: number;
  enabled: boolean;
  event: PreKAudioMixerEvent | null;
  soloTrackIndex?: number | null;
  muteAll?: boolean;
}

interface ClipState {
  el: HTMLAudioElement;
  node: MediaElementAudioSourceNode | null; // null = fallback (control el.volume)
  clipGain: GainNode;
  loaded: boolean;
  trackIndex: number;
  trackVolume: number; // mirror for fallback path
  anchorSceneKey: string;
  durationMode: PreKAudioClip["duration_mode"];
}

function audioBoundsForClip(clip: PreKAudioClip) {
  const start = Math.max(0, clip.trim_start_seconds || 0);
  const rawEnd = clip.trim_end_seconds ?? clip.duration_seconds ?? Number.POSITIVE_INFINITY;
  const end = Math.max(start + 0.1, rawEnd);
  return { start, end, length: Math.max(0.1, end - start), finite: Number.isFinite(end) };
}

export interface PreKAudioMixerHandle {
  ready: boolean;
  stopAll: () => void;
}

export function usePreKAudioMixerRuntime({
  tracks, clips, signedUrls, masterVolume, enabled, event,
  soloTrackIndex = null, muteAll = false,
}: UseArgs): PreKAudioMixerHandle {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const trackGainsRef = useRef<Map<number, GainNode>>(new Map());
  const trackVolumesRef = useRef<Map<number, number>>(new Map()); // for fallback el.volume math
  const clipStatesRef = useRef<Map<string, ClipState>>(new Map());
  const activeSpanClipsRef = useRef<Set<string>>(new Set());
  const scheduledTimersRef = useRef<number[]>([]);
  const masterMultiplierRef = useRef<number>(masterVolume);

  const ensureCtx = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      try {
        const AC = window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current = new AC();
      } catch {
        return null;
      }
      const ctx = ctxRef.current!;
      const master = ctx.createGain();
      master.gain.value = masterVolume;
      master.connect(ctx.destination);
      masterGainRef.current = master;
    }
    return ctxRef.current;
  };

  // Compute the effective volume (0..1) for a clip when routed through fallback
  // (no MediaElementSourceNode). This mirrors clipGain * trackGain * master.
  const effectiveFallbackVolume = (st: ClipState, clipVolume: number): number => {
    const trackV = trackVolumesRef.current.get(st.trackIndex) ?? 1;
    return Math.max(0, Math.min(1, clipVolume * trackV * masterMultiplierRef.current));
  };

  const setClipTargetVolume = (st: ClipState, target: number, durSec: number) => {
    const ctx = ctxRef.current; if (!ctx) return;
    const now = ctx.currentTime;
    st.clipGain.gain.cancelScheduledValues(now);
    st.clipGain.gain.setValueAtTime(st.clipGain.gain.value, now);
    st.clipGain.gain.linearRampToValueAtTime(target, now + Math.max(0.01, durSec));
    if (st.node === null) {
      // Fallback: HTMLAudioElement isn't routed through the graph, so we have
      // to drive el.volume directly. Apply the equivalent effective gain.
      try { st.el.volume = effectiveFallbackVolume(st, target); } catch { /* noop */ }
    }
  };

  // Update master multiplier (audio context master + fallback mirror)
  useEffect(() => {
    masterMultiplierRef.current = muteAll ? 0 : masterVolume;
    const ctx = ctxRef.current; const m = masterGainRef.current;
    if (ctx && m) m.gain.setTargetAtTime(masterMultiplierRef.current, ctx.currentTime, FADE_RAMP_SEC);
    // Re-apply fallback element volumes
    for (const [, st] of clipStatesRef.current) {
      if (st.node === null) {
        try { st.el.volume = effectiveFallbackVolume(st, st.clipGain.gain.value); } catch { /* noop */ }
      }
    }
  }, [masterVolume, muteAll]);

  // Track gains: create/update per track row. If any track is soloed (editor),
  // non-soloed tracks drop to 0.
  useEffect(() => {
    if (!enabled) return;
    const ctx = ensureCtx(); if (!ctx || !masterGainRef.current) return;
    const map = trackGainsRef.current;
    for (const t of tracks) {
      let g = map.get(t.track_index);
      if (!g) {
        g = ctx.createGain();
        g.connect(masterGainRef.current);
        map.set(t.track_index, g);
      }
      const soloActive = soloTrackIndex !== null;
      const soloMutes = soloActive && t.track_index !== soloTrackIndex;
      const target = (t.muted || soloMutes) ? 0 : t.volume;
      g.gain.setTargetAtTime(target, ctx.currentTime, FADE_RAMP_SEC);
      trackVolumesRef.current.set(t.track_index, target);
    }
    // Refresh fallback element volumes against new track volumes
    for (const [, st] of clipStatesRef.current) {
      if (st.node === null) {
        try { st.el.volume = effectiveFallbackVolume(st, st.clipGain.gain.value); } catch { /* noop */ }
      }
    }
  }, [tracks, enabled, soloTrackIndex]);

  // Prepare clip audio elements (load on demand the first time)
  const ensureClipState = (clip: PreKAudioClip): ClipState | null => {
    const ctx = ensureCtx(); if (!ctx) return null;
    let st = clipStatesRef.current.get(clip.id);
    if (st) {
      // Keep trackIndex in sync if the clip was moved between tracks
      st.trackIndex = clip.track_index;
      return st;
    }
    const url = signedUrls[clip.storage_path]; if (!url) return null;
    const el = new Audio();
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    el.src = url;
    const clipGain = ctx.createGain();
    clipGain.gain.value = 0;
    const trackGain = trackGainsRef.current.get(clip.track_index);
    if (trackGain) clipGain.connect(trackGain);
    else clipGain.connect(masterGainRef.current!);
    let node: MediaElementAudioSourceNode | null = null;
    try {
      node = ctx.createMediaElementSource(el);
      node.connect(clipGain);
    } catch {
      // Fallback path — control via el.volume.
      node = null;
      el.volume = 0;
    }
    st = {
      el, node, clipGain, loaded: false,
      trackIndex: clip.track_index,
      trackVolume: trackVolumesRef.current.get(clip.track_index) ?? 1,
    };
    el.addEventListener("loadeddata", () => { if (st) st.loaded = true; });
    clipStatesRef.current.set(clip.id, st);
    return st;
  };

  const fadeOutAndPause = (st: ClipState, durSec: number) => {
    setClipTargetVolume(st, 0, durSec);
    const tid = window.setTimeout(() => {
      try { st.el.pause(); } catch { /* noop */ }
      if (st.node === null) { try { st.el.volume = 0; } catch { /* noop */ } }
    }, Math.max(20, durSec * 1000 + 20));
    scheduledTimersRef.current.push(tid);
  };

  // Stop every other clip currently on the same track (DAW mutual exclusivity).
  const stopSiblingsOnTrack = (trackIndex: number, exceptClipId: string) => {
    for (const [id, st] of clipStatesRef.current) {
      if (id === exceptClipId) continue;
      if (st.trackIndex !== trackIndex) continue;
      // Only fade if currently producing sound
      if (!st.el.paused) fadeOutAndPause(st, STOP_FADE_SEC);
      activeSpanClipsRef.current.delete(id);
    }
  };

  // Public stopAll — fades & pauses everything, clears scheduled timers.
  const stopAll = () => {
    scheduledTimersRef.current.forEach((id) => window.clearTimeout(id));
    scheduledTimersRef.current = [];
    activeSpanClipsRef.current.clear();
    for (const [, st] of clipStatesRef.current) {
      if (!st.el.paused) fadeOutAndPause(st, STOP_FADE_SEC);
      else if (st.node === null) { try { st.el.volume = 0; } catch { /* noop */ } }
    }
  };

  const playClip = (clip: PreKAudioClip, opts: { loop?: boolean } = {}) => {
    const st = ensureClipState(clip); if (!st) return;
    const ctx = ensureCtx(); if (!ctx) return;
    // Mutual exclusivity: kill anything else on this track first.
    stopSiblingsOnTrack(clip.track_index, clip.id);
    try { if (ctx.state === "suspended") void ctx.resume(); } catch { /* noop */ }
    const bounds = audioBoundsForClip(clip);
    const rate = Math.max(0.05, clip.playback_rate || 1);
    const shouldLoop = !!opts.loop || clip.loop_clip;
    st.el.loop = false;
    st.el.ontimeupdate = shouldLoop && bounds.finite
      ? () => {
          if (st.el.currentTime >= bounds.end - 0.03) {
            try { st.el.currentTime = bounds.start; } catch { /* noop */ }
            st.el.play().catch(() => { /* noop */ });
          }
        }
      : null;
    st.el.onended = shouldLoop
      ? () => {
          try { st.el.currentTime = bounds.start; } catch { /* noop */ }
          st.el.play().catch(() => { /* noop */ });
        }
      : null;
    try { st.el.playbackRate = rate; } catch { /* noop */ }
    try { st.el.currentTime = bounds.start; } catch { /* noop */ }
    const playPromise = st.el.play();
    if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => { /* gesture not yet, ignore */ });
    setClipTargetVolume(st, clip.volume, clip.fade_in_seconds || FADE_RAMP_SEC);
    if (!shouldLoop && bounds.finite) {
      const tid = window.setTimeout(() => {
        fadeOutAndPause(st, clip.fade_out_seconds || STOP_FADE_SEC);
      }, Math.max(20, (bounds.length / rate) * 1000));
      scheduledTimersRef.current.push(tid);
    }
  };

  // Handle scene events
  useEffect(() => {
    if (!enabled || !event) return;
    const ctx = ensureCtx(); if (!ctx) return;
    const { sceneKey, edge, isWordCard } = event;

    if (sceneKey === "opening" && edge === "start") {
      for (const clip of clips.filter((c) => c.duration_mode === "fill-level")) {
        playClip(clip, { loop: true });
      }
    }

    if (edge === "start") {
      if (isWordCard) {
        for (const clip of clips.filter((c) => c.duration_mode === "fill-level" && c.pause_on_word_card)) {
          const st = clipStatesRef.current.get(clip.id); if (!st) continue;
          fadeOutAndPause(st, CARD_FADE_SEC);
        }
        for (const clipId of activeSpanClipsRef.current) {
          const st = clipStatesRef.current.get(clipId); if (!st) continue;
          fadeOutAndPause(st, CARD_FADE_SEC);
        }
      } else {
        for (const clip of clips.filter((c) => c.duration_mode === "fill-level" && c.pause_on_word_card)) {
          const st = clipStatesRef.current.get(clip.id); if (!st) continue;
          st.el.play().catch(() => { /* noop */ });
          setClipTargetVolume(st, clip.volume, CARD_FADE_SEC);
        }
        for (const clipId of activeSpanClipsRef.current) {
          const st = clipStatesRef.current.get(clipId); if (!st) continue;
          st.el.play().catch(() => { /* noop */ });
          const c = clips.find((x) => x.id === clipId);
          if (c) setClipTargetVolume(st, c.volume, CARD_FADE_SEC);
        }
      }

      for (const clip of clips) {
        if (clip.anchor_scene_key !== sceneKey || clip.anchor_edge !== "start") continue;
        const delayMs = Math.max(0, clip.anchor_offset_seconds * 1000);
        const fire = () => {
          if (clip.duration_mode === "span-videos") {
            activeSpanClipsRef.current.add(clip.id);
            playClip(clip);
          } else if (clip.duration_mode === "fill-scene") {
            playClip(clip, { loop: true });
          } else if (clip.duration_mode === "fixed") {
            playClip(clip);
          }
        };
        if (delayMs === 0) fire();
        else { const tid = window.setTimeout(fire, delayMs); scheduledTimersRef.current.push(tid); }
      }

      for (const clip of clips) {
        if (clip.duration_mode !== "span-videos") continue;
        if (clip.end_anchor_scene_key !== sceneKey || clip.end_anchor_edge !== "start") continue;
        const fire = () => {
          activeSpanClipsRef.current.delete(clip.id);
          const st = clipStatesRef.current.get(clip.id); if (!st) return;
          fadeOutAndPause(st, clip.fade_out_seconds || SCENE_END_FADE_SEC);
        };
        const delayMs = Math.max(0, (clip.end_anchor_offset_seconds || 0) * 1000);
        if (delayMs === 0) fire();
        else { const tid = window.setTimeout(fire, delayMs); scheduledTimersRef.current.push(tid); }
      }
    }

    if (edge === "end") {
      for (const clip of clips) {
        if (clip.duration_mode === "fill-scene" && clip.anchor_scene_key === sceneKey) {
          const st = clipStatesRef.current.get(clip.id); if (!st) continue;
          fadeOutAndPause(st, clip.fade_out_seconds || SCENE_END_FADE_SEC);
        }
      }
      for (const clip of clips) {
        if (clip.anchor_scene_key !== sceneKey || clip.anchor_edge !== "end") continue;
        const delayMs = Math.max(0, clip.anchor_offset_seconds * 1000);
        const fire = () => { if (clip.duration_mode === "fixed") playClip(clip); };
        if (delayMs === 0) fire();
        else { const tid = window.setTimeout(fire, delayMs); scheduledTimersRef.current.push(tid); }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  // When `enabled` flips to false, hard-stop everything.
  useEffect(() => {
    if (!enabled) {
      stopAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scheduledTimersRef.current.forEach((id) => window.clearTimeout(id));
      scheduledTimersRef.current = [];
      for (const [, st] of clipStatesRef.current) {
        try { st.el.pause(); } catch { /* noop */ }
        try { st.el.src = ""; } catch { /* noop */ }
      }
      clipStatesRef.current.clear();
      activeSpanClipsRef.current.clear();
      try { ctxRef.current?.close(); } catch { /* noop */ }
      ctxRef.current = null;
      masterGainRef.current = null;
      trackGainsRef.current.clear();
      trackVolumesRef.current.clear();
    };
  }, []);

  // Stable handle. stopAll closes over refs so identity can stay constant.
  const handleRef = useRef<PreKAudioMixerHandle | null>(null);
  if (!handleRef.current) {
    handleRef.current = { ready: enabled, stopAll };
  } else {
    handleRef.current.ready = enabled;
    handleRef.current.stopAll = stopAll;
  }
  return useMemo(() => handleRef.current!, [enabled]);
}
