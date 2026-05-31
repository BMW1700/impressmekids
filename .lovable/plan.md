# Honest recommendation + Missile Minigame Fix

## Honest call on reading (Elara/Cypher fast-burst)

**Leave it as-is. Don't add a Fast vs Normal toggle.**

- The new `applyFastBurst` already handles 1, 2, 3, 4, or 5-word bursts identically — saying one word at a time works the same as ripping 5 in one breath.
- AURA scoring, phoneme tracking, miscue analysis, and fluency leveling are unaffected. Every word still fires its own `onResult`.
- A toggle adds a decision point for a 7-year-old, two code paths to maintain, two QA surfaces, and dilutes the whole point of Elara/Cypher ("fast-flow reader" characters).
- Only intra-burst per-word response-time precision is slightly fuzzier — a fluency-chart cosmetic, not a scoring issue. Skip the optional refinement for now; it's noise.

**Verdict: ship the reading as it is.**

## Real bug: Agent-mode missile minigame doesn't exit

**Root cause (`RPGFireballDefense.tsx`):**

- Missiles spawn at `x = -10 - (index * 15)` → missile #8 starts at **x = -115%** off-screen.
- With speed `0.05–0.09` per frame, the last missiles take 20–30+ seconds to even enter the play field.
- Player destroys every visible missile by speech, then... waits. The completion gate `allDone = updated.every(f => f.isDestroyed)` is never satisfied because the off-screen missiles are still slowly crawling in. Screen sits frozen, reading never resumes.

## Fix plan

Single file: `src/components/aura/game/rpg/RPGFireballDefense.tsx`

1. **Tighten spawn spread.** Change initial `x` so all missiles enter the screen within ~6 seconds:
   - `x: -10 - (index * 6)` (max start ≈ -52% instead of -115%), AND
   - bump base speed floor from `0.05` to `0.08` so even the rear missiles arrive in reasonable time.

2. **Add a safety completion timer.** When the component mounts, start a hard 25-second timeout. If the game is still active when it fires, mark every remaining missile destroyed, set `gameActive=false`, and let the existing completion effect trigger `onComplete(blocked, hit, totalDamage)`. This guarantees the screen always returns to the battle/reading view even if a weird state slips through.

3. **Clear the safety timer** in the unmount cleanup and when `gameActive` flips to false.

4. **No changes** to scoring, damage math, speech recognition, or UI/copy. Stats reported to AURA stay identical.

## Out of scope

- No Fast/Normal toggle for Elara/Cypher.
- No changes to `RPGWordReader`, victory arena, castle swarm, or world data.
- No new files.

## Verification

- Open Agent mode → reach a battle that triggers Fireball/Missile Defense.
- Destroy all visible missiles by speech as fast as possible → game-over overlay appears within ~1s and battle resumes.
- Let missiles through without speaking → damage applied, game still ends within 25s max via safety timer.
