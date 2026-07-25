// RPG v2 — Phase 4: Rank tier definitions.
// Server (`rpg_award_rank_points`) is the source of truth for tier;
// this file provides the display metadata.

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

export interface RankTierMeta {
  tier: RankTier;
  label: string;
  emoji: string;
  minPoints: number;
  color: string;
  bgClass: string;
  textClass: string;
}

export const RANK_TIERS: RankTierMeta[] = [
  { tier: 'bronze',   label: 'Bronze',   emoji: '🥉', minPoints: 0,    color: '#b45309', bgClass: 'bg-amber-900/40',  textClass: 'text-amber-300' },
  { tier: 'silver',   label: 'Silver',   emoji: '🥈', minPoints: 100,  color: '#94a3b8', bgClass: 'bg-slate-500/30',  textClass: 'text-slate-200' },
  { tier: 'gold',     label: 'Gold',     emoji: '🥇', minPoints: 350,  color: '#eab308', bgClass: 'bg-yellow-500/25', textClass: 'text-yellow-200' },
  { tier: 'platinum', label: 'Platinum', emoji: '💎', minPoints: 700,  color: '#22d3ee', bgClass: 'bg-cyan-500/25',   textClass: 'text-cyan-200' },
  { tier: 'diamond',  label: 'Diamond',  emoji: '🔷', minPoints: 1200, color: '#3b82f6', bgClass: 'bg-blue-500/30',   textClass: 'text-blue-200' },
  { tier: 'master',   label: 'Master',   emoji: '👑', minPoints: 2000, color: '#a855f7', bgClass: 'bg-purple-500/30', textClass: 'text-purple-200' },
];

export function tierFromPoints(points: number): RankTierMeta {
  let current = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (points >= t.minPoints) current = t;
  }
  return current;
}

export function tierMeta(tier: string): RankTierMeta {
  return RANK_TIERS.find((t) => t.tier === tier) ?? RANK_TIERS[0];
}

export function nextTier(tier: string): RankTierMeta | null {
  const idx = RANK_TIERS.findIndex((t) => t.tier === tier);
  if (idx < 0 || idx === RANK_TIERS.length - 1) return null;
  return RANK_TIERS[idx + 1];
}

// PvP scoring: tunable, mirrors client-side expectation.
export const PVP_WIN_POINTS = 25;
export const PVP_LOSS_POINTS = -10;
