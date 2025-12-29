import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Snowflake, Sparkles } from "lucide-react";
import { POWER_COSTS } from "@/lib/gameEconomy";

interface RPGPowerBarProps {
  power: number;
  maxPower: number;
  onUsePower?: (ability: string, cost: number) => void;
  disabled?: boolean;
}

interface PowerAbility {
  id: string;
  name: string;
  cost: number;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

const abilities: PowerAbility[] = [
  { 
    id: 'fireball', 
    name: 'Fireball', 
    cost: POWER_COSTS.fireball, 
    icon: <Flame className="h-4 w-4" />,
    color: 'from-orange-500 to-red-600',
    glowColor: 'rgba(249, 115, 22, 0.6)',
  },
  { 
    id: 'ice_shard', 
    name: 'Ice Shard', 
    cost: POWER_COSTS.ice_shard, 
    icon: <Snowflake className="h-4 w-4" />,
    color: 'from-cyan-400 to-blue-600',
    glowColor: 'rgba(34, 211, 238, 0.6)',
  },
  { 
    id: 'lightning', 
    name: 'Lightning', 
    cost: POWER_COSTS.lightning, 
    icon: <Zap className="h-4 w-4" />,
    color: 'from-yellow-400 to-amber-600',
    glowColor: 'rgba(250, 204, 21, 0.6)',
  },
  { 
    id: 'word_nova', 
    name: 'Word Nova', 
    cost: POWER_COSTS.word_nova, 
    icon: <Sparkles className="h-4 w-4" />,
    color: 'from-purple-500 to-pink-600',
    glowColor: 'rgba(168, 85, 247, 0.6)',
  },
];

export const RPGPowerBar = ({ 
  power, 
  maxPower, 
  onUsePower, 
  disabled = false 
}: RPGPowerBarProps) => {
  const powerPercent = (power / maxPower) * 100;
  
  // Determine bar color based on power level
  const getBarColor = () => {
    if (powerPercent >= 100) return 'from-purple-500 via-pink-500 to-purple-500';
    if (powerPercent >= 50) return 'from-amber-500 via-yellow-400 to-amber-500';
    return 'from-blue-500 via-cyan-400 to-blue-500';
  };

  return (
    <div className="space-y-3">
      {/* Power Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-xs font-medium text-yellow-400">POWER</span>
          <span className="text-xs text-slate-400 ml-auto">{power}/{maxPower}</span>
        </div>
        
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          {/* Background glow */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{ 
              opacity: powerPercent >= 100 ? [0.3, 0.6, 0.3] : 0.3,
            }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{
              background: `linear-gradient(90deg, transparent, ${
                powerPercent >= 100 ? 'rgba(168, 85, 247, 0.5)' : 'rgba(59, 130, 246, 0.3)'
              }, transparent)`,
            }}
          />
          
          {/* Power fill */}
          <motion.div
            className={`h-full bg-gradient-to-r ${getBarColor()} rounded-full relative overflow-hidden`}
            initial={{ width: 0 }}
            animate={{ width: `${powerPercent}%` }}
            transition={{ type: 'spring', damping: 15 }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
          </motion.div>

          {/* Threshold markers */}
          {abilities.map((ability) => {
            const thresholdPercent = (ability.cost / maxPower) * 100;
            return (
              <div
                key={ability.id}
                className="absolute top-0 bottom-0 w-0.5 bg-white/30"
                style={{ left: `${thresholdPercent}%` }}
              />
            );
          })}
        </div>

        {/* Full power indicator */}
        <AnimatePresence>
          {powerPercent >= 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -right-2 -top-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              >
                <Sparkles className="h-5 w-5 text-purple-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ability Buttons */}
      <div className="flex gap-2">
        {abilities.map((ability) => {
          const canUse = power >= ability.cost && !disabled;
          const isUltimate = ability.id === 'word_nova';
          
          return (
            <motion.button
              key={ability.id}
              onClick={() => canUse && onUsePower?.(ability.id, ability.cost)}
              disabled={!canUse}
              className={`relative flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg
                border transition-all
                ${canUse 
                  ? `bg-gradient-to-b ${ability.color} border-white/20 cursor-pointer hover:scale-105` 
                  : 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed'
                }
                ${isUltimate && canUse ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900' : ''}
              `}
              whileHover={canUse ? { scale: 1.05 } : {}}
              whileTap={canUse ? { scale: 0.95 } : {}}
              style={canUse ? {
                boxShadow: `0 0 20px ${ability.glowColor}`,
              } : {}}
            >
              {/* Icon */}
              <div className={canUse ? 'text-white' : 'text-slate-500'}>
                {ability.icon}
              </div>
              
              {/* Cost */}
              <span className={`text-xs font-bold ${canUse ? 'text-white' : 'text-slate-500'}`}>
                {ability.cost}
              </span>

              {/* Ready indicator */}
              <AnimatePresence>
                {canUse && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400"
                    style={{ boxShadow: '0 0 8px rgba(74, 222, 128, 0.8)' }}
                  />
                )}
              </AnimatePresence>

              {/* Ultimate glow effect */}
              {isUltimate && canUse && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
