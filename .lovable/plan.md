
# Pre-K Audio Overlay Editor — v4 (unlimited tracks, per-track controls, video mute)

Everything in v3 stays. v4 lifts the 4-track cap, gives every track its own controls (volume / mute / solo / delete / rename), and lets the author silence the original video audio so the new mix is the only thing the child hears.

---

## 1. Unlimited tracks

The fixed 4-row layout (Music / SFX-A / SFX-B / VO) is gone. Instead:

- The editor starts with **1 empty track** ("Track 1").
- A **+ Add track** button under the last row inserts a new empty row at the bottom. No cap.
- Tracks can be **renamed inline** (click the label) — used for organization only, no semantic meaning.
- Tracks can be **reordered** by dragging the row handle on the left.
- Tracks can be **deleted** with a trash icon; confirmation if the track has clips.

Clips on different tracks can overlap freely in time — the mixer plays them simultaneously. Within a single track, clips may also overlap (no enforced spacing); the per-clip volume + fade settings from v2/v3 still apply.

### Storage

The track is just a grouping/render concept and an audio routing target. We don't need a separate `tracks` table — each clip already has `track_index`, and we add:

```sql
CREATE TABLE public.prek_level_audio_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.prek_levels(id) ON DELETE CASCADE,
  track_index int NOT NULL,
  name text NOT NULL DEFAULT 'Track',
  volume numeric(4,2) NOT NULL DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 2),
  muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level_id, track_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prek_level_audio_tracks TO authenticated;
GRANT ALL ON public.prek_level_audio_tracks TO service_role;
ALTER TABLE public.prek_level_audio_tracks ENABLE ROW LEVEL SECURITY;
-- Policies mirror prek_level_audio_clips (super_admin write, level-owner read).
```

`solo` is editor-session-only (not persisted) since it's a temporary monitoring tool, like in any DAW.

---

## 2. Per-track controls (the "mixer strip")

Every track row has a compact left-side strip:

```text
[≡ drag] [name      ] [▣ M] [● S] [────●──── vol]  ────── clip timeline ──────
```

| Control | Effect | Persisted |
|---|---|---|
| **drag** | Reorder track | yes (rewrites `track_index`) |
| **name** | Inline rename | yes |
| **M (mute)** | Silences this track at runtime AND in editor preview | yes |
| **S (solo)** | When any track is soloed, only soloed tracks play (editor preview only) | no (session) |
| **volume slider** | 0%–200% multiplier applied on top of per-clip volume | yes |
| **trash** | Delete track (in track header menu) | yes |

Runtime mix per clip = `clip.volume × track.volume × (track.muted ? 0 : 1) × master`.

In the inspector, the clip's volume slider now reads as "Clip gain" and a small caption shows the effective gain `clip × track = effective`, so authors don't get confused when a clip sounds quiet because its track volume is low.

---

## 3. Master controls (top of the mixer)

Above the track list, a single row:

```text
Master  [▣ Mute all]   [────●──── master vol]   [▣ Mute original video audio]
```

- **Mute all** — session-only kill switch (useful when scrubbing).
- **Master volume** — persisted on `prek_levels` as `audio_master_volume numeric(4,2) DEFAULT 1.0`.
- **Mute original video audio** — see section 4.

---

## 4. Muting the original video audio

A new boolean on each level:

```sql
ALTER TABLE public.prek_levels
  ADD COLUMN audio_master_volume numeric(4,2) NOT NULL DEFAULT 1.0
    CHECK (audio_master_volume >= 0 AND audio_master_volume <= 2),
  ADD COLUMN mute_source_video_audio boolean NOT NULL DEFAULT false;
```

When `mute_source_video_audio = true`:

- The editor's preview player sets `<video>.muted = true` on every clip.
- `NabuVideoAdventure` (the runtime) also sets `videoEl.muted = true` for both video slots.
- The setting is per-level (some levels keep narrator dialogue baked into the video; others get fully replaced by VO tracks).

This is **independent of track mutes** — silencing the video doesn't touch the audio tracks, and muting all tracks doesn't touch the video. Authors who want full silence flip both.

A small inline warning appears next to the toggle if the level still uses the hardcoded `W101_L1` (which has narration baked into the source clips): *"This level's narration lives inside the video clips. Muting source audio will remove the spoken story — add a VO track first."*

---

## 5. Editor UX changes summary

- Add-track button at the bottom of the track list.
- Each track row has the mixer strip described above.
- Vertical scroll appears once the track list exceeds the canvas height; the storyboard columns and timeline header stay sticky.
- Track row height stays compact (~52px) so 8–10 tracks fit on a 13" laptop without scrolling.
- Clip drag-and-drop now also supports **vertical drag between tracks** (drop into any track row, including a brand-new one created by dragging onto the "+ Add track" zone).

---

## 6. Runtime changes (`PreKAudioMixer`)

- Build one `GainNode` per track (`trackGain[i]`), routed: `clipSourceNode → clipGain → trackGain[i] → masterGain → destination`.
- On track-row update events (volume / mute), call `gainNode.gain.setTargetAtTime(...)` with a 30ms ramp — no clicks.
- Master mute / master volume work the same way on `masterGain`.
- Video mute is set directly on the `<video>` element by `NabuVideoAdventure`, not through Web Audio (no need to route video through Web Audio since we don't process it).
- Solo is editor-only and is implemented as "if any track is soloed, set non-soloed `trackGain` to 0." It is never sent to the runtime.

---

## 7. Schema delta (cumulative from v1 → v4)

```sql
-- v2/v3 columns on prek_level_audio_clips (anchors + modes + end anchors) stay as previously defined.

-- v4 new table
CREATE TABLE public.prek_level_audio_tracks (... as section 1 ...);

-- v4 additions on prek_levels
ALTER TABLE public.prek_levels
  ADD COLUMN audio_master_volume numeric(4,2) NOT NULL DEFAULT 1.0,
  ADD COLUMN mute_source_video_audio boolean NOT NULL DEFAULT false;
```

`prek_level_audio_clips.track_index` now references `prek_level_audio_tracks.track_index` *logically* (we keep it as an int + composite lookup rather than a hard FK, so reordering tracks doesn't cascade-update every clip — the editor handles row movement by rewriting indices in a single transaction).

---

## 8. Build phases (revised)

1. **Schema** — clips table (v2/v3 columns) + tracks table + level columns + audio bucket + `word_hold_seconds` + video durations. All GRANTs + RLS in the same migration.
2. **Scene graph** — `preKSceneGraph.ts` (scenes + video-only timeline).
3. **Upload + data layer** — `preKAudioUpload.ts`, `usePreKAudioMix(levelId)` returns `{tracks, clips, masterVolume, muteSourceVideo}`.
4. **AudioMixEditor**
   - Storyboard layout + wall-clock toggle.
   - Track list with mixer strips, add/delete/reorder/rename.
   - Master row (mute all, master vol, mute source video).
   - Clip drag (anchor + cross-scene + cross-track), inspector, span-videos two-edge drag with ↯ notches.
5. **PreKAudioMixer runtime** — per-track GainNodes, master gain, span-videos pause/resume, source-video mute wiring in `NabuVideoAdventure`.
6. **Polish** — undo/redo (single stack covering clip + track edits), iPad touch, warnings (overlong clip in card scene, span-videos with audio shorter than range, etc.).
7. **Backfill** — durations on the 32 published levels; each level gets one empty default track at migration time so the editor opens to a sane state.

---

## 9. Still out of scope

Waveform rendering, panning/stereo, EQ/effects, automation envelopes, cross-track crossfade UI, MP4 export, editing the video timing itself.

---

Approve and I'll start with phases 1 + 2 (migration + scene graph).
