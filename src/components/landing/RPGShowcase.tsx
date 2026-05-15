import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  RPGParentAttackVFX,
  type ParentAttackKind,
} from "@/components/aura/game/rpg/RPGParentAttackVFX";
import { SirValor } from "@/components/aura/game/characters/SirValor";
import { GoblinGuard } from "@/components/aura/game/characters/GoblinGuard";
import { ShadowWraith } from "@/components/aura/game/characters/ShadowWraith";
import { DrakeTheDragon } from "@/components/aura/game/characters/DrakeTheDragon";
import { IceGolem } from "@/components/aura/game/characters/IceGolem";
import { Check } from "lucide-react";

/**
 * Cinematic landing-page battle showcase.
 *
 * Loop conveys the entire product in ~8s without copy:
 *   1. Words appear and turn green as they're "read"
 *   2. Hero (SirValor) launches a power
 *   3. Enemy is hit, HP drops
 *   4. Enemy retaliates
 *   5. Hero is hit, HP drops
 *   6. Reset, rotate to next enemy
 */

interface RPGShowcaseProps {
  variant?: "hero" | "compact";
  className?: string;
}

type Phase =
  | "reading"
  | "heroWindup"
  | "heroAttack"
  | "enemyHit"
  | "rest"
  | "enemyWindup"
  | "enemyAttack"
  | "heroHit"
  | "reset";

const TIMINGS: Record<Phase, number> = {
  reading: 2400,
  heroWindup: 320,
  heroAttack: 950,
  enemyHit: 650,
  rest: 600,
  enemyWindup: 320,
  enemyAttack: 950,
  heroHit: 650,
  reset: 500,
};

const NEXT: Record<Phase, Phase> = {
  reading: "heroWindup",
  heroWindup: "heroAttack",
  heroAttack: "enemyHit",
  enemyHit: "rest",
  rest: "enemyWindup",
  enemyWindup: "enemyAttack",
  enemyAttack: "heroHit",
  heroHit: "reset",
  reset: "reading",
};

type EnemyKey = "goblin" | "wraith" | "dragon" | "golem";

interface EnemyConfig {
  key: EnemyKey;
  words: string[];
  attack: ParentAttackKind;
  label: string;
}

const ENEMIES: EnemyConfig[] = [
  { key: "goblin", words: ["blast", "the", "goblin"], attack: "fireball", label: "Goblin Guard" },
  { key: "wraith", words: ["banish", "the", "wraith"], attack: "lightning", label: "Shadow Wraith" },
  { key: "dragon", words: ["tame", "the", "dragon"], attack: "fireball", label: "Drake" },
  { key: "golem", words: ["shatter", "the", "golem"], attack: "ice_blast", label: "Ice Golem" },
];

const HERO_ATTACK: ParentAttackKind = "fireball";

export const RPGShowcase = ({ variant = "hero", className = "" }: RPGShowcaseProps) => {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("reading");
  const [fireKey, setFireKey] = useState(0);
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [heroHp, setHeroHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const enemy = ENEMIES[enemyIdx % ENEMIES.length];
  const compact = variant === "compact";
  const charSize: "small" | "medium" | "large" = compact ? "small" : "medium";

  // Pause when off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Phase machine
  useEffect(() => {
    if (reduce || !visible) return;
    const t = setTimeout(() => {
      const next = NEXT[phase];

      // Trigger VFX exactly when entering an attack phase
      if (next === "heroAttack" || next === "enemyAttack") {
        setFireKey((k) => k + 1);
      }
      // Apply damage on hit phases
      if (next === "enemyHit") {
        setEnemyHp((hp) => Math.max(8, hp - (38 + Math.floor(Math.random() * 12))));
      }
      if (next === "heroHit") {
        setHeroHp((hp) => Math.max(8, hp - (28 + Math.floor(Math.random() * 12))));
      }
      // Reset cycle
      if (next === "reset") {
        setTimeout(() => {
          setHeroHp(100);
          setEnemyHp(100);
          setEnemyIdx((i) => (i + 1) % ENEMIES.length);
        }, 250);
      }
      setPhase(next);
    }, TIMINGS[phase]);
    return () => clearTimeout(t);
  }, [phase, reduce, visible]);

  const heroState =
    phase === "heroHit"
      ? "hit"
      : phase === "heroWindup" || phase === "heroAttack"
      ? "attacking"
      : "idle";

  const enemyState =
    phase === "enemyHit"
      ? "hit"
      : phase === "enemyWindup" || phase === "enemyAttack"
      ? "attacking"
      : "idle";

  const heroAttacking = phase === "heroAttack";
  const enemyAttacking = phase === "enemyAttack";
  const attackKind: ParentAttackKind | null = heroAttacking
    ? HERO_ATTACK
    : enemyAttacking
    ? enemy.attack
    : null;
  const attackDirection = heroAttacking ? "leftToRight" : "rightToLeft";

  // Stage screen-shake on hits
  const stageShake =
    phase === "enemyHit" || phase === "heroHit"
      ? { x: [0, -6, 5, -3, 0], y: [0, 2, -2, 1, 0] }
      : { x: 0, y: 0 };

  const sizing = compact
    ? "h-[220px] sm:h-[260px]"
    : "h-[340px] sm:h-[400px] md:h-[460px]";

  const wordCount = compact ? 2 : 3;
  const visibleWords = useMemo(() => enemy.words.slice(0, wordCount), [enemy, wordCount]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl ${sizing} ${className}`}
      style={{
        background:
          "radial-gradient(120% 80% at 50% 100%, hsl(280 70% 28% / 0.55), hsl(240 50% 8% / 0.3) 60%, transparent 100%)",
      }}
      aria-label="Live battle preview: read words to launch powers"
    >
      {/* Arena floor glow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "radial-gradient(60% 90% at 50% 100%, hsl(48 100% 60% / 0.18), transparent 70%)",
        }}
      />
      {/* Subtle grid horizon */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to top, hsl(280 80% 60% / 0.4), transparent), repeating-linear-gradient(90deg, transparent 0 40px, hsl(280 100% 80% / 0.15) 40px 41px)",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      {/* HP bars */}
      {!compact && (
        <>
          <HPBar side="left" label="Hero" hp={heroHp} color="hsl(140 70% 50%)" />
          <HPBar side="right" label={enemy.label} hp={enemyHp} color="hsl(0 75% 58%)" />
        </>
      )}

      {/* Stage with shake */}
      <motion.div
        className="absolute inset-0"
        animate={stageShake}
        transition={{ duration: 0.4 }}
      >
        {/* Hero (left) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            compact ? "left-[6%]" : "left-[8%] sm:left-[12%]"
          }`}
        >
          <SirValor
            state={heroState}
            healthPercent={heroHp}
            size={charSize}
            showHealthBar={false}
            skinVariant="default"
          />
        </div>

        {/* Enemy (right) — rotates */}
        <AnimatePresence mode="wait">
          <motion.div
            key={enemy.key}
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={`absolute top-1/2 -translate-y-1/2 ${
              compact ? "right-[6%]" : "right-[8%] sm:right-[12%]"
            }`}
          >
            {enemy.key === "goblin" && (
              <GoblinGuard state={enemyState} healthPercent={enemyHp} size={charSize} flipX showHealthBar={false} />
            )}
            {enemy.key === "wraith" && (
              <ShadowWraith state={enemyState} healthPercent={enemyHp} size={charSize} flipX />
            )}
            {enemy.key === "dragon" && (
              <DrakeTheDragon state={enemyState} healthPercent={enemyHp} size={charSize} flipX />
            )}
            {enemy.key === "golem" && (
              <IceGolem state={enemyState} healthPercent={enemyHp} size={charSize} flipX />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Reading ticker (center) */}
        <ReadingTicker
          words={visibleWords}
          active={phase === "reading"}
          phase={phase}
          compact={compact}
          // re-mount each cycle so the read-through replays
          resetKey={`${enemy.key}-${enemyIdx}-${phase === "reading" ? 1 : 0}`}
        />

        {/* Floating damage numbers */}
        <AnimatePresence>
          {phase === "enemyHit" && (
            <DamageNumber side="right" key={`dmg-e-${fireKey}`} value="-42" color="#fef08a" />
          )}
          {phase === "heroHit" && (
            <DamageNumber side="left" key={`dmg-h-${fireKey}`} value="-32" color="#fca5a5" />
          )}
        </AnimatePresence>
      </motion.div>

      {/* VFX layer (contained to box) */}
      <RPGParentAttackVFX
        kind={attackKind}
        fireKey={fireKey}
        direction={attackDirection}
        contained
      />

      {/* Caption */}
      {!compact && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-white/60 font-medium">
          Read words → launch powers
        </div>
      )}

      {/* Reduced-motion static frame */}
      {reduce && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-emerald-500/90 px-4 py-2 text-sm font-bold text-white shadow-lg">
            Read · Battle · Win
          </div>
        </div>
      )}
    </div>
  );
};

// ─── HP Bar ──────────────────────────────────────────────────────────
const HPBar = ({
  side,
  label,
  hp,
  color,
}: {
  side: "left" | "right";
  label: string;
  hp: number;
  color: string;
}) => {
  const isLeft = side === "left";
  return (
    <div
      className={`absolute top-3 ${isLeft ? "left-3" : "right-3"} z-20 flex flex-col gap-1 ${
        isLeft ? "items-start" : "items-end"
      }`}
    >
      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-white/80 drop-shadow">
        {label}
      </span>
      <div className="h-1.5 w-28 sm:w-40 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}` }}
          initial={false}
          animate={{ width: `${hp}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// ─── Damage Number ──────────────────────────────────────────────────
const DamageNumber = ({
  side,
  value,
  color,
}: {
  side: "left" | "right";
  value: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.7 }}
    animate={{ opacity: [0, 1, 1, 0], y: [-5, -45], scale: [0.8, 1.4, 1.2] }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.7 }}
    className={`pointer-events-none absolute top-[28%] ${
      side === "left" ? "left-[18%]" : "right-[18%]"
    } z-30 text-2xl sm:text-3xl font-black`}
    style={{ color, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
  >
    {value}
  </motion.div>
);

// ─── Reading Ticker ──────────────────────────────────────────────────
const ReadingTicker = ({
  words,
  active,
  phase,
  compact,
  resetKey,
}: {
  words: string[];
  active: boolean;
  phase: Phase;
  compact: boolean;
  resetKey: string;
}) => {
  // Word index that's currently being read; -1 when not reading; words.length when all done
  const [readIdx, setReadIdx] = useState(0);

  useEffect(() => {
    if (!active) return;
    setReadIdx(0);
    const perWord = 750;
    const timers = words.map((_, i) =>
      setTimeout(() => setReadIdx(i + 1), (i + 1) * perWord)
    );
    return () => timers.forEach(clearTimeout);
  }, [active, words, resetKey]);

  // After reading phase, keep all green until reset
  const allRead = !active && (phase === "heroWindup" || phase === "heroAttack" || phase === "enemyHit");

  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${
        compact ? "top-[14%]" : "top-[18%]"
      } flex items-center gap-2 sm:gap-3 rounded-2xl bg-black/35 px-3 py-2 backdrop-blur-md ring-1 ring-white/10`}
    >
      {words.map((w, i) => {
        const isRead = allRead || i < readIdx;
        const isActive = active && i === readIdx;
        return (
          <motion.div
            key={`${resetKey}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={
              isActive
                ? { opacity: 1, y: 0, scale: [1, 1.08, 1] }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ delay: i * 0.12, duration: 0.5 }}
            className={`relative flex items-center gap-1 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-sm sm:text-lg font-bold transition-colors duration-300 ${
              isRead
                ? "bg-emerald-500/90 text-white"
                : isActive
                ? "bg-yellow-300/95 text-slate-900 ring-2 ring-yellow-200"
                : "bg-white/15 text-white/70"
            }`}
          >
            <span>{w}</span>
            {isRead && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} />}
          </motion.div>
        );
      })}
    </div>
  );
};
