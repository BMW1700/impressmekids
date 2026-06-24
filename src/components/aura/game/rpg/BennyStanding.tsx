import { motion, useReducedMotion } from "framer-motion";
import bennyAsset from "@/assets/benny-standing.png.asset.json";

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

        {/* Tail wag overlay — clipped to tail region of the PNG, rotates around tail base */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "30% 65%",
            // Clip to the left side where Benny's tail sits in the source PNG
            clipPath: "polygon(0% 38%, 32% 38%, 32% 88%, 0% 88%)",
            WebkitClipPath: "polygon(0% 38%, 32% 38%, 32% 88%, 0% 88%)",
          }}
          animate={
            reduceMotion
              ? undefined
              : { rotate: [0, 10, -6, 8, 0] }
          }
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
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

        {/* Blink overlay — thin horizontal strip across the eyes */}
        {!reduceMotion && (
          <motion.div
            style={{
              position: "absolute",
              left: "30%",
              right: "22%",
              top: "30%",
              height: "4%",
              background: "rgba(54, 30, 18, 0.95)",
              borderRadius: "50%",
              filter: "blur(1px)",
            }}
            animate={{ opacity: [0, 0, 0, 1, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.92, 0.95, 0.97, 1],
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default BennyStanding;
