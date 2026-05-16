/**
 * Castle Swarm Defense — enemy type definitions.
 * Each type has gameplay flags + visual config consumed by SwarmEnemy.tsx.
 */

export type EnemyType = "goblin" | "skeleton" | "orc" | "bat" | "shaman";

export interface EnemyTypeDef {
  id: EnemyType;
  baseHp: number;
  speedMul: number;        // multiplier on the wave's base speed
  castleDamage: number;    // hp damage when reaching castle
  ignoresSlow?: boolean;   // skeletons resist ice
  flying?: boolean;        // bats pass through knights
  healsAllies?: boolean;   // shaman
  scale: number;           // visual size multiplier
  /** Tailwind tint colors for tint overlay */
  tint: string;
  label: string;
  emoji: string;
}

export const ENEMY_TYPES: Record<EnemyType, EnemyTypeDef> = {
  goblin: {
    id: "goblin",
    baseHp: 1,
    speedMul: 1.0,
    castleDamage: 10,
    scale: 1.0,
    tint: "hue-rotate-0",
    label: "Goblin",
    emoji: "👺",
  },
  skeleton: {
    id: "skeleton",
    baseHp: 2,
    speedMul: 1.0,
    castleDamage: 10,
    ignoresSlow: true,
    scale: 1.0,
    tint: "grayscale brightness-150",
    label: "Skeleton",
    emoji: "💀",
  },
  orc: {
    id: "orc",
    baseHp: 6,
    speedMul: 0.6,
    castleDamage: 25,
    scale: 1.4,
    tint: "hue-rotate-[320deg] saturate-150",
    label: "Orc Brute",
    emoji: "👹",
  },
  bat: {
    id: "bat",
    baseHp: 1,
    speedMul: 1.6,
    castleDamage: 8,
    flying: true,
    scale: 0.8,
    tint: "brightness-50 contrast-150",
    label: "Bat",
    emoji: "🦇",
  },
  shaman: {
    id: "shaman",
    baseHp: 3,
    speedMul: 0.7,
    castleDamage: 10,
    healsAllies: true,
    scale: 1.1,
    tint: "hue-rotate-[270deg]",
    label: "Goblin Shaman",
    emoji: "🧙‍♂️",
  },
};
