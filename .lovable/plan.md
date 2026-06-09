## Goal
On any obstacle whose problem is a river (today: the first obstacle of "Help Benny visit Grandma!" — `sceneEmoji: "🌊"`, problemLine "Oh no! A river!"), replace the flat sky/ground gradient with the uploaded looping stream video. Benny's sprite, idle layer, walk layer, ground anchor, and all motion timing are not changed.

## Why video over a still
The scene is literally a flowing stream — a static painting reads as a screenshot. The video sells the obstacle. Benny is an SVG overlay rendered above the background layer, so the background swap is fully isolated from his rendering.

## What changes

1. **Upload the video as a Lovable asset**
   - `lovable-assets create --file /mnt/user-uploads/Gen-4_Turbo_-_make_the_stream_flow.mp4 --filename river-stream-bg.mp4 > src/assets/river-stream-bg.mp4.asset.json`
   - Capture one poster frame with ffmpeg at ~0.5s, then upload it the same way:
     - `ffmpeg -ss 0.5 -i /mnt/user-uploads/Gen-4_Turbo_-_make_the_stream_flow.mp4 -frames:v 1 -q:v 2 /tmp/river-stream-poster.jpg`
     - `lovable-assets create --file /tmp/river-stream-poster.jpg --filename river-stream-poster.jpg > src/assets/river-stream-poster.jpg.asset.json`

2. **Mark river obstacles in data** (`src/data/preKAdventures.ts`)
   - Add optional `backgroundVideo?: "riverStream"` to the `Obstacle` type.
   - Set it on the existing river obstacle in `W101_L1`. Any future river obstacle can opt in the same way.

3. **Render the video background** (`src/components/aura/game/rpg/NabuAdventure.tsx`, around line 271)
   - Keep `bg-gradient-to-b ${skyClass}` div as the fallback layer underneath.
   - When `scene?.backgroundVideo === "riverStream"` AND `phase !== "ending"`, render a `<video>` absolutely positioned `inset-0 w-full h-full object-cover` ABOVE the gradient and BELOW `<NabuScene>`/HUD.
   - Attributes: `autoPlay`, `loop`, `muted`, `playsInline`, `preload="auto"`, `poster={riverStreamPoster.url}`, `aria-hidden`, `tabIndex={-1}`, `disablePictureInPicture`, `controls={false}`, `draggable={false}`.
   - `pointer-events-none` so it never intercepts taps.

4. **Nothing else touched**
   - `NabuScene.tsx` — not modified. Benny's idle sprite, walk sprite, ground anchor, opacity crossfade, and motion timing stay exactly as they are.
   - HUD chrome, progress dots, header pill, animated clouds, grass blades — unchanged.

## Risk callouts (honest)
- File size: the MP4 will be a few MB. Acceptable — it only loads on river scenes and is CDN-cached.
- iOS Low Power Mode can suppress autoplay even with `muted` + `playsInline`. The poster image is the fallback so the user still sees a stream scene, just not animated. No code path depends on the video playing.
- The video has its own baked-in horizon/sky/grass. The existing cloud and grass-blade overlays inside `NabuScene` will still draw on top. If they clash visually, the cleanest follow-up is to suppress those overlays only when `backgroundVideo` is set — happy to do that in the same change if you want it.
