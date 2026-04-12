
Goal: make the host/student leave the waiting screen immediately when the second player joins, so both devices enter the online match together.

What I found
- The room join is reaching the backend: the latest room (`T8ZUAJ`) is `active` and has both `host_id` and `guest_id`, so the parent join is being saved correctly.
- That means the bug is in the host-side transition logic, not the join itself.
- Right now the student only exits the lobby if the lobby component catches a realtime `UPDATE` event or the 3-second poll sees it while that component is still mounted.
- This is fragile because the host transition depends entirely on one component-local listener and timing. If that listener misses the update or the component lifecycle/state gets out of sync, the student stays stranded in the waiting UI.

Likely root cause
- `RPGMultiplayerLobby.tsx` is acting as the only source of truth for “room is ready”.
- `RPGBattleArena.tsx` only proceeds when `onRoomReady(...)` fires from that lobby.
- Since the room row is definitely becoming `active`, the safer design is to make the parent route watch the room readiness too, not just the lobby view.

Plan
1. Harden the lobby ready detection
- Update `RPGMultiplayerLobby.tsx` so the host checks room readiness immediately after subscribing, not only on future updates.
- Add a guarded `transitionToRoom()` helper so `onRoomReady` can only fire once.
- Poll more defensively and include error handling/logging around the readiness fetch.

2. Move room readiness to a more reliable parent-level source
- In `RPGBattleArena.tsx`, add a small room-status watcher for the online flow once a room has been created/selected.
- If the room becomes `active` with both players present, force `showLobby` off and enter the online battle even if the lobby listener missed the event.
- This makes the battle arena, not the transient lobby component, the final authority for progressing into the match.

3. Tighten the ready condition
- Use explicit checks for:
  - `status = 'active'`
  - `guest_id IS NOT NULL`
  - `host_id IS NOT NULL`
- Pass the room code through state consistently so the host path and guest path both resolve the same room cleanly.

4. Verify the online battle mount path
- Confirm `RPGOnlinePvPBattle.tsx` and `RPGOnlineCoopBattle.tsx` can safely mount as soon as the room is active and don’t depend on extra lobby-only state.
- If needed, make their initial load tolerate a just-activated room without showing a stuck “Waiting for game...” state.

5. End-to-end validation after implementation
- Test host + guest in two sessions:
  - student creates room
  - parent joins by code
  - both screens leave lobby immediately
  - both arrive in the same match
- Repeat for both PvP and Co-op since they share the room infrastructure.

Files to update
- `src/components/aura/game/rpg/RPGMultiplayerLobby.tsx`
- `src/components/aura/game/rpg/RPGBattleArena.tsx`
- Possibly small defensive tweaks in:
  - `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`
  - `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx`

Technical note
- The database row is already correct, so I do not currently see this as a backend policy problem.
- I do not expect a schema change to be required for this fix.
- This looks like a frontend state-sync / listener-reliability issue, and the best fix is to stop relying on a single lobby-local callback as the only transition trigger.
