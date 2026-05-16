import { motion } from "framer-motion";
import { Pet } from "@/lib/petsData";

interface PetVisualProps {
  pet: Pet;
  size?: number; // pixels
  attacking?: boolean;
  charged?: boolean;
}

/**
 * Distinct CSS-rendered pet sprite. Combines a colored body shape with the
 * pet emoji and accent glow so every pet feels visually unique without
 * external image assets.
 */
export const PetVisual = ({ pet, size = 64, attacking = false, charged = false }: PetVisualProps) => {
  const ringStyle = {
    background: `radial-gradient(circle, ${pet.accentColor}55 0%, ${pet.bodyColor}33 60%, transparent 80%)`,
  };
  const bodyStyle = {
    background: `radial-gradient(circle at 30% 30%, ${pet.accentColor}, ${pet.bodyColor})`,
    boxShadow: charged
      ? `0 0 20px ${pet.attack.color}, 0 0 40px ${pet.attack.color}88, inset 0 -4px 8px rgba(0,0,0,0.25)`
      : `0 4px 10px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.25)`,
  };

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={attacking ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : charged ? { y: [0, -4, 0] } : {}}
      transition={attacking ? { duration: 0.4 } : { duration: 1.5, repeat: Infinity }}
    >
      {/* Aura ring */}
      <div
        className="absolute inset-0 rounded-full blur-md"
        style={ringStyle}
      />
      {/* Body */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{ width: size * 0.85, height: size * 0.85, ...bodyStyle }}
      >
        <span style={{ fontSize: size * 0.5, lineHeight: 1, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))' }}>
          {pet.emoji}
        </span>
      </div>
      {/* Charged spark */}
      {charged && (
        <motion.div
          className="absolute -top-1 -right-1 rounded-full"
          style={{
            width: size * 0.25,
            height: size * 0.25,
            background: pet.attack.color,
            boxShadow: `0 0 12px ${pet.attack.color}`,
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};
