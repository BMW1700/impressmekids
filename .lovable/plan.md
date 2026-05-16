# Castle Swarm Defense — Phase 3

Goal: make the mode shippable-perfect. Close the three Phase 2 gaps, add the parent-as-enemy co-op (the viral hook), and polish. No other modes will be touched.

## Part A — Close Phase 2 gaps (must-do)

1. **Upgrades actually cost gold.**
   - Add RPC `purchase_castle_upgrade(user_id, grade_mode, upgrade_key, cost)` that atomically (a) checks coin balance, (b) debits coins, (c) upserts upgrade level. Returns new balance or raises.
   - `useCastleUpgrades.purchase()` calls the RPC; rolls back UI on failure; toasts new balance.

2. **Campaign progress fully wired.**
   - `CastleCampaignSelect` passes `levelId` via route state to `/game/castle-swarm`.
   - `CastleSwarmArena` reads `levelId`; if present, loads wave plan from `campaignLevels.ts` (instead of endless) and reads star thresholds.
   - On win/loss, calls `useCastleCampaign.recordResult({ levelId, stars, bestWave, bestScore })` which upserts into `castle_swarm_campaign_progress` (max of existing vs new).
   - Locked levels stay locked until previous earns ≥1 star.

3. **Knight upgrades take effect in the loop.**
   - Arena reads `{ knightHpLevel, knightDamageLevel, summonCapLevel }` from `useCastleUpgrades` once at mount.
   - Replace hardcoded `KNIGHT_HP`, `KNIGHT_DAMAGE`, `MAX_KNIGHTS` constants with `base + level * step` derived values stored in refs.

## Part B — Parent-as-Enemy Co-op ("Castle Siege 2P"), hybrid spawn model

4. **New mode card** on `GameDashboard` → `/game/castle-siege` (gated behind existing `Brecon50` early-access code, same as LexiQuest multiplayer).

5. **Room lifecycle**
   - Host (child) creates room → 6-char code.
   - Guest (parent) joins via code → role auto-assigned (host = defender, guest = attacker).
   - Realtime via Supabase channel `castle-siege:{room_code}`; state sync via monotonic revision (reuse LexiQuest multiplayer sync pattern from memory).

6. **Defender (child) screen**
   - Same arena as single-player but waves are driven by parent spawns instead of `WaveDirector`.
   - All literacy mechanics identical (read word/passage to repel, super meter, combo, knights).

7. **Attacker (parent) screen — hybrid spawn model**
   - Goblin: 3s cooldown, free.
   - Skeleton: 5s cooldown, free.
   - Bat: 8s cooldown, free.
   - Orc Brute: costs 30 mana.
   - Shaman: costs 45 mana.
   - Mini-boss: costs 80 mana, unlocks after 60s.
   - Mana bar fills 1/sec, cap 100.
   - "Boss Charge" meter fills as child reads accurately (positive-sum: child success rewards parent fun).

8. **Win/loss**
   - Defender wins when 5min timer ends or parent abandons.
   - Attacker wins when castle HP hits 0.
   - Both see a shared `WaveSurvivedCard` summary; either can request rematch.

## Part C — Polish

9. Mount the already-created `WaveInterstitial` between waves in single-player.
10. Pause button + small settings sheet (mic sensitivity, SFX volume, reduce-motion) inside arena.
11. Every 5th wave shows the existing `EnemyCastle` asset as a mini-boss with 3× HP.
12. Boss waves play a stinger; non-bosses do not (avoids audio fatigue).

## Database changes (one migration)

- RPC `purchase_castle_upgrade(...)` (SECURITY DEFINER, validates auth.uid()).
- Table `castle_siege_rooms`: `room_code` (PK, 6 chars), `host_id`, `guest_id` nullable, `state` jsonb, `revision` int, `status` text ('waiting'|'active'|'ended'), `created_at`, `updated_at`. RLS: select/update only if `auth.uid() in (host_id, guest_id)`; insert only if `host_id = auth.uid()`; an `INSERT` policy for guests joining (update guest_id to self when null).
- Enable realtime on `castle_siege_rooms`.

## Files

**New:**
- `src/components/aura/game/castle/SiegeAttackerPanel.tsx` (parent controls)
- `src/components/aura/game/castle/SiegeDefenderArena.tsx` (thin wrapper around arena, swaps wave source)
- `src/components/aura/game/castle/SiegeLobby.tsx` (create/join code UI)
- `src/components/aura/game/castle/PauseSettingsSheet.tsx`
- `src/hooks/useSiegeRoom.ts` (channel + revision sync)
- `src/pages/game/CastleSiege.tsx`

**Modified:**
- `src/hooks/useCastleUpgrades.ts` (RPC purchase + balance debit)
- `src/hooks/useCastleCampaign.ts` (recordResult on win)
- `src/components/aura/game/castle/CastleSwarmArena.tsx` (apply upgrades, campaign mode, mount interstitial, pause, boss waves, optional external wave source)
- `src/components/aura/game/castle/CastleCampaignSelect.tsx` (pass levelId via route state, lock logic)
- `src/pages/game/CastleSwarmDefense.tsx` (read levelId)
- `src/pages/game/GameDashboard.tsx` (new Castle Siege card)
- `src/App.tsx` (new route)
- `src/lib/speechRecognitionManager.ts` (add `'castle_siege'` owner)

**Migration:** one new file with RPC + `castle_siege_rooms` table + RLS + realtime publication.

## Verification before declaring done

- Single-player: buy an upgrade → coins decrease in DB → reload arena → knight HP/damage actually higher.
- Campaign: complete level 1 → row appears in `castle_swarm_campaign_progress` with correct stars → level 2 unlocks.
- Co-op: open two tabs → host creates room, guest joins → spawns from parent appear on child's screen within 200ms → cooldowns/mana enforced server-trustable via revision conflict rejection.
- No regressions in LexiQuest, AURA reader, or any other minigame (verified by build + spot-check of `speechRecognitionManager` owner union only being additive).

## Out of scope (deferred)

- Matchmaking with strangers (only code-based join for now — safer for K-5).
- Spectator mode.
- Replay export.
