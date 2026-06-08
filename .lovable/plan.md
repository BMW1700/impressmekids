## Plan: use the new transparent Benny video as the walk animation

The new upload is a 2880×2880, 5s clip of Benny walking in place on a solid black background. I will convert it to a true alpha-channel WebM and use it as Benny's animation during post-word movement.

## What I will do

1. **Convert the video to transparent WebM**
   - Strip the solid black background using a chroma/color key filter.
   - Encode as VP9 + alpha WebM (smaller, transparent, loops cleanly).
   - Also encode an HEVC MP4 fallback with alpha for Safari.
   - Downscale from 2880×2880 to a reasonable size (around 720×720) to keep file size small.
   - Upload both via Lovable Assets and import the `.asset.json` pointers.

2. **Add a `BennyWalkVideo` render path**
   - New small component renders a looping, muted, autoplay, playsInline `<video>` with the WebM source and MP4 fallback.
   - Used wherever Benny is currently rendered in a `walk` (and reused for `jump`/`climb`) movement state.

3. **Only play it after the word is read**
   - Keep the existing phase logic: `problem` / `ask` / `reading` → idle Benny (existing sprite/still).
   - `solved` / `transition` → swap to the new walking video.
   - When movement ends, return to idle.

4. **Remove the fake leg rig**
   - Delete the CSS `.benny-leg*` overlays and the foot clip-path in both `NabuScene.tsx` and `BennyDog.tsx`.
   - No more pasted-on glowing paws or rotating ovals.

5. **Verify**
   - Check that the video plays with no visible black square in the scene.
   - Confirm legs only animate during `solved` / `transition`, not while waiting for the child to speak.
   - Confirm the rest of the scene (idle, celebrate, sad) is unchanged.

## Technical notes

- WebM with VP9 + alpha is supported by Chrome, Edge, Firefox, and modern Android. For Safari (including iPad, which is mandatory), add an HEVC MP4 with alpha as a `<source>` fallback ahead of the WebM.
- Use `ffmpeg` with `colorkey=0x000000:0.1:0.05` (and a mild despill) to drop the black background while preserving Benny's dark outline.
- Final file targets: WebM ~300–600 KB, HEVC fallback ~600 KB–1 MB, both at 720×720.
- Render via a plain `<video autoplay muted loop playsInline>` inside the existing `<foreignObject>` so it sits in the same spot as the current Benny sprite.

## Result

After the child reads the word, Benny's legs move using the real walking video. Before the word is read, he stays idle. The previous fake leg overlays are gone.