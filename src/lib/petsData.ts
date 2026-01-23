// Pet Companion System Data
// Pets are unlocked through world progression and provide passive bonuses

import { Heart, Flame, Zap, Shield, Star, Sparkles, Crown, Mountain, Snowflake } from "lucide-react";

export interface Pet {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockCondition: {
    type: 'world' | 'achievement' | 'purchase' | 'special';
    value: string | number;
  };
  baseBonus: {
    type: 'streak_bonus' | 'gold_bonus' | 'xp_bonus' | 'damage_bonus' | 'defense_bonus';
    value: number; // Percentage bonus
    label: string;
  };
  maxLevel: number;
  feedCost: number; // Gold to feed
  xpPerLevel: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  gradient: string;
}

export const PETS: Pet[] = [
  {
    id: 'baby_dragon',
    name: 'Ember',
    emoji: '🐲',
    description: 'A playful baby dragon who loves watching you read!',
    unlockCondition: { type: 'world', value: 1 },
    baseBonus: { type: 'streak_bonus', value: 5, label: '+5% streak bonus' },
    maxLevel: 10,
    feedCost: 10,
    xpPerLevel: 100,
    rarity: 'common',
    gradient: 'from-orange-500 to-red-400',
  },
  {
    id: 'wise_owl',
    name: 'Athena',
    emoji: '🦉',
    description: 'A wise owl who helps you learn new words.',
    unlockCondition: { type: 'world', value: 2 },
    baseBonus: { type: 'xp_bonus', value: 10, label: '+10% XP gain' },
    maxLevel: 10,
    feedCost: 15,
    xpPerLevel: 120,
    rarity: 'uncommon',
    gradient: 'from-purple-500 to-indigo-400',
  },
  {
    id: 'lucky_cat',
    name: 'Fortune',
    emoji: '🐱',
    description: 'A lucky cat that attracts gold coins!',
    unlockCondition: { type: 'world', value: 3 },
    baseBonus: { type: 'gold_bonus', value: 15, label: '+15% gold earned' },
    maxLevel: 10,
    feedCost: 20,
    xpPerLevel: 140,
    rarity: 'uncommon',
    gradient: 'from-yellow-500 to-amber-400',
  },
  {
    id: 'brave_lion',
    name: 'Leo',
    emoji: '🦁',
    description: 'A brave lion that boosts your attack power!',
    unlockCondition: { type: 'world', value: 4 },
    baseBonus: { type: 'damage_bonus', value: 10, label: '+10% damage' },
    maxLevel: 10,
    feedCost: 25,
    xpPerLevel: 160,
    rarity: 'rare',
    gradient: 'from-amber-500 to-orange-400',
  },
  {
    id: 'guardian_turtle',
    name: 'Shell',
    emoji: '🐢',
    description: 'A sturdy turtle that provides extra protection!',
    unlockCondition: { type: 'world', value: 5 },
    baseBonus: { type: 'defense_bonus', value: 15, label: '+15% defense' },
    maxLevel: 10,
    feedCost: 25,
    xpPerLevel: 160,
    rarity: 'rare',
    gradient: 'from-teal-500 to-emerald-400',
  },
  {
    id: 'phoenix',
    name: 'Blaze',
    emoji: '🔥',
    description: 'A legendary phoenix with incredible powers!',
    unlockCondition: { type: 'world', value: 6 },
    baseBonus: { type: 'streak_bonus', value: 20, label: '+20% streak bonus' },
    maxLevel: 15,
    feedCost: 50,
    xpPerLevel: 200,
    rarity: 'epic',
    gradient: 'from-red-500 to-orange-400',
  },
  {
    id: 'crystal_unicorn',
    name: 'Sparkle',
    emoji: '🦄',
    description: 'A magical unicorn that enhances all rewards!',
    unlockCondition: { type: 'world', value: 7 },
    baseBonus: { type: 'xp_bonus', value: 25, label: '+25% XP gain' },
    maxLevel: 15,
    feedCost: 50,
    xpPerLevel: 200,
    rarity: 'epic',
    gradient: 'from-pink-500 to-purple-400',
  },
  {
    id: 'ice_wolf',
    name: 'Frost',
    emoji: '🐺',
    description: 'An ancient ice wolf with freezing powers!',
    unlockCondition: { type: 'world', value: 8 },
    baseBonus: { type: 'damage_bonus', value: 20, label: '+20% damage' },
    maxLevel: 15,
    feedCost: 75,
    xpPerLevel: 250,
    rarity: 'epic',
    gradient: 'from-cyan-500 to-blue-400',
  },
  {
    id: 'golden_dragon',
    name: 'Aurum',
    emoji: '🐉',
    description: 'The legendary golden dragon! Master of all elements!',
    unlockCondition: { type: 'world', value: 9 },
    baseBonus: { type: 'gold_bonus', value: 30, label: '+30% gold earned' },
    maxLevel: 20,
    feedCost: 100,
    xpPerLevel: 300,
    rarity: 'legendary',
    gradient: 'from-yellow-400 to-amber-300',
  },
];

export const getPetById = (id: string): Pet | undefined => {
  return PETS.find(p => p.id === id);
};

export const getPetsByRarity = (rarity: Pet['rarity']): Pet[] => {
  return PETS.filter(p => p.rarity === rarity);
};

export const getPetUnlockableForWorld = (worldId: number): Pet | undefined => {
  return PETS.find(p => p.unlockCondition.type === 'world' && p.unlockCondition.value === worldId);
};

export const calculatePetBonus = (pet: Pet, level: number): number => {
  // Each level adds 10% of base bonus
  const levelMultiplier = 1 + ((level - 1) * 0.1);
  return Math.round(pet.baseBonus.value * levelMultiplier);
};

export const getXpToNextLevel = (pet: Pet, currentLevel: number, currentXp: number): number => {
  const xpNeeded = currentLevel * pet.xpPerLevel;
  return Math.max(0, xpNeeded - currentXp);
};

export const canLevelUp = (pet: Pet, currentLevel: number, currentXp: number): boolean => {
  if (currentLevel >= pet.maxLevel) return false;
  const xpNeeded = currentLevel * pet.xpPerLevel;
  return currentXp >= xpNeeded;
};

export const getRarityGlow = (rarity: Pet['rarity']): string => {
  switch (rarity) {
    case 'common': return '';
    case 'uncommon': return 'shadow-[0_0_15px_rgba(34,197,94,0.3)]';
    case 'rare': return 'shadow-[0_0_20px_rgba(59,130,246,0.4)]';
    case 'epic': return 'shadow-[0_0_25px_rgba(139,92,246,0.5)]';
    case 'legendary': return 'shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse';
  }
};
