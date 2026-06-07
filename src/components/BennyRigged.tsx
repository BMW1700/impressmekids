// Two-layer rigged Benny — head (with ears) + body — driven by a `pose` prop.
//
// Both layers are 1024x1024 PNGs registered on the same canvas, so stacking
// them with `position:absolute; inset:0` perfectly reconstructs the puppy.
// The head pivots around the BASE of the neck (≈54% across, ≈53% down inside
// the 1024 canvas), which gives Mario-like head nods/tilts without the head
// detaching from the collar.
//
// Poses use Framer Motion keyframes. Body squash/stretch happens through
// scaleX/scaleY with `transform-origin: 50% 100%` (planted at feet).

import { motion } from "framer-motion";
import headAsset from "@/assets/benny-rig-head.png.asset.json";
import bodyAsset from "@/assets/benny-rig-body.png.asset.json";

export type BennyPose =
  | "idle"
  | "look"      // worried — head rotates side to side
  | "talk"      // small head bob while speaking
  | "cheer"    // jumping for joy after correct word
  | "sad"      // head droop + body slump
  | "hop"      // single big stretched hop
  | "bark";    // head thrusts forward (used to "say" the action word)

interface Props {
  pose?: BennyPose;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Pivot for the head layer within the 1024x1024 canvas — base of the skull
// right above the collar. Tuned visually so rotations don't pop.
const HEAD_PIVOT = { x: "54%", y: "53%" };

const headAnim = (pose: BennyPose) => {
  switch (pose) {
    case "look":
      return {
        animate: { rotate: [0, -10, 8, -6, 0], y: [0, -2, 0, -1, 0] },
        transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const },
      };
    case "talk":
      return {
        animate: { rotate: [0, -3, 0, 3, 0], y: [0, -3, 0, -2, 0] },
        transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" as const },
      };
    case "cheer":
      return {
        animate: { rotate: [0, -6, 4, -3, 0], y: [0, -14, -4, -10, 0] },
        transition: { duration: 0.9, repeat: Infinity, ease: "easeOut" as const },
      };
    case "sad":
      return {
        animate: { rotate: [0, -2, 2, 0], y: [0, 6, 6, 8] },
        transition: { duration: 1.4, ease: "easeOut" as const },
      };
    case "hop":
      return {
        animate: { rotate: [0, -4, 0, 4, 0], y: [0, -6, -2, -4, 0] },
        transition: { duration: 1.0, ease: "easeOut" as const },
      };
    case "bark":
      return {
        animate: { rotate: [0, -10, -6, -10, 0], y: [0, -6, -2, -6, 0] },
        transition: { duration: 0.55, repeat: 1, ease: "easeOut" as const },
      };
    default:
      return {
        animate: { rotate: [0, -1.5, 0, 1.5, 0], y: [0, -2, 0, -2, 0] },
        transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const },
      };
  }
};

const bodyAnim = (pose: BennyPose) => {
  switch (pose) {
    case "cheer":
      return {
        animate: {
          y: [0, -22, 0, -14, 0],
          scaleY: [1, 1.10, 0.92, 1.06, 1],
          scaleX: [1, 0.94, 1.08, 0.96, 1],
        },
        transition: { duration: 0.9, repeat: Infinity, ease: "easeOut" as const },
      };
    case "sad":
      return {
        animate: { y: [0, 2, 4], scaleY: [1, 0.97, 0.95], scaleX: [1, 1.02, 1.03] },
        transition: { duration: 1.2, ease: "easeOut" as const },
      };
    case "hop":
      return {
        animate: {
          y: [0, 6, -28, 6, 0],
          scaleY: [1, 0.82, 1.18, 0.82, 1],
          scaleX: [1, 1.12, 0.90, 1.12, 1],
        },
        transition: { duration: 1.0, ease: "easeOut" as const, times: [0, 0.2, 0.5, 0.8, 1] },
      };
    case "bark":
      return {
        animate: { scaleX: [1, 1.04, 0.98, 1.04, 1], scaleY: [1, 0.97, 1.02, 0.97, 1] },
        transition: { duration: 0.55, repeat: 1, ease: "easeOut" as const },
      };
    case "talk":
    case "look":
    default:
      return {
        animate: { scaleY: [1, 1.02, 1], scaleX: [1, 0.99, 1] },
        transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const },
      };
  }
};

export const BennyRigged = ({ pose = "idle", size = 280, className, style }: Props) => {
  const h = headAnim(pose);
  const b = bodyAnim(pose);
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
      aria-label={`Benny ${pose}`}
      role="img"
    >
      {/* Body layer — planted at the feet so squash/stretch keeps ground contact. */}
      <motion.img
        src={bodyAsset.url}
        alt=""
        aria-hidden
        draggable={false}
        animate={b.animate}
        transition={b.transition}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transformOrigin: "50% 100%",
          willChange: "transform",
        }}
      />
      {/* Head layer — pivots around the base of the neck. */}
      <motion.img
        src={headAsset.url}
        alt=""
        aria-hidden
        draggable={false}
        animate={h.animate}
        transition={h.transition}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transformOrigin: `${HEAD_PIVOT.x} ${HEAD_PIVOT.y}`,
          willChange: "transform",
        }}
      />
    </div>
  );
};

export default BennyRigged;
