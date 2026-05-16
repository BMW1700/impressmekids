// Pet Companion System Data
// Pets are purchased from the store and provide passive bonuses + auto-attack in battle

export interface Pet {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number; // Gold cost to purchase
  baseBonus: {
    type: 'streak_bonus' | 'gold_bonus' | 'xp_bonus' | 'damage_bonus' | 'defense_bonus';
    value: number; // Percentage bonus
    label: string;
  };
  maxLevel: number;
  feedCost: number;
  xpPerLevel: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  gradient: string; // Tailwind gradient classes
  bodyColor: string; // hex - primary body color for visual
  accentColor: string; // hex - accent color for visual
  attack: {
    name: string;
    emoji: string; // Projectile emoji
    color: string; // hex - effect color
    damage: number; // Base damage per pet attack at level 1
    chargeWords: number; // Number of correct words needed to charge
  };
}

export const PETS: Pet[] = [
  {
    id: 'baby_dragon',
    name: 'Ember',
    emoji: '🐲',
    description: 'A playful baby dragon who breathes tiny flames.',
    price: 400,
    baseBonus: { type: 'streak_bonus', value: 5, label: '+5% streak bonus' },
    maxLevel: 10, feedCost: 10, xpPerLevel: 100,
    rarity: 'common',
    gradient: 'from-orange-500 to-red-400',
    bodyColor: '#f97316', accentColor: '#fbbf24',
    attack: { name: 'Fire Breath', emoji: '🔥', color: '#f97316', damage: 12, chargeWords: 5 },
  },
  {
    id: 'wise_owl',
    name: 'Athena',
    emoji: '🦉',
    description: 'A wise owl who strikes with focused beams of knowledge.',
    price: 600,
    baseBonus: { type: 'xp_bonus', value: 10, label: '+10% XP gain' },
    maxLevel: 10, feedCost: 15, xpPerLevel: 120,
    rarity: 'uncommon',
    gradient: 'from-purple-500 to-indigo-400',
    bodyColor: '#8b5cf6', accentColor: '#fef3c7',
    attack: { name: 'Focus Beam', emoji: '✨', color: '#a78bfa', damage: 14, chargeWords: 5 },
  },
  {
    id: 'lucky_cat',
    name: 'Fortune',
    emoji: '🐱',
    description: 'A lucky cat that hurls coins at enemies.',
    price: 800,
    baseBonus: { type: 'gold_bonus', value: 15, label: '+15% gold earned' },
    maxLevel: 10, feedCost: 20, xpPerLevel: 140,
    rarity: 'uncommon',
    gradient: 'from-yellow-500 to-amber-400',
    bodyColor: '#fbbf24', accentColor: '#fde68a',
    attack: { name: 'Coin Strike', emoji: '🪙', color: '#fbbf24', damage: 13, chargeWords: 5 },
  },
  {
    id: 'brave_lion',
    name: 'Leo',
    emoji: '🦁',
    description: 'A brave lion whose roar shakes the battlefield.',
    price: 1200,
    baseBonus: { type: 'damage_bonus', value: 10, label: '+10% damage' },
    maxLevel: 10, feedCost: 25, xpPerLevel: 160,
    rarity: 'rare',
    gradient: 'from-amber-500 to-orange-400',
    bodyColor: '#d97706', accentColor: '#fde68a',
    attack: { name: 'Roar', emoji: '💢', color: '#f59e0b', damage: 18, chargeWords: 6 },
  },
  {
    id: 'guardian_turtle',
    name: 'Shell',
    emoji: '🐢',
    description: 'A sturdy turtle who slams enemies with its shell.',
    price: 1200,
    baseBonus: { type: 'defense_bonus', value: 15, label: '+15% defense' },
    maxLevel: 10, feedCost: 25, xpPerLevel: 160,
    rarity: 'rare',
    gradient: 'from-teal-500 to-emerald-400',
    bodyColor: '#14b8a6', accentColor: '#a7f3d0',
    attack: { name: 'Shell Bash', emoji: '🛡️', color: '#14b8a6', damage: 16, chargeWords: 6 },
  },
  {
    id: 'phoenix',
    name: 'Blaze',
    emoji: '🔥',
    description: 'A legendary phoenix that engulfs foes in cleansing fire.',
    price: 2500,
    baseBonus: { type: 'streak_bonus', value: 20, label: '+20% streak bonus' },
    maxLevel: 15, feedCost: 50, xpPerLevel: 200,
    rarity: 'epic',
    gradient: 'from-red-500 to-orange-400',
    bodyColor: '#ef4444', accentColor: '#fed7aa',
    attack: { name: 'Phoenix Flare', emoji: '🔥', color: '#ef4444', damage: 24, chargeWords: 6 },
  },
  {
    id: 'crystal_unicorn',
    name: 'Sparkle',
    emoji: '🦄',
    description: 'A magical unicorn that fires rainbow prism beams.',
    price: 2500,
    baseBonus: { type: 'xp_bonus', value: 25, label: '+25% XP gain' },
    maxLevel: 15, feedCost: 50, xpPerLevel: 200,
    rarity: 'epic',
    gradient: 'from-pink-500 to-purple-400',
    bodyColor: '#ec4899', accentColor: '#e9d5ff',
    attack: { name: 'Prism Beam', emoji: '🌈', color: '#ec4899', damage: 22, chargeWords: 6 },
  },
  {
    id: 'ice_wolf',
    name: 'Frost',
    emoji: '🐺',
    description: 'An ancient wolf whose bite freezes enemies solid.',
    price: 3500,
    baseBonus: { type: 'damage_bonus', value: 20, label: '+20% damage' },
    maxLevel: 15, feedCost: 75, xpPerLevel: 250,
    rarity: 'epic',
    gradient: 'from-cyan-500 to-blue-400',
    bodyColor: '#06b6d4', accentColor: '#e0f2fe',
    attack: { name: 'Frost Bite', emoji: '❄️', color: '#06b6d4', damage: 26, chargeWords: 7 },
  },
  {
    id: 'golden_dragon',
    name: 'Aurum',
    emoji: '🐉',
    description: 'The legendary golden dragon. Breath of pure radiance.',
    price: 5000,
    baseBonus: { type: 'gold_bonus', value: 30, label: '+30% gold earned' },
    maxLevel: 20, feedCost: 100, xpPerLevel: 300,
    rarity: 'legendary',
    gradient: 'from-yellow-400 to-amber-300',
    bodyColor: '#fbbf24', accentColor: '#fef3c7',
    attack: { name: 'Golden Breath', emoji: '☀️', color: '#fbbf24', damage: 35, chargeWords: 7 },
  },
];

export const getPetById = (id: string): Pet | undefined => PETS.find(p => p.id === id);
export const getPetsByRarity = (rarity: Pet['rarity']): Pet[] => PETS.filter(p => p.rarity === rarity);

export const calculatePetBonus = (pet: Pet, level: number): number => {
  const levelMultiplier = 1 + ((level - 1) * 0.1);
  return Math.round(pet.baseBonus.value * levelMultiplier);
};

export const calculatePetAttackDamage = (pet: Pet, level: number): number => {
  // Each level adds 10% of base attack damage
  return Math.round(pet.attack.damage * (1 + (level - 1) * 0.1));
};

export const getXpToNextLevel = (pet: Pet, currentLevel: number, currentXp: number): number => {
  const xpNeeded = currentLevel * pet.xpPerLevel;
  return Math.max(0, xpNeeded - currentXp);
};

export const canLevelUp = (pet: Pet, currentLevel: number, currentXp: number): boolean => {
  if (currentLevel >= pet.maxLevel) return false;
  return currentXp >= currentLevel * pet.xpPerLevel;
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
