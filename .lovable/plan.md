# RPG Mode Final Close-Out — Phase 4 + Gap Fixes

Three-part plan to make RPG mode genuinely complete before we pivot to App Store porting.

## Part 1 — Fix the gaps in Phases 1-3

### 1a. Wire loot stats into real combat
Currently `RPGCombatPhase.tsx` uses hardcoded `heroKnight.attack` and `playerMaxHp` — equipped gear does nothing to actual gameplay.

- Create `src/hooks/useEquippedStats.ts` — reads `player_loot` rows where `equipped = true`, sums `hp`, `attack`, `mp_regen` bonuses.
- Update `RPGCombatPhase.tsx` to accept a `bonusStats` prop; apply `bonusStats.attack` to damage calc and `bonusStats.hp` to `playerMaxHp`.
- Update `RPGWorldMap.tsx` (or whichever parent mounts combat) to pass equipped stats down.
- Show a small "+X ATK / +Y HP from gear" badge in the combat header so players see gear matters.

### 1b. Verify Season Pass rewards actually unlock something visible
- Audit `rpgSeasonPass.ts` tier rewards — confirm each claimed tier grants a real cosmetic (title, frame, skin flag) that displays somewhere (character select, victory arena, or profile).
- If any tier reward is orphaned, wire it to a visible surface.

### 1c. Live multiplayer smoke test
- Playwright script: launch 2 browser contexts, sign in as 2 test users, create room, join, play through 1 full PvP match with loot equipped and boss spectacle triggering.
- Capture screenshots at: room join, first attack, spectacle entrance, victory.
- Report any regressions and fix before shipping Phase 4.

## Part 2 — Phase 4: Social & Ranks

### 2a. Database
New migration:
- `rpg_player_ranks` table: `user_id`, `season_id`, `rank_points`, `tier` (Bronze/Silver/Gold/Platinum/Diamond/Master), `wins`, `losses`, `updated_at`.
- `rpg_highlight_cards` table: `user_id`, `enemy_id`, `damage_dealt`, `turns_taken`, `perfect_blocks`, `created_at`, `shareable_slug`.
- RPC `rpg_award_rank_points(_delta int, _win bool)` — updates points + recomputes tier server-side.
- RPC `rpg_generate_highlight(_enemy_id text, _stats jsonb)` — writes a highlight row after boss defeats.
- GRANT SELECT/INSERT/UPDATE to `authenticated`, ALL to `service_role`, RLS scoped to `auth.uid()`.

### 2b. UI
- `RPGLeaderboardPanel.tsx` — top 100 by rank points this season, current user's row pinned, tier badges with icons.
- `RPGHighlightCard.tsx` — post-boss "Battle Highlight" card (enemy, damage dealt, turns, perfect blocks), with a "Copy Link" button using the shareable slug.
- `RPGRankBadge.tsx` — small tier badge shown in character select and victory arena.
- Add a "Ranks" tab to the Daily & Season hub next to Quests and Season Pass.

### 2c. Wiring
- Fire `rpg_award_rank_points` from `RPGVictoryArena.tsx` on PvP wins (+25 win / -10 loss, tunable).
- Fire `rpg_generate_highlight` on any boss defeat in `RPGCombatPhase.tsx`.
- Show highlight card modal 2 seconds after victory overlay in single-player boss fights.

## Part 3 — Verify & greenlight App Store

- Run `tsgo` to confirm typecheck is clean.
- Playwright end-to-end: character select → equip loot → boss fight → victory → highlight card → check leaderboard → claim season tier.
- Report status. If green, we pivot to Capacitor iOS port planning in the next turn.

## Technical notes

- All new tables follow the public-schema GRANT + RLS pattern (auth-only, `auth.uid()` scoped).
- Loot stat application is client-side computed but server-validated on future PvP damage RPCs (out of scope for this session — noted for App Store hardening pass).
- Leaderboard query uses index on `(season_id, rank_points DESC)` for fast top-100 fetches.
- No changes to multiplayer sync engine (`multiplayerRoomTypes.ts`) — Phase 4 rides on top of existing `OnlinePvPGameState`.
- Highlight cards are single-image React components; sharing is link-only (no server-side image generation) to keep costs at $0.
