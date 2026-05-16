import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pet } from "@/lib/petsData";
import { PetVisual } from "./PetVisual";

interface PetBattleCompanionProps {
  pet: Pet;
  petName?: string | null;
  level: number;
  charge: number; // 0..maxCharge
  maxCharge: number;
  attacking: boolean;
}

/**
 * Renders the equipped pet next to the player in battle, with a charge bar
 * and a brief attack animation when firing. The actual damage application
 * lives in RPGBattleArena.
 */
export const PetBattleCompanion = ({ pet, petName, level, charge, maxCharge, attacking }: PetBattleCompanionProps) => {
  const charged = charge >= maxCharge;
  const percent = Math.min(100, Math.round((charge / maxCharge) * 100));
  const displayName = petName || pet.name;

  return (
    <div className="relative flex flex-col items-center gap-1 select-none">
      {/* Name + Lv */}
      <div className="text-[10px] text-white/80 font-bold bg-black/40 rounded px-1.5">
        {displayName} Lv{level}
      </div>

      {/* Pet visual */}
      <PetVisual pet={pet} size={56} attacking={attacking} charged={charged} />

      {/* Charge bar */}
      <div className="w-14 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-600">
        <motion.div
          className="h-full"
          style={{ background: pet.attack.color }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Attack effect — projectile flying toward enemy (left) */}
      <AnimatePresence>
        {attacking && (
          <motion.div
            key="pet-attack"
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: [1, 1, 0], x: -400, y: -20, scale: [1, 1.6, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute top-6 right-2 pointer-events-none z-30"
            style={{ fontSize: 36, filter: `drop-shadow(0 0 8px ${pet.attack.color})` }}
          >
            {pet.attack.emoji}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
