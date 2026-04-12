

## Fix Three Critical RPG Minigame Bugs

### Bug 1: Speed Reading Blitz — Reading Correctly Kills the Player

**Root cause**: In `RPGSpeedTypist.tsx` line 194, every correct word calls `onDamage(10)`. This prop is wired to `handleMiniGameDamage` in `RPGBattleArena.tsx`, which **subtracts HP from the player**. So reading 10 words correctly = 100 damage to yourself = instant death.

**Fix**: Remove `onDamage(10)` from the correct-word handler entirely. The damage to the enemy is already handled in `handleSpeedTypistComplete` via the `damage` parameter (`score * 10 + streak * 5`). The `onDamage` prop should only be called when the player FAILS (e.g., time runs out with unread words), not on success.

- **File**: `src/components/aura/game/rpg/RPGSpeedTypist.tsx`, line 194
- Delete `onDamage(10);`

---

### Bug 2: Missile/Fireball Defense — Can't Speak Words, Moves Too Fast, Looks Wrong

Three sub-issues in `RPGFireballDefense.tsx`:

**a) Speech recognition is too strict**: Line 156 only accepts exact match or `includes`. It doesn't use the lenient matching pipeline the rest of the game uses (homophones, edit distance, first-chars). Fix: add the same lenient matching used everywhere else.

**b) Fireballs move too fast**: Speed is `0.3 + Math.random() * 0.2` (0.3-0.5% per frame at 60fps). With tap-to-select + speak workflow, that's ~3 seconds to cross the screen. Fix: reduce to `0.08 + Math.random() * 0.06` (same range as FireballBarrage).

**c) Visual doesn't match "missiles" in Agent mode**: The balls use orange/red gradients even in Agent mode. Fix: in Agent mode, render them as elongated missile-shaped elements with cyan/slate colors instead of round fireballs.

- **File**: `src/components/aura/game/rpg/RPGFireballDefense.tsx`
- Lines 50-51: Reduce speed values
- Lines 151-168: Replace strict matching with lenient matching
- Lines 337-341: Update Agent mode visual styling

---

### Bug 3: Missile Defense Freezes After Completion

**Root cause**: The game-over overlay renders (line 401-430) but `onComplete` fires after a 1-second delay (line 114). During this time, speech recognition may still be active, and the overlay blocks all interaction. If `recognitionRef` isn't properly stopped, it can cause the component to hang.

**Fix**: 
- Force-stop speech recognition when `gameActive` becomes false
- Reduce the completion delay from 1000ms to 500ms
- Ensure `cancelSelection()` is called on game end

- **File**: `src/components/aura/game/rpg/RPGFireballDefense.tsx`
- Add cleanup when `gameActive` flips to false (stop recognition)
- Line 114: Reduce timeout to 500ms

---

### Summary

| File | Change |
|---|---|
| `RPGSpeedTypist.tsx` | Remove self-damage on correct words (line 194) |
| `RPGFireballDefense.tsx` | Slow down projectiles (0.3→0.08 speed) |
| `RPGFireballDefense.tsx` | Add lenient speech matching |
| `RPGFireballDefense.tsx` | Fix Agent mode visuals (missiles not balls) |
| `RPGFireballDefense.tsx` | Fix freeze on completion (cleanup recognition) |

