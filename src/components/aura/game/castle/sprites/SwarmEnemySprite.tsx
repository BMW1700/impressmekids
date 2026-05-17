import { memo } from "react";
import { motion } from "framer-motion";
import type { EnemyType } from "../enemyTypes";

interface Props {
  type: EnemyType;
  size?: number;
  takingDamage?: boolean;
}

/**
 * Dedicated SVG sprites per enemy type. No more recycled MiniGoblin
 * hue-shifts — each enemy has a unique silhouette and idle animation.
 * Walk cycle: subtle 2-frame body bob via framer-motion.
 */
export const SwarmEnemySprite = memo(({ type, size = 56, takingDamage }: Props) => {
  const baseProps = { width: size, height: size, viewBox: "0 0 64 64" } as const;

  const flash = takingDamage ? { filter: "brightness(2.2) saturate(0)" } : {};

  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: size, ...flash }}
    >
      {type === "goblin" && (
        <svg {...baseProps}>
          {/* body */}
          <ellipse cx="32" cy="46" rx="14" ry="11" fill="#4ea63a" />
          {/* head */}
          <circle cx="32" cy="26" r="13" fill="#5fbf44" />
          {/* ears */}
          <path d="M19 26 L13 18 L20 22 Z" fill="#5fbf44" />
          <path d="M45 26 L51 18 L44 22 Z" fill="#5fbf44" />
          {/* eyes */}
          <circle cx="27" cy="26" r="2.5" fill="#fff" />
          <circle cx="37" cy="26" r="2.5" fill="#fff" />
          <circle cx="27" cy="26" r="1.2" fill="#000" />
          <circle cx="37" cy="26" r="1.2" fill="#000" />
          {/* tusks */}
          <path d="M28 32 L29 36 L30 32 Z" fill="#fff" />
          <path d="M34 32 L35 36 L36 32 Z" fill="#fff" />
          {/* club */}
          <rect x="44" y="32" width="3" height="18" rx="1" fill="#6b4226" transform="rotate(15 45 41)" />
          <circle cx="50" cy="30" r="5" fill="#8a5a32" />
        </svg>
      )}

      {type === "skeleton" && (
        <svg {...baseProps}>
          {/* body bones */}
          <rect x="28" y="34" width="8" height="18" rx="2" fill="#e8e6d8" />
          <rect x="22" y="38" width="20" height="3" fill="#e8e6d8" />
          {/* skull */}
          <circle cx="32" cy="22" r="12" fill="#f4f1e0" />
          <ellipse cx="27" cy="24" rx="3" ry="4" fill="#000" />
          <ellipse cx="37" cy="24" rx="3" ry="4" fill="#000" />
          <rect x="29" y="30" width="2" height="3" fill="#000" />
          <rect x="33" y="30" width="2" height="3" fill="#000" />
          {/* teeth */}
          <rect x="26" y="33" width="12" height="2" fill="#f4f1e0" />
          <line x1="28" y1="33" x2="28" y2="35" stroke="#999" strokeWidth="0.5" />
          <line x1="32" y1="33" x2="32" y2="35" stroke="#999" strokeWidth="0.5" />
          <line x1="36" y1="33" x2="36" y2="35" stroke="#999" strokeWidth="0.5" />
          {/* rusty sword */}
          <rect x="46" y="20" width="2" height="22" fill="#9b8a6a" />
          <rect x="44" y="42" width="6" height="2" fill="#6b4226" />
        </svg>
      )}

      {type === "orc" && (
        <svg {...baseProps}>
          {/* big body */}
          <ellipse cx="32" cy="48" rx="18" ry="13" fill="#3d6b2a" />
          {/* head */}
          <circle cx="32" cy="24" r="15" fill="#4d8a35" />
          {/* shoulder armor */}
          <rect x="14" y="38" width="10" height="8" rx="2" fill="#3a3a3a" />
          <rect x="40" y="38" width="10" height="8" rx="2" fill="#3a3a3a" />
          {/* glowing red eyes */}
          <circle cx="26" cy="24" r="3" fill="#ff2d2d" />
          <circle cx="38" cy="24" r="3" fill="#ff2d2d" />
          <circle cx="26" cy="24" r="1.4" fill="#fff" />
          <circle cx="38" cy="24" r="1.4" fill="#fff" />
          {/* fangs */}
          <path d="M26 32 L28 38 L30 32 Z" fill="#fff" />
          <path d="M34 32 L36 38 L38 32 Z" fill="#fff" />
          {/* battle axe */}
          <rect x="49" y="20" width="3" height="26" fill="#3a2a1a" />
          <path d="M48 18 L58 14 L60 24 L50 26 Z" fill="#9aa0a8" />
          <path d="M50 26 L58 22 L60 28 L52 30 Z" fill="#6b7280" />
        </svg>
      )}

      {type === "bat" && (
        <svg {...baseProps}>
          {/* wings (animated separately) */}
          <motion.path
            animate={{ d: ["M32 32 Q10 18 6 30 Q14 30 32 36 Z", "M32 32 Q12 26 8 36 Q16 34 32 36 Z"] }}
            transition={{ duration: 0.25, repeat: Infinity, ease: "easeInOut" }}
            fill="#1f1f2e"
          />
          <motion.path
            animate={{ d: ["M32 32 Q54 18 58 30 Q50 30 32 36 Z", "M32 32 Q52 26 56 36 Q48 34 32 36 Z"] }}
            transition={{ duration: 0.25, repeat: Infinity, ease: "easeInOut" }}
            fill="#1f1f2e"
          />
          {/* body */}
          <ellipse cx="32" cy="34" rx="6" ry="8" fill="#2a2a40" />
          {/* head */}
          <circle cx="32" cy="28" r="6" fill="#33334a" />
          {/* ears */}
          <path d="M27 23 L26 18 L30 22 Z" fill="#2a2a40" />
          <path d="M37 23 L38 18 L34 22 Z" fill="#2a2a40" />
          {/* glowing eyes */}
          <circle cx="29" cy="28" r="1.5" fill="#ffd84a" />
          <circle cx="35" cy="28" r="1.5" fill="#ffd84a" />
        </svg>
      )}

      {type === "shaman" && (
        <svg {...baseProps}>
          {/* hood/robe */}
          <path d="M16 56 L18 28 Q32 14 46 28 L48 56 Z" fill="#5b2d8a" />
          {/* inner robe accent */}
          <path d="M22 56 L24 36 Q32 30 40 36 L42 56 Z" fill="#7a44b3" />
          {/* face */}
          <ellipse cx="32" cy="32" rx="7" ry="8" fill="#3a5e2e" />
          <circle cx="29" cy="32" r="1.6" fill="#ffd84a" />
          <circle cx="35" cy="32" r="1.6" fill="#ffd84a" />
          {/* glowing orb */}
          <motion.circle
            cx="48" cy="40" r="5"
            animate={{ opacity: [0.6, 1, 0.6], r: [4.5, 5.5, 4.5] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            fill="#a4f3c8"
          />
          <circle cx="48" cy="40" r="2" fill="#fff" />
          {/* staff */}
          <rect x="46" y="40" width="2" height="18" fill="#6b4226" />
        </svg>
      )}

      {type === "armored_orc" && (
        <svg {...baseProps}>
          {/* body with plate */}
          <ellipse cx="32" cy="48" rx="19" ry="14" fill="#2a4a1a" />
          <rect x="18" y="38" width="28" height="14" rx="3" fill="#4a525c" />
          <rect x="20" y="40" width="24" height="2" fill="#6b7280" />
          <rect x="20" y="46" width="24" height="2" fill="#6b7280" />
          {/* head */}
          <circle cx="32" cy="22" r="14" fill="#3d6b2a" />
          {/* iron helm */}
          <path d="M18 22 Q32 6 46 22 L46 28 L18 28 Z" fill="#3a3a44" />
          <rect x="18" y="26" width="28" height="4" fill="#2a2a30" />
          {/* helm slit */}
          <rect x="24" y="24" width="16" height="2" fill="#000" />
          <circle cx="28" cy="25" r="0.8" fill="#ff4a4a" />
          <circle cx="36" cy="25" r="0.8" fill="#ff4a4a" />
          {/* horns */}
          <path d="M16 16 L10 8 L20 14 Z" fill="#e8e6d8" />
          <path d="M48 16 L54 8 L44 14 Z" fill="#e8e6d8" />
          {/* warhammer */}
          <rect x="50" y="22" width="3" height="26" fill="#3a2a1a" />
          <rect x="46" y="18" width="11" height="10" rx="1" fill="#5a626c" />
        </svg>
      )}
    </motion.div>
  );
});
SwarmEnemySprite.displayName = "SwarmEnemySprite";
