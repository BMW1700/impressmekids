

## Fix Plan: Online PvP Loading Bug + Co-op Word Progression + Co-op Mode Toggles

### Problems Found

**PvP — Stuck on "Loading battle..."**
- The guest has NO polling fallback. If the initial DB fetch happens before the host writes `game_state`, and the Realtime subscription misses the event, the guest stays stuck forever on "Loading battle..." with `ready = false`.
- The host writes initial state, but the guest may load first and find `game_state = null`, then never retry.
- Fix: Add a polling fallback (like the lobby has) so the guest keeps checking until `game_state` appears.

**Co-op — Words never advance past the first batch**
- `RPGOnlineCoopBattle` has NO `wordIndex` in its game state. It passes the entire `storyWords` array to `RPGWordReader` every render, so the reader always starts from word 0.
- The `handleWordResult` callback signature is `(correct: boolean)` but `RPGWordReader` expects 4 args. JS won't crash (extra args ignored), but the component never tracks which word the player is on.
- Fix: Add `wordIndex` to `CoopGameState`, advance it on each word read, and slice `storyWords` from the current index.

**Co-op — No mode toggles**
- Need two modes selectable before battle starts:
  - **Repeat Mode**: Player 1 reads 5 words, then Player 2 reads the SAME 5 words, then advance to next 5.
  - **Continuous Mode**: Player 1 reads words 1-5, Player 2 reads words 6-10, etc.
- Fix: Add a `coopMode` field to `CoopGameState` and a pre-battle toggle UI. Track `repeatPhase` to know if the second player is repeating.

---

### Implementation

#### File 1: `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`

**Add guest polling fallback** (lines 119-148):
- After the initial fetch, if the guest finds no `game_state`, start a 2-second interval that re-fetches until `game_state` exists.
- Once found, set `gs` and `ready = true`, clear the interval.
- This mirrors what the lobby already does for room readiness.

#### File 2: `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx`

**Full rework of game state and word progression:**

1. Add to `CoopGameState`:
   - `wordIndex: number` — current position in story
   - `coopMode: 'continuous' | 'repeat'` — selected mode
   - `repeatPhase: 1 | 2` — in repeat mode, tracks if first or second player is reading
   - `batchStartIndex: number` — start of current 5-word batch (for repeat mode)

2. Add host initialization (like PvP has):
   - Host writes initial `game_state` on mount with `coopMode` from a pre-battle selection screen.
   - Guest polls until state exists.

3. Fix `handleWordResult`:
   - Update signature to `(correct: boolean, spokenWord: string, wordIndex: number)` to match `RPGWordReader` expectations.
   - Increment `wordIndex` on each word read.
   - In continuous mode: after 5 words, switch turn to other player who continues from current `wordIndex`.
   - In repeat mode: after 5 words by Player 1, switch to Player 2 starting from `batchStartIndex` (same words). After Player 2 finishes those 5, advance `batchStartIndex` by 5 and switch back.

4. Slice `storyWords` correctly:
   - Continuous: `storyWords.slice(gs.wordIndex)`
   - Repeat: `storyWords.slice(gs.batchStartIndex, gs.batchStartIndex + 5)` — both players see the same 5 words

5. Add pre-battle mode selection:
   - New `phase: 'setup'` where host picks Continuous or Repeat mode before the battle begins.
   - Guest waits for host to select.

6. Add polling fallback for guest (same pattern as PvP fix).

---

### Files Modified
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx` — add guest polling
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx` — full rework: word index tracking, mode toggles, host init, guest polling

### No database changes needed
The `game_state` JSONB column already supports arbitrary JSON.

