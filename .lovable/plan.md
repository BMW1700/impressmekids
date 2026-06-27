# Nabu Village — Full Build, Reading-Gated Unlocks

Honest take first: your instinct is right. Gating unlocks behind reading levels solves the #1 risk of the full vision (kids playing decorator instead of reading). That converts the "second game" problem into a reward loop for the *actual* game. I'm in. Here's how we ship it without it eating 6 months.

## The core loop we're selling

```text
Read a level  →  Earn Gold + a Village Token  →  Unlock zone / item / pet  →
  See Benny react in the village  →  Pulled back to read the next level
```

Village is **only reachable from the Pre-K map** and **every meaningful unlock requires reading progress**, not just gold. Gold alone can't buy a new zone — that needs a Token, and Tokens only drop from completing levels.

## Unlock ladder (gated by Pre-K world/level progress)

| Stage | Reading requirement | Unlocks in village |
|---|---|---|
| Start | Complete World 101 Level 1 | Yard zone, 4 decoration slots, Benny idle |
| Bronze | Finish World 101 (Nabu Village) | Bedroom zone, 6 more slots, 1st pet (Echo) |
| Silver | Finish World 102 | Kitchen zone, cooking cosmetic set, Benny new outfit slot |
| Gold | Finish World 103 | Festival yard, fireworks prop, Bobo joins |
| Prestige | 7-day reading streak | Rare cosmetic drop + Benny animation |

Plus per-level micro-rewards: each completed level drops 1 Token + Gold + a rotating "today's item."

## Scope: Full vision, sequenced into 3 shippable phases

**Phase 1 — Sellable demo (2–3 weeks).** Yard + bedroom zones, fixed slot grid (not free-form drag), 20 decorations, Benny reacts (waggle + new outfit on Bronze), Tokens, unlock ladder above wired to existing `campaign_progress`. This is what the demo video shows.

**Phase 2 — Depth (3–4 weeks after Phase 1 ships).** Kitchen + festival zones, pets (Echo, Bobo) with simple feed/pet interactions, 40 more cosmetics, daily login bonus item, streak-gated prestige drops.

**Phase 3 — Free-form + social (later, only if retention data justifies it).** Drag-to-place furniture with snap grid, share-a-snapshot, friend visits. This is the risky/expensive part — we *don't* commit to it until Phase 1+2 prove kids care.

## Hard rules that protect the reading goal

- Village entry button is **disabled** until at least one reading level is done that day (configurable; default on).
- Tokens **never** purchasable with Gold or real money. Only reading earns them.
- No timers, no "come back in 4 hours" mechanics. Pre-K + COPPA = no FOMO loops.
- Cosmetics only. Zero pay-to-win, zero stat boosts that affect reading scoring.
- Reuses existing Gold economy; Tokens are the only new currency.

## Technical sketch (for the engineer reading this)

New tables:
- `village_zones` (id, slug, name, unlock_requirement jsonb, sort_order) — seed data, admin-editable later.
- `village_items` (id, slug, name, zone_id, image_url, unlock_requirement jsonb, token_cost, gold_cost).
- `player_village_state` (user_id, unlocked_zone_ids[], owned_item_ids[], placed_items jsonb, tokens int, updated_at) — single row per user, RLS by `auth.uid()`.
- `village_unlock_log` (user_id, item_id/zone_id, unlocked_at, reason) — audit + analytics.

Unlock check is a single security-definer function `public.check_village_unlocks(_user_id)` that reads `campaign_progress` + `student_reading_stats` and returns the IDs the player has newly earned. Called on level complete and on village open. No client-side gating logic — server is source of truth.

Frontend: one new route `/game/village`, lazy-loaded; fixed-slot grid component (CSS grid, no drag lib in Phase 1); reuses Benny sprites already in `src/assets/`. Background prefetched same way Pre-K levels are.

Performance: village state is one row, cached in React Query, invalidated on level complete. Zero impact on concurrent-user ceiling.

## What I need from you before I start

1. **Confirm Phase 1 scope above** — or tell me what to add/cut.
2. **Daily reading gate**: on by default (must read 1 level/day to enter village), or off?
3. **Token drop rate**: 1 per level (generous, fast unlocks) or 1 per 2 levels (slower, more pull)?

Say "go" and I'll build Phase 1.