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
  effect: 'poison' | 'debuff' | 'silence' | 'word_barrage' | 'fireball_barrage' | 'asteroid_barrage' | 'ice_crystal' | 'ghostly_whisper' | 'rolling_boulder' | 'freeze' | 'shadow_veil' | 'earthquake';
  description: string;
  icon: string;
}

// Mini-game types that can be assigned to enemies
export type MiniGameType = 
  | 'word_shield' 
  | 'spell_combo' 
  | 'dodge_words' 
  | 'rhyme_chain' 
  | 'speed_typist' 
  | 'tug_of_war'         // Only used in dedicated Tug of War battle mode, NOT in Classic
  | 'goblin_horde'       // Mini goblins run at player - speak words to defeat
  | 'fireball_defense'
  | 'beast_swarm'
  | 'ice_crystal_barrage'
  | 'ghostly_whispers'
  | 'rolling_boulders'
  | 'word_barrage'       // Regular word attack barrage
  | 'fireball_barrage'   // Dragon's fireball attack
  | 'asteroid_barrage'   // Word prison - asteroids with words
  | 'ground_ripple'      // Grog's signature - mountains with words roll toward heroes
  | 'web_trap'           // Crystal Spider's signature - words trapped in web
  // NEW MINI-GAMES for new worlds
  | 'word_echo'          // Caverns - say each word twice (echo)
  | 'wind_chase'         // Floating Isles - catch words blowing across screen
  | 'ink_splash'         // Sunken Library - read obscured words
  | 'crystal_prison'     // Frozen variant - break ice with repeated words
  | 'lightning_storm'    // Quick succession single-word lightning strikes
  | 'void_pull';         // The Void - save words from being consumed

export interface RPGEnemy {
  id: string;
  name: string;
  type: 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss' | 'dragon' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian' | 'cave_troll' | 'crystal_spider' | 'echo_wraith' | 'storm_harpy' | 'cloud_giant' | 'zephyr' | 'ink_kraken' | 'reef_guardian' | 'leviathan' | 'void_phantom' | 'reality_shifter' | 'word_eater' | 'goblin_shaman';
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
  miniGames: MiniGameType[]; // Mini-games this enemy can trigger
  signatureMiniGame: MiniGameType; // Signature attack at 50% HP - ALWAYS triggers
}

// Heroes
export const heroKnight: RPGCharacter = {
  id: 'knight',
  name: 'Sir Valor',
  title: 'The Brave Knight',
  type: 'hero',
  maxHp: 100, // Tank - high HP
  attack: 15,
  defense: 10,
  color: 'from-blue-500 to-indigo-600',
  abilities: [
    { id: 'slash', name: 'Sword Slash', description: 'A powerful sword attack', damage: 20, effect: 'slash', animationType: 'melee' },
    { id: 'shield_bash', name: 'Shield Bash', description: 'Stun the enemy with your shield', damage: 10, effect: 'block', animationType: 'melee' },
    { id: 'rallying_cry', name: 'Rallying Cry', description: 'Boost your next attack', damage: 0, effect: 'heal', animationType: 'buff' },
  ],
};

// Princess Ella - Flower powers
export const princessElla: RPGCharacter = {
  id: 'ella',
  name: 'Princess Ella',
  title: 'The Flower Princess',
  type: 'hero',
  maxHp: 100, // Same as Valor
  attack: 18,
  defense: 8,
  color: 'from-pink-500 to-rose-600',
  abilities: [
    { id: 'thorn_strike', name: 'Thorn Strike', description: 'Sharp thorns pierce the enemy', damage: 22, effect: 'slash', animationType: 'projectile' },
    { id: 'petal_shield', name: 'Petal Shield', description: 'Flower petals form a protective barrier', damage: 0, effect: 'block', animationType: 'buff' },
    { id: 'bloom_burst', name: 'Bloom Burst', description: 'Flowers explode with nature magic', damage: 35, effect: 'fire', animationType: 'aoe' },
    { id: 'natures_embrace', name: "Nature's Embrace", description: 'Healing vines restore HP', damage: -20, effect: 'heal', animationType: 'buff' },
  ],
};

export const allyWizard: RPGCharacter = {
  id: 'wizard',
  name: 'Elara',
  title: 'The Wise Wizard',
  type: 'hero', // Changed to hero - now playable
  maxHp: 100, // Same HP as other heroes
  attack: 35, // Higher attack
  defense: 5,
  color: 'from-purple-500 to-pink-500',
  abilities: [
    { id: 'fireball', name: 'Fireball', description: 'Hurl a ball of fire', damage: 30, effect: 'fire', animationType: 'projectile' },
    { id: 'ice_shard', name: 'Ice Shard', description: 'Freeze your enemy', damage: 20, effect: 'ice', animationType: 'projectile' },
    { id: 'lightning', name: 'Lightning Bolt', description: 'Strike with lightning', damage: 35, effect: 'lightning', animationType: 'projectile' },
    { id: 'plasma_barrage', name: 'Plasma Barrage', description: 'Fast Mode: Say 5 words quickly for 3x damage!', damage: 100, effect: 'lightning', animationType: 'projectile' },
  ],
};

// Regular Enemies - BUFFED
export const goblinMinion: RPGEnemy = {
  id: 'goblin_minion',
  name: 'Goblin Scout',
  type: 'minion',
  maxHp: 320, // 4x: was 80
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
  miniGames: ['word_shield', 'goblin_horde', 'word_barrage', 'dodge_words'], // 80 HP = 2 triggers
  signatureMiniGame: 'goblin_horde', // Signature at 50%
};

export const goblinGuard: RPGEnemy = {
  id: 'goblin_guard',
  name: 'Goblin Guard',
  type: 'guard',
  maxHp: 480, // 4x: was 120
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
  miniGames: ['word_shield', 'dodge_words', 'spell_combo', 'word_barrage', 'goblin_horde'], // 120 HP = 3 triggers
  signatureMiniGame: 'word_shield', // Signature at 50%
};

export const goblinElite: RPGEnemy = {
  id: 'goblin_elite',
  name: 'Goblin Warlord',
  type: 'elite',
  maxHp: 720, // 4x: was 180
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
  // 180 HP = 4 triggers - Elite has challenging mini-games (NO TUG OF WAR in Classic)
  miniGames: ['spell_combo', 'rhyme_chain', 'speed_typist', 'asteroid_barrage', 'dodge_words', 'goblin_horde'],
  signatureMiniGame: 'spell_combo', // Signature at 50%
};

// Boss Enemies - BUFFED
export const grogTheGoblinKing: RPGEnemy = {
  id: 'grog',
  name: 'Grog the Goblin King',
  type: 'final_boss', // Changed to final_boss for menacing treatment
  maxHp: 1200, // 4x: was 300
  attack: 30,
  defense: 15,
  wordDamageMultiplier: 0.4,
  color: 'from-green-900 to-black',
  dialogueIntro: [
    "MWAHAHAHA! So you've finally reached my throne!",
    "You think your puny words can defeat the GOBLIN KING?!",
    "Those books contain too much power. They belong to ME!",
    "FEEL THE EARTH TREMBLE BENEATH MY CLUB!",
  ],
  dialogueAttack: [
    "*MASSIVE club slam*",
    "BOW BEFORE YOUR KING!",
    "I'll crush you like the other heroes!",
    "*GROUND RIPPLE ATTACK*",
  ],
  dialogueDefeat: [
    "NO! This cannot be! My crown... my kingdom...",
    "You... may have defeated me... but Galair will finish you!",
    "The books... take them... I never wanted to read anyway!",
  ],
  specialAbilities: [
    { id: 'royal_slam', name: 'Royal Slam', damage: 25, effect: 'debuff', description: 'Massive damage and stuns', icon: '👑' },
    { id: 'ground_ripple', name: 'Ground Ripple', damage: 0, effect: 'earthquake', description: 'Smashes ground causing word mountains!', icon: '🏔️' },
    { id: 'poison_cloud', name: 'Poison Cloud', damage: 15, effect: 'poison', description: 'Deals heavy damage over time', icon: '☠️' },
    { id: 'word_prison', name: 'Word Prison', damage: 0, effect: 'asteroid_barrage', description: 'Summons word asteroids!', icon: '☄️' },
  ],
  barrageWordCount: 8,
  // 300 HP = 6 triggers - Grog's Ground Ripple is his signature attack (NO TUG OF WAR in Classic)
  miniGames: ['ground_ripple', 'speed_typist', 'rhyme_chain', 'asteroid_barrage', 'word_shield', 'spell_combo', 'goblin_horde'],
  signatureMiniGame: 'ground_ripple', // Signature GROUND RIPPLE at 50%
};

export const galairTheWickedSorcerer: RPGEnemy = {
  id: 'galair',
  name: 'Galair the Wicked Sorcerer',
  type: 'final_boss',
  maxHp: 2000, // 4x: was 500
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
  // 500 HP = 7 triggers - Final boss has all the toughest mini-games (NO TUG OF WAR in Classic)
  miniGames: ['spell_combo', 'ghostly_whispers', 'speed_typist', 'asteroid_barrage', 'fireball_defense', 'rhyme_chain', 'void_pull', 'ground_ripple'],
  signatureMiniGame: 'void_pull', // Signature VOID PULL at 50%
};

// Dragon Enemy - Drake the Dragon (renamed from Dalair)
export const drakeTheDragon: RPGEnemy = {
  id: 'drake',
  name: 'Drake the Dragon',
  type: 'dragon',
  maxHp: 1120, // 4x: was 280
  attack: 35,
  defense: 18,
  wordDamageMultiplier: 0.45,
  color: 'from-orange-600 to-red-900',
  dialogueIntro: [
    "ROOOAAAR! The goblin was just the warm-up!",
    "I am DRAKE, the Fire-Breathing Guardian of Books!",
    "I have incinerated countless readers... you'll be next!",
    "Your words will turn to ASH in my flames!",
    "Watch my FIREBALLS fly!",
  ],
  dialogueAttack: [
    "*breathes scorching flames*",
    "BURN, LITTLE READER!",
    "*massive wing gust*",
    "FIREBALL INCOMING!",
    "My beasts will swarm you!",
  ],
  dialogueDefeat: [
    "Impossible... my flames... extinguished by words...",
    "Your reading power... it burns brighter than my fire...",
    "Perhaps... books aren't for burning after all...",
  ],
  specialAbilities: [
    { id: 'fireball_barrage', name: 'Fireball Barrage', damage: 0, effect: 'fireball_barrage', description: 'Launches fireballs with words!', icon: '🔥' },
    { id: 'beast_swarm', name: 'Beast Swarm', damage: 0, effect: 'word_barrage', description: 'Summons flying beasts with words!', icon: '🦇' },
    { id: 'breath_attack', name: 'Dragon Breath', damage: 25, effect: 'debuff', description: 'Scorching flames reduce damage', icon: '🐉' },
    { id: 'wing_gust', name: 'Wing Gust', damage: 15, effect: 'silence', description: 'Blows away your words', icon: '💨' },
  ],
  barrageWordCount: 7,
  // 280 HP = 5 triggers - Drake's mini-games (NO TUG OF WAR in Classic)
  miniGames: ['beast_swarm', 'fireball_defense', 'fireball_barrage', 'speed_typist', 'dodge_words', 'goblin_horde'],
  signatureMiniGame: 'beast_swarm', // Signature BEAST SWARM at 50%
};

// Mini Flying Beast Enemy (summoned by Drake)
export const miniBeast: RPGEnemy = {
  id: 'mini_beast',
  name: 'Fire Imp',
  type: 'minion',
  maxHp: 30,
  attack: 8,
  defense: 2,
  wordDamageMultiplier: 1.0,
  color: 'from-orange-400 to-red-600',
  dialogueIntro: ["*screeches*"],
  dialogueAttack: ["*dives at you*"],
  dialogueDefeat: ["*poof*"],
  specialAbilities: [],
  barrageWordCount: 1,
  miniGames: [], // No mini-games for summoned creatures
  signatureMiniGame: 'word_barrage', // Fallback
};

// New Enemies - Ice Golem (World 2 Boss)
export const iceGolem: RPGEnemy = {
  id: 'ice_golem',
  name: 'Frostfang the Ice Golem',
  type: 'ice_golem',
  maxHp: 220,
  attack: 28,
  defense: 20,
  wordDamageMultiplier: 0.55,
  color: 'from-cyan-400 to-blue-800',
  dialogueIntro: [
    "FREEZE... LITTLE... READER...",
    "YOUR WORDS... TURN TO ICE...",
    "THE COLD... WILL SILENCE YOU...",
  ],
  dialogueAttack: [
    "*ice crystals form*",
    "FEEL THE CHILL!",
    "*glacial slam*",
  ],
  dialogueDefeat: [
    "I... melt... before your... warmth...",
    "Your words... burn like fire...",
  ],
  specialAbilities: [
    { id: 'ice_crystal_barrage', name: 'Ice Crystal Barrage', damage: 0, effect: 'ice_crystal', description: 'Words appear in freezing crystals!', icon: '❄️' },
    { id: 'frozen_heart', name: 'Frozen Heart', damage: 10, effect: 'freeze', description: 'Slows word acceptance speed', icon: '🧊' },
    { id: 'blizzard', name: 'Blizzard', damage: 15, effect: 'debuff', description: 'Screen fills with snow', icon: '🌨️' },
  ],
  barrageWordCount: 6,
  // 220 HP = 4 triggers
  miniGames: ['ice_crystal_barrage', 'word_shield', 'speed_typist', 'crystal_prison', 'dodge_words'],
  signatureMiniGame: 'ice_crystal_barrage', // Signature ICE CRYSTAL at 50%
};

// Shadow Wraith (World 3 Enemy)
export const shadowWraith: RPGEnemy = {
  id: 'shadow_wraith',
  name: 'Whisper the Shadow Wraith',
  type: 'shadow_wraith',
  maxHp: 180,
  attack: 32,
  defense: 12,
  wordDamageMultiplier: 0.6,
  color: 'from-purple-900 to-slate-900',
  dialogueIntro: [
    "Yooour wooords... faaade into nooothingness...",
    "I AM THE DARKNESS...",
    "Can you read... what you cannot see?",
  ],
  dialogueAttack: [
    "*whispers from shadows*",
    "VANISH!",
    "*soul-draining gaze*",
  ],
  dialogueDefeat: [
    "The light... it burns...",
    "Your voice... disperses the shadows...",
  ],
  specialAbilities: [
    { id: 'ghostly_whispers', name: 'Ghostly Whispers', damage: 0, effect: 'ghostly_whisper', description: 'Words fade over time!', icon: '👻' },
    { id: 'shadow_veil', name: 'Shadow Veil', damage: 0, effect: 'shadow_veil', description: '50% of letters become invisible', icon: '🌑' },
    { id: 'soul_drain', name: 'Soul Drain', damage: 18, effect: 'poison', description: 'Steals HP based on missed words', icon: '💀' },
  ],
  barrageWordCount: 5,
  // 180 HP = 4 triggers
  miniGames: ['ghostly_whispers', 'dodge_words', 'spell_combo', 'void_pull', 'goblin_horde'],
  signatureMiniGame: 'ghostly_whispers', // Signature GHOSTLY WHISPERS at 50%
};

// Stone Guardian (World 3 Boss)
export const stoneGuardian: RPGEnemy = {
  id: 'stone_guardian',
  name: 'Granite the Stone Guardian',
  type: 'stone_guardian',
  maxHp: 350,
  attack: 25,
  defense: 30,
  wordDamageMultiplier: 0.35,
  color: 'from-stone-500 to-stone-800',
  dialogueIntro: [
    "THE MOUNTAIN... PROTECTS... THE BOOKS...",
    "YOU SHALL NOT PASS!",
    "STONE ENDURES... FOREVER...",
  ],
  dialogueAttack: [
    "*massive boulder slam*",
    "CRUMBLE BEFORE ME!",
    "*the earth shakes*",
  ],
  dialogueDefeat: [
    "The mountain... falls...",
    "Your words... crack even stone...",
  ],
  specialAbilities: [
    { id: 'rolling_boulders', name: 'Rolling Boulders', damage: 0, effect: 'rolling_boulder', description: 'Words on rolling rocks!', icon: '🪨' },
    { id: 'earthquake', name: 'Earthquake', damage: 12, effect: 'earthquake', description: 'Shakes and jumbles words', icon: '🌋' },
    { id: 'stone_armor', name: 'Stone Armor', damage: 0, effect: 'debuff', description: 'Reduces damage until 5-word streak', icon: '🛡️' },
  ],
  barrageWordCount: 7,
  // 350 HP = 6 triggers (NO TUG OF WAR in Classic)
  miniGames: ['rolling_boulders', 'speed_typist', 'word_shield', 'asteroid_barrage', 'spell_combo', 'rhyme_chain', 'goblin_horde'],
  signatureMiniGame: 'rolling_boulders', // Signature ROLLING BOULDERS at 50%
};

// ========== NEW ENEMY: Goblin Shaman (Elite magic user) ==========
export const goblinShaman: RPGEnemy = {
  id: 'goblin_shaman',
  name: 'Zix the Goblin Shaman',
  type: 'elite',
  maxHp: 160,
  attack: 26,
  defense: 10,
  wordDamageMultiplier: 0.55,
  color: 'from-violet-600 to-purple-900',
  dialogueIntro: [
    "Hehehe... the spirits speak to me...",
    "My dark magic will confuse your words!",
    "The shadows obey MY command!",
  ],
  dialogueAttack: [
    "*casts shadow bolt*",
    "WORD CONFUSION!",
    "*hexing chant*",
  ],
  dialogueDefeat: [
    "The spirits... abandon me...",
    "Your reading... breaks my spells...",
  ],
  specialAbilities: [
    { id: 'word_confusion', name: 'Word Confusion', damage: 0, effect: 'debuff', description: 'Spawns fake misspelled words!', icon: '🔮' },
    { id: 'shadow_hex', name: 'Shadow Hex', damage: 14, effect: 'poison', description: 'Curses with shadow damage', icon: '💀' },
    { id: 'spirit_drain', name: 'Spirit Drain', damage: 10, effect: 'silence', description: 'Drains magic power', icon: '👻' },
  ],
  barrageWordCount: 5,
  // 160 HP = 3-4 triggers - Shaman specializes in tricky word games
  miniGames: ['ghostly_whispers', 'dodge_words', 'spell_combo', 'void_pull', 'goblin_horde'],
  signatureMiniGame: 'ghostly_whispers', // Signature GHOSTLY WHISPERS at 50%
};

// ========== NEW WORLD 5 ENEMIES: The Whispering Caverns ==========

// Cave Troll - Slow but powerful
export const caveTroll: RPGEnemy = {
  id: 'cave_troll',
  name: 'Grumbold the Cave Troll',
  type: 'minion', // Uses minion type for compatibility
  maxHp: 200,
  attack: 30,
  defense: 25,
  wordDamageMultiplier: 0.5,
  color: 'from-stone-600 to-slate-800',
  dialogueIntro: [
    "GRRRR... WHO DISTURBS MY CAVE...",
    "ME CRUSH TINY READER...",
    "WORDS MAKE HEAD HURT...",
  ],
  dialogueAttack: [
    "*massive club swing*",
    "SMASH!",
    "*ground-shaking stomp*",
  ],
  dialogueDefeat: [
    "Ugh... me go sleep now...",
    "Words... too... powerful...",
  ],
  specialAbilities: [
    { id: 'cave_smash', name: 'Cave Smash', damage: 20, effect: 'earthquake', description: 'Shakes the screen', icon: '🪨' },
    { id: 'boulder_throw', name: 'Boulder Throw', damage: 15, effect: 'debuff', description: 'Reduces accuracy', icon: '⚫' },
  ],
  barrageWordCount: 5,
  // 200 HP = 4 triggers (NO TUG OF WAR in Classic)
  miniGames: ['rolling_boulders', 'word_shield', 'speed_typist', 'word_echo', 'goblin_horde'],
  signatureMiniGame: 'word_echo', // Signature WORD ECHO at 50%
};

// Crystal Spider - Fast, multiple attacks
export const crystalSpider: RPGEnemy = {
  id: 'crystal_spider',
  name: 'Prism the Crystal Spider',
  type: 'minion',
  maxHp: 100,
  attack: 18,
  defense: 8,
  wordDamageMultiplier: 0.8,
  color: 'from-violet-400 to-pink-600',
  dialogueIntro: [
    "*crystalline clicking sounds*",
    "My webs trap words in crystal...",
    "You cannot escape my prismatic prison!",
  ],
  dialogueAttack: [
    "*rapid leg strikes*",
    "CRYSTAL VENOM!",
    "*web shot*",
  ],
  dialogueDefeat: [
    "*shatters into fragments*",
    "My crystals... broken...",
  ],
  specialAbilities: [
    { id: 'crystal_web', name: 'Crystal Web', damage: 0, effect: 'silence', description: 'Traps next word in crystal', icon: '🕸️' },
    { id: 'prism_beam', name: 'Prism Beam', damage: 12, effect: 'debuff', description: 'Dazzling light attack', icon: '💎' },
  ],
  barrageWordCount: 4,
  // 100 HP = 2 triggers
  miniGames: ['dodge_words', 'spell_combo', 'goblin_horde', 'web_trap'],
  signatureMiniGame: 'web_trap', // Signature WEB TRAP at 50%
};

// Echo Wraith - Boss of World 5 (words must be repeated)
export const echoWraith: RPGEnemy = {
  id: 'echo_wraith',
  name: 'Echo the Wraith of Whispers',
  type: 'boss',
  maxHp: 280,
  attack: 28,
  defense: 15,
  wordDamageMultiplier: 0.4,
  color: 'from-slate-400 to-zinc-700',
  dialogueIntro: [
    "Echo... echo... echo...",
    "Your words return to me... empty...",
    "In the caverns, all sounds belong to ME!",
    "Repeat after me... if you dare...",
  ],
  dialogueAttack: [
    "*voice echoes painfully*",
    "HEAR YOUR OWN FAILURE!",
    "*sonic waves*",
  ],
  dialogueDefeat: [
    "The echoes... fade...",
    "Your voice... stronger than mine...",
    "Silence... at last...",
  ],
  specialAbilities: [
    { id: 'echo_chamber', name: 'Echo Chamber', damage: 0, effect: 'ghostly_whisper', description: 'Words echo and fade!', icon: '🗣️' },
    { id: 'sonic_scream', name: 'Sonic Scream', damage: 22, effect: 'debuff', description: 'Deafening attack', icon: '📢' },
    { id: 'whisper_trap', name: 'Whisper Trap', damage: 0, effect: 'silence', description: 'Silences magic', icon: '🤫' },
  ],
  barrageWordCount: 8,
  // 280 HP = 5 triggers - Echo Wraith boss
  miniGames: ['ghostly_whispers', 'rhyme_chain', 'speed_typist', 'void_pull', 'word_echo', 'spell_combo'],
  signatureMiniGame: 'word_echo', // Signature WORD ECHO at 50%
};

// ========== NEW WORLD 6 ENEMIES: The Floating Isles ==========

// Storm Harpy - Flying attacks
export const stormHarpy: RPGEnemy = {
  id: 'storm_harpy',
  name: 'Tempest the Storm Harpy',
  type: 'guard',
  maxHp: 120,
  attack: 22,
  defense: 10,
  wordDamageMultiplier: 0.7,
  color: 'from-sky-400 to-indigo-600',
  dialogueIntro: [
    "*fierce wind sounds*",
    "The winds carry your words AWAY!",
    "You cannot read what flies past you!",
  ],
  dialogueAttack: [
    "*diving talon strike*",
    "WINDS OF FURY!",
    "*feather storm*",
  ],
  dialogueDefeat: [
    "My wings... grounded...",
    "The storm... passes...",
  ],
  specialAbilities: [
    { id: 'wind_gust', name: 'Wind Gust', damage: 10, effect: 'debuff', description: 'Words blow across screen', icon: '💨' },
    { id: 'talon_dive', name: 'Talon Dive', damage: 18, effect: 'poison', description: 'Bleeding damage', icon: '🦅' },
  ],
  barrageWordCount: 5,
  // 120 HP = 3 triggers
  miniGames: ['dodge_words', 'goblin_horde', 'word_shield', 'wind_chase', 'lightning_storm'],
  signatureMiniGame: 'wind_chase', // Signature WIND CHASE at 50%
};

// Cloud Giant - Massive HP
export const cloudGiant: RPGEnemy = {
  id: 'cloud_giant',
  name: 'Cumulus the Cloud Giant',
  type: 'elite',
  maxHp: 320,
  attack: 25,
  defense: 20,
  wordDamageMultiplier: 0.35,
  color: 'from-gray-300 to-slate-500',
  dialogueIntro: [
    "WHO DISTURBS MY SLUMBER...",
    "I DREAM OF ENDLESS SKIES...",
    "YOUR WORDS ARE BUT WHISPERS TO ME...",
  ],
  dialogueAttack: [
    "*thunderous fist slam*",
    "CLOUD CRUSH!",
    "*lightning breath*",
  ],
  dialogueDefeat: [
    "I return... to the clouds...",
    "Sleep... calls me...",
  ],
  specialAbilities: [
    { id: 'thunder_clap', name: 'Thunder Clap', damage: 18, effect: 'earthquake', description: 'Shakes everything', icon: '⚡' },
    { id: 'cloud_cover', name: 'Cloud Cover', damage: 0, effect: 'shadow_veil', description: 'Words become foggy', icon: '☁️' },
  ],
  barrageWordCount: 6,
  // 320 HP = 6 triggers
  miniGames: ['goblin_horde', 'speed_typist', 'rolling_boulders', 'lightning_storm', 'asteroid_barrage', 'word_shield', 'spell_combo'],
  signatureMiniGame: 'lightning_storm', // Signature LIGHTNING STORM at 50%
};

// Zephyr the Wind Lord - Boss of World 6
export const zephyr: RPGEnemy = {
  id: 'zephyr',
  name: 'Zephyr the Wind Lord',
  type: 'boss',
  maxHp: 350,
  attack: 32,
  defense: 18,
  wordDamageMultiplier: 0.38,
  color: 'from-cyan-300 to-blue-600',
  dialogueIntro: [
    "I AM THE WIND ITSELF!",
    "Words blow away before you can speak them!",
    "The sky belongs to ME, mortal!",
    "Try to catch my STORM!",
  ],
  dialogueAttack: [
    "*hurricane blast*",
    "CYCLONE OF CHAOS!",
    "*tornado spin*",
  ],
  dialogueDefeat: [
    "The wind... dies down...",
    "Your voice... cuts through the storm...",
    "I shall drift away...",
  ],
  specialAbilities: [
    { id: 'hurricane', name: 'Hurricane', damage: 25, effect: 'debuff', description: 'Massive wind damage', icon: '🌀' },
    { id: 'wind_chase', name: 'Wind Chase', damage: 0, effect: 'word_barrage', description: 'Words fly across screen', icon: '💨' },
    { id: 'sky_barrier', name: 'Sky Barrier', damage: 0, effect: 'debuff', description: 'Reduces damage temporarily', icon: '🛡️' },
  ],
  barrageWordCount: 9,
  // 350 HP = 6 triggers - Zephyr boss
  miniGames: ['speed_typist', 'goblin_horde', 'dodge_words', 'fireball_defense', 'wind_chase', 'lightning_storm', 'rhyme_chain'],
  signatureMiniGame: 'wind_chase', // Signature WIND CHASE at 50%
};

// ========== NEW WORLD 7 ENEMIES: The Sunken Library ==========

// Ink Kraken - Obscures words
export const inkKraken: RPGEnemy = {
  id: 'ink_kraken',
  name: 'Inkling the Ink Kraken',
  type: 'guard',
  maxHp: 180,
  attack: 24,
  defense: 14,
  wordDamageMultiplier: 0.55,
  color: 'from-slate-800 to-purple-900',
  dialogueIntro: [
    "*bubbling sounds*",
    "My ink clouds ALL knowledge...",
    "You cannot read what you cannot SEE!",
  ],
  dialogueAttack: [
    "*tentacle whip*",
    "INK BLAST!",
    "*crushing grip*",
  ],
  dialogueDefeat: [
    "My ink... washes away...",
    "The words... shine through...",
  ],
  specialAbilities: [
    { id: 'ink_cloud', name: 'Ink Cloud', damage: 0, effect: 'shadow_veil', description: 'Words become obscured', icon: '🦑' },
    { id: 'tentacle_slam', name: 'Tentacle Slam', damage: 16, effect: 'poison', description: 'Crushing damage', icon: '🐙' },
  ],
  barrageWordCount: 5,
  // 180 HP = 4 triggers
  miniGames: ['ghostly_whispers', 'word_shield', 'dodge_words', 'ink_splash', 'void_pull'],
  signatureMiniGame: 'ink_splash', // Signature INK SPLASH at 50%
};

// Reef Guardian - Coral armor
export const reefGuardian: RPGEnemy = {
  id: 'reef_guardian',
  name: 'Coral the Reef Guardian',
  type: 'guard',
  maxHp: 160,
  attack: 20,
  defense: 28,
  wordDamageMultiplier: 0.45,
  color: 'from-pink-400 to-orange-500',
  dialogueIntro: [
    "The reef protects all knowledge...",
    "My coral armor is unbreakable!",
    "You shall not pass to the depths!",
  ],
  dialogueAttack: [
    "*coral spike attack*",
    "REEF RUSH!",
    "*shell shield bash*",
  ],
  dialogueDefeat: [
    "The coral... crumbles...",
    "The depths... are open...",
  ],
  specialAbilities: [
    { id: 'coral_shield', name: 'Coral Shield', damage: 0, effect: 'debuff', description: 'Reduces incoming damage', icon: '🐚' },
    { id: 'reef_thorns', name: 'Reef Thorns', damage: 12, effect: 'poison', description: 'Poison damage over time', icon: '🪸' },
  ],
  barrageWordCount: 5,
  // 160 HP = 3 triggers
  miniGames: ['word_shield', 'rolling_boulders', 'goblin_horde', 'crystal_prison'],
  signatureMiniGame: 'crystal_prison', // Signature CRYSTAL PRISON at 50%
};

// Leviathan - Boss of World 7 (epic multi-phase battle)
export const leviathan: RPGEnemy = {
  id: 'leviathan',
  name: 'Leviathan the Ancient',
  type: 'boss',
  maxHp: 450,
  attack: 38,
  defense: 22,
  wordDamageMultiplier: 0.28,
  color: 'from-teal-600 to-blue-900',
  dialogueIntro: [
    "*the ocean trembles*",
    "I AM THE LEVIATHAN!",
    "I have guarded these books for a THOUSAND years!",
    "None have ever defeated me... NONE!",
    "Prepare for the ULTIMATE CHALLENGE!",
  ],
  dialogueAttack: [
    "*massive tail sweep*",
    "TIDAL WAVE!",
    "*crushing jaws*",
    "THE DEPTHS CONSUME YOU!",
  ],
  dialogueDefeat: [
    "After a thousand years... I rest...",
    "Your words... reach the deepest ocean...",
    "The library... is yours...",
  ],
  specialAbilities: [
    { id: 'tidal_wave', name: 'Tidal Wave', damage: 30, effect: 'earthquake', description: 'Massive water attack', icon: '🌊' },
    { id: 'abyssal_gaze', name: 'Abyssal Gaze', damage: 0, effect: 'silence', description: 'Paralyzes with fear', icon: '👁️' },
    { id: 'whirlpool', name: 'Whirlpool', damage: 20, effect: 'debuff', description: 'Words spin around', icon: '🌀' },
  ],
  barrageWordCount: 10,
  // 450 HP = 7 triggers - Leviathan boss
  miniGames: ['goblin_horde', 'speed_typist', 'asteroid_barrage', 'fireball_defense', 'ink_splash', 'void_pull', 'rhyme_chain', 'spell_combo'],
  signatureMiniGame: 'ink_splash', // Signature INK SPLASH at 50%
};

// ========== NEW WORLD 8 ENEMIES: The Void Between ==========

// Void Phantom - Flickers in and out
export const voidPhantom: RPGEnemy = {
  id: 'void_phantom',
  name: 'Nihil the Void Phantom',
  type: 'guard',
  maxHp: 140,
  attack: 26,
  defense: 8,
  wordDamageMultiplier: 0.6,
  color: 'from-purple-900 to-black',
  dialogueIntro: [
    "*flickers in and out of existence*",
    "I am... nothing... and everything...",
    "Your words... have no meaning here...",
  ],
  dialogueAttack: [
    "*phases through reality*",
    "VOID TOUCH!",
    "*reality tears*",
  ],
  dialogueDefeat: [
    "I return... to nothing...",
    "The void... releases me...",
  ],
  specialAbilities: [
    { id: 'void_phase', name: 'Void Phase', damage: 0, effect: 'shadow_veil', description: 'Becomes invisible briefly', icon: '👻' },
    { id: 'null_strike', name: 'Null Strike', damage: 18, effect: 'silence', description: 'Erases words', icon: '🕳️' },
  ],
  barrageWordCount: 5,
  // 140 HP = 3 triggers
  miniGames: ['ghostly_whispers', 'dodge_words', 'spell_combo', 'void_pull'],
  signatureMiniGame: 'void_pull', // Signature VOID PULL at 50%
};

// Reality Shifter - Words change mid-reading
export const realityShifter: RPGEnemy = {
  id: 'reality_shifter',
  name: 'Paradox the Reality Shifter',
  type: 'elite',
  maxHp: 220,
  attack: 28,
  defense: 16,
  wordDamageMultiplier: 0.42,
  color: 'from-violet-600 to-pink-900',
  dialogueIntro: [
    "Reality is... flexible...",
    "What you read... may not be what you see...",
    "I SHIFT the very nature of words!",
  ],
  dialogueAttack: [
    "*bends reality*",
    "PARADOX PULSE!",
    "*time distortion*",
  ],
  dialogueDefeat: [
    "Reality... stabilizes...",
    "Your truth... is stronger...",
  ],
  specialAbilities: [
    { id: 'reality_warp', name: 'Reality Warp', damage: 0, effect: 'debuff', description: 'Words shift positions', icon: '🔮' },
    { id: 'temporal_blast', name: 'Temporal Blast', damage: 22, effect: 'earthquake', description: 'Time-distorting attack', icon: '⏰' },
  ],
  barrageWordCount: 7,
  // 220 HP = 4 triggers
  miniGames: ['speed_typist', 'rhyme_chain', 'goblin_horde', 'asteroid_barrage', 'void_pull', 'lightning_storm'],
  signatureMiniGame: 'asteroid_barrage', // Signature WORD PRISON at 50%
};

// Word Eater - Final Boss of the entire campaign
export const wordEater: RPGEnemy = {
  id: 'word_eater',
  name: 'The Word Eater',
  type: 'final_boss',
  maxHp: 600,
  attack: 45,
  defense: 25,
  wordDamageMultiplier: 0.22,
  color: 'from-black via-purple-950 to-violet-900',
  dialogueIntro: [
    "*an abyss opens before you*",
    "I... AM... THE WORD EATER...",
    "I consume ALL knowledge... ALL language...",
    "Every word you've ever read... I will DEVOUR!",
    "This is the END of your journey, little reader...",
    "NO ONE has EVER defeated me!",
  ],
  dialogueAttack: [
    "*reality tears apart*",
    "YOUR WORDS ARE MINE!",
    "*devours language itself*",
    "NOTHING ESCAPES THE VOID!",
  ],
  dialogueDefeat: [
    "IMPOSSIBLE!",
    "Your words... they BURN...",
    "Knowledge... is... ETERNAL...",
    "You have proven... reading conquers ALL...",
    "The books... are finally... SAFE...",
  ],
  specialAbilities: [
    { id: 'word_devour', name: 'Word Devour', damage: 0, effect: 'asteroid_barrage', description: 'Consumes words from screen!', icon: '🕳️' },
    { id: 'void_scream', name: 'Void Scream', damage: 35, effect: 'debuff', description: 'Devastating void attack', icon: '💀' },
    { id: 'language_drain', name: 'Language Drain', damage: 0, effect: 'silence', description: 'Silences all abilities', icon: '🔇' },
    { id: 'reality_end', name: 'Reality End', damage: 40, effect: 'earthquake', description: 'Cataclysmic damage', icon: '🌑' },
  ],
  barrageWordCount: 12,
  // 600 HP = 7 triggers - THE ULTIMATE FINAL BOSS (NO TUG OF WAR in Classic)
  miniGames: ['asteroid_barrage', 'speed_typist', 'ghostly_whispers', 'fireball_defense', 'void_pull', 'ink_splash', 'lightning_storm', 'ground_ripple'],
  signatureMiniGame: 'void_pull', // THE ULTIMATE SIGNATURE - VOID PULL at 50%
};

// Get enemy by type for battle - UPDATED with all new enemies
export type EnemyTypeKey = 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss' | 'dragon' | 'mini_beast' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian' | 'cave_troll' | 'crystal_spider' | 'echo_wraith' | 'storm_harpy' | 'cloud_giant' | 'zephyr' | 'ink_kraken' | 'reef_guardian' | 'leviathan' | 'void_phantom' | 'reality_shifter' | 'word_eater' | 'goblin_shaman';

export const getEnemyForBattle = (enemyType: EnemyTypeKey): RPGEnemy => {
  switch (enemyType) {
    case 'minion':
      return goblinMinion;
    case 'guard':
      return goblinGuard;
    case 'elite':
      return goblinElite;
    case 'goblin_shaman':
      return goblinShaman;
    case 'boss':
      return grogTheGoblinKing;
    case 'final_boss':
      return galairTheWickedSorcerer;
    case 'dragon':
      return drakeTheDragon;
    case 'mini_beast':
      return miniBeast;
    case 'ice_golem':
      return iceGolem;
    case 'shadow_wraith':
      return shadowWraith;
    case 'stone_guardian':
      return stoneGuardian;
    // NEW enemies
    case 'cave_troll':
      return caveTroll;
    case 'crystal_spider':
      return crystalSpider;
    case 'echo_wraith':
      return echoWraith;
    case 'storm_harpy':
      return stormHarpy;
    case 'cloud_giant':
      return cloudGiant;
    case 'zephyr':
      return zephyr;
    case 'ink_kraken':
      return inkKraken;
    case 'reef_guardian':
      return reefGuardian;
    case 'leviathan':
      return leviathan;
    case 'void_phantom':
      return voidPhantom;
    case 'reality_shifter':
      return realityShifter;
    case 'word_eater':
      return wordEater;
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
