# Fix clip cropping in the Pre-K audio timeline

## What's actually happening

I checked the live clip data. Your crops **are** saving — the redub clip "Redub — word-1-second" has a 13.68s source file with the end cropped to 8.32s in the database, and both the editor preview transport and the real gameplay mixer already honor that cut.

The problem is that nothing in the UI shows it, and one path ignores it — so it looks and sounds like the crop did nothing:

1. **The waveform re-squeezes the whole file into the shortened block.** The canvas computes the waveform slice from the *visible block*, not from the *source audio*, so the full file (including the jarble you just cut) is always redrawn stretched to fit. Dragging an edge in therefore looks exactly like "compressing the audio" instead of discarding it. This is the single biggest reason the crop appears broken.
2. **The per-clip play button ignores the crop.** The little ▶ on the clip starts at the crop-in point but never stops at the crop-out point, so you audition the clip and still hear the garbage at the end you just removed.
3. **No live feedback while dragging.** While an edge handle is being dragged, the block renders the full untrimmed waveform, so you can't see what you're about to discard.
4. **The handles are 2px wide** and sit under the ▶ / ✂ / 🗑 buttons at the left edge, which makes grabbing them a lottery on a trackpad and near-impossible on iPad.

## The fix

**Waveform reflects the crop (core fix)**
- Map each rendered block segment back to real source-audio time (crop-in → crop-out) instead of block-relative 0→1, so a cropped clip shows only the audio that will actually play. Discarded audio disappears from the block.

**Crop-accurate auditioning**
- The ▶ clip preview starts at crop-in and hard-stops at crop-out, matching what the level will play.

**Live drag feedback**
- While dragging an edge, the waveform updates to the proposed crop in real time, and a faint ghost shows the portion being discarded so you can see exactly where the jarble ends.

**Handles that are actually grabbable**
- Widen the crop handles to a comfortable touch target, give them a visible grip, and layer them so they never sit under the clip buttons.
- Add "Crop start to playhead" / "Crop end to playhead" buttons on the selected clip, so you can park the playhead exactly where the jarble starts and cut there precisely instead of pixel-dragging.

**Verification**
- Confirm crop-out is written to the clip record, the block narrows, the waveform shows only the kept audio, the ▶ preview stops at the cut, and full timeline playback plus published playback both stop at the cut.

## Technical notes

- `src/components/superadmin/prek/TimelineCanvas.tsx` — replace the block-relative `peakStart` / `peakEnd` math (currently `(segStart - res.startSec) / audioDurTL`) with source-time-relative fractions derived from `trim_start_seconds` / `trim_end_seconds` / `duration_seconds` / `playback_rate`; apply the same mapping to the drag-preview segment; widen and re-layer the `trim-start` / `trim-end` handles.
- `startClipPreview` in the same file — pass crop-out and stop playback via `timeupdate`.
- `src/components/superadmin/prek/AudioMixEditor.tsx` — add the two "crop to playhead" actions on the selected-clip inspector, reusing the existing `trimClip` handler.
- No changes to `preKClipResolve.ts`, the runtime mixer, or the database — those already respect the crop.
