## Goal

Swap Nabu the Owl for Benny the Dog as the in-scene character on every Pre-K adventure level. All environments (river, mud, locked door, ladder, etc.), word cards, mic logic, scoring, and traversal animations stay exactly as they are — only the character sprite changes, and it now also reacts with mood (idle / celebrate / sad) to mic results.

## What changes

1. **Upload the 3 attached images to the Lovable Assets CDN** and write pointer files:
   - `src/assets/benny-idle.png.asset.json`
   - `src/assets/benny-celebrate.png.asset.json`
   - `src/assets/benny-sad.png.asset.json`
   (No binaries in the repo. The `public/assets` path from the original request is not needed.)

2. **New component `src/components/BennyDog.tsx`**
   - Props: `mood: "idle" | "celebrate" | "sad"`, `size?: number` (default 140), plus optional `className` / `style` so it can be reused both as a corner mascot and as the in-scene sprite.
   - Renders the correct PNG per mood with framer-motion:
     - `idle` → gentle vertical bounce loop
     - `celebrate` → quick jump + scale-up
     - `sad` → small left/right shake
   - `<img alt="Benny the dog">`, `draggable={false}`, `pointer-events-none`.

3. **Replace Nabu sprite inside every scene** (`src/components/aura/game/rpg/NabuScene.tsx`)
   - Remove the SVG `NabuSprite` (owl body, wings, eyes, beak).
   - Introduce a `BennySprite` that wraps `<BennyDog>` in a `motion.div` so it can still receive the existing per-scene `anim` keyframes (`jumpArcAnim`, `bouncyWalkAnim`, `walkToAnim`, `bridgeArcAnim` replacement, rocket lift-off, boat sail, etc.). The `anim` API stays the same so all per-scene traversal animations (JUMP arc over river, BOOTS walk through mud, KEY walk-to-door, LADDER climb, ROCKET fly, BOAT sail, AXE hop, NEST walk-to, etc.) keep working untouched.
   - Mood wiring: `BennySprite` accepts a `mood` prop forwarded to `BennyDog`. Default is `idle`. During `solved` / `transition` phases the scene passes `celebrate`. Scenes do not know about `sad` — that comes from the mic layer (see #4).

4. **Wire mic results to mood** (`src/components/aura/game/rpg/NabuAdventure.tsx`)
   - Add `bennyMood` state. On `handleResult(true)` → `celebrate` for 2s then back to `idle` (already aligned with the existing `solved → transition` window). On `handleResult(false)` → `sad` for 1.5s then back to `idle`.
   - Pass `bennyMood` down to `NabuScene` → `BennySprite`. If `bennyMood` is set it overrides the phase-derived default (so a wrong answer can show sad even while the scene is still in `reading`).
   - All scoring, word-card rendering, TTS, progress dots, and ending screen are unchanged.

5. **Cleanup**
   - Delete the now-unused owl SVG sprite code from `NabuScene.tsx` (keep `Stage`, `Sky`, `Clouds`, `Grass`, all environment shapes, and all `*Anim` helpers).
   - Keep file/component names (`NabuScene`, `NabuAdventure`, `NabuEpisodeWrapper`) as-is to avoid touching the wider Pre-K wrapper / story-shell wiring. Only the rendered character changes; user-facing dialogue copy that says "Nabu" stays for now (separate change if you want it renamed everywhere).

## Files touched

- **Create**: `src/components/BennyDog.tsx`
- **Create**: `src/assets/benny-idle.png.asset.json`, `benny-celebrate.png.asset.json`, `benny-sad.png.asset.json` (via `lovable-assets` CLI)
- **Edit**: `src/components/aura/game/rpg/NabuScene.tsx` (replace owl SVG sprite with `BennySprite`, keep all scene environments + anim helpers)
- **Edit**: `src/components/aura/game/rpg/NabuAdventure.tsx` (add `bennyMood` state, pass to scene)

## Out of scope

- Renaming Nabu → Benny in spoken dialogue, story-shell intro/outro, world copy, or memory entries.
- Changing any non-Pre-K screens (Castle, LexiQuest, etc.).
- Changing scoring, word selection, mic/echo retry, or scene environments.
