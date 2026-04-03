import { motion } from "framer-motion";
import { Flame, Snowflake, Zap, X, Sparkles, Flower2, Heart, Shield, Sword, Wind, Sun, Crosshair, Binary, Eye, EyeOff, Wifi, Bomb, Target } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Spell {
  id: string;
  name: string;
  damage: number;
  mpCost: number;
  icon: LucideIcon;
  color: string;
  effect: 'fire' | 'ice' | 'lightning' | 'slash' | 'nature' | 'heal' | 'wind';
  description?: string;
}

// Sir Valor's warrior abilities - physical attacks
export const valorSpells: Spell[] = [
  { 
    id: 'power_slash', 
    name: 'Power Slash', 
    damage: 30, 
    mpCost: 15, 
    icon: Sword, 
    color: 'from-red-500 to-orange-600', 
    effect: 'slash',
    description: 'A mighty sword strike!'
  },
  { 
    id: 'shield_bash', 
    name: 'Shield Bash', 
    damage: 20, 
    mpCost: 10, 
    icon: Shield, 
    color: 'from-blue-500 to-slate-600', 
    effect: 'slash',
    description: 'Stuns and damages the foe'
  },
  { 
    id: 'heroes_fury', 
    name: "Hero's Fury", 
    damage: 45, 
    mpCost: 25, 
    icon: Flame, 
    color: 'from-amber-400 to-red-600', 
    effect: 'fire',
    description: 'Unleash burning rage!'
  },
];

// Elara's wizard spells - elemental magic
export const elaraSpells: Spell[] = [
  { 
    id: 'lightning', 
    name: 'Lightning Bolt', 
    damage: 35, 
    mpCost: 25, 
    icon: Zap, 
    color: 'from-yellow-400 to-amber-500', 
    effect: 'lightning',
    description: 'Call down the thunder!'
  },
  { 
    id: 'ice_shard', 
    name: 'Ice Shard', 
    damage: 20, 
    mpCost: 15, 
    icon: Snowflake, 
    color: 'from-cyan-400 to-blue-500', 
    effect: 'ice',
    description: 'Freeze your enemies!'
  },
  { 
    id: 'fireball', 
    name: 'Fireball', 
    damage: 30, 
    mpCost: 20, 
    icon: Flame, 
    color: 'from-orange-500 to-red-600', 
    effect: 'fire',
    description: 'A blazing sphere of flames!'
  },
];

// Princess Ella's nature magic - healing and nature attacks
export const ellaSpells: Spell[] = [
  { 
    id: 'petal_storm', 
    name: 'Petal Storm', 
    damage: 25, 
    mpCost: 15, 
    icon: Flower2, 
    color: 'from-pink-400 to-rose-500', 
    effect: 'nature',
    description: 'A swirl of magical petals!'
  },
  { 
    id: 'healing_bloom', 
    name: 'Healing Bloom', 
    damage: 0, 
    mpCost: 20, 
    icon: Heart, 
    color: 'from-green-400 to-emerald-500', 
    effect: 'heal',
    description: 'Restore 25 HP with flower magic!'
  },
  { 
    id: 'sunbeam', 
    name: 'Sunbeam', 
    damage: 35, 
    mpCost: 25, 
    icon: Sun, 
    color: 'from-yellow-300 to-amber-400', 
    effect: 'nature',
    description: 'Channel the sun\'s radiance!'
  },
  { 
    id: 'fairy_wind', 
    name: 'Fairy Wind', 
    damage: 20, 
    mpCost: 12, 
    icon: Wind, 
    color: 'from-teal-300 to-cyan-400', 
    effect: 'wind',
    description: 'A magical gust of wind!'
  },
];

// Agent X's tactical abilities
export const agentXSpells: Spell[] = [
  {
    id: 'tactical_strike',
    name: 'Tactical Strike',
    damage: 30,
    mpCost: 15,
    icon: Crosshair,
    color: 'from-slate-500 to-slate-700',
    effect: 'slash',
    description: 'Precise close-quarters takedown'
  },
  {
    id: 'flashbang',
    name: 'Flashbang',
    damage: 25,
    mpCost: 20,
    icon: Zap,
    color: 'from-yellow-300 to-amber-500',
    effect: 'lightning',
    description: 'Blinding tactical grenade!'
  },
  {
    id: 'precision_shot',
    name: 'Precision Shot',
    damage: 40,
    mpCost: 25,
    icon: Target,
    color: 'from-red-600 to-rose-800',
    effect: 'fire',
    description: 'One shot, one hit.'
  },
];

// Cipher's digital warfare abilities
export const cipherSpells: Spell[] = [
  {
    id: 'data_burst',
    name: 'Data Burst',
    damage: 35,
    mpCost: 20,
    icon: Binary,
    color: 'from-cyan-400 to-teal-600',
    effect: 'fire',
    description: 'Plasma numbers blast the target!'
  },
  {
    id: 'system_hack',
    name: 'System Hack',
    damage: 25,
    mpCost: 15,
    icon: Wifi,
    color: 'from-cyan-300 to-blue-500',
    effect: 'lightning',
    description: 'Override enemy defenses!'
  },
  {
    id: 'firewall',
    name: 'Firewall',
    damage: 0,
    mpCost: 20,
    icon: Shield,
    color: 'from-emerald-400 to-cyan-600',
    effect: 'heal',
    description: 'Digital barrier restores 25 HP'
  },
];

// Shadow's stealth abilities
export const shadowSpells: Spell[] = [
  {
    id: 'shadow_strike',
    name: 'Shadow Strike',
    damage: 35,
    mpCost: 18,
    icon: EyeOff,
    color: 'from-purple-600 to-indigo-900',
    effect: 'slash',
    description: 'Strike from the darkness!'
  },
  {
    id: 'smoke_bomb',
    name: 'Smoke Bomb',
    damage: 20,
    mpCost: 12,
    icon: Bomb,
    color: 'from-gray-500 to-slate-700',
    effect: 'wind',
    description: 'Disorient and damage!'
  },
  {
    id: 'assassination',
    name: 'Assassination',
    damage: 50,
    mpCost: 30,
    icon: Eye,
    color: 'from-red-700 to-purple-900',
    effect: 'fire',
    description: 'Lethal precision strike!'
  },
];

// Legacy spells for backwards compatibility
export const defaultSpells: Spell[] = elaraSpells;

interface RPGSpellMenuProps {
  currentMp: number;
  onSelectSpell: (spell: Spell) => void;
  onClose: () => void;
  spells?: Spell[]; // Optional - defaults to Elara's spells
  characterName?: string; // For the header
}

export const RPGSpellMenu = ({
  currentMp,
  onSelectSpell,
  onClose,
  spells = defaultSpells,
  characterName = 'Magic',
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
          <Sparkles className="h-4 w-4" />
          {characterName}
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
          const isHeal = spell.effect === 'heal';
          
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
                  {isHeal ? (
                    <span className="text-green-400">+25 HP</span>
                  ) : (
                    <span className="text-red-400">{spell.damage} DMG</span>
                  )}
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
