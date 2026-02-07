import { motion } from "framer-motion";
import { Heart, Sparkles, Flame, Shield } from "lucide-react";

interface PartyMember {
  name: string;
  currentHp: number;
  maxHp: number;
  currentMp?: number;
  maxMp?: number;
  isDefending?: boolean;
}

interface RPGPartyStatsProps {
  members: PartyMember[];
  streak: number;
  longestStreak: number;
  showCombo?: boolean;
}

export const RPGPartyStats = ({
  members,
  streak,
  longestStreak,
  showCombo = false,
}: RPGPartyStatsProps) => {
  const getHpColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 60) return 'from-emerald-400 to-green-500';
    if (percentage > 30) return 'from-yellow-400 to-amber-500';
    return 'from-red-400 to-rose-500';
  };

  const getMpColor = () => 'from-blue-400 to-indigo-500';

  return (
    <div className="relative">
      {/* Classic RPG Panel Border */}
      <div className="relative bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-lg 
        border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
        backdrop-blur-sm overflow-hidden">
        
        {/* Inner border glow */}
        <div className="absolute inset-[2px] rounded-md border border-blue-500/20 pointer-events-none" />

        {/* Party Members */}
        <div className="p-3 space-y-3">
          {members.map((member, index) => (
            <div key={member.name} className="space-y-1.5">
              {/* Name and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">{member.name}</span>
                  {member.isDefending && (
                    <Shield className="h-3 w-3 text-blue-400" />
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {member.currentHp}/{member.maxHp}
                </span>
              </div>

              {/* HP Bar */}
              <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <motion.div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getHpColor(member.currentHp, member.maxHp)} rounded-full`}
                  initial={false}
                  animate={{ width: `${(member.currentHp / member.maxHp) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 rounded-full" />
                {/* HP Label */}
                <div className="absolute inset-0 flex items-center px-2">
                  <Heart className="h-2 w-2 text-white/80" />
                </div>
              </div>

              {/* MP Bar (if applicable) */}
              {member.maxMp && (
                <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <motion.div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getMpColor()} rounded-full`}
                    initial={false}
                    animate={{ width: `${((member.currentMp || 0) / member.maxMp) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  />
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 rounded-full" />
                  {/* MP Label */}
                  <div className="absolute inset-0 flex items-center px-2">
                    <Sparkles className="h-2 w-2 text-white/80" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Streak Section */}
        <div className="px-3 py-2 border-t border-blue-400/30 bg-gradient-to-r from-orange-900/30 to-red-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={streak > 0 ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, -5, 5, 0],
                } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-400' : 'text-slate-600'}`} />
              </motion.div>
              <span className="text-sm font-bold text-white">Streak</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Current Streak */}
              <motion.span
                key={streak}
                initial={{ scale: 1.5, color: '#f97316' }}
                animate={{ scale: 1, color: streak > 0 ? '#fb923c' : '#64748b' }}
                className="text-xl font-black tabular-nums"
              >
                x{streak}
              </motion.span>
              {/* Best Streak */}
              <span className="text-xs text-slate-500">
                Best: {longestStreak}
              </span>
            </div>
          </div>

          {/* Streak Fire Effect */}
          {streak >= 3 && (
            <motion.div
              className="mt-1 h-1 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  width: `${Math.min(100, (streak / 10) * 100)}%`,
                  backgroundSize: '200% 100%',
                }}
              />
            </motion.div>
          )}

          {/* Combo Indicator - moved here from RPGWordAttack to prevent layout shifts */}
          {showCombo && streak >= 3 && (
            <motion.div
              className="mt-1 px-3 py-1.5 bg-gradient-to-r from-orange-600/80 to-red-600/80 rounded-lg border border-orange-400/50"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-2">
                <Flame className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-black text-white tracking-wide">
                  x{streak} COMBO!
                </span>
                <Flame className="h-4 w-4 text-yellow-300" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
