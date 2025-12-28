// RPG Battle Mode - Boss Data and Configuration

export interface RPGCharacter {
  id: string;
  name: string;
  title?: string;
  type: 'hero' | 'ally' | 'enemy' | 'boss';
  maxHp: number;
  attack: number;
  defense: number;
  avatar?: string;
  color: string;
  abilities: RPGAbility[];
}

export interface RPGAbility {
  id: string;
  name: string;
  description: string;
  damage: number;
  effect?: 'fire' | 'ice' | 'lightning' | 'heal' | 'slash' | 'block';
  animationType: 'projectile' | 'melee' | 'aoe' | 'buff';
}

export interface RPGEnemy {
  id: string;
  name: string;
  type: 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss';
  maxHp: number;
  attack: number;
  defense: number;
  wordDamageMultiplier: number;
  avatar?: string;
  color: string;
  dialogueIntro: string[];
  dialogueAttack: string[];
  dialogueDefeat: string[];
}

// Heroes
export const heroKnight: RPGCharacter = {
  id: 'knight',
  name: 'Sir Valor',
  title: 'The Brave Knight',
  type: 'hero',
  maxHp: 100,
  attack: 15,
  defense: 10,
  color: 'from-blue-500 to-indigo-600',
  abilities: [
    { id: 'slash', name: 'Sword Slash', description: 'A powerful sword attack', damage: 20, effect: 'slash', animationType: 'melee' },
    { id: 'shield_bash', name: 'Shield Bash', description: 'Stun the enemy with your shield', damage: 10, effect: 'block', animationType: 'melee' },
    { id: 'rallying_cry', name: 'Rallying Cry', description: 'Boost your next attack', damage: 0, effect: 'heal', animationType: 'buff' },
  ],
};

export const allyWizard: RPGCharacter = {
  id: 'wizard',
  name: 'Elara',
  title: 'The Wise Wizard',
  type: 'ally',
  maxHp: 60,
  attack: 25,
  defense: 5,
  color: 'from-purple-500 to-pink-500',
  abilities: [
    { id: 'fireball', name: 'Fireball', description: 'Hurl a ball of fire', damage: 30, effect: 'fire', animationType: 'projectile' },
    { id: 'ice_shard', name: 'Ice Shard', description: 'Freeze your enemy', damage: 20, effect: 'ice', animationType: 'projectile' },
    { id: 'lightning', name: 'Lightning Bolt', description: 'Strike with lightning', damage: 35, effect: 'lightning', animationType: 'projectile' },
  ],
};

// Regular Enemies
export const goblinMinion: RPGEnemy = {
  id: 'goblin_minion',
  name: 'Goblin Scout',
  type: 'minion',
  maxHp: 40,
  attack: 8,
  defense: 2,
  wordDamageMultiplier: 1.0,
  color: 'from-green-600 to-emerald-700',
  dialogueIntro: [
    "Hehe! You think you can stop us?",
    "The Goblin King will have those books!",
  ],
  dialogueAttack: [
    "*swings rusty dagger*",
    "Take this, reader!",
  ],
  dialogueDefeat: [
    "Ack! Words... too... powerful...",
    "I'll tell the King about you!",
  ],
};

export const goblinGuard: RPGEnemy = {
  id: 'goblin_guard',
  name: 'Goblin Guard',
  type: 'guard',
  maxHp: 70,
  attack: 12,
  defense: 5,
  wordDamageMultiplier: 0.8,
  color: 'from-green-700 to-emerald-800',
  dialogueIntro: [
    "Halt! No one passes without paying the toll!",
    "By order of the Goblin King, prepare to be stopped!",
  ],
  dialogueAttack: [
    "*heavy club swing*",
    "Feel the weight of goblin steel!",
  ],
  dialogueDefeat: [
    "The King... won't be pleased...",
    "Your words cut deeper than any sword...",
  ],
};

export const goblinElite: RPGEnemy = {
  id: 'goblin_elite',
  name: 'Goblin Warlord',
  type: 'elite',
  maxHp: 100,
  attack: 18,
  defense: 8,
  wordDamageMultiplier: 0.6,
  color: 'from-red-600 to-red-800',
  dialogueIntro: [
    "So, you're the one causing trouble...",
    "I've crushed many heroes. You'll be no different!",
  ],
  dialogueAttack: [
    "*devastating battleaxe swing*",
    "FEEL MY WRATH!",
  ],
  dialogueDefeat: [
    "Impossible... defeated by mere words...",
    "The King... must be warned...",
  ],
};

// Boss Enemies
export const grogTheGoblinKing: RPGEnemy = {
  id: 'grog',
  name: 'Grog the Goblin King',
  type: 'boss',
  maxHp: 200,
  attack: 25,
  defense: 12,
  wordDamageMultiplier: 0.5,
  color: 'from-green-800 to-black',
  dialogueIntro: [
    "MWAHAHAHA! So you've finally reached my throne!",
    "You think your puny words can defeat the GOBLIN KING?!",
    "Those books contain too much power. They belong to ME!",
  ],
  dialogueAttack: [
    "*MASSIVE club slam*",
    "BOW BEFORE YOUR KING!",
    "I'll crush you like the other heroes!",
  ],
  dialogueDefeat: [
    "NO! This cannot be! My crown... my kingdom...",
    "You... may have defeated me... but Galair will finish you!",
    "The books... take them... I never wanted to read anyway!",
  ],
};

export const galairTheWickedSorcerer: RPGEnemy = {
  id: 'galair',
  name: 'Galair the Wicked Sorcerer',
  type: 'final_boss',
  maxHp: 300,
  attack: 35,
  defense: 15,
  wordDamageMultiplier: 0.4,
  color: 'from-purple-900 to-black',
  dialogueIntro: [
    "Foolish mortal... you've come so far, only to fall here.",
    "I am GALAIR, master of dark magic!",
    "Grog was merely a puppet. I am the true threat!",
    "Your words have power... but MY magic is stronger!",
  ],
  dialogueAttack: [
    "*dark energy blast*",
    "FEEL THE VOID CONSUME YOU!",
    "*summons shadow flames*",
    "Your light means NOTHING to the darkness!",
  ],
  dialogueDefeat: [
    "NO... NO! This is impossible!",
    "Your words... they burn brighter than any flame...",
    "The books... the knowledge... it was never meant to be hoarded...",
    "Perhaps... reading... isn't so bad after all...",
  ],
};

// Get enemy by type for battle
export const getEnemyForBattle = (enemyType: 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss'): RPGEnemy => {
  switch (enemyType) {
    case 'minion':
      return goblinMinion;
    case 'guard':
      return goblinGuard;
    case 'elite':
      return goblinElite;
    case 'boss':
      return grogTheGoblinKing;
    case 'final_boss':
      return galairTheWickedSorcerer;
    default:
      return goblinMinion;
  }
};

// Battle dialogue lines for heroes
export const heroDialogue = {
  intro: [
    "Stand firm, Elara! We face this challenge together!",
    "For the kingdom and the stolen books!",
    "Our words are our greatest weapon!",
  ],
  readingSuccess: [
    "The word strikes true!",
    "Feel the power of knowledge!",
    "Every word brings us closer to victory!",
  ],
  readingStreak: [
    "Incredible! Keep going!",
    "Our combo grows stronger!",
    "The enemy cannot withstand our assault!",
  ],
  victory: [
    "Victory! Another book rescued!",
    "Justice prevails through the power of words!",
    "Onwards to the next battle!",
  ],
};

export const wizardDialogue = {
  intro: [
    "My magic is ready, Sir Valor!",
    "Words and spells shall protect us!",
    "Let knowledge be our shield!",
  ],
  castSpell: [
    "Feel the burn of a FIREBALL!",
    "Ice shard, STRIKE!",
    "Lightning from the heavens!",
  ],
  supportHero: [
    "I'll cover you, knight!",
    "Your words fuel my magic!",
    "Together, we're unstoppable!",
  ],
};
