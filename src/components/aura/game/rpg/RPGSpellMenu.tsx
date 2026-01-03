import { motion } from "framer-motion";
import { Flame, Snowflake, Zap, X } from "lucide-react";

interface Spell {
  id: string;
  name: string;
  damage: number;
  mpCost: number;
  icon: typeof Flame;
  color: string;
  effect: 'fire' | 'ice' | 'lightning';
}

const spells: Spell[] = [
  { id: 'lightning', name: 'Lightning', damage: 35, mpCost: 25, icon: Zap, color: 'from-yellow-400 to-amber-500', effect: 'lightning' },
  { id: 'ice_shard', name: 'Ice Shard', damage: 20, mpCost: 15, icon: Snowflake, color: 'from-cyan-400 to-blue-500', effect: 'ice' },
  { id: 'fireball', name: 'Fireball', damage: 30, mpCost: 20, icon: Flame, color: 'from-orange-500 to-red-600', effect: 'fire' },
];

interface RPGSpellMenuProps {
  currentMp: number;
  onSelectSpell: (spell: Spell) => void;
  onClose: () => void;
}

export const RPGSpellMenu = ({
  currentMp,
  onSelectSpell,
  onClose,
}: RPGSpellMenuProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative bg-gradient-to-b from-purple-900/95 to-indigo-950/95 rounded-lg 
        border-2 border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
        backdrop-blur-sm overflow-hidden p-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className="text-sm font-bold text-purple-200 tracking-wider uppercase flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Magic
        </h3>
        <button 
          onClick={onClose}
          className="text-purple-300 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Spells List */}
      <div className="space-y-2">
        {spells.map((spell) => {
          const Icon = spell.icon;
          const canAfford = currentMp >= spell.mpCost;
          
          return (
            <motion.button
              key={spell.id}
              className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-md
                transition-all duration-200 group
                ${canAfford 
                  ? 'hover:bg-white/10 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
                }`}
              onClick={() => canAfford && onSelectSpell(spell)}
              disabled={!canAfford}
              whileHover={canAfford ? { x: 4 } : {}}
              whileTap={canAfford ? { scale: 0.98 } : {}}
            >
              {/* Icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-md
                bg-gradient-to-br ${spell.color} shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <p className="font-semibold text-white text-sm">{spell.name}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-red-400">{spell.damage} DMG</span>
                  <span className="text-purple-400">{spell.mpCost} MP</span>
                </div>
              </div>

              {/* MP Cost Indicator */}
              {!canAfford && (
                <span className="text-xs text-red-400">Need MP</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Current MP */}
      <div className="mt-3 pt-2 border-t border-purple-400/30 px-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-purple-300">Current MP:</span>
          <span className="font-bold text-purple-200">{currentMp}</span>
        </div>
      </div>
    </motion.div>
  );
};

export type { Spell };
