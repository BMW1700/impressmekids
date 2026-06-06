# Castle Swarm — Premium Background Swap

## What changes

Only the visual backdrop behind the Castle Swarm battle scene. No gameplay, speech, reading flow, HP, damage, sentence logic, buttons, DB, or castle positioning touched.

The uploaded image already matches our layout perfectly: dark spiky enemy castle on the LEFT, blue-flagged hero castle on the RIGHT, open battlefield lane in the middle. No mirroring needed.

## Steps

1. **Upload the image to the CDN** using `lovable-assets` from `/mnt/user-uploads/76ae7448-87d5-4f54-bc26-7d9542288eeb.png`, writing the pointer to `src/assets/castle-swarm-bg.png.asset.json`. Keeps the repo lightweight and gives us a cached, optimized URL.

2. **Rewrite `src/components/aura/game/castle/ArenaBackground.tsx`** — replace the current SVG mountains, gradient sky, fake torches, and perspective ground with:
   - A single `<img>` element sized `absolute inset-0 w-full h-full object-cover` so the painting fills the scene and never stretches.
   - `loading="eager"` + `decoding="async"` + `draggable={false}` for fast paint with no layout shift.
   - `aria-hidden` and `pointer-events-none` (it's pure decoration).
   - A very soft top-edge gradient (transparent → `bg-black/30`) **only behind the top HUD strip** and a matching one behind the bottom reading panel zone, so the HUD chips and word buttons stay readable. The middle of the battlefield stays untouched and crisp.
   - Keep the component `memo`'d so it doesn't re-render on every battle tick.

3. **No changes** to `CastleSwarmArena.tsx`, enemy sprites, castle components, HP bars, word buttons, HUD, sentence logic, speech, or any hook. `ArenaBackground` is already mounted as the bottom layer with `pointer-events-none`, so swapping its contents is the entire visual change.

## Files touched

- `src/assets/castle-swarm-bg.png.asset.json` *(new — CDN pointer)*
- `src/components/aura/game/castle/ArenaBackground.tsx` *(rewritten — visual only)*

## Performance

- Image served from Lovable's CDN with aggressive caching.
- Single `<img>` tag, no animations, no filters → cheaper than the current multi-SVG composition.
- `object-cover` handles desktop/tablet/mobile/iPad without stretching.
- No layout shift: absolutely positioned, fills parent.

## Confirmation after build

I'll summarize the diff and confirm gameplay/reading code was untouched (only `ArenaBackground.tsx` + the new asset pointer).
