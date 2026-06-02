# Castle Swarm — Brutally Honest Audit + Revamp Plan

I read the whole subsystem end-to-end: `CastleSwarmArena.tsx` (1006 lines), `WaveDirector.ts`, `wordEconomy.ts`, `BossSpellBreak.tsx`, `campaignLevels.ts`, `CastleCampaignSelect.tsx`, `WaveInterstitial.tsx`, `WaveSurvivedCard.tsx`, `CastleUpgradesPanel.tsx`, `enemyTypes.ts`, `phonemeMatcher.ts`, and how it pulls from `curatedStories.ts`. Findings below are not opinions, they are what the code is actually doing today.

## What's actually broken

### 1. There are NO stories in the gameplay. At all.
`CastleSwarmArena.tsx` lines 83–93 take the first 24 curated stories, join their `passage_text` with spaces, split on whitespace, **dedupe with `Array.from(new Set(...))`**, strip punctuation, and serve a flat alphabet soup of unique words in batches of 6, cycling forever. Sentence order, punctuation, narrative, repetition — all destroyed. The player never reads a story. They read random nouns from 24 stories smashed together.

### 2. The "stories" the user sees are fake flavor blurbs, not the story bank.
What looks like stories in the UI is the `intro`/`outro`/`subtitle` text in `CASTLE_ARCS` (campaignLevels.ts lines 33–74). Those are short marketing-style blurbs invented for the game ("Smoke rises from the eastern hills…") and have **no connection to the 113 curated stories already authored**. So the user's "shit, misspelled, inaccurate, terrible" critique is partially true — these blurbs are detached from canon and from the actual reading content the kid will encounter.

### 3. Boss waves throw away the entire campaign roster.
`CastleSwarmArena.tsx` line 247: on a boss wave it ignores `lvl.composition` and uses `planWave(n).composition`. `WaveDirector.ts` lines 68–82 hard-codes that to just `["orc"]` or `["armored_orc"]`. So:
- "The Goblin King's Last Stand" boss wave spawns... one armored orc. No king.
- "Captain Vex" spawns one armored orc. No pirate.
- "The Lich Lord" spawns one armored orc. The lich never appears.
- "Three liches, three legions" spawns one armored orc.
Every named boss in 14 arc finales is silently replaced with a generic orc. `lich`, `wyvern`, `berserker`, `necromancer` enemy types exist but have almost no presence on bosses where they're literally named in the level title.

### 4. Boss "Spell-Break Chant" is gibberish.
`CastleSwarmArena.tsx` 285–311 picks 4 random words from the deduped word soup, shuffles them, and calls it an incantation. "shield apple knight river" is not a chant. It's 4 unrelated nouns. No grammar, no meaning, no narrative.

### 5. WaveDirector overrides campaign in endless mode too.
After `TUTORIAL_WAVES = 5`, `planWave` flips `isEndless: true` and uses a generic 4-enemy pool, ignoring `lvl.composition`. So in a 10-wave campaign, waves 6–10 ignore the level's enemy mix and substitute generic Endless waves with mid-wave boss replacement on multiples of 5.

### 6. HUD pile-up.
Wave banner (top-16), phoneme "Hunt" badge (top-16), and combo chip (top-16 right) all collide on the same y-row at the top of the arena. Mobile/iPad makes this worse because the badge stacks to `mt-12`. Looks like a debug overlay, not a polished game.

### 7. Visual quality is inconsistent.
Player castle and enemies are detailed SVGs, but the summoned knight (lines 847–862) is a 38×46 SVG with rectangles for armor — clearly placeholder. Wave-survived card is fine. The campaign select uses generic Lucide `Scroll` and `Crown` icons for every arc — no boss portrait, no parallax art, no identity.

### 8. Stars/progress feel arbitrary.
`computeStars` (WaveDirector.ts 108) gives 1 star for "won", 1 for accuracy threshold, 1 for word count. There's no "read X% of the story" criterion because there *is no story*. Word count is just "did you keep talking long enough".

### 9. No store, no premium currency, no Stripe.
`CastleUpgradesPanel.tsx` is a knight-stat shop paid with free coins (`progress.total_gold`). That's it. There is no cosmetic store, no premium currency, no Stripe integration. The user explicitly wants this set up.

### 10. Small but ugly bugs.
- Boss interstitial banner reads `BOSS WAVE 5!` with no name, no portrait, no foreshadowing.
- `WaveInterstitial` just says "Wave N cleared" — wastes a perfect moment to advance the narrative.
- `enemy.dying` filter on line 593 cleans up only enemies with both `dying && hp <= 0`; a dying enemy whose hp was lowered to negative numbers can stick around for a frame; minor visual jitter on multi-kill super.
- `wordPool` is computed once per `gradeMode` change — same recycled list every level, every run, forever. Children memorize the order in two sessions.

## The Revamp

Goal: turn Castle Swarm into a **story-driven** tower defense where every word you read is **a word from a real, continuous, properly-spelled story**, named bosses actually appear, and a polished coin + Stripe store drives addictive cosmetic purchases.

### Phase 1 — Story Engine (the core fix)

Replace the deduped word soup with a `StoryRunner`:

1. New module `src/components/aura/game/castle/storyRunner.ts`:
   - Picks a **campaign-specific story** from a new curated bank (see below) for each level. Endless mode rotates through all stories matched to grade band.
   - Tokenizes into sentences (preserves punctuation), then into words within sentences.
   - Exposes `nextBatch(): { sentence: string; words: string[]; sentenceIndex: number; total: number }`.
2. `CastleSwarmArena` consumes `StoryRunner` instead of `wordPool`. The bottom reader shows the current sentence (visible context!), the kid reads it word-by-word, and each correct word damages enemies. When the sentence completes, next sentence loads with a brief "page turn" beat.
3. **Story progress** becomes a real HUD element: "Page 2 of 4" with a thin progress bar above the reader.
4. Stars now include "Finished the story" — replaces the arbitrary `needWords` star threshold.

### Phase 2 — Castle Swarm Story Bank

New file `src/data/castleSwarmStories.ts` containing **30 hand-written, perfectly-spelled, continuous stories** mapped to arcs:

- 5 arcs × 5 levels × 2 grade bands (K-5 + 6-12) = 50 stories. Realistically deliver 30 hand-written + 20 reused from existing `curatedStories.ts` filtered by theme keyword.
- Every story is on-theme:
  - *Goblin King's Return* → 5 stories continuing one plot: scouts → ambush → iron pass → wyverns → king's last stand.
  - *Frost Invasion*, *Sky Pirates*, *Necromancer's Tower*, *Final Siege* each get the same 5-story arc.
- Each story has:
  - `id`, `arcId`, `levelId`, `gradeBand` ("K-5" | "6-12"), `title`, `paragraphs: string[]`, `targetPhonemes: string[]` (the wave's hunt), `bossLine: string` (the actual sentence used for the chant).
- 6-12 versions are written in agent/insurgent voice, K-5 versions in medieval fantasy.
- Spelling pass run through a script before commit; we also add a unit test that asserts every story has no double spaces, has terminal punctuation on every sentence, and contains only ASCII letters + standard punctuation.

### Phase 3 — Named Bosses

1. New `src/components/aura/game/castle/bosses.ts` defines `BOSS_REGISTRY`:
   - `goblin_king`, `frost_king`, `captain_vex`, `lich_lord`, `alliance_warlord` (for the final siege finale).
   - Each entry: name, portrait sprite component, intro banner copy, defeat copy, base HP, special mechanic flag (`heals_minions`, `summons_skeleton_per_8s`, `dive_bomb_every_wave`, etc.).
2. New SVG sprites under `src/components/aura/game/castle/sprites/bosses/` — one component each, in the same illustration style as `PlayerCastle.tsx`.
3. `CastleSwarmArena.startWave` consults the campaign level's arc + wave-position to decide if this is the **arc finale**, and if so spawns the proper boss with the boss's HP/mechanic, plus a 1.5s "Boss Appears" cutscene card with portrait + name + flavor line.
4. Spell-break "chant" is replaced with `bossLine` — a real sentence from the story, with the wave's target phoneme highlighted in color inside the sentence.

### Phase 4 — Wave Director rewrite

`WaveDirector.ts`:
- `planCampaignWave(level, waveNumber)` always uses `level.composition` as the spawn pool.
- Boss waves: if the current level is an arc finale and `waveNumber === level.waveCount`, the boss is the level's named boss (lookup in `BOSS_REGISTRY`). Mid-campaign boss waves (every 5th) use the level's strongest enemy as the elite, not a generic orc.
- Endless mode remains separate via `planEndlessWave(n)` — already fine, just rename for clarity.

### Phase 5 — HUD pass

`CastleSwarmArena` render:
- Move Phoneme Hunt badge to the **left side** of the bottom panel above the reader (where it belongs — it's a reading hint, not a battlefield element).
- Combo chip → top-right *under* the HP bar, never colliding with the wave banner.
- Wave banner gets the level name + sentence-progress: "Goblin Patrol · Page 2/3".
- Interstitial card: replace "Wave N cleared / +coins" with a 2-line story beat ("The goblins fall back into the woods. A second wave is forming…") + coins.
- Boss appearance gets a dedicated 1.6s portrait card animating in from the left, slightly slowing the spawn timer so kids can read the name.

### Phase 6 — Knight visuals

Replace the placeholder knight SVG with a properly-drawn knight sprite component matching `PlayerCastle` style, plus 3 unlockable skins (Iron, Crimson, Frost) that hook into Phase 8 cosmetic store.

### Phase 7 — Campaign Select polish

`CastleCampaignSelect.tsx`:
- Each arc card gets the arc's boss portrait (small 56px) on the right, not a generic `Scroll` icon.
- Story preview line under each level card ("Read: The Burning Watchtower") sourced from the new story bank.
- Lock state shows `Complete "Iron Pass" to unlock` instead of generic "earlier missions".

### Phase 8 — Coin Store + Stripe in-game currency

Two currencies:
- **Coins** (free, earned in any reading mode) — already exists. Used for knight upgrades + low-tier cosmetics.
- **Crowns** (premium, Stripe-purchased) — new. Used for top-tier cosmetics, season pass, instant-rejoin tokens.

Work to do:
1. **DB migration** `castle_store`:
   ```
   castle_premium_balance (user_id pk, crowns int default 0, updated_at)
   castle_premium_ledger (id pk, user_id, delta int, reason text, stripe_session_id text, created_at)
   castle_cosmetics (id text pk, kind text, name text, price_coins int null, price_crowns int null, asset_key text)
   castle_user_cosmetics (user_id, cosmetic_id, equipped bool, acquired_at)
   ```
   All tables with proper GRANTs (`SELECT/INSERT/UPDATE` to `authenticated`, `ALL` to `service_role`, no `anon`) and RLS policies scoping to `auth.uid()`.
2. **Stripe**: call `recommend_payment_provider` first, then `enable_stripe_payments`. Create three Crown packs as products: Pouch (200 crowns / $1.99), Chest (1100 crowns / $9.99), Vault (3500 crowns / $24.99).
3. **Edge function** `castle-store-webhook` for `checkout.session.completed` → credit balance + write ledger row. Existing project pattern uses Supabase edge functions with `verify_jwt = false` for Stripe webhooks.
4. **New screen** `CastleStorePanel` (replaces or sits next to upgrades):
   - "Cosmetics" tab: knight skins, castle banners, super-VFX, boss-defeat splash arts.
   - "Crowns" tab: buy packs (opens Stripe Checkout via existing pattern).
   - Equipped cosmetics persist via `castle_user_cosmetics`.
5. **Reader hook-up**: knight render reads equipped skin; player castle reads equipped banner.

### Phase 9 — Test + verification

- Add a smoke test that walks one campaign level: starts level → reads N words → asserts story progresses sentence-by-sentence → asserts boss spawns with correct name at final wave.
- Manual QA loop: play k5-arc1-1 → arc1-5, confirm Goblin King appears, confirm story sentences flow continuously, confirm chant uses real sentence.

## Technical Details (for the dev pass)

- All new tables: GRANT + RLS + service_role grants in the same migration. No anon access — these are auth-scoped.
- Stripe webhook secret stored via `add_secret` as `STRIPE_WEBHOOK_SECRET` once the user creates the webhook in their Stripe dashboard (or via `enable_stripe_payments` flow which provisions it automatically).
- Story bank ships as a TS const (no DB) so it's cached at build time and never hits the network — keeps the $0 cost model intact.
- `StoryRunner` is a pure class with no React deps; same idea as `WaveDirector`. Easy to unit test.
- Boss sprite components are tree-shakable so they only load when their arc loads.
- All new copy is hand-written; we do not call an LLM at runtime.

## Order of execution

1. Phase 2 (story bank) + Phase 1 (story runner) shipped together — biggest perceived improvement.
2. Phase 4 + Phase 3 (wave director + named bosses) — finally makes campaigns make sense.
3. Phase 5 (HUD) + Phase 7 (campaign select polish) + Phase 6 (knight art).
4. Phase 8 (Stripe + store) — separate, larger work; tackle right after the core game feels good.
5. Phase 9 (tests/QA).

Approve and I'll start with Phase 1 + 2 (story runner + story bank) as the first commit — that single change makes Castle Swarm feel like a different product.
