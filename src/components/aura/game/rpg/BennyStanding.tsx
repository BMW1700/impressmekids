import { motion, useReducedMotion } from "framer-motion";
import bennyAsset from "@/assets/benny-book-ears.png.asset.json";

interface BennyStandingProps {
  size?: number;
  className?: string;
}

/**
 * Benny standing on the left side of the Pre-K world map.
 * Idle animations: slow head/body tilt, eye blink, tail wag.
 * Respects prefers-reduced-motion.
 */
export const BennyStanding = ({ size = 260, className }: BennyStandingProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        pointerEvents: "none",
        userSelect: "none",
      }}
      aria-label="Benny the puppy"
      role="img"
    >
      {/* Whole-body slow tilt */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 85%",
        }}
        animate={
          reduceMotion
            ? undefined
            : { rotate: [0, -3, 0, 2.5, 0] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src={bennyAsset.url}
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

      </motion.div>
    </div>
  );
};

export default BennyStanding;
