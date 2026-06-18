// PreKAudioMixer — runtime hook that plays the per-level audio overlay mix in
// response to scene-change events from NabuVideoAdventure.
//
// Routing per clip:
//   HTMLAudioElement → MediaElementSourceNode → clipGain → trackGain[i]
//                    → masterGain → ctx.destination
//
// Modes:
//   - fixed       : play one-shot at anchor + offset
//   - fill-scene  : play+loop while the anchor scene is active; fade out on scene-end
//   - fill-level  : play+loop the entire level; pauses on word-card scenes if
//                   pause_on_word_card = true
//   - span-videos : play continuously from start-anchor to end-anchor; pause
//                   when a word-card begins; resume when next video scene starts
//                   (currentTime is never seeked, so resume is seamless)

import { useEffect, useMemo, useRef } from "react";
import type { PreKAudioClip, PreKAudioTrack } from "@/hooks/usePreKAudioMix";

const FADE_RAMP_SEC = 0.03;
const CARD_FADE_SEC = 0.15;
const SCENE_END_FADE_SEC = 0.2;

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
  /** Bumps to publish a scene event. */
  event: PreKAudioMixerEvent | null;
  /** Editor-only: when set, only this track plays. Pass null at runtime. */
  soloTrackIndex?: number | null;
  /** Editor-only: session-only master kill switch. */
  muteAll?: boolean;
}

interface ClipState {
  el: HTMLAudioElement;
  node: MediaElementAudioSourceNode | null;
  clipGain: GainNode;
  loaded: boolean;
}

export function usePreKAudioMixerRuntime({ tracks, clips, signedUrls, masterVolume, enabled, event, soloTrackIndex = null, muteAll = false }: UseArgs) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const trackGainsRef = useRef<Map<number, GainNode>>(new Map());
  const clipStatesRef = useRef<Map<string, ClipState>>(new Map());
  const activeSpanClipsRef = useRef<Set<string>>(new Set());
  const scheduledTimersRef = useRef<number[]>([]);

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

  // Update master volume reactively (respects session-only muteAll)
  useEffect(() => {
    const ctx = ctxRef.current; const m = masterGainRef.current;
    if (ctx && m) m.gain.setTargetAtTime(muteAll ? 0 : masterVolume, ctx.currentTime, FADE_RAMP_SEC);
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
    }
  }, [tracks, enabled, soloTrackIndex]);

  // Prepare clip audio elements (load on demand the first time)
  const ensureClipState = (clip: PreKAudioClip): ClipState | null => {
    const ctx = ensureCtx(); if (!ctx) return null;
    let st = clipStatesRef.current.get(clip.id);
    if (st) return st;
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
      // Some browsers throw if element already connected; route via element volume as fallback
      node = null;
    }
    st = { el, node, clipGain, loaded: false };
    el.addEventListener("loadeddata", () => { if (st) st.loaded = true; });
    clipStatesRef.current.set(clip.id, st);
    return st;
  };

  const fadeIn = (st: ClipState, targetVolume: number, durSec: number) => {
    const ctx = ctxRef.current!;
    const now = ctx.currentTime;
    st.clipGain.gain.cancelScheduledValues(now);
    st.clipGain.gain.setValueAtTime(st.clipGain.gain.value, now);
    st.clipGain.gain.linearRampToValueAtTime(targetVolume, now + Math.max(0.01, durSec));
  };
  const fadeOutAndPause = (st: ClipState, durSec: number) => {
    const ctx = ctxRef.current!;
    const now = ctx.currentTime;
    st.clipGain.gain.cancelScheduledValues(now);
    st.clipGain.gain.setValueAtTime(st.clipGain.gain.value, now);
    st.clipGain.gain.linearRampToValueAtTime(0, now + Math.max(0.01, durSec));
    const tid = window.setTimeout(() => { try { st.el.pause(); } catch { /* noop */ } }, Math.max(20, durSec * 1000 + 20));
    scheduledTimersRef.current.push(tid);
  };

  const playClip = (clip: PreKAudioClip, opts: { loop?: boolean } = {}) => {
    const st = ensureClipState(clip); if (!st) return;
    const ctx = ensureCtx(); if (!ctx) return;
    try { if (ctx.state === "suspended") void ctx.resume(); } catch { /* noop */ }
    st.el.loop = !!opts.loop || clip.loop_clip;
    st.el.currentTime = clip.trim_start_seconds || 0;
    const playPromise = st.el.play();
    if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => { /* gesture not yet, ignore */ });
    fadeIn(st, clip.volume, clip.fade_in_seconds || FADE_RAMP_SEC);
  };

  // Handle scene events
  useEffect(() => {
    if (!enabled || !event) return;
    const ctx = ensureCtx(); if (!ctx) return;
    const { sceneKey, edge, isWordCard } = event;

    // (a) On the VERY first event of a level (we treat opening-start as init):
    //     start all fill-level clips here too.
    if (sceneKey === "opening" && edge === "start") {
      for (const clip of clips.filter((c) => c.duration_mode === "fill-level")) {
        playClip(clip, { loop: true });
      }
    }

    if (edge === "start") {
      // fill-level pause/resume on word card
      if (isWordCard) {
        for (const clip of clips.filter((c) => c.duration_mode === "fill-level" && c.pause_on_word_card)) {
          const st = clipStatesRef.current.get(clip.id); if (!st) continue;
          fadeOutAndPause(st, CARD_FADE_SEC);
        }
        // span-videos: pause without seeking
        for (const clipId of activeSpanClipsRef.current) {
          const st = clipStatesRef.current.get(clipId); if (!st) continue;
          fadeOutAndPause(st, CARD_FADE_SEC);
        }
      } else {
        // resume fill-level on entering a video scene
        for (const clip of clips.filter((c) => c.duration_mode === "fill-level" && c.pause_on_word_card)) {
          const st = clipStatesRef.current.get(clip.id); if (!st) continue;
          st.el.play().catch(() => { /* noop */ });
          fadeIn(st, clip.volume, CARD_FADE_SEC);
        }
        // resume any active span-videos clips
        for (const clipId of activeSpanClipsRef.current) {
          const st = clipStatesRef.current.get(clipId); if (!st) continue;
          st.el.play().catch(() => { /* noop */ });
          const c = clips.find((x) => x.id === clipId); if (c) fadeIn(st, c.volume, CARD_FADE_SEC);
        }
      }

      // Trigger clips anchored to scene-start
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
          // fill-level handled at opening-start above
        };
        if (delayMs === 0) fire();
        else {
          const tid = window.setTimeout(fire, delayMs);
          scheduledTimersRef.current.push(tid);
        }
        // Start the end-anchor schedule for span-videos when its end-anchor scene starts (below).
      }

      // span-videos end anchors
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
      // fill-scene clips anchored to this scene: fade out
      for (const clip of clips) {
        if (clip.duration_mode === "fill-scene" && clip.anchor_scene_key === sceneKey) {
          const st = clipStatesRef.current.get(clip.id); if (!st) continue;
          fadeOutAndPause(st, clip.fade_out_seconds || SCENE_END_FADE_SEC);
        }
      }
      // clips anchored to scene-end (fixed, fill-scene end-start) — fire after offset (typically negative not allowed for cards; for videos we approximate using setTimeout 0 since runner emits end at the moment of end)
      for (const clip of clips) {
        if (clip.anchor_scene_key !== sceneKey || clip.anchor_edge !== "end") continue;
        const delayMs = Math.max(0, clip.anchor_offset_seconds * 1000);
        const fire = () => {
          if (clip.duration_mode === "fixed") playClip(clip);
        };
        if (delayMs === 0) fire();
        else { const tid = window.setTimeout(fire, delayMs); scheduledTimersRef.current.push(tid); }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

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
    };
  }, []);

  // Resolve & return helper: nothing public besides triggering events
  return useMemo(() => ({ ready: enabled }), [enabled]);
}
