// RPG v2 — Season Pass config.
// Rotates weekly. Rewards are cosmetic (titles/banners) so this stays additive
// and cannot alter combat balance.

export interface SeasonTier {
  tier: number;
  requiredXp: number;
  rewardKind: 'title' | 'banner' | 'badge';
  rewardId: string;
  rewardLabel: string;
  rewardEmoji: string;
}

export interface Season {
  id: string;
  name: string;
  themeColor: string;
  startsAt: string; // ISO date
  endsAt: string;   // ISO date
  tiers: SeasonTier[];
}

// Roll every Monday. Keep 6 tiers max so the UI stays clean.
export const CURRENT_SEASON: Season = {
  id: 'season-2026-w30',
  name: 'The Ember Trials',
  themeColor: '#f97316',
  startsAt: '2026-07-20',
  endsAt: '2026-07-27',
  tiers: [
    { tier: 1, requiredXp: 50,  rewardKind: 'badge',  rewardId: 'trial_initiate', rewardLabel: 'Trial Initiate',  rewardEmoji: '🔥' },
    { tier: 2, requiredXp: 150, rewardKind: 'title',  rewardId: 'ember_seeker',   rewardLabel: 'Ember Seeker',    rewardEmoji: '🌟' },
    { tier: 3, requiredXp: 300, rewardKind: 'banner', rewardId: 'ember_banner',   rewardLabel: 'Ember Banner',    rewardEmoji: '🚩' },
    { tier: 4, requiredXp: 500, rewardKind: 'title',  rewardId: 'flame_warden',   rewardLabel: 'Flame Warden',    rewardEmoji: '⚔️' },
    { tier: 5, requiredXp: 750, rewardKind: 'badge',  rewardId: 'ember_crown',    rewardLabel: 'Ember Crown',     rewardEmoji: '👑' },
    { tier: 6, requiredXp: 1000, rewardKind: 'title', rewardId: 'ember_champion', rewardLabel: 'Champion of Embers', rewardEmoji: '🏆' },
  ],
};

export function questLabel(questType: string): { label: string; emoji: string } {
  switch (questType) {
    case 'defeat_enemies': return { label: 'Defeat 5 enemies',       emoji: '⚔️' };
    case 'defeat_bosses':  return { label: 'Defeat 1 boss',          emoji: '👑' };
    case 'battle_wins':    return { label: 'Win 3 battles',          emoji: '🏆' };
    default:               return { label: questType,                emoji: '⭐' };
  }
}
