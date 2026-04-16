
Brutal honesty: the bug is still in the sync architecture, not in the room wiring. I audited the current PvP code and your screenshots match a state-handoff failure, not a visual bug.

What is actually wrong now:
1. `RPGOnlinePvPBattle.tsx` still makes the most important turn switches depend on a fragile combo:
   - fire-and-forget broadcast via `broadcastChannelRef.current.send(...)`
   - queued raw DB writes via `.from('multiplayer_rooms').update(...)`
2. The project already has an authoritative backend function `sync_multiplayer_room_state(...)`, but PvP/Co-op are not using it for battle-state persistence.
3. Critical phase writes are still serialized behind `writeQueueRef`. If one room-state write stalls, later turn-return writes wait behind it. That is how you get “nothing happens”, then minutes later the next screen finally appears.
4. Broadcast delivery is not verified. If a turn-switch broadcast is missed once, the other device falls back to polling the DB. If the DB write is slow or blocked, that device stays stuck on the old phase.
5. The current fix unified incoming state application, which was necessary, but it did not fully harden the outgoing turn-switch path. That is why the exact same class of delay has moved from one transition to another.

Why this matches your newest report:
- Student finishes 5 words -> parent powers should appear instantly.
- Parent/enemy makes move -> student should instantly return to `kid_turn`.
- Instead, one device sits on the prior phase until the DB eventually catches up.
That is exactly what happens when turn transitions are “best effort” instead of authoritative.

Implementation plan:
1. Make turn/phase persistence authoritative
   - Replace raw `.update(...)` in both online battle components with `sync_multiplayer_room_state(...)`.
   - Validate the returned `game_state`, `status`, and `updated_at`.
   - Treat “no returned row / wrong rev” as a real failure, not a soft success.

2. Replace the strict serial write queue with latest-state coalescing
   - Keep intermediate word progress broadcast-only.
   - For critical turn switches, persist only the newest unsaved state instead of letting older stalled writes block newer revs.
   - This prevents one stuck request from making later rounds wait minutes.

3. Harden broadcast delivery for turn switches
   - Await/inspect broadcast send results for critical handoffs.
   - If a turn-switch broadcast fails, immediately trigger authoritative rehydrate logic instead of silently hoping polling fixes it.
   - Add explicit logging for `source`, `roomId`, `rev`, `phase`, `turn`, send result, and persist result.

4. Add explicit handoff recovery on both devices
   - When incoming state changes to `parent_turn`, force the parent controls view to unlock immediately.
   - When incoming state changes back to `kid_turn`, force the student reader view to reset/remount immediately.
   - Strengthen the reader reset key if needed so turn-return always produces a clean playable reader.

5. Apply the same repair pattern to Co-op
   - Co-op uses the same raw update + queue pattern.
   - I’ll patch it for parity so this exact failure does not survive there.

Files to change:
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx` — main fix
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx` — parity fix
- `src/components/aura/game/rpg/multiplayerRoomTypes.ts` — only if a stronger handoff/reset token is needed

Technical details:
- The backend sync function already exists in `supabase/migrations/20260413203253_f175b4ef-ae7c-41f2-ad9f-27553248f51d.sql`.
- The current weak point is still `pushState()` in PvP/Co-op using raw table updates.
- The current queue model (`writeQueueRef`) is too fragile for critical phase transitions.
- The current broadcast path is optimistic but not verified.

QA I will use after the fix:
1. Student reads first 5 words -> parent powers visible in under 1 second
2. Parent uses instant attack -> student returns to playable reader in under 1 second
3. Parent uses reading-required attack -> student returns in under 1 second
4. Parent uses mini-game -> student returns in under 1 second
5. Repeat across multiple rounds to confirm the delay does not “move” to round 2 or 3

Expected result:
- No more multi-minute dead zones between rounds
- Parent and student both switch turns immediately
- If broadcast misses, authoritative persistence still restores the other device quickly
- If persistence fails, logs will show exactly where it failed instead of hiding it
