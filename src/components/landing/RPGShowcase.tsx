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
import { BookOpen, Check, Sparkles, TrendingUp } from "lucide-react";

interface RPGShowcaseProps {
  variant?: "hero" | "compact";
  className?: string;
  paused?: boolean;
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
  reading: 3400,
  heroWindup: 320,
  heroAttack: 950,
  enemyHit: 650,
  rest: 500,
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

interface StoryConfig {
  key: EnemyKey;
  title: string;
  chapter: string;
  sentence: string[];
  powerWordIdx: number;
  miscueIdx: number;
  attack: ParentAttackKind;
  label: string;
  phonemes: { p: string; acc: number }[];
}

const STORIES: StoryConfig[] = [
  {
    key: "goblin",
    title: "The Goblin's Cave",
    chapter: "Ch. 2",
    sentence: ["Mira", "raised", "her", "staff", "and", "whispered", "blast"],
    powerWordIdx: 6,
    miscueIdx: 5,
    attack: "fireball",
    label: "Goblin Guard",
    phonemes: [{ p: "/bl/", acc: 92 }, { p: "/sh/", acc: 88 }],
  },
  {
    key: "wraith",
    title: "Whispers in the Dark",
    chapter: "Ch. 1",
    sentence: ["One", "word", "could", "banish", "the", "shadow"],
    powerWordIdx: 3,
    miscueIdx: 4,
    attack: "lightning",
    label: "Shadow Wraith",
    phonemes: [{ p: "/sh/", acc: 90 }, { p: "/th/", acc: 86 }],
  },
  {
    key: "dragon",
    title: "The Dragon's Bargain",
    chapter: "Ch. 3",
    sentence: ["She", "had", "to", "tame", "the", "dragon"],
    powerWordIdx: 3,
    miscueIdx: 5,
    attack: "fireball",
    label: "Drake",
    phonemes: [{ p: "/dr/", acc: 91 }, { p: "/ay/", acc: 94 }],
  },
  {
    key: "golem",
    title: "Frozen Halls",
    chapter: "Ch. 4",
    sentence: ["One", "sharp", "spell", "could", "shatter", "the", "golem"],
    powerWordIdx: 4,
    miscueIdx: 1,
    attack: "ice_blast",
    label: "Ice Golem",
    phonemes: [{ p: "/sh/", acc: 89 }, { p: "/sp/", acc: 93 }],
  },
];

const HERO_ATTACK: ParentAttackKind = "fireball";

export const RPGShowcase = ({ variant = "hero", className = "", paused = false }: RPGShowcaseProps) => {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("reading");
  const [fireKey, setFireKey] = useState(0);
  const [storyIdx, setStoryIdx] = useState(0);
  const [heroHp, setHeroHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const story = STORIES[storyIdx % STORIES.length];
  const compact = variant === "compact";
  const charSize: "small" | "medium" | "large" = compact ? "small" : "medium";

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !visible || paused) return;
    const t = setTimeout(() => {
      const next = NEXT[phase];
      if (next === "heroAttack" || next === "enemyAttack") {
        setFireKey((k) => k + 1);
      }
      if (next === "enemyHit") {
        setEnemyHp((hp) => Math.max(8, hp - (38 + Math.floor(Math.random() * 12))));
      }
      if (next === "heroHit") {
        setHeroHp((hp) => Math.max(8, hp - (28 + Math.floor(Math.random() * 12))));
      }
      if (next === "reset") {
        setTimeout(() => {
          setHeroHp(100);
          setEnemyHp(100);
          setStoryIdx((i) => (i + 1) % STORIES.length);
        }, 250);
      }
      setPhase(next);
    }, TIMINGS[phase]);
    return () => clearTimeout(t);
  }, [phase, reduce, visible, paused]);

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
    ? story.attack
    : null;
  const attackDirection = heroAttacking ? "leftToRight" : "rightToLeft";

  const stageShake =
    phase === "enemyHit" || phase === "heroHit"
      ? { x: [0, -6, 5, -3, 0], y: [0, 2, -2, 1, 0] }
      : { x: 0, y: 0 };

  // Compact path keeps the simpler, smaller layout used inside game pages
  if (compact) {
    return (
      <CompactShowcase
        story={story}
        phase={phase}
        heroState={heroState}
        enemyState={enemyState}
        heroHp={heroHp}
        enemyHp={enemyHp}
        attackKind={attackKind}
        attackDirection={attackDirection}
        fireKey={fireKey}
        stageShake={stageShake}
        charSize={charSize}
        containerRef={containerRef}
        className={className}
        reduce={!!reduce}
      />
    );
  }

  // ─── HERO VARIANT — single-viewport epic showcase ─────────────────
  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_100px_-30px_hsl(270_80%_30%/0.7)] ${className}`}
      style={{
        height: "min(620px, 78vh)",
        background:
          "radial-gradient(120% 80% at 50% 100%, hsl(280 70% 28% / 0.55), hsl(240 50% 8% / 0.4) 60%, hsl(270 45% 6%) 100%)",
      }}
      aria-label="Live story-driven battle preview"
    >
      <div className="flex h-full flex-col">
        {/* HEADER — HP bars + reading-now chip */}
        <div className="relative flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3 border-b border-white/5">
          <HPBar side="left" label="Hero" hp={heroHp} color="hsl(140 70% 50%)" />
          <NowReadingChip title={story.title} chapter={story.chapter} storyKey={story.key} />
          <HPBar side="right" label={story.label} hp={enemyHp} color="hsl(0 75% 58%)" />
        </div>

        {/* STAGE */}
        <motion.div
          className="relative flex-1 overflow-hidden"
          animate={stageShake}
          transition={{ duration: 0.4 }}
        >
          {/* arena floor glow */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
            style={{
              background:
                "radial-gradient(60% 90% at 50% 100%, hsl(48 100% 60% / 0.16), transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(to top, hsl(280 80% 60% / 0.4), transparent), repeating-linear-gradient(90deg, transparent 0 40px, hsl(280 100% 80% / 0.15) 40px 41px)",
              maskImage: "linear-gradient(to top, black, transparent)",
              WebkitMaskImage: "linear-gradient(to top, black, transparent)",
            }}
          />

          {/* Story panel — center top */}
          <StoryPanel story={story} active={phase === "reading"} phase={phase} />

          {/* Hero (left) */}
          <div className="absolute bottom-3 left-[5%] sm:left-[9%]">
            <SirValor
              state={heroState}
              healthPercent={heroHp}
              size={charSize}
              showHealthBar={false}
              skinVariant="default"
            />
          </div>

          {/* Enemy (right) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={story.key}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute bottom-3 right-[5%] sm:right-[9%]"
            >
              {story.key === "goblin" && (
                <GoblinGuard state={enemyState} healthPercent={enemyHp} size={charSize} flipX showHealthBar={false} />
              )}
              {story.key === "wraith" && (
                <ShadowWraith state={enemyState} healthPercent={enemyHp} size={charSize} flipX />
              )}
              {story.key === "dragon" && (
                <DrakeTheDragon state={enemyState} healthPercent={enemyHp} size={charSize} flipX />
              )}
              {story.key === "golem" && (
                <IceGolem state={enemyState} healthPercent={enemyHp} size={charSize} flipX />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Damage numbers */}
          <AnimatePresence>
            {phase === "enemyHit" && (
              <DamageNumber side="right" key={`dmg-e-${fireKey}`} value="-42" color="#fef08a" />
            )}
            {phase === "heroHit" && (
              <DamageNumber side="left" key={`dmg-h-${fireKey}`} value="-32" color="#fca5a5" />
            )}
          </AnimatePresence>

          <RPGParentAttackVFX
            kind={attackKind}
            fireKey={fireKey}
            direction={attackDirection}
            contained
          />
        </motion.div>

        {/* METRICS RAIL */}
        <MetricsRail story={story} phase={phase} paused={paused} />
      </div>

      {reduce && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full bg-emerald-500/90 px-4 py-2 text-sm font-bold text-white shadow-lg">
            Read · Track · Win
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Now Reading Chip ────────────────────────────────────────────────
const NowReadingChip = ({
  title,
  chapter,
  storyKey,
}: {
  title: string;
  chapter: string;
  storyKey: string;
}) => (
  <div className="relative flex-1 flex justify-center min-w-0">
    <AnimatePresence mode="wait">
      <motion.div
        key={storyKey}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-md max-w-full"
      >
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_hsl(140_70%_50%)] animate-pulse" />
        <BookOpen className="h-3.5 w-3.5 text-white/70 shrink-0" />
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
          Now Reading
        </span>
        <span className="text-[11px] sm:text-sm font-bold text-white truncate">
          {title}
        </span>
        <span className="hidden sm:inline text-[11px] font-medium text-white/50">{chapter}</span>
      </motion.div>
    </AnimatePresence>
  </div>
);

// ─── Story Panel ─────────────────────────────────────────────────────
const StoryPanel = ({
  story,
  active,
  phase,
}: {
  story: StoryConfig;
  active: boolean;
  phase: Phase;
}) => {
  const [readIdx, setReadIdx] = useState(0);

  useEffect(() => {
    if (!active) return;
    setReadIdx(0);
    const perWord = Math.floor(TIMINGS.reading / (story.sentence.length + 1));
    const timers = story.sentence.map((_, i) =>
      setTimeout(() => setReadIdx(i + 1), (i + 1) * perWord)
    );
    return () => timers.forEach(clearTimeout);
  }, [active, story]);

  const allRead =
    !active && (phase === "heroWindup" || phase === "heroAttack" || phase === "enemyHit");

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 w-[min(480px,86%)]">
      <motion.div
        key={story.key}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-black/45 px-4 py-3 backdrop-blur-md ring-1 ring-white/10 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6)]"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1.5 text-center leading-relaxed">
          {story.sentence.map((w, i) => {
            const isPower = i === story.powerWordIdx;
            const isMiscue = i === story.miscueIdx;
            const isRead = allRead || i < readIdx;
            const isActive = active && i === readIdx;

            const base =
              "relative inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm sm:text-[15px] font-semibold transition-colors duration-300";

            let cls = "text-white/55";
            if (isPower && (isRead || isActive)) {
              cls =
                "text-amber-200 bg-amber-400/15 ring-1 ring-amber-300/40 shadow-[0_0_18px_hsl(48_100%_60%/0.5)]";
            } else if (isRead) {
              cls = isMiscue
                ? "text-amber-300 bg-amber-500/15 ring-1 ring-amber-400/30"
                : "text-emerald-300";
            } else if (isActive) {
              cls = "text-yellow-200 bg-yellow-300/10 ring-1 ring-yellow-300/40";
            }

            return (
              <motion.span
                key={`${story.key}-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={
                  isActive
                    ? { opacity: 1, y: 0, scale: [1, 1.06, 1] }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`${base} ${cls}`}
              >
                {isPower && (isRead || isActive) && (
                  <Sparkles className="h-3 w-3 text-amber-200" />
                )}
                <span>{w}</span>
                {isRead && !isPower && !isMiscue && (
                  <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
                )}
              </motion.span>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Metrics Rail ────────────────────────────────────────────────────
const MetricsRail = ({ story, phase, paused = false }: { story: StoryConfig; phase: Phase; paused?: boolean }) => {
  const [wpm, setWpm] = useState(98);
  const [accuracy, setAccuracy] = useState(96);

  useEffect(() => {
    if (paused) return;
    if (phase === "reading") {
      // Climb WPM during reading
      const start = Date.now();
      const id = setInterval(() => {
        const t = Math.min(1, (Date.now() - start) / TIMINGS.reading);
        setWpm(Math.round(98 + 24 * t + (Math.random() - 0.5) * 3));
        // Slight accuracy dip mid-read for the miscue
        if (t > 0.55 && t < 0.7) setAccuracy(94);
        else setAccuracy(96 + Math.round((Math.random() - 0.5)));
      }, 200);
      return () => clearInterval(id);
    }
    if (phase === "reset") {
      setWpm(98);
      setAccuracy(96);
    }
  }, [phase, story.key]);

  const wcpm = Math.max(0, Math.round(wpm * (accuracy / 100)));
  const phonemeAvg = Math.round(
    story.phonemes.reduce((a, b) => a + b.acc, 0) / story.phonemes.length
  );
  const fluency = accuracy >= 96 ? "A" : accuracy >= 93 ? "A-" : "B+";

  return (
    <div className="border-t border-white/5 bg-black/40 backdrop-blur-md px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <MetricCard label="WPM" value={wpm} live />
        <MetricCard label="WCPM" value={wcpm} live />
        <MetricCard
          label="Accuracy"
          value={`${accuracy}%`}
          bar={accuracy}
          tone={accuracy < 95 ? "warn" : "ok"}
        />
        <PhonemeCard phonemes={story.phonemes} avg={phonemeAvg} />
        <MetricCard label="Fluency" value={fluency} sub="prosody ✓" tone="gold" />
      </div>
      <div className="mt-1.5 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-white/45 font-medium">
        Read Words, Launch Powers, Every Metric Tracked.
      </div>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  sub,
  bar,
  live,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  bar?: number;
  live?: boolean;
  tone?: "default" | "ok" | "warn" | "gold";
}) => {
  const toneColor =
    tone === "gold"
      ? "text-amber-300"
      : tone === "warn"
      ? "text-amber-300"
      : tone === "ok"
      ? "text-emerald-300"
      : "text-white";
  const showOnMobile = label !== "WCPM" && label !== "Accuracy";
  return (
    <div
      className={`flex-1 min-w-0 rounded-xl bg-white/5 ring-1 ring-white/10 px-2 py-1.5 sm:px-3 sm:py-2 ${
        showOnMobile ? "" : "hidden sm:block"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/55">
          {label}
        </span>
        {live && (
          <span className="flex items-center gap-0.5 text-[9px] text-emerald-400">
            <TrendingUp className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
      <div className={`text-base sm:text-xl font-black tabular-nums ${toneColor}`}>
        {value}
      </div>
      {bar !== undefined && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/40">
          <motion.div
            className={`h-full rounded-full ${
              tone === "warn" ? "bg-amber-400" : "bg-emerald-400"
            }`}
            animate={{ width: `${bar}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}
      {sub && (
        <div className="text-[9px] sm:text-[10px] text-white/45 mt-0.5 truncate">{sub}</div>
      )}
    </div>
  );
};

const PhonemeCard = ({
  phonemes,
  avg,
}: {
  phonemes: { p: string; acc: number }[];
  avg: number;
}) => (
  <div className="hidden md:block flex-1 min-w-0 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2">
    <div className="flex items-center justify-between gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">
        Phonemes
      </span>
      <span className="text-[10px] text-emerald-400">{avg}%</span>
    </div>
    <div className="mt-1 flex flex-wrap gap-1">
      {phonemes.map((ph) => (
        <span
          key={ph.p}
          className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-200 ring-1 ring-emerald-400/20"
        >
          {ph.p} {ph.acc}
        </span>
      ))}
    </div>
  </div>
);

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
      className={`flex flex-col gap-1 shrink-0 ${
        isLeft ? "items-start" : "items-end"
      }`}
    >
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/75">
        {label}
      </span>
      <div className="h-1.5 w-20 sm:w-32 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
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
    className={`pointer-events-none absolute top-[40%] ${
      side === "left" ? "left-[16%]" : "right-[16%]"
    } z-30 text-2xl sm:text-3xl font-black`}
    style={{ color, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
  >
    {value}
  </motion.div>
);

// ─── Compact variant (unchanged behavior, used inside game pages) ────
interface CompactProps {
  story: StoryConfig;
  phase: Phase;
  heroState: "idle" | "attacking" | "hit";
  enemyState: "idle" | "attacking" | "hit";
  heroHp: number;
  enemyHp: number;
  attackKind: ParentAttackKind | null;
  attackDirection: "leftToRight" | "rightToLeft";
  fireKey: number;
  stageShake: { x: number | number[]; y: number | number[] };
  charSize: "small" | "medium" | "large";
  containerRef: React.RefObject<HTMLDivElement>;
  className: string;
  reduce: boolean;
}

const CompactShowcase = ({
  story,
  phase,
  heroState,
  enemyState,
  heroHp,
  enemyHp,
  attackKind,
  attackDirection,
  fireKey,
  stageShake,
  charSize,
  containerRef,
  className,
  reduce,
}: CompactProps) => {
  const compactWords = useMemo(
    () => story.sentence.slice(story.powerWordIdx, story.powerWordIdx + 2),
    [story]
  );
  const [readIdx, setReadIdx] = useState(0);

  useEffect(() => {
    if (phase !== "reading") return;
    setReadIdx(0);
    const timers = compactWords.map((_, i) =>
      setTimeout(() => setReadIdx(i + 1), (i + 1) * 750)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, compactWords]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl h-[220px] sm:h-[260px] ${className}`}
      style={{
        background:
          "radial-gradient(120% 80% at 50% 100%, hsl(280 70% 28% / 0.55), hsl(240 50% 8% / 0.3) 60%, transparent 100%)",
      }}
    >
      <motion.div className="absolute inset-0" animate={stageShake} transition={{ duration: 0.4 }}>
        <div className="absolute top-1/2 -translate-y-1/2 left-[6%]">
          <SirValor
            state={heroState}
            healthPercent={heroHp}
            size={charSize}
            showHealthBar={false}
            skinVariant="default"
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={story.key}
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ duration: 0.45 }}
            className="absolute top-1/2 -translate-y-1/2 right-[6%]"
          >
            {story.key === "goblin" && (
              <GoblinGuard state={enemyState} healthPercent={enemyHp} size={charSize} flipX showHealthBar={false} />
            )}
            {story.key === "wraith" && <ShadowWraith state={enemyState} healthPercent={enemyHp} size={charSize} flipX />}
            {story.key === "dragon" && <DrakeTheDragon state={enemyState} healthPercent={enemyHp} size={charSize} flipX />}
            {story.key === "golem" && <IceGolem state={enemyState} healthPercent={enemyHp} size={charSize} flipX />}
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute left-1/2 top-[14%] -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-black/35 px-3 py-2 backdrop-blur-md ring-1 ring-white/10">
          {compactWords.map((w, i) => {
            const isRead = i < readIdx;
            return (
              <span
                key={i}
                className={`rounded-xl px-2.5 py-1 text-sm font-bold ${
                  isRead ? "bg-emerald-500/90 text-white" : "bg-white/15 text-white/70"
                }`}
              >
                {w}
              </span>
            );
          })}
        </div>
      </motion.div>
      <RPGParentAttackVFX kind={attackKind} fireKey={fireKey} direction={attackDirection} contained />
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
