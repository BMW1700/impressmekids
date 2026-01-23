// Comprehensive Achievement System for RPG Mode
// 50+ achievements across multiple categories

import { Award, Flame, BookOpen, Target, Zap, Trophy, Calendar, Clock, Star, Crown, Shield, Sword, Heart, Sparkles, Mountain, Rocket, Medal, Gift, Gem, Coins } from "lucide-react";

export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: typeof Award;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: string;
    value: number;
  };
  reward: {
    gold: number;
    xp: number;
  };
  gradient: string;
  shadowColor: string;
}

export type AchievementCategory = 
  | 'reading'
  | 'streaks'
  | 'battles'
  | 'mastery'
  | 'social'
  | 'special';

export const ACHIEVEMENT_CATEGORIES: Record<AchievementCategory, { label: string; color: string }> = {
  reading: { label: 'Reading', color: 'from-blue-500 to-cyan-400' },
  streaks: { label: 'Streaks', color: 'from-orange-500 to-amber-400' },
  battles: { label: 'Battles', color: 'from-red-500 to-rose-400' },
  mastery: { label: 'Mastery', color: 'from-purple-500 to-violet-400' },
  social: { label: 'Social', color: 'from-green-500 to-emerald-400' },
  special: { label: 'Special', color: 'from-pink-500 to-fuchsia-400' },
};

export const ACHIEVEMENTS: Achievement[] = [
  // ============ READING ACHIEVEMENTS ============
  {
    id: 'first_word',
    category: 'reading',
    name: 'First Word',
    description: 'Read your first word',
    icon: BookOpen,
    rarity: 'common',
    requirement: { type: 'words_read', value: 1 },
    reward: { gold: 10, xp: 25 },
    gradient: 'from-blue-500 to-blue-400',
    shadowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    id: 'word_explorer',
    category: 'reading',
    name: 'Word Explorer',
    description: 'Read 100 words',
    icon: BookOpen,
    rarity: 'common',
    requirement: { type: 'words_read', value: 100 },
    reward: { gold: 25, xp: 50 },
    gradient: 'from-blue-500 to-cyan-400',
    shadowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    id: 'bookworm',
    category: 'reading',
    name: 'Bookworm',
    description: 'Read 1,000 words',
    icon: BookOpen,
    rarity: 'uncommon',
    requirement: { type: 'words_read', value: 1000 },
    reward: { gold: 100, xp: 200 },
    gradient: 'from-cyan-500 to-teal-400',
    shadowColor: 'rgba(6, 182, 212, 0.4)',
  },
  {
    id: 'word_master',
    category: 'reading',
    name: 'Word Master',
    description: 'Read 5,000 words',
    icon: Crown,
    rarity: 'rare',
    requirement: { type: 'words_read', value: 5000 },
    reward: { gold: 250, xp: 500 },
    gradient: 'from-teal-500 to-emerald-400',
    shadowColor: 'rgba(20, 184, 166, 0.4)',
  },
  {
    id: 'word_legend',
    category: 'reading',
    name: 'Word Legend',
    description: 'Read 10,000 words',
    icon: Trophy,
    rarity: 'epic',
    requirement: { type: 'words_read', value: 10000 },
    reward: { gold: 500, xp: 1000 },
    gradient: 'from-emerald-500 to-green-400',
    shadowColor: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'word_god',
    category: 'reading',
    name: 'Word God',
    description: 'Read 50,000 words',
    icon: Sparkles,
    rarity: 'legendary',
    requirement: { type: 'words_read', value: 50000 },
    reward: { gold: 1000, xp: 2500 },
    gradient: 'from-yellow-400 to-amber-300',
    shadowColor: 'rgba(251, 191, 36, 0.5)',
  },

  // ============ STREAK ACHIEVEMENTS ============
  {
    id: 'first_streak',
    category: 'streaks',
    name: 'On Fire',
    description: 'Get a 3-word streak',
    icon: Flame,
    rarity: 'common',
    requirement: { type: 'word_streak', value: 3 },
    reward: { gold: 15, xp: 30 },
    gradient: 'from-orange-500 to-amber-400',
    shadowColor: 'rgba(249, 115, 22, 0.4)',
  },
  {
    id: 'hot_streak',
    category: 'streaks',
    name: 'Hot Streak',
    description: 'Get a 5-word streak',
    icon: Flame,
    rarity: 'common',
    requirement: { type: 'word_streak', value: 5 },
    reward: { gold: 25, xp: 50 },
    gradient: 'from-orange-500 to-red-400',
    shadowColor: 'rgba(249, 115, 22, 0.4)',
  },
  {
    id: 'fire_streak',
    category: 'streaks',
    name: 'Fire Streak',
    description: 'Get a 10-word streak',
    icon: Zap,
    rarity: 'uncommon',
    requirement: { type: 'word_streak', value: 10 },
    reward: { gold: 75, xp: 150 },
    gradient: 'from-red-500 to-orange-400',
    shadowColor: 'rgba(239, 68, 68, 0.4)',
  },
  {
    id: 'blazing_streak',
    category: 'streaks',
    name: 'Blazing Streak',
    description: 'Get a 20-word streak',
    icon: Zap,
    rarity: 'rare',
    requirement: { type: 'word_streak', value: 20 },
    reward: { gold: 200, xp: 400 },
    gradient: 'from-red-600 to-rose-500',
    shadowColor: 'rgba(220, 38, 38, 0.4)',
  },
  {
    id: 'unstoppable',
    category: 'streaks',
    name: 'Unstoppable',
    description: 'Get a 50-word streak',
    icon: Star,
    rarity: 'epic',
    requirement: { type: 'word_streak', value: 50 },
    reward: { gold: 500, xp: 1000 },
    gradient: 'from-rose-500 to-pink-400',
    shadowColor: 'rgba(244, 63, 94, 0.4)',
  },
  {
    id: 'perfect_reader',
    category: 'streaks',
    name: 'Perfect Reader',
    description: 'Get a 100-word streak',
    icon: Crown,
    rarity: 'legendary',
    requirement: { type: 'word_streak', value: 100 },
    reward: { gold: 1000, xp: 2000 },
    gradient: 'from-yellow-400 to-orange-300',
    shadowColor: 'rgba(251, 191, 36, 0.5)',
  },

  // ============ LOGIN STREAK ACHIEVEMENTS ============
  {
    id: 'day_one',
    category: 'streaks',
    name: 'Day One',
    description: 'Log in for the first time',
    icon: Calendar,
    rarity: 'common',
    requirement: { type: 'login_streak', value: 1 },
    reward: { gold: 10, xp: 20 },
    gradient: 'from-indigo-500 to-blue-400',
    shadowColor: 'rgba(99, 102, 241, 0.4)',
  },
  {
    id: 'three_day_warrior',
    category: 'streaks',
    name: 'Three Day Warrior',
    description: 'Log in 3 days in a row',
    icon: Calendar,
    rarity: 'common',
    requirement: { type: 'login_streak', value: 3 },
    reward: { gold: 30, xp: 60 },
    gradient: 'from-indigo-500 to-purple-400',
    shadowColor: 'rgba(99, 102, 241, 0.4)',
  },
  {
    id: 'week_warrior',
    category: 'streaks',
    name: 'Week Warrior',
    description: 'Log in 7 days in a row',
    icon: Shield,
    rarity: 'uncommon',
    requirement: { type: 'login_streak', value: 7 },
    reward: { gold: 100, xp: 200 },
    gradient: 'from-purple-500 to-violet-400',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'two_week_titan',
    category: 'streaks',
    name: 'Two Week Titan',
    description: 'Log in 14 days in a row',
    icon: Shield,
    rarity: 'rare',
    requirement: { type: 'login_streak', value: 14 },
    reward: { gold: 250, xp: 500 },
    gradient: 'from-violet-500 to-purple-400',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'month_master',
    category: 'streaks',
    name: 'Month Master',
    description: 'Log in 30 days in a row',
    icon: Trophy,
    rarity: 'epic',
    requirement: { type: 'login_streak', value: 30 },
    reward: { gold: 500, xp: 1000 },
    gradient: 'from-fuchsia-500 to-pink-400',
    shadowColor: 'rgba(217, 70, 239, 0.4)',
  },
  {
    id: 'dedication',
    category: 'streaks',
    name: 'True Dedication',
    description: 'Log in 100 days in a row',
    icon: Crown,
    rarity: 'legendary',
    requirement: { type: 'login_streak', value: 100 },
    reward: { gold: 2000, xp: 5000 },
    gradient: 'from-yellow-400 to-amber-300',
    shadowColor: 'rgba(251, 191, 36, 0.5)',
  },

  // ============ BATTLE ACHIEVEMENTS ============
  {
    id: 'first_victory',
    category: 'battles',
    name: 'First Victory',
    description: 'Win your first battle',
    icon: Sword,
    rarity: 'common',
    requirement: { type: 'battles_won', value: 1 },
    reward: { gold: 25, xp: 50 },
    gradient: 'from-red-500 to-rose-400',
    shadowColor: 'rgba(239, 68, 68, 0.4)',
  },
  {
    id: 'warrior',
    category: 'battles',
    name: 'Warrior',
    description: 'Win 10 battles',
    icon: Sword,
    rarity: 'uncommon',
    requirement: { type: 'battles_won', value: 10 },
    reward: { gold: 100, xp: 200 },
    gradient: 'from-red-500 to-orange-400',
    shadowColor: 'rgba(239, 68, 68, 0.4)',
  },
  {
    id: 'champion',
    category: 'battles',
    name: 'Champion',
    description: 'Win 50 battles',
    icon: Medal,
    rarity: 'rare',
    requirement: { type: 'battles_won', value: 50 },
    reward: { gold: 300, xp: 600 },
    gradient: 'from-orange-500 to-yellow-400',
    shadowColor: 'rgba(249, 115, 22, 0.4)',
  },
  {
    id: 'legend',
    category: 'battles',
    name: 'Legend',
    description: 'Win 100 battles',
    icon: Trophy,
    rarity: 'epic',
    requirement: { type: 'battles_won', value: 100 },
    reward: { gold: 750, xp: 1500 },
    gradient: 'from-yellow-500 to-amber-400',
    shadowColor: 'rgba(234, 179, 8, 0.4)',
  },
  {
    id: 'immortal',
    category: 'battles',
    name: 'Immortal',
    description: 'Win 500 battles',
    icon: Crown,
    rarity: 'legendary',
    requirement: { type: 'battles_won', value: 500 },
    reward: { gold: 2000, xp: 4000 },
    gradient: 'from-yellow-400 to-orange-300',
    shadowColor: 'rgba(251, 191, 36, 0.5)',
  },
  {
    id: 'flawless',
    category: 'battles',
    name: 'Flawless Victory',
    description: 'Win a battle without taking damage',
    icon: Shield,
    rarity: 'rare',
    requirement: { type: 'flawless_battles', value: 1 },
    reward: { gold: 200, xp: 400 },
    gradient: 'from-emerald-500 to-teal-400',
    shadowColor: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'boss_slayer',
    category: 'battles',
    name: 'Boss Slayer',
    description: 'Defeat your first boss',
    icon: Sword,
    rarity: 'uncommon',
    requirement: { type: 'bosses_defeated', value: 1 },
    reward: { gold: 150, xp: 300 },
    gradient: 'from-purple-500 to-indigo-400',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'boss_hunter',
    category: 'battles',
    name: 'Boss Hunter',
    description: 'Defeat 10 bosses',
    icon: Trophy,
    rarity: 'epic',
    requirement: { type: 'bosses_defeated', value: 10 },
    reward: { gold: 500, xp: 1000 },
    gradient: 'from-indigo-500 to-violet-400',
    shadowColor: 'rgba(99, 102, 241, 0.4)',
  },

  // ============ MASTERY ACHIEVEMENTS ============
  {
    id: 'sharp_shooter',
    category: 'mastery',
    name: 'Sharp Shooter',
    description: '95%+ accuracy in a battle',
    icon: Target,
    rarity: 'uncommon',
    requirement: { type: 'accuracy', value: 95 },
    reward: { gold: 100, xp: 200 },
    gradient: 'from-purple-500 to-violet-400',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'perfectionist',
    category: 'mastery',
    name: 'Perfectionist',
    description: '100% accuracy in a battle',
    icon: Star,
    rarity: 'epic',
    requirement: { type: 'accuracy', value: 100 },
    reward: { gold: 300, xp: 600 },
    gradient: 'from-violet-500 to-purple-400',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'speed_demon',
    category: 'mastery',
    name: 'Speed Demon',
    description: 'Exceed grade-level WPM',
    icon: Zap,
    rarity: 'rare',
    requirement: { type: 'wpm_exceeded', value: 1 },
    reward: { gold: 200, xp: 400 },
    gradient: 'from-amber-500 to-yellow-400',
    shadowColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'world_complete',
    category: 'mastery',
    name: 'World Complete',
    description: 'Complete a world',
    icon: Mountain,
    rarity: 'uncommon',
    requirement: { type: 'worlds_completed', value: 1 },
    reward: { gold: 150, xp: 300 },
    gradient: 'from-green-500 to-emerald-400',
    shadowColor: 'rgba(34, 197, 94, 0.4)',
  },
  {
    id: 'world_master',
    category: 'mastery',
    name: 'World Master',
    description: 'Complete 5 worlds',
    icon: Rocket,
    rarity: 'epic',
    requirement: { type: 'worlds_completed', value: 5 },
    reward: { gold: 500, xp: 1000 },
    gradient: 'from-emerald-500 to-cyan-400',
    shadowColor: 'rgba(16, 185, 129, 0.4)',
  },

  // ============ SPECIAL ACHIEVEMENTS ============
  {
    id: 'first_purchase',
    category: 'special',
    name: 'First Purchase',
    description: 'Buy something from the store',
    icon: Coins,
    rarity: 'common',
    requirement: { type: 'purchases', value: 1 },
    reward: { gold: 25, xp: 50 },
    gradient: 'from-yellow-500 to-amber-400',
    shadowColor: 'rgba(234, 179, 8, 0.4)',
  },
  {
    id: 'collector',
    category: 'special',
    name: 'Collector',
    description: 'Own 10 items',
    icon: Gem,
    rarity: 'rare',
    requirement: { type: 'items_owned', value: 10 },
    reward: { gold: 200, xp: 400 },
    gradient: 'from-pink-500 to-rose-400',
    shadowColor: 'rgba(236, 72, 153, 0.4)',
  },
  {
    id: 'rich',
    category: 'special',
    name: 'Getting Rich',
    description: 'Earn 1,000 gold total',
    icon: Coins,
    rarity: 'uncommon',
    requirement: { type: 'total_gold', value: 1000 },
    reward: { gold: 100, xp: 200 },
    gradient: 'from-amber-500 to-yellow-400',
    shadowColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'wealthy',
    category: 'special',
    name: 'Wealthy',
    description: 'Earn 10,000 gold total',
    icon: Gem,
    rarity: 'epic',
    requirement: { type: 'total_gold', value: 10000 },
    reward: { gold: 500, xp: 1000 },
    gradient: 'from-yellow-500 to-amber-400',
    shadowColor: 'rgba(234, 179, 8, 0.4)',
  },
  {
    id: 'first_pet',
    category: 'special',
    name: 'Pet Owner',
    description: 'Unlock your first pet',
    icon: Heart,
    rarity: 'uncommon',
    requirement: { type: 'pets_owned', value: 1 },
    reward: { gold: 75, xp: 150 },
    gradient: 'from-pink-500 to-rose-400',
    shadowColor: 'rgba(236, 72, 153, 0.4)',
  },
  {
    id: 'pet_collector',
    category: 'special',
    name: 'Pet Collector',
    description: 'Own 5 pets',
    icon: Heart,
    rarity: 'epic',
    requirement: { type: 'pets_owned', value: 5 },
    reward: { gold: 400, xp: 800 },
    gradient: 'from-rose-500 to-pink-400',
    shadowColor: 'rgba(244, 63, 94, 0.4)',
  },
  {
    id: 'early_bird',
    category: 'special',
    name: 'Early Bird',
    description: 'Play before 8am',
    icon: Sparkles,
    rarity: 'rare',
    requirement: { type: 'special', value: 1 },
    reward: { gold: 100, xp: 200 },
    gradient: 'from-sky-500 to-blue-400',
    shadowColor: 'rgba(14, 165, 233, 0.4)',
  },
  {
    id: 'night_owl',
    category: 'special',
    name: 'Night Owl',
    description: 'Play after 8pm',
    icon: Sparkles,
    rarity: 'rare',
    requirement: { type: 'special', value: 1 },
    reward: { gold: 100, xp: 200 },
    gradient: 'from-indigo-500 to-purple-400',
    shadowColor: 'rgba(99, 102, 241, 0.4)',
  },
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

export const getRarityColor = (rarity: Achievement['rarity']): string => {
  switch (rarity) {
    case 'common': return 'text-gray-400';
    case 'uncommon': return 'text-green-400';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-yellow-400';
  }
};

export const getRarityBorder = (rarity: Achievement['rarity']): string => {
  switch (rarity) {
    case 'common': return 'ring-gray-400/50';
    case 'uncommon': return 'ring-green-400/50';
    case 'rare': return 'ring-blue-400/50';
    case 'epic': return 'ring-purple-400/50';
    case 'legendary': return 'ring-yellow-400/50 animate-pulse';
  }
};
