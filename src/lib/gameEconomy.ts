// Game Economy System - Gold, XP, Store Items, and Power Management

export interface GameCurrency {
  gold: number;
  xp: number;
  power: number;
  maxPower: number;
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type SkinCharacter = 'valor' | 'elara' | 'ella' | 'agent_x' | 'cipher' | 'shadow';
export type ItemTheme = 'classic' | 'agent' | 'shared';

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
  rarity: ItemRarity;
  character?: SkinCharacter;
  skinVariant?: string;
  theme?: ItemTheme; // 'classic', 'agent', or 'shared' (default shared for potions/upgrades)
  /**
   * Visual art tier for skins. 'svg' = the original hand-drawn vector character,
   * 'video' = the new flushed-out realistic video character.
   * Undefined → treated as 'svg' (historical default).
   */
  artStyle?: 'svg' | 'video';
}

export interface CoinDrop {
  id: string;
  x: number;
  y: number;
  amount: number;
  type: 'gold' | 'xp';
  collected: boolean;
}

// Rarity colors for UI
export const RARITY_COLORS: Record<ItemRarity, { border: string; bg: string; text: string }> = {
  common: { border: 'border-slate-500', bg: 'from-slate-600/20 to-slate-700/20', text: 'text-slate-400' },
  rare: { border: 'border-blue-500', bg: 'from-blue-600/20 to-blue-700/20', text: 'text-blue-400' },
  epic: { border: 'border-purple-500', bg: 'from-purple-600/20 to-purple-700/20', text: 'text-purple-400' },
  legendary: { border: 'border-amber-500', bg: 'from-amber-600/20 to-amber-700/20', text: 'text-amber-400' },
};

// Calculate gold earned from various actions
// UPDATED: Random 30% drop chance for word gold (instead of every word)
export const calculateGoldEarned = (params: {
  wordCorrect?: boolean;
  streak?: number;
  wordLength?: number;
  enemyDefeated?: boolean;
  enemyType?: string;
  isPerfect?: boolean;
  goldBoostPercent?: number;
}): number => {
  let gold = 0;

  // RANDOM COIN DROP: 30% chance on correct word (makes coins exciting!)
  if (params.wordCorrect) {
    if (Math.random() < 0.30) { // 30% drop chance
      // Bigger rewards when you DO get coins: 3-8 gold based on word length
      gold += Math.min(8, Math.max(3, Math.floor((params.wordLength || 4) / 2) + 2));
      
      // Streak bonus on drops: +1-3 gold for hot streaks
      if (params.streak && params.streak >= 5) {
        gold += Math.min(3, Math.floor(params.streak / 4));
      }
    }
    
    // Perfect word bonus (first try) - ALWAYS awarded
    if (params.isPerfect) {
      gold += 3;
    }
  }

  // Enemy defeated: 50-250 gold based on type (GUARANTEED)
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

  // Rare jackpot drop (3% chance for big bonus)
  if (Math.random() < 0.03) {
    gold += Math.floor(15 + Math.random() * 35);
  }

  // Apply gold boost from upgrades
  if (params.goldBoostPercent && params.goldBoostPercent > 0) {
    gold = Math.floor(gold * (1 + params.goldBoostPercent / 100));
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
  xpBoostPercent?: number;
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

  // Apply XP boost from upgrades
  if (params.xpBoostPercent && params.xpBoostPercent > 0) {
    xp = Math.floor(xp * (1 + params.xpBoostPercent / 100));
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
  earthquake: 50,
  holy_light: 35,
  shadow_bolt: 40,
  nature_grasp: 30,
  wind_slash: 25,
  arcane_blast: 70,
  time_stop: 80,
};

// Store items - EXPANDED with 20+ items
export const STORE_ITEMS: StoreItem[] = [
  // =============== POWERS ===============
  {
    id: 'fire_storm',
    name: 'Fire Storm',
    description: 'AoE fire attack that hits all enemies',
    price: 500,
    category: 'power',
    icon: '🔥',
    effect: 'fire',
    value: 50,
    rarity: 'epic',
    theme: 'classic',
  },
  {
    id: 'healing_aura', name: 'Healing Aura', description: 'Regenerate HP while reading',
    price: 300, category: 'power', icon: '💚', effect: 'heal', value: 5, rarity: 'rare', theme: 'classic',
  },
  {
    id: 'ice_storm', name: 'Blizzard', description: 'Freeze enemies and slow their attacks',
    price: 450, category: 'power', icon: '❄️', effect: 'ice', value: 40, rarity: 'epic', theme: 'classic',
  },
  {
    id: 'thunder_god', name: 'Thunder God', description: 'Chain lightning that jumps between words',
    price: 600, category: 'power', icon: '⚡', effect: 'lightning', value: 60, rarity: 'epic', theme: 'classic',
  },
  {
    id: 'earthquake', name: 'Earthquake', description: 'Ground-shaking AoE damage',
    price: 400, category: 'power', icon: '🌋', effect: 'earth', value: 35, rarity: 'rare', theme: 'classic',
  },
  {
    id: 'holy_light', name: 'Holy Light', description: 'Divine damage + heal self for 15 HP',
    price: 350, category: 'power', icon: '✨', effect: 'holy', value: 25, rarity: 'rare', theme: 'classic',
  },
  {
    id: 'shadow_bolt', name: 'Shadow Bolt', description: 'Piercing dark damage that ignores armor',
    price: 300, category: 'power', icon: '🌑', effect: 'shadow', value: 30, rarity: 'rare', theme: 'classic',
  },
  {
    id: 'nature_grasp', name: "Nature's Grasp", description: 'Vines slow enemy + deal damage over time',
    price: 275, category: 'power', icon: '🌿', effect: 'nature', value: 20, rarity: 'common', theme: 'classic',
  },
  {
    id: 'wind_slash', name: 'Wind Slash', description: 'Fast multi-hit attack (15 damage x3)',
    price: 350, category: 'power', icon: '💨', effect: 'wind', value: 15, rarity: 'rare', theme: 'classic',
  },
  {
    id: 'arcane_blast', name: 'Arcane Blast', description: 'Pure magic damage that ignores all defense',
    price: 550, category: 'power', icon: '💜', effect: 'arcane', value: 55, rarity: 'epic', theme: 'classic',
  },
  {
    id: 'time_stop', name: 'Time Warp', description: 'Skip the enemy turn completely',
    price: 700, category: 'power', icon: '⏱️', effect: 'time', value: 0, rarity: 'legendary', theme: 'classic',
  },
  {
    id: 'word_nova', name: 'Word Nova', description: 'Ultimate attack - massive 150 damage',
    price: 1000, category: 'power', icon: '💫', effect: 'nova', value: 150, rarity: 'legendary', theme: 'classic',
  },

  // =============== AGENT POWERS ===============
  {
    id: 'emp_blast', name: 'EMP Blast', description: 'Electromagnetic pulse disables enemy shields',
    price: 500, category: 'power', icon: '📡', effect: 'emp', value: 50, rarity: 'epic', theme: 'agent',
  },
  {
    id: 'drone_strike', name: 'Drone Strike', description: 'Call in an aerial drone for precision damage',
    price: 600, category: 'power', icon: '🛸', effect: 'drone', value: 60, rarity: 'epic', theme: 'agent',
  },
  {
    id: 'system_override', name: 'System Override', description: 'Hack enemy systems, skip their turn',
    price: 700, category: 'power', icon: '💻', effect: 'hack', value: 0, rarity: 'legendary', theme: 'agent',
  },
  {
    id: 'data_wipe', name: 'Data Wipe', description: 'Corrupts enemy data — massive 150 damage',
    price: 1000, category: 'power', icon: '🗑️', effect: 'data_wipe', value: 150, rarity: 'legendary', theme: 'agent',
  },
  {
    id: 'nano_repair', name: 'Nano Repair', description: 'Nanobots regenerate HP while reading',
    price: 300, category: 'power', icon: '🔬', effect: 'heal', value: 5, rarity: 'rare', theme: 'agent',
  },
  {
    id: 'flash_grenade', name: 'Flash Grenade', description: 'Blinds enemy, reducing their accuracy',
    price: 275, category: 'power', icon: '💥', effect: 'flash', value: 20, rarity: 'common', theme: 'agent',
  },
  {
    id: 'cyber_shield', name: 'Cyber Shield', description: 'Deploys a digital barrier absorbing damage',
    price: 350, category: 'power', icon: '🛡️', effect: 'shield', value: 30, rarity: 'rare', theme: 'agent',
  },
  {
    id: 'signal_jammer', name: 'Signal Jammer', description: 'Disrupts enemy comms — AoE damage',
    price: 450, category: 'power', icon: '📶', effect: 'jam', value: 40, rarity: 'epic', theme: 'agent',
  },
  {
    id: 'plasma_cannon', name: 'Plasma Cannon', description: 'High-energy plasma blast (15 dmg x3)',
    price: 350, category: 'power', icon: '🔫', effect: 'plasma', value: 15, rarity: 'rare', theme: 'agent',
  },
  {
    id: 'neural_link', name: 'Neural Link', description: 'Direct brain hack ignores all defenses',
    price: 550, category: 'power', icon: '🧠', effect: 'neural', value: 55, rarity: 'epic', theme: 'agent',
  },
  
  // =============== DEFAULT SKINS (free, always owned) ===============
  {
    id: 'default_valor', name: 'Classic Knight', description: 'The original hand-drawn Sir Valor',
    price: 0, category: 'skin', icon: '⚔️', rarity: 'common', character: 'valor', skinVariant: 'default', theme: 'classic', artStyle: 'svg',
  },
  {
    id: 'realistic_valor', name: 'Sir Valor (Realistic)', description: 'The new flushed-out animated Sir Valor',
    price: 0, category: 'skin', icon: '🛡️', rarity: 'rare', character: 'valor', skinVariant: 'realistic_default', theme: 'classic', artStyle: 'video',
  },
  {
    id: 'default_elara', name: 'Classic Wizard', description: 'The original Elara look',
    price: 0, category: 'skin', icon: '🔮', rarity: 'common', character: 'elara', skinVariant: 'default', theme: 'classic', artStyle: 'svg',
  },
  {
    id: 'default_ella', name: 'Classic Princess', description: 'The original Princess Ella look',
    price: 0, category: 'skin', icon: '👸', rarity: 'common', character: 'ella', skinVariant: 'default', theme: 'classic', artStyle: 'svg',
  },
  {
    id: 'default_agent_x', name: 'Classic Agent X', description: 'Standard field operative gear',
    price: 0, category: 'skin', icon: '🕴️', rarity: 'common', character: 'agent_x', skinVariant: 'default', theme: 'agent',
  },
  {
    id: 'default_cipher', name: 'Classic Cipher', description: 'Standard tech specialist outfit',
    price: 0, category: 'skin', icon: '💻', rarity: 'common', character: 'cipher', skinVariant: 'default', theme: 'agent',
  },
  {
    id: 'default_shadow', name: 'Classic Shadow', description: 'Standard infiltrator suit',
    price: 0, category: 'skin', icon: '🥷', rarity: 'common', character: 'shadow', skinVariant: 'default', theme: 'agent',
  },

  // =============== SKINS - SIR VALOR (classic SVG art tier) ===============
  {
    id: 'golden_knight', name: 'Golden Knight', description: 'Shiny golden armor for Sir Valor',
    price: 1000, category: 'skin', icon: '👑', rarity: 'legendary', character: 'valor', skinVariant: 'golden', theme: 'classic', artStyle: 'svg',
  },
  {
    id: 'crystal_knight', name: 'Crystal Knight', description: 'Crystalline armor with particle effects',
    price: 800, category: 'skin', icon: '💎', rarity: 'epic', character: 'valor', skinVariant: 'crystal', theme: 'classic', artStyle: 'svg',
  },
  {
    id: 'flame_knight', name: 'Flame Knight', description: 'Burning armor wreathed in flames',
    price: 900, category: 'skin', icon: '🔥', rarity: 'epic', character: 'valor', skinVariant: 'flame', theme: 'classic', artStyle: 'svg',
  },
  {
    id: 'ice_knight', name: 'Frost Guardian', description: 'Frozen armor of the north',
    price: 950, category: 'skin', icon: '🧊', rarity: 'epic', character: 'valor', skinVariant: 'ice', theme: 'classic', artStyle: 'svg',
  },
  {
    id: 'dragon_slayer', name: 'Dragon Slayer', description: 'Legendary dragon-scale armor',
    price: 1500, category: 'skin', icon: '🐉', rarity: 'legendary', character: 'valor', skinVariant: 'dragon', theme: 'classic', artStyle: 'svg',
  },
  {
    id: 'shadow_knight', name: 'Shadow Knight', description: 'Dark armor from the void',
    price: 850, category: 'skin', icon: '🌑', rarity: 'epic', character: 'valor', skinVariant: 'shadow', theme: 'classic', artStyle: 'svg',
  },

  // =============== SKINS - ELARA ===============
  {
    id: 'shadow_wizard', name: 'Shadow Wizard', description: 'Dark mystical robes for Elara',
    price: 800, category: 'skin', icon: '🌙', rarity: 'epic', character: 'elara', skinVariant: 'shadow', theme: 'classic',
  },
  {
    id: 'starlight_mage', name: 'Starlight Mage', description: 'Robes woven from starlight',
    price: 850, category: 'skin', icon: '⭐', rarity: 'epic', character: 'elara', skinVariant: 'starlight', theme: 'classic',
  },
  {
    id: 'phoenix_robes', name: 'Phoenix Robes', description: 'Fiery robes of rebirth',
    price: 1100, category: 'skin', icon: '🔥', rarity: 'legendary', character: 'elara', skinVariant: 'phoenix', theme: 'classic',
  },
  {
    id: 'void_sorceress', name: 'Void Sorceress', description: 'Robes from the space between worlds',
    price: 1400, category: 'skin', icon: '🌌', rarity: 'legendary', character: 'elara', skinVariant: 'void', theme: 'classic',
  },
  {
    id: 'nature_sage', name: 'Nature Sage', description: 'Living robes of the forest',
    price: 750, category: 'skin', icon: '🌿', rarity: 'rare', character: 'elara', skinVariant: 'nature', theme: 'classic',
  },
  {
    id: 'frost_mage', name: 'Frost Mage', description: 'Icy robes of the frozen tundra',
    price: 800, category: 'skin', icon: '❄️', rarity: 'epic', character: 'elara', skinVariant: 'frost', theme: 'classic',
  },

  // =============== SKINS - PRINCESS ELLA ===============
  {
    id: 'flower_queen', name: 'Flower Queen', description: 'Royal golden gown with magical petals',
    price: 1200, category: 'skin', icon: '👑', rarity: 'legendary', character: 'ella', skinVariant: 'flower_queen', theme: 'classic',
  },
  {
    id: 'winter_rose', name: 'Winter Rose', description: 'Ice blue dress with frost flowers',
    price: 850, category: 'skin', icon: '🌹', rarity: 'epic', character: 'ella', skinVariant: 'winter_rose', theme: 'classic',
  },
  {
    id: 'sunset_bloom', name: 'Sunset Bloom', description: 'Orange and pink sunset-themed gown',
    price: 800, category: 'skin', icon: '🌅', rarity: 'epic', character: 'ella', skinVariant: 'sunset_bloom', theme: 'classic',
  },
  {
    id: 'moonlight_garden', name: 'Moonlight Garden', description: 'Silver and purple nighttime elegance',
    price: 900, category: 'skin', icon: '🌙', rarity: 'epic', character: 'ella', skinVariant: 'moonlight_garden', theme: 'classic',
  },
  {
    id: 'rainbow_meadow', name: 'Rainbow Meadow', description: 'Colorful rainbow flower dress',
    price: 1000, category: 'skin', icon: '🌈', rarity: 'legendary', character: 'ella', skinVariant: 'rainbow_meadow', theme: 'classic',
  },
  {
    id: 'enchanted_forest', name: 'Enchanted Forest', description: 'Living green forest fairy theme',
    price: 750, category: 'skin', icon: '🌲', rarity: 'rare', character: 'ella', skinVariant: 'enchanted_forest', theme: 'classic',
  },

  // =============== SKINS - AGENT X ===============
  {
    id: 'stealth_suit', name: 'Stealth Suit', description: 'Matte black tactical stealth armor',
    price: 1000, category: 'skin', icon: '🥷', rarity: 'legendary', character: 'agent_x', skinVariant: 'stealth', theme: 'agent',
  },
  {
    id: 'arctic_ops', name: 'Arctic Ops', description: 'White winter camo tactical gear',
    price: 800, category: 'skin', icon: '❄️', rarity: 'epic', character: 'agent_x', skinVariant: 'arctic', theme: 'agent',
  },
  {
    id: 'desert_hawk', name: 'Desert Hawk', description: 'Sand-colored desert operations suit',
    price: 850, category: 'skin', icon: '🏜️', rarity: 'epic', character: 'agent_x', skinVariant: 'desert', theme: 'agent',
  },
  {
    id: 'nightfall_agent', name: 'Nightfall', description: 'Dark navy suit with red accents',
    price: 1500, category: 'skin', icon: '🌃', rarity: 'legendary', character: 'agent_x', skinVariant: 'nightfall', theme: 'agent',
  },

  // =============== SKINS - CIPHER ===============
  {
    id: 'holo_visor', name: 'Holo-Visor', description: 'Holographic display visor with data overlay',
    price: 1000, category: 'skin', icon: '🥽', rarity: 'legendary', character: 'cipher', skinVariant: 'holo', theme: 'agent',
  },
  {
    id: 'neon_hacker', name: 'Neon Hacker', description: 'Glowing neon circuit-traced outfit',
    price: 900, category: 'skin', icon: '💜', rarity: 'epic', character: 'cipher', skinVariant: 'neon', theme: 'agent',
  },
  {
    id: 'chrome_cyborg', name: 'Chrome Cyborg', description: 'Metallic chrome cybernetic enhancement',
    price: 1400, category: 'skin', icon: '🤖', rarity: 'legendary', character: 'cipher', skinVariant: 'chrome', theme: 'agent',
  },
  {
    id: 'quantum_core', name: 'Quantum Core', description: 'Quantum-powered energy suit',
    price: 850, category: 'skin', icon: '⚛️', rarity: 'epic', character: 'cipher', skinVariant: 'quantum', theme: 'agent',
  },

  // =============== SKINS - SHADOW ===============
  {
    id: 'shadow_cloak', name: 'Shadow Cloak', description: 'Light-bending invisibility cloak',
    price: 1000, category: 'skin', icon: '👤', rarity: 'legendary', character: 'shadow', skinVariant: 'cloak', theme: 'agent',
  },
  {
    id: 'phantom_ops', name: 'Phantom Ops', description: 'Ghost-white stealth infiltration suit',
    price: 900, category: 'skin', icon: '👻', rarity: 'epic', character: 'shadow', skinVariant: 'phantom', theme: 'agent',
  },
  {
    id: 'midnight_assassin', name: 'Midnight Assassin', description: 'Ultra-dark suit with blade attachments',
    price: 1400, category: 'skin', icon: '🗡️', rarity: 'legendary', character: 'shadow', skinVariant: 'midnight', theme: 'agent',
  },
  {
    id: 'urban_ghost', name: 'Urban Ghost', description: 'City camouflage tactical wear',
    price: 800, category: 'skin', icon: '🏙️', rarity: 'epic', character: 'shadow', skinVariant: 'urban', theme: 'agent',
  },
  
  // =============== POTIONS ===============
  {
    id: 'mega_health',
    name: 'Mega Health Potion',
    description: 'Fully restore HP',
    price: 150,
    category: 'potion',
    icon: '🧪',
    effect: 'heal_full',
    value: 100,
    rarity: 'rare',
  },
  {
    id: 'mana_surge',
    name: 'Mana Surge',
    description: 'Fully restore MP',
    price: 120,
    category: 'potion',
    icon: '💧',
    effect: 'mp_full',
    value: 50,
    rarity: 'rare',
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
    rarity: 'epic',
  },
  {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restore 30 HP',
    price: 50,
    category: 'potion',
    icon: '❤️',
    effect: 'heal',
    value: 30,
    rarity: 'common',
  },
  {
    id: 'magic_potion',
    name: 'Magic Potion',
    description: 'Restore 20 MP',
    price: 40,
    category: 'potion',
    icon: '💙',
    effect: 'mp',
    value: 20,
    rarity: 'common',
  },
  {
    id: 'speed_potion',
    name: 'Speed Elixir',
    description: '+50% attack speed for one battle',
    price: 180,
    category: 'potion',
    icon: '⚡',
    effect: 'speed',
    value: 50,
    rarity: 'rare',
  },
  {
    id: 'shield_potion',
    name: 'Iron Skin',
    description: '-50% damage taken for one battle',
    price: 200,
    category: 'potion',
    icon: '🛡️',
    effect: 'defense',
    value: 50,
    rarity: 'rare',
  },
  {
    id: 'rage_potion',
    name: 'Berserker Brew',
    description: '+100% damage but -20% HP',
    price: 250,
    category: 'potion',
    icon: '😤',
    effect: 'rage',
    value: 100,
    rarity: 'epic',
  },
  {
    id: 'lucky_coin',
    name: 'Lucky Coin',
    description: '+2x gold from next battle',
    price: 150,
    category: 'potion',
    icon: '🪙',
    effect: 'gold_boost',
    value: 100,
    rarity: 'rare',
  },
  {
    id: 'revive_feather',
    name: 'Phoenix Feather',
    description: 'Auto-revive once if defeated',
    price: 500,
    category: 'potion',
    icon: '🪶',
    effect: 'revive',
    value: 50,
    rarity: 'legendary',
  },
  
  // =============== UPGRADES (PERMANENT) ===============
  {
    id: 'attack_boost',
    name: 'Sharpened Blade',
    description: '+20% damage permanently',
    price: 800,
    category: 'upgrade',
    icon: '⚔️',
    effect: 'attack_boost',
    value: 20,
    rarity: 'epic',
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
    rarity: 'rare',
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
    rarity: 'epic',
  },
  {
    id: 'mp_boost',
    name: 'Mana Well',
    description: '+20 max MP permanently',
    price: 500,
    category: 'upgrade',
    icon: '💠',
    effect: 'mp_boost',
    value: 20,
    rarity: 'rare',
  },
  {
    id: 'crit_boost',
    name: 'Sharp Eye',
    description: '+15% critical hit chance',
    price: 650,
    category: 'upgrade',
    icon: '🎯',
    effect: 'crit_boost',
    value: 15,
    rarity: 'epic',
  },
  {
    id: 'gold_boost',
    name: 'Midas Touch',
    description: '+25% gold earned permanently',
    price: 800,
    category: 'upgrade',
    icon: '💰',
    effect: 'gold_boost',
    value: 25,
    rarity: 'epic',
  },
  {
    id: 'xp_boost',
    name: 'Wisdom Crystal',
    description: '+25% XP earned permanently',
    price: 750,
    category: 'upgrade',
    icon: '📚',
    effect: 'xp_boost',
    value: 25,
    rarity: 'epic',
  },
  {
    id: 'defense_boost',
    name: 'Adamantine Shield',
    description: '-15% damage taken permanently',
    price: 700,
    category: 'upgrade',
    icon: '🛡️',
    effect: 'defense_boost',
    value: 15,
    rarity: 'epic',
  },
];

// Get items by rarity for rarity-based display
export const getItemsByRarity = (rarity: ItemRarity) => 
  STORE_ITEMS.filter(item => item.rarity === rarity);

// Get skins for a specific character
export const getSkinsForCharacter = (character: SkinCharacter) =>
  STORE_ITEMS.filter(item => item.category === 'skin' && item.character === character);

// Find a skin's catalog entry by its character + variant pair (the data we store at runtime).
export const findSkinByVariant = (
  character: SkinCharacter,
  skinVariant: string,
): StoreItem | undefined =>
  STORE_ITEMS.find(
    s => s.category === 'skin' && s.character === character && s.skinVariant === skinVariant,
  );

// Get a skin's art tier ('svg' | 'video'). Defaults to 'svg' for legacy entries.
export const getSkinArtStyle = (
  character: SkinCharacter,
  skinVariant: string,
): 'svg' | 'video' => findSkinByVariant(character, skinVariant)?.artStyle ?? 'svg';

/**
 * Browser capability probe — true iff the runtime can decode VP9 alpha WebM
 * (which is what our realistic Sir Valor videos require for transparency).
 * Safari without alpha-WebM support returns false, so we render the SVG hero
 * instead of the white-boxed MP4 fallback.
 */
export const supportsAlphaWebm = (): boolean => {
  if (typeof document === 'undefined') return true; // SSR: assume capable; client re-checks.
  try {
    const v = document.createElement('video');
    return v.canPlayType('video/webm; codecs="vp9"') === 'probably';
  } catch {
    return false;
  }
};

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
