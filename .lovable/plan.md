
# Castle Swarm — Honest Overhaul

## 1. Pause behavior (fix the "PAUSED on minimize" bug)

- Remove the `visibilitychange` → `setPaused(true)` listener in `CastleSwarmArena.tsx`. Tab switch / fullscreen toggle will no longer force-pause. (Reading sessions stay paused only when the player asks.)
- Keep the pause button as the single source of truth: clicking the Pause/Play icon toggles `paused`. Confirm the overlay click-through doesn't block it (move the overlay's `z-index` below the header pause button, or add an explicit `onClick={() => setPaused(false)}` to the "PAUSED" overlay so tapping the screen also unpauses).
- Pause the speech-recognition stream when `paused === true` so the mic doesn't keep listening in the background.

## 2. Economy rework — Mana vs Gold

Two currencies, two jobs:

| Currency | Earned by | Spent on | Persists? |
|----------|-----------|----------|-----------|
| **Mana** (blue) | Reading words correctly *during* the match (1–3 per word, combo bonus, crit on phoneme hits) | Summoning heroes in the active match | No — resets each run |
| **Gold** (coins, existing) | Wave clears + reading streaks (same as today) | Permanent castle upgrades + buying new hero **unlocks** in the shop | Yes — saved to profile |

Implementation outline:
- Add `manaRef` + `manaHud` state. Award mana on `scoreWord` success in `wordEconomy` paths.
- `handleSummonHero` deducts from `manaRef`, not coins. `summonCost` in `heroRoster.ts` becomes mana cost; rebalance to 15–80 range so a casual reader can summon every 3–6 correct words.
- `handleBuyShopHero` (shop unlock) still deducts gold (`coinsRef`) — moved out of the match HUD into the existing `CastleUpgradesPanel` "Heroes" tab (no more in-match locked cards bar).
- Tuning target: average K-5 reader can sustain ~1 footman or archer per sentence; high-tier units (Knight, Paladin, Giant) cost enough mana that you only get 1–2 per wave.

## 3. Hero roster gating (don't start with everything)

New unlock tiers in `heroRoster.ts`:

- **Starter (1 only):** Archer. That's it. Even Footman becomes a campaign unlock.
- **Campaign unlocks** (granted by clearing specific levels — `rewardHeroId`): Footman (Arc 1 L1), Shield Knight (Arc 1 L2), Torch Bearer (Arc 1 L3), Repairman (Arc 1 L4), Knight (Arc 1 L5), Elven Archer (Arc 2 L1), Rifleman (Arc 2 L3).
- **Shop-only (gold):** Ice Mage, Elven Healer, Dwarf Cannon, Paladin, Giant. Premium-priced (600–1500 gold) so players grind or buy Crowns.
- The campaign select screen shows a small "Reward: <hero portrait>" badge per locked level so kids see what they're working toward (visible addiction loop).

## 4. Hero art — stop the "dog shit models"

Rewrite `HeroSprite.tsx` to render proper layered SVG mini-portraits inspired by the existing `SwarmEnemy` aesthetic:

- Consistent 48×48 viewBox, chunky outlined silhouettes (matches the green orc style on screen).
- Body + head + weapon + role accent (bow, shield, hammer, staff, torch flame, cannon barrel, wings, etc.).
- Idle bob animation, attack flash, low-HP red tint.
- Color palette pulled from `index.css` tokens (no hard-coded hex sprawl).
- In-arena heroes render at 40×40 with the same SVG (so the summon-bar portrait matches what walks onto the field).

## 5. Heroes that actually fight (bug fix)

Audit found in `heroEngine.ts`:
- Wall heroes spawn at arena x=30 but enemies march toward x=0 → projectiles fire "right→left" but the engine picks `dir = p.targetX < p.x ? -1 : 1`. Enemies at x≈ARENA_WIDTH are *greater* than hero.x, so projectiles travel the wrong direction and never connect.
- Front-line heroes "advance" by *increasing* x toward 220, which moves them further from the gate but still away from enemies (which are at high x and walking down). They never meet.

Fix: define a single canonical direction. Player castle gate = `ARENA_WIDTH` (right), enemies spawn at `x=0` (left), march toward `ARENA_WIDTH`. Hero spawn x: wall ≈ `ARENA_WIDTH - 30`, front ≈ `ARENA_WIDTH - 90`, support ≈ `ARENA_WIDTH - 20`. Front advances by decreasing x (`h.x -= advance`). Confirm this against `SwarmEnemy` rendering math and align both. After fix, projectiles will lock onto the nearest enemy and front-liners will actually march out the gate.

## 6. Shrink the HUD — "half the screen is covered"

- Collapse the SummonBar to **one row of 5 owned heroes max**, horizontally scrollable. Locked teaser cards move out of the arena entirely into the upgrades panel.
- Drop the bottom panel from `~28%` of viewport height to a fixed `132px` strip.
- Combine the Mana/Gold/Combo readouts into a single right-side vertical strip on the header.
- Move the 3 power buttons (Fireball/Ice/Lightning) to a slim vertical rail on the left edge instead of a row that competes with the reader.
- Reader card stays anchored at the bottom but with `max-h-[120px]` and reduced padding.

## 7. Brutal audit — what else is broken / under-monetized

**Bugs / polish:**
- "PAUSED" overlay covers the reader so kids can't see the sentence they were reading — center the overlay only over the arena, not the reader.
- `Combo x6` chip is huge and floats top-right — shrink and dock to header.
- Enemy HP labels stack on top of each other when multiple enemies cluster (visible in screenshot: "13 HP / 2 HP / 9 HP" overlapping). Add vertical jitter or hide all but the targeted enemy's bar.
- Mic still listens during interstitials / summary screens — wastes battery and triggers false "Reading…" toasts.
- Hero `idCounter` uses a ref but cooldown state uses `Date.now()` while spawn uses `performance.now()` — single clock source.

**Reading-pedagogy gaps:**
- No retry path when a kid mispronounces — currently the word just dims. Add a "Try again" pill that re-prompts with phoneme breakdown (uses existing `phonemeMatcher`).
- Phoneme-of-the-wave chip ("Hunt: /th/") is shown but kids get no visual reward beyond the combo bar — add a sparkle + bonus mana when they nail a `/th/` word.
- Hard mode locks the reading-difficulty floor; should auto-down-shift to easier words after 2 consecutive misses to avoid frustration churn.

**Addiction / retention loops:**
- Daily Challenge has no streak meter visible on the campaign select screen — add a flame badge + "X day streak" with a soft warning when the streak is about to break (loss-aversion hook).
- No "almost there" nudge when a hero unlock is 1 level away. Add a banner on the run-summary screen.
- Run-summary should always show *the next* hero unlock as bait ("Beat Arc 1 L4 to unlock Repairman").

**Monetization (parents → wallet):**
- Introduce **Crowns** as the premium currency. Crowns can: instantly unlock any campaign-locked hero, refill mana mid-match, skip a wave cooldown, buy cosmetic hero skins (gold/obsidian/holiday variants).
- Crown bundles ($1.99 / $4.99 / $9.99 / $19.99) with the middle tier flagged "Best Value" and a one-time "Starter Pack" ($4.99: 500 Crowns + Paladin skin + 7-day double-gold) — high-converting first purchase pattern.
- "Hero Pass" seasonal track ($4.99/season): completing reading minutes earns track rewards; premium track adds exclusive heroes/skins. Drives daily reading.
- Soft sell only — every paid offer must also be earnable through reading. Show both prices on each shop card ("750 🪙 or 50 👑"). Required by US/EU kids-app guidelines and avoids App Store rejection.
- Parent dashboard: weekly email of "minutes read / words mastered / heroes unlocked" with a single CTA to gift Crowns. Highest-LTV conversion path for kid games.

## Files to touch

- `src/components/aura/game/castle/CastleSwarmArena.tsx` — pause fix, mana state, HUD shrink, overlay z-index, mic gating.
- `src/components/aura/game/castle/heroes/heroEngine.ts` — coordinate-system fix so heroes actually fight.
- `src/components/aura/game/castle/heroes/heroRoster.ts` — re-gate starters, switch `summonCost` semantics to mana, rebalance values.
- `src/components/aura/game/castle/heroes/HeroSprite.tsx` — redraw all 13 portraits.
- `src/components/aura/game/castle/heroes/SummonBar.tsx` — compact layout, owned-only, mana readout.
- `src/components/aura/game/castle/CastleUpgradesPanel.tsx` — add "Heroes" tab for shop unlocks (gold + Crowns).
- `src/components/aura/game/castle/CastleCampaignSelect.tsx` — show hero-reward badges + streak.
- `src/components/aura/game/castle/campaignLevels.ts` — assign `rewardHeroId` for every starter→campaign promotion.
- New: `src/lib/castleCrowns.ts` + Crown bundle UI (Stripe wiring is out of scope for this pass — stub the "Buy Crowns" modal behind a `coming soon` flag and queue the Stripe integration as a follow-up).

## Out of scope (call out explicitly)

- Stripe / IAP wiring for Crowns (planned next pass — requires payments provider selection).
- New hero animations beyond idle/attack/death.
- Multiplayer balance changes.
- Backend schema changes beyond what's already in `castle_unlocked_heroes`.
