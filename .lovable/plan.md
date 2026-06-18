## Add live video preview synced to the audio timeline

A small video panel above the timeline that always shows the exact frame at the current playhead position. As you drag the playhead, scrub during preview, or drag a clip, the video jumps to that moment — so you can line audio cues to visual beats by eye.

### How it works

1. **Map playhead → video frame**
   The scene graph already knows the wall-clock start/end of every scene and which URL backs each video scene. A new helper `resolveTimelineFrame(t, graph, urls)` returns `{ src, localTime, isCard, posterUrl }`:
   - For video scenes (opening / word-N-first / word-N-second / closing): the signed URL + offset within that clip.
   - For word-card scenes: no video — show the previous video's last frame (poster) with a small "WORD CARD" overlay.

2. **`TimelinePreviewPlayer` component** (new, ~120 lines)
   - Hidden `<video>` per video URL (small pool, only the current + neighbor mounted) so seeking is fast and there's no flash between scenes.
   - On every `playheadSec` change: `video.currentTime = localTime`. If `previewPlaying` and we're inside a video scene, call `.play()` muted (audio comes from the mixer, not the video). Otherwise pause.
   - On word-card scenes: hide the video, show the freeze-frame poster + a subtle amber "WORD: jump" badge.
   - Respects `mute_source_video_audio` — when false, the video plays its own audio too (matches runtime behavior).

3. **Scrubbable playhead on `TimelineCanvas`**
   - Click anywhere on the canvas (outside a clip) → set playhead to that x.
   - New transparent overlay row above the tracks captures pointer-down/move for drag-scrubbing — the playhead follows your cursor in real time.
   - During drag-scrub, set `previewPlaying = false` and just drive `previewTime`; on pointer-up, leave it where you released.

4. **Live sync while dragging clips**
   - When dragging a clip body horizontally, set `previewTime` to the clip's *new* start second on every move. So as you slide a sound effect, the video panel scrubs to where the effect would fire — instant visual alignment.
   - Same for the span-end handle: scrubs to the proposed end anchor.
   - Released → playhead stays at the drop point.

5. **Wire-up in `AudioMixEditor`**
   - Mount `<TimelinePreviewPlayer>` between the Master strip and the Timeline card.
   - Pass `playheadSec = previewTime`, `playing = previewPlaying`, `muteSourceVideo = mix.settings.mute_source_video_audio`, signed video URLs from a new `usePreKLevelVideoUrls(levelId, words)` hook (parallel to `usePreKAudioMix`).
   - Add a "Jump to start" button next to Preview that resets playhead to 0.

### Technical details

**New file: `src/lib/preKTimelineFrameResolver.ts`**
```ts
export interface FrameLookup {
  src: string | null;        // null on cards
  localTime: number;         // seconds into src
  isCard: boolean;
  posterUrl?: string | null; // last frame of preceding video, for cards
  sceneKey: string;
}
export function resolveTimelineFrame(
  t: number,
  graph: SceneGraph,
  videoUrls: Record<string, string>, // sceneKey -> signed URL
  posterUrls: Record<string, string>, // sceneKey -> poster
): FrameLookup
```

**New file: `src/components/superadmin/prek/TimelinePreviewPlayer.tsx`**
- ~140 lines. Two `<video>` slots A/B for seamless cross-scene transitions (mirrors the runtime's two-slot pattern, simpler — no crossfade needed for preview).
- 16:9 panel, max-width ~480px, centered. Black background with the freeze-frame poster behind.

**New file: `src/hooks/usePreKLevelVideoUrls.ts`**
- Loads & signs all video URLs for the level + words in one batch, returns `{ videoUrls, posterUrls, loading }`.

**Edits:**
- `TimelineCanvas.tsx` — add scrubbing overlay; emit `onScrub(sec)` callback; while scrubbing, the playhead prop drives the line (already supported).
- `AudioMixEditor.tsx` — mount the preview player, wire scrub + clip-drag-to-scrub. Add "Jump to start" button.
- Existing preview transport (Play/Pause/Reset) keeps working unchanged.

### Out of scope
- Loading-spinner UI when seeking large files (browsers handle it; we don't show a custom one).
- Frame-perfect (per-video-frame) snapping — we snap to wall-clock seconds, same as today.
- Editing video duration/timing — preview is read-only on video; audio editing is unchanged.