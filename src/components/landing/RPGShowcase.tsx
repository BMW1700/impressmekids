import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RPGParentAttackVFX, type ParentAttackKind } from "@/components/aura/game/rpg/RPGParentAttackVFX";

/**
 * Cinematic showcase: hero (left) and villain (right) trade powers in a slow loop.
 * Reuses RPGParentAttackVFX for fire/ice and renders lightweight inline SVG sprites
 * so it stays cheap on iPad / Chromebook.
 */
interface RPGShowcaseProps {
  variant?: "hero" | "compact";
  className?: string;
}

type Phase =
  | "idle"
  | "heroWindup"
  | "heroAttack"
  | "villainHit"
  | "rest"
  | "villainWindup"
  | "villainAttack"
  | "heroHit";

const TIMINGS: Record<Phase, number> = {
  idle: 1200,
  heroWindup: 350,
  heroAttack: 1100,
  villainHit: 600,
  rest: 800,
  villainWindup: 350,
  villainAttack: 1100,
  heroHit: 600,
};

const NEXT: Record<Phase, Phase> = {
  idle: "heroWindup",
  heroWindup: "heroAttack",
  heroAttack: "villainHit",
  villainHit: "rest",
  rest: "villainWindup",
  villainWindup: "villainAttack",
  villainAttack: "heroHit",
  heroHit: "idle",
};

export const RPGShowcase = ({ variant = "hero", className = "" }: RPGShowcaseProps) => {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [fireKey, setFireKey] = useState(0);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pause when off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Phase loop
  useEffect(() => {
    if (reduce || !visible) return;
    const t = setTimeout(() => {
      const next = NEXT[phase];
      if (next === "heroAttack" || next === "villainAttack") {
        setFireKey((k) => k + 1);
      }
      setPhase(next);
    }, TIMINGS[phase]);
    return () => clearTimeout(t);
  }, [phase, reduce, visible]);

  // Determine what VFX to show
  const heroAttacking = phase === "heroAttack";
  const villainAttacking = phase === "villainAttack";
  const attackKind: ParentAttackKind | null = heroAttacking
    ? "fireball"
    : villainAttacking
    ? "ice_blast"
    : null;
  const attackDirection = heroAttacking ? "leftToRight" : "rightToLeft";

  const heroState = phase === "heroHit" ? "hit" : phase === "heroWindup" || phase === "heroAttack" ? "attack" : "idle";
  const villainState = phase === "villainHit" ? "hit" : phase === "villainWindup" || phase === "villainAttack" ? "attack" : "idle";

  const sizing =
    variant === "hero"
      ? "h-[280px] sm:h-[340px] md:h-[400px]"
      : "h-[180px] sm:h-[220px]";

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${sizing} ${className}`}
      aria-hidden
    >
      {/* Soft arena floor / glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 100%, hsl(280 70% 45% / 0.35), transparent 70%)",
        }}
      />

      {/* Hero (left) */}
      <div className="absolute left-[8%] sm:left-[12%] md:left-[18%] top-1/2 -translate-y-1/2">
        <KnightSprite state={heroState} variant={variant} />
      </div>

      {/* Villain (right) */}
      <div className="absolute right-[8%] sm:right-[12%] md:right-[18%] top-1/2 -translate-y-1/2">
        <GoblinSprite state={villainState} variant={variant} />
      </div>

      {/* VFX layer (contained to this box) */}
      <RPGParentAttackVFX
        kind={attackKind}
        fireKey={fireKey}
        direction={attackDirection}
        contained
      />

      {/* Static fallback for reduced motion: a frozen fireball mid-air */}
      {reduce && (
        <div
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #fff7c2 0%, #ffb24a 35%, #ff5a1f 65%, #7a1500 100%)",
            boxShadow: "0 0 30px 12px rgba(255,120,30,0.55)",
          }}
        />
      )}
    </div>
  );
};

// ─── Knight sprite ─────────────────────────────────────────────────────
const KnightSprite = ({
  state,
  variant,
}: {
  state: "idle" | "attack" | "hit";
  variant: "hero" | "compact";
}) => {
  const size = variant === "hero" ? 160 : 110;

  const animate =
    state === "hit"
      ? { x: [0, -14, 8, -6, 0], rotate: [0, -4, 2, 0] }
      : state === "attack"
      ? { x: [0, 10, -4, 0], scale: [1, 1.06, 1] }
      : { y: [0, -4, 0] };

  return (
    <motion.div
      animate={animate}
      transition={{
        duration: state === "idle" ? 2.2 : 0.5,
        repeat: state === "idle" ? Infinity : 0,
        ease: state === "idle" ? "easeInOut" : "easeOut",
      }}
      style={{ width: size, height: size }}
      className="relative"
    >
      {/* Glow under feet */}
      <div
        className="absolute inset-x-2 bottom-1 h-3 rounded-full blur-md"
        style={{ background: "hsl(48 100% 60% / 0.5)" }}
      />
      <svg viewBox="0 0 100 120" width={size} height={size} className="relative">
        <defs>
          <linearGradient id="kArmor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="kCape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        {/* Cape */}
        <path d="M30 50 Q20 90 32 110 L50 95 L68 110 Q80 90 70 50 Z" fill="url(#kCape)" />
        {/* Body armor */}
        <rect x="34" y="48" width="32" height="38" rx="6" fill="url(#kArmor)" stroke="#1e3a8a" strokeWidth="1.5" />
        {/* Belt */}
        <rect x="34" y="78" width="32" height="5" fill="#78350f" />
        {/* Legs */}
        <rect x="38" y="86" width="9" height="20" rx="3" fill="#1e40af" />
        <rect x="53" y="86" width="9" height="20" rx="3" fill="#1e40af" />
        {/* Boots */}
        <rect x="36" y="104" width="13" height="6" rx="2" fill="#451a03" />
        <rect x="51" y="104" width="13" height="6" rx="2" fill="#451a03" />
        {/* Helmet */}
        <path d="M34 22 Q34 10 50 10 Q66 10 66 22 L66 44 Q66 50 60 50 L40 50 Q34 50 34 44 Z" fill="url(#kArmor)" stroke="#1e3a8a" strokeWidth="1.5" />
        {/* Visor slit */}
        <rect x="40" y="28" width="20" height="4" fill="#0f172a" />
        {/* Visor glow eyes */}
        <circle cx="44" cy="30" r="1.4" fill="#67e8f9" />
        <circle cx="56" cy="30" r="1.4" fill="#67e8f9" />
        {/* Plume */}
        <path d="M50 8 Q56 -2 62 6 Q56 8 50 12 Z" fill="#dc2626" />
        {/* Shield (left arm) */}
        <motion.g
          animate={state === "attack" ? { x: [-2, -8, -2] } : {}}
          transition={{ duration: 0.5 }}
        >
          <path d="M22 56 Q18 56 18 62 L18 80 Q18 92 30 96 Q42 92 42 80 L42 62 Q42 56 38 56 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
          <path d="M30 64 L30 86 M22 72 L38 72" stroke="#92400e" strokeWidth="1.5" />
        </motion.g>
        {/* Sword (right arm) raised when attacking */}
        <motion.g
          animate={state === "attack" ? { rotate: [-30, 30, 10] } : { rotate: [-10, 0, -10] }}
          transition={{ duration: state === "attack" ? 0.6 : 2.2, repeat: state === "idle" ? Infinity : 0 }}
          style={{ transformOrigin: "70px 60px" }}
        >
          <rect x="68" y="58" width="4" height="6" fill="#78350f" />
          <rect x="64" y="62" width="12" height="3" fill="#facc15" />
          <rect x="69" y="20" width="2.5" height="42" fill="#e5e7eb" stroke="#94a3b8" strokeWidth="0.6" />
          <polygon points="69,18 70.25,14 71.5,18" fill="#cbd5e1" />
        </motion.g>
      </svg>
    </motion.div>
  );
};

// ─── Goblin / Villain sprite ───────────────────────────────────────────
const GoblinSprite = ({
  state,
  variant,
}: {
  state: "idle" | "attack" | "hit";
  variant: "hero" | "compact";
}) => {
  const size = variant === "hero" ? 160 : 110;

  const animate =
    state === "hit"
      ? { x: [0, 14, -8, 6, 0], rotate: [0, 4, -2, 0] }
      : state === "attack"
      ? { x: [0, -10, 4, 0], scale: [1, 1.06, 1] }
      : { y: [0, -4, 0] };

  return (
    <motion.div
      animate={animate}
      transition={{
        duration: state === "idle" ? 2.4 : 0.5,
        repeat: state === "idle" ? Infinity : 0,
        ease: state === "idle" ? "easeInOut" : "easeOut",
      }}
      style={{ width: size, height: size, transform: "scaleX(-1)" }}
      className="relative"
    >
      <div
        className="absolute inset-x-2 bottom-1 h-3 rounded-full blur-md"
        style={{ background: "hsl(190 90% 55% / 0.5)", transform: "scaleX(-1)" }}
      />
      <svg viewBox="0 0 100 120" width={size} height={size} className="relative">
        <defs>
          <linearGradient id="gSkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="gCloak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>
          <radialGradient id="gOrb" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="60%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0e7490" />
          </radialGradient>
        </defs>
        {/* Cloak */}
        <path d="M22 50 Q14 100 30 112 L50 98 L70 112 Q86 100 78 50 Z" fill="url(#gCloak)" stroke="#1e1b4b" strokeWidth="1" />
        {/* Hood shadow */}
        <path d="M30 42 Q30 18 50 18 Q70 18 70 42 L66 50 L34 50 Z" fill="#1e1b4b" />
        {/* Face inside hood */}
        <ellipse cx="50" cy="38" rx="14" ry="14" fill="url(#gSkin)" />
        {/* Pointy ears */}
        <path d="M36 36 L28 28 L38 32 Z" fill="url(#gSkin)" />
        <path d="M64 36 L72 28 L62 32 Z" fill="url(#gSkin)" />
        {/* Eyes — glowing red */}
        <circle cx="44" cy="38" r="2.6" fill="#fef3c7" />
        <circle cx="56" cy="38" r="2.6" fill="#fef3c7" />
        <circle cx="44" cy="38.5" r="1.4" fill="#dc2626" />
        <circle cx="56" cy="38.5" r="1.4" fill="#dc2626" />
        <circle cx="44" cy="38.5" r="0.6" fill="#fff" />
        <circle cx="56" cy="38.5" r="0.6" fill="#fff" />
        {/* Snarl */}
        <path d="M44 46 Q50 50 56 46" stroke="#14532d" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M46 46 L46 49 M50 47 L50 50 M54 46 L54 49" stroke="#fafaf9" strokeWidth="0.9" />
        {/* Body (under cloak) */}
        <ellipse cx="50" cy="78" rx="14" ry="16" fill="#3b0764" />
        {/* Hands raised — left (back) holds staff, right casts orb when attacking */}
        <ellipse cx="32" cy="70" rx="4.5" ry="5" fill="url(#gSkin)" />
        {/* Staff */}
        <rect x="29" y="20" width="3" height="60" rx="1.5" fill="#451a03" />
        <circle cx="30.5" cy="18" r="6" fill="url(#gOrb)" />
        <motion.circle
          cx="30.5"
          cy="18"
          r="9"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="1"
          animate={{ opacity: [0.2, 0.7, 0.2], r: [8, 12, 8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Casting hand */}
        <motion.g
          animate={state === "attack" ? { x: [0, -10, 0], y: [0, -4, 0] } : {}}
          transition={{ duration: 0.6 }}
        >
          <ellipse cx="68" cy="68" rx="5" ry="5.5" fill="url(#gSkin)" />
          {/* Charging orb when attacking */}
          {state === "attack" && (
            <motion.circle
              cx="74"
              cy="64"
              r="6"
              fill="url(#gOrb)"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.2, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.4 }}
            />
          )}
        </motion.g>
      </svg>
    </motion.div>
  );
};
