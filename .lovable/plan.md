
What I found after auditing the PvP flow repeatedly

This is not primarily a “loading” bug anymore. The battle is mounting. The real problem now is PvP state desync plus incomplete turn rendering.

Highest-probability causes I found
1. `RPGOnlinePvPBattle.tsx` stops reconciling after the initial hydrate. After mount it depends almost entirely on realtime updates. If either client misses one update, both screens drift permanently.
2. The UI keeps a separate `message` state outside the authoritative room state. That lets the banner say one thing while the actual synced turn state says another, which matches your screenshots.
3. Turn control is wrong for your rule. The code switches turns with `hostCorrect % 5 === 0`, which means “5 correct words,” not “the 5 words currently on screen.” So turns can overrun, stall, or feel inconsistent.
4. The parent cannot see the student’s active reading batch because only the host renders `RPGWordReader`. There is no mirrored read-only batch on the parent side.
5. Online PvP is still not rendering a fully synchronized battlefield presentation. `RPGBattleBackground` can differ per device because it uses local device preferences, so two users can see different backgrounds for the same room.
6. Incoming room snapshots are applied without freshness protection. An older snapshot can overwrite a newer one on one client, causing HP/turn mismatch.

What I will change
1. Make the room state the single source of truth for PvP
- Keep a lightweight reconciliation poll running for the whole match, not just initial load.
- Apply realtime updates and poll updates through one shared “accept snapshot” function.
- Reject stale snapshots using an explicit monotonic field in PvP state (for example `revision` or `stateVersion` inside `game_state`).

2. Fix turn logic to be true 5-word turns
- Replace the current `hostCorrect % 5` turn switch.
- Add explicit per-turn batch state to PvP, e.g.
```text
wordIndex        = start of current batch in story
turnWordsRead    = how many of the 5 visible words are finished
activeWordOffset = which visible word is currently active
```
- End the student turn when that 5-word batch is completed, not when 5 correct answers happen.

3. Mirror the student’s reading UI to the parent
- Keep the host’s `RPGWordReader` interactive.
- Add a read-only mirrored batch panel for the guest that shows:
  - the same 5 words
  - the currently active word
  - progress through the batch
- Push batch progress to room state so both devices advance simultaneously.

4. Remove contradictory UI state
- Stop treating the message banner as an independent source of truth.
- Derive turn/waiting text from synced PvP state, with only short-lived event text layered on top.
- This will prevent cases where the banner says “Student turn” while the bottom says “Waiting for opponent.”

5. Lock online PvP visuals to one synchronized battlefield
- Use room/world/enemy metadata only.
- Pass authoritative enemy/background inputs into the battle background.
- Disable per-device visual preference differences for online PvP so both players see the same battlefield.

6. Harden write/apply flow
- Route all PvP mutations through one commit helper:
  - build next state
  - increment revision
  - write to backend
  - if write fails, immediately re-hydrate
- Add guards so only the host can progress reading state during student turn and only the guest can act during parent turn.

Files to update
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`
- `src/components/aura/game/rpg/RPGWordReader.tsx`
- `src/components/aura/game/rpg/RPGBattleBackground.tsx`
- `src/components/aura/game/rpg/RPGBattleArena.tsx`
- `src/components/aura/game/rpg/multiplayerRoomTypes.ts`
- possibly `src/components/aura/game/rpg/RPGMultiplayerLobby.tsx` if I need to seed the expanded PvP room state shape cleanly

Technical notes
- The screenshot mismatch is consistent with stale/missed room updates plus stale local banner state.
- The “5 words on screen” rule is not implemented today in online PvP.
- The parent visibility requirement also is not implemented today; it needs explicit spectator rendering, not just syncing HP.

Validation after implementation
- Host and guest enter the battle together
- Both screens show the same HP, same turn, same batch progress, same background
- Student always gets exactly one 5-word batch per turn
- Parent sees those same 5 words and the active word in real time during the student turn
- After every host read, both screens update immediately and stay in sync
- No screen gets stuck on “Waiting for opponent” while its own turn is active
