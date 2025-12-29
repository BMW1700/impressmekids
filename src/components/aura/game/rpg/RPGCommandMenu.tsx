import { useState } from "react";
import { motion } from "framer-motion";
import { Sword, BookOpen, Shield, Sparkles } from "lucide-react";

type CommandType = 'read' | 'magic' | 'defend' | 'items';

interface RPGCommandMenuProps {
  onSelectCommand: (command: CommandType) => void;
  isPlayerTurn: boolean;
  disabled?: boolean;
  currentCommand?: CommandType | null;
}

const commands: { id: CommandType; label: string; icon: typeof Sword; color: string }[] = [
  { id: 'read', label: 'Read', icon: BookOpen, color: 'from-emerald-500 to-green-600' },
  { id: 'magic', label: 'Magic', icon: Sparkles, color: 'from-purple-500 to-indigo-600' },
  { id: 'defend', label: 'Defend', icon: Shield, color: 'from-blue-500 to-cyan-600' },
  { id: 'items', label: 'Items', icon: Sword, color: 'from-amber-500 to-orange-600' },
];

export const RPGCommandMenu = ({
  onSelectCommand,
  isPlayerTurn,
  disabled = false,
  currentCommand = null,
}: RPGCommandMenuProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelect = (command: CommandType, index: number) => {
    if (disabled || !isPlayerTurn) return;
    setSelectedIndex(index);
    onSelectCommand(command);
  };

  return (
    <div className="relative">
      {/* Classic RPG Panel Border */}
      <div className="relative bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-lg 
        border-2 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
        backdrop-blur-sm overflow-hidden">
        
        {/* Inner border glow */}
        <div className="absolute inset-[2px] rounded-md border border-blue-500/20 pointer-events-none" />
        
        {/* Header */}
        <div className="px-4 py-2 border-b border-blue-400/30 bg-gradient-to-r from-blue-900/50 to-indigo-900/50">
          <h3 className="text-sm font-bold text-blue-200 tracking-wider uppercase">Command</h3>
        </div>

        {/* Commands List */}
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
                {/* Selection Arrow */}
                {(isSelected || isHovered) && !isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-0 text-yellow-400"
                  >
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                      ▶
                    </motion.span>
                  </motion.div>
                )}

                {/* Icon */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-md
                  ${isActive ? 'bg-white/20' : 'bg-gradient-to-br ' + command.color + '/20'}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-' + command.color.split('-')[1] + '-400'}`} />
                </div>

                {/* Label */}
                <span className={`font-semibold tracking-wide
                  ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                  {command.label}
                </span>

                {/* Active indicator glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-md"
                    animate={{
                      boxShadow: ['0 0 10px rgba(255,255,255,0.2)', '0 0 20px rgba(255,255,255,0.4)', '0 0 10px rgba(255,255,255,0.2)'],
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Turn Indicator */}
        <div className={`px-4 py-2 border-t border-blue-400/30 text-center text-xs font-medium
          ${isPlayerTurn ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPlayerTurn ? '✦ Your Turn ✦' : '⚔ Enemy Turn ⚔'}
        </div>
      </div>
    </div>
  );
};
