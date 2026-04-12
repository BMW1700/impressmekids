// Simple AI patterns for the 2D Victory Arena brawler
export type AIPattern = 'idle' | 'approach' | 'retreat' | 'attack' | 'block' | 'special';

export interface AIAction {
  type: 'punch' | 'kick' | 'block' | 'dodge' | 'special' | 'idle';
  duration: number; // ms
}

const PATTERNS: Record<string, AIAction[]> = {
  aggressive: [
    { type: 'punch', duration: 400 },
    { type: 'punch', duration: 300 },
    { type: 'kick', duration: 500 },
    { type: 'idle', duration: 600 },
  ],
  defensive: [
    { type: 'block', duration: 800 },
    { type: 'dodge', duration: 400 },
    { type: 'punch', duration: 400 },
    { type: 'idle', duration: 500 },
  ],
  balanced: [
    { type: 'punch', duration: 400 },
    { type: 'block', duration: 500 },
    { type: 'kick', duration: 500 },
    { type: 'dodge', duration: 400 },
    { type: 'idle', duration: 400 },
  ],
  boss: [
    { type: 'special', duration: 700 },
    { type: 'punch', duration: 300 },
    { type: 'punch', duration: 300 },
    { type: 'kick', duration: 500 },
    { type: 'block', duration: 600 },
    { type: 'idle', duration: 300 },
  ],
};

export class ArenaAI {
  private pattern: AIAction[];
  private currentIndex: number = 0;
  private actionTimer: number = 0;
  private difficulty: number; // 1-3

  constructor(difficulty: number = 1) {
    this.difficulty = Math.min(3, Math.max(1, difficulty));
    const patternNames = Object.keys(PATTERNS);
    const selected = difficulty >= 3 ? 'boss' : difficulty >= 2 ? 'aggressive' : 'balanced';
    this.pattern = PATTERNS[selected];
  }

  getNextAction(): AIAction {
    const action = this.pattern[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.pattern.length;
    
    // Add some randomness
    if (Math.random() < 0.2) {
      const randomActions: AIAction['type'][] = ['punch', 'kick', 'block', 'dodge'];
      return {
        type: randomActions[Math.floor(Math.random() * randomActions.length)],
        duration: 300 + Math.floor(Math.random() * 400),
      };
    }
    
    return action;
  }

  // Reaction time based on difficulty (ms)
  getReactionDelay(): number {
    if (this.difficulty >= 3) return 200 + Math.random() * 200;
    if (this.difficulty >= 2) return 400 + Math.random() * 300;
    return 600 + Math.random() * 400;
  }

  // Should the AI block? Based on difficulty
  shouldBlock(): boolean {
    return Math.random() < (this.difficulty * 0.15);
  }

  // Damage output based on action
  getDamage(action: AIAction['type']): number {
    const base: Record<string, number> = {
      punch: 5,
      kick: 8,
      special: 15,
      block: 0,
      dodge: 0,
      idle: 0,
    };
    return (base[action] || 0) * (0.8 + this.difficulty * 0.2);
  }
}
