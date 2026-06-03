import { HeroDef } from "./heroRoster";

interface Props {
  hero: HeroDef;
  size?: number;
  /** Show a "ghost" tinted version (locked). */
  locked?: boolean;
  /** When rendered in-arena, drop the dark card background so the sprite floats on the battlefield. */
  bare?: boolean;
}

/**
 * Crisp, layered SVG hero portraits. Same viewBox in summon bar AND on the
 * battlefield, so what you tap is what walks onto the field.
 */
export const HeroSprite = ({ hero, size = 40, locked, bare }: Props) => {
  const muted = locked ? 0.4 : 1;
  const stroke = "#0b1220";

  // Role-themed palettes
  const palette =
    hero.role === "wall"
      ? { skin: "#fcd9b8", body: "#15803d", trim: "#bef264", cape: "#166534" }
      : hero.role === "front"
      ? { skin: "#fcd9b8", body: "#1d4ed8", trim: "#fbbf24", cape: "#7f1d1d" }
      : { skin: "#fcd9b8", body: "#6d28d9", trim: "#f0abfc", cape: "#3b0764" };

  const id = hero.id;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{ opacity: muted, display: "block", overflow: "visible" }}
      aria-label={hero.name}
    >
      {!bare && <rect x="0" y="0" width="48" height="48" rx="9" fill="#0b1220" />}

      {/* Ground shadow */}
      <ellipse cx="24" cy="43" rx="11" ry="2.2" fill="#000" opacity="0.45" />

      {/* Cape / silhouette behind body */}
      <path d="M14 22 Q12 34 16 40 L32 40 Q36 34 34 22 Z" fill={palette.cape} stroke={stroke} strokeWidth="0.6" />

      {/* Body */}
      <rect x="15" y="22" width="18" height="16" rx="3" fill={palette.body} stroke={stroke} strokeWidth="0.8" />
      <rect x="15" y="22" width="18" height="3.5" fill={palette.trim} opacity="0.95" />
      {/* Belt */}
      <rect x="15" y="33" width="18" height="2" fill="#1f2937" opacity="0.7" />

      {/* Legs */}
      <rect x="17" y="38" width="4" height="5" rx="1" fill="#1f2937" />
      <rect x="27" y="38" width="4" height="5" rx="1" fill="#1f2937" />

      {/* Head */}
      <circle cx="24" cy="14" r="6.5" fill={palette.skin} stroke={stroke} strokeWidth="0.8" />
      {/* Hair / helmet base */}
      <path d="M17.5 13 Q17 7 24 7 Q31 7 30.5 13 L17.5 13 Z" fill={palette.body} stroke={stroke} strokeWidth="0.6" />
      {/* Eyes */}
      <circle cx="21.5" cy="15" r="0.85" fill="#0f172a" />
      <circle cx="26.5" cy="15" r="0.85" fill="#0f172a" />
      {/* Mouth */}
      <path d="M22 18 Q24 19 26 18" stroke="#0f172a" strokeWidth="0.7" fill="none" strokeLinecap="round" />

      {/* Per-hero accessories */}
      {id === "archer" && (
        <g>
          {/* longbow */}
          <path d="M37 12 Q42 24 37 36" stroke="#92400e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <line x1="37" y1="12" x2="37" y2="36" stroke="#fde68a" strokeWidth="0.8" />
          {/* quiver */}
          <rect x="10" y="20" width="3" height="9" rx="1" fill="#7c2d12" />
          <rect x="10.5" y="19" width="2" height="3" fill="#fde68a" />
        </g>
      )}
      {id === "elven_archer" && (
        <g>
          <path d="M37 9 Q44 24 37 39" stroke="#14532d" strokeWidth="2" fill="none" strokeLinecap="round" />
          <line x1="37" y1="9" x2="37" y2="39" stroke="#bbf7d0" strokeWidth="0.8" />
          {/* pointy ears */}
          <path d="M17 14 L14 11 L18 14 Z" fill={palette.skin} stroke={stroke} strokeWidth="0.4" />
          <path d="M31 14 L34 11 L30 14 Z" fill={palette.skin} stroke={stroke} strokeWidth="0.4" />
          {/* leaf circlet */}
          <path d="M19 9 Q24 6 29 9" stroke="#16a34a" strokeWidth="1.2" fill="none" />
        </g>
      )}
      {id === "rifleman" && (
        <g>
          <rect x="26" y="20" width="18" height="2.4" rx="0.4" fill="#1f2937" />
          <rect x="26" y="22.4" width="6" height="1.5" fill="#374151" />
          <rect x="42" y="19.5" width="2" height="1" fill="#fbbf24" />
        </g>
      )}
      {id === "dwarf_cannon" && (
        <g>
          {/* short stocky body */}
          <rect x="14" y="25" width="20" height="13" rx="3" fill={palette.body} stroke={stroke} strokeWidth="0.8" />
          {/* beard */}
          <path d="M19 20 Q24 27 29 20 L28 18 L20 18 Z" fill="#ea580c" />
          {/* cannon barrel */}
          <rect x="28" y="22" width="16" height="6" rx="1.5" fill="#374151" stroke={stroke} strokeWidth="0.6" />
          <circle cx="44" cy="25" r="1.8" fill="#fbbf24" />
          <rect x="30" y="21" width="3" height="1" fill="#9ca3af" />
        </g>
      )}
      {id === "ice_mage" && (
        <g>
          {/* robe sweep */}
          <path d="M13 24 L11 40 L37 40 L35 24 Z" fill="#1e3a8a" stroke={stroke} strokeWidth="0.6" />
          {/* staff */}
          <line x1="38" y1="6" x2="38" y2="40" stroke="#1e3a8a" strokeWidth="1.8" strokeLinecap="round" />
          <polygon points="38,3 41,7 38,11 35,7" fill="#67e8f9" stroke="#0c4a6e" strokeWidth="0.5" />
          <circle cx="38" cy="7" r="1.2" fill="#ecfeff" />
          {/* hood */}
          <path d="M17 12 Q24 4 31 12 L31 16 L17 16 Z" fill="#1e3a8a" />
        </g>
      )}
      {id === "footman" && (
        <g>
          {/* round shield */}
          <circle cx="11" cy="28" r="5" fill="#92400e" stroke={stroke} strokeWidth="0.6" />
          <circle cx="11" cy="28" r="2" fill="#fbbf24" />
          {/* sword */}
          <rect x="36" y="14" width="2" height="18" fill="#e5e7eb" stroke={stroke} strokeWidth="0.4" />
          <rect x="34" y="32" width="6" height="2" fill="#92400e" />
        </g>
      )}
      {id === "shield_knight" && (
        <g>
          {/* kite shield */}
          <path d="M6 22 L14 22 L14 34 L10 38 L6 34 Z" fill="#0369a1" stroke={stroke} strokeWidth="0.6" />
          <path d="M8 26 L12 26 M10 24 L10 34" stroke="#fef3c7" strokeWidth="1" />
          {/* sword */}
          <rect x="36" y="14" width="2" height="20" fill="#e5e7eb" stroke={stroke} strokeWidth="0.4" />
          {/* visor */}
          <rect x="20" y="13" width="8" height="2" fill="#0f172a" />
        </g>
      )}
      {id === "knight" && (
        <g>
          {/* full helm */}
          <path d="M17 8 Q24 4 31 8 L31 17 L17 17 Z" fill="#94a3b8" stroke={stroke} strokeWidth="0.6" />
          <rect x="20" y="13" width="8" height="2" fill="#0f172a" />
          {/* plume */}
          <path d="M24 1 Q28 -1 30 5 Q26 7 24 4 Z" fill="#dc2626" />
          {/* lance */}
          <rect x="37" y="10" width="2" height="26" fill="#e5e7eb" stroke={stroke} strokeWidth="0.4" />
          <polygon points="38,8 40,11 36,11" fill="#cbd5e1" />
        </g>
      )}
      {id === "paladin" && (
        <g>
          {/* gold armor */}
          <rect x="15" y="22" width="18" height="16" rx="3" fill="#fbbf24" stroke={stroke} strokeWidth="0.8" />
          <path d="M22 26 L26 26 M24 24 L24 34" stroke="#fff7ed" strokeWidth="1.3" />
          {/* great sword */}
          <rect x="37" y="6" width="3" height="26" fill="#f1f5f9" stroke={stroke} strokeWidth="0.4" />
          <rect x="35" y="32" width="7" height="2" fill="#92400e" />
          {/* halo */}
          <ellipse cx="24" cy="6" rx="8" ry="1.6" fill="none" stroke="#fde047" strokeWidth="1.1" />
        </g>
      )}
      {id === "giant" && (
        <g>
          {/* bigger silhouette overwrites body */}
          <rect x="10" y="20" width="28" height="18" rx="3" fill={palette.body} stroke={stroke} strokeWidth="0.8" />
          <circle cx="24" cy="11" r="8" fill={palette.skin} stroke={stroke} strokeWidth="0.8" />
          {/* tusks */}
          <path d="M20 16 L19 19 L21 18 Z" fill="#fffbeb" />
          <path d="M28 16 L29 19 L27 18 Z" fill="#fffbeb" />
          {/* big club */}
          <rect x="36" y="18" width="10" height="5" fill="#92400e" stroke={stroke} strokeWidth="0.5" />
          <rect x="36" y="20" width="10" height="2" fill="#1f2937" />
        </g>
      )}
      {id === "repairman" && (
        <g>
          {/* hard hat */}
          <path d="M16 11 Q24 5 32 11 L32 14 L16 14 Z" fill="#facc15" stroke={stroke} strokeWidth="0.6" />
          {/* hammer */}
          <rect x="34" y="14" width="2" height="20" fill="#92400e" />
          <rect x="29" y="11" width="11" height="5" rx="1" fill="#9ca3af" stroke={stroke} strokeWidth="0.5" />
          {/* tool belt */}
          <rect x="15" y="33" width="18" height="2.5" fill="#7c2d12" />
        </g>
      )}
      {id === "elven_healer" && (
        <g>
          {/* white robe */}
          <path d="M14 24 L11 40 L37 40 L34 24 Z" fill="#f8fafc" stroke={stroke} strokeWidth="0.6" />
          {/* cross emblem */}
          <rect x="22" y="28" width="4" height="10" fill="#dc2626" />
          <rect x="19" y="31" width="10" height="4" fill="#dc2626" />
          {/* pointy ears */}
          <path d="M17 14 L14 11 L18 14 Z" fill={palette.skin} stroke={stroke} strokeWidth="0.4" />
          <path d="M31 14 L34 11 L30 14 Z" fill={palette.skin} stroke={stroke} strokeWidth="0.4" />
        </g>
      )}
      {id === "torch_bearer" && (
        <g>
          {/* torch */}
          <rect x="35" y="14" width="2" height="22" fill="#92400e" />
          <path d="M36 14 Q31 8 36 2 Q41 8 36 14 Z" fill="#f59e0b" />
          <path d="M36 11 Q33 7 36 4 Q39 7 36 11 Z" fill="#fde047" />
          <circle cx="36" cy="6" r="1" fill="#fff7ed" />
          {/* glow ring */}
          <circle cx="36" cy="7" r="5" fill="#fbbf24" opacity="0.25" />
        </g>
      )}

      {locked && (
        <g>
          {!bare && <rect x="0" y="0" width="48" height="48" rx="9" fill="#020617" opacity="0.6" />}
          <circle cx="24" cy="24" r="9" fill="#0f172a" opacity="0.8" />
          <text x="24" y="29" textAnchor="middle" fontSize="13" fill="#cbd5e1" fontWeight="bold">🔒</text>
        </g>
      )}
    </svg>
  );
};
