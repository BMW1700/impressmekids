import { motion } from "framer-motion";
import { Heart, Sparkles, X, Zap, Shield, Skull, Coins, RotateCcw } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Item {
  id: string;
  name: string;
  description: string;
  effect: 'heal_hp' | 'restore_mp' | 'heal_full' | 'mp_full' | 'double_xp' | 'speed' | 'defense' | 'rage' | 'gold_boost' | 'revive';
  value: number;
  icon: LucideIcon;
  color: string;
}

// Default items that match store potion IDs
const defaultItems: Item[] = [
  { 
    id: 'health_potion', 
    name: 'Health Potion', 
    description: 'Restore 30 HP',
    effect: 'heal_hp', 
    value: 30, 
    icon: Heart, 
    color: 'from-red-500 to-rose-600' 
  },
  { 
    id: 'magic_potion', 
    name: 'Magic Potion', 
    description: 'Restore 20 MP',
    effect: 'restore_mp', 
    value: 20, 
    icon: Sparkles, 
    color: 'from-blue-500 to-purple-600' 
  },
  { 
    id: 'mega_health', 
    name: 'Mega Health Potion', 
    description: 'Fully restore HP',
    effect: 'heal_full', 
    value: 100, 
    icon: Heart, 
    color: 'from-pink-500 to-red-600' 
  },
  { 
    id: 'mana_surge', 
    name: 'Mana Surge', 
    description: 'Fully restore MP',
    effect: 'mp_full', 
    value: 50, 
    icon: Sparkles, 
    color: 'from-purple-500 to-indigo-600' 
  },
  { 
    id: 'double_xp', 
    name: 'Double XP Elixir', 
    description: '2x XP for this battle',
    effect: 'double_xp', 
    value: 2, 
    icon: Sparkles, 
    color: 'from-yellow-500 to-amber-600' 
  },
  { 
    id: 'speed_potion', 
    name: 'Speed Elixir', 
    description: '+50% attack speed',
    effect: 'speed', 
    value: 50, 
    icon: Zap, 
    color: 'from-cyan-500 to-blue-600' 
  },
  { 
    id: 'shield_potion', 
    name: 'Iron Skin', 
    description: '-50% damage taken',
    effect: 'defense', 
    value: 50, 
    icon: Shield, 
    color: 'from-slate-500 to-zinc-600' 
  },
  { 
    id: 'rage_potion', 
    name: 'Berserker Brew', 
    description: '+100% damage, -20% HP',
    effect: 'rage', 
    value: 100, 
    icon: Skull, 
    color: 'from-orange-500 to-red-600' 
  },
  { 
    id: 'lucky_coin', 
    name: 'Lucky Coin', 
    description: '2x gold this battle',
    effect: 'gold_boost', 
    value: 100, 
    icon: Coins, 
    color: 'from-yellow-400 to-amber-500' 
  },
  { 
    id: 'revive_feather', 
    name: 'Phoenix Feather', 
    description: 'Auto-revive if defeated',
    effect: 'revive', 
    value: 50, 
    icon: RotateCcw, 
    color: 'from-orange-400 to-red-500' 
  },
];

interface RPGItemMenuProps {
  inventory: { [itemId: string]: number };
  onSelectItem: (item: Item) => void;
  onClose: () => void;
}

export const RPGItemMenu = ({
  inventory,
  onSelectItem,
  onClose,
}: RPGItemMenuProps) => {
  // Filter to only show items that the player has
  const availableItems = defaultItems.filter(item => (inventory[item.id] || 0) > 0);
  const hasNoItems = availableItems.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative bg-gradient-to-b from-amber-900/95 to-orange-950/95 rounded-lg 
        border-2 border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
        backdrop-blur-sm overflow-hidden p-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className="text-sm font-bold text-amber-200 tracking-wider uppercase flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Items
        </h3>
        <button 
          onClick={onClose}
          className="text-amber-300 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {availableItems.map((item) => {
          const Icon = item.icon;
          const count = inventory[item.id] || 0;
          
          return (
            <motion.button
              key={item.id}
              className="relative w-full flex items-center gap-3 px-3 py-2 rounded-md
                transition-all duration-200 group hover:bg-white/10 cursor-pointer"
              onClick={() => onSelectItem(item)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-md
                bg-gradient-to-br ${item.color} shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <p className="font-semibold text-white text-sm">{item.name}</p>
                <p className="text-xs text-amber-300">{item.description}</p>
              </div>

              {/* Count */}
              <div className="flex items-center justify-center w-6 h-6 rounded-full
                bg-amber-500/30 text-xs font-bold text-amber-200">
                {count}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Empty State */}
      {hasNoItems && (
        <div className="text-center py-6">
          <p className="text-amber-400/60 text-sm mb-2">No items available</p>
          <p className="text-amber-400/40 text-xs">Buy potions from the store!</p>
        </div>
      )}
    </motion.div>
  );
};

export type { Item };
