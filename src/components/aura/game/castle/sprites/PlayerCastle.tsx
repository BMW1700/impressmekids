import { memo } from "react";
import { motion } from "framer-motion";

interface Props {
  hp: number;
  maxHp: number;
  variant?: "classic" | "agent";
}

/**
 * Player castle (right side). Multi-tier stone keep with flapping banner
 * and torch flames. Crack overlay appears as HP drops.
 */
export const PlayerCastle = memo(({ hp, maxHp, variant = "classic" }: Props) => {
  const pct = Math.max(0, hp / maxHp);
  const showCracks = pct < 0.66;
  const showSmoke = pct < 0.25;
  const bannerColor = variant === "agent" ? "#22d3ee" : "#3b82f6";

  return (
    <div className="relative" style={{ width: 150, height: 200 }}>
      {showSmoke && (
        <>
          <motion.div
            className="absolute -top-6 left-8 w-6 h-6 rounded-full bg-slate-500/60"
            animate={{ y: [-4, -20], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute -top-4 right-10 w-5 h-5 rounded-full bg-slate-600/50"
            animate={{ y: [-4, -22], opacity: [0.5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.8, ease: "easeOut" }}
          />
        </>
      )}

      <svg viewBox="0 0 150 200" width={150} height={200} className="drop-shadow-2xl">
        {/* ground shadow */}
        <ellipse cx="75" cy="195" rx="60" ry="6" fill="#000" opacity="0.35" />

        {/* base wall */}
        <rect x="15" y="100" width="120" height="90" fill="#6b7280" />
        <rect x="15" y="100" width="120" height="90" fill="url(#stoneTex)" opacity="0.4" />

        {/* crenellations base wall */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <rect key={i} x={18 + i * 20} y="92" width="12" height="10" fill="#6b7280" />
        ))}

        {/* main tower */}
        <rect x="50" y="50" width="50" height="80" fill="#7c8590" />
        <rect x="50" y="50" width="50" height="80" fill="url(#stoneTex)" opacity="0.5" />

        {/* tower crenellations */}
        {[0, 1, 2].map(i => (
          <rect key={i} x={52 + i * 18} y="42" width="10" height="10" fill="#7c8590" />
        ))}

        {/* drawbridge */}
        <rect x="62" y="150" width="26" height="40" fill="#5a3a22" />
        <line x1="68" y1="150" x2="68" y2="190" stroke="#3a2418" strokeWidth="1" />
        <line x1="75" y1="150" x2="75" y2="190" stroke="#3a2418" strokeWidth="1" />
        <line x1="82" y1="150" x2="82" y2="190" stroke="#3a2418" strokeWidth="1" />

        {/* windows */}
        <rect x="62" y="70" width="8" height="12" fill="#1a1a2e" />
        <rect x="80" y="70" width="8" height="12" fill="#1a1a2e" />
        <rect x="62" y="100" width="6" height="10" fill="#1a1a2e" />
        <rect x="82" y="100" width="6" height="10" fill="#1a1a2e" />

        {/* tower roof / flag pole */}
        <line x1="75" y1="20" x2="75" y2="45" stroke="#3a3a3a" strokeWidth="2" />

        {/* cracks (damage state) */}
        {showCracks && (
          <g stroke="#1a1a1a" strokeWidth="1.2" fill="none" opacity="0.7">
            <path d="M30 110 L40 130 L36 150 L46 170" />
            <path d="M110 120 L100 140 L108 160" />
            {pct < 0.33 && <path d="M55 80 L62 100 L58 120" />}
          </g>
        )}

        <defs>
          <pattern id="stoneTex" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill="none" />
            <line x1="0" y1="10" x2="20" y2="10" stroke="#000" strokeOpacity="0.25" strokeWidth="0.8" />
            <line x1="10" y1="0" x2="10" y2="10" stroke="#000" strokeOpacity="0.25" strokeWidth="0.8" />
            <line x1="0" y1="10" x2="0" y2="20" stroke="#000" strokeOpacity="0.25" strokeWidth="0.8" />
          </pattern>
        </defs>
      </svg>

      {/* Animated banner (rendered as DOM so we can wave it) */}
      <motion.div
        className="absolute"
        style={{ top: 22, left: 70, width: 4, height: 22, background: bannerColor }}
        animate={{ skewY: [-2, 2, -2] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute"
        style={{ top: 22, left: 74, width: 22, height: 14, background: bannerColor, clipPath: "polygon(0 0, 100% 0, 75% 50%, 100% 100%, 0 100%)" }}
        animate={{ skewY: [-3, 3, -3], scaleX: [1, 0.94, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Torch flames */}
      <motion.div
        className="absolute"
        style={{ top: 90, left: 12, width: 8, height: 12, background: "radial-gradient(circle, #ffd84a 0%, #ff7a1a 60%, transparent 100%)", borderRadius: "50%" }}
        animate={{ scaleY: [1, 1.2, 0.9, 1], opacity: [0.8, 1, 0.7, 0.8] }}
        transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute"
        style={{ top: 90, right: 12, width: 8, height: 12, background: "radial-gradient(circle, #ffd84a 0%, #ff7a1a 60%, transparent 100%)", borderRadius: "50%" }}
        animate={{ scaleY: [1, 1.2, 0.9, 1], opacity: [0.8, 1, 0.7, 0.8] }}
        transition={{ duration: 0.45, repeat: Infinity, delay: 0.2, ease: "easeInOut" }}
      />
    </div>
  );
});
PlayerCastle.displayName = "PlayerCastle";
