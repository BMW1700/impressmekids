// Campaign data for Grog the Goblin King Story Campaign

export type CampaignEnemyType = 'minion' | 'guard' | 'elite' | 'boss' | 'dragon' | 'final_boss' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian' | 'cave_troll' | 'crystal_spider' | 'echo_wraith' | 'storm_harpy' | 'cloud_giant' | 'zephyr' | 'ink_kraken' | 'reef_guardian' | 'leviathan' | 'void_phantom' | 'reality_shifter' | 'word_eater';

export interface CampaignLevel {
  id: number;
  storyIndex: number; // Index into curatedStories
  enemies: CampaignEnemyType[];
  isBossLevel: boolean;
  starThresholds: [number, number, number]; // Accuracy % for 1/2/3 stars
}

export interface CampaignWorld {
  id: number;
  name: string;
  description: string;
  gradient: string;
  bgColor: string;
  enemyTypes: CampaignEnemyType[];
  requiredGradeLevel: number;
  storyCount: number;
  unlockRequirement: number; // Books rescued in previous world to unlock
  lore: string;
  levels: CampaignLevel[];
}

export interface CampaignCharacter {
  name: string;
  title: string;
  description: string;
  quote: string;
}

// Princess Ella - The story's protagonist
export const princessElla: CampaignCharacter = {
  name: 'Princess Ella',
  title: 'Keeper of the Royal Library',
  description: 'Princess Ella loves books more than anything in the world. Her library was the most magical place in the kingdom until Grog stole all the books!',
  quote: 'Every book you rescue brings more magic back to our kingdom!',
};

// Grog the Goblin King - The villain
export const grogTheGoblinKing: CampaignCharacter = {
  name: 'Grog',
  title: 'The Goblin King',
  description: 'Grog hates reading! He stole all the books so nobody could learn anymore. But brave readers like you can stop him!',
  quote: 'You\'ll never get these books back! Reading is boring! Mwahahaha!',
};

// Campaign worlds with level structure - 9 WORLDS TOTAL (including Tutorial)
export const campaignWorlds: CampaignWorld[] = [
  // TUTORIAL WORLD - Always first, always unlocked
  {
    id: 0,
    name: 'Tutorial Island',
    description: 'Learn how to read and battle! Your adventure begins here!',
    gradient: 'from-green-300 via-emerald-400 to-teal-400',
    bgColor: 'bg-green-900/20',
    enemyTypes: ['minion'],
    requiredGradeLevel: 0,
    storyCount: 3,
    unlockRequirement: 0,
    lore: 'Welcome to Impress Me Kids! This is where every great reader begins their journey. Practice reading words to attack enemies, learn about mini-games, and discover the magic of reading! Princess Ella herself will guide you!',
    levels: [
      { id: 1, storyIndex: 0, enemies: ['minion'], isBossLevel: false, starThresholds: [40, 60, 80] },
      { id: 2, storyIndex: 1, enemies: ['minion'], isBossLevel: false, starThresholds: [40, 60, 80] },
      { id: 3, storyIndex: 2, enemies: ['minion'], isBossLevel: false, starThresholds: [40, 60, 80] },
    ],
  },
  {
    id: 1,
    name: 'The Enchanted Forest',
    description: 'Where Grog\'s goblins first scattered the stolen books',
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    bgColor: 'bg-emerald-900/20',
    enemyTypes: ['minion'],
    requiredGradeLevel: 0,
    storyCount: 5,
    unlockRequirement: 0,
    lore: 'The Enchanted Forest was once full of reading fairies who would help children learn. Now Grog\'s minions roam the trees, guarding the stolen books.',
    levels: [
      { id: 1, storyIndex: 0, enemies: ['minion'], isBossLevel: false, starThresholds: [60, 80, 95] },
      { id: 2, storyIndex: 1, enemies: ['minion'], isBossLevel: false, starThresholds: [60, 80, 95] },
      { id: 3, storyIndex: 2, enemies: ['minion', 'minion'], isBossLevel: false, starThresholds: [60, 80, 95] },
      { id: 4, storyIndex: 3, enemies: ['minion', 'guard'], isBossLevel: false, starThresholds: [55, 75, 90] },
      { id: 5, storyIndex: 4, enemies: ['guard', 'dragon'], isBossLevel: true, starThresholds: [50, 70, 85] },
    ],
  },
  {
    id: 2,
    name: 'The Frozen Depths',
    description: 'The icy caverns where the Ice Golem guards stolen books',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-700',
    bgColor: 'bg-cyan-900/30',
    enemyTypes: ['minion', 'guard'],
    requiredGradeLevel: 1,
    storyCount: 6,
    unlockRequirement: 3,
    lore: 'The Frozen Depths are cold and treacherous. An ancient Ice Golem guards the deepest chambers where Grog hid the most magical books.',
    levels: [
      { id: 1, storyIndex: 5, enemies: ['guard'], isBossLevel: false, starThresholds: [60, 80, 95] },
      { id: 2, storyIndex: 6, enemies: ['guard', 'minion'], isBossLevel: false, starThresholds: [55, 75, 90] },
      { id: 3, storyIndex: 7, enemies: ['shadow_wraith'], isBossLevel: false, starThresholds: [55, 75, 90] },
      { id: 4, storyIndex: 8, enemies: ['elite'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 5, storyIndex: 9, enemies: ['shadow_wraith', 'guard'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 6, storyIndex: 10, enemies: ['ice_golem'], isBossLevel: true, starThresholds: [45, 65, 80] },
    ],
  },
  {
    id: 3,
    name: 'The Ancient Ruins',
    description: 'Where the Stone Guardian protects ancient knowledge',
    gradient: 'from-amber-500 via-orange-500 to-stone-600',
    bgColor: 'bg-stone-900/20',
    enemyTypes: ['guard', 'elite'],
    requiredGradeLevel: 2,
    storyCount: 7,
    unlockRequirement: 5,
    lore: 'The Ancient Ruins hold secrets older than the kingdom itself. A massive Stone Guardian awakens to stop any who seek the books.',
    levels: [
      { id: 1, storyIndex: 11, enemies: ['elite'], isBossLevel: false, starThresholds: [55, 75, 90] },
      { id: 2, storyIndex: 12, enemies: ['shadow_wraith', 'guard'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 3, storyIndex: 13, enemies: ['elite', 'elite'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 4, storyIndex: 14, enemies: ['shadow_wraith', 'shadow_wraith'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 5, storyIndex: 15, enemies: ['boss'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 6, storyIndex: 16, enemies: ['boss', 'elite'], isBossLevel: false, starThresholds: [40, 60, 75] },
      { id: 7, storyIndex: 17, enemies: ['stone_guardian'], isBossLevel: true, starThresholds: [40, 60, 75] },
    ],
  },
  {
    id: 4,
    name: 'The Throne Room',
    description: 'Face Grog himself and rescue the final books!',
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    bgColor: 'bg-amber-900/20',
    enemyTypes: ['elite'],
    requiredGradeLevel: 3,
    storyCount: 5,
    unlockRequirement: 6,
    lore: 'Grog\'s Throne Room is filled with mountains of stolen books. This is where the Goblin King himself guards the most precious stories. Defeat him to save them all!',
    levels: [
      { id: 1, storyIndex: 18, enemies: ['boss', 'elite'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 2, storyIndex: 19, enemies: ['boss', 'elite', 'guard'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 3, storyIndex: 20, enemies: ['boss', 'boss'], isBossLevel: false, starThresholds: [40, 60, 75] },
      { id: 4, storyIndex: 21, enemies: ['boss', 'dragon'], isBossLevel: false, starThresholds: [40, 60, 75] },
      { id: 5, storyIndex: 22, enemies: ['final_boss', 'dragon'], isBossLevel: true, starThresholds: [35, 55, 70] },
    ],
  },
  // NEW WORLD 5: The Whispering Caverns
  {
    id: 5,
    name: 'The Whispering Caverns',
    description: 'Underground caves where echoes carry ancient secrets',
    gradient: 'from-slate-600 via-stone-700 to-zinc-800',
    bgColor: 'bg-slate-900/30',
    enemyTypes: ['cave_troll', 'crystal_spider'],
    requiredGradeLevel: 2,
    storyCount: 6,
    unlockRequirement: 4,
    lore: 'Deep beneath the mountains, the Whispering Caverns echo with forgotten words. The Echo Wraith feeds on silence, trapping knowledge in crystal prisons. Cave Trolls guard every passage.',
    levels: [
      { id: 1, storyIndex: 23, enemies: ['cave_troll'], isBossLevel: false, starThresholds: [55, 75, 90] },
      { id: 2, storyIndex: 24, enemies: ['crystal_spider', 'crystal_spider'], isBossLevel: false, starThresholds: [55, 75, 90] },
      { id: 3, storyIndex: 25, enemies: ['cave_troll', 'crystal_spider'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 4, storyIndex: 26, enemies: ['cave_troll', 'cave_troll'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 5, storyIndex: 27, enemies: ['elite', 'cave_troll'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 6, storyIndex: 28, enemies: ['echo_wraith'], isBossLevel: true, starThresholds: [45, 65, 80] },
    ],
  },
  // NEW WORLD 6: The Floating Isles
  {
    id: 6,
    name: 'The Floating Isles',
    description: 'Sky islands where words dance on the wind',
    gradient: 'from-sky-400 via-blue-400 to-indigo-500',
    bgColor: 'bg-sky-900/20',
    enemyTypes: ['storm_harpy', 'cloud_giant'],
    requiredGradeLevel: 3,
    storyCount: 6,
    unlockRequirement: 5,
    lore: 'High above the clouds, the Floating Isles drift on magical currents. Storm Harpies snatch books from travelers, while Cloud Giants slumber on word-clouds. Zephyr the Wind Lord rules these skies.',
    levels: [
      { id: 1, storyIndex: 29, enemies: ['storm_harpy'], isBossLevel: false, starThresholds: [55, 75, 90] },
      { id: 2, storyIndex: 30, enemies: ['storm_harpy', 'storm_harpy'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 3, storyIndex: 31, enemies: ['cloud_giant'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 4, storyIndex: 32, enemies: ['storm_harpy', 'cloud_giant'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 5, storyIndex: 33, enemies: ['cloud_giant', 'cloud_giant'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 6, storyIndex: 34, enemies: ['zephyr'], isBossLevel: true, starThresholds: [40, 60, 75] },
    ],
  },
  // NEW WORLD 7: The Sunken Library
  {
    id: 7,
    name: 'The Sunken Library',
    description: 'An underwater realm of forgotten knowledge',
    gradient: 'from-teal-600 via-cyan-700 to-blue-900',
    bgColor: 'bg-teal-900/30',
    enemyTypes: ['ink_kraken', 'reef_guardian'],
    requiredGradeLevel: 4,
    storyCount: 7,
    unlockRequirement: 5,
    lore: 'Beneath the waves lies a sunken library, its books protected by waterproof magic. The Ink Kraken obscures words with its dark ink, while Reef Guardians have grown coral armor over centuries. The mighty Leviathan guards the deepest texts.',
    levels: [
      { id: 1, storyIndex: 35, enemies: ['reef_guardian'], isBossLevel: false, starThresholds: [55, 75, 90] },
      { id: 2, storyIndex: 36, enemies: ['ink_kraken'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 3, storyIndex: 37, enemies: ['reef_guardian', 'reef_guardian'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 4, storyIndex: 38, enemies: ['ink_kraken', 'reef_guardian'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 5, storyIndex: 39, enemies: ['ink_kraken', 'ink_kraken'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 6, storyIndex: 40, enemies: ['elite', 'ink_kraken'], isBossLevel: false, starThresholds: [40, 60, 75] },
      { id: 7, storyIndex: 41, enemies: ['leviathan'], isBossLevel: true, starThresholds: [35, 55, 70] },
    ],
  },
  // NEW WORLD 8: The Void Between
  {
    id: 8,
    name: 'The Void Between',
    description: 'The final dimension where words become reality',
    gradient: 'from-purple-900 via-violet-950 to-black',
    bgColor: 'bg-purple-950/40',
    enemyTypes: ['void_phantom', 'reality_shifter'],
    requiredGradeLevel: 5,
    storyCount: 5,
    unlockRequirement: 6,
    lore: 'Beyond reality itself lies The Void Between - a dimension where words have ultimate power. Void Phantoms flicker in and out of existence, Reality Shifters warp the very nature of language, and The Word Eater consumes all knowledge. This is the ultimate challenge for a Master Reader.',
    levels: [
      { id: 1, storyIndex: 42, enemies: ['void_phantom', 'void_phantom'], isBossLevel: false, starThresholds: [50, 70, 85] },
      { id: 2, storyIndex: 43, enemies: ['reality_shifter'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 3, storyIndex: 44, enemies: ['void_phantom', 'reality_shifter'], isBossLevel: false, starThresholds: [45, 65, 80] },
      { id: 4, storyIndex: 45, enemies: ['reality_shifter', 'reality_shifter'], isBossLevel: false, starThresholds: [40, 60, 75] },
      { id: 5, storyIndex: 46, enemies: ['word_eater'], isBossLevel: true, starThresholds: [35, 55, 70] },
    ],
  },
];

// Goblin phrases for battle taunts
export const goblinTaunts = {
  battleStart: [
    'You\'ll never rescue this book!',
    'Reading is for losers!',
    'Grog sent me to stop you!',
    'This book is mine now!',
    'Give up, little reader!',
  ],
  playerHit: [
    'Ha! You messed up!',
    'Wrong word, wrong word!',
    'My turn to attack!',
    'Reading is hard, isn\'t it?',
    'Grog will be pleased!',
  ],
  goblinHit: [
    'Ow! That hurt!',
    'Stop reading so well!',
    'Nooo, my health!',
    'You\'re too good at this!',
    'I don\'t like this game!',
  ],
  goblinDefeated: [
    'I\'ll tell Grog about this!',
    'You win this time...',
    'The book is yours... for now!',
    'I\'m telling my mommy goblin!',
    'Retreating!',
  ],
  grogTaunts: [
    'I am Grog, the Goblin King!',
    'No one defeats ME!',
    'These books belong to the goblins now!',
    'You dare challenge the king?!',
    'Princess Ella will never see her books again!',
  ],
};

// Encouraging messages for players
export const encouragingMessages = {
  correctWord: [
    'Great job!',
    'You got it!',
    'Perfect!',
    'Amazing!',
    'Keep going!',
  ],
  streak3: [
    'Nice streak!',
    '3 in a row!',
    'You\'re on fire!',
    'Keep it up!',
  ],
  streak5: [
    'CRITICAL HIT!',
    '5 streak! Wow!',
    'Super reader!',
    'Unstoppable!',
  ],
  streak10: [
    'LEGENDARY!',
    '10 STREAK!',
    'MEGA DAMAGE!',
    'INCREDIBLE!',
  ],
  nearVictory: [
    'Almost there!',
    'One more hit!',
    'You can do it!',
    'Finish strong!',
  ],
  victory: [
    'You did it!',
    'Book rescued!',
    'Amazing work!',
    'Princess Ella thanks you!',
  ],
};

// Get world by ID
export const getWorldById = (worldId: number): CampaignWorld | undefined => {
  return campaignWorlds.find(w => w.id === worldId);
};

// Check if world is unlocked
export const isWorldUnlocked = (
  worldId: number,
  previousWorldBooksRescued: number
): boolean => {
  const world = getWorldById(worldId);
  if (!world) return false;
  if (worldId === 0) return true; // Tutorial always unlocked
  if (worldId === 1) return true;
  return previousWorldBooksRescued >= world.unlockRequirement;
};

// Get random taunt
export const getRandomTaunt = (category: keyof typeof goblinTaunts): string => {
  const taunts = goblinTaunts[category];
  return taunts[Math.floor(Math.random() * taunts.length)];
};

// Get random encouraging message
export const getRandomEncouragement = (
  category: keyof typeof encouragingMessages
): string => {
  const messages = encouragingMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Map story categories to worlds (for assigning stories to campaign)
export const categoryToWorld: Record<string, number> = {
  animals: 1,
  fairy_tales: 1,
  adventure: 2,
  sports: 2,
  science: 3,
  space: 3,
  history: 4,
};

// Get world for a story category
export const getWorldForCategory = (category: string): number => {
  return categoryToWorld[category] || 1;
};

// Get total levels count for a world
export const getWorldLevelCount = (worldId: number): number => {
  const world = getWorldById(worldId);
  return world?.levels.length || 0;
};
