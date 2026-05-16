## Brutally honest audit: what works vs what's broken

I traced every store category through the database → inventory hook → battle code. Here's the truth:

### ✅ Working today
- **Skins** — purchase saves to `player_inventory`, `equipSkin` flips `is_equipped`, and characters render with the variant in both HUD previews and the battle arena (`RPGBattleArena.tsx:2897`).
- **Powers (spells)** — purchased powers are converted into real `Spell` objects with damage, MP cost, icon, and effect, and appear in the spell menu (`RPGBattleArena.tsx:331`).
- **Upgrades that work:** `attack_boost`, `health_boost`, `mp_boost`, `gold_boost`, `xp_boost`.
- **Potions that work:** `health_potion` (heal_hp), `magic_potion` (restore_mp), `mega_health` / `heal_full`, `mana_surge` / `mp_full`.

### ❌ Broken — paid for, no effect

**Upgrades sold but never read anywhere in battle:**
- `streak_boost` ("Focus Mastery, +50% streak bonus damage") — never applied to streak damage math.
- `crit_boost` ("Sharp Eye, +15% crit chance") — there is no crit system at all.
- `defense_boost` ("Adamantine Shield, -15% damage taken") — incoming damage is never multiplied by this.

**Potions sold but the switch in `handleUseItem` has no case for them:**
- `speed_potion` — no effect.
- `double_xp` — no effect (no XP multiplier hook).
- `lucky_coin` / gold boost potion — no effect.
- `revive_feather` — no effect (no revive-on-death check).
- `shield_potion` (`defense`) — deducts the potion but applies no buff/timer.
- `rage_potion` — drains HP but never grants the +100% damage window the description promises.

**Catalog mismatch:**
- `mega_health` exists in the in-battle item menu but is NOT in `STORE_ITEMS`, so players can never buy it.

**Cross-mode gold bug:**
- `RPGPlayerHUD` calls `usePlayerInventory(studentId)` without `gradeMode`, so purchases made from the HUD deduct gold from every grade-mode row, not just the active one (`usePlayerInventory.ts:101`). `RPGBattleArena` passes it correctly.

---

## Plan to fix everything

### 1. Wire up the three dead upgrades in `RPGBattleArena.tsx`
- `defense_boost`: multiply every incoming-damage write (enemy attacks, poison tick, rage self-damage if applicable) by `(1 - defense_boost/100)`, floored at 1.
- `streak_boost`: in the damage calc around line 1439, scale the existing streak bonus by `(1 + streak_boost/100)`.
- `crit_boost`: add a simple crit roll in the same damage block — on hit, `Math.random() < crit_boost/100` → multiply damage by 2 and show a "CRIT!" damage label. Show the crit chance on the upgrade tooltip.

### 2. Make every potion do what it says
Extend `handleUseItem` switch (and add timed buffs via existing state):
- `speed` → set a `speedBuff` flag for N seconds that reduces enemy turn delay / increases reading window.
- `double_xp` → set `xpMultiplierBuff = 2` for the rest of the battle, then multiply the `xpBoostPercent` payload at line 1894 accordingly.
- `gold_boost` (lucky_coin) → same pattern as double_xp but for `goldBoostPercent` at line 1889.
- `revive` → when `playerHp <= 0`, consume one `revive_feather` from inventory and restore to 50% HP instead of game-over.
- `defense` (shield_potion) → set a `shieldTurns` counter (e.g. 3 turns) and apply -50% damage taken while active.
- `rage` → set `ragePending = true` for next N attacks, multiplying outgoing damage by 2 (already self-damages).

### 3. Catalog cleanup
- Add `mega_health` to `STORE_ITEMS` (price/rarity matching the menu) so it can actually be purchased, OR remove it from `RPGItemMenu` defaults. Default: add it to the store (better player value).
- Align effect strings: keep menu's `heal_hp`/`restore_mp` and rely on `id` matching (already correct via id-based lookup); no schema change needed.

### 4. Fix the cross-mode gold bug
- Pass `gradeMode` into `usePlayerInventory` from `RPGPlayerHUD`. Thread `gradeMode` prop from wherever the HUD is mounted (same source the BattleArena uses).

### 5. QA pass
After each change, manually verify in-preview: buy each upgrade, see the stat tick up; drink each potion, see the matching buff; equip each skin, see character render; cast each purchased power, see damage land.

### Files to touch
- `src/components/aura/game/rpg/RPGBattleArena.tsx` — damage math, potion switch, revive check, buff state.
- `src/components/aura/game/rpg/RPGPlayerHUD.tsx` — accept + forward `gradeMode`.
- Whatever parent mounts `RPGPlayerHUD` — pass `gradeMode` down.
- `src/lib/gameEconomy.ts` — add `mega_health` entry.
- (Optional) `src/components/aura/game/rpg/RPGStore.tsx` — surface live values (e.g. "you already have +20% attack") so the player can see upgrades stacking.

No DB schema changes needed — everything is already persisted in `player_inventory`.
