# RPG Mode: Make It Actually Addictive

Scrap the PDF work. Focus on the one thing that closes pilots long-term: kids begging to play again. RPG mode has the bones (60+ battle components, hero system, bosses, PvP/co-op, village unlocks) but no *hook loop* — no reason to log in tomorrow, no reason to grind, no reason to brag.

This plan installs the four hooks kids' games use — meta-progression, boss spectacle, daily streaks, social — as **additive systems layered on top of existing battles**. Zero changes to AURA, Pre-K pipeline, Challenge Meter, or canon Benny videos.

---

## Session 1 — Loot & Gear (the "one more run" hook)

**What it does:** Every boss defeat drops gear (weapon, armor, trinket) with rarity tiers (Common → Legendary). Gear gives stat bonuses (HP, attack, MP regen) *and* changes hero visuals via CSS filters/overlays. Kids grind bosses to complete sets.

- New table `player_loot` (item_id, rarity, stats, equipped, dropped_from_boss).
- Loot drop roll on `RPGVictoryArena` — animated chest opening with rarity flash.
- Equip screen on `RPGCharacterSelect` — drag gear onto hero slots.
- 40 items across 4 rarities, themed by world (Forest set, Cyber set, etc.).
- Hooks into existing `player_inventory` — no schema conflict.

**Why it's addictive:** Variable-ratio drops (the slot-machine effect). Legendary drops trigger screen flash + sound. Kids will replay beaten bosses just for the roll.

## Session 2 — Boss Spectacle Overhaul

**What it does:** Turn bosses from HP-bars into events. Each boss gets: cinematic entrance, unique arena background, phase transitions (75%/50%/25% HP), and one signature mechanic already visible in code (RPGFireballBarrage, RPGLightningStorm, RPGCrystalPrison, RPGGhostlyWhispers). Right now those mechanics exist but fire generically — this wires each boss to its own signature.

- Extend `rpgBattleData.ts` boss definitions with `entranceAnimation`, `arenaTheme`, `phases[]`, `signatureMechanic`.
- New `RPGBossIntro` cutscene component (5s cinematic before fight).
- Wire phase transitions in `RPGCombatPhase` — enemy taunts + visual escalation at HP thresholds.
- Each of the 14 K-5 bosses + 14 Agent Mode bosses gets a signature look (no new bosses, just distinct presentation).

**Why it's addictive:** Bosses become memorable. Kids talk about "the ghost boss" or "the lightning king" the way they talk about Pokémon.

## Session 3 — Daily Streak & Season Pass

**What it does:** Login streak already exists in `daily_login_rewards` but has no meta-goal. Add a rotating 4-week "Season" with a free reward track — daily quests fill a bar, hitting tiers unlocks cosmetics (hero skins, village decorations, loot chests).

- New table `rpg_seasons` (name, start_at, end_at, reward_tiers jsonb).
- New table `player_season_progress` (user_id, season_id, xp, claimed_tiers).
- 3 daily quests refresh at midnight ("Beat 2 bosses", "Read 20 words correctly", "Win 1 co-op battle").
- Season pass UI: horizontal reward track with claimable tiers, ticks toward completion.
- First season = "Ember Forest" — 20 tiers, all cosmetic (no pay-to-win).

**Why it's addictive:** Streaks + a rotating deadline = FOMO. Free-only for pilots; premium track is scaffolded for post-pilot Crowns.

## Session 4 — Friends, Ranks & Bragging Rights

**What it does:** Multiplayer exists but is anonymous. Add: friend codes, a global weekly ladder (WCPM + wins), and post-match "highlight cards" kids can screenshot.

- New table `player_friends` (user_a, user_b, status).
- Friend code = 6-char shareable code on `RPGCharacterSelect`.
- Weekly leaderboard on `RPGConnectionChooser` — top 20 by combined "Battle Rating" (wins × accuracy).
- Post-battle "Highlight Card" component — hero pose + stats + rating change, one-click PNG download.
- Guild scaffolding (classroom = auto-guild) so teacher's class shows on a shared ladder.

**Why it's addictive:** Kids drag friends in for friend codes. Class ladders create classroom-wide peer pressure to log in.

## Guardrails (non-negotiable)

- **Nothing touches** AURA runtime, Pre-K audio/video pipeline, Challenge Meter core, canon Benny videos, or the redub/music workflow.
- **All-new tables**, no schema edits to existing RPG tables. RLS on every new table.
- **All new UI is additive** — new routes/panels, no removals from existing screens.
- **Feature flag** `rpg_v2_hooks_enabled` on `school_settings` — dark-launched per pilot classroom so we can A/B early impact.
- **Zero paywalls in the pilot window.** Crowns/premium tiers stay scaffolded but locked.

## Technical Details

- New tables: `player_loot`, `rpg_seasons`, `player_season_progress`, `player_friends`. All follow the standard `GRANT SELECT/INSERT/UPDATE/DELETE ON … TO authenticated; GRANT ALL … TO service_role;` + RLS scoped to `auth.uid()` pattern.
- Loot rolls happen client-side against a seeded RNG then verified server-side via new `roll_boss_loot(boss_id)` RPC (prevents cheating).
- Season progress increments via existing `awardVillageProgress` extension — one write path, no double-counting.
- Highlight Cards use existing html-to-canvas pattern from certificate PDF for PNG export.
- All new components live under `src/components/aura/game/rpg/v2/` so v1 stays untouched.

## Ship Order

Session 1 (Loot) is the biggest addiction lever — ship first. Sessions 2-4 layer in over 3-4 weeks. Every session ends with a working, demoable slice.

## Explicitly Cut

Pacing calendars, PDF handouts, i18n, placement quiz, additional demo routes, new bosses, and rip-and-replace of existing battle mechanics. Not this plan.

**Approve and I ship Session 1 immediately.**