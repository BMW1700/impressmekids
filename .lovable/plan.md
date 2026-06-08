## What's actually broken (audit)

After re-reading `NabuScene.tsx` and `BennyDog.tsx`, four independent bugs are stacking into the "spazzing" you see:

1. **Floating idle** — In `BennySvgImage`, the still sprite is positioned with `y = -h + 10`, anchored at `NABU_START.y = GROUND_Y - 10 = 370`. Net: feet end up 20px ABOVE the ground line. Pic 1 (river) and pic 3 (gate) show exactly that.
2. **Wrong vertical anchor in walking too** — `walkY = -w + walkPad + 10` adds another `+10`, so paws drift above ground while walking on some scenes.
3. **Oversized in some scenes** — `NabuSprite` defaults to `size = 280` in a 1000-wide viewBox. That's ~28% of stage width. Several scenes (gate/key, river, etc.) call it with no override → Benny dominates the frame and clips to the corner when `x=140` (pic 3).
4. **"Spazz" = animation restart on every render** — `animate={anim(phase)}` builds a fresh object literal every render. With `repeat: Infinity` keyframes (problem/ask/reading), Framer Motion restarts the loop on every parent re-render → teleport/jitter.
5. **Walk cycle end-flash** — `BennyDog.tsx` sets `--benny-walk-end: -WALK_FRAMES * walkSize` (off by one). The 24-frame cycle's last `steps()` lands on an empty 25th column → 1-frame flash that reads as a glitch.

## Fix plan

All changes are in two files: `src/components/aura/game/rpg/NabuScene.tsx` and `src/components/BennyDog.tsx`. No asset re-uploads.

### `NabuScene.tsx`

- Lower `NABU_START.y` and `NABU_EXIT.y` to **`GROUND_Y` (380)** so the sprite's bottom edge sits exactly on the ground line.
- In `BennySvgImage`, change `stillY = -h + 10` → **`stillY = -h`**, and `walkY = -w + walkPad + 10` → **`walkY = -w + walkPad`**. Feet now meet ground on every scene and phase.
- Reduce `NabuSprite` default `size` from **280 → 190**. (Walking-pad math scales by ratio, no other change needed.)
- **Memoize the animate objects** so loops don't restart on every render: wrap each `nabuAnim(phase)` / scene-specific `anim(phase)` result in a `useMemo` keyed on `[phase]` inside `NabuSprite`, and pass that memoized value to `<motion.g animate=...>`.
- Add a stable React `key` on `<motion.g>` tied to `phase` so phase changes intentionally restart the animation (clean), while same-phase re-renders don't.

### `BennyDog.tsx`

- Fix off-by-one: `--benny-walk-end` → **`-(WALK_FRAMES - 1) * walkSize`** and `steps(${WALK_FRAMES})` → **`steps(${WALK_FRAMES - 1}, end)`**. Eliminates the empty-frame flash at the loop boundary.
- Mirror the same `-h`/`-w + walkPad` anchor fix where this component is used standalone (idle/walk containers already use `bottom: 0` / `bottom: -walkGroundCorrection`; verify ground correction still matches new pad).

### Out of scope (not touching)

- Asset PNGs themselves — already cleaned in the prior turn.
- Movement timings (2.6s) — leaving as-is since you said the walking pace was finally OK.
- Scene backgrounds, dialogue UI, level progression.

## Verification

- Reload the Nabu adventure, walk through scenes 1 → 5: Benny's paws should touch the ground line in every still/walking phase.
- He should be ~190 viewBox-units wide, comfortably proportioned vs. the gate, river, and key.
- No teleport/jitter during idle "problem" or "ask" phases (the breathing loop should run smoothly without restart).
- Walking loop should cycle cleanly with no empty-frame flash between strides.
