# Swap in the new Benny "Book Ears" design (stills only)

Replace the static Benny artwork across the app with the new uploaded design. Sprite-sheet animations (idle/walk) and the hero video keep the old art for now.

## What changes

- Upload the new Benny art as a CDN asset (`benny-book-ears.png`).
- Point every **still image** use of Benny at the new asset:
  - `src/components/aura/game/rpg/BennyStanding.tsx` — Pre-K world-map Benny (currently `benny-standing.png`).
  - `src/pages/ForFamilies.tsx` — the idle / celebrate / sad stills shown on the families page.
  - `src/components/BennyDog.tsx` — the celebrate and sad still poses (the 30-frame idle and walk sprite animations stay untouched).
  - `src/components/aura/game/rpg/YubiScene.tsx` — the celebrate and sad still poses only.

Mood-specific stills (celebrate, sad) will use the same new artwork; motion/tilt/bounce CSS already applied to those states keeps them feeling distinct.

## What stays the same

- Idle and walk sprite-sheet animations (`benny-idle-sprite`, `benny-walk-sprite`) — a single still can't drive a 30-frame strip.
- Landing-page hero video and all Pre-K adventure video clips.
- Old asset pointers stay in the repo (still referenced by the animations), so nothing breaks.

## Technical notes

- Asset created with `lovable-assets create` from the upload; components import the resulting `.asset.json` and use `.url`, matching the existing pattern.
- No layout, sizing, or animation-timing changes — only the image source swaps, so aspect handling (`objectFit: contain`) carries over.
