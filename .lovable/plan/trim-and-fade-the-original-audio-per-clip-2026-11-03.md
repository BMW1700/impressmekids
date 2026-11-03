# Trim and fade the original audio per clip

## Goal
When a clip is set to play its original audio ("Mix" or "Original only"), you can cut the start and end of that original sound. Cutting the start means the original no longer runs over the redubbed voice. The change between redub and original sounds smooth, with no clicks or sudden jumps in volume.

## What you'll see
- On the clip's original-audio row (the grey waveform), you get drag handles on the left and right edges. These only appear when that clip isn't set to "Original muted".
- Dragging an edge cuts only that side. The rest of the sound stays where it is, the same way trimming the redub works now. The part you cut shows as a faded ghost.
- Each edge gets a small fade setting: off, short (0.15s) or smooth (0.4s). Smooth is the default, so the original fades in and out under the redub.
- The editor preview and the real game both play the trimmed, faded original.
- There's a "Reset trim" button, and undo works for all of this.
- Trims are saved with the level. Clips you never touch behave exactly as they do today.

## Technical details
- Store each clip's setting as an object instead of a plain mode: `{ mode, trimStartSec, trimEndSec, fadeInSec, fadeOutSec }`. Old saved values (`"mix"` / `"original_only"`) are still read correctly, so no database change is needed.
- `preKOriginalAudio.ts`: the reader accepts both old and new formats. Add `originalAudioGainAt(sceneKey, tSec, sceneDuration, map)`, which returns a volume from 0 to 1 that follows the trim window and fades.
- Playback: the original sound is the video's own audio, so it gets cut and faded by changing the video's volume on every frame. A short ramp is used instead of an instant on/off, which avoids clicks. This applies in `YubiVideoAdventure.tsx` and `TimelinePreviewPlayer.tsx` alongside the existing mute logic.
- `TimelineCanvas` / `AudioMixEditor`: reuse the existing edge-trim handles and ghost overlay on the original-audio row, and save through the same undo history.
- Tests: old-format values still parse; the volume is 0 before the start cut and after the end cut; the volume ramps up during the fade-in and down during the fade-out; "Original muted" ignores trims.

## Not included
- Changing the video picture itself. This only cuts and fades the sound.
