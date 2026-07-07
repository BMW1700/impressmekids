## Goal
Replace the old "Nabu Learn" hero video with the new "Yubi Learn" MP4 (`user-uploads://Untitled_Scene_07-07_19_41_25_202607071550.mp4`) everywhere it appears.

## Where the old video is used
The `BennyVideoHero` component (and the raw `nabu-hero.mp4` asset) render on both pages shown in the screenshots:
- `src/pages/ForFamilies.tsx` — the "…first best friend" hero (screenshot 1)
- `src/pages/ModeSelect.tsx` — the "Meet Benny" cinematic frame (screenshot 2)
- Source component: `src/components/landing/BennyVideoHero.tsx`, which reads `src/assets/nabu-hero.mp4.asset.json`

Because both surfaces share the same asset pointer, swapping the asset bytes updates both video boxes in one shot — no component changes required.

## Steps
1. Upload the new MP4 to Lovable Assets as a new pointer:
   `lovable-assets create --file /mnt/user-uploads/Untitled_Scene_07-07_19_41_25_202607071550.mp4 --filename yubi-hero.mp4 > src/assets/yubi-hero.mp4.asset.json`
2. Update `src/components/landing/BennyVideoHero.tsx` to import `yubi-hero.mp4.asset.json` instead of `nabu-hero.mp4.asset.json` (poster stays as-is — first frame of the new video is visually similar; if it looks off we generate a new poster from the MP4 with ffmpeg).
3. Delete the old asset pointer: `lovable-assets delete --file src/assets/nabu-hero.mp4.asset.json`.
4. Verify by loading `/for-families` and `/mode-select` in the preview and confirming the "Yubi Learn" cloud-text video plays in both hero frames.

## Out of scope
- No copy, layout, or styling changes.
- Poster image only replaced if the current one visibly mismatches the new opening frame.
