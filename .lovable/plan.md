<final-text>Brutal honesty: yes, the parent and student are in the same room. The wiring proves that. Both devices use the same `roomId` from `RPGMultiplayerLobby` through `RPGBattleArena`, and both subscribe to the same room record plus the same `pvp-broadcast-${roomId}` channel. So this is not a “wrong room” bug anymore. It is a broken parent-to-student turn-return sync path.

What my audit of the current code says:
1. `RPGOnlinePvPBattle.tsx` still has two different state-apply paths:
   - `acceptSnapshot(...)` for DB poll / realtime
   - a separate inline broadcast handler that directly calls `setGs(incoming)`
   Those two paths do not use exactly the same guard logic.
2. Parent turn completion (`handleParentAbility`, `handleParentReadResult`, `handleMiniGameComplete`) still depends on a fragile combo of:
   - optimistic broadcast
   - queued DB write
   If either side misses the broadcast or the DB write does not land reliably, the student stays stuck on the old parent-phase screen.
3. The DB write path is still using raw `.update(...)` instead of the backend `sync_multiplayer_room_state(...)` function that already exists specifically to make room-state writes authoritative.
4. The student UI is entirely conditional on `gs.phase`, so if the student does not receive/apply the parent’s turn-end snapshot, the waiting screen never goes away. That matches your exact report from the previous prompt.

Implementation plan:
1. Unify all incoming sync into one authoritative function
   - Refactor broadcast, realtime, and poll so they all go through a single `applyIncomingState(source, state)` path.
   - Remove the special inline broadcast branch that bypasses `acceptSnapshot`.
   - Use one universal rev guard for every source, on both devices.

2. Make turn-ending writes authoritative
   - Replace raw `.from('multiplayer_rooms').update(...)` in PvP with the existing backend room-sync function.
   - Verify the returned state and timestamp so parent turn-end writes cannot “look successful” while the student never gets durable state.

3. Harden the exact broken transition: parent -> student
   - Add explicit handling for incoming `{ phase: 'kid_turn', turn: 'host' }`.
   - Force-clear any parent-only transient UI state on the student side.
   - Force the student reader to remount on turn return using a stronger key than just `wordIndex` if needed.

4. Add targeted sync instrumentation
   - Log source, roomId, rev, phase, turn, and whether the snapshot was accepted/rejected.
   - Log specifically when parent actions end and when the student receives or rejects that turn-return update.
   - This will let me audit the most recent PvP sessions honestly instead of guessing.

5. QA the exact failure path you described
   - Student takes turn -> parent updates
   - Parent takes turn with:
     - instant attack
     - reading-required attack
     - mini-game
   - Confirm that each path returns the student device immediately to playable `kid_turn`.

Files to change:
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx` — main fix
- `src/components/aura/game/rpg/RPGBattleArena.tsx` — only if stronger handoff/reset logic is needed
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx` — parity pass after PvP is stable

Technical details:
- The most suspicious code right now is the split between:
  - `acceptSnapshot(...)`
  - broadcast handler lines around the current direct `setGs(incoming)`
- The most suspicious persistence issue is that the code is not using the backend sync function that already exists for multiplayer room state.
- The most suspicious UI recovery issue is that the student reader remount key is only `gs.wordIndex`; if the state returns to `kid_turn` without the expected remount behavior, I will strengthen that key during the fix.

Expected result after this pass:
- Parent-to-student updates become as reliable as student-to-parent.
- When the parent finishes their turn, the student device immediately switches back to the student’s playable turn instead of staying stuck on the parent screen.
- We will know from logs whether any remaining failure is transport, persistence, or render-state related.</final-text>