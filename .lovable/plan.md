# Castle Swarm Defense — Polish + "Make It Legendary" Plan

Two phases. Phase 1 is small finishing work. Phase 2 is the gameplay/learning depth pass to make the mode genuinely addicting and uniquely valuable for literacy.

---

## Phase 1 — Finish the visual separation from RPG mode (small, deterministic)

Goal: Castle entry cards no longer share RPG's amber palette. Move to a crimson + steel (slate) identity matching the in-arena art.

Files:
- `src/pages/student/AuraPractice.tsx` (lines ~873–898): swap the amber/rose gradient card to `border-rose-600/50 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900`, recolor the avatar circle, icon, NEW badge, and Enter Castle button to crimson/steel.
- `src/components/aura/StoryLibrary.tsx` (lines ~278–310): same treatment for the Castle entry card (icon `text-rose-500`, button crimson).
- `src/components/aura/game/castle/CastleCampaignSelect.tsx`: title `text-amber-300` → `text-rose-300`; tweak Endless tile gradient from `rose/amber` → `rose/slate` so it stops echoing RPG.

No logic changes. Pure presentation.

---

## Phase 2 — Make the mode "legendary": addicting + literacy-driven

The current mode is mechanically OK (read word → damage front enemy, summon knight on 7+ letter words, screen-clear super). To make it truly novel and habit-forming, we layer in four systems that each independently increase retention and learning value.

### 2A — Living word economy ("Word Forge")

Right now every correct word does the same thing. Replace with a **word property system** that ties literacy directly to combat:

| Word property | Triggered when | In-game effect |
|---|---|---|
| Short (≤4 letters) | always | Fast jab — small damage, builds combo quickly |
| Long (7+) | as today | Summons a knight |
| Contains target phoneme of the day | per-wave phoneme highlighted in HUD | +50% damage, golden hit |
| Sight-word streak (3 in a row from `data/sightWords.ts`) | sight words list | Charges a "Resolve" shield on the player castle |
| Decodable phonics-pattern match (e.g. CVCe, digraph) | uses `data/phonicsScopeAndSequence.ts` | Crit, pierces armor (needed for `armored_orc`) |
| Vocabulary tier word (rare) | length + non-Dolch | Heals castle 1 HP, plays satisfying chime |

Implementation:
- New `src/components/aura/game/castle/wordEconomy.ts` — pure function `scoreWord(word, ctx) → { dmg, summons, crit, shield, heal, phonemeHit }`.
- HUD shows "Phoneme of the wave: /ai/" badge so kids hunt for matching words. Rotates each wave for variety + scope-and-sequence alignment.
- Combo meter (already present) becomes **Word Forge meter**: filling it unlocks a one-shot "forge" of a guaranteed long power word for the player to read.

Why this is sticky: every word the kid reads now has a distinct "feel" and visual reward. They start *hunting* for specific patterns — that's exactly the cognitive loop reading science wants.

### 2B — Hero abilities + run-meta progression

Three picker-style hero classes selectable before each run (uses existing `castle_upgrades` table — no schema change, just stored locally per run):

- **Knight-Commander** — bigger summon cap, slower fireball.
- **Archmage** — powers cost less to charge, knights weaker.
- **Linguist** — phoneme-hit bonus doubled, sight-word shield bigger. (Best for struggling readers — surfaced as "recommended" if their AURA accuracy < 70%.)

Adds replayability without new content cost.

### 2C — Boss "spell-break" minigame (the addictive moment)

Every boss wave currently is "just a fat orc." Replace with a **chant-break sequence**:
- Boss casts a 4-word incantation that appears letter-by-letter.
- Player must read the 4 words in order, fast, to break the chant before boss casts (5 sec timer).
- Success = boss stunned + heavy damage. Failure = player castle takes a big hit.
- Reuses `RPGWordReader` in `mode="fast"` (no new mic code).

This is the *moment kids retell at recess*. Distinct from any other reading product.

### 2D — Meta loot + cosmetic castle

Coins already drop. Add:
- **Banner unlocks** at wave milestones (5/10/15/20) shown on `PlayerCastle.tsx` (a flag on the spire — pure SVG, free).
- **Castle skin set** (3 SVG variants: stone, ivy, obsidian) purchasable via existing `castle_upgrades` coins. Pure cosmetic but kids grind for them.
- **Daily Challenge leaderboard** — local-only per-student PB display today; can wire to backend later. The seed already exists in `WaveDirector.dailySeedString()`.

### 2E — Game-feel polish (cheap, huge impact)

- Hit-stop: when a crit lands, freeze the loop for 60ms (`dt = 0`). Universally satisfying.
- Damage numbers: floating `+3!` text on enemies (already have hit flash hook).
- Knight charge-up: knight sprite shows a brief golden aura the first 300ms after spawn so summoning *feels* powerful.
- Audio: a single short SFX for crit / knight summon / boss break. Use existing audio helpers; no new dependencies.

### Deliberate non-goals (right now)

- **No 3D.** Three.js bloat (~600KB) is not worth the win on K-5 iPads. Stay 2D SVG + parallax — looks 3D-ish, runs everywhere, keeps the $0/month cost model.
- **No new backend tables.** All new state slots into the existing `castle_upgrades` and `campaign_progress` tables, plus localStorage for cosmetic picks.
- **No new mic stack.** Continue to use `RPGWordReader mode="fast"`.

---

## Suggested build order (so you can stop at any milestone)

1. Phase 1 recolor (5 min).
2. Word economy module + HUD phoneme-of-the-wave (the single biggest "this feels different now" moment).
3. Hit-stop + damage numbers + knight charge-up (feel).
4. Boss spell-break minigame.
5. Hero classes selector.
6. Castle skins / banners.
7. Daily leaderboard (later, optional).

## Verification per milestone

- After Phase 1: open `/student/aura` and `/game/castle-swarm` — confirm Castle entry cards are crimson, no amber bleed against RPG.
- After 2A: HUD shows phoneme badge; reading a matching word produces golden crit.
- After 2C: boss wave triggers chant overlay; reading the 4 words breaks it.
- Run a full Endless to wave 10 — confirm pacing, no console errors, mic stays responsive, FPS stable on the iPad viewport.

## Out of scope
Anything outside `src/components/aura/game/castle/`, the two entry cards, and `CastleCampaignSelect.tsx`. RPG mode, AURA assessment, parent dashboards — untouched.
