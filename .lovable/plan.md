# Pre-K Video Clip Editor — In-Browser Trim & Crop

Short answer: yes, this is very doable, and it fits cleanly on top of the system you already have. We'd do it **non-destructively** — the uploaded file in storage is never modified; we just store trim/crop metadata and the runtime + editor preview respect it. That's the same pattern your audio clips already use (`trim_start_seconds`, `trim_end_seconds`, `playback_rate`), so it's a natural extension.

## What you'd get (Phase 1 — trim)

For every video slot (Opening clip, First Video, Second Video, Ending clip):

- A **trim bar under the video** with two draggable handles (in-point / out-point) over a frame-strip background.
- **Live scrub preview** as you drag a handle (video seeks to that frame).
- **"Set In at playhead" / "Set Out at playhead"** buttons for frame-accurate cuts.
- **Numeric inputs** showing in/out in seconds (3-decimal), so you can type exact values.
- A **Reset trim** button.
- The trimmed region is what plays in the editor preview, the runtime, and what the duration/scene-graph math uses — so audio anchors stay correct.

## What you'd get (Phase 2 — crop / mask, optional)

For the "overlay/extra stuff at the edge" case you mentioned:

- A **crop overlay** (drag the 4 sides) that masks off pixels you don't want shown — useful when a source clip has a watermark band, a letterbox, or a stray UI element.
- Stored as `crop_top/right/bottom/left` percentages and applied via CSS `clip-path` + `object-fit: cover` scaling, so it's free at runtime (no re-encode).

## What we'd NOT do (and why)

- **No server-side re-encoding (ffmpeg in an edge function).** It's slow, expensive, and on Lovable Cloud it would mean long-running jobs and storage churn. Non-destructive metadata gives you the same visible result instantly and is reversible.
- **No full timeline NLE.** Scope stays "fix the edges of a single clip," which is what you actually hit. We can revisit multi-cut/splice later if needed.

## Patentability angle

The interesting/defensible piece isn't the trim UI itself (that's prior art everywhere). What *is* novel in your stack is the **coupled system**: scene-graph timing + per-clip audio anchors + word-card scenes + non-destructive video trims all recomputing the timeline together so a teacher/author edits a literacy lesson like a doc, not a video project. Worth a provisional once Phase 1 lands and we can demo end-to-end.

## Technical plan

Files involved (read-only context for the plan):

- `src/components/superadmin/prek/AudioMixEditor.tsx` — already has clip trim UX for audio; mirror its handle interaction pattern.
- `src/lib/preKSceneGraph.ts` + `src/lib/preKTimelineFrameResolver.ts` — replace raw `durationSeconds` with `effectiveDuration = trim_out - trim_in` so audio anchors and the preview playhead stay in sync.
- `src/hooks/usePreKLevelVideoUrls.ts` — return trim metadata alongside the signed URL.
- `src/lib/preKVideoUpload.ts` — no upload change; add a small `updateVideoTrim(levelId, slotKey, {in,out,crop?})` helper.
- New `src/components/superadmin/prek/VideoTrimEditor.tsx` — the trim bar + handles + scrub preview, used by every video slot in the level editor.
- Runtime player (wherever `<video>` is rendered for the Pre-K scene) — set `currentTime = trim_in` on load and pause/advance at `trim_out` instead of `ended`.

DB migration (one migration, additive, nullable so existing rows are untouched):

```text
prek_level_videos (or wherever video slots live):
  + trim_in_seconds       numeric  null
  + trim_out_seconds      numeric  null
  + crop_top_pct          numeric  null    -- phase 2
  + crop_right_pct        numeric  null    -- phase 2
  + crop_bottom_pct       numeric  null    -- phase 2
  + crop_left_pct         numeric  null    -- phase 2
```

Same GRANT + RLS pattern as the rest of the prek_* tables. No bucket changes — original file stays put.

Frame strip for the trim bar: reuse the `decodeViaPlayback` trick from `ClipWaveform.tsx` but sample `drawImage(video, ...)` into ~30 thumbnails instead of audio peaks; cache per signed URL like peaks already are.

## Rollout

1. Migration + types regenerate.
2. `VideoTrimEditor` component + scene-graph effective-duration plumb-through.
3. Wire into the four video slots (Opening / First / Second / Ending).
4. Runtime player respects `trim_in/out`.
5. Ship. Add crop in a follow-up once you've used trim on a few real lessons.

## Questions before I build

1. **Phase 1 only (trim), or trim + crop together?** I'd recommend trim first — it solves the "extra junk at the start/end" case you described and ships in one pass.
2. **Audio anchors on trim change** — when you shorten a video, any audio clip anchored to its end shifts earlier automatically. Want that, or do you want anchors to stay pinned to the *original* end (rare, but possible)?
3. Should trim apply to **all four slots** (Opening, First, Second, Ending) in this pass, or start with just the per-word First/Second videos?
