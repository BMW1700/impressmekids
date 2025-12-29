import { motion } from "framer-motion";
import { Heart, Sparkles, X } from "lucide-react";

interface Item {
  id: string;
  name: string;
  description: string;
  effect: 'heal_hp' | 'restore_mp';
  value: number;
  icon: typeof Heart;
  color: string;
}

const items: Item[] = [
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
    description: 'Restore 25 MP',
    effect: 'restore_mp', 
    value: 25, 
    icon: Sparkles, 
    color: 'from-blue-500 to-purple-600' 
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
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const count = inventory[item.id] || 0;
          const hasItem = count > 0;
          
          return (
            <motion.button
              key={item.id}
              className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-md
                transition-all duration-200 group
                ${hasItem 
                  ? 'hover:bg-white/10 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
                }`}
              onClick={() => hasItem && onSelectItem(item)}
              disabled={!hasItem}
              whileHover={hasItem ? { x: 4 } : {}}
              whileTap={hasItem ? { scale: 0.98 } : {}}
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
              <div className={`flex items-center justify-center w-6 h-6 rounded-full
                ${hasItem ? 'bg-amber-500/30' : 'bg-slate-600/30'}
                text-xs font-bold ${hasItem ? 'text-amber-200' : 'text-slate-400'}`}>
                {count}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Empty State */}
      {Object.values(inventory).every(count => count === 0) && (
        <p className="text-center text-amber-400/60 text-sm py-4">
          No items available
        </p>
      )}
    </motion.div>
  );
};

export type { Item };
