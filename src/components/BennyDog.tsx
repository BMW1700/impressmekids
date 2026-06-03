// Benny the Dog — the Pre-K adventure character.
// Three moods: idle (gentle bounce), celebrate (jump + scale), sad (shake).

import { motion } from "framer-motion";
import idleAsset from "@/assets/benny-idle.png.asset.json";
import celebrateAsset from "@/assets/benny-celebrate.png.asset.json";
import sadAsset from "@/assets/benny-sad.png.asset.json";

export type BennyMood = "idle" | "celebrate" | "sad";

interface BennyDogProps {
  mood?: BennyMood;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SOURCES: Record<BennyMood, string> = {
  idle: idleAsset.url,
  celebrate: celebrateAsset.url,
  sad: sadAsset.url,
};

const ANIMATIONS = {
  idle: {
    animate: { y: [0, -6, 0], rotate: [0, 0, 0] },
    transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" as const },
  },
  celebrate: {
    animate: { y: [0, -28, 0, -16, 0], scale: [1, 1.18, 1.08, 1.14, 1.05] },
    transition: { duration: 1.1, repeat: Infinity, ease: "easeOut" as const },
  },
  sad: {
    animate: { x: [0, -6, 6, -4, 4, 0], rotate: [0, -3, 3, -2, 2, 0] },
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export const BennyDog = ({
  mood = "idle",
  size = 140,
  className,
  style,
}: BennyDogProps) => {
  const anim = ANIMATIONS[mood];
  return (
    <motion.div
      key={mood}
      animate={anim.animate}
      transition={anim.transition}
      className={className}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
    >
      <img
        src={SOURCES[mood]}
        alt="Benny the dog"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </motion.div>
  );
};

export default BennyDog;
