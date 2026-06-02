import { HERO_ROSTER, HEROES_BY_ID, HeroDef, HeroRole } from "./heroRoster";

export interface ActiveHero {
  id: number;
  heroId: string;
  role: HeroRole;
  x: number;            // arena px (0 = left/enemy side, ARENA_WIDTH = right/player castle)
  hp: number;
  maxHp: number;
  spawnedAt: number;
  expiresAt: number;
  /** Earliest time this hero can attack again. */
  nextAttackAt: number;
  /** Earliest time the support effect ticks again. */
  nextPulseAt: number;
  /** Currently buffed by a torch bearer (attack speed *=). 1 means no buff. */
  attackSpeedMul: number;
}

export interface HeroProjectile {
  id: number;
  fromHeroId: number;
  x: number;            // travels right→left toward enemy
  targetX: number;
  startX: number;
  born: number;
  dmg: number;
  splash: boolean;
  color: string;
}

export interface EnemyLike {
  id: number;
  x: number;
  hp: number;
  maxHp: number;
  dying: boolean;
  hitFlashUntil: number;
  slowUntil: number;
}

/** Resolve where a hero spawns (in arena px) based on its role. */
export function spawnXForHero(role: HeroRole, arenaWidth: number) {
  // Player castle is on the RIGHT side (arenaWidth). Enemies march from x=arenaWidth → 0? Wait,
  // checking arena: enemies start at x = ARENA_WIDTH and move toward x = 0 (left). Castle is at right
  // visually but on screen the player castle is rendered on the RIGHT and we measure `100 - pct`.
  // Internally enemies spawn at ARENA_WIDTH and march x -> 0. So the castle gate is x ~= 0 in arena coords.
  if (role === "wall")    return 30;   // perched on top of the wall, very close to gate
  if (role === "front")   return 90;   // a few steps out from the gate
  /* support */           return 20;   // hugging the castle
}

/** y-offset (px) above the ground line so wall units are visually higher. */
export function yOffsetForHero(role: HeroRole) {
  if (role === "wall") return 70;
  if (role === "support") return 4;
  return 0;
}

/** Helpers */
const dist = (a: number, b: number) => Math.abs(a - b);

export function canSummon(
  heroId: string,
  coins: number,
  cooldownUntil: number,
  now: number,
  activeOfThisHero: number,
  perHeroCap = 3,
): { ok: true } | { ok: false; reason: "coins" | "cooldown" | "cap" } {
  const def = HEROES_BY_ID[heroId];
  if (!def) return { ok: false, reason: "cap" };
  if (coins < def.summonCost) return { ok: false, reason: "coins" };
  if (now < cooldownUntil) return { ok: false, reason: "cooldown" };
  if (activeOfThisHero >= perHeroCap) return { ok: false, reason: "cap" };
  return { ok: true };
}

export function summonHero(opts: {
  heroId: string;
  now: number;
  arenaWidth: number;
  idCounter: () => number;
}): ActiveHero {
  const def = HEROES_BY_ID[opts.heroId];
  return {
    id: opts.idCounter(),
    heroId: opts.heroId,
    role: def.role,
    x: spawnXForHero(def.role, opts.arenaWidth),
    hp: def.hp,
    maxHp: def.hp,
    spawnedAt: opts.now,
    expiresAt: opts.now + def.lifetimeMs,
    nextAttackAt: opts.now + 400,
    nextPulseAt: opts.now + (def.support?.pulseMs ?? 1000),
    attackSpeedMul: 1,
  };
}

export interface HeroTickResult {
  newProjectiles: HeroProjectile[];
  castleHeal: number;     // hp to add to castle this tick (clamped externally)
  removedHeroIds: number[];
}

/**
 * One animation-loop tick for all heroes. Mutates enemies/heroes in place;
 * returns "events" the arena should apply (new projectiles, castle healing, removals).
 */
export function tickHeroes(opts: {
  now: number;
  dt: number;
  heroes: ActiveHero[];
  enemies: EnemyLike[];
  projectiles: HeroProjectile[];
  projectileId: () => number;
  arenaWidth: number;
}): HeroTickResult {
  const { now, dt, heroes, enemies, projectiles, projectileId } = opts;
  const result: HeroTickResult = { newProjectiles: [], castleHeal: 0, removedHeroIds: [] };

  // Pass 1: torch-bearer buff aura — every hero starts at 1x, gets boosted by any
  // torch bearer in range.
  for (const h of heroes) h.attackSpeedMul = 1;
  for (const h of heroes) {
    const def = HEROES_BY_ID[h.heroId];
    if (!def.support || def.support.effect !== "buff_aura") continue;
    for (const o of heroes) {
      if (o.id === h.id) continue;
      if (dist(o.x, h.x) <= def.support.radius) {
        o.attackSpeedMul = Math.max(o.attackSpeedMul, 1 + def.support.amount);
      }
    }
  }

  // Pass 2: per-hero behavior
  for (const h of heroes) {
    const def = HEROES_BY_ID[h.heroId];

    // Lifetime
    if (now >= h.expiresAt || h.hp <= 0) {
      result.removedHeroIds.push(h.id);
      continue;
    }

    if (def.role === "support" && def.support) {
      // Pulse-driven effects
      if (now >= h.nextPulseAt) {
        h.nextPulseAt = now + def.support.pulseMs;
        if (def.support.effect === "repair_castle") {
          result.castleHeal += def.support.amount;
        } else if (def.support.effect === "heal_hero") {
          // Heal the most wounded hero within radius (not self).
          let pick: ActiveHero | null = null;
          let worst = 0;
          for (const o of heroes) {
            if (o.id === h.id) continue;
            const missing = o.maxHp - o.hp;
            if (missing > worst && dist(o.x, h.x) <= def.support.radius) {
              pick = o; worst = missing;
            }
          }
          if (pick) pick.hp = Math.min(pick.maxHp, pick.hp + def.support.amount);
        } else if (def.support.effect === "slow_aura") {
          // Slow enemies in radius (mage at castle, so radius covers area in front of castle).
          for (const e of enemies) {
            if (e.dying) continue;
            // enemy.x in arena coords (0 = front of castle gate)
            if (e.x <= h.x + def.support.radius) {
              e.slowUntil = Math.max(e.slowUntil, now + 600);
            }
          }
        }
        // buff_aura already applied in Pass 1
      }
    } else if (def.role === "wall") {
      // Ranged shooter — fires a projectile toward the nearest living enemy in range.
      if (now < h.nextAttackAt) continue;
      const target = nearestEnemyInRange(enemies, h.x, def.range);
      if (target) {
        h.nextAttackAt = now + def.attackCdMs / Math.max(1, h.attackSpeedMul);
        result.newProjectiles.push({
          id: projectileId(),
          fromHeroId: h.id,
          x: h.x,
          startX: h.x,
          targetX: target.x,
          born: now,
          dmg: def.dmg,
          splash: def.id === "dwarf_cannon",
          color:
            def.id === "ice_mage" ? "#67e8f9" :
            def.id === "dwarf_cannon" ? "#fbbf24" :
            def.id === "rifleman" ? "#e5e7eb" :
            "#fde68a",
        });
      }
    } else if (def.role === "front") {
      // Melee — engages anything within range, otherwise walks forward (left, lower x).
      if (now < h.nextAttackAt) continue;
      const target = nearestEnemyInRange(enemies, h.x, def.range);
      if (target) {
        h.nextAttackAt = now + def.attackCdMs / Math.max(1, h.attackSpeedMul);
        target.hp -= def.dmg;
        target.hitFlashUntil = now + 180;
        if (target.hp <= 0) target.dying = true;
        // Front-line takes a small tick of damage while engaged.
        h.hp -= 0.6;
      } else {
        // March forward (toward enemies) up to a soft cap.
        const advance = 18 * dt; // px/sec
        h.x = Math.min(h.x + advance, 220);
      }
    }
  }

  // Pass 3: projectile travel + impact
  const PROJ_SPEED = 700; // px/sec
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    // Projectile moves toward decreasing x (enemy is to the left of castle in arena coords).
    const dir = p.targetX < p.x ? -1 : 1;
    p.x += dir * PROJ_SPEED * dt;

    const reached = (dir < 0 && p.x <= p.targetX) || (dir > 0 && p.x >= p.targetX);
    const traveledTooFar = Math.abs(p.x - p.startX) > 900;

    if (reached || traveledTooFar) {
      // Find nearest enemy to impact point
      let bestIdx = -1;
      let bestDist = 35;
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (e.dying) continue;
        const d = Math.abs(e.x - p.x);
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }
      if (bestIdx >= 0) {
        const e = enemies[bestIdx];
        e.hp -= p.dmg;
        e.hitFlashUntil = now + 200;
        if (e.hp <= 0) e.dying = true;
        if (p.splash) {
          for (const o of enemies) {
            if (o.id === e.id || o.dying) continue;
            if (Math.abs(o.x - e.x) < 90) {
              o.hp -= Math.max(1, Math.floor(p.dmg / 2));
              o.hitFlashUntil = now + 200;
              if (o.hp <= 0) o.dying = true;
            }
          }
        }
      }
      projectiles.splice(i, 1);
    }
  }

  // Remove expired heroes
  if (result.removedHeroIds.length) {
    const dead = new Set(result.removedHeroIds);
    for (let i = heroes.length - 1; i >= 0; i--) {
      if (dead.has(heroes[i].id)) heroes.splice(i, 1);
    }
  }

  return result;
}

function nearestEnemyInRange(enemies: EnemyLike[], fromX: number, range: number): EnemyLike | null {
  let best: EnemyLike | null = null;
  let bestD = Infinity;
  for (const e of enemies) {
    if (e.dying) continue;
    const d = Math.abs(e.x - fromX);
    if (d <= range && d < bestD) { best = e; bestD = d; }
  }
  return best;
}

export { HERO_ROSTER, HEROES_BY_ID, type HeroDef };
