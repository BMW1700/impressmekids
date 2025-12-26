// Campaign data for Grog the Goblin King Story Campaign

export interface CampaignWorld {
  id: number;
  name: string;
  description: string;
  gradient: string;
  bgColor: string;
  enemyTypes: ('minion' | 'guard' | 'elite')[];
  requiredGradeLevel: number;
  storyCount: number;
  unlockRequirement: number; // Books rescued in previous world to unlock
  lore: string;
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

// Campaign worlds
export const campaignWorlds: CampaignWorld[] = [
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
  },
  {
    id: 2,
    name: 'The Dark Caves',
    description: 'Deep underground where goblins hide their treasures',
    gradient: 'from-slate-500 via-purple-600 to-indigo-700',
    bgColor: 'bg-slate-900/30',
    enemyTypes: ['minion', 'guard'],
    requiredGradeLevel: 1,
    storyCount: 6,
    unlockRequirement: 3,
    lore: 'The Dark Caves twist and turn beneath the mountain. Grog\'s guards patrol here, making sure no one finds the hidden book chambers.',
  },
  {
    id: 3,
    name: 'Goblin Mountain',
    description: 'The treacherous path to Grog\'s fortress',
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    bgColor: 'bg-orange-900/20',
    enemyTypes: ['guard', 'elite'],
    requiredGradeLevel: 2,
    storyCount: 7,
    unlockRequirement: 5,
    lore: 'Goblin Mountain rises above the clouds. Only the bravest readers dare to climb its slopes, facing Grog\'s elite warriors.',
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
