/**
 * Castle Swarm — summonable hero roster.
 *
 * ECONOMY (v2):
 *   - `summonCost` is now MANA, earned in-match by reading words correctly.
 *   - `unlock.kind === "shop"` `price` is GOLD (persistent), spent in the upgrades panel.
 *   - Mana resets per match. Gold persists.
 *
 * ROLES:
 *   - wall    : ranged unit on the castle wall. Fires projectiles.
 *   - front   : melee unit that marches out from the gate.
 *   - support : pulses an effect near the castle (heal, slow, buff, repair).
 */
export type HeroRole = "wall" | "front" | "support";
export type HeroSupportEffect = "repair_castle" | "heal_hero" | "slow_aura" | "buff_aura";

export interface HeroDef {
  id: string;
  name: string;
  role: HeroRole;
  /** MANA cost to summon one instance into the arena. */
  summonCost: number;
  cooldownMs: number;
  lifetimeMs: number;
  hp: number;
  dmg: number;
  attackCdMs: number;
  range: number;
  support?: {
    effect: HeroSupportEffect;
    amount: number;
    radius: number;
    pulseMs: number;
  };
  unlock:
    | { kind: "starter" }
    | { kind: "campaign"; description: string }
    | { kind: "shop"; price: number }; // GOLD
  blurb: string;
}

export const HERO_ROSTER: HeroDef[] = [
  // ---------- STARTER (only one — earn the rest) ----------
  {
    id: "archer",
    name: "Archer",
    role: "wall",
    summonCost: 15,            // mana
    cooldownMs: 4500,
    lifetimeMs: 18000,
    hp: 4,
    dmg: 1,
    attackCdMs: 800,
    range: 900,                // wide range so it always finds a target
    unlock: { kind: "starter" },
    blurb: "Steady shot from the wall. Cheap and reliable.",
  },

  // ---------- CAMPAIGN UNLOCKS ----------
  {
    id: "footman",
    name: "Footman",
    role: "front",
    summonCost: 25,
    cooldownMs: 5500,
    lifetimeMs: 16000,
    hp: 8,
    dmg: 2,
    attackCdMs: 650,
    range: 60,
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 1" },
    blurb: "Marches out from the gate and holds the line.",
  },
  {
    id: "shield_knight",
    name: "Shield Knight",
    role: "front",
    summonCost: 40,
    cooldownMs: 8000,
    lifetimeMs: 18000,
    hp: 16,
    dmg: 2,
    attackCdMs: 800,
    range: 60,
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 2" },
    blurb: "Soaks hits at the front while your wall picks them off.",
  },
  {
    id: "elven_archer",
    name: "Elven Archer",
    role: "wall",
    summonCost: 35,
    cooldownMs: 6000,
    lifetimeMs: 18000,
    hp: 5,
    dmg: 2,
    attackCdMs: 600,
    range: 900,
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 3" },
    blurb: "Faster, harder-hitting bowfire from the wall.",
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
    support: { effect: "buff_aura", amount: 0.25, radius: 200, pulseMs: 1000 },
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 4" },
    blurb: "Aura: nearby heroes attack 25% faster.",
  },
  {
    id: "repairman",
    name: "Repairman",
    role: "support",
    summonCost: 55,
    cooldownMs: 12000,
    lifetimeMs: 12000,
    hp: 3,
    dmg: 0,
    attackCdMs: 0,
    range: 0,
    support: { effect: "repair_castle", amount: 2, radius: 0, pulseMs: 1100 },
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 4 (alt)" },
    blurb: "Patches the castle wall: +2 HP per tick.",
  },
  {
    id: "knight",
    name: "Knight",
    role: "front",
    summonCost: 65,
    cooldownMs: 10000,
    lifetimeMs: 18000,
    hp: 14,
    dmg: 4,
    attackCdMs: 650,
    range: 64,
    unlock: { kind: "campaign", description: "Clear Arc 1, Level 5" },
    blurb: "Mounted heavy hitter. Carves through armored orcs.",
  },
  {
    id: "rifleman",
    name: "Rifleman",
    role: "wall",
    summonCost: 70,
    cooldownMs: 8000,
    lifetimeMs: 16000,
    hp: 5,
    dmg: 4,
    attackCdMs: 1000,
    range: 900,
    unlock: { kind: "campaign", description: "Clear Arc 2, Level 1" },
    blurb: "Slow rate, heavy punch. Pierces from the parapet.",
  },

  // ---------- SHOP-ONLY (premium gold) ----------
  {
    id: "ice_mage",
    name: "Ice Mage",
    role: "support",
    summonCost: 60,
    cooldownMs: 11000,
    lifetimeMs: 14000,
    hp: 3,
    dmg: 0,
    attackCdMs: 0,
    range: 0,
    support: { effect: "slow_aura", amount: 0.45, radius: 320, pulseMs: 700 },
    unlock: { kind: "shop", price: 600 },
    blurb: "Aura: slows nearby enemies to 45% speed.",
  },
  {
    id: "elven_healer",
    name: "Elven Healer",
    role: "support",
    summonCost: 50,
    cooldownMs: 10000,
    lifetimeMs: 14000,
    hp: 3,
    dmg: 0,
    attackCdMs: 0,
    range: 0,
    support: { effect: "heal_hero", amount: 1.5, radius: 280, pulseMs: 900 },
    unlock: { kind: "shop", price: 500 },
    blurb: "Restores HP to the most wounded nearby hero.",
  },
  {
    id: "dwarf_cannon",
    name: "Dwarf Cannon",
    role: "wall",
    summonCost: 90,
    cooldownMs: 10000,
    lifetimeMs: 16000,
    hp: 6,
    dmg: 5,
    attackCdMs: 1300,
    range: 900,
    unlock: { kind: "shop", price: 800 },
    blurb: "Heavy shells. Splashes nearby enemies on hit.",
  },
  {
    id: "paladin",
    name: "Paladin",
    role: "front",
    summonCost: 110,
    cooldownMs: 14000,
    lifetimeMs: 20000,
    hp: 24,
    dmg: 5,
    attackCdMs: 700,
    range: 68,
    unlock: { kind: "shop", price: 900 },
    blurb: "Holy warrior. Massive HP and damage at the gate.",
  },
  {
    id: "giant",
    name: "Giant",
    role: "front",
    summonCost: 150,
    cooldownMs: 18000,
    lifetimeMs: 18000,
    hp: 36,
    dmg: 7,
    attackCdMs: 900,
    range: 72,
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
