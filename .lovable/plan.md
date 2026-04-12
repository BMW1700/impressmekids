

## Brutal Audit: Online PvP Battle — What's Broken

### Critical Issues Found

**1. NO STORY WORDS VISIBLE — RPGWordReader signature mismatch**
The `RPGOnlinePvPBattle` passes `onResult: (correct: boolean)` but `RPGWordReader` expects `onResult: (correct: boolean, spokenWord: string, wordIndex: number, responseTimeMs?: number)`. The component is calling `handleWordResult` with the wrong signature, meaning the word reader may mount but the callback shape is wrong. More critically, the online PvP battle never tracks a `wordIndex` — it has no concept of which word the student is on, so the word reader has no state progression.

**2. Phase starts as 'waiting', initial load sets 'playing' but game_state may be null**
On line 91-99, the initial DB load reads `game_state`, but when the host creates the room the `game_state` column is likely `null`. The code does `gs.turn === 'host'` on a potentially null `gs`, which would crash. The phase stays stuck at 'waiting' with the message "Waiting for game..." and no word reader renders.

**3. Host must initialize game_state on room creation**
The online PvP never pushes an initial `game_state` to the DB. The host creates the room (in the lobby), but `RPGOnlinePvPBattle` expects `game_state` to already exist. Nobody writes it first, so both players load into a null state.

**4. Parent abilities don't work — no mini-games, no reading phase**
The local `RPGPvPBattle` has full `parent_reading` phase (show word, buttons for correct/incorrect), `mini_game` phase (word barrage, fireball defense). The online version has NONE of this. Parent just clicks an ability card and damage is applied instantly — no reading validation, no mini-games. The `requiresReading` flag is completely ignored.

**5. No turn-based word progression**
Local PvP tracks `wordIndex` and progresses through the story sequentially. Online PvP splits story into `storyWords` but never tracks which word the student is on — the `RPGWordReader` gets the full array but the battle has no index state.

**6. Online PvP is a completely different (broken) implementation from Local PvP**
Local PvP (`RPGPvPBattle.tsx`) is 442 lines of working battle logic with setup screen, turn management, cooldowns, mini-games, parent reading validation, and proper word progression. Online PvP (`RPGOnlinePvPBattle.tsx`) is a 327-line skeleton that shares almost none of this logic.

### Fix Plan

**Goal**: Make Online PvP functionally identical to Local PvP, but with cross-device sync via the room's `game_state` column.

#### Step 1: Initialize game_state when battle mounts (host only)
- When `isHost && phase === 'waiting'`, push a proper initial `game_state` to the DB with all fields populated
- Both players then load from this initial state and transition to 'playing'

#### Step 2: Fix RPGWordReader integration
- Add `wordIndex` to `GameState` so both players track story progression
- Pass the correct `onResult(correct, spokenWord, wordIndex)` signature
- Advance `wordIndex` on each word read, synced via DB

#### Step 3: Port parent abilities from Local PvP
- Add `parent_reading` phase to online PvP — when parent picks a `requiresReading` ability, sync this to DB so both devices see the reading challenge
- Add `mini_game` phase — when parent picks a minigame ability, both devices show it
- Track cooldowns in `game_state` so they sync across devices

#### Step 4: Add setup/names screen
- Use `host_name` and `guest_name` from the room row (already stored during lobby)
- Skip the local name-input setup screen since names come from lobby

#### Step 5: Match the full battle flow
- Turn switching after every 5 correct words (kid → parent)
- Parent turn: show ability cards with cooldowns
- Parent reading: show word + correct/incorrect buttons (parent device only)
- Mini-games: word barrage and fireball defense (renders on both devices)
- Victory/defeat screens with full stats

### Files to modify
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx` — full rewrite to mirror Local PvP with DB sync
- No schema changes needed — `game_state` JSONB column already supports arbitrary state

### Technical approach
The `game_state` JSON will be expanded to include:
```
{
  hostHp, guestHp, turn, wordIndex, phase,
  hostCorrect, guestCorrect, hostStreak, guestStreak,
  longestStreak, totalDamage, wordsRead, status,
  cooldowns: Record<string, number>,
  pendingAbility?: { id, name, damage, requiresReading, ... },
  pendingReadWord?: string,
  activeMiniGame?: string,
  lastEvent?: { type, damage, by, timestamp }
}
```

Each player pushes state changes only during their turn. The realtime subscription + polling ensures both devices stay in sync.

