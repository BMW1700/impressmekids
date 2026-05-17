/**
 * Castle Swarm Defense — enemy type definitions.
 * Each type has gameplay flags + visual config consumed by SwarmEnemySprite.tsx.
 */

export type EnemyType = "goblin" | "skeleton" | "orc" | "bat" | "shaman" | "armored_orc";

export interface EnemyTypeDef {
  id: EnemyType;
  baseHp: number;
  speedMul: number;        // multiplier on the wave's base speed
  castleDamage: number;    // hp damage when reaching castle
  ignoresSlow?: boolean;   // skeletons/armored resist ice
  flying?: boolean;        // bats pass through knights
  healsAllies?: boolean;   // shaman
  scale: number;           // visual size multiplier
  label: string;
}

export const ENEMY_TYPES: Record<EnemyType, EnemyTypeDef> = {
  goblin:       { id: "goblin",       baseHp: 1, speedMul: 1.0, castleDamage: 10, scale: 1.0, label: "Goblin" },
  skeleton:     { id: "skeleton",     baseHp: 3, speedMul: 1.0, castleDamage: 10, ignoresSlow: true, scale: 1.0, label: "Skeleton" },
  orc:          { id: "orc",          baseHp: 8, speedMul: 0.6, castleDamage: 25, scale: 1.45, label: "Orc Brute" },
  bat:          { id: "bat",          baseHp: 1, speedMul: 1.6, castleDamage: 8, flying: true, scale: 0.85, label: "Bat" },
  shaman:       { id: "shaman",       baseHp: 4, speedMul: 0.7, castleDamage: 10, healsAllies: true, scale: 1.1, label: "Shaman" },
  armored_orc:  { id: "armored_orc",  baseHp: 14, speedMul: 0.55, castleDamage: 30, ignoresSlow: true, scale: 1.55, label: "Armored Orc" },
};
