# Fix: Knights spawn at enemy keep and march the wrong way

## Problem
In `CastleSwarmArena.tsx`, the arena uses an inverted x-axis (rendered with `left: ${100 - pct}%`):
- `x = 0` = visually RIGHT (player castle)
- `x = ARENA_WIDTH` = visually LEFT (enemy keep)

Enemies are correct: spawn at `x = ARENA_WIDTH` (left, at enemy keep) and decrement `x` to march right toward the player.

Knights are fully inverted — they spawn next to the enemy keep, walk back toward the player castle, and "damage the enemy keep" when they reach the player's side.

## Fix (single file: `src/components/aura/game/castle/CastleSwarmArena.tsx`)

1. **Spawn at player castle (right side):**
   - Line 289: `x: ARENA_WIDTH - 60` → `x: 60`

2. **March toward enemy keep (increase x):**
   - Line 421: `k.x -= KNIGHT_SPEED * dt` → `k.x += KNIGHT_SPEED * dt`

3. **Hit enemy keep when they reach the LEFT (high x):**
   - Line 416: `k.x <= 60` → `k.x >= ARENA_WIDTH - 60`

4. **Cleanup off-screen knights on the correct side:**
   - Line 427: `k.x > -10` → `k.x < ARENA_WIDTH + 10`

5. **(Polish)** Engagement window in line 410 already uses `Math.abs(e.x - k.x) < 25`, which is direction-agnostic — no change needed.

## Verification
- Summon a knight (read a 7+ letter word). Knight should appear next to the player castle (right) and walk left into the enemy line, then chip the enemy keep when it reaches it.
- Enemies and all other systems untouched.

## Out of scope
Visuals, mic, HP scaling, sprite art — all left as-is.
