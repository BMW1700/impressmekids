/**
 * Castle Swarm Defense — enemy type definitions.
 * Each type has gameplay flags + visual config consumed by SwarmEnemySprite.tsx.
 */

export type EnemyType =
  | "goblin"
  | "skeleton"
  | "orc"
  | "bat"
  | "shaman"
  | "armored_orc"
  // V2 — expanded roster for Phase 1 depth pass
  | "necromancer"   // summons a free skeleton every few seconds
  | "wyvern"        // very fast flyer, more damage than a bat
  | "berserker"     // moderate HP, +speed when low HP (rage)
  | "lich";         // boss-tier caster, high HP + heals allies in radius

export interface EnemyTypeDef {
  id: EnemyType;
  baseHp: number;
  speedMul: number;        // multiplier on the wave's base speed
  castleDamage: number;    // hp damage when reaching castle
  ignoresSlow?: boolean;   // skeletons/armored resist ice
  flying?: boolean;        // bats pass through knights
  healsAllies?: boolean;   // shaman / lich
  summonsAllies?: boolean; // necromancer
  ragesAtLowHp?: boolean;  // berserker — gains speed under 40% HP
  boss?: boolean;          // lich — bigger sprite, boss banner
  scale: number;           // visual size multiplier
  label: string;
}

export const ENEMY_TYPES: Record<EnemyType, EnemyTypeDef> = {
  goblin:       { id: "goblin",       baseHp: 1,  speedMul: 1.0,  castleDamage: 10, scale: 1.0, label: "Goblin" },
  skeleton:     { id: "skeleton",     baseHp: 3,  speedMul: 1.0,  castleDamage: 10, ignoresSlow: true, scale: 1.0, label: "Skeleton" },
  orc:          { id: "orc",          baseHp: 8,  speedMul: 0.6,  castleDamage: 25, scale: 1.45, label: "Orc Brute" },
  bat:          { id: "bat",          baseHp: 1,  speedMul: 1.6,  castleDamage: 8,  flying: true, scale: 0.85, label: "Bat" },
  shaman:       { id: "shaman",       baseHp: 4,  speedMul: 0.7,  castleDamage: 10, healsAllies: true, scale: 1.1, label: "Shaman" },
  armored_orc:  { id: "armored_orc",  baseHp: 14, speedMul: 0.55, castleDamage: 30, ignoresSlow: true, scale: 1.55, label: "Armored Orc" },
  necromancer:  { id: "necromancer",  baseHp: 6,  speedMul: 0.65, castleDamage: 15, summonsAllies: true, scale: 1.15, label: "Necromancer" },
  wyvern:       { id: "wyvern",       baseHp: 4,  speedMul: 1.8,  castleDamage: 18, flying: true, scale: 1.2, label: "Wyvern" },
  berserker:    { id: "berserker",    baseHp: 10, speedMul: 0.85, castleDamage: 22, ragesAtLowHp: true, scale: 1.3, label: "Berserker" },
  lich:         { id: "lich",         baseHp: 40, speedMul: 0.45, castleDamage: 60, healsAllies: true, ignoresSlow: true, boss: true, scale: 1.9, label: "Lich Lord" },
};
