import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { CompoundVerbDescriptor, EmojiPropDescriptor } from "@/lib/verbAnimations";

interface VerbAnimationLayerProps {
  /** Single emoji descriptor (legacy, for grades 6–12 battle mode). */
  descriptor?: EmojiPropDescriptor | null;
  /** Compound descriptor with multiple props + label (Pre-K signature scenes). */
  compound?: CompoundVerbDescriptor | null;
  /** Unique id so the same scene can re-trigger cleanly. */
  id: number | null;
  /** Anchor position (px from container top-left) — typically the enemy center. */
  anchor: { x: number; y: number };
}

type ActiveScene =
  | { kind: "single"; id: number; d: EmojiPropDescriptor }
  | { kind: "compound"; id: number; d: CompoundVerbDescriptor };

export const VerbAnimationLayer = ({ descriptor, compound, id, anchor }: VerbAnimationLayerProps) => {
  const [active, setActive] = useState<ActiveScene | null>(null);

  useEffect(() => {
    if (id == null) return;
    if (compound) {
      setActive({ kind: "compound", id, d: compound });
      const t = setTimeout(() => setActive(null), compound.duration * 1000);
      return () => clearTimeout(t);
    }
    if (descriptor) {
      setActive({ kind: "single", id, d: descriptor });
      const t = setTimeout(() => setActive(null), (descriptor.duration ?? 1.1) * 1000);
      return () => clearTimeout(t);
    }
  }, [descriptor, compound, id]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
      <AnimatePresence>
        {active?.kind === "single" && (
          <motion.span
            key={`s-${active.id}`}
            className="absolute text-3xl select-none"
            style={{ left: anchor.x, top: anchor.y, willChange: "transform, opacity" }}
            initial={{
              x: active.d.from.x,
              y: active.d.from.y,
              scale: active.d.startScale ?? 0.6,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              x: active.d.to.x,
              y: active.d.to.y,
              scale: active.d.endScale ?? 1,
              opacity: [0, 1, 1, 0],
              rotate: active.d.rotate ?? 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: active.d.duration ?? 1.1,
              delay: active.d.delay ?? 0,
              ease: "easeOut",
              opacity: { times: [0, 0.15, 0.75, 1], duration: active.d.duration ?? 1.1 },
            }}
            aria-hidden
          >
            {active.d.emoji}
          </motion.span>
        )}

        {active?.kind === "compound" && (
          <>
            {active.d.props.map((p, i) => (
              <motion.span
                key={`c-${active.id}-${i}`}
                className="absolute text-4xl select-none drop-shadow-md"
                style={{ left: anchor.x, top: anchor.y, willChange: "transform, opacity" }}
                initial={{
                  x: p.from.x,
                  y: p.from.y,
                  scale: p.startScale ?? 0.5,
                  opacity: 0,
                  rotate: 0,
                }}
                animate={{
                  x: p.to.x,
                  y: p.to.y,
                  scale: p.endScale ?? 1.1,
                  opacity: [0, 1, 1, 0],
                  rotate: p.rotate ?? 0,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: p.duration ?? 1.1,
                  delay: p.delay ?? 0,
                  ease: "easeOut",
                  opacity: { times: [0, 0.2, 0.8, 1], duration: p.duration ?? 1.1 },
                }}
                aria-hidden
              >
                {p.emoji}
              </motion.span>
            ))}
            {active.d.label && (
              <motion.div
                key={`label-${active.id}`}
                className="absolute font-black text-base sm:text-lg px-3 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap"
                style={{
                  left: anchor.x,
                  top: anchor.y,
                  backgroundColor: active.d.label.color ?? "#f59e0b",
                  color: "white",
                }}
                initial={{ x: -30, y: -90, scale: 0, opacity: 0, rotate: -10 }}
                animate={{
                  x: -30,
                  y: -90,
                  scale: [0, 1.3, 1, 1, 0.9],
                  opacity: [0, 1, 1, 1, 0],
                  rotate: [-10, 5, -3, 3, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: active.d.duration,
                  delay: 0.2,
                  ease: "easeOut",
                }}
                aria-hidden
              >
                {active.d.label.text}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
