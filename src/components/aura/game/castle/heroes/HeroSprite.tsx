import { HeroDef } from "./heroRoster";

interface Props {
  hero: HeroDef;
  size?: number;
  /** Show a "ghost" tinted version (locked). */
  locked?: boolean;
}

/**
 * Tiny illustrative SVG portraits per hero. Intentionally clean & solid-color —
 * we'll swap to richer art later. Role-driven palette so the player can read
 * "what does this hero do" at a glance.
 */
export const HeroSprite = ({ hero, size = 40, locked }: Props) => {
  const muted = locked ? 0.35 : 1;
  const stroke = locked ? "#475569" : "#0f172a";
  // Role-themed palettes
  const palette =
    hero.role === "wall"
      ? { skin: "#fcd9b8", body: "#15803d", accent: "#84cc16" }
      : hero.role === "front"
      ? { skin: "#fcd9b8", body: "#1d4ed8", accent: "#fbbf24" }
      : { skin: "#fcd9b8", body: "#7c3aed", accent: "#f0abfc" };

  // Per-hero unique badge / silhouette tweak
  const id = hero.id;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{ opacity: muted, display: "block" }}
      aria-label={hero.name}
    >
      <rect x="0" y="0" width="40" height="40" rx="8" fill="#0b1220" />
      {/* Body */}
      <rect x="13" y="20" width="14" height="14" rx="2" fill={palette.body} stroke={stroke} strokeWidth="0.6" />
      <rect x="13" y="20" width="14" height="3" fill={palette.accent} opacity="0.85" />
      {/* Head */}
      <circle cx="20" cy="14" r="6" fill={palette.skin} stroke={stroke} strokeWidth="0.6" />
      {/* Eyes */}
      <circle cx="18" cy="14" r="0.7" fill="#1f2937" />
      <circle cx="22" cy="14" r="0.7" fill="#1f2937" />

      {/* Hero-specific accessory */}
      {id === "archer" && (
        <>
          {/* bow */}
          <path d="M28 14 Q33 20 28 26" stroke="#92400e" strokeWidth="1.4" fill="none" />
          <line x1="28" y1="14" x2="28" y2="26" stroke="#fde68a" strokeWidth="0.6" />
        </>
      )}
      {id === "elven_archer" && (
        <>
          <path d="M28 12 Q34 20 28 28" stroke="#16a34a" strokeWidth="1.6" fill="none" />
          <line x1="28" y1="12" x2="28" y2="28" stroke="#bbf7d0" strokeWidth="0.6" />
          {/* pointy ears */}
          <path d="M14 13 L12 11 L14 14 Z" fill={palette.skin} />
          <path d="M26 13 L28 11 L26 14 Z" fill={palette.skin} />
        </>
      )}
      {id === "rifleman" && (
        <>
          <rect x="22" y="17" width="14" height="2" fill="#1f2937" />
          <rect x="34" y="17" width="2" height="1" fill="#fbbf24" />
        </>
      )}
      {id === "dwarf_cannon" && (
        <>
          {/* cannon */}
          <rect x="22" y="18" width="13" height="6" rx="1.5" fill="#374151" />
          <circle cx="35" cy="21" r="1.4" fill="#fbbf24" />
        </>
      )}
      {id === "ice_mage" && (
        <>
          {/* staff with crystal */}
          <line x1="30" y1="8" x2="30" y2="32" stroke="#1e3a8a" strokeWidth="1.4" />
          <circle cx="30" cy="8" r="3" fill="#67e8f9" />
          <circle cx="30" cy="8" r="1.2" fill="#ecfeff" />
        </>
      )}
      {id === "footman" && (
        <>
          <rect x="5" y="20" width="6" height="10" rx="1" fill="#92400e" />
          <rect x="5" y="20" width="6" height="2" fill="#fbbf24" />
          <rect x="28" y="14" width="2" height="14" fill="#e5e7eb" />
        </>
      )}
      {id === "shield_knight" && (
        <>
          <rect x="4" y="20" width="8" height="14" rx="1.5" fill="#0369a1" />
          <path d="M6 24 L10 24 M8 22 L8 30" stroke="#fef3c7" strokeWidth="1" />
          <rect x="28" y="14" width="2" height="16" fill="#e5e7eb" />
        </>
      )}
      {id === "knight" && (
        <>
          <rect x="4" y="20" width="7" height="14" rx="1.5" fill="#1e3a8a" />
          <rect x="28" y="12" width="2.5" height="18" fill="#e5e7eb" />
          {/* plume */}
          <path d="M20 4 Q23 0 26 4 Q23 7 20 5 Z" fill="#dc2626" />
        </>
      )}
      {id === "paladin" && (
        <>
          <rect x="3" y="20" width="9" height="14" rx="2" fill="#fbbf24" />
          <path d="M6 24 L10 24 M8 22 L8 30" stroke="#fff7ed" strokeWidth="1" />
          <rect x="28" y="10" width="3" height="20" fill="#f1f5f9" />
          {/* halo */}
          <ellipse cx="20" cy="8" rx="6" ry="1.4" fill="none" stroke="#fde047" strokeWidth="0.8" />
        </>
      )}
      {id === "giant" && (
        <>
          {/* bigger silhouette */}
          <rect x="10" y="18" width="20" height="16" rx="2" fill={palette.body} />
          <circle cx="20" cy="11" r="7" fill={palette.skin} />
          <rect x="30" y="18" width="6" height="3" fill="#92400e" />
          <rect x="30" y="20" width="6" height="2" fill="#1f2937" />
        </>
      )}
      {id === "repairman" && (
        <>
          {/* hammer */}
          <rect x="26" y="14" width="1.6" height="14" fill="#92400e" />
          <rect x="22" y="12" width="9" height="4" rx="0.6" fill="#9ca3af" />
        </>
      )}
      {id === "elven_healer" && (
        <>
          {/* cross */}
          <rect x="18.5" y="24" width="3" height="9" fill="#fff" />
          <rect x="15.5" y="27" width="9" height="3" fill="#fff" />
        </>
      )}
      {id === "torch_bearer" && (
        <>
          {/* torch */}
          <rect x="28" y="14" width="1.6" height="14" fill="#92400e" />
          <path d="M28.8 14 Q26 10 29 6 Q32 10 29 14 Z" fill="#f59e0b" />
          <path d="M28.8 12 Q27 9 29 7 Q31 9 29 12 Z" fill="#fde047" />
        </>
      )}

      {locked && (
        <>
          <rect x="0" y="0" width="40" height="40" rx="8" fill="#020617" opacity="0.55" />
          <text x="20" y="25" textAnchor="middle" fontSize="14" fill="#94a3b8" fontWeight="bold">🔒</text>
        </>
      )}
    </svg>
  );
};
