/**
 * Castle Swarm — summonable hero roster.
 *
 * Every hero has a ROLE that drives where it spawns and what it does:
 *   - wall    : ranged unit perched on the player's castle. Fires projectiles.
 *   - front   : melee unit that walks a short distance out from the castle gate.
 *   - support : non-combat unit that stays next to the castle and pulses an effect
 *               (heal castle hp, heal nearest hero, slow nearby enemies, etc.).
 *
 * Heroes are unlocked by:
 *   - "starter"  — always available
 *   - "campaign" — granted when the matching campaign level is cleared
 *   - "shop"     — purchasable from the in-arena store (coins for now; Crowns later)
 */
export type HeroRole = "wall" | "front" | "support";

export type HeroSupportEffect = "repair_castle" | "heal_hero" | "slow_aura" | "buff_aura";

export interface HeroDef {
  id: string;
  name: string;
  role: HeroRole;
  /** Coin cost to summon a single instance into the arena. */
  summonCost: number;
  /** Cooldown after summoning (ms) before this hero can be summoned again. */
  cooldownMs: number;
  /** Active lifetime in arena (ms). Heroes are temporary. */
  lifetimeMs: number;
  /** HP — front/wall heroes can be killed by enemies that reach them. */
  hp: number;
  /** Damage per attack (wall = per projectile, front = per swing). */
  dmg: number;
  /** Attack cadence in ms. */
  attackCdMs: number;
  /** Effective range, in arena px. Wall = projectile range, front = melee reach. */
  range: number;
  /** Support effect parameters (only used when role === "support"). */
  support?: {
    effect: HeroSupportEffect;
    amount: number;     // hp/sec, slow factor, etc.
    radius: number;     // effect radius in arena px
    pulseMs: number;    // how often the effect ticks
  };
  /** Where this hero comes from in unlock-flavor terms. */
  unlock:
    | { kind: "starter" }
    | { kind: "campaign"; description: string }
    | { kind: "shop"; price: number }; // coins
  /** Tagline shown in the summon bar / shop card. */
  blurb: string;
}

export const HERO_ROSTER: HeroDef[] = [
  // ---------- STARTERS ----------
  {
    id: "archer",
    name: "Archer",
    role: "wall",
    summonCost: 25,
    cooldownMs: 6000,
    lifetimeMs: 18000,
    hp: 4,
    dmg: 1,
    attackCdMs: 900,
    range: 520,
    unlock: { kind: "starter" },
    blurb: "Steady shot from the wall. Cheap and reliable.",
  },
  {
    id: "footman",
    name: "Footman",
    role: "front",
    summonCost: 35,
    cooldownMs: 7000,
    lifetimeMs: 16000,
    hp: 7,
    dmg: 2,
    attackCdMs: 700,
    range: 30,
    unlock: { kind: "starter" },
    blurb: "Marches out from the gate and holds the line.",
  },
  {
    id: "torch_bearer",
    name: "Torch Bearer",
    role: "support",
    summonCost: 30,
    cooldownMs: 9000,
    lifetimeMs: 14000,
    hp: 3,
    dmg: 0,
    attackCdMs: 0,
    range: 0,
    support: { effect: "buff_aura", amount: 0.25, radius: 140, pulseMs: 1000 },
    unlock: { kind: "starter" },
    blurb: "Aura: nearby heroes attack 25% faster.",
  },

  // ---------- CAMPAIGN UNLOCKS ----------
  {
    id: "shield_knight",
    name: "Shield Knight",
    role: "front",
    summonCost: 55,
    cooldownMs: 10000,
    lifetimeMs: 18000,
    hp: 14,
    dmg: 2,
    attackCdMs: 850,
    range: 32,
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 2" },
    blurb: "Soaks hits at the front while your wall picks them off.",
  },
  {
    id: "elven_archer",
    name: "Elven Archer",
    role: "wall",
    summonCost: 45,
    cooldownMs: 7000,
    lifetimeMs: 18000,
    hp: 4,
    dmg: 2,
    attackCdMs: 650,
    range: 620,
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 3" },
    blurb: "Faster, longer-range bowfire. Wall-only.",
  },
  {
    id: "repairman",
    name: "Repairman",
    role: "support",
    summonCost: 70,
    cooldownMs: 14000,
    lifetimeMs: 12000,
    hp: 3,
    dmg: 0,
    attackCdMs: 0,
    range: 0,
    support: { effect: "repair_castle", amount: 2, radius: 0, pulseMs: 1200 },
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 4" },
    blurb: "Patches the castle wall: +2 HP per tick.",
  },
  {
    id: "knight",
    name: "Knight",
    role: "front",
    summonCost: 80,
    cooldownMs: 12000,
    lifetimeMs: 18000,
    hp: 12,
    dmg: 4,
    attackCdMs: 700,
    range: 34,
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 5" },
    blurb: "Mounted heavy hitter. Carves through armored orcs.",
  },
  {
    id: "rifleman",
    name: "Rifleman",
    role: "wall",
    summonCost: 100,
    cooldownMs: 9000,
    lifetimeMs: 16000,
    hp: 4,
    dmg: 4,
    attackCdMs: 1100,
    range: 700,
    unlock: { kind: "campaign", description: "Clear Arc 2, Level 1" },
    blurb: "Slow rate, heavy punch. Pierces from the parapet.",
  },

  // ---------- SHOP-ONLY ----------
  {
    id: "ice_mage",
    name: "Ice Mage",
    role: "support",
    summonCost: 90,
    cooldownMs: 12000,
    lifetimeMs: 14000,
    hp: 3,
    dmg: 0,
    attackCdMs: 0,
    range: 0,
    support: { effect: "slow_aura", amount: 0.45, radius: 220, pulseMs: 800 },
    unlock: { kind: "shop", price: 600 },
    blurb: "Aura: slows nearby enemies to 45% speed.",
  },
  {
    id: "elven_healer",
    name: "Elven Healer",
    role: "support",
    summonCost: 75,
    cooldownMs: 11000,
    lifetimeMs: 14000,
    hp: 3,
    dmg: 0,
    attackCdMs: 0,
    range: 0,
    support: { effect: "heal_hero", amount: 1.5, radius: 200, pulseMs: 1000 },
    unlock: { kind: "shop", price: 500 },
    blurb: "Restores HP to the most wounded nearby hero.",
  },
  {
    id: "dwarf_cannon",
    name: "Dwarf Cannon",
    role: "wall",
    summonCost: 130,
    cooldownMs: 11000,
    lifetimeMs: 16000,
    hp: 5,
    dmg: 5,
    attackCdMs: 1500,
    range: 580,
    unlock: { kind: "shop", price: 800 },
    blurb: "Heavy shells. Splashes 3 enemies on hit.",
  },
  {
    id: "paladin",
    name: "Paladin",
    role: "front",
    summonCost: 140,
    cooldownMs: 16000,
    lifetimeMs: 20000,
    hp: 20,
    dmg: 5,
    attackCdMs: 750,
    range: 36,
    unlock: { kind: "shop", price: 900 },
    blurb: "Holy warrior. Massive HP and damage at the gate.",
  },
  {
    id: "giant",
    name: "Giant",
    role: "front",
    summonCost: 200,
    cooldownMs: 22000,
    lifetimeMs: 18000,
    hp: 30,
    dmg: 7,
    attackCdMs: 950,
    range: 40,
    unlock: { kind: "shop", price: 1500 },
    blurb: "Premium juggernaut. Crushes everything in melee.",
  },
];

export const HEROES_BY_ID: Record<string, HeroDef> = Object.fromEntries(
  HERO_ROSTER.map(h => [h.id, h])
);

export const STARTER_HERO_IDS = HERO_ROSTER.filter(h => h.unlock.kind === "starter").map(h => h.id);
export const CAMPAIGN_HERO_IDS = HERO_ROSTER.filter(h => h.unlock.kind === "campaign").map(h => h.id);
export const SHOP_HERO_IDS = HERO_ROSTER.filter(h => h.unlock.kind === "shop").map(h => h.id);
