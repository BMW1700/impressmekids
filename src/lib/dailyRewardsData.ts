// Daily Login Rewards Calendar System
// Escalating rewards for consecutive login days

import { Gift, Coins, Star, Gem, Crown, Sparkles, Trophy } from "lucide-react";

export interface DailyReward {
  day: number;
  gold: number;
  xp: number;
  bonus?: {
    type: 'chest' | 'pet_food' | 'power_boost' | 'mystery';
    label: string;
    icon: typeof Gift;
  };
  isSpecial: boolean;
}

// 7-day reward cycle that repeats with escalating base values
export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, gold: 10, xp: 25, isSpecial: false },
  { day: 2, gold: 15, xp: 35, isSpecial: false },
  { day: 3, gold: 20, xp: 50, bonus: { type: 'pet_food', label: 'Pet Food', icon: Star }, isSpecial: true },
  { day: 4, gold: 25, xp: 60, isSpecial: false },
  { day: 5, gold: 30, xp: 75, isSpecial: false },
  { day: 6, gold: 40, xp: 100, bonus: { type: 'power_boost', label: 'Power Boost', icon: Sparkles }, isSpecial: true },
  { day: 7, gold: 100, xp: 250, bonus: { type: 'chest', label: 'Mystery Chest', icon: Gift }, isSpecial: true },
];

// Milestone rewards for longer streaks
export const MILESTONE_REWARDS: Record<number, { gold: number; xp: number; label: string; icon: typeof Trophy }> = {
  14: { gold: 250, xp: 500, label: '2 Week Champion!', icon: Trophy },
  21: { gold: 400, xp: 800, label: '3 Week Legend!', icon: Crown },
  30: { gold: 750, xp: 1500, label: 'Monthly Master!', icon: Gem },
  60: { gold: 1500, xp: 3000, label: '2 Month Hero!', icon: Crown },
  100: { gold: 3000, xp: 6000, label: 'Century Legend!', icon: Trophy },
};

export const getRewardForDay = (streakDay: number): DailyReward => {
  // Get the cycle day (1-7 repeating)
  const cycleDay = ((streakDay - 1) % 7) + 1;
  const baseReward = DAILY_REWARDS[cycleDay - 1];
  
  // Calculate multiplier based on how many full weeks completed
  const weeksCompleted = Math.floor((streakDay - 1) / 7);
  const multiplier = 1 + (weeksCompleted * 0.1); // 10% increase per week
  
  return {
    ...baseReward,
    day: streakDay,
    gold: Math.round(baseReward.gold * multiplier),
    xp: Math.round(baseReward.xp * multiplier),
  };
};

export const getMilestoneReward = (streakDay: number) => {
  return MILESTONE_REWARDS[streakDay];
};

export const getNextMilestone = (currentStreak: number): number | null => {
  const milestones = Object.keys(MILESTONE_REWARDS).map(Number).sort((a, b) => a - b);
  return milestones.find(m => m > currentStreak) || null;
};

export const formatStreakMessage = (streak: number): string => {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "Great start! Keep it up!";
  if (streak === 2) return "2 days strong! 💪";
  if (streak >= 3 && streak < 7) return `${streak} day streak! 🔥`;
  if (streak === 7) return "One week warrior! 🏆";
  if (streak >= 7 && streak < 14) return `${streak} days! Keep the fire burning! 🔥`;
  if (streak >= 14 && streak < 30) return `${streak} days! You're unstoppable! ⚡`;
  if (streak >= 30 && streak < 100) return `${streak} days! Legendary dedication! 👑`;
  if (streak >= 100) return `${streak} DAYS! ABSOLUTE LEGEND! 🌟`;
  return "Keep reading!";
};
