
Do I know what the issue is? Yes.

What is actually broken:
1. The online PvP battle is not bootstrapping from the selected level as a single authoritative source. The battle mounts with fallback local props, so you see the correct shell/background area, but `ready` never flips because valid synced room state never gets confirmed.
2. The host path in `RPGOnlinePvPBattle.tsx` is too optimistic: it writes an initial state and immediately sets `ready=true` locally without confirming the room now contains a valid game state. If that write is rejected, delayed, or overwritten by `{}`, one side stays on the loading overlay forever.
3. The battle still does not fully model “normal level, except other player controls the enemy.” It hardcodes a 100 HP parent enemy and generic parent powers instead of deriving enemy HP/background/presentation from the selected level metadata.
4. The guest/hydration logic only checks `phase`; it does not validate a complete usable state shape tied to the chosen level/enemy, so partial/invalid room data can keep the overlay alive or produce mismatched battles.
5. Co-op likely has the same root architecture flaw: local fallback props and weak room hydration rather than a room-driven validated battle payload.

Files to update:
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx`
- `src/components/aura/game/rpg/RPGMultiplayerLobby.tsx`
- `src/components/aura/game/rpg/RPGBattleArena.tsx`
- likely `src/components/aura/game/rpg/RPGPvPBattle.tsx` as the parity reference

Implementation plan:
1. Rebuild online PvP bootstrap around a validated room payload
- Add a strict room hydration function that reads room metadata + `game_state`.
- Only mark `ready=true` after confirming the room contains a valid initialized PvP state.
- If host, initialize the room once, then re-fetch until the saved state is confirmed.
- If guest, poll until the same validated state appears.
- Replace infinite loading with a visible recovery error state after timeout.

2. Make the room fully authoritative for level parity
- Use `story_passage`, `story_title`, `world_number`, `grade_mode`, and `enemy_type` from the room for both players.
- Stop relying on local `story`/`worldNumber` props as battle authority after mount.
- Ensure the displayed story words, world background, and enemy identity always come from the selected room level.

3. Make online PvP mirror the normal level structure
- Use the normal selected level’s enemy config as the enemy baseline: HP, visuals, enemy type, and background.
- Keep the asymmetric PvP rule that the remote player controls enemy actions, but preserve the normal level feel and stats.
- Audit parent powers so they behave consistently with the selected level instead of a generic placeholder enemy.

4. Harden state shape and realtime sync
- Introduce explicit PvP room state validation so `{}` or malformed states are rejected and reinitialized.
- Add better guards around realtime updates/polling so stale or partial updates do not leave either player stuck.
- Ensure host and guest both converge on the same `wordIndex`, phase, turn, and level metadata.

5. Apply the same hydration fix to online co-op
- Make co-op load from validated room metadata/state.
- Keep the selected level’s normal background/enemy for co-op too.
- Preserve the new repeat/continuous modes while fixing any shared loading deadlocks.

6. Verify Victory Arena wiring after multiplayer is stable
- Re-check boss victory flow so the post-boss arena triggers from the normal battle completion path and remains replayable once unlocked.
- This is secondary to fixing the online battle blocker, but should be audited in the same pass because the completion flow is adjacent.

Technical details:
- The screenshot strongly suggests the PvP component mounted and rendered fallback HUD/background, but `!ready` stayed true. That means the bug is in room initialization/hydration, not in top-level routing.
- `RPGOnlinePvPBattle.tsx` currently renders the correct shell before synchronization completes; the fix is not just “show more UI,” it is to confirm the DB write/read cycle and validated state before entering play.
- The clean target architecture is:
```text
selected level
  -> lobby stores room metadata
  -> host initializes validated game_state from that level
  -> both clients hydrate from room row
  -> battle plays exactly like the normal level
     except the second player drives the enemy turn/actions
```
- Because I’m in read-only mode, I can’t patch the files now. After approval, I’ll implement the bootstrap rewrite directly in the battle/lobby components and make PvP behave like the normal selected level with multiplayer enemy control.
