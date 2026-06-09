## Brutally honest audit

The dog is still glitching because the app is not actually moving the same stable character layer forward. It is repeatedly remounting and re-animating the whole Benny wrapper at phase boundaries, while some scenes also move him upward during `solved` before the walk begins.

### Root causes

1. **Benny remounts on every phase change**
   - `NabuSprite` uses `key={phase}` on the `<motion.g>`.
   - When the child says the word, phase changes `reading -> solved -> transition`, so React destroys and recreates Benny twice.
   - That resets the idle sprite, resets the walk sprite, and makes the handoff visible.

2. **Framer Motion starts each new phase from the wrong initial position**
   - The wrapper has `initial={{ x: NABU_START.x, y: NABU_START.y }}`.
   - Because the wrapper is keyed by phase, every phase begins from that initial value, even if the previous visual state was mid-hop, raised, or settling.
   - This is why the dog pops/spazzes right before walking.

3. **Solved phase moves Benny before walking**
   - Default `nabuAnim("solved")` does a celebration hop upward.
   - `jumpArcAnim("solved")` explicitly moves him from `y: 370` to `y: 340`.
   - That means right after the word is accepted, Benny rises into the air before the walking phase starts.
   - User requirement says the idle dog should stay grounded and immediately become the walking dog.

4. **Mixed Y anchors still exist**
   - Global ground is `GROUND_Y = 380`, but some motion helpers still use `370` or `GROUND_Y - 10`.
   - `walkToAnim` defaults to `GROUND_Y - 10`.
   - `GenericScene` calls `walkToAnim(860, GROUND_Y - 10)`.
   - `jumpArcAnim`, `hopOverAnim`, and old helper code contain `370` anchors.
   - This makes the dog appear to rise/fall during transitions even when the sprite itself is grounded.

5. **Walking sprite animation restarts at transition start**
   - The walk layer is always mounted inside one render, but because its parent gets remounted on phase change, the “always mounted/predecoded” benefit is partially defeated.
   - The walk art looks good; the parent lifecycle is what makes the transition noticeable.

## Fix plan

### 1. Stop remounting Benny between phases

In `src/components/aura/game/rpg/NabuScene.tsx`:

- Remove `key={phase}` from the main `<motion.g>` in `NabuSprite`.
- Change the motion wrapper to a persistent character container keyed only by the obstacle/index through the parent scene, not by `problem/ask/reading/solved/transition`.
- Keep Framer Motion updating `animate`, but do not destroy/recreate the dog when the child speaks.

### 2. Disable initial replay after mount

- Replace `initial={{ x: NABU_START.x, y: NABU_START.y }}` with `initial={false}` on the persistent `<motion.g>`.
- This prevents Framer Motion from replaying the starting pose on every phase update.
- The dog will stay visually continuous from idle into movement.

### 3. Keep Benny grounded during `solved`

- Change default `nabuAnim("solved")` to keep Benny at `{ x: NABU_START.x, y: GROUND_Y, scaleX: 1, scaleY: 1, rotate: 0 }` with duration `0` or a tiny non-moving settle.
- Do not use wrapper hops for celebration in this Pre-K scene, because the user wants the same idle dog to begin walking without rising.
- Keep success effects/sparkle/props, but not body-lift on Benny.

### 4. Make all normal walking start from the exact ground line

- Change `walkToAnim(targetX, targetY = GROUND_Y - 10)` to default `targetY = GROUND_Y`.
- Update `GenericScene` from `walkToAnim(860, GROUND_Y - 10)` to `walkToAnim(860, GROUND_Y)` or just `walkToAnim(860)`.
- Update hardcoded `370` start/end values in normal movement helpers to `GROUND_Y`.

### 5. Preserve special movement only where it is semantically required

- Normal ground scenes: idle dog directly crossfades into walking dog, same baseline, no hop.
- Jump scenes (`JUMP`, `HOP`, `AXE`, `ROCKET` where currently jump/hop is intentional): keep airborne arcs only during `transition`, not during `solved`.
- Flying/lift scenes (`BALLOON`, `KITE`, `WINGS`, `CAPE`): keep flying behavior because the user explicitly allowed flying/jumping levels.
- Ladder/climb scene: keep climb action, but remove any pre-climb remount/pop by using the same persistent/no-initial pattern where possible.

### 6. Make the idle-to-walk handoff visually invisible

Inside `BennySvgImage`:

- Keep idle and walk layers mounted.
- Shorten the crossfade so idle fades out and walk fades in immediately, around `60ms-100ms`, instead of the current `200ms-250ms` lingering blend.
- Keep the current walking sprite art and timing untouched.

### 7. Remove stale/unused glitch helpers

- Remove or stop using `bouncyWalkAnim` if it remains unused/stale.
- Remove comments that say solved is a hop if solved is now intentionally grounded.

## Expected result

- During `problem`, `ask`, and `reading`: Benny idles with blinking/tail wagging on the ground.
- When the word is accepted: no upward hop, no flicker, no reset flash.
- At `transition`: the same grounded dog immediately becomes the good-looking walking dog and moves forward.
- Normal walking levels all behave the same.
- Only true jump/fly/climb levels leave the ground.