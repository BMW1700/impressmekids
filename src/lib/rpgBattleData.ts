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
  effect?: 'fire' | 'ice' | 'lightning' | 'heal' | 'slash' | 'block' | 'poison' | 'debuff' | 'silence';
  animationType: 'projectile' | 'melee' | 'aoe' | 'buff';
}

export interface EnemyAbility {
  id: string;
  name: string;
  damage: number;
  effect: 'poison' | 'debuff' | 'silence' | 'word_barrage' | 'fireball_barrage' | 'asteroid_barrage';
  description: string;
  icon: string;
}

export interface RPGEnemy {
  id: string;
  name: string;
  type: 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss' | 'dragon';
  maxHp: number;
  attack: number;
  defense: number;
  wordDamageMultiplier: number;
  avatar?: string;
  color: string;
  dialogueIntro: string[];
  dialogueAttack: string[];
  dialogueDefeat: string[];
  specialAbilities?: EnemyAbility[];
  barrageWordCount?: number;
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

// Regular Enemies - BUFFED
export const goblinMinion: RPGEnemy = {
  id: 'goblin_minion',
  name: 'Goblin Scout',
  type: 'minion',
  maxHp: 80, // Was 40
  attack: 12, // Was 8
  defense: 4, // Was 2
  wordDamageMultiplier: 0.85, // Harder to damage
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
  specialAbilities: [
    { id: 'poison_dagger', name: 'Poison Dagger', damage: 8, effect: 'poison', description: 'Deals damage over time', icon: '🗡️' },
  ],
  barrageWordCount: 4,
};

export const goblinGuard: RPGEnemy = {
  id: 'goblin_guard',
  name: 'Goblin Guard',
  type: 'guard',
  maxHp: 120, // Was 70
  attack: 15, // Was 12
  defense: 8, // Was 5
  wordDamageMultiplier: 0.7, // Was 0.8
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
  specialAbilities: [
    { id: 'shield_block', name: 'Shield Block', damage: 0, effect: 'debuff', description: 'Reduces next word damage by 50%', icon: '🛡️' },
    { id: 'poison_dagger', name: 'Poison Dagger', damage: 10, effect: 'poison', description: 'Deals damage over time', icon: '🗡️' },
  ],
  barrageWordCount: 5,
};

export const goblinElite: RPGEnemy = {
  id: 'goblin_elite',
  name: 'Goblin Warlord',
  type: 'elite',
  maxHp: 180, // Was 100
  attack: 22, // Was 18
  defense: 12, // Was 8
  wordDamageMultiplier: 0.5, // Was 0.6
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
  specialAbilities: [
    { id: 'berserker_rage', name: 'Berserker Rage', damage: 20, effect: 'debuff', description: 'Doubles attack damage for 2 turns', icon: '💢' },
    { id: 'poison_dagger', name: 'Poison Dagger', damage: 12, effect: 'poison', description: 'Deals damage over time', icon: '🗡️' },
  ],
  barrageWordCount: 6,
};

// Boss Enemies - BUFFED
export const grogTheGoblinKing: RPGEnemy = {
  id: 'grog',
  name: 'Grog the Goblin King',
  type: 'boss',
  maxHp: 300, // Was 200
  attack: 30, // Was 25
  defense: 15, // Was 12
  wordDamageMultiplier: 0.4, // Was 0.5
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
  specialAbilities: [
    { id: 'royal_slam', name: 'Royal Slam', damage: 25, effect: 'debuff', description: 'Massive damage and stuns', icon: '👑' },
    { id: 'summon_minions', name: 'Mocking Taunt', damage: 0, effect: 'debuff', description: 'Reduces word damage by 30%', icon: '🎭' },
    { id: 'poison_cloud', name: 'Poison Cloud', damage: 15, effect: 'poison', description: 'Deals heavy damage over time', icon: '☠️' },
    { id: 'word_prison', name: 'Word Prison', damage: 0, effect: 'asteroid_barrage', description: 'Summons word asteroids!', icon: '☄️' },
  ],
  barrageWordCount: 8,
};

export const galairTheWickedSorcerer: RPGEnemy = {
  id: 'galair',
  name: 'Galair the Wicked Sorcerer',
  type: 'final_boss',
  maxHp: 500,
  attack: 40,
  defense: 20,
  wordDamageMultiplier: 0.3,
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
  specialAbilities: [
    { id: 'dark_blast', name: 'Dark Blast', damage: 30, effect: 'debuff', description: 'Dark energy attack', icon: '🌑' },
    { id: 'silence', name: 'Silence', damage: 0, effect: 'silence', description: 'Disables magic for 2 turns', icon: '🔇' },
    { id: 'void_poison', name: 'Void Poison', damage: 20, effect: 'poison', description: 'Devastating damage over time', icon: '💀' },
    { id: 'word_prison', name: 'Word Prison', damage: 0, effect: 'asteroid_barrage', description: 'Summons word asteroids!', icon: '☄️' },
  ],
  barrageWordCount: 10,
};

// Dragon Enemy
export const dalairTheDragon: RPGEnemy = {
  id: 'dalair',
  name: 'Dalair the Destroyer',
  type: 'dragon',
  maxHp: 280,
  attack: 35,
  defense: 18,
  wordDamageMultiplier: 0.45,
  color: 'from-orange-600 to-red-900',
  dialogueIntro: [
    "ROOOAAAR! Another mortal dares challenge me?!",
    "I am DALAIR, the Destroyer of Libraries!",
    "I have burned a thousand books... yours will be next!",
    "Your words will turn to ASH in my flames!",
  ],
  dialogueAttack: [
    "*breathes scorching flames*",
    "FEEL THE BURN!",
    "*massive wing gust*",
    "You cannot escape my fire!",
  ],
  dialogueDefeat: [
    "Impossible... my flames... extinguished by words...",
    "Perhaps... books aren't for burning after all...",
    "Your knowledge... it's too powerful...",
  ],
  specialAbilities: [
    { id: 'fireball_barrage', name: 'Fireball Barrage', damage: 0, effect: 'fireball_barrage', description: 'Launches fireballs with words!', icon: '🔥' },
    { id: 'breath_attack', name: 'Dragon Breath', damage: 25, effect: 'debuff', description: 'Scorching flames reduce damage', icon: '🐉' },
    { id: 'wing_gust', name: 'Wing Gust', damage: 15, effect: 'silence', description: 'Blows away your words', icon: '💨' },
    { id: 'word_prison', name: 'Meteor Storm', damage: 0, effect: 'asteroid_barrage', description: 'Summons flaming meteors!', icon: '☄️' },
  ],
  barrageWordCount: 7,
};

// Get enemy by type for battle
export const getEnemyForBattle = (enemyType: 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss' | 'dragon'): RPGEnemy => {
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
    case 'dragon':
      return dalairTheDragon;
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
