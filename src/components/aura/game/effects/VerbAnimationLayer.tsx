import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { EmojiPropDescriptor } from "@/lib/verbAnimations";

interface VerbAnimationLayerProps {
  /** Resolved emoji descriptor from useVerbAnimation. Null = nothing to render. */
  descriptor: EmojiPropDescriptor | null;
  /** Unique id so the same emoji can re-trigger cleanly. */
  id: number | null;
  /** Anchor position (px from container top-left) — typically the enemy center. */
  anchor: { x: number; y: number };
}

export const VerbAnimationLayer = ({ descriptor, id, anchor }: VerbAnimationLayerProps) => {
  const [active, setActive] = useState<{ id: number; d: EmojiPropDescriptor } | null>(null);

  useEffect(() => {
    if (!descriptor || id == null) return;
    setActive({ id, d: descriptor });
    const duration = (descriptor.duration ?? 1.1) * 1000;
    const timer = setTimeout(() => setActive(null), duration);
    return () => clearTimeout(timer);
  }, [descriptor, id]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
      <AnimatePresence>
        {active && (
          <motion.span
            key={active.id}
            className="absolute text-3xl select-none"
            style={{
              left: anchor.x,
              top: anchor.y,
              willChange: "transform, opacity",
            }}
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
      </AnimatePresence>
    </div>
  );
};
