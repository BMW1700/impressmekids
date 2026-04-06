import { type RPGEnemy, type RPGCharacter, type MiniGameType } from './rpgBattleData';

// Agent Mode Heroes
export const agentX: RPGCharacter = {
  id: 'knight', // Maps to same PlayableCharacter 'valor' internally
  name: 'Agent X',
  title: 'Field Operative',
  type: 'hero',
  maxHp: 100,
  attack: 15,
  defense: 10,
  color: 'from-slate-600 to-zinc-800',
  abilities: [
    { id: 'slash', name: 'Tactical Strike', description: 'A precise combat strike', damage: 20, effect: 'slash', animationType: 'melee' },
    { id: 'shield_bash', name: 'Deflection', description: 'Block incoming attacks', damage: 10, effect: 'block', animationType: 'melee' },
    { id: 'rallying_cry', name: 'Field Medkit', description: 'Patch up wounds', damage: 0, effect: 'heal', animationType: 'buff' },
  ],
};

export const cipher: RPGCharacter = {
  id: 'wizard', // Maps to 'elara' internally
  name: 'Cipher',
  title: 'Elite Hacker',
  type: 'hero',
  maxHp: 100,
  attack: 35,
  defense: 5,
  color: 'from-cyan-500 to-blue-700',
  abilities: [
    { id: 'fireball', name: 'EMP Blast', description: 'Overload enemy systems', damage: 30, effect: 'fire', animationType: 'projectile' },
    { id: 'ice_shard', name: 'System Freeze', description: 'Lock down enemy processes', damage: 20, effect: 'ice', animationType: 'projectile' },
    { id: 'lightning', name: 'Voltage Spike', description: 'Surge of electrical energy', damage: 35, effect: 'lightning', animationType: 'projectile' },
    { id: 'plasma_barrage', name: 'DDoS Overload', description: 'Fast Mode: Say 5 words quickly for 3x damage!', damage: 100, effect: 'lightning', animationType: 'projectile' },
  ],
};

export const shadow: RPGCharacter = {
  id: 'ella', // Maps to 'ella' internally
  name: 'Shadow',
  title: 'Stealth Specialist',
  type: 'hero',
  maxHp: 100,
  attack: 18,
  defense: 8,
  color: 'from-violet-600 to-purple-900',
  abilities: [
    { id: 'thorn_strike', name: 'Silent Takedown', description: 'Strike from the shadows', damage: 22, effect: 'slash', animationType: 'projectile' },
    { id: 'petal_shield', name: 'Smoke Screen', description: 'Create cover to avoid damage', damage: 0, effect: 'block', animationType: 'buff' },
    { id: 'bloom_burst', name: 'Flash Bang', description: 'Disorient all enemies', damage: 35, effect: 'fire', animationType: 'aoe' },
    { id: 'natures_embrace', name: 'First Aid', description: 'Field medical treatment', damage: -20, effect: 'heal', animationType: 'buff' },
  ],
};

// Agent mode enemies - same stat scaling as classic
export const streetThug: RPGEnemy = {
  id: 'street_thug',
  name: 'Street Thug',
  type: 'minion',
  maxHp: 320,
  attack: 12,
  defense: 4,
  wordDamageMultiplier: 0.85,
  color: 'from-stone-600 to-neutral-700',
  dialogueIntro: [
    "You picked the wrong alley, pal.",
    "The Syndicate doesn't take kindly to snoops.",
  ],
  dialogueAttack: [
    "*swings a pipe*",
    "Nobody walks outta here!",
  ],
  dialogueDefeat: [
    "Alright, alright... I'll talk...",
    "You're gonna regret this when the Boss finds out...",
  ],
  specialAbilities: [
    { id: 'poison_dagger', name: 'Dirty Hit', damage: 8, effect: 'poison', description: 'A cheap shot that lingers', icon: '🔪' },
  ],
  barrageWordCount: 4,
  miniGames: ['word_shield', 'goblin_horde', 'word_barrage', 'dodge_words'],
  signatureMiniGame: 'goblin_horde',
};

export const hiredGun: RPGEnemy = {
  id: 'hired_gun',
  name: 'Hired Gun',
  type: 'guard',
  maxHp: 480,
  attack: 15,
  defense: 8,
  wordDamageMultiplier: 0.7,
  color: 'from-gray-700 to-slate-800',
  dialogueIntro: [
    "Nothing personal. Just business.",
    "The contract says you don't leave alive.",
  ],
  dialogueAttack: [
    "*fires suppressed rounds*",
    "Hold still, target!",
  ],
  dialogueDefeat: [
    "Contract's... voided...",
    "Should've charged more for this job...",
  ],
  specialAbilities: [
    { id: 'shield_block', name: 'Kevlar Vest', damage: 0, effect: 'debuff', description: 'Absorbs next hit', icon: '🦺' },
    { id: 'poison_dagger', name: 'Hollow Point', damage: 10, effect: 'poison', description: 'Deep wound', icon: '💉' },
  ],
  barrageWordCount: 5,
  miniGames: ['word_shield', 'dodge_words', 'spell_combo', 'word_barrage', 'goblin_horde'],
  signatureMiniGame: 'word_shield',
};

export const cyberHacker: RPGEnemy = {
  id: 'cyber_hacker',
  name: 'Cyber Hacker',
  type: 'elite',
  maxHp: 720,
  attack: 22,
  defense: 12,
  wordDamageMultiplier: 0.5,
  color: 'from-cyan-600 to-teal-800',
  dialogueIntro: [
    "I've already cracked your encryption. This won't take long.",
    "Your firewall? Pathetic. Let me show you real code.",
  ],
  dialogueAttack: [
    "*deploys malware*",
    "Executing override protocol!",
  ],
  dialogueDefeat: [
    "Impossible... my algorithms were flawless...",
    "System... crash... imminent...",
  ],
  specialAbilities: [
    { id: 'word_scramble', name: 'Scramble Protocol', damage: 15, effect: 'silence', description: 'Disrupts reading ability', icon: '💻' },
    { id: 'data_steal', name: 'Data Siphon', damage: 12, effect: 'debuff', description: 'Steals intelligence', icon: '📡' },
  ],
  barrageWordCount: 6,
  miniGames: ['spell_combo', 'speed_typist', 'word_shield', 'dodge_words', 'rhyme_chain'],
  signatureMiniGame: 'spell_combo',
};

// Bosses
export const theBroker: RPGEnemy = {
  id: 'the_broker',
  name: 'The Broker',
  type: 'boss',
  maxHp: 1200,
  attack: 25,
  defense: 15,
  wordDamageMultiplier: 0.4,
  color: 'from-amber-700 to-yellow-900',
  dialogueIntro: [
    "Everything has a price. And yours? It's about to go up.",
    "I deal in secrets, agent. And I know all of yours.",
  ],
  dialogueAttack: [
    "*snaps fingers — thugs close in*",
    "My network is everywhere. You can't escape.",
  ],
  dialogueDefeat: [
    "This... this wasn't in the contract...",
    "You've won the battle, agent. But the Syndicate is bigger than me...",
  ],
  specialAbilities: [
    { id: 'word_scramble', name: 'Blackmail', damage: 20, effect: 'silence', description: 'Threatens to expose secrets', icon: '📋' },
    { id: 'data_steal', name: 'Market Crash', damage: 18, effect: 'debuff', description: 'Economic warfare', icon: '📉' },
  ],
  barrageWordCount: 7,
  miniGames: ['fireball_defense', 'spell_combo', 'word_shield', 'dodge_words', 'speed_typist', 'beast_swarm'],
  signatureMiniGame: 'fireball_defense',
};

export const theArchitect: RPGEnemy = {
  id: 'the_architect',
  name: 'The Architect',
  type: 'boss',
  maxHp: 1600,
  attack: 30,
  defense: 18,
  wordDamageMultiplier: 0.35,
  color: 'from-blue-600 to-indigo-900',
  dialogueIntro: [
    "I designed every system in this district. You're walking through MY code.",
    "Welcome to my domain. Every pixel answers to me.",
  ],
  dialogueAttack: [
    "*activates drone swarm*",
    "Deploying countermeasures!",
  ],
  dialogueDefeat: [
    "My... beautiful... network...",
    "The code... it's... crashing...",
  ],
  specialAbilities: [
    { id: 'drone_swarm', name: 'Drone Swarm', damage: 22, effect: 'word_barrage', description: 'Drones attack from all sides', icon: '🤖' },
    { id: 'firewall', name: 'Firewall', damage: 0, effect: 'debuff', description: 'Digital shield blocks attacks', icon: '🔥' },
  ],
  barrageWordCount: 8,
  miniGames: ['fireball_defense', 'beast_swarm', 'spell_combo', 'word_shield', 'dodge_words', 'speed_typist'],
  signatureMiniGame: 'beast_swarm',
};

export const theDoubleAgent: RPGEnemy = {
  id: 'the_double_agent',
  name: 'The Double Agent',
  type: 'boss',
  maxHp: 2000,
  attack: 35,
  defense: 20,
  wordDamageMultiplier: 0.3,
  color: 'from-yellow-600 to-amber-900',
  dialogueIntro: [
    "You trusted the wrong people, agent. I've been watching you from the start.",
    "Surprised? I played both sides for years. Now it's time to end this.",
  ],
  dialogueAttack: [
    "*uses your own intel against you*",
    "I know your every move before you make it!",
  ],
  dialogueDefeat: [
    "It was... a good cover while it lasted...",
    "You're better than I expected, agent...",
  ],
  specialAbilities: [
    { id: 'betrayal', name: 'Betrayal', damage: 25, effect: 'silence', description: 'Uses stolen intel', icon: '🎭' },
    { id: 'misinformation', name: 'Misinformation', damage: 20, effect: 'debuff', description: 'Confuses and misdirects', icon: '📰' },
  ],
  barrageWordCount: 9,
  miniGames: ['fireball_defense', 'beast_swarm', 'spell_combo', 'word_shield', 'dodge_words', 'speed_typist', 'ice_crystal_barrage'],
  signatureMiniGame: 'ice_crystal_barrage',
};

export const theDirector: RPGEnemy = {
  id: 'the_director',
  name: 'The Director',
  type: 'final_boss',
  maxHp: 3200,
  attack: 40,
  defense: 25,
  wordDamageMultiplier: 0.25,
  color: 'from-red-700 to-red-950',
  dialogueIntro: [
    "So you've made it to the top. Impressive. Futile, but impressive.",
    "I AM the Syndicate, agent. And the Syndicate never falls.",
  ],
  dialogueAttack: [
    "*activates full security protocol*",
    "You have no idea the forces at my command!",
  ],
  dialogueDefeat: [
    "This... changes nothing... others will rise...",
    "The Syndicate... was just the beginning...",
  ],
  specialAbilities: [
    { id: 'executive_order', name: 'Executive Order', damage: 30, effect: 'word_barrage', description: 'Calls in all assets', icon: '⚡' },
    { id: 'total_lockdown', name: 'Total Lockdown', damage: 0, effect: 'silence', description: 'Shuts down all systems', icon: '🔒' },
    { id: 'scorched_earth', name: 'Scorched Earth', damage: 35, effect: 'fireball_barrage', description: 'Destroys everything', icon: '💥' },
  ],
  barrageWordCount: 10,
  miniGames: ['fireball_defense', 'beast_swarm', 'spell_combo', 'word_shield', 'dodge_words', 'speed_typist', 'ground_ripple', 'fireball_barrage'],
  signatureMiniGame: 'ground_ripple',
};

// Get agent enemy by campaign enemy type
export const getAgentEnemy = (enemyType: string): RPGEnemy => {
  switch (enemyType) {
    case 'minion': return { ...streetThug };
    case 'guard': return { ...hiredGun };
    case 'elite': return { ...cyberHacker };
    case 'dragon': return { ...cyberHacker };
    case 'boss': return { ...theBroker };
    case 'final_boss': return { ...theDirector };
    default: return { ...streetThug };
  }
};

// Get agent enemy for specific world bosses
export const getAgentBossForWorld = (worldId: number): RPGEnemy => {
  switch (worldId) {
    case 1: return { ...theBroker };
    case 2: return { ...theArchitect };
    case 3: return { ...theDoubleAgent };
    case 4: return { ...theDirector };
    default: return { ...theBroker };
  }
};

// Get agent hero by character selection
export const getAgentHero = (character: string): RPGCharacter => {
  switch (character) {
    case 'agent_x':
    case 'valor': return { ...agentX };
    case 'cipher':
    case 'elara': return { ...cipher };
    case 'shadow':
    case 'ella': return { ...shadow };
    default: return { ...agentX };
  }
};

// Agent mode dialogue
export const agentHeroDialogue = {
  intro: [
    "Stay sharp, team. Intel says this sector is hostile.",
    "Mission active. Weapons hot.",
    "We've trained for this. Let's move.",
    "HQ confirms hostile presence. Engage on my mark.",
  ],
  attack: [
    "Engaging target!",
    "Contact! Taking the shot!",
    "Target acquired!",
  ],
  victory: [
    "Target neutralized. Area secured.",
    "Mission complete. Moving to extraction.",
    "Good work, team. One step closer to the Syndicate.",
  ],
};

export const agentCompanionDialogue = {
  intro: [
    "Systems online. Scanning for threats.",
    "I've got your six, agent. Let's do this.",
    "Comms are clear. Ready when you are.",
    "Running tactical analysis now.",
  ],
  attack: [
    "Deploying countermeasures!",
    "Hacking their defenses!",
    "Overriding their systems!",
  ],
  victory: [
    "All systems green. Nice work.",
    "Threat eliminated. Uploading intel to HQ.",
    "That's another one down.",
  ],
};
