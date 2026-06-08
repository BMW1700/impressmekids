# Fix Benny: real walk & jump animations

## The problem
The two-layer head/body rig looks wrong — the head pivots independently of the body, the neckline shows seams, and there is still no actual leg movement. You're right: this is not professional. Static PNGs with floating heads are not how kids' game characters move.

## The fix: sprite-sheet animation (same technique Mario, Paw Patrol games, etc. use)
We already use this technique successfully for Benny's idle (30-frame `benny-idle-sprite.png` driven by CSS `steps()` animation). We'll extend the same proven pattern to **walk** and **jump**, then retire the head/body rig entirely.

### 1. Generate two new sprite sheets (matching existing Benny art style)
Using imagegen (premium tier, locked to the existing Benny look) we produce:

- **`benny-walk-sprite.png`** — 12-frame side-view walk cycle. Legs alternate front/back, tail wags, head bobs, ears sway. Single row, 420×450 cells, transparent background, identical proportions to current idle sprite so they swap cleanly.
- **`benny-jump-sprite.png`** — 8-frame jump (crouch → launch → airborne with legs tucked → land squash → settle). Same cell size.

Both sheets are QA'd by rendering each frame as a contact sheet image and visually inspecting for: consistent character, feet-on-baseline, no clipping, smooth tweens between adjacent frames. If a frame is off, we regenerate just that pose.

### 2. Extend `BennyDog.tsx` with new moods
Add `walk` and `jump` to `BennyMood`. Each mood maps to its sprite sheet and a tuned CSS `steps()` animation:
- `walk`: 12 steps, ~0.8s loop, infinite
- `jump`: 8 steps, ~0.7s, runs once with `forwards` fill, then auto-returns to idle

Same baseline alignment math the idle already uses — feet stay planted on the ground line.

### 3. Wire it into `NabuScene.tsx`
- Remove all `BennyRigged` imports and `<foreignObject>` overlays.
- When Benny needs to walk across the scene (`walkToAnim`, `bouncyWalkAnim`), the sprite plays the **walk** cycle while Framer Motion translates his x position. Legs move because the sheet animates — not because we squish the whole image.
- When he hops (`hopOverAnim` / correct-word celebration), play the **jump** sheet while Motion arcs him up and back down.
- Idle phase keeps the existing 30-frame idle sprite.
- Sad phase keeps the existing sad PNG with the shake (it's brief and reads fine).

### 4. Delete the broken rig
Remove `BennyRigged.tsx` and the two rig PNG assets (`benny-rig-head`, `benny-rig-body`) via `delete_asset` so we don't keep paying CDN storage for art we won't use.

## Technical details
- Sprite sheets composite on the GPU via `background-position` — zero JS per frame, identical performance on iPad Safari (the K-5 target device).
- CSS `steps(n, end)` gives crisp frame transitions, no blur.
- `prefers-reduced-motion` honored: walk/jump fall back to a single mid-cycle frame.
- Total added asset weight: ~1.6 MB across both sheets, served from R2 CDN.
- No backend, DB, or auth changes. Pure frontend + new image assets.

## Files
- New: `src/assets/benny-walk-sprite.png.asset.json`, `src/assets/benny-jump-sprite.png.asset.json`
- Edit: `src/components/BennyDog.tsx` (add walk/jump moods)
- Edit: `src/components/aura/game/rpg/NabuScene.tsx` (swap rig usage → sprite moods)
- Delete: `src/components/BennyRigged.tsx`, `benny-rig-head.png.asset.json`, `benny-rig-body.png.asset.json`

## What this gets you for the Patrick demo
Benny actually walks across the screen with his legs moving, and actually jumps over obstacles with a squash-and-stretch landing — same animation quality bar as commercial preschool apps (Khan Kids, Endless Alphabet, PBS Kids games). No more floating-head Frankenstein.
