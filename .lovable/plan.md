## Brutally honest audit of the Pre-K audio editor

Three real bugs, ordered by severity:

### Bug 1 — Overlapping audio playback (CRITICAL, what you hit)
`usePreKAudioMixerRuntime.ts` never enforces mutual exclusivity on a track. When clip 1 (Opening) is a long fixed one-shot, it keeps playing until its file naturally ends. When the playhead crosses into Word 1 and clip 2 starts, **both clips on Track 1 play at once**. Same issue compounds on Preview/scrub: pressing Preview a second time, or jumping the playhead, fires new `playClip` calls without stopping prior ones, so audio stacks indefinitely.

There is also a silent volume-bypass bug: when `ctx.createMediaElementSource(el)` throws (re-render reuse), the code falls through with `node = null` but the `HTMLAudioElement` keeps playing at native volume — track mute / master mute / solo silently do nothing for that clip.

### Bug 2 — Scrubbing leaks playback
`setPreviewTime` from the scrub handler does not stop currently-playing clips, and pressing Preview again replays scene-start events from the new position without first silencing anything that was already firing. This is the same root cause as #1 but worth calling out: the scrub path needs a hard "stop everything" before resuming.

### Bug 3 — Clips render as a name-only bar
`TimelineCanvas` shows each clip as a flat colored block with the filename truncated. You can drag it horizontally / vertically but you can't see waveform shape, can't preview-play it in place, and can't change playback speed. That's why it doesn't feel like an audio track.

---

## Fix plan

### 1. Mutual exclusivity + scrub-safe mixer (`usePreKAudioMixerRuntime.ts`)
- New helper `stopAllClipsOnTrack(trackIndex, exceptClipId, fade=0.05s)` — iterates `clipStatesRef`, finds clips whose `track_index` matches, fades to 0 and pauses.
- Call it at the top of `playClip` (before fade-in) so starting any clip kills siblings on its lane.
- New helper `stopAllClips(fade)` that hits every active state.
- Export a `stopAll()` from the hook and call it from:
  - `stopPreview()` in `AudioMixEditor`
  - the scrub handler (`onScrub`) before updating `previewTime`
  - the start of `startPreview()` (defensive)
- Fix the `createMediaElementSource` fallback: if `node` is null, set `el.volume = clipGain.gain.value` whenever clipGain changes, by attaching an `ontimeupdate`-style sync — simpler: keep a per-clip `el.volume` mirror that's updated alongside clipGain via a small `setClipVolume(st, v)` wrapper, and use `setClipVolume` everywhere instead of writing to `clipGain.gain` directly.
- Ensure `playClip` resets `el.currentTime = trim_start` AND calls `el.pause()` first when re-firing, so re-entry doesn't double-trigger.

### 2. Editor-side hardening (`AudioMixEditor.tsx`)
- Replace the implicit `enabled: previewPlaying || previewTime > 0` with explicit `enabled: previewPlaying` and call `stopAll()` whenever preview pauses/scrubs.
- On `onScrub`: `mixerRef.stopAll(); setPreviewPlaying(false); setPreviewTime(sec); lastEdgeRef.current = null;` so the next Preview restarts from the new position cleanly.
- On `startPreview`: call `stopAll()` once before flipping `previewPlaying` true.

### 3. Waveform + per-clip controls (`TimelineCanvas.tsx` + new `ClipWaveform.tsx`)
- New `ClipWaveform` component: takes `signedUrl + duration + widthPx + heightPx`, decodes once via `OfflineAudioContext` (cached in a module-level `Map<url, Float32Array>`), renders peaks into a `<canvas>`. Falls back to a flat baseline while decoding.
- Inside each clip block in `TimelineCanvas`, render:
  - `ClipWaveform` filling the body (behind the label).
  - Small inline ▶ button (top-left, 14px) that previews the clip in isolation via a single shared `<audio>` element (no Web Audio routing, just `new Audio(url).play()` with a ref so only one preview at a time).
  - Filename label kept but lowered to `text-[10px]` and `opacity-70` so the waveform reads first.
- Keep all existing drag handlers untouched — they already work; this is purely visual + a play button.

### 4. Playback-rate (speed) control (DB + UI + runtime)
- Migration: `ALTER TABLE public.prek_level_audio_clips ADD COLUMN playback_rate real NOT NULL DEFAULT 1.0 CHECK (playback_rate BETWEEN 0.5 AND 2.0);`
- `PreKAudioClip` type: add `playback_rate: number`.
- Runtime: in `playClip`, set `st.el.playbackRate = clip.playback_rate || 1`.
- Inspector (`ClipInspector` in `AudioMixEditor.tsx`): add a Slider (0.5×–2.0×, step 0.05) labelled "Speed" with a "Reset" button. Wires through existing `updateClip(c, { playback_rate })`.

### Out of scope
- Per-clip waveform-based trim handles (we keep the existing inspector trim fields).
- Pitch-preserving time-stretch (browser `playbackRate` will pitch-shift; acceptable for SFX/VO at the requested ranges).
- Real-time level meters on the mixer strips.

### Technical notes
- Waveform decode is one-shot per signed URL and cached for the session, so adding 5 clips decodes 5 times then never again.
- Mutual-exclusivity matches DAW behavior on a single mono track — if a user actually wants overlap, they can put the second clip on a new track (we already support drag-to-new-track).
- The mixer fix is backwards-compatible with the runtime player used in `NabuVideoAdventure` — `stopAllClipsOnTrack` only fires inside `playClip`, which only fires on scene-start, so legitimate level playback behavior (e.g. opening voice-over followed by a Word 1 SFX on the same track) now sounds *correct*: VO is cut off when the SFX starts, instead of clashing.

### Files
- edit `src/hooks/usePreKAudioMixerRuntime.ts`
- edit `src/components/superadmin/prek/AudioMixEditor.tsx`
- edit `src/components/superadmin/prek/TimelineCanvas.tsx`
- new `src/components/superadmin/prek/ClipWaveform.tsx`
- new migration adding `playback_rate` to `prek_level_audio_clips`
