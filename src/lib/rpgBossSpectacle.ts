// RPG v2 — Boss Spectacle catalog.
// Pure lookup table: maps boss id → cinematic entrance + signature phase mechanic.
// Additive only. Does NOT modify existing rpgBattleData or combat rules.

export interface BossSpectacle {
  title: string;              // Sub-name shown under boss name
  worldLabel: string;         // e.g. "STAGE 2 · FROSTPEAK"
  entranceColor: string;      // Hex/CSS color for the entrance flash + banner
  entranceEmoji: string;      // Big emoji shown on entrance
  entranceQuote: string;      // One-line villain quote
  phases: BossPhase[];        // HP thresholds (0..1) where a signature mechanic triggers
}

export interface BossPhase {
  hpThreshold: number;        // Trigger when currentHp/maxHp <= this
  mechanicName: string;       // e.g. "LIGHTNING STORM"
  mechanicEmoji: string;      // Visual burst emoji
  mechanicColor: string;      // Banner color
  taunt: string;              // Boss line during transition
}

// Fallback used for any boss without an explicit entry.
const DEFAULT_SPECTACLE: BossSpectacle = {
  title: 'Guardian of the Word',
  worldLabel: 'BOSS BATTLE',
  entranceColor: '#a855f7',
  entranceEmoji: '⚔️',
  entranceQuote: 'You dare face me?',
  phases: [
    {
      hpThreshold: 0.66,
      mechanicName: 'ENRAGED',
      mechanicEmoji: '💢',
      mechanicColor: '#f97316',
      taunt: 'Now you will see my true power!',
    },
    {
      hpThreshold: 0.33,
      mechanicName: 'DESPERATE STRIKE',
      mechanicEmoji: '⚡',
      mechanicColor: '#ef4444',
      taunt: 'I refuse to fall!',
    },
  ],
};

const CATALOG: Record<string, BossSpectacle> = {
  // World 1 — Emberwood
  ember_drake: {
    title: 'Wyrm of the Emberwood',
    worldLabel: 'STAGE 1 · EMBERWOOD',
    entranceColor: '#f97316',
    entranceEmoji: '🐉',
    entranceQuote: 'The forest burns for your defiance.',
    phases: [
      { hpThreshold: 0.66, mechanicName: 'FIREBALL BARRAGE', mechanicEmoji: '🔥', mechanicColor: '#f97316', taunt: 'Feel the flames!' },
      { hpThreshold: 0.33, mechanicName: 'INFERNO ROAR', mechanicEmoji: '💥', mechanicColor: '#dc2626', taunt: 'I will burn it all!' },
    ],
  },
  // World 2 — Frostpeak / Ice Golem
  ice_golem: {
    title: 'Colossus of the Frozen Peak',
    worldLabel: 'STAGE 2 · FROSTPEAK',
    entranceColor: '#38bdf8',
    entranceEmoji: '❄️',
    entranceQuote: 'Warmth cannot save you here.',
    phases: [
      { hpThreshold: 0.66, mechanicName: 'CRYSTAL PRISON', mechanicEmoji: '💎', mechanicColor: '#38bdf8', taunt: 'Locked in ice!' },
      { hpThreshold: 0.33, mechanicName: 'AVALANCHE', mechanicEmoji: '🌨️', mechanicColor: '#0ea5e9', taunt: 'The mountain answers me!' },
    ],
  },
  // World 3 — Stone Guardian
  stone_guardian: {
    title: 'Ancient of the Deep Halls',
    worldLabel: 'STAGE 3 · STONEHOLD',
    entranceColor: '#a3a3a3',
    entranceEmoji: '🗿',
    entranceQuote: 'None have passed the halls. None ever will.',
    phases: [
      { hpThreshold: 0.66, mechanicName: 'ROLLING BOULDERS', mechanicEmoji: '🪨', mechanicColor: '#a3a3a3', taunt: 'The stones rise!' },
      { hpThreshold: 0.33, mechanicName: 'EARTHQUAKE', mechanicEmoji: '💢', mechanicColor: '#78716c', taunt: 'The earth itself will crush you!' },
    ],
  },
  // World 5 — Echo Wraith
  echo_wraith: {
    title: 'Voice of the Hollow',
    worldLabel: 'STAGE 5 · CAVERNS',
    entranceColor: '#8b5cf6',
    entranceEmoji: '👻',
    entranceQuote: 'Your words… will echo forever…',
    phases: [
      { hpThreshold: 0.66, mechanicName: 'GHOSTLY WHISPERS', mechanicEmoji: '🌫️', mechanicColor: '#8b5cf6', taunt: 'Hear yourself scream…' },
      { hpThreshold: 0.33, mechanicName: 'WORD ECHO', mechanicEmoji: '🔊', mechanicColor: '#6d28d9', taunt: 'Speak. Speak again. AGAIN.' },
    ],
  },
  // World 6 — Zephyr
  zephyr: {
    title: 'Wind Lord of the Floating Isles',
    worldLabel: 'STAGE 6 · FLOATING ISLES',
    entranceColor: '#22d3ee',
    entranceEmoji: '🌪️',
    entranceQuote: 'The sky itself is my sword.',
    phases: [
      { hpThreshold: 0.66, mechanicName: 'WIND CHASE', mechanicEmoji: '💨', mechanicColor: '#22d3ee', taunt: 'Catch me if you can!' },
      { hpThreshold: 0.33, mechanicName: 'LIGHTNING STORM', mechanicEmoji: '⚡', mechanicColor: '#facc15', taunt: 'The heavens strike!' },
    ],
  },
  // World 7 — Leviathan
  leviathan: {
    title: 'Devourer of the Deep',
    worldLabel: 'STAGE 7 · SUNKEN LIBRARY',
    entranceColor: '#0891b2',
    entranceEmoji: '🐙',
    entranceQuote: 'You are already inside my jaws.',
    phases: [
      { hpThreshold: 0.75, mechanicName: 'INK SPLASH', mechanicEmoji: '🌊', mechanicColor: '#0891b2', taunt: 'Read through this!' },
      { hpThreshold: 0.5, mechanicName: 'TIDAL SURGE', mechanicEmoji: '🌊', mechanicColor: '#0e7490', taunt: 'The tide takes all!' },
      { hpThreshold: 0.25, mechanicName: 'ABYSSAL ROAR', mechanicEmoji: '🌀', mechanicColor: '#164e63', taunt: 'The depths claim you!' },
    ],
  },
  // Final — Word Eater
  word_eater: {
    title: 'The End of All Stories',
    worldLabel: 'FINAL BOSS · THE VOID',
    entranceColor: '#dc2626',
    entranceEmoji: '💀',
    entranceQuote: 'I have eaten a thousand heroes. You will be the thousand-and-one.',
    phases: [
      { hpThreshold: 0.75, mechanicName: 'ASTEROID BARRAGE', mechanicEmoji: '☄️', mechanicColor: '#dc2626', taunt: 'Reality bends to me!' },
      { hpThreshold: 0.5, mechanicName: 'VOID PULL', mechanicEmoji: '🌀', mechanicColor: '#7c3aed', taunt: 'Come to the dark!' },
      { hpThreshold: 0.25, mechanicName: 'REALITY SHATTER', mechanicEmoji: '💥', mechanicColor: '#991b1b', taunt: 'THE STORY ENDS!' },
    ],
  },
  // Crystal Queen / Nova Titan / Librarian — extended campaigns
  crystal_queen: {
    title: 'Sovereign of the Prism',
    worldLabel: 'STAGE 8 · CRYSTAL COURT',
    entranceColor: '#ec4899',
    entranceEmoji: '💎',
    entranceQuote: 'Bow before the Crown of Facets.',
    phases: [
      { hpThreshold: 0.66, mechanicName: 'PRISM STORM', mechanicEmoji: '✨', mechanicColor: '#ec4899', taunt: 'Refract and fall!' },
      { hpThreshold: 0.33, mechanicName: 'DIAMOND EDGE', mechanicEmoji: '💠', mechanicColor: '#db2777', taunt: 'Nothing cuts sharper!' },
    ],
  },
  nova_titan: {
    title: 'Star that Walks',
    worldLabel: 'STAGE 9 · NOVA REACH',
    entranceColor: '#facc15',
    entranceEmoji: '🌟',
    entranceQuote: 'I am the light between the words.',
    phases: [
      { hpThreshold: 0.66, mechanicName: 'SUPERNOVA', mechanicEmoji: '💫', mechanicColor: '#facc15', taunt: 'Behold my brilliance!' },
      { hpThreshold: 0.33, mechanicName: 'SOLAR FLARE', mechanicEmoji: '☀️', mechanicColor: '#f59e0b', taunt: 'Burn brighter than the sun!' },
    ],
  },
  the_librarian: {
    title: 'Keeper of All Tomes',
    worldLabel: 'FINAL BOSS · ETERNAL ARCHIVE',
    entranceColor: '#7c3aed',
    entranceEmoji: '📖',
    entranceQuote: 'Every story ends in my library.',
    phases: [
      { hpThreshold: 0.75, mechanicName: 'BINDING WORDS', mechanicEmoji: '📜', mechanicColor: '#7c3aed', taunt: 'You are written into the pages!' },
      { hpThreshold: 0.5, mechanicName: 'WORD BARRAGE', mechanicEmoji: '📚', mechanicColor: '#6d28d9', taunt: 'A thousand chapters strike!' },
      { hpThreshold: 0.25, mechanicName: 'FINAL EDIT', mechanicEmoji: '✒️', mechanicColor: '#4c1d95', taunt: 'I revise you out of existence!' },
    ],
  },
};

export function getBossSpectacle(bossId: string): BossSpectacle {
  return CATALOG[bossId] ?? DEFAULT_SPECTACLE;
}

export function isBossType(type: string): boolean {
  return type === 'boss' || type === 'final_boss';
}
