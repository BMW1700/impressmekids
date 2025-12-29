// Game Economy System - Gold, XP, Store Items, and Power Management

export interface GameCurrency {
  gold: number;
  xp: number;
  power: number;
  maxPower: number;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'power' | 'skin' | 'potion' | 'upgrade';
  icon: string;
  effect?: string;
  value?: number;
  unlocked?: boolean;
}

export interface CoinDrop {
  id: string;
  x: number;
  y: number;
  amount: number;
  type: 'gold' | 'xp';
  collected: boolean;
}

// Calculate gold earned from various actions
export const calculateGoldEarned = (params: {
  wordCorrect?: boolean;
  streak?: number;
  wordLength?: number;
  enemyDefeated?: boolean;
  enemyType?: string;
  isPerfect?: boolean;
}): number => {
  let gold = 0;

  // Correct word: 2-5 gold based on length
  if (params.wordCorrect) {
    gold += Math.min(5, Math.max(2, Math.floor((params.wordLength || 4) / 2)));
    
    // Perfect word bonus (first try)
    if (params.isPerfect) {
      gold += 3;
    }
  }

  // Streak bonus: +1 gold per streak level
  if (params.streak && params.streak > 0) {
    gold += Math.floor(params.streak / 2);
  }

  // Enemy defeated: 50-200 gold based on type
  if (params.enemyDefeated) {
    switch (params.enemyType) {
      case 'minion': gold += 50; break;
      case 'guard': gold += 75; break;
      case 'elite': gold += 125; break;
      case 'boss': gold += 175; break;
      case 'final_boss': gold += 250; break;
      default: gold += 50;
    }
  }

  // Random bonus drop (5% chance)
  if (Math.random() < 0.05) {
    gold += Math.floor(10 + Math.random() * 40);
  }

  return gold;
};

// Calculate XP earned
export const calculateXpEarned = (params: {
  wordCorrect?: boolean;
  streak?: number;
  victory?: boolean;
  enemyType?: string;
  correctWords?: number;
  longestStreak?: number;
}): number => {
  let xp = 0;

  // Correct word: 5-15 XP
  if (params.wordCorrect) {
    xp += 5 + Math.floor(Math.random() * 10);
  }

  // Streak multiplier
  if (params.streak && params.streak > 0) {
    xp = Math.floor(xp * (1 + params.streak * 0.1));
  }

  // Victory XP: 100-500 based on performance
  if (params.victory) {
    const baseXp = 100;
    const wordBonus = (params.correctWords || 0) * 3;
    const streakBonus = (params.longestStreak || 0) * 8;
    
    switch (params.enemyType) {
      case 'minion': xp += baseXp + wordBonus + streakBonus; break;
      case 'guard': xp += baseXp * 1.5 + wordBonus + streakBonus; break;
      case 'elite': xp += baseXp * 2 + wordBonus + streakBonus; break;
      case 'boss': xp += baseXp * 3 + wordBonus + streakBonus; break;
      case 'final_boss': xp += baseXp * 5 + wordBonus + streakBonus; break;
      default: xp += baseXp + wordBonus + streakBonus;
    }
  }

  return Math.floor(xp);
};

// Calculate power gained from actions
export const calculatePowerGain = (params: {
  wordCorrect?: boolean;
  streak?: number;
  damage?: number;
}): number => {
  let power = 0;

  // Correct word: +10 power
  if (params.wordCorrect) {
    power += 10;
  }

  // Streak bonuses
  if (params.streak) {
    if (params.streak >= 5) power += 10;
    else if (params.streak >= 3) power += 5;
  }

  // Damage dealt bonus
  if (params.damage && params.damage > 20) {
    power += 5;
  }

  return power;
};

// Power costs for abilities
export const POWER_COSTS = {
  fireball: 30,
  ice_shard: 25,
  lightning: 50,
  word_nova: 100, // Ultimate
  healing_aura: 40,
  fire_storm: 60,
};

// Store items
export const STORE_ITEMS: StoreItem[] = [
  // Powers
  {
    id: 'fire_storm',
    name: 'Fire Storm',
    description: 'AoE fire attack that hits all enemies',
    price: 500,
    category: 'power',
    icon: '🔥',
    effect: 'fire',
    value: 50,
  },
  {
    id: 'healing_aura',
    name: 'Healing Aura',
    description: 'Regenerate HP while reading',
    price: 300,
    category: 'power',
    icon: '💚',
    effect: 'heal',
    value: 5,
  },
  {
    id: 'ice_storm',
    name: 'Blizzard',
    description: 'Freeze enemies and slow their attacks',
    price: 450,
    category: 'power',
    icon: '❄️',
    effect: 'ice',
    value: 40,
  },
  {
    id: 'thunder_god',
    name: 'Thunder God',
    description: 'Chain lightning that jumps between words',
    price: 600,
    category: 'power',
    icon: '⚡',
    effect: 'lightning',
    value: 60,
  },
  
  // Skins
  {
    id: 'golden_knight',
    name: 'Golden Knight',
    description: 'Shiny golden armor for Sir Valor',
    price: 1000,
    category: 'skin',
    icon: '👑',
  },
  {
    id: 'shadow_wizard',
    name: 'Shadow Wizard',
    description: 'Dark mystical robes for Elara',
    price: 800,
    category: 'skin',
    icon: '🌙',
  },
  {
    id: 'crystal_knight',
    name: 'Crystal Knight',
    description: 'Crystalline armor with particle effects',
    price: 1200,
    category: 'skin',
    icon: '💎',
  },
  
  // Potions
  {
    id: 'mega_health',
    name: 'Mega Health Potion',
    description: 'Fully restore HP',
    price: 150,
    category: 'potion',
    icon: '🧪',
    effect: 'heal_hp',
    value: 100,
  },
  {
    id: 'mana_surge',
    name: 'Mana Surge',
    description: 'Fully restore MP',
    price: 120,
    category: 'potion',
    icon: '💧',
    effect: 'restore_mp',
    value: 50,
  },
  {
    id: 'double_xp',
    name: 'Double XP Elixir',
    description: '2x XP for one battle',
    price: 200,
    category: 'potion',
    icon: '⭐',
    effect: 'double_xp',
    value: 2,
  },
  
  // Upgrades
  {
    id: 'attack_boost',
    name: 'Sharpened Blade',
    description: '+20% damage permanently',
    price: 800,
    category: 'upgrade',
    icon: '⚔️',
    effect: 'attack_boost',
    value: 20,
  },
  {
    id: 'health_boost',
    name: 'Iron Constitution',
    description: '+25 max HP permanently',
    price: 600,
    category: 'upgrade',
    icon: '❤️',
    effect: 'health_boost',
    value: 25,
  },
  {
    id: 'streak_boost',
    name: 'Focus Mastery',
    description: '+50% streak bonus damage',
    price: 700,
    category: 'upgrade',
    icon: '🔥',
    effect: 'streak_boost',
    value: 50,
  },
];

// Generate coin drops from enemy
export const generateCoinDrops = (
  sourceX: number, 
  sourceY: number, 
  goldAmount: number,
  xpAmount: number
): CoinDrop[] => {
  const drops: CoinDrop[] = [];
  
  // Gold coins
  const goldCoins = Math.min(10, Math.floor(goldAmount / 5));
  for (let i = 0; i < goldCoins; i++) {
    drops.push({
      id: `gold-${Date.now()}-${i}`,
      x: sourceX + (Math.random() - 0.5) * 100,
      y: sourceY + (Math.random() - 0.5) * 50,
      amount: Math.floor(goldAmount / goldCoins),
      type: 'gold',
      collected: false,
    });
  }
  
  // XP stars
  const xpStars = Math.min(5, Math.floor(xpAmount / 20));
  for (let i = 0; i < xpStars; i++) {
    drops.push({
      id: `xp-${Date.now()}-${i}`,
      x: sourceX + (Math.random() - 0.5) * 80,
      y: sourceY + (Math.random() - 0.5) * 40,
      amount: Math.floor(xpAmount / xpStars),
      type: 'xp',
      collected: false,
    });
  }
  
  return drops;
};

// Initialize default currency
export const getInitialCurrency = (): GameCurrency => ({
  gold: 0,
  xp: 0,
  power: 0,
  maxPower: 100,
});
