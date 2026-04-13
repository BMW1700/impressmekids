

## Brutal Audit: What's Actually Wrong with Online PvP

### The Smoking Gun
I queried the database. **Every single PvP room ever created has `rev=0`, `wordsRead=0`, `batchProgress=0`**. The `game_state` JSONB column is never updated after room creation. The student reads words and their local UI updates (you can see the student is on word 4 of 5), but `pushState` — the function that writes to the database — is **silently failing on every call**. The parent never receives any updates because there's nothing to receive.

### Root Causes (3 Issues)

**Issue 1: `pushState` RPC is silently failing**
The `sync_multiplayer_room_state` RPC requires `auth.uid()` to be non-null. The function works — it's properly defined with `SECURITY DEFINER` and `GRANT EXECUTE` to `authenticated`. But the Supabase client may not have a valid session when `pushState` fires. The error is caught in a try/catch and logged to `console.error`, but since neither player's console is visible to us, the failure is invisible. The `enqueueStatePersist` chain then calls `rehydrateRoom()` as fallback, which reads from DB — but since DB was never updated, it reads back the same `rev=0` state.

Additionally, the `pushState` function reads the RPC response (`data[0].game_state`) and applies it locally. If the RPC returns an error, the local state gets clobbered back to the DB's stale `rev=0` state, **undoing the student's local progress**. This would explain why the student's progress resets or appears glitchy.

**Issue 2: RPGWordReader not in `mode='fast'` for Elara**
The online PvP battle renders `<RPGWordReader words={currentBatchWords} onResult={handleKidWordResult} />` without passing `mode='fast'`. In regular RPG mode (RPGBattleArena), Elara gets `mode={selectedCharacter === 'elara' ? 'fast' : 'normal'}` which provides faster feedback (150ms vs 300ms delays) for her 5-word charge-and-barrage mechanic. The online PvP also has no Elara charge counter UI, no plasma barrage logic, and no character selection step.

**Issue 3: Background mismatch is a red herring**
The AI vs gradient background toggle is stored in `localStorage('rpg_use_ai_bg')`. Each device has its own localStorage. One player toggled it on, the other didn't. This is expected per-device behavior, not a sync bug.

### Fix Plan

#### 1. Fix `pushState` to be resilient (the critical fix)
- Add defensive logging with `console.warn` for every possible failure path
- After RPC error, do NOT clobber local state — keep the locally-computed state and retry
- Add a session validity check before calling the RPC
- If session is missing, call `supabase.auth.getSession()` to refresh before retrying
- Remove the local state clobber from the RPC response (the local state is already correct; we don't need to re-apply the DB response)

#### 2. Add Elara's 5-word fast mode to online PvP
- Pass `mode='fast'` to `RPGWordReader` in the online PvP component
- Add the Elara charge counter UI (the purple orbs showing charge 1-5)
- Implement the plasma barrage logic: first 4 words charge up (no damage), 5th word deals 3x damage
- This makes online PvP behave identically to regular RPG mode when playing as Elara

#### 3. Harden the sync layer
- Make the broadcast channel fire even on RPC failure (so the other client at least tries to rehydrate)
- Add a `console.log` on every `commitState` call with the rev number and phase for debugging
- Add a health-check on component mount that verifies the RPC works (call it with a no-op state to confirm auth is valid)

### Files to modify
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx` — Fix pushState resilience, add Elara fast mode + charge UI, add session refresh, add debug logging
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx` — Same pushState fixes for co-op parity

### What this does NOT fix (deferred to next pass)
- Character selection screen for the student in online PvP (currently hardcoded to Elara)
- Co-op mode full testing
- Background sync between devices (low priority — it's a per-device preference)

