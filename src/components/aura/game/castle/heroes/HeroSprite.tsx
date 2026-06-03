import { HeroDef } from "./heroRoster";
import type { ReactNode } from "react";

interface Props {
  hero: HeroDef;
  size?: number;
  locked?: boolean;
  bare?: boolean;
  level?: number;
  attacking?: boolean;
}

const clampLevel = (level?: number) => Math.max(0, Math.min(5, Math.floor(Number(level) || 0)));

const METAL = ["#64748b", "#7891aa", "#8aa6c3", "#d6b45d", "#e6c76c", "#f4dd8c"];
const EDGE = "#020617";
const SKIN = "#f2c49b";
const WOOD = "#7c3f1d";
const LEATHER = "#432818";
const GEM = ["#38bdf8", "#22c55e", "#a78bfa", "#f59e0b", "#f43f5e", "#fef3c7"];

/**
 * Large readable battlefield sprites. Low levels intentionally look like scrappy
 * recruits; upgrades add armor, plumes, glow, trim, and better weapons.
 */
export const HeroSprite = ({ hero, size = 46, locked, bare, level = 0, attacking }: Props) => {
  const lvl = clampLevel(level);
  const elite = lvl >= 3;
  const legendary = lvl >= 5;
  const armor = METAL[lvl];
  const accent = GEM[lvl];
  const body = hero.role === "wall" ? "#166534" : hero.role === "front" ? "#1e40af" : "#6d28d9";
  const shadow = locked ? 0.35 : 1;
  const bob = attacking ? "translate(2 -1)" : "translate(0 0)";

  const frame = !bare ? <rect x="2" y="2" width="60" height="60" rx="9" fill="#07111f" stroke={accent} strokeOpacity="0.45" strokeWidth="1.2" /> : null;

  const baseBody = (
    <g transform={bob}>
      <ellipse cx="32" cy="58" rx="16" ry="3.2" fill="#000" opacity="0.42" />
      <path d="M17 27 C15 40 17 51 24 55 H40 C47 51 49 40 47 27 Z" fill={hero.role === "support" ? "#4c1d95" : body} stroke={EDGE} strokeWidth="2" />
      <rect x="21" y="31" width="22" height="18" rx="4" fill={hero.role === "front" ? armor : body} stroke={EDGE} strokeWidth="2" />
      <path d="M22 33 H42" stroke={accent} strokeWidth={elite ? 4 : 2.5} strokeLinecap="round" />
      <path d="M24 48 V57 M40 48 V57" stroke={EDGE} strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="20" r={hero.id === "giant" ? 11 : 8.5} fill={SKIN} stroke={EDGE} strokeWidth="2" />
      {hero.role === "front" || elite ? (
        <path d="M22 19 C22 10 42 10 42 19 V23 H22 Z" fill={armor} stroke={EDGE} strokeWidth="2" />
      ) : (
        <path d="M23 18 C24 11 40 11 41 18" fill="none" stroke={body} strokeWidth="5" strokeLinecap="round" />
      )}
      {elite && <path d="M32 8 C37 2 43 7 38 13" fill={accent} stroke={EDGE} strokeWidth="1.2" />}
      <rect x="27" y="20" width="10" height="2.4" rx="1" fill={hero.role === "front" ? EDGE : "#111827"} />
      <path d="M29 25 Q32 27 35 25" stroke={EDGE} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {legendary && <circle cx="32" cy="20" r="15" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.75" />}
    </g>
  );

  const bow = (elven = false) => (
    <g transform={attacking ? "translate(2 -1) rotate(-8 48 30)" : ""}>
      <path d="M49 10 C59 24 59 42 49 55" fill="none" stroke={elven ? "#86efac" : WOOD} strokeWidth="4" strokeLinecap="round" />
      <path d="M49 10 C43 28 43 37 49 55" fill="none" stroke="#fef3c7" strokeWidth="1.2" />
      <path d="M46 31 H18" stroke="#fef3c7" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17 31 L25 27 L24 31 L25 35 Z" fill="#e2e8f0" stroke={EDGE} strokeWidth="0.8" />
      {elite && <path d="M14 31 H3" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.8" />}
    </g>
  );

  const sword = (kind: "short" | "shield" | "lance" | "holy" | "club" = "short") => (
    <g transform={attacking ? "translate(3 0) rotate(10 47 34)" : ""}>
      {kind === "shield" && <path d="M8 30 L20 26 V43 C17 50 13 54 8 56 C3 54 0 50 -2 43 V26 Z" fill="#0f5ca8" stroke={EDGE} strokeWidth="2" />}
      {kind !== "club" ? (
        <>
          <path d={kind === "lance" ? "M47 8 V56" : "M49 13 V49"} stroke={kind === "holy" ? "#fff7ad" : "#e5e7eb"} strokeWidth={kind === "holy" ? 5 : 3.5} strokeLinecap="round" />
          <path d="M45 48 H53" stroke={LEATHER} strokeWidth="4" strokeLinecap="round" />
          {kind === "lance" && <path d="M47 5 L52 13 H42 Z" fill="#e5e7eb" stroke={EDGE} strokeWidth="1" />}
        </>
      ) : (
        <>
          <path d="M46 23 L55 49" stroke={WOOD} strokeWidth="4" strokeLinecap="round" />
          <rect x="48" y="12" width="12" height="18" rx="4" fill="#854d0e" stroke={EDGE} strokeWidth="2" transform="rotate(18 54 21)" />
        </>
      )}
    </g>
  );

  const staff = (kind: "ice" | "heal" | "torch" | "repair") => (
    <g>
      {kind === "repair" ? (
        <>
          <path d="M48 18 L40 54" stroke={WOOD} strokeWidth="4" strokeLinecap="round" />
          <rect x="43" y="12" width="16" height="8" rx="2" fill="#94a3b8" stroke={EDGE} strokeWidth="2" transform="rotate(15 51 16)" />
          <path d="M23 14 C25 7 39 7 41 14 H23 Z" fill="#facc15" stroke={EDGE} strokeWidth="2" />
        </>
      ) : kind === "torch" ? (
        <>
          <path d="M48 18 L48 55" stroke={WOOD} strokeWidth="4" strokeLinecap="round" />
          <path d="M48 18 C40 10 47 2 48 0 C56 8 56 14 48 18 Z" fill="#f97316" stroke={EDGE} strokeWidth="1.4" />
          <path d="M48 14 C44 9 48 5 49 4 C52 8 52 12 48 14 Z" fill="#fde047" />
        </>
      ) : (
        <>
          <path d="M48 9 V56" stroke={kind === "ice" ? "#bae6fd" : "#f8fafc"} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="48" cy="9" r="7" fill={kind === "ice" ? "#67e8f9" : "#fef2f2"} stroke={EDGE} strokeWidth="2" />
          {kind === "heal" && <path d="M48 4 V14 M43 9 H53" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />}
        </>
      )}
    </g>
  );

  const cannon = (
    <g transform={attacking ? "translate(3 0)" : ""}>
      <rect x="34" y="30" width="27" height="12" rx="4" fill="#334155" stroke={EDGE} strokeWidth="2" />
      <circle cx="58" cy="36" r="4" fill="#020617" />
      <circle cx="39" cy="45" r="4" fill="#78350f" stroke={EDGE} strokeWidth="1.5" />
      <circle cx="54" cy="45" r="4" fill="#78350f" stroke={EDGE} strokeWidth="1.5" />
      {attacking && <circle cx="63" cy="36" r="8" fill="#f97316" opacity="0.85" />}
    </g>
  );

  let accessory: ReactNode = null;
  if (hero.id === "archer") accessory = bow(false);
  else if (hero.id === "elven_archer") accessory = bow(true);
  else if (hero.id === "rifleman") accessory = <g><rect x="38" y="29" width="25" height="5" rx="2" fill="#1f2937" stroke={EDGE} strokeWidth="1.5" />{attacking && <path d="M63 31 L70 28 L68 34 Z" fill="#fde68a" />}</g>;
  else if (hero.id === "dwarf_cannon") accessory = cannon;
  else if (hero.id === "ice_mage") accessory = staff("ice");
  else if (hero.id === "elven_healer") accessory = staff("heal");
  else if (hero.id === "torch_bearer") accessory = staff("torch");
  else if (hero.id === "repairman") accessory = staff("repair");
  else if (hero.id === "shield_knight") accessory = sword("shield");
  else if (hero.id === "knight") accessory = sword("lance");
  else if (hero.id === "paladin") accessory = sword("holy");
  else if (hero.id === "giant") accessory = sword("club");
  else accessory = sword("short");

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ opacity: shadow, display: "block", overflow: "visible" }} aria-label={`${hero.name} level ${lvl}`}>
      {frame}
      {legendary && <circle cx="32" cy="32" r="27" fill={accent} opacity="0.12" />}
      {baseBody}
      {accessory}
      {lvl > 0 && !bare && (
        <g>
          <rect x="39" y="47" width="21" height="10" rx="5" fill="#020617" opacity="0.82" />
          <text x="49.5" y="54.5" textAnchor="middle" fontSize="7.5" fill={accent} fontWeight="900">Lv {lvl}</text>
        </g>
      )}
      {locked && (
        <g>
          <rect x="2" y="2" width="60" height="60" rx="9" fill="#020617" opacity="0.7" />
          <circle cx="32" cy="32" r="12" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
          <text x="32" y="37" textAnchor="middle" fontSize="15" fill="#cbd5e1" fontWeight="bold">🔒</text>
        </g>
      )}
    </svg>
  );
};
