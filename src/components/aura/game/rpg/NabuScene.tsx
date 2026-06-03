// Real SVG scenes for Pre-K Nabu adventures.
// Each scene renders a believable environment for the obstacle (river, gate,
// tree, dark night, etc.), animates Nabu reacting on the left, and on
// "solved"/"transition" reveals the SOLUTION inside the world and walks Nabu
// across/through/onto it. No emojis are used inside the stage.
//
// Phase contract:
//   - "problem" | "ask" | "reading": obstacle visible, Nabu reacts on the left
//   - "solved": solution appears and interacts with the obstacle
//   - "transition": Nabu walks/uses the solution and exits to the right
//
// Words without a custom scene fall back to a generic illustrated card.

import { motion } from "framer-motion";
import { NabuOwl } from "./NabuOwl";

type ScenePhase = "problem" | "ask" | "reading" | "solved" | "transition";

interface NabuSceneProps {
  word: string;
  phase: ScenePhase;
  index: number; // forces remount per obstacle
}

// Stage uses a 1000×500 SVG viewBox; ground line at y=380.
const VB_W = 1000;
const VB_H = 500;
const GROUND_Y = 380;

// ── Nabu positions through the scene ──────────────────────────────────────
const NABU_START = { x: 140, y: GROUND_Y - 10 };
const NABU_EXIT = { x: 860, y: GROUND_Y - 10 };


const nabuAnim = (phase: ScenePhase) => {
  if (phase === "transition") {
    return { x: NABU_EXIT.x, y: NABU_EXIT.y, transition: { duration: 1.6, ease: "easeInOut" as const } };
  }
  if (phase === "solved") {
    return {
      x: NABU_START.x,
      y: [NABU_START.y, NABU_START.y - 22, NABU_START.y, NABU_START.y - 14, NABU_START.y],
      transition: { duration: 1.4 },
    };
  }
  if (phase === "problem") {
    return {
      x: [NABU_START.x, NABU_START.x - 8, NABU_START.x],
      y: NABU_START.y,
      transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" as const },
    };
  }
  return {
    x: NABU_START.x,
    y: [NABU_START.y, NABU_START.y - 5, NABU_START.y],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
  };
};

// ── Scene-specific Nabu motion helpers ─────────────────────────────────────
// All return a framer-motion `animate` object for the <motion.g> wrapper.

// High-bouncing walk across — for muddy / squishy ground (BOOTS).
const bouncyWalkAnim = (phase: ScenePhase): NabuAnim => {
  if (phase === "transition") {
    return {
      x: [140, 280, 420, 560, 700, 860],
      y: [370, 330, 370, 330, 370, 370],
      transition: { duration: 1.9, ease: "easeInOut", times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    };
  }
  return nabuAnim(phase);
};

// Hop over an obstacle centered at obstacleX, then continue to NABU_EXIT.
const hopOverAnim = (obstacleX: number) => (phase: ScenePhase): NabuAnim => {
  if (phase === "transition") {
    return {
      x: [140, obstacleX - 80, obstacleX, obstacleX + 80, 860],
      y: [370, 370, 280, 370, 370],
      transition: { duration: 1.9, ease: "easeInOut", times: [0, 0.3, 0.5, 0.7, 1] },
    };
  }
  return nabuAnim(phase);
};

// Walk forward and stop at a target (use for arriving at nest, bed, tent, etc.).
const walkToAnim = (targetX: number, targetY: number = GROUND_Y - 10) =>
  (phase: ScenePhase): NabuAnim => {
    if (phase === "transition") {
      return {
        x: targetX,
        y: targetY,
        transition: { duration: 1.4, ease: "easeInOut" },
      };
    }
    return nabuAnim(phase);
  };


// Loose type — framer-motion accepts many shapes here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NabuAnim = any;


const NabuSprite = ({
  phase,
  size = 110,
  anim,
  mood: moodOverride,
}: {
  phase: ScenePhase;
  size?: number;
  anim?: (phase: ScenePhase) => NabuAnim;
  mood?: "happy" | "curious" | "cheer";
}) => {
  const mood =
    moodOverride ??
    (phase === "problem" ? "curious" : phase === "solved" || phase === "transition" ? "cheer" : "happy");
  return (
    <motion.g initial={{ x: NABU_START.x, y: NABU_START.y }} animate={anim ? anim(phase) : nabuAnim(phase)}>
      <foreignObject x={-size / 2} y={-size} width={size} height={size}>
        <NabuOwl size={size} mood={mood} />
      </foreignObject>
    </motion.g>
  );
};


// ── Common reusable SVG bits ──────────────────────────────────────────────
const Clouds = ({ tint = "#ffffff" }: { tint?: string }) => (
  <>
    <ellipse cx="180" cy="80" rx="60" ry="18" fill={tint} opacity="0.75" />
    <ellipse cx="220" cy="70" rx="40" ry="14" fill={tint} opacity="0.85" />
    <ellipse cx="780" cy="60" rx="70" ry="20" fill={tint} opacity="0.7" />
    <ellipse cx="820" cy="50" rx="44" ry="14" fill={tint} opacity="0.85" />
  </>
);

const Grass = ({ from = "#86efac", to = "#16a34a" }: { from?: string; to?: string }) => (
  <>
    <defs>
      <linearGradient id="grass-grad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={from} />
        <stop offset="100%" stopColor={to} />
      </linearGradient>
    </defs>
    <rect x="0" y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill="url(#grass-grad)" />
    {/* tufts */}
    {Array.from({ length: 14 }).map((_, i) => (
      <path
        key={i}
        d={`M${50 + i * 70} ${GROUND_Y + 4} q5 -10 10 0 q5 -10 10 0`}
        stroke="#15803d"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
    ))}
  </>
);

const Sky = ({ from, to }: { from: string; to: string }) => (
  <>
    <defs>
      <linearGradient id="sky-grad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={from} />
        <stop offset="100%" stopColor={to} />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width={VB_W} height={GROUND_Y} fill="url(#sky-grad)" />
  </>
);

const Stage = ({ children }: { children: React.ReactNode }) => (
  <svg
    viewBox={`0 0 ${VB_W} ${VB_H}`}
    preserveAspectRatio="xMidYMid slice"
    className="absolute inset-0 h-full w-full"
  >
    {children}
  </svg>
);

// ──────────────────────────────────────────────────────────────────────────
// SCENES
// ──────────────────────────────────────────────────────────────────────────

// ── BRIDGE: river across the path, bridge appears, Nabu walks across ─────
// ── BRIDGE: river across the path, bridge appears, Nabu walks across ─────
const bridgeArcAnim = (phase: ScenePhase): NabuAnim => {
  if (phase === "transition") {
    return {
      x: [140, 340, 500, 660, 860],
      y: [370, 370, 290, 370, 370],
      transition: { duration: 1.8, ease: "easeInOut", times: [0, 0.18, 0.5, 0.82, 1] },
    };
  }

  return nabuAnim(phase);
};

const BridgeScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#bae6fd" to="#a7f3d0" />
      <Clouds />
      <Grass />
      {/* far hills */}
      <ellipse cx="850" cy={GROUND_Y + 10} rx="220" ry="60" fill="#4ade80" opacity="0.6" />
      <ellipse cx="950" cy={GROUND_Y + 20} rx="180" ry="50" fill="#22c55e" opacity="0.5" />
      {/* river — cuts through ground */}
      <path d={`M380 ${GROUND_Y} L620 ${GROUND_Y} L640 ${VB_H} L360 ${VB_H} Z`} fill="#3b82f6" />
      <path d={`M380 ${GROUND_Y} L620 ${GROUND_Y} L630 ${GROUND_Y + 20} L370 ${GROUND_Y + 20} Z`} fill="#60a5fa" />
      {/* shimmer */}
      <motion.path
        d={`M395 ${GROUND_Y + 35} q40 -8 80 0 q40 8 80 0 q40 -8 70 0`}
        stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.6"
        animate={{ x: [-4, 4, -4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* bridge */}
      <motion.g
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: solved ? 1 : 0, y: solved ? 0 : -40 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
      >
        <path d={`M340 ${GROUND_Y - 20} Q500 ${GROUND_Y - 90} 660 ${GROUND_Y - 20}`} stroke="#92400e" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d={`M340 ${GROUND_Y - 4} Q500 ${GROUND_Y - 74} 660 ${GROUND_Y - 4}`} stroke="#b45309" strokeWidth="10" fill="none" strokeLinecap="round" />

        {/* planks */}
        {Array.from({ length: 9 }).map((_, i) => {
          const t = i / 8;
          const x = 340 + t * 320;
          const y = GROUND_Y - 20 - Math.sin(t * Math.PI) * 70 + Math.abs(Math.sin(t * Math.PI)) * 0;
          return <rect key={i} x={x - 14} y={y - 6} width="28" height="6" rx="2" fill="#78350f" />;
        })}
        {/* posts */}
        <rect x="334" y={GROUND_Y - 50} width="6" height="40" fill="#78350f" />
        <rect x="660" y={GROUND_Y - 50} width="6" height="40" fill="#78350f" />
      </motion.g>

      <NabuSprite phase={phase} anim={bridgeArcAnim} />

    </Stage>
  );
};

// ── BOOTS: muddy ground, boots appear on Nabu, walks through ─────────────
const BootsScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#cbd5e1" to="#fde68a" />
      <Clouds tint="#f1f5f9" />
      {/* mud ground */}
      <rect x="0" y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill="#78350f" />
      <rect x="0" y={GROUND_Y} width={VB_W} height="10" fill="#92400e" />
      {/* mud puddles */}
      {[260, 480, 700].map((cx, i) => (
        <ellipse key={i} cx={cx} cy={GROUND_Y + 30} rx="80" ry="14" fill="#451a03" opacity="0.7" />
      ))}
      {/* splashes */}
      {solved && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {[300, 520, 740].map((cx, i) => (
            <motion.g key={i} animate={{ y: [-4, -10, -4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}>
              <circle cx={cx - 14} cy={GROUND_Y + 4} r="4" fill="#7dd3fc" />
              <circle cx={cx + 14} cy={GROUND_Y + 4} r="4" fill="#7dd3fc" />
              <circle cx={cx} cy={GROUND_Y - 6} r="5" fill="#bae6fd" />
            </motion.g>
          ))}
        </motion.g>
      )}
      <NabuSprite phase={phase} anim={bouncyWalkAnim} />

      {/* boots on Nabu (follow nabu position) */}
      {solved && (
        <motion.g
          initial={{ x: NABU_START.x, y: NABU_START.y, opacity: 0 }}
          animate={{
            x: phase === "transition" ? NABU_EXIT.x : NABU_START.x,
            y: phase === "transition" ? NABU_EXIT.y : NABU_START.y,
            opacity: 1,
          }}
          transition={{ duration: phase === "transition" ? 1.6 : 0.4, ease: "easeInOut" }}
        >
          <g transform="translate(-22,-2)">
            <rect x="0" y="0" width="18" height="22" rx="3" fill="#dc2626" />
            <rect x="-4" y="18" width="26" height="8" rx="2" fill="#991b1b" />
          </g>
          <g transform="translate(4,-2)">
            <rect x="0" y="0" width="18" height="22" rx="3" fill="#dc2626" />
            <rect x="-4" y="18" width="26" height="8" rx="2" fill="#991b1b" />
          </g>
        </motion.g>
      )}
    </Stage>
  );
};

// ── KEY: locked gate, key appears, gate opens, Nabu walks through ────────
const KeyScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#fde68a" to="#fcd34d" />
      <Clouds />
      <Grass from="#bbf7d0" to="#16a34a" />
      {/* stone wall */}
      <rect x="380" y={GROUND_Y - 180} width="40" height="180" fill="#78716c" />
      <rect x="580" y={GROUND_Y - 180} width="40" height="180" fill="#78716c" />
      {/* bricks */}
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <g key={row}>
          <rect x="380" y={GROUND_Y - 180 + row * 30} width="40" height="2" fill="#44403c" />
          <rect x="580" y={GROUND_Y - 180 + row * 30} width="40" height="2" fill="#44403c" />
        </g>
      ))}
      {/* gate (closed = vertical bars, open = swung) */}
      <motion.g
        style={{ originX: 420, originY: GROUND_Y }}
        animate={{ rotateY: solved ? 70 : 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <rect x="420" y={GROUND_Y - 170} width="160" height="170" fill="#92400e" opacity="0.95" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={430 + i * 36} y={GROUND_Y - 160} width="10" height="150" fill="#78350f" />
        ))}
        <rect x="420" y={GROUND_Y - 100} width="160" height="10" fill="#78350f" />
        {/* lock */}
        <circle cx="500" cy={GROUND_Y - 95} r="14" fill={solved ? "#22c55e" : "#facc15"} stroke="#78350f" strokeWidth="3" />
        <rect x="496" y={GROUND_Y - 92} width="8" height="10" fill="#78350f" />
      </motion.g>
      {/* key flying to lock */}
      {phase === "solved" && (
        <motion.g
          initial={{ x: 200, y: GROUND_Y - 200, rotate: -20, opacity: 0 }}
          animate={{ x: 500, y: GROUND_Y - 95, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <circle cx="0" cy="0" r="10" fill="none" stroke="#eab308" strokeWidth="4" />
          <rect x="6" y="-3" width="22" height="6" fill="#eab308" />
          <rect x="22" y="3" width="3" height="6" fill="#eab308" />
          <rect x="26" y="3" width="3" height="6" fill="#eab308" />
        </motion.g>
      )}
      <NabuSprite phase={phase} anim={walkToAnim(860)} />

    </Stage>
  );
};

// ── AXE: tree blocking the path, axe chops, tree falls, Nabu walks ────────
const AxeScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#bef264" to="#86efac" />
      <Clouds />
      <Grass />
      {/* fallen log on solved, standing tree on problem */}
      <motion.g
        style={{ originX: 500, originY: GROUND_Y }}
        animate={{ rotate: solved ? -78 : 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <rect x="490" y={GROUND_Y - 200} width="22" height="200" fill="#78350f" />
        <ellipse cx="500" cy={GROUND_Y - 220} rx="80" ry="60" fill="#15803d" />
        <ellipse cx="460" cy={GROUND_Y - 250} rx="60" ry="44" fill="#16a34a" />
        <ellipse cx="540" cy={GROUND_Y - 250} rx="60" ry="44" fill="#16a34a" />
      </motion.g>
      {/* axe swinging */}
      {phase === "solved" && (
        <motion.g
          initial={{ x: 380, y: GROUND_Y - 120, rotate: -40 }}
          animate={{ x: 470, y: GROUND_Y - 90, rotate: 30 }}
          transition={{ duration: 0.5, repeat: 1, repeatType: "reverse" }}
        >
          <rect x="0" y="0" width="6" height="60" fill="#78350f" />
          <path d="M-14 -4 L18 -4 L24 12 L-8 12 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
        </motion.g>
      )}
      <NabuSprite phase={phase} anim={hopOverAnim(500)} />

    </Stage>
  );
};

// ── BONE: puppy in the way, bone tossed, puppy chases bone ───────────────
const BoneScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#fbcfe8" to="#fde68a" />
      <Clouds />
      <Grass />
      {/* puppy */}
      <motion.g
        animate={solved ? { x: 700, y: 0 } : { x: 0, y: 0 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <g transform={`translate(500 ${GROUND_Y - 60})`}>
          <ellipse cx="0" cy="20" rx="60" ry="28" fill="#a16207" />
          <circle cx="-50" cy="0" r="26" fill="#a16207" />
          <ellipse cx="-62" cy="-14" rx="8" ry="14" fill="#78350f" />
          <ellipse cx="-38" cy="-14" rx="8" ry="14" fill="#78350f" />
          <circle cx="-58" cy="2" r="3" fill="#1a1a1a" />
          <circle cx="-46" cy="2" r="3" fill="#1a1a1a" />
          <ellipse cx="-52" cy="10" rx="4" ry="3" fill="#1a1a1a" />
          {/* tail */}
          <motion.path
            d="M55 10 q20 -10 22 -28"
            stroke="#a16207"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            animate={{ rotate: solved ? [0, 30, -10, 30, 0] : [0, 10, -10, 0] }}
            style={{ originX: 55, originY: 10 }}
            transition={{ duration: solved ? 0.4 : 1.5, repeat: Infinity }}
          />
          {/* legs */}
          <rect x="-30" y="40" width="10" height="20" fill="#78350f" />
          <rect x="20" y="40" width="10" height="20" fill="#78350f" />
        </g>
      </motion.g>
      {/* bone */}
      {phase === "solved" && (
        <motion.g
          initial={{ x: 200, y: GROUND_Y - 200, opacity: 0 }}
          animate={{ x: 720, y: GROUND_Y - 40, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <rect x="-22" y="-4" width="44" height="8" rx="4" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5" />
          <circle cx="-22" cy="-4" r="6" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5" />
          <circle cx="-22" cy="4" r="6" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5" />
          <circle cx="22" cy="-4" r="6" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5" />
          <circle cx="22" cy="4" r="6" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5" />
        </motion.g>
      )}
      <NabuSprite phase={phase} />
    </Stage>
  );
};

// ── LADDER: tall tree/cliff, ladder appears, Nabu climbs up ──────────────
const LadderScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#bae6fd" to="#a7f3d0" />
      <Clouds />
      <Grass />
      {/* big tree */}
      <rect x="620" y={GROUND_Y - 260} width="50" height="260" fill="#78350f" />
      <circle cx="645" cy={GROUND_Y - 270} r="100" fill="#16a34a" />
      <circle cx="585" cy={GROUND_Y - 240} r="60" fill="#15803d" />
      <circle cx="705" cy={GROUND_Y - 240} r="60" fill="#15803d" />
      {/* nest at top */}
      <ellipse cx="645" cy={GROUND_Y - 260} rx="34" ry="14" fill="#a16207" />
      {/* ladder */}
      <motion.g
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: solved ? 1 : 0, y: solved ? 0 : 60 }}
        transition={{ duration: 0.6 }}
      >
        <rect x="595" y={GROUND_Y - 250} width="6" height="250" fill="#b45309" />
        <rect x="625" y={GROUND_Y - 250} width="6" height="250" fill="#b45309" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="595" y={GROUND_Y - 30 - i * 30} width="36" height="5" fill="#92400e" />
        ))}
      </motion.g>
      {/* Nabu — special: climb up instead of walking right */}
      {phase === "transition" ? (
        <motion.g
          initial={{ x: NABU_START.x, y: NABU_START.y }}
          animate={{ x: 612, y: GROUND_Y - 260 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        >
          <foreignObject x={-55} y={-110} width={110} height={110}>
            <NabuOwl size={110} mood="cheer" />
          </foreignObject>
        </motion.g>
      ) : (
        <NabuSprite phase={phase} />
      )}
    </Stage>
  );
};

// ── UMBRELLA: rain falling, umbrella opens over Nabu ─────────────────────
const UmbrellaScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#64748b" to="#94a3b8" />
      {/* rain */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.line
          key={i}
          x1={(i * 27) % VB_W}
          x2={((i * 27) % VB_W) - 6}
          y1={(i * 13) % 350}
          y2={((i * 13) % 350) + 14}
          stroke="#bae6fd"
          strokeWidth="2"
          animate={{ y: [0, 400] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: (i % 10) * 0.08, ease: "linear" }}
        />
      ))}
      <Grass from="#4d7c0f" to="#365314" />
      <NabuSprite phase={phase} />
      {/* umbrella following Nabu */}
      {solved && (
        <motion.g
          initial={{ x: NABU_START.x, y: NABU_START.y - 100, opacity: 0 }}
          animate={{
            x: phase === "transition" ? NABU_EXIT.x : NABU_START.x,
            y: (phase === "transition" ? NABU_EXIT.y : NABU_START.y) - 100,
            opacity: 1,
          }}
          transition={{ duration: phase === "transition" ? 1.6 : 0.4, ease: "easeInOut" }}
        >
          <path d="M-60 0 Q0 -50 60 0 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
          <path d="M-60 0 Q-30 -10 0 0 Q30 -10 60 0" fill="none" stroke="#7f1d1d" strokeWidth="2" />
          <rect x="-2" y="0" width="4" height="80" fill="#78350f" />
          <path d="M-2 80 q0 10 10 6" stroke="#78350f" strokeWidth="4" fill="none" />
        </motion.g>
      )}
    </Stage>
  );
};

// ── SUN: dark village, sun rises ─────────────────────────────────────────
const SunScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <motion.rect
        x="0" y="0" width={VB_W} height={VB_H}
        animate={{ fill: solved ? "#fcd34d" : "#1e1b4b" }}
        transition={{ duration: 1.2 }}
      />
      {/* stars (visible when dark) */}
      {!solved && (
        <>
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={i} cx={(i * 71) % VB_W} cy={(i * 37) % 320} r="1.5" fill="#fef3c7" opacity="0.9" />
          ))}
        </>
      )}
      {/* sun rising */}
      <motion.g
        initial={{ y: 500 }}
        animate={{ y: solved ? 0 : 500 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      >
        <circle cx="500" cy="140" r="80" fill="#fde047" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const x1 = 500 + Math.cos(a) * 100;
          const y1 = 140 + Math.sin(a) * 100;
          const x2 = 500 + Math.cos(a) * 130;
          const y2 = 140 + Math.sin(a) * 130;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#facc15" strokeWidth="6" strokeLinecap="round" />;
        })}
      </motion.g>
      {/* village silhouette */}
      {[300, 460, 620, 780].map((x, i) => (
        <g key={i}>
          <rect x={x - 30} y={GROUND_Y - 80} width="60" height="80" fill={solved ? "#fbbf24" : "#312e81"} />
          <polygon points={`${x - 36},${GROUND_Y - 80} ${x},${GROUND_Y - 120} ${x + 36},${GROUND_Y - 80}`} fill={solved ? "#92400e" : "#1e1b4b"} />
          <rect x={x - 8} y={GROUND_Y - 50} width="16" height="30" fill={solved ? "#78350f" : "#0f172a"} />
        </g>
      ))}
      <rect x="0" y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill={solved ? "#65a30d" : "#1e293b"} />
      <NabuSprite phase={phase} />
    </Stage>
  );
};

// ── STAR / LAMP / TORCH / FIRE: dark, light source appears ───────────────
const LightScene = ({ phase, kind }: { phase: ScenePhase; kind: "STAR" | "LAMP" | "TORCH" | "FIRE" }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#1e1b4b" to="#312e81" />
      {/* dim stars */}
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={(i * 61) % VB_W} cy={(i * 29) % 320} r="1.5" fill="#fef3c7" opacity={solved ? 1 : 0.5} />
      ))}
      <rect x="0" y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill="#1f2937" />
      {/* glow */}
      {solved && (
        <motion.circle
          cx={NABU_START.x} cy={NABU_START.y - 30}
          r="200"
          fill="#fde047"
          opacity="0.25"
          initial={{ r: 0 }}
          animate={{ r: 220 }}
          transition={{ duration: 0.8 }}
        />
      )}
      <NabuSprite phase={phase} />
      {solved && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
        >
          {kind === "STAR" && (
            <g transform={`translate(500 ${GROUND_Y - 250})`}>
              <polygon points="0,-60 18,-18 60,-18 26,8 38,52 0,26 -38,52 -26,8 -60,-18 -18,-18" fill="#fde047" stroke="#facc15" strokeWidth="3" />
            </g>
          )}
          {kind === "LAMP" && (
            <g transform={`translate(${NABU_START.x + 60} ${NABU_START.y - 60})`}>
              <rect x="-4" y="-50" width="8" height="50" fill="#78350f" />
              <ellipse cx="0" cy="0" rx="34" ry="44" fill="#fde047" stroke="#dc2626" strokeWidth="3" />
              <rect x="-30" y="-6" width="60" height="3" fill="#7f1d1d" />
            </g>
          )}
          {kind === "TORCH" && (
            <g transform={`translate(${NABU_START.x + 50} ${NABU_START.y - 30})`}>
              <rect x="-4" y="0" width="8" height="60" fill="#78350f" />
              <motion.path
                d="M-14 0 Q-8 -30 0 -36 Q8 -30 14 0 Z" fill="#f97316"
                animate={{ scaleY: [1, 1.15, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
                style={{ originY: 0 }}
              />
              <path d="M-8 -4 Q-4 -22 0 -26 Q4 -22 8 -4 Z" fill="#fde047" />
            </g>
          )}
          {kind === "FIRE" && (
            <g transform={`translate(500 ${GROUND_Y - 50})`}>
              <ellipse cx="0" cy="20" rx="60" ry="10" fill="#78350f" />
              <rect x="-50" y="10" width="20" height="6" fill="#78350f" transform="rotate(-20 -40 13)" />
              <rect x="30" y="10" width="20" height="6" fill="#78350f" transform="rotate(20 40 13)" />
              <motion.path d="M-30 10 Q-20 -40 0 -50 Q20 -40 30 10 Z" fill="#f97316"
                animate={{ scaleY: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ originY: 10 }} />
              <path d="M-18 5 Q-10 -28 0 -36 Q10 -28 18 5 Z" fill="#fde047" />
            </g>
          )}
        </motion.g>
      )}
    </Stage>
  );
};

// ── Generic "Nabu carries the object" scene for everything else ──────────
const GenericScene = ({ phase, word, label }: { phase: ScenePhase; word: string; label?: string }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#bae6fd" to="#fef3c7" />
      <Clouds />
      <Grass />
      {/* Decorative path */}
      <path d={`M0 ${GROUND_Y + 30} Q500 ${GROUND_Y + 10} 1000 ${GROUND_Y + 30}`} stroke="#fbbf24" strokeWidth="20" fill="none" opacity="0.5" />
      {/* "?" thought when problem */}
      {!solved && (
        <motion.g animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <circle cx={NABU_START.x + 60} cy={NABU_START.y - 110} r="22" fill="#ffffff" stroke="#475569" strokeWidth="3" />
          <text x={NABU_START.x + 60} y={NABU_START.y - 102} textAnchor="middle" fontSize="28" fontWeight="900" fill="#475569">?</text>
        </motion.g>
      )}
      {/* solution object as labeled emblem */}
      {solved && (
        <motion.g
          initial={{ opacity: 0, scale: 0.4, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
        >
          <g transform={`translate(560 ${GROUND_Y - 130})`}>
            <rect x="-90" y="-50" width="180" height="100" rx="20" fill="#ffffff" stroke="#f59e0b" strokeWidth="6" />
            <text x="0" y="14" textAnchor="middle" fontSize="40" fontWeight="900" fill="#92400e">{label ?? word}</text>
          </g>
        </motion.g>
      )}
      <NabuSprite phase={phase} anim={walkToAnim(860, GROUND_Y - 90)} />

    </Stage>
  );
};

// ── BOAT: water, boat appears, Nabu sails across ─────────────────────────
const BoatScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#7dd3fc" to="#bae6fd" />
      <Clouds />
      {/* sand shores */}
      <rect x="0" y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill="#1d4ed8" />
      <rect x="0" y={GROUND_Y - 4} width={VB_W} height="8" fill="#2563eb" />
      <path d={`M0 ${GROUND_Y + 60} Q200 ${GROUND_Y + 30} 0 ${GROUND_Y + 90}`} fill="#fde68a" />
      <path d={`M${VB_W} ${GROUND_Y + 60} Q${VB_W - 200} ${GROUND_Y + 30} ${VB_W} ${GROUND_Y + 90}`} fill="#fde68a" />
      <rect x="0" y={GROUND_Y} width="140" height={VB_H - GROUND_Y} fill="#fbbf24" opacity="0.7" />
      <rect x={VB_W - 140} y={GROUND_Y} width="140" height={VB_H - GROUND_Y} fill="#fbbf24" opacity="0.7" />
      {/* waves */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M140 ${GROUND_Y + 30 + i * 30} q40 -6 80 0 q40 6 80 0 q40 -6 80 0 q40 6 80 0 q40 -6 80 0 q40 6 80 0`}
          stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.6"
          animate={{ x: [-8, 8, -8] }} transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
        />
      ))}
      {/* boat */}
      {solved && (
        <motion.g
          initial={{ x: NABU_START.x, y: 0 }}
          animate={{ x: phase === "transition" ? NABU_EXIT.x : NABU_START.x, y: 0 }}
          transition={{ duration: phase === "transition" ? 1.6 : 0.4, ease: "easeInOut" }}
        >
          <g transform={`translate(0 ${GROUND_Y - 30})`}>
            <path d="M-70 0 L70 0 L50 30 L-50 30 Z" fill="#92400e" stroke="#451a03" strokeWidth="3" />
            <rect x="-3" y="-80" width="6" height="80" fill="#78350f" />
            <path d="M3 -80 L60 -10 L3 -10 Z" fill="#fef3c7" stroke="#a16207" strokeWidth="2" />
          </g>
        </motion.g>
      )}
      <NabuSprite phase={phase} anim={walkToAnim(500, 60)} />

    </Stage>
  );
};

// ── ROCKET: launch pad, rocket lifts off (Nabu rides) ────────────────────
const RocketScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#1e1b4b" to="#7c3aed" />
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={(i * 71) % VB_W} cy={(i * 37) % 320} r="1.4" fill="#fef3c7" />
      ))}
      <rect x="0" y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill="#374151" />
      <rect x="420" y={GROUND_Y - 10} width="160" height="10" fill="#1f2937" />
      {/* rocket */}
      <motion.g
        initial={{ x: 500, y: GROUND_Y - 100 }}
        animate={solved ? { y: phase === "transition" ? -200 : GROUND_Y - 150 } : { y: GROUND_Y - 100 }}
        transition={{ duration: phase === "transition" ? 1.6 : 0.5 }}
      >
        <ellipse cx="0" cy="0" rx="40" ry="100" fill="#f1f5f9" />
        <path d="M-40 -20 Q0 -120 40 -20 Z" fill="#dc2626" />
        <rect x="-40" y="40" width="80" height="20" fill="#dc2626" />
        <path d="M-40 60 L-70 100 L-40 100 Z" fill="#991b1b" />
        <path d="M40 60 L70 100 L40 100 Z" fill="#991b1b" />
        <circle cx="0" cy="-20" r="14" fill="#7dd3fc" stroke="#0369a1" strokeWidth="3" />
        {solved && (
          <motion.path d="M-30 100 Q0 180 30 100 Z" fill="#fb923c"
            animate={{ scaleY: [1, 1.3, 1] }} transition={{ duration: 0.3, repeat: Infinity }}
            style={{ originY: 100 }} />
        )}
      </motion.g>
      <NabuSprite phase={phase} anim={hopOverAnim(500)} />

    </Stage>
  );
};

// ── WAVE: shore, big wave carries Nabu ───────────────────────────────────
const WaveScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#7dd3fc" to="#bae6fd" />
      <Clouds />
      <rect x="0" y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill="#fde68a" />
      <rect x="0" y={GROUND_Y} width={VB_W} height="8" fill="#fbbf24" />
      {/* wave */}
      <motion.path
        d={`M-200 ${GROUND_Y + 40} Q100 ${GROUND_Y - 120} 300 ${GROUND_Y + 20} Q500 ${GROUND_Y - 80} 700 ${GROUND_Y + 40} L${VB_W} ${VB_H} L0 ${VB_H} Z`}
        fill="#2563eb"
        initial={{ x: -800 }}
        animate={{ x: solved ? 0 : -800 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <NabuSprite phase={phase} />
    </Stage>
  );
};

// ── NET: catch flying thing ──────────────────────────────────────────────
const NetScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#bae6fd" to="#a7f3d0" />
      <Clouds />
      <Grass />
      {/* drifting cloud */}
      <motion.g animate={{ x: solved ? -200 : [0, 30, 0] }} transition={{ duration: solved ? 1.4 : 4, repeat: solved ? 0 : Infinity }}>
        <ellipse cx="650" cy="180" rx="80" ry="30" fill="#ffffff" />
        <ellipse cx="700" cy="170" rx="50" ry="22" fill="#ffffff" />
        <circle cx="640" cy="160" r="6" fill="#1a1a1a" />
        <circle cx="670" cy="160" r="6" fill="#1a1a1a" />
        <path d="M640 195 q15 10 30 0" stroke="#1a1a1a" strokeWidth="3" fill="none" />
      </motion.g>
      <NabuSprite phase={phase} />
      {solved && (
        <motion.g
          initial={{ x: NABU_START.x + 30, y: NABU_START.y - 80, rotate: -20, opacity: 0 }}
          animate={{ x: NABU_START.x + 80, y: NABU_START.y - 140, rotate: 10, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <rect x="0" y="0" width="6" height="100" fill="#78350f" transform="rotate(-30)" />
          <ellipse cx="-40" cy="-30" rx="40" ry="30" fill="none" stroke="#475569" strokeWidth="3" />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1={-70 + i * 12} y1={-40} x2={-70 + i * 12} y2={-10} stroke="#94a3b8" strokeWidth="1.5" />
          ))}
        </motion.g>
      )}
    </Stage>
  );
};

// ── ROPE: stuck creature, rope pulls it free ─────────────────────────────
const RopeScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#7dd3fc" to="#bae6fd" />
      <rect x="0" y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill="#fde68a" />
      {/* turtle */}
      <motion.g animate={solved ? { x: 80 } : { x: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
        <g transform={`translate(600 ${GROUND_Y - 30})`}>
          <ellipse cx="0" cy="0" rx="70" ry="34" fill="#15803d" />
          <ellipse cx="0" cy="-4" rx="60" ry="26" fill="#16a34a" />
          <circle cx="-60" cy="0" r="20" fill="#86efac" />
          <circle cx="-66" cy="-4" r="3" fill="#1a1a1a" />
          {/* feet */}
          <rect x="-40" y="20" width="14" height="14" rx="4" fill="#86efac" />
          <rect x="30" y="20" width="14" height="14" rx="4" fill="#86efac" />
        </g>
      </motion.g>
      {/* rope */}
      {solved && (
        <motion.path
          d={`M${NABU_START.x + 40} ${NABU_START.y - 30} Q400 ${GROUND_Y - 100} 540 ${GROUND_Y - 30}`}
          stroke="#a16207" strokeWidth="6" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }}
        />
      )}
      <NabuSprite phase={phase} anim={walkToAnim(600)} />

    </Stage>
  );
};

// ── TENT: stormy, tent appears, Nabu walks into it ───────────────────────
const TentScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#475569" to="#64748b" />
      {/* lightning */}
      {!solved && (
        <motion.path
          d="M540 60 L520 160 L560 160 L530 280" stroke="#fde047" strokeWidth="6" fill="none"
          animate={{ opacity: [0, 1, 0, 1, 0] }} transition={{ duration: 3, repeat: Infinity }}
        />
      )}
      <Grass from="#4d7c0f" to="#365314" />
      {/* tent */}
      <motion.g
        initial={{ scale: 0, y: 100 }}
        animate={{ scale: solved ? 1 : 0, y: solved ? 0 : 100 }}
        transition={{ type: "spring", stiffness: 160, damping: 16 }}
        style={{ transformOrigin: `600px ${GROUND_Y}px` }}
      >
        <path d={`M460 ${GROUND_Y} L600 ${GROUND_Y - 180} L740 ${GROUND_Y} Z`} fill="#dc2626" stroke="#7f1d1d" strokeWidth="4" />
        <path d={`M600 ${GROUND_Y} L600 ${GROUND_Y - 180}`} stroke="#7f1d1d" strokeWidth="3" />
        <path d={`M580 ${GROUND_Y} L600 ${GROUND_Y - 100} L620 ${GROUND_Y}`} fill="#1f2937" />
      </motion.g>
      <NabuSprite phase={phase} anim={walkToAnim(560)} />

    </Stage>
  );
};

// ── BED: sleepy creature, bed appears, creature naps ─────────────────────
const BedScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#fbcfe8" to="#fde68a" />
      <Clouds />
      <Grass />
      {/* puppy */}
      <g transform={`translate(620 ${GROUND_Y - 50})`}>
        <ellipse cx="0" cy="20" rx="50" ry="22" fill="#a16207" />
        <circle cx="-40" cy="0" r="22" fill="#a16207" />
        <circle cx="-46" cy="2" r="2.5" fill="#1a1a1a" />
        <circle cx="-36" cy="2" r="2.5" fill="#1a1a1a" />
      </g>
      {/* zzz */}
      {solved && (
        <motion.g animate={{ y: [-4, -14, -4], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}>
          <text x="700" y={GROUND_Y - 90} fontSize="28" fontWeight="900" fill="#7c3aed">z</text>
          <text x="720" y={GROUND_Y - 70} fontSize="22" fontWeight="900" fill="#7c3aed">z</text>
        </motion.g>
      )}
      {/* bed */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: solved ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        style={{ transformOrigin: `620px ${GROUND_Y - 10}px` }}
      >
        <rect x="540" y={GROUND_Y - 30} width="180" height="30" rx="6" fill="#c084fc" />
        <rect x="540" y={GROUND_Y - 50} width="60" height="20" rx="4" fill="#f0abfc" />
      </motion.g>
      <NabuSprite phase={phase} />
    </Stage>
  );
};

// ── ROOSTER / BELL / DRUM: wake the village ──────────────────────────────
const SoundScene = ({ phase, kind }: { phase: ScenePhase; kind: "ROOSTER" | "BELL" | "DRUM" | "FAN" }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#fcd34d" to="#fbbf24" />
      <Clouds />
      <Grass />
      {/* houses */}
      {[280, 460, 640, 820].map((x, i) => (
        <g key={i}>
          <rect x={x - 36} y={GROUND_Y - 80} width="72" height="80" fill="#fde68a" stroke="#a16207" strokeWidth="2" />
          <polygon points={`${x - 42},${GROUND_Y - 80} ${x},${GROUND_Y - 130} ${x + 42},${GROUND_Y - 80}`} fill="#b91c1c" />
          <rect x={x - 10} y={GROUND_Y - 40} width="20" height="40" fill="#78350f" />
          {/* Zzz when problem */}
          {!solved && (
            <motion.text x={x + 20} y={GROUND_Y - 100} fontSize="22" fontWeight="900" fill="#4338ca"
              animate={{ y: [GROUND_Y - 100, GROUND_Y - 115], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}>z</motion.text>
          )}
        </g>
      ))}
      {/* sound rings */}
      {solved && Array.from({ length: 3 }).map((_, i) => (
        <motion.circle
          key={i}
          cx={NABU_START.x + 60} cy={NABU_START.y - 40}
          r="20"
          stroke="#0ea5e9"
          strokeWidth="3"
          fill="none"
          initial={{ scale: 0.3, opacity: 0.9 }}
          animate={{ scale: 8, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
        />
      ))}
      {/* item */}
      {solved && (
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          style={{ transformOrigin: `${NABU_START.x + 60}px ${NABU_START.y - 40}px` }}
        >
          {kind === "ROOSTER" && (
            <g transform={`translate(${NABU_START.x + 60} ${NABU_START.y - 60})`}>
              <ellipse cx="0" cy="10" rx="28" ry="22" fill="#fef3c7" />
              <circle cx="-18" cy="-10" r="18" fill="#ffffff" />
              <path d="M-26 -22 L-18 -34 L-12 -22 L-6 -32 L-2 -22 Z" fill="#dc2626" />
              <circle cx="-22" cy="-12" r="2.5" fill="#1a1a1a" />
              <path d="M-34 -8 L-44 -10 L-34 -4 Z" fill="#f59e0b" />
              <path d="M16 6 q14 -4 24 -22 q-2 18 -14 30 z" fill="#fbbf24" />
            </g>
          )}
          {kind === "BELL" && (
            <g transform={`translate(${NABU_START.x + 60} ${NABU_START.y - 60})`}>
              <path d="M-30 20 Q-30 -40 0 -40 Q30 -40 30 20 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="3" />
              <circle cx="0" cy="28" r="6" fill="#78350f" />
              <rect x="-4" y="-46" width="8" height="10" fill="#78350f" />
            </g>
          )}
          {kind === "DRUM" && (
            <g transform={`translate(${NABU_START.x + 60} ${NABU_START.y - 40})`}>
              <ellipse cx="0" cy="0" rx="40" ry="14" fill="#dc2626" />
              <rect x="-40" y="0" width="80" height="40" fill="#dc2626" />
              <ellipse cx="0" cy="40" rx="40" ry="14" fill="#7f1d1d" />
              <path d="M-40 6 L40 36 M40 6 L-40 36" stroke="#fef3c7" strokeWidth="3" />
            </g>
          )}
          {kind === "FAN" && (
            <g transform={`translate(${NABU_START.x + 60} ${NABU_START.y - 40})`}>
              <circle cx="0" cy="0" r="40" fill="#475569" />
              <motion.g animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}>
                <ellipse cx="0" cy="-20" rx="6" ry="20" fill="#cbd5e1" />
                <ellipse cx="20" cy="0" rx="20" ry="6" fill="#cbd5e1" />
                <ellipse cx="0" cy="20" rx="6" ry="20" fill="#cbd5e1" />
                <ellipse cx="-20" cy="0" rx="20" ry="6" fill="#cbd5e1" />
              </motion.g>
              <circle cx="0" cy="0" r="6" fill="#1e293b" />
            </g>
          )}
        </motion.g>
      )}
      <NabuSprite phase={phase} />
    </Stage>
  );
};

// ── BALLOON / KITE / WINGS / CAPE: lifts Nabu up ─────────────────────────
const LiftScene = ({ phase, kind }: { phase: ScenePhase; kind: "BALLOON" | "KITE" | "WINGS" | "CAPE" }) => {
  const solved = phase === "solved" || phase === "transition";
  const flyUp = phase === "transition";
  return (
    <Stage>
      <Sky from="#7dd3fc" to="#bae6fd" />
      <Clouds />
      <Grass />
      {/* cliff */}
      <path d={`M500 ${GROUND_Y} L${VB_W} ${GROUND_Y} L${VB_W} ${VB_H} L500 ${VB_H} Z`} fill="#78716c" />
      <path d={`M500 ${GROUND_Y} L520 ${GROUND_Y - 10} L${VB_W} ${GROUND_Y - 10} L${VB_W} ${GROUND_Y} Z`} fill="#a8a29e" />
      {/* nabu flies up */}
      <motion.g
        initial={{ x: NABU_START.x, y: NABU_START.y }}
        animate={flyUp ? { x: 700, y: 100 } : phase === "solved" ? { y: NABU_START.y - 60 } : { y: NABU_START.y }}
        transition={{ duration: flyUp ? 1.6 : 0.8 }}
      >
        <foreignObject x={-55} y={-110} width={110} height={110}>
          <NabuOwl size={110} mood={phase === "problem" ? "curious" : phase === "solved" || phase === "transition" ? "cheer" : "happy"} />
        </foreignObject>
        {/* attached lift element */}
        {solved && kind === "BALLOON" && (
          <g>
            <line x1="0" y1="-100" x2="0" y2="-160" stroke="#475569" strokeWidth="2" />
            <ellipse cx="0" cy="-200" rx="40" ry="50" fill="#ef4444" />
            <ellipse cx="-12" cy="-220" rx="6" ry="10" fill="#fca5a5" opacity="0.6" />
          </g>
        )}
        {solved && kind === "KITE" && (
          <g>
            <line x1="0" y1="-100" x2="120" y2="-220" stroke="#1e293b" strokeWidth="2" />
            <polygon points="120,-260 160,-220 120,-180 80,-220" fill="#06b6d4" stroke="#0e7490" strokeWidth="3" />
            <line x1="120" y1="-260" x2="120" y2="-180" stroke="#0e7490" strokeWidth="2" />
            <line x1="80" y1="-220" x2="160" y2="-220" stroke="#0e7490" strokeWidth="2" />
            <path d="M120 -180 l-8 14 l16 0 z" fill="#fbbf24" />
          </g>
        )}
        {solved && kind === "WINGS" && (
          <g>
            <motion.path d="M-40 -60 Q-90 -90 -80 -40 Q-50 -40 -40 -60 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2"
              animate={{ rotate: [-5, 5, -5] }} style={{ originX: -40, originY: -60 }} transition={{ duration: 0.4, repeat: Infinity }} />
            <motion.path d="M40 -60 Q90 -90 80 -40 Q50 -40 40 -60 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2"
              animate={{ rotate: [5, -5, 5] }} style={{ originX: 40, originY: -60 }} transition={{ duration: 0.4, repeat: Infinity }} />
          </g>
        )}
        {solved && kind === "CAPE" && (
          <motion.path d="M-30 -50 Q-80 0 -40 30 L-20 -20 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2"
            animate={{ skewX: [-6, 6, -6] }} transition={{ duration: 0.6, repeat: Infinity }} />
        )}
      </motion.g>
    </Stage>
  );
};

// ── NEST / WORM (baby bird scenes) ───────────────────────────────────────
const NestScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#fbcfe8" to="#fde68a" />
      <Clouds />
      <Grass />
      {/* baby bird */}
      <g transform={`translate(560 ${GROUND_Y - 30})`}>
        <circle cx="0" cy="0" r="22" fill="#fde047" />
        <circle cx="-8" cy="-4" r="3" fill="#1a1a1a" />
        <circle cx="8" cy="-4" r="3" fill="#1a1a1a" />
        <path d="M-6 6 L0 12 L6 6 Z" fill="#f97316" />
      </g>
      {/* nest */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: solved ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        style={{ transformOrigin: `560px ${GROUND_Y - 6}px` }}
      >
        <ellipse cx="560" cy={GROUND_Y - 6} rx="70" ry="22" fill="#a16207" />
        <ellipse cx="560" cy={GROUND_Y - 14} rx="60" ry="14" fill="#78350f" />
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={500 + i * 9} y1={GROUND_Y - 18} x2={510 + i * 9} y2={GROUND_Y - 6} stroke="#92400e" strokeWidth="2" />
        ))}
      </motion.g>
      <NabuSprite phase={phase} anim={walkToAnim(490)} />

    </Stage>
  );
};

const WormScene = ({ phase }: { phase: ScenePhase }) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#fbcfe8" to="#fde68a" />
      <Clouds />
      <Grass />
      {/* bird */}
      <g transform={`translate(620 ${GROUND_Y - 60})`}>
        <ellipse cx="0" cy="0" rx="34" ry="28" fill="#3b82f6" />
        <circle cx="22" cy="-12" r="18" fill="#3b82f6" />
        <circle cx="26" cy="-14" r="3" fill="#1a1a1a" />
        <path d="M36 -10 L48 -8 L36 -4 Z" fill="#f59e0b" />
        <path d="M-30 0 q-20 -6 -28 4 q22 8 28 -4" fill="#1e40af" />
      </g>
      {/* worm */}
      {solved && (
        <motion.path
          d="M0 0 q10 -10 20 0 q10 10 20 0 q10 -10 20 0"
          stroke="#dc2626" strokeWidth="10" fill="none" strokeLinecap="round"
          initial={{ x: 200, y: GROUND_Y - 60, opacity: 0 }}
          animate={{ x: 580, y: GROUND_Y - 70, opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}
      <NabuSprite phase={phase} anim={walkToAnim(540)} />

    </Stage>
  );
};

// ── Map a word to a scene component ──────────────────────────────────────
export const NabuScene = ({ word, phase, index }: NabuSceneProps) => {
  const w = word.toUpperCase();
  // Key remount per obstacle so animations restart cleanly
  const k = `${w}-${index}`;
  switch (w) {
    case "BRIDGE": return <div key={k} className="absolute inset-0"><BridgeScene phase={phase} /></div>;
    case "BOOTS":  return <div key={k} className="absolute inset-0"><BootsScene phase={phase} /></div>;
    case "KEY":    return <div key={k} className="absolute inset-0"><KeyScene phase={phase} /></div>;
    case "AXE":    return <div key={k} className="absolute inset-0"><AxeScene phase={phase} /></div>;
    case "BONE":   return <div key={k} className="absolute inset-0"><BoneScene phase={phase} /></div>;
    case "LADDER": return <div key={k} className="absolute inset-0"><LadderScene phase={phase} /></div>;
    case "UMBRELLA": return <div key={k} className="absolute inset-0"><UmbrellaScene phase={phase} /></div>;
    case "SUN":    return <div key={k} className="absolute inset-0"><SunScene phase={phase} /></div>;
    case "STAR":
    case "LAMP":
    case "TORCH":
    case "FIRE":   return <div key={k} className="absolute inset-0"><LightScene phase={phase} kind={w as "STAR" | "LAMP" | "TORCH" | "FIRE"} /></div>;
    case "ROOSTER":
    case "BELL":
    case "DRUM":
    case "FAN":    return <div key={k} className="absolute inset-0"><SoundScene phase={phase} kind={w as "ROOSTER" | "BELL" | "DRUM" | "FAN"} /></div>;
    case "BALLOON":
    case "KITE":
    case "WINGS":
    case "CAPE":   return <div key={k} className="absolute inset-0"><LiftScene phase={phase} kind={w as "BALLOON" | "KITE" | "WINGS" | "CAPE"} /></div>;
    case "BOAT":   return <div key={k} className="absolute inset-0"><BoatScene phase={phase} /></div>;
    case "ROCKET": return <div key={k} className="absolute inset-0"><RocketScene phase={phase} /></div>;
    case "WAVE":   return <div key={k} className="absolute inset-0"><WaveScene phase={phase} /></div>;
    case "NET":    return <div key={k} className="absolute inset-0"><NetScene phase={phase} /></div>;
    case "ROPE":   return <div key={k} className="absolute inset-0"><RopeScene phase={phase} /></div>;
    case "TENT":   return <div key={k} className="absolute inset-0"><TentScene phase={phase} /></div>;
    case "BED":    return <div key={k} className="absolute inset-0"><BedScene phase={phase} /></div>;
    case "NEST":   return <div key={k} className="absolute inset-0"><NestScene phase={phase} /></div>;
    case "WORM":   return <div key={k} className="absolute inset-0"><WormScene phase={phase} /></div>;
    default:       return <div key={k} className="absolute inset-0"><GenericScene phase={phase} word={w} /></div>;
  }
};
