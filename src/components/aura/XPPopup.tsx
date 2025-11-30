import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface XPPopupProps {
  xp: number;
  trigger: number;
  position?: { x: number; y: number };
}

export const XPPopup = ({ xp, trigger, position = { x: 50, y: 50 } }: XPPopupProps) => {
  if (trigger === 0 || xp === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={trigger}
        initial={{ 
          scale: 0,
          x: `${position.x}%`,
          y: `${position.y}%`,
          opacity: 0 
        }}
        animate={{ 
          scale: [0, 1.2, 1],
          y: `${position.y - 20}%`,
          opacity: [0, 1, 1, 0],
        }}
        transition={{ 
          duration: 1.5,
          times: [0, 0.3, 0.6, 1]
        }}
        className="fixed pointer-events-none z-50 flex items-center gap-2"
        style={{ left: 0, top: 0 }}
      >
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          +{xp} XP
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
