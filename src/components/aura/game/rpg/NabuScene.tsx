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

import { createContext, useContext, useId } from "react";
import { motion } from "framer-motion";
import { type BennyMood } from "@/components/BennyDog";
// Idle Benny uses a CSS sprite sheet (30 frames, single row). GPU-composited
// via background-position steps — identical performance on every browser
// including Safari, where animated WebP decodes single-threaded and stutters.
import bennySprite from "@/assets/benny-idle-sprite.png.asset.json";
import bennyWalkSprite from "@/assets/benny-walk-sprite.png.asset.json";
import celebrateAsset from "@/assets/benny-celebrate.png.asset.json";
import sadAsset from "@/assets/benny-sad.png.asset.json";

type ScenePhase = "problem" | "ask" | "reading" | "solved" | "transition";

const BennyMoodContext = createContext<BennyMood | null>(null);

// Sprite-sheet geometry — bottom 30px of every source frame was cropped so
// Benny's feet sit flush with the bottom edge of each cell.
const BENNY_SPRITE_FRAMES = 30;
const BENNY_SPRITE_CELL_W = 420;
const BENNY_SPRITE_CELL_H = 450;
const BENNY_SPRITE_ASPECT = BENNY_SPRITE_CELL_H / BENNY_SPRITE_CELL_W; // ≈1.0714
const BENNY_WALK_FRAMES = 24;
const BENNY_WALK_VISIBLE_BOTTOM_PAD = 38; // source px hidden below paws after watermark removal
const BENNY_TRANSITION_SECONDS = 2.6;

interface NabuSceneProps {
  word: string;
  phase: ScenePhase;
  index: number;
  mood?: BennyMood | null;
  solutionEmoji?: string;
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
    return {
      x: NABU_EXIT.x,
      y: NABU_EXIT.y,
      scaleY: 1, scaleX: 1, rotate: 0,
      transition: { duration: BENNY_TRANSITION_SECONDS, ease: "easeInOut" as const },
    };
  }
  if (phase === "solved") {
    // Joyful triple-hop with squash-and-stretch + small spin on each apex.
    return {
      x: NABU_START.x,
      y: [NABU_START.y, NABU_START.y - 38, NABU_START.y, NABU_START.y - 26, NABU_START.y, NABU_START.y - 18, NABU_START.y],
      scaleY: [1, 1.12, 0.88, 1.10, 0.92, 1.06, 1],
      scaleX: [1, 0.92, 1.08, 0.94, 1.06, 0.96, 1],
      rotate: [0, -6, 0, 6, 0, -3, 0],
      transition: { duration: 1.6, ease: "easeOut" as const },
    };
  }
  if (phase === "problem") {
    // Worried sway — leans left/right looking for help with a small head bob.
    return {
      x: [NABU_START.x, NABU_START.x - 10, NABU_START.x + 6, NABU_START.x],
      y: [NABU_START.y, NABU_START.y - 4, NABU_START.y - 2, NABU_START.y],
      rotate: [0, -4, 3, 0],
      scaleY: 1, scaleX: 1,
      transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" as const },
    };
  }
  // ask / reading: alert breathing-in stance — subtle pulse, no drift.
  return {
    x: NABU_START.x,
    y: [NABU_START.y, NABU_START.y - 4, NABU_START.y],
    scaleY: [1, 1.03, 1],
    scaleX: [1, 0.985, 1],
    rotate: 0,
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" as const },
  };
};

// ── Scene-specific Nabu motion helpers ─────────────────────────────────────
// All return a framer-motion `animate` object for the <motion.g> wrapper.

// High-bouncing walk across — for muddy / squishy ground (BOOTS). Adds
// squash on landings and stretch on rises so feet feel weighty.
const bouncyWalkAnim = (phase: ScenePhase): NabuAnim => {
  if (phase === "transition") {
    return {
      x: [140, 280, 420, 560, 700, 860],
      y: [370, 320, 370, 320, 370, 370],
      scaleY: [1, 1.12, 0.88, 1.12, 0.88, 1],
      scaleX: [1, 0.92, 1.10, 0.92, 1.10, 1],
      rotate: [0, -4, 0, 4, 0, 0],
      transition: { duration: BENNY_TRANSITION_SECONDS, ease: "easeInOut", times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    };
  }
  return nabuAnim(phase);
};

// Hop over an obstacle centered at obstacleX — anticipation crouch, big arc,
// squash on landing, then trot off. Reads as a real jump, not a slide-up.
const hopOverAnim = (obstacleX: number) => (phase: ScenePhase): NabuAnim => {
  if (phase === "transition") {
    return {
      x: [140, obstacleX - 90, obstacleX - 70, obstacleX, obstacleX + 70, obstacleX + 90, 860],
      y: [370, 380, 380, 250, 380, 380, 370],
      scaleY: [1, 0.82, 1.18, 1.05, 1.18, 0.82, 1],
      scaleX: [1, 1.12, 0.90, 0.96, 0.90, 1.12, 1],
      rotate: [0, 0, -8, -4, 4, 0, 0],
      transition: { duration: BENNY_TRANSITION_SECONDS, ease: "easeOut", times: [0, 0.18, 0.28, 0.5, 0.72, 0.82, 1] },
    };
  }
  return nabuAnim(phase);
};

// Walk forward and stop at a target — adds a small settle-bob on arrival.
const walkToAnim = (targetX: number, targetY: number = GROUND_Y - 10) =>
  (phase: ScenePhase): NabuAnim => {
    if (phase === "transition") {
      return {
        x: [NABU_START.x, (NABU_START.x + targetX) / 2, targetX],
        y: [NABU_START.y, targetY, targetY],
        scaleY: [1, 1, 1],
        scaleX: [1, 1, 1],
        transition: { duration: BENNY_TRANSITION_SECONDS, ease: "easeInOut", times: [0, 0.55, 1] },
      };
    }
    return nabuAnim(phase);
  };


// Loose type — framer-motion accepts many shapes here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NabuAnim = any;


const NabuSprite = ({
  phase,
  size = 280,
  anim,
  action,
}: {
  phase: ScenePhase;
  size?: number;
  anim?: (phase: ScenePhase) => NabuAnim;
  action?: "idle" | "walk" | "jump" | "climb";
}) => {
  const ctxMood = useContext(BennyMoodContext);
  // Walking sprite ONLY during actual travel (`transition`). During `solved`,
  // Benny is celebrating in place — show idle/celebrate, not legs running in
  // place. This eliminates the ~1s of running-in-place before he moves.
  const isMovingPhase = phase === "transition";
  const movementAction: BennyMood = isMovingPhase ? action ?? "walk" : "idle";
  const bennyMood: BennyMood = ctxMood === "sad" && phase !== "transition" ? "sad" : movementAction;
  return (
    <motion.g initial={{ x: NABU_START.x, y: NABU_START.y }} animate={anim ? anim(phase) : nabuAnim(phase)}>
      <BennySvgImage mood={bennyMood} size={size} />
    </motion.g>
  );
};

const bennyMoodAnim = (mood: BennyMood) => {
  if (mood === "celebrate") {
    return {
      animate: { y: [0, -28, 0, -16, 0], scale: [1, 1.18, 1.08, 1.14, 1.05], rotate: 0 },
      transition: { duration: 1.1, repeat: Infinity, ease: "easeOut" as const },
    };
  }
  if (mood === "sad") {
    return {
      animate: { x: [0, -6, 6, -4, 4, 0], rotate: [0, -3, 3, -2, 2, 0], scale: 1 },
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const },
    };
  }
  // Idle: stationary. The sprite-sheet animation IS the motion — no wrapper bob.
  return {
    animate: { y: 0, x: 0, rotate: 0, scale: 1 },
    transition: { duration: 0 },
  };
};

// Inject sprite keyframes once.
const BENNY_SPRITE_STYLE_ID = "benny-sprite-keyframes-v8-walk-grounded-face";
const BENNY_WALK_FRAMES = 24;
const ensureBennySpriteKeyframes = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(BENNY_SPRITE_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = BENNY_SPRITE_STYLE_ID;
  el.textContent = `
@keyframes benny-idle-sprite-walk {
  0%   { background-position-x: 0px; }
  72%  { background-position-x: var(--benny-sprite-end, -8120px); }
  100% { background-position-x: var(--benny-sprite-end, -8120px); }
}
@keyframes benny-walk-cycle {
  0%   { background-position-x: 0px; }
  100% { background-position-x: var(--benny-walk-end, -8640px); }
}
.benny-idle-sprite {
  background-repeat: no-repeat;
  background-position: 0px 0px;
  animation: benny-idle-sprite-walk 3.2s steps(29, end) infinite;
  will-change: background-position;
}
.benny-walk-sprite {
  background-repeat: no-repeat;
  background-position: 0px 0px;
  animation: benny-walk-cycle 2.4s steps(${BENNY_WALK_FRAMES}, end) infinite;
  will-change: background-position;
}
.benny-walk-sprite-jump { animation-duration: 1.6s; }
.benny-walk-sprite-climb { animation-duration: 2.8s; }
@media (prefers-reduced-motion: reduce) {
  .benny-idle-sprite, .benny-walk-sprite { animation: none; }
}
`;
  document.head.appendChild(el);
};

const BennySvgImage = ({ mood, size = 280 }: { mood: BennyMood; size?: number }) => {
  // Idle: original sprite-sheet still pose (breathing).
  // Walk / jump / climb: real walking video as a transparent sprite sheet —
  // legs visibly cycle. Anchored so feet sit at the same ground baseline.
  if (mood === "idle" || mood === "walk" || mood === "jump" || mood === "climb") {
    ensureBennySpriteKeyframes();
    const w = size;
    const h = Math.round(size * BENNY_SPRITE_ASPECT); // ≈ 300 for size=280
    const isMoving = mood !== "idle";
    // Walk sprite cells have a small transparent bottom pad. Drop only the
    // walking sheet by that pad so the visible paws touch the ground line.
    const walkH = w;
    const walkGroundCorrection = Math.round(w * 10 / 360);
    return (
      <foreignObject
        x={-w / 2}
        y={-h + 10}
        width={w}
        height={Math.max(h, walkH)}
        style={{ overflow: "visible", pointerEvents: "none" }}
      >
        <div style={{ width: w, height: Math.max(h, walkH), position: "relative" }}>
          {!isMoving && (
            <div
              className="benny-idle-sprite"
              style={{
                position: "absolute",
                left: 0,
                bottom: -walkGroundCorrection,
                width: w,
                height: h,
                backgroundImage: `url(${bennySprite.url})`,
                backgroundSize: `${w * BENNY_SPRITE_FRAMES}px ${h}px`,
                ["--benny-sprite-end" as any]: `${-(BENNY_SPRITE_FRAMES - 1) * w}px`,
              }}
              aria-label="Benny the puppy"
              role="img"
            />
          )}
          {isMoving && (
            <div
              className={`benny-walk-sprite${mood === "jump" ? " benny-walk-sprite-jump" : ""}${mood === "climb" ? " benny-walk-sprite-climb" : ""}`}
              style={{
                position: "absolute",
                left: 0,
                bottom: -walkGroundCorrection,
                width: w,
                height: walkH,
                backgroundImage: `url(${bennyWalkSprite.url})`,
                backgroundSize: `${w * BENNY_WALK_FRAMES}px ${walkH}px`,
                ["--benny-walk-end" as any]: `${-BENNY_WALK_FRAMES * w}px`,
              }}
              aria-label="Benny walking"
              role="img"
            />
          )}
        </div>
      </foreignObject>
    );
  }


  // Celebrate / sad: render the still PNG inside a motion wrapper. The
  // sprite-sheet has no celebrate/sad frames, and the rigged head/body split
  // looked unprofessional (floating head). A clean still + Motion bounce
  // reads as a single coherent character.
  const src = mood === "celebrate" ? celebrateAsset.url : sadAsset.url;
  const w = size;
  const h = Math.round(size * BENNY_SPRITE_ASPECT);
  const anim = bennyMoodAnim(mood);
  return (
    <foreignObject
      x={-w / 2}
      y={-h + 10}
      width={w}
      height={h}
      style={{ overflow: "visible", pointerEvents: "none" }}
    >
      <div style={{ width: w, height: h, transformOrigin: "50% 100%" }}>
        <motion.img
          src={src}
          alt={`Benny ${mood}`}
          draggable={false}
          animate={anim.animate}
          transition={anim.transition}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transformOrigin: "50% 100%",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </div>
    </foreignObject>
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
    preserveAspectRatio="xMidYMax meet"
    className="absolute inset-0 h-full w-full"
  >
    {children}
  </svg>
);

// ──────────────────────────────────────────────────────────────────────────
// SCENES
// ──────────────────────────────────────────────────────────────────────────

// ── JUMP: river across the path, Nabu leaps over it ──────────────────────
const jumpArcAnim = (phase: ScenePhase): NabuAnim => {
  if (phase === "transition") {
    // Even arc across the river at constant speed (linear easing, evenly spaced keyframes)
    const xs = [140, 230, 320, 410, 500, 590, 680, 770, 860];
    const arcPeak = 90; // modest height
    const ys = xs.map((x) => {
      // parabola peaking between river banks (x ~380..620), centered at 500
      const t = Math.max(0, Math.min(1, (x - 320) / (680 - 320)));
      const lift = Math.sin(t * Math.PI) * arcPeak;
      return 370 - lift;
    });
    return {
      x: xs,
      y: ys,
      transition: { duration: 1.8, ease: "linear" },
    };
  }
  if (phase === "solved") {
    return {
      x: [140, 140],
      y: [370, 340],
      transition: { duration: 0.4, ease: "easeOut" },
    };
  }
  return nabuAnim(phase);
};

const JumpScene = ({ phase }: { phase: ScenePhase }) => {
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
      {/* river banks */}
      <rect x="360" y={GROUND_Y - 4} width="24" height="8" rx="2" fill="#65a30d" />
      <rect x="616" y={GROUND_Y - 4} width="24" height="8" rx="2" fill="#65a30d" />
      {/* shimmer */}
      <motion.path
        d={`M395 ${GROUND_Y + 35} q40 -8 80 0 q40 8 80 0 q40 -8 70 0`}
        stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.6"
        animate={{ x: [-4, 4, -4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <NabuSprite phase={phase} anim={jumpArcAnim} action="jump" />
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

      {/* boots on Nabu — chunky, painted, with highlights so they read at 5ft */}
      {solved && (
        <motion.g
          initial={{ x: NABU_START.x, y: NABU_START.y, opacity: 0, scale: 0.6 }}
          animate={{
            x: phase === "transition" ? NABU_EXIT.x : NABU_START.x,
            y: phase === "transition" ? NABU_EXIT.y : NABU_START.y,
            opacity: 1,
            scale: 1,
          }}
          transition={{
            x: { duration: phase === "transition" ? 1.6 : 0.4, ease: "easeInOut" },
            y: { duration: phase === "transition" ? 1.6 : 0.4, ease: "easeInOut" },
            opacity: { duration: 0.35 },
            scale: { duration: 0.45, ease: "backOut" },
          }}
        >
          <defs>
            <linearGradient id="boot-red" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="55%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          {/* Left boot */}
          <g transform="translate(-58, -8)">
            <path d="M0 0 h36 q8 0 8 8 v40 q0 6 -6 6 h-10 l-2 12 h-36 l4 -14 h-2 q-6 0 -6 -6 v-38 q0 -8 8 -8 z"
                  fill="url(#boot-red)" stroke="#581c87" strokeOpacity="0.35" strokeWidth="2" />
            <rect x="-12" y="46" width="58" height="14" rx="4" fill="#7f1d1d" />
            <ellipse cx="10" cy="10" rx="14" ry="4" fill="#fecaca" opacity="0.55" />
            <circle cx="36" cy="22" r="3" fill="#fde68a" />
          </g>
          {/* Right boot */}
          <g transform="translate(14, -8)">
            <path d="M0 0 h36 q8 0 8 8 v40 q0 6 -6 6 h-10 l-2 12 h-36 l4 -14 h-2 q-6 0 -6 -6 v-38 q0 -8 8 -8 z"
                  fill="url(#boot-red)" stroke="#581c87" strokeOpacity="0.35" strokeWidth="2" />
            <rect x="-12" y="46" width="58" height="14" rx="4" fill="#7f1d1d" />
            <ellipse cx="10" cy="10" rx="14" ry="4" fill="#fecaca" opacity="0.55" />
            <circle cx="36" cy="22" r="3" fill="#fde68a" />
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
      {/* key flying to lock — big golden hero prop */}
      {phase === "solved" && (
        <motion.g
          initial={{ x: 180, y: GROUND_Y - 220, rotate: -25, opacity: 0, scale: 0.6 }}
          animate={{ x: 500, y: GROUND_Y - 95, rotate: 0, opacity: 1, scale: 1 }}
          transition={{
            x: { duration: 0.9, ease: "easeOut" },
            y: { duration: 0.9, ease: "easeOut" },
            rotate: { duration: 0.9, ease: "easeOut" },
            opacity: { duration: 0.35 },
            scale: { duration: 0.6, ease: "backOut" },
          }}
        >
          <defs>
            <linearGradient id="key-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="55%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <radialGradient id="key-shine" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fffbeb" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* bow (the round handle) */}
          <circle cx="0" cy="0" r="28" fill="url(#key-gold)" stroke="#713f12" strokeWidth="3" />
          <circle cx="0" cy="0" r="14" fill="none" stroke="#713f12" strokeWidth="3" />
          <ellipse cx="-8" cy="-8" rx="10" ry="6" fill="url(#key-shine)" />
          {/* shaft */}
          <rect x="22" y="-6" width="60" height="12" fill="url(#key-gold)" stroke="#713f12" strokeWidth="2.5" />
          {/* teeth */}
          <rect x="62" y="6" width="8" height="14" fill="url(#key-gold)" stroke="#713f12" strokeWidth="2" />
          <rect x="74" y="6" width="8" height="10" fill="url(#key-gold)" stroke="#713f12" strokeWidth="2" />
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
      <NabuSprite phase={phase} anim={hopOverAnim(500)} action="jump" />

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
          <BennySvgImage mood="climb" size={280} />
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

// ── Generic "Benny carries the object" scene for everything else ──────────
// Renders the solutionEmoji as a huge animated centerpiece so EVERY word has
// a believable visual without needing a hand-built scene.
const GenericScene = ({
  phase,
  word,
  emoji,
}: {
  phase: ScenePhase;
  word: string;
  emoji?: string;
}) => {
  const solved = phase === "solved" || phase === "transition";
  return (
    <Stage>
      <Sky from="#bae6fd" to="#fef3c7" />
      <Clouds />
      <Grass />
      <path d={`M0 ${GROUND_Y + 30} Q500 ${GROUND_Y + 10} 1000 ${GROUND_Y + 30}`} stroke="#fbbf24" strokeWidth="20" fill="none" opacity="0.5" />
      {/* "?" thought when problem */}
      {!solved && (
        <motion.g animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <circle cx={NABU_START.x + 60} cy={NABU_START.y - 160} r="28" fill="#ffffff" stroke="#475569" strokeWidth="3" />
          <text x={NABU_START.x + 60} y={NABU_START.y - 150} textAnchor="middle" fontSize="36" fontWeight="900" fill="#475569">?</text>
        </motion.g>
      )}
      {/* Giant animated emoji solution */}
      {solved && emoji && (
        <motion.g
          initial={{ opacity: 0, scale: 0.2, y: -60 }}
          animate={{ opacity: 1, scale: [0.2, 1.25, 1], y: [-60, 0, 0] }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <motion.text
            x={560}
            y={GROUND_Y - 110}
            textAnchor="middle"
            fontSize="240"
            style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.25))" }}
            animate={{ y: [GROUND_Y - 110, GROUND_Y - 130, GROUND_Y - 110], rotate: [-3, 3, -3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {emoji}
          </motion.text>
        </motion.g>
      )}
      {/* Word label when problem (helps the kid connect) */}
      {solved && (
        <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <rect x="440" y={GROUND_Y - 30} width="240" height="48" rx="14" fill="#ffffff" stroke="#f59e0b" strokeWidth="5" />
          <text x="560" y={GROUND_Y + 2} textAnchor="middle" fontSize="30" fontWeight="900" fill="#92400e">{word}</text>
        </motion.g>
      )}
      <NabuSprite phase={phase} anim={walkToAnim(860, GROUND_Y - 10)} />
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
      <NabuSprite phase={phase} anim={hopOverAnim(500)} action="jump" />

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
        <BennySvgImage mood="idle" size={280} />
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
export const NabuScene = ({ word, phase, index, mood = null, solutionEmoji }: NabuSceneProps) => {
  const w = word.toUpperCase();
  const k = `${w}-${index}`;
  const wrap = (children: React.ReactNode) => (
    <BennyMoodContext.Provider value={mood}>
      <div key={k} className="absolute inset-0">{children}</div>
    </BennyMoodContext.Provider>
  );
  switch (w) {
    case "JUMP":
    case "HOP":    return wrap(<JumpScene phase={phase} />);
    case "BOOTS":  return wrap(<BootsScene phase={phase} />);
    case "KEY":    return wrap(<KeyScene phase={phase} />);
    case "AXE":
    case "CHOP":
    case "BASH":   return wrap(<AxeScene phase={phase} />);
    case "BONE":   return wrap(<BoneScene phase={phase} />);
    case "LADDER":
    case "STEPS":  return wrap(<LadderScene phase={phase} />);
    case "UMBRELLA":
    case "HOOD":
    case "COAT":   return wrap(<UmbrellaScene phase={phase} />);
    case "SUN":    return wrap(<SunScene phase={phase} />);
    case "STAR":
    case "LAMP":
    case "TORCH":
    case "FIRE":   return wrap(<LightScene phase={phase} kind={w as "STAR" | "LAMP" | "TORCH" | "FIRE"} />);
    case "ROOSTER":
    case "HEN":
    case "BELL":
    case "DRUM":
    case "FAN":    return wrap(<SoundScene phase={phase} kind={(w === "HEN" ? "ROOSTER" : w) as "ROOSTER" | "BELL" | "DRUM" | "FAN"} />);
    case "BALLOON":
    case "KITE":
    case "WINGS":
    case "CAPE":   return wrap(<LiftScene phase={phase} kind={w as "BALLOON" | "KITE" | "WINGS" | "CAPE"} />);
    case "BOAT":   return wrap(<BoatScene phase={phase} />);
    case "ROCKET": return wrap(<RocketScene phase={phase} />);
    case "WAVE":   return wrap(<WaveScene phase={phase} />);
    case "NET":    return wrap(<NetScene phase={phase} />);
    case "ROPE":   return wrap(<RopeScene phase={phase} />);
    case "TENT":   return wrap(<TentScene phase={phase} />);
    case "BED":    return wrap(<BedScene phase={phase} />);
    case "NEST":   return wrap(<NestScene phase={phase} />);
    case "WORM":   return wrap(<WormScene phase={phase} />);
    default:       return wrap(<GenericScene phase={phase} word={w} emoji={solutionEmoji} />);
  }
};

