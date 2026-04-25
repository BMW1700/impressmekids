I audited the live room data, the PvP battle component, the lobby handoff, the real-time setup, the room policies, and the sync function. The screenshots point to a specific failure mode: the parent/enemy page can locally advance to the next kid-reading turn, while the student/hero page is still stuck on the previous `parent_turn` state. That means the parent-side attack resolution is being applied optimistically on that device before the update is guaranteed to be persisted and received by the student device.

Plan to fix this properly:

1. Make parent/enemy attacks database-authoritative before the parent UI advances
   - Replace the current optimistic path for parent attack resolution with a critical commit path.
   - For these critical events, write the new state first, confirm the write returned the canonical room state, then update the local parent UI and broadcast it.
   - Apply this to:
     - parent direct attacks
     - parent reading-bonus attacks
     - parent mini-game completion
     - student miss/skip damage
     - student-to-parent turn switch
   - This prevents the parent page from showing “next words” unless the student page can also receive that same state.

2. Add a persistence fallback when the room sync RPC fails or times out
   - Keep the existing secure room sync function as the primary path.
   - If it fails, immediately use the existing participant-safe room update policy as a fallback update.
   - If both fail, keep the UI in the current phase and show a sync error instead of silently letting one page advance alone.

3. Add post-write verification for attack resolution
   - After every parent/enemy attack commit, re-read the room state and verify the database contains the expected revision, phase, HP, and last event.
   - If the database is still stale, retry the write once and broadcast again.
   - This directly targets the screenshot state where parent saw `kid_turn` but student remained stuck on `parent_turn`.

4. Force student/hero recovery on focus, visibility, and stale waiting state
   - Add immediate rehydration when the student tab/window becomes visible or focused.
   - Keep the aggressive waiting poll, but make it detect “stuck waiting for parent” by elapsed time, not only phase.
   - If the student is still on `parent_turn`, `parent_reading`, or `mini_game` after the parent action should have resolved, it will force a database re-read immediately.

5. Make parent attack animation and damage display deterministic on both screens
   - Trigger VFX from the canonical persisted `lastEvent`, not only from local optimistic state.
   - Ensure `abilityId`, `damage`, `target`, `timestamp`, and a unique event id are always written for parent/enemy attacks.
   - The student/hero screen will show the same attack animation and floating damage as the parent/enemy screen after the synced event lands.

6. Fix role-facing battle UI so both screens clearly show the same game state
   - Student side during parent turn: show “Parent choosing attack” only while the canonical state is actually `parent_turn`.
   - Parent side after attack: do not reveal the next reading batch until the canonical shared state is `kid_turn`.
   - Add a small synced status indicator in development logs so future stuck states show room id, rev, phase, turn, HP, and event timestamp.

7. Validate with the exact broken flow
   - Build/typecheck.
   - Test the sequence represented in the screenshots:

```text
Student reads 5 words
Parent turn begins
Parent selects attack
Attack damage persists
Both screens show the same animation
Student HP changes on both screens
Both screens enter kid_turn / next 5-word batch together
Student reader remounts and auto-starts
```

Files to change:
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`
- `src/components/aura/game/rpg/multiplayerRoomTypes.ts`
- Possibly `src/components/aura/game/rpg/RPGParentAttackVFX.tsx` for event-id-driven replay safety

Expected result:
- The parent/enemy page will no longer get ahead of the student/hero page.
- The student will see parent/enemy attack animations and damage.
- The next 5 words will appear on the student side immediately after the enemy attack resolves.
- If sync fails, the game will stop and report it instead of showing two different realities.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
  <lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>