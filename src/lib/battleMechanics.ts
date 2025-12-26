// Battle mechanics for Grog the Goblin King Story Campaign

export type EnemyType = 'minion' | 'guard' | 'elite' | 'boss';
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

// Get enemy HP based on world and difficulty
export const getEnemyStats = (worldNumber: number, enemyType: EnemyType): { hp: number; attackPower: number } => {
  const baseHpByWorld: Record<number, number> = {
    1: 100,  // Enchanted Forest - Easy
    2: 200,  // Dark Caves - Medium
    3: 350,  // Goblin Mountain - Hard
    4: 500,  // Throne Room - Boss
  };

  const hpMultiplierByType: Record<EnemyType, number> = {
    minion: 0.5,
    guard: 0.75,
    elite: 1.0,
    boss: 1.5,
  };

  const attackPowerByType: Record<EnemyType, number> = {
    minion: 5,
    guard: 8,
    elite: 12,
    boss: 15,
  };

  const baseHp = baseHpByWorld[worldNumber] || 100;
  const hp = Math.floor(baseHp * hpMultiplierByType[enemyType]);
  const attackPower = attackPowerByType[enemyType];

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
export const calculateEnemyAttack = (enemyType: EnemyType): EnemyAttackResult => {
  const attackPower: Record<EnemyType, number> = {
    minion: 5,
    guard: 10,
    elite: 15,
    boss: 20,
  };

  const messages: Record<EnemyType, string[]> = {
    minion: ['Ouch! The goblin poked you!', 'A tiny scratch!'],
    guard: ['The guard strikes back!', 'That one hurt!'],
    elite: ['Powerful blow!', 'The elite hits hard!'],
    boss: ['Grog smashes you!', 'The Goblin King attacks!'],
  };

  const damage = attackPower[enemyType];
  const message = messages[enemyType][Math.floor(Math.random() * messages[enemyType].length)];

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

// Get enemy name based on type
export const getEnemyName = (enemyType: EnemyType, worldNumber: number): string => {
  const names: Record<number, Record<EnemyType, string>> = {
    1: {
      minion: 'Forest Imp',
      guard: 'Goblin Scout',
      elite: 'Forest Guardian',
      boss: 'Grog the Goblin King',
    },
    2: {
      minion: 'Cave Gremlin',
      guard: 'Stone Troll',
      elite: 'Shadow Lurker',
      boss: 'Grog the Goblin King',
    },
    3: {
      minion: 'Mountain Gnome',
      guard: 'Boulder Brute',
      elite: 'Peak Guardian',
      boss: 'Grog the Goblin King',
    },
    4: {
      minion: 'Throne Guard',
      guard: 'Royal Defender',
      elite: 'Dark Knight',
      boss: 'Grog the Goblin King',
    },
  };

  return names[worldNumber]?.[enemyType] || 'Goblin Minion';
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
