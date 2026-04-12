
Do I know what the issue is? Yes.

What is actually broken:
1. Online PvP/Co-op are still not using the room as the single source of truth. They rely on local `story` / `worldNumber` props, so the guest can load the wrong level data instead of the host’s selected level.
2. The lobby seeds a fake `game_state` shape that does not match either online battle component. That makes the bootstrap fragile.
3. `RPGOnlinePvPBattle` can stay in infinite loading because readiness is optimistic and silent failures are ignored. It needs a confirmed room-hydration path, not “set ready and hope”.
4. `RPGOnlineCoopBattle` repeat mode is fundamentally broken because `RPGWordReader` only resets when its `words` key changes. Repeating the same 5 words keeps the same key, so the reader does not restart cleanly for the second player.
5. Online Co-op is not the same level as local play right now because it hardcodes a generic enemy instead of the selected level’s enemy.
6. Victory Arena currently exists only as a transient reward screen. It is not persisted as an unlocked replayable level.

Implementation plan

1. Make the room authoritative for online matches
- Update `RPGMultiplayerLobby.tsx` to create rooms with clean metadata only, not a fake starter `game_state`.
- Persist the host-selected level data in the room and hydrate both clients from the room row.
- Add missing room metadata for parity, especially `enemy_type` for online co-op.

2. Harden online battle bootstrapping so “Loading battle…” cannot hang forever
- Rewrite the init path in `RPGOnlinePvPBattle.tsx` and `RPGOnlineCoopBattle.tsx` to:
  - fetch room metadata first
  - confirm a valid synced battle state exists
  - if host, write initial state and re-fetch until confirmed
  - if guest, poll until valid state appears
  - surface an explicit recovery/error state instead of infinite loading
- Only show the battle UI after a valid synchronized state is confirmed.

3. Make online PvP match the selected level perfectly
- Stop using local `story`/`worldNumber` as battle authority; use the room’s `story_passage`, `story_title`, and `world_number`.
- Keep the existing parent abilities / reading / mini-game flow, but drive it from confirmed synced state.
- Ensure the student always sees the story words from the selected level and the correct world background.

4. Fix co-op progression and both turn modes properly
- In `RPGOnlineCoopBattle.tsx`, add a reader reset key/session token based on turn + batch + repeat phase so the same 5-word batch can be repeated cleanly.
- Continuous mode: Player 1 reads words 1–5, Player 2 reads 6–10, etc.
- Repeat mode: Player 1 reads 1–5, Player 2 repeats 1–5, then move to 6–10.
- Use the room metadata enemy instead of the current hardcoded guard so online co-op matches the chosen level.

5. Persist Victory Arena as a real unlock, not a one-off overlay
- Add persistent progress fields in campaign progress for unlocked/completed Victory Arenas by world.
- On boss/final-boss victory, launch Victory Arena immediately as the second fight.
- After first unlock, show a replayable Victory Arena entry in level select for that world.
- Winning/losing/skipping the arena should return cleanly and preserve rewards/unlock state.

Files to update
- `src/components/aura/game/rpg/RPGMultiplayerLobby.tsx`
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx`
- `src/components/aura/game/rpg/RPGBattleArena.tsx`
- `src/components/aura/game/rpg/RPGLevelSelect.tsx`
- `src/hooks/useCampaignProgress.ts`
- `src/components/student/sections/AuraReadingSection.tsx`
- `src/pages/student/AuraPractice.tsx`

Backend work required
- Migration: add `enemy_type` to `multiplayer_rooms`
- Migration: add persistent Victory Arena unlock/completion fields to `campaign_progress`

Validation after implementation
- Student creates PvP room, parent joins by code, both enter battle immediately
- Parent joins from a different device/session and still gets the host’s exact level/story/world
- PvP shows real story words and synced parent powers/minigames
- Co-op continuous and repeat both advance correctly across multiple 5-word batches
- Boss victory launches Victory Arena immediately, and afterward the arena appears as a replayable level for that world
