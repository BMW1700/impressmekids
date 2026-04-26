Brutally honest audit result: I do not recommend another patch on the current online PvP sync code. The current design is fragile enough that fixing one symptom keeps exposing the same root problem again.

What I found:

1. Parent actions are saving to the database in recent rooms
   - The latest PvP room data shows parent/enemy attacks persisted with `lastEvent.by = guest`, damage, `phase = kid_turn`, and `turn = host`.
   - So the parent action is not purely failing to save. The bigger failure is that the student/host screen does not reliably receive, accept, or render the canonical saved state.

2. The current online PvP system has too many competing sources of truth
   - Local optimistic React state.
   - Broadcast full-state messages.
   - Database JSON blob writes.
   - Realtime database events.
   - 400ms/1500ms polling.
   - Revision guards trying to reconcile all of the above.

   That is exactly how you get split-brain: parent sees one reality, student sees another.

3. The current `RPGOnlinePvPBattle.tsx` is doing too much
   - It owns gameplay rules, local rendering, sync, persistence fallback, polling, broadcasts, revision conflict handling, VFX replay, and recovery.
   - That makes every fix risky because a sync change can break gameplay, and a gameplay change can break sync.

4. The current revision system is not safe enough
   - Both clients can increment and broadcast revisions.
   - Some progress is broadcast-only and not saved.
   - Parent can act from state that came from broadcast, then write a new blob.
   - Student can have a local revision that competes with a database revision.
   - The code now contains exceptions to accept lower/equal revisions, which is a sign the model is already broken.

5. The database table setup is better than before, but it is not the full solution
   - `multiplayer_rooms` now has full realtime identity and is in the realtime publication.
   - RLS allows participants to read/update the room.
   - But writing one large `game_state` JSON blob from both browsers is still the wrong architecture for a turn-based online battle.

My recommendation: rebuild online PvP as server-authoritative actions. Keep the visual battle UI and lobby, but replace the online PvP sync engine.

Implementation plan:

1. Stop using browser-to-browser state as truth
   - Remove full-state broadcast as a source of truth for online PvP.
   - Broadcast can remain only as a lightweight “something changed, pull latest state” poke.
   - The student and parent must both render only the canonical state returned from the backend/database.

2. Add a server-authoritative PvP action function
   - Create one backend function/RPC such as `submit_pvp_action`.
   - Inputs:
     - room id
     - expected revision
     - actor role: host/student or guest/parent
     - action type
     - action payload
   - Supported actions:
     - `student_word_result`
     - `parent_select_ability`
     - `parent_read_result`
     - `mini_game_complete`
     - optional `resync`
   - The function will lock the room row, validate whose turn it is, compute damage/phase/turn changes, increment the revision, save the new state, insert an event record, and return the canonical updated state.

3. Add an event log for deterministic animations
   - Add a `pvp_room_events` table.
   - Every resolved action writes an event with:
     - room id
     - revision
     - event type
     - actor
     - target
     - damage
     - ability id
     - message
     - created timestamp
   - Both screens replay animations from these saved events, not from local optimistic state.
   - This directly fixes “student should see the enemy attack animation and damage too.”

4. Rewrite the online PvP client around a small state machine
   - Replace most of `RPGOnlinePvPBattle.tsx` sync logic with a hook like `useOnlinePvpRoom`.
   - The hook handles:
     - initial room load
     - realtime event subscription
     - fallback polling
     - submitting actions
     - pending/error state
   - The component only renders:
     - HP bars
     - current phase
     - word reader
     - parent controls
     - animations/events
   - No client should manually calculate the next shared revision anymore.

5. Make every action wait for the canonical response
   - When the parent attacks, the parent UI should show “syncing attack...” until the backend returns the saved state.
   - Then both parent and student receive/render the same revision.
   - If save fails, neither side advances. No more parent page getting ahead while student is stuck.

6. Add hard role and phase validation
   - Student/host can only submit `student_word_result` during `kid_turn`.
   - Parent/guest can only submit `parent_select_ability` during `parent_turn`.
   - Parent/guest can only submit `parent_read_result` during `parent_reading`.
   - Mini-game completion only works during `mini_game`.
   - If a device is stale and sends the wrong `expected_rev`, the backend returns the current state instead of applying the stale action.

7. Keep the existing lobby, but tighten room creation/joining
   - Keep `RPGMultiplayerLobby` and room codes.
   - Keep student creates / parent joins.
   - On join, immediately load canonical state from the database.
   - Add a visible sync diagnostic in development/test mode showing:

```text
room id
role
connection status
revision
phase
turn
host HP
guest HP
last event
last database update time
```

8. Preserve current gameplay rules
   - Student miss/skip deals damage to student, matching single-player RPG mode.
   - Student reads 5 words, then parent turn starts.
   - Parent direct attacks resolve immediately back to student turn.
   - Parent reading-bonus attacks go through `parent_reading`, then resolve back to student turn.
   - Mini-games resolve back to student turn.
   - Both sides see the same HP, phase, turn, animation, and next word batch.

9. Clean out the fragile sync code
   - Remove or disable:
     - coalesced client-side writes
     - local revision generation
     - “accept lower revision” hacks
     - full-state broadcast trust
     - parent UI advancing before persistence is confirmed
   - Keep polling only as a fallback resync, not as normal gameplay logic.

10. Validate with the exact broken flow
   - Two authenticated sessions.
   - Student creates room.
   - Parent joins.
   - Student gets word wrong and skips: student takes damage on both screens.
   - Student completes 5-word batch.
   - Parent attacks once.
   - Student immediately sees:
     - attack animation
     - floating damage
     - HP decrease
     - phase change back to student turn
     - next word batch
   - Repeat with direct attack, reading-bonus attack, and mini-game.

Files likely to change:
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`
- `src/components/aura/game/rpg/multiplayerRoomTypes.ts`
- `src/components/aura/game/rpg/RPGMultiplayerLobby.tsx` only if room handoff needs tightening
- new hook/helper files for online PvP state management
- database migration for the PvP event log and action function

Bottom line: the current system is trying to synchronize two browsers by passing around mutable full-game snapshots. That is the wrong foundation for this feature. The fix is to make the backend the single referee: clients submit actions, backend validates and computes the next state, both clients render that same returned/saved state.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
  <lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>