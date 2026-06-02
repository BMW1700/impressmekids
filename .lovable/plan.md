## Castle Swarm — Summonable Hero Roster

Add a roster of summonable heroes inspired by the reference (Archer, Footman, Knight, Paladin, Ice Mage, Elven Healer, Repairman/Builder, Dwarf Cannon, etc.). Players summon them mid-battle by spending Coins earned from reading. Each hero has a role that determines where it stands and what it does. New heroes are unlocked by completing campaign levels or purchasing them in the in-game shop.

### Roster (V1)

Three role classes — placement and behavior are driven by role:

```text
WALL / TOWER (stays on the castle, ranged)
  Archer          unlock: starter (free)
  Elven Archer    unlock: clear Level 3
  Rifleman        unlock: clear Level 6 OR shop
  Ice Mage        unlock: shop (slows enemies)
  Dwarf Cannon    unlock: shop (AoE)

FRONT LINE (advances a short distance from castle, melee)
  Footman         unlock: starter
  Shield Knight   unlock: clear Level 2
  Knight          unlock: clear Level 5
  Paladin         unlock: shop (heavy hitter)
  Giant           unlock: shop (premium)

SUPPORT (stays near castle)
  Repairman       unlock: clear Level 4 (heals castle HP)
  Elven Healer    unlock: shop (heals heroes)
  Torch Bearer    unlock: starter (small buff aura)
```

### Gameplay

- New HUD strip above the reader: horizontally scrollable **Summon Bar** showing the player's owned heroes with cost in Coins and cooldown ring. Tapping a card summons that hero into the arena.
- Summon cost is paid from the existing Castle Swarm coin balance (already earned per correct word). Each hero has a fixed cost and a cooldown (e.g. Archer 25c / 6s, Knight 60c / 12s, Paladin 120c / 20s).
- Placement by role:
  - Wall units spawn on the castle parapet and shoot projectiles at the nearest in-range enemy.
  - Front-line units spawn at the castle gate and walk a short distance forward, then engage incoming enemies in melee.
  - Support units spawn next to the castle and apply a periodic effect (heal castle, heal nearest hero, slow aura).
- All hero behavior runs in the existing animation loop in `CastleSwarmArena.tsx` — no new engine. Hero state is a `heroes: ActiveHero[]` ref + render array, updated each tick alongside enemies.

### Unlocks

- **Per-level rewards**: when a campaign level is completed for the first time, grant the hero listed in its `rewardHeroId` (added to `campaignLevels.ts`). Persisted in the existing `useCastleCampaign` Supabase progress row via a new `unlocked_heroes text[]` column.
- **Shop**: extend `CastleUpgradesPanel` with a new "Heroes" tab listing locked heroes with their unlock condition + price in Crowns (premium) or Coins (soft). Purchases append to `unlocked_heroes`.
- Starter heroes (Archer, Footman, Torch Bearer) are always available.

### Files

New
- `src/components/aura/game/castle/heroes/heroRoster.ts` — `HERO_ROSTER` definitions (id, name, role, cost, cooldown, damage, range, unlock).
- `src/components/aura/game/castle/heroes/HeroSprite.tsx` — minimal SVG/emoji portraits for each hero (placeholder art, themed solid colors per role).
- `src/components/aura/game/castle/heroes/SummonBar.tsx` — horizontal scroller of owned hero cards with cost/cooldown.
- `src/components/aura/game/castle/heroes/heroEngine.ts` — pure functions: `spawnHero`, `tickHeroes(heroes, enemies, dt)` returning updated lists + damage events.
- `src/hooks/useCastleHeroes.ts` — loads/saves `unlocked_heroes` for the player, exposes `unlock(id)` and `isUnlocked(id)`.

Edited
- `src/components/aura/game/castle/CastleSwarmArena.tsx` — render heroes layer, integrate `SummonBar` above reader, spend coins on summon, call `tickHeroes` in the loop, apply hero damage to enemies and hero healing/repair effects.
- `src/components/aura/game/castle/campaignLevels.ts` — add `rewardHeroId` to relevant levels.
- `src/components/aura/game/castle/CastleUpgradesPanel.tsx` — add a "Heroes" tab listing locked heroes with purchase buttons that call `unlock(id)`.
- `src/hooks/useCastleCampaign.ts` — on level completion, if level has `rewardHeroId`, call `unlock(id)`.

DB migration
- Add `unlocked_heroes text[] not null default '{}'` to the existing castle progress / player row used by `useCastleCampaign`.

### Out of scope (intentionally)

- High-fidelity sprite art — placeholder SVG portraits now; real art swap later.
- Hero leveling/upgrades, evolution trees, and equipment.
- Stripe wiring for Crowns purchases (already planned separately).
- Multiplayer hero sync.