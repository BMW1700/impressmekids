// Battle mechanics for Grog the Goblin King Story Campaign

export type EnemyType = 
  | 'minion' | 'guard' | 'elite' | 'boss'
  | 'dragon' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian'
  // World 5 - Whispering Caverns
  | 'cave_troll' | 'crystal_spider' | 'echo_wraith'
  // World 6 - Floating Isles
  | 'storm_harpy' | 'cloud_giant' | 'zephyr'
  // World 7 - Sunken Library
  | 'ink_kraken' | 'reef_guardian' | 'leviathan'
  // World 8 - The Void
  | 'void_phantom' | 'reality_shifter' | 'word_eater'
  // World 9 - Ember Highlands
  | 'fire_elemental' | 'lava_hound' | 'ember_drake'
  // World 10 - Crystal Citadel
  | 'crystal_knight' | 'prism_mage' | 'crystal_queen'
  // World 11 - Starfall Peaks
  | 'star_sprite' | 'comet_wolf' | 'nova_titan'
  // World 12 - Eternal Archive
  | 'tome_golem' | 'page_wraith' | 'the_librarian';

export type BattleStatus = 'in_progress' | 'victory' | 'defeat';

export interface BattleState {
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  currentStreak: number;
  longestStreak: number;
  totalDamageDealt: number;
  wordsRead: number;
  correctWords: number;
  status: BattleStatus;
  xpEarned: number;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  isSuper: boolean;
  streakBonus: number;
  speedBonus: number;
  message: string;
}

export interface EnemyAttackResult {
  damage: number;
  message: string;
}

// Map enemy types to their tier for stat calculations
const getEnemyTier = (enemyType: EnemyType): 'minion' | 'guard' | 'elite' | 'boss' => {
  const tierMap: Record<EnemyType, 'minion' | 'guard' | 'elite' | 'boss'> = {
    minion: 'minion',
    guard: 'guard',
    elite: 'elite',
    boss: 'boss',
    dragon: 'boss',
    ice_golem: 'elite',
    shadow_wraith: 'guard',
    stone_guardian: 'boss',
    cave_troll: 'guard',
    crystal_spider: 'minion',
    echo_wraith: 'elite',
    storm_harpy: 'minion',
    cloud_giant: 'elite',
    zephyr: 'boss',
    ink_kraken: 'guard',
    reef_guardian: 'elite',
    leviathan: 'boss',
    void_phantom: 'guard',
    reality_shifter: 'elite',
    word_eater: 'boss',
    // World 9 - Ember Highlands
    fire_elemental: 'guard',
    lava_hound: 'minion',
    ember_drake: 'boss',
    // World 10 - Crystal Citadel
    crystal_knight: 'guard',
    prism_mage: 'elite',
    crystal_queen: 'boss',
    // World 11 - Starfall Peaks
    star_sprite: 'minion',
    comet_wolf: 'elite',
    nova_titan: 'boss',
    // World 12 - Eternal Archive
    tome_golem: 'guard',
    page_wraith: 'elite',
    the_librarian: 'boss',
  };
  return tierMap[enemyType] || 'minion';
};

// Get enemy HP based on world and difficulty
export const getEnemyStats = (worldNumber: number, enemyType: EnemyType): { hp: number; attackPower: number } => {
  // DOUBLED HP: Makes battles harder - enemies survive longer
  const baseHpByWorld: Record<number, number> = {
    1: 800,   // Enchanted Forest - Easy (4x)
    2: 1600,  // Dark Caves - Medium (4x)
    3: 2800,  // Goblin Mountain - Hard (4x)
    4: 4000,  // Throne Room - Boss (4x)
    5: 2000,  // Whispering Caverns (4x)
    6: 2400,  // Floating Isles (4x)
    7: 3000,  // Sunken Library (4x)
    8: 4800,  // The Void - Hardest (4x)
  };

  const tier = getEnemyTier(enemyType);
  
  const hpMultiplierByType: Record<'minion' | 'guard' | 'elite' | 'boss', number> = {
    minion: 0.5,
    guard: 0.75,
    elite: 1.0,
    boss: 1.5,
  };

  // BALANCED: Reduced attack power for kid-friendly gameplay
  const attackPowerByType: Record<'minion' | 'guard' | 'elite' | 'boss', number> = {
    minion: 2,
    guard: 4,
    elite: 6,
    boss: 8,
  };

  const baseHp = baseHpByWorld[worldNumber] || 200;
  const hp = Math.floor(baseHp * hpMultiplierByType[tier]);
  const attackPower = attackPowerByType[tier];

  return { hp, attackPower };
};

// Calculate damage dealt when a word is read correctly
export const calculateDamage = (
  streak: number,
  wpm: number = 0,
  wordLength: number = 5
): DamageResult => {
  // Base damage scales with word length
  let baseDamage = 8 + Math.floor(wordLength / 2);
  let isCritical = false;
  let isSuper = false;
  let streakBonus = 0;
  let speedBonus = 0;
  let message = '';

  // Streak bonuses
  if (streak >= 10) {
    baseDamage = Math.floor(baseDamage * 3);
    isSuper = true;
    isCritical = true;
    streakBonus = 200;
    message = '🔥 SUPER CRITICAL! 🔥';
  } else if (streak >= 5) {
    baseDamage = Math.floor(baseDamage * 2);
    isCritical = true;
    streakBonus = 100;
    message = '⚡ CRITICAL HIT! ⚡';
  } else if (streak >= 3) {
    baseDamage = Math.floor(baseDamage * 1.5);
    streakBonus = 50;
    message = '✨ Nice streak!';
  }

  // Speed bonus for fast readers
  if (wpm > 150) {
    speedBonus = Math.floor(baseDamage * 0.3);
    baseDamage += speedBonus;
    message = message || '💨 Speed bonus!';
  } else if (wpm > 120) {
    speedBonus = Math.floor(baseDamage * 0.15);
    baseDamage += speedBonus;
  }

  return {
    damage: baseDamage,
    isCritical,
    isSuper,
    streakBonus,
    speedBonus,
    message,
  };
};

// Calculate damage taken when word is read incorrectly
// BALANCED: Reduced damage so readers don't die too quickly
export const calculateEnemyAttack = (enemyType: EnemyType): EnemyAttackResult => {
  const tier = getEnemyTier(enemyType);
  
  const attackPower: Record<'minion' | 'guard' | 'elite' | 'boss', number> = {
    minion: 2,   // Reduced from 5
    guard: 4,    // Reduced from 10
    elite: 6,    // Reduced from 15
    boss: 8,     // Reduced from 20
  };

  const messages: Record<'minion' | 'guard' | 'elite' | 'boss', string[]> = {
    minion: ['Ouch! The creature poked you!', 'A tiny scratch!'],
    guard: ['The enemy strikes back!', 'That one hurt!'],
    elite: ['Powerful blow!', 'The elite hits hard!'],
    boss: ['MASSIVE ATTACK!', 'The boss crushes you!'],
  };

  const damage = attackPower[tier];
  const message = messages[tier][Math.floor(Math.random() * messages[tier].length)];

  return { damage, message };
};

// Calculate XP earned from a battle
export const calculateXpEarned = (
  victory: boolean,
  wordsRead: number,
  correctWords: number,
  longestStreak: number,
  worldNumber: number,
  defeatedBeforeFinish: boolean
): number => {
  let xp = 0;

  // Base XP for words read
  xp += correctWords * 2;

  // Streak bonus
  xp += longestStreak * 5;

  // World multiplier
  xp = Math.floor(xp * (1 + (worldNumber - 1) * 0.25));

  // Victory bonus
  if (victory) {
    xp += 50;
    
    // Bonus for defeating enemy before finishing the story
    if (defeatedBeforeFinish) {
      xp += 25;
    }
  }

  // Accuracy bonus
  const accuracy = wordsRead > 0 ? correctWords / wordsRead : 0;
  if (accuracy >= 0.95) {
    xp = Math.floor(xp * 1.5);
  } else if (accuracy >= 0.85) {
    xp = Math.floor(xp * 1.25);
  }

  return xp;
};

// Calculate power damage based on streak level
export const calculatePowerDamage = (streak: number): { damage: number; tier: 'none' | 'power' | 'mega' } => {
  if (streak >= 10) return { damage: 100, tier: 'mega' };
  if (streak >= 5) return { damage: 50, tier: 'power' };
  return { damage: 0, tier: 'none' };
};

// Get enemy name based on type
export const getEnemyName = (enemyType: EnemyType, worldNumber: number): string => {
  // Named enemies have specific names
  const namedEnemies: Partial<Record<EnemyType, string>> = {
    boss: 'Grog the Goblin King',
    dragon: 'Drake the Dragon',
    ice_golem: 'Frostfang the Ice Golem',
    shadow_wraith: 'Whisper the Shadow Wraith',
    stone_guardian: 'Granite the Stone Guardian',
    cave_troll: 'Grumbold the Cave Troll',
    crystal_spider: 'Prism the Crystal Spider',
    echo_wraith: 'Echo the Phantom',
    storm_harpy: 'Tempest the Storm Harpy',
    cloud_giant: 'Nimbus the Cloud Giant',
    zephyr: 'Zephyr the Wind Lord',
    ink_kraken: 'Inkwell the Kraken',
    reef_guardian: 'Coral the Reef Guardian',
    leviathan: 'Abyss the Leviathan',
    void_phantom: 'Shade the Void Phantom',
    reality_shifter: 'Flux the Reality Shifter',
    word_eater: 'Terminus the Word Eater',
    fire_elemental: 'Blaze the Fire Elemental',
    lava_hound: 'Scorch the Lava Hound',
    ember_drake: 'Inferno the Ember Drake',
    crystal_knight: 'Facet the Crystal Knight',
    prism_mage: 'Refract the Prism Mage',
    crystal_queen: 'Diamante the Crystal Queen',
    star_sprite: 'Twinkle the Star Sprite',
    comet_wolf: 'Streak the Comet Wolf',
    nova_titan: 'Solaris the Nova Titan',
    tome_golem: 'Codex the Tome Golem',
    page_wraith: 'Whisper the Page Wraith',
    the_librarian: 'The Eternal Librarian',
  };

  if (namedEnemies[enemyType]) {
    return namedEnemies[enemyType]!;
  }

  // Generic tier-based names by world
  const tier = getEnemyTier(enemyType);
  const names: Record<number, Record<'minion' | 'guard' | 'elite' | 'boss', string>> = {
    1: { minion: 'Forest Imp', guard: 'Goblin Scout', elite: 'Forest Guardian', boss: 'Grog the Goblin King' },
    2: { minion: 'Cave Gremlin', guard: 'Stone Troll', elite: 'Shadow Lurker', boss: 'Grog the Goblin King' },
    3: { minion: 'Mountain Gnome', guard: 'Boulder Brute', elite: 'Peak Guardian', boss: 'Grog the Goblin King' },
    4: { minion: 'Throne Guard', guard: 'Royal Defender', elite: 'Dark Knight', boss: 'Grog the Goblin King' },
    5: { minion: 'Cavern Creeper', guard: 'Crystal Guard', elite: 'Echo Hunter', boss: 'Echo Master' },
    6: { minion: 'Cloud Sprite', guard: 'Sky Sentinel', elite: 'Storm Rider', boss: 'Zephyr' },
    7: { minion: 'Ink Blob', guard: 'Reef Warden', elite: 'Deep Diver', boss: 'Leviathan' },
    8: { minion: 'Void Wisp', guard: 'Reality Guard', elite: 'Word Hunter', boss: 'Terminus' },
    9: { minion: 'Flame Wisp', guard: 'Fire Sentry', elite: 'Lava Knight', boss: 'Ember Drake' },
    10: { minion: 'Shard Sprite', guard: 'Crystal Guard', elite: 'Prism Sentinel', boss: 'Crystal Queen' },
    11: { minion: 'Star Mote', guard: 'Comet Guard', elite: 'Nova Sentinel', boss: 'Nova Titan' },
    12: { minion: 'Bookmark', guard: 'Scroll Guard', elite: 'Chapter Knight', boss: 'The Librarian' },
  };

  return names[worldNumber]?.[tier] || 'Goblin Minion';
};

// Get victory message based on performance
export const getVictoryMessage = (
  accuracy: number,
  longestStreak: number,
  defeatedBeforeFinish: boolean
): { title: string; subtitle: string } => {
  if (defeatedBeforeFinish && accuracy >= 0.95) {
    return {
      title: '🏆 LEGENDARY VICTORY! 🏆',
      subtitle: 'You defeated the enemy before finishing AND with amazing accuracy!',
    };
  }
  
  if (defeatedBeforeFinish) {
    return {
      title: '⚔️ CRUSHING VICTORY! ⚔️',
      subtitle: 'You defeated the enemy before even finishing the story!',
    };
  }

  if (accuracy >= 0.95 && longestStreak >= 10) {
    return {
      title: '🌟 PERFECT READER! 🌟',
      subtitle: 'Incredible accuracy and an amazing streak!',
    };
  }

  if (accuracy >= 0.90) {
    return {
      title: '📖 BOOK RESCUED! 📖',
      subtitle: 'Great job reading! Princess Ella thanks you!',
    };
  }

  return {
    title: '✨ VICTORY! ✨',
    subtitle: 'You saved the book from Grog\'s clutches!',
  };
};

// Get defeat message
export const getDefeatMessage = (): { title: string; subtitle: string } => {
  const messages = [
    {
      title: '💔 Oh no!',
      subtitle: 'Grog got away with the book... But you can try again!',
    },
    {
      title: '📚 So close!',
      subtitle: 'The book slipped from your grasp. Give it another shot!',
    },
    {
      title: '🔄 Try Again!',
      subtitle: 'Every great reader learns from their mistakes!',
    },
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

// Initialize a new battle state
export const initializeBattle = (
  worldNumber: number,
  enemyType: EnemyType
): BattleState => {
  const { hp } = getEnemyStats(worldNumber, enemyType);

  return {
    enemyHp: hp,
    enemyMaxHp: hp,
    playerHp: 100,
    playerMaxHp: 100,
    currentStreak: 0,
    longestStreak: 0,
    totalDamageDealt: 0,
    wordsRead: 0,
    correctWords: 0,
    status: 'in_progress',
    xpEarned: 0,
  };
};

// Process a word reading result
export const processWordResult = (
  state: BattleState,
  correct: boolean,
  enemyType: EnemyType,
  wordLength: number = 5,
  wpm: number = 0
): { newState: BattleState; damageResult?: DamageResult; attackResult?: EnemyAttackResult } => {
  const newState = { ...state };
  newState.wordsRead++;

  if (correct) {
    newState.correctWords++;
    newState.currentStreak++;
    newState.longestStreak = Math.max(newState.longestStreak, newState.currentStreak);

    // Calculate and apply damage
    const damageResult = calculateDamage(newState.currentStreak, wpm, wordLength);
    newState.totalDamageDealt += damageResult.damage;
    newState.enemyHp = Math.max(0, newState.enemyHp - damageResult.damage);

    // Check for victory
    if (newState.enemyHp <= 0) {
      newState.status = 'victory';
    }

    return { newState, damageResult };
  } else {
    // Reset streak on incorrect word
    newState.currentStreak = 0;

    // Enemy attacks
    const attackResult = calculateEnemyAttack(enemyType);
    newState.playerHp = Math.max(0, newState.playerHp - attackResult.damage);

    // Check for defeat
    if (newState.playerHp <= 0) {
      newState.status = 'defeat';
    }

    return { newState, attackResult };
  }
};
