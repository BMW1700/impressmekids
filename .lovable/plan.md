Brutally honest audit result: I found a concrete bug that explains the screenshot.

The online PvP battle is getting a valid room snapshot, but `RPGOnlinePvPBattle` rejects it because the incoming room state is `rev: 0` and matches the component’s local default `rev: 0` placeholder. The code treats that as an echo and returns before setting `ready = true`, so both sides can sit forever on `Loading battle...` even though the backend room is active.

Plan to fix multiplayer battles:

1. Fix the PvP loading deadlock
   - Update `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx` so initial snapshots and hydration polls are accepted when the battle is not ready yet.
   - Do not let the equal-revision “echo guard” reject a valid first room snapshot.
   - Ensure room metadata like player names, story passage, and world number is applied during initial hydration even when `rev` is unchanged.

2. Harden PvP state sync after loading
   - Keep the stale-revision protection, but make it distinguish between:
     - a harmless echo after the battle is already ready
     - a real initial hydration snapshot that must be accepted
     - a peer state update that should be accepted
   - Make `highestSeenRevRef` initialize correctly from snapshots so later local commits do not collide with peer revisions.
   - Add safer logging around rejected snapshots so future sync failures are diagnosable instead of silently hanging.

3. Fix Co-op parity issues while in the same multiplayer system
   - Pass the lobby’s initial room snapshot into `RPGOnlineCoopBattle` the same way PvP does, instead of forcing Co-op to depend only on a database rehydrate after mount.
   - Add a shared snapshot accept path for Co-op so host and guest enter the setup/battle screen deterministically.
   - Preserve selected story, world, and enemy metadata from the room snapshot.

4. Clean up lobby handoff reliability
   - In `RPGMultiplayerLobby.tsx`, return the full inserted room snapshot immediately after room creation instead of only selecting `id`.
   - Keep the host waiting screen, but make the transition to battle always carry a full valid snapshot once the guest joins.
   - Improve join/create errors so auth or room lookup failures show a useful message rather than dumping the player into a broken battle.

5. Verify the backend access path
   - Confirm the current `multiplayer_rooms` policies and `sync_multiplayer_room_state` function allow:
     - host creates room
     - guest finds waiting room by code
     - guest joins room
     - both participants read active room
     - both participants persist turn/phase changes
   - If the policies are contributing to sync failures, create a targeted migration to normalize the duplicate/overlapping policies without weakening room privacy.

6. Run validation
   - Run TypeScript/build checks.
   - Verify the state machine paths in code for:
     - host creates PvP room
     - guest joins PvP room
     - both devices leave `Loading battle...`
     - student reads a 5-word batch
     - turn switches to parent/guest
     - parent ability returns turn to student
     - Co-op host/guest setup loads
     - Co-op turn switch after 5 words

Primary files to change:
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx`
- `src/components/aura/game/rpg/RPGMultiplayerLobby.tsx`
- `src/components/aura/game/rpg/RPGBattleArena.tsx`
- Possibly one database migration only if the policy audit shows backend access is also blocking active-room sync.

Expected outcome:
- The current `Loading battle... / battle couldn't sync` failure should be fixed.
- Online PvP should reliably enter the battle screen on both student and parent/teacher devices.
- Turns should sync through the full 5-word student batch and parent attack cycle.
- Online Co-op should use the same hardened snapshot handoff pattern instead of depending on a fragile post-mount rehydrate.