import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shield, Sparkles, Package } from "lucide-react";
import { RPGSpellMenu, Spell, valorSpells, elaraSpells, ellaSpells } from "./RPGSpellMenu";
import { RPGItemMenu, Item } from "./RPGItemMenu";

type CommandType = 'read' | 'magic' | 'defend' | 'items';
type CharacterId = 'valor' | 'elara' | 'ella';

interface RPGCommandMenuProps {
  onSelectCommand: (command: CommandType) => void;
  onCastSpell?: (spell: Spell) => void;
  onUseItem?: (item: Item) => void;
  isPlayerTurn: boolean;
  disabled?: boolean;
  currentCommand?: CommandType | null;
  currentMp?: number;
  inventory?: { [itemId: string]: number };
  selectedCharacter?: CharacterId | null; // New prop for character-specific spells
}

const commands: { id: CommandType; label: string; icon: typeof BookOpen; color: string }[] = [
  { id: 'read', label: 'Read', icon: BookOpen, color: 'from-emerald-500 to-green-600' },
  { id: 'magic', label: 'Magic', icon: Sparkles, color: 'from-purple-500 to-indigo-600' },
  { id: 'defend', label: 'Defend', icon: Shield, color: 'from-blue-500 to-cyan-600' },
  { id: 'items', label: 'Items', icon: Package, color: 'from-amber-500 to-orange-600' },
];

export const RPGCommandMenu = ({
  onSelectCommand,
  onCastSpell,
  onUseItem,
  isPlayerTurn,
  disabled = false,
  currentCommand = null,
  currentMp = 0,
  inventory = { health_potion: 2, magic_potion: 1 },
  selectedCharacter = null,
}: RPGCommandMenuProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSpellMenu, setShowSpellMenu] = useState(false);
  const [showItemMenu, setShowItemMenu] = useState(false);

  // Get character-specific spells
  const getCharacterSpells = (): Spell[] => {
    switch (selectedCharacter) {
      case 'valor': return valorSpells;
      case 'elara': return elaraSpells;
      case 'ella': return ellaSpells;
      default: return elaraSpells; // Default to wizard spells
    }
  };

  const getCharacterName = (): string => {
    switch (selectedCharacter) {
      case 'valor': return 'Combat Arts';
      case 'elara': return 'Magic';
      case 'ella': return 'Nature Magic';
      default: return 'Magic';
    }
  };

  const handleSelect = (command: CommandType, index: number) => {
    if (disabled || !isPlayerTurn) return;
    setSelectedIndex(index);
    
    if (command === 'magic') {
      setShowSpellMenu(true);
      setShowItemMenu(false);
    } else if (command === 'items') {
      setShowItemMenu(true);
      setShowSpellMenu(false);
    } else {
      setShowSpellMenu(false);
      setShowItemMenu(false);
      onSelectCommand(command);
    }
  };

  const handleSpellSelect = (spell: Spell) => {
    setShowSpellMenu(false);
    onCastSpell?.(spell);
  };

  const handleItemSelect = (item: Item) => {
    setShowItemMenu(false);
    onUseItem?.(item);
  };

  return (
    <div className="relative">
      {/* Spell Submenu - Portal to body */}
      {createPortal(
        <AnimatePresence>
          {showSpellMenu && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowSpellMenu(false)}>
              <div className="w-72" onClick={(e) => e.stopPropagation()}>
                <RPGSpellMenu
                  currentMp={currentMp}
                  onSelectSpell={handleSpellSelect}
                  onClose={() => setShowSpellMenu(false)}
                  spells={getCharacterSpells()}
                  characterName={getCharacterName()}
                />
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Item Submenu - Portal to body */}
      {createPortal(
        <AnimatePresence>
          {showItemMenu && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowItemMenu(false)}>
              <div className="w-72" onClick={(e) => e.stopPropagation()}>
                <RPGItemMenu
                  inventory={inventory}
                  onSelectItem={handleItemSelect}
                  onClose={() => setShowItemMenu(false)}
                />
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Classic RPG Panel Border */}
      <div className="relative bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-lg 
        border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
        backdrop-blur-sm overflow-hidden">
        
        <div className="absolute inset-[2px] rounded-md border border-blue-500/20 pointer-events-none" />
        
        <div className="px-4 py-2 border-b border-blue-400/30 bg-gradient-to-r from-blue-900/50 to-indigo-900/50">
          <h3 className="text-sm font-bold text-blue-200 tracking-wider uppercase">Command</h3>
        </div>

        <div className="p-2 space-y-1">
          {commands.map((command, index) => {
            const Icon = command.icon;
            const isSelected = selectedIndex === index;
            const isHovered = hoveredIndex === index;
            const isActive = currentCommand === command.id;
            
            return (
              <motion.button
                key={command.id}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left
                  transition-all duration-200 group
                  ${isActive ? 'bg-gradient-to-r ' + command.color + ' text-white' : ''}
                  ${!isActive && isHovered ? 'bg-white/10' : ''}
                  ${disabled || !isPlayerTurn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => handleSelect(command.id, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                disabled={disabled || !isPlayerTurn}
                whileHover={!disabled && isPlayerTurn ? { x: 4 } : {}}
                whileTap={!disabled && isPlayerTurn ? { scale: 0.98 } : {}}
              >
                {(isSelected || isHovered) && !isActive && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="absolute left-0 text-yellow-400">
                    <motion.span animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>▶</motion.span>
                  </motion.div>
                )}
                <div className={`flex items-center justify-center w-8 h-8 rounded-md ${isActive ? 'bg-white/20' : 'bg-gradient-to-br ' + command.color + '/20'}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-200'}`} />
                </div>
                <span className={`font-semibold tracking-wide ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>{command.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className={`px-4 py-2 border-t border-blue-400/30 text-center text-xs font-medium ${isPlayerTurn ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPlayerTurn ? '✦ Your Turn ✦' : '⚔ Enemy Turn ⚔'}
        </div>
      </div>
    </div>
  );
};
