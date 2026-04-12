import { motion } from "framer-motion";
import { Flame, Snowflake, Zap, Shield, Sword, Target, Bomb, Wind } from "lucide-react";

export interface ParentAbility {
  id: string;
  name: string;
  description: string;
  damage: number;
  icon: React.ElementType;
  color: string;
  requiresReading: boolean;
  cooldown: number; // turns
  type: 'attack' | 'minigame' | 'debuff';
  miniGame?: string;
}

const PARENT_ABILITIES: ParentAbility[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launch a fireball! Read a word for +5 bonus damage',
    damage: 10,
    icon: Flame,
    color: 'from-red-500 to-orange-500',
    requiresReading: true,
    cooldown: 0,
    type: 'attack',
  },
  {
    id: 'ice_blast',
    name: 'Ice Blast',
    description: 'Freeze the hero for 1 turn',
    damage: 5,
    icon: Snowflake,
    color: 'from-cyan-500 to-blue-500',
    requiresReading: false,
    cooldown: 2,
    type: 'debuff',
  },
  {
    id: 'word_barrage',
    name: 'Word Barrage',
    description: 'Launch a mini-game barrage attack!',
    damage: 0,
    icon: Bomb,
    color: 'from-purple-500 to-pink-500',
    requiresReading: false,
    cooldown: 3,
    type: 'minigame',
    miniGame: 'word_barrage',
  },
  {
    id: 'lightning',
    name: 'Lightning Strike',
    description: 'Quick shock! Read a word for double damage',
    damage: 8,
    icon: Zap,
    color: 'from-yellow-500 to-amber-500',
    requiresReading: true,
    cooldown: 1,
    type: 'attack',
  },
  {
    id: 'fireball_defense',
    name: 'Fireball Storm',
    description: 'Trigger a fireball defense challenge!',
    damage: 0,
    icon: Target,
    color: 'from-red-600 to-rose-500',
    requiresReading: false,
    cooldown: 3,
    type: 'minigame',
    miniGame: 'fireball_defense',
  },
  {
    id: 'wind_slash',
    name: 'Wind Slash',
    description: 'A quick slash dealing moderate damage',
    damage: 12,
    icon: Wind,
    color: 'from-emerald-500 to-teal-500',
    requiresReading: false,
    cooldown: 1,
    type: 'attack',
  },
];

interface RPGParentControlsProps {
  onSelectAbility: (ability: ParentAbility) => void;
  cooldowns: Record<string, number>;
  parentHp: number;
  parentMaxHp: number;
}

export const RPGParentControls = ({
  onSelectAbility,
  cooldowns,
  parentHp,
  parentMaxHp,
}: RPGParentControlsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-0 left-0 right-0 z-[90] bg-gradient-to-t from-red-950/95 to-transparent p-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-red-400" />
          <span className="text-red-300 font-bold text-sm">PARENT'S TURN — Choose an Attack!</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2 w-32 bg-red-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                style={{ width: `${(parentHp / parentMaxHp) * 100}%` }}
              />
            </div>
            <span className="text-red-300 text-xs font-bold">{parentHp}/{parentMaxHp}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {PARENT_ABILITIES.map(ability => {
            const Icon = ability.icon;
            const onCooldown = (cooldowns[ability.id] || 0) > 0;
            
            return (
              <motion.button
                key={ability.id}
                whileHover={!onCooldown ? { scale: 1.05 } : undefined}
                whileTap={!onCooldown ? { scale: 0.95 } : undefined}
                onClick={() => !onCooldown && onSelectAbility(ability)}
                disabled={onCooldown}
                className={`relative p-3 rounded-xl border-2 transition-all
                  ${onCooldown 
                    ? 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed' 
                    : `bg-gradient-to-br ${ability.color} border-white/20 cursor-pointer hover:shadow-lg`
                  }`}
              >
                <Icon className="h-6 w-6 text-white mx-auto mb-1" />
                <p className="text-white text-xs font-bold truncate">{ability.name}</p>
                {ability.requiresReading && (
                  <span className="absolute top-1 right-1 text-[8px] bg-yellow-500 text-black px-1 rounded font-bold">
                    READ
                  </span>
                )}
                {onCooldown && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl text-white font-bold text-lg">
                    {cooldowns[ability.id]}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
