import { motion, AnimatePresence } from "framer-motion";

export type HelpPhase = "setup" | "approach" | "fix" | "happy";

// ──────────────────────────────────────────────────────────────────────────
// Mood indicators (floating above the character's head)
// ──────────────────────────────────────────────────────────────────────────

type MoodProps = { visible: boolean; topPx?: number };

export const SadMood = ({ visible, topPx = -24 }: MoodProps) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="sad"
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-40 w-14 h-10"
        style={{ top: topPx }}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.25 }}
      >
        {/* Rain cloud */}
        <div className="absolute inset-x-1 top-0 h-5 rounded-full bg-slate-400 shadow-sm" />
        <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-slate-300" />
        <div className="absolute right-0 top-1 w-5 h-5 rounded-full bg-slate-300" />
        {/* Rain drops */}
        {[0, 0.25, 0.5].map((d, i) => (
          <motion.div
            key={i}
            className="absolute w-[3px] h-2 rounded-full bg-sky-500"
            style={{ left: `${22 + i * 22}%`, top: "60%" }}
            animate={{ y: [0, 10, 10], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.1, delay: d, ease: "easeIn" }}
          />
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

export const HappyMood = ({ visible, topPx = -28 }: MoodProps) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="happy"
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-40 w-14 h-8 flex items-end justify-center gap-1"
        style={{ top: topPx }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.4 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Beating heart */}
        <motion.div
          className="relative w-5 h-5"
          animate={{ scale: [1, 1.2, 1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
        >
          <div className="absolute left-0 top-0 w-3 h-4 rounded-full bg-rose-500" />
          <div className="absolute right-0 top-0 w-3 h-4 rounded-full bg-rose-500" />
          <div
            className="absolute left-1/2 bottom-0 w-3 h-3 bg-rose-500"
            style={{ transform: "translateX(-50%) rotate(45deg)" }}
          />
        </motion.div>
        {/* Sparkles */}
        {[0, 0.2, 0.4].map((d, i) => (
          <motion.div
            key={i}
            className="text-amber-400 text-base font-black"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
            animate={{ y: [0, -4, 0], scale: [0.8, 1.2, 0.8], rotate: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 1.1, delay: d, ease: "easeInOut" }}
          >
            ✦
          </motion.div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

// ──────────────────────────────────────────────────────────────────────────
// Help-ME scene: deflated basketball + pump
// ──────────────────────────────────────────────────────────────────────────

// Basketball held by the LEAD (blue). Goes from deflated → inflated as the
// pump pushes during the "fix" phase, then bounces happily.
export const BasketballProp = ({ phase }: { phase: HelpPhase }) => {
  // Phase-driven scaleY: starts squished, inflates during 'fix', round in 'happy'.
  const scaleY =
    phase === "setup" || phase === "approach"
      ? 0.32
      : phase === "fix"
      ? 1
      : 1;
  const scaleX =
    phase === "setup" || phase === "approach"
      ? 1.15
      : 1;
  return (
    <div className="absolute pointer-events-none z-30" style={{ right: "10%", bottom: "4%", width: "26%", height: "26%" }}>
      <motion.div
        className="relative w-full h-full"
        animate={
          phase === "fix"
            ? { scaleY: [0.32, 0.5, 0.5, 0.72, 0.72, 0.92, 0.92, 1], scaleX: [1.15, 1.1, 1.1, 1.05, 1.05, 1.02, 1.02, 1] }
            : phase === "happy"
            ? { scaleY: [1, 1.05, 1, 1.05, 1], y: [0, -8, 0, -6, 0] }
            : { scaleY, scaleX }
        }
        transition={
          phase === "fix"
            ? { duration: 1.5, times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1], ease: "easeOut" }
            : phase === "happy"
            ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.3 }
        }
        style={{ transformOrigin: "center bottom" }}
      >
        {/* Ball */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 via-orange-600 to-orange-800 shadow-md" />
        {/* Highlight */}
        <div className="absolute top-[15%] left-[20%] w-[28%] h-[20%] rounded-full bg-orange-200/70 blur-[1px]" />
        {/* Seam lines */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-black/70" />
        <div className="absolute left-1/2 -translate-x-1/2 inset-y-0 w-[2px] bg-black/70" />
        <div
          className="absolute left-1/2 -translate-x-1/2 inset-y-0 w-[2px] bg-black/70"
          style={{ transform: "translateX(-50%) rotate(60deg)" }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 inset-y-0 w-[2px] bg-black/70"
          style={{ transform: "translateX(-50%) rotate(-60deg)" }}
        />
      </motion.div>
    </div>
  );
};

// Pump held by the HELPER (yellow). Piston pushes down 3 times during 'fix'.
export const PumpProp = ({ phase }: { phase: HelpPhase }) => {
  // Pump only appears after approach.
  if (phase === "setup" || phase === "happy") return null;
  const showHose = true;
  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{ left: "-2%", bottom: "10%", width: "32%", height: "62%" }}
    >
      {/* Body of the pump (vertical cylinder) */}
      <div className="absolute inset-x-[30%] bottom-0 top-[35%] rounded-md bg-gradient-to-b from-slate-300 via-slate-400 to-slate-700 shadow-md">
        <div className="absolute inset-x-[20%] top-[10%] bottom-[20%] rounded-sm bg-slate-200/30" />
      </div>
      {/* Base */}
      <div className="absolute inset-x-[10%] bottom-[-2%] h-[10%] rounded bg-slate-800 shadow" />
      {/* Handle on top with piston motion during 'fix' */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: "0%", width: "70%", height: "42%" }}
        animate={
          phase === "fix"
            ? { y: [0, 22, 0, 22, 0, 22, 0] }
            : { y: 0 }
        }
        transition={
          phase === "fix"
            ? { duration: 1.5, times: [0, 0.15, 0.3, 0.5, 0.65, 0.85, 1], ease: "easeInOut" }
            : { duration: 0.3 }
        }
      >
        {/* Handle bar */}
        <div className="absolute inset-x-0 top-0 h-[24%] rounded-full bg-gradient-to-b from-amber-700 to-amber-900 shadow" />
        {/* Piston rod */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[20%] bottom-0 w-[18%] bg-slate-500 rounded-sm" />
      </motion.div>
      {/* Hose to the basketball (curves left toward the lead) */}
      {showHose && (
        <div
          className="absolute"
          style={{ left: "-90%", bottom: "8%", width: "120%", height: "8%" }}
        >
          <div className="absolute inset-0 rounded-full bg-slate-700/80" />
        </div>
      )}
      {/* Puff lines during fix to suggest air pushing */}
      {phase === "fix" &&
        [0, 0.5, 1].map((d, i) => (
          <motion.div
            key={i}
            className="absolute left-[-30%] bottom-[6%] w-[20%] h-[2px] rounded-full bg-white/90"
            animate={{ x: [-4, -20, -36], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: d * 0.5, ease: "easeOut" }}
          />
        ))}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Help-YOU scene: broken baseball bat + duct tape
// ──────────────────────────────────────────────────────────────────────────

// Broken bat held by the HELPER (yellow). Two halves separated, then joined
// with a chunky silver duct-tape wrap during the 'fix' phase.
export const BrokenBatProp = ({ phase }: { phase: HelpPhase }) => {
  const broken = phase === "setup" || phase === "approach";
  const repaired = phase === "fix" || phase === "happy";
  const tapeTexture = {
    background:
      "linear-gradient(90deg, #e5e7eb 0%, #ffffff 18%, #94a3b8 44%, #f8fafc 62%, #64748b 100%)",
    backgroundImage:
      "linear-gradient(90deg, #e5e7eb 0%, #ffffff 18%, #94a3b8 44%, #f8fafc 62%, #64748b 100%), repeating-linear-gradient(0deg, rgba(15,23,42,0.28) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(15,23,42,0.18) 0 1px, transparent 1px 5px)",
  };
  // Crack lives exactly at the boundary between handle (44%) and barrel (56%)
  const CRACK_X = 44; // percent from left of bat container
  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{ right: "-55%", bottom: "-4%", width: "120%", height: "34%" }}
    >
      <div className="relative w-full h-full" style={{ transform: "rotate(-8deg)" }}>
        {/* Handle half (left) */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2"
          style={{ width: "44%", height: "60%", transformOrigin: "right center" }}
          animate={
            broken
              ? { x: -8, rotate: -12 }
              : { x: 2, rotate: 0 }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 rounded-l-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-700 shadow">
            <div className="absolute left-[5%] inset-y-[20%] w-[35%] rounded-l-full bg-gradient-to-r from-slate-900 to-slate-700" />
          </div>
          {broken && (
            <div
              className="absolute right-[-2px] top-0 bottom-0 w-[8%] bg-amber-900"
              style={{ clipPath: "polygon(0 0, 100% 20%, 0 40%, 100% 60%, 0 80%, 100% 100%, 0 100%)" }}
            />
          )}
        </motion.div>

        {/* Barrel half (right) */}
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2"
          style={{ width: "56%", height: "78%", transformOrigin: "left center" }}
          animate={
            broken
              ? { x: 8, rotate: 12 }
              : { x: -2, rotate: 0 }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 rounded-r-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 shadow">
            <div className="absolute top-[15%] right-[12%] w-[18%] h-[18%] rounded-full bg-amber-300/60 blur-[1px]" />
          </div>
          {broken && (
            <div
              className="absolute left-[-2px] top-0 bottom-0 w-[6%] bg-amber-700"
              style={{ clipPath: "polygon(100% 0, 0 20%, 100% 40%, 0 60%, 100% 80%, 0 100%, 100% 100%)" }}
            />
          )}
        </motion.div>

        {/* ONE horizontal duct-tape wrap across the crack — strap goes ACROSS the bat */}
        <AnimatePresence>
          {repaired && (
            <motion.div
              key="tape-wrap"
              className="absolute z-[120]"
              style={{
                left: `${CRACK_X - 9}%`,
                width: "18%",
                top: "calc(50% - 1px)",
                height: "62%",
                transform: "translateY(-50%)",
                transformOrigin: "center center",
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* The strap itself — silver, with cloth fibers and crisp dark edges */}
              <div
                className="absolute inset-0 rounded-[3px] border border-slate-800 shadow-[0_3px_8px_rgba(15,23,42,0.6)]"
                style={tapeTexture}
              >
                {/* Sheen */}
                <div className="absolute inset-y-[8%] left-[35%] w-[22%] bg-white/55 blur-[2px] rounded-full" />
                {/* Top + bottom dark crease lines so it reads as a wrap going behind the bat */}
                <div className="absolute -top-[1px] inset-x-0 h-[2px] bg-slate-900/70" />
                <div className="absolute -bottom-[1px] inset-x-0 h-[2px] bg-slate-900/70" />
                {/* Center seam */}
                <div className="absolute inset-x-[8%] top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-slate-900/30" />
              </div>
              {phase === "happy" && (
                <motion.div
                  className="absolute -top-[40%] right-[-30%] text-amber-300 text-lg"
                  animate={{ scale: [0.7, 1.2, 0.7], rotate: [0, 25, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                >
                  ✦
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "happy" && (
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: [0, -6, 6, -4, 0], y: [0, -4, 0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  );
};

// Duct-tape roll held by the LEAD (blue) as he walks over to fix the bat.
// Larger, with a clearly hanging silver tape strip and an arrow toward the bat.
export const DuctTapeProp = ({ phase }: { phase: HelpPhase }) => {
  // Tape only shows during the approach + fix; disappears for 'happy'.
  if (phase === "happy") return null;
  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{ right: "4%", bottom: "30%", width: "32%", height: "32%" }}
    >

      <motion.div
        className="relative w-full h-full"
        animate={phase === "fix" ? { rotate: [0, -25, -50, -80, -110] } : { rotate: 0 }}
        transition={phase === "fix" ? { duration: 1.2, ease: "linear" } : { duration: 0.3 }}
      >
        {/* Outer roll — chunky silver */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-300 via-slate-500 to-slate-800 shadow-lg border-2 border-slate-700">
          {/* Diagonal tape ridges on the roll */}
          <div
            className="absolute inset-[6%] rounded-full opacity-50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 3px, transparent 3px 7px)",
            }}
          />
        </div>
        {/* Inner hole */}
        <div className="absolute inset-[32%] rounded-full bg-slate-100 shadow-inner border border-slate-400" />
        {/* Side highlight */}
        <div className="absolute top-[10%] left-[18%] w-[28%] h-[16%] rounded-full bg-white/60 blur-[1px]" />

        {/* Pulled-out sticky tape strip hanging off the roll — clearly identifies it as tape */}
        <div
          className="absolute"
          style={{ left: "-55%", top: "55%", width: "60%", height: "18%", transform: "rotate(8deg)" }}
        >
          <div className="relative w-full h-full rounded-sm bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 shadow border border-slate-700/60">
            <div
              className="absolute inset-0 rounded-sm opacity-50"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 2px, transparent 2px 6px)",
              }}
            />
          </div>
        </div>
      </motion.div>

    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// "MY dog" / "YOUR dog" scene: a cute cartoon dog with a collar + leash.
// The leash arcs UP toward whichever character is "holding" it.
//   holder="left"  → leash goes up-left, toward the BLUE lead's hand.
//   holder="right" → leash goes up-right, toward the YELLOW helper's hand.
// ──────────────────────────────────────────────────────────────────────────
export const DogWithLeashProp = ({
  holder,
  visible,
  rightPct,
  leftPct,
  scale = 1,
  leashLength = 70,
  leashAngleDeg,
}: {
  holder: "left" | "right";
  visible: boolean;
  rightPct?: number;
  leftPct?: number;
  scale?: number;
  leashLength?: number;
  leashAngleDeg?: number;
}) => {
  const angle = leashAngleDeg ?? (holder === "left" ? -150 : -35);
  const positionStyle: React.CSSProperties =
    leftPct !== undefined ? { left: `${leftPct}%` } : { right: `${rightPct ?? -38}%` };
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`dog-${holder}-${leftPct !== undefined ? "L" : "R"}`}
          className="absolute pointer-events-none z-30"
          style={{
            ...positionStyle,
            bottom: "0%",
            width: `${78 * scale}px`,
            height: `${68 * scale}px`,
            transformOrigin: "left bottom",
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "left bottom", width: "78px", height: "68px", position: "relative" }}>

          {/* Tiny idle bob so the dog feels alive */}
          <motion.div
            className="absolute inset-0"
            animate={{ y: [0, -2, 0, -2, 0], rotate: [0, -1.5, 0, 1.5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Tail — wags */}
            <motion.div
              className="absolute"
              style={{
                right: "2px",
                bottom: "30px",
                width: "16px",
                height: "5px",
                background: "linear-gradient(90deg, #c2410c, #fb923c)",
                borderRadius: "999px",
                transformOrigin: "left center",
                transform: "rotate(-25deg)",
              }}
              animate={{ rotate: [-25, -55, -25, -55, -25] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Body */}
            <div
              className="absolute shadow-md"
              style={{
                left: "10px",
                bottom: "10px",
                width: "52px",
                height: "30px",
                background: "linear-gradient(180deg, #fdba74 0%, #fb923c 60%, #c2410c 100%)",
                borderRadius: "26px 22px 22px 22px / 22px 18px 18px 18px",
              }}
            />
            {/* Legs */}
            <div
              className="absolute bg-amber-800"
              style={{ left: "16px", bottom: "0px", width: "7px", height: "12px", borderRadius: "3px" }}
            />
            <div
              className="absolute bg-amber-800"
              style={{ left: "48px", bottom: "0px", width: "7px", height: "12px", borderRadius: "3px" }}
            />
            {/* Head */}
            <div
              className="absolute shadow-sm"
              style={{
                left: "44px",
                bottom: "26px",
                width: "30px",
                height: "28px",
                background: "linear-gradient(180deg, #fdba74 0%, #fb923c 100%)",
                borderRadius: "50%",
              }}
            />
            {/* Floppy ear */}
            <div
              className="absolute"
              style={{
                left: "42px",
                bottom: "42px",
                width: "10px",
                height: "16px",
                background: "#9a3412",
                borderRadius: "8px 8px 8px 10px",
                transform: "rotate(-15deg)",
              }}
            />
            {/* Snout */}
            <div
              className="absolute"
              style={{
                left: "62px",
                bottom: "28px",
                width: "14px",
                height: "10px",
                background: "#fde68a",
                borderRadius: "50%",
              }}
            />
            {/* Nose */}
            <div
              className="absolute rounded-full bg-slate-900"
              style={{ left: "70px", bottom: "33px", width: "5px", height: "4px" }}
            />
            {/* Eye */}
            <div
              className="absolute rounded-full bg-slate-900"
              style={{ left: "58px", bottom: "42px", width: "4px", height: "4px" }}
            />
            {/* Mouth */}
            <div
              className="absolute"
              style={{
                left: "63px",
                bottom: "26px",
                width: "8px",
                height: "3px",
                borderBottom: "1.5px solid #7c2d12",
                borderBottomLeftRadius: "8px",
                borderBottomRightRadius: "8px",
              }}
            />

            {/* COLLAR — bright red band around the neck */}
            <div
              className="absolute shadow-sm"
              style={{
                left: "42px",
                bottom: "24px",
                width: "16px",
                height: "6px",
                background: "linear-gradient(180deg, #ef4444, #b91c1c)",
                borderRadius: "3px",
                transform: "rotate(-8deg)",
                border: "1px solid #7f1d1d",
              }}
            />
            {/* Collar tag */}
            <div
              className="absolute rounded-full bg-amber-300 border border-amber-600"
              style={{ left: "48px", bottom: "20px", width: "5px", height: "5px" }}
            />

            {/* LEASH — straight strap from collar to holder's hand. */}
            <div
              className="absolute"
              style={{
                // Anchor at the collar ring (~ left:50, bottom:30 in the 78x68 frame).
                left: "50px",
                bottom: "30px",
                width: `${leashLength}px`,
                height: "3px",
                background: "linear-gradient(90deg, #1e293b, #475569)",
                borderRadius: "999px",
                transformOrigin: "left center",
                transform: `rotate(${angle}deg)`,
                boxShadow: "0 1px 0 rgba(0,0,0,0.15)",
              }}
            />
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// BoxProp — simple brown cardboard box. `mode="in"` shows open flaps so the
// character can hop INTO it. `mode="on"` shows a closed flat top so the
// character can land ON it. Positioned absolutely by the parent column.
// ──────────────────────────────────────────────────────────────────────────
// All four props below are mounted as SIBLINGS of the character's motion.div
// (at the column level), NOT inside it — so they stay anchored to ground
// space while the character's body performs its transform animation.

export const BoxProp = ({
  visible,
  mode,
}: {
  visible: boolean;
  mode: "in" | "on";
}) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key={`box-${mode}`}
        className="absolute pointer-events-none z-30"
        style={{
          left: "50%",
          bottom: "56px", // top edge sits at character foot level (mb-16 = 64px) minus 8px overlap
          width: "96px",
          height: "56px",
          transform: "translateX(-50%)",
        }}
        initial={{ opacity: 0, scale: 0.6, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: 12 }}
        transition={{ duration: 0.3, ease: "backOut" }}
      >
        {/* Front face */}
        <div
          className="absolute inset-x-0 bottom-0 rounded-md shadow-lg"
          style={{
            height: "40px",
            background: "linear-gradient(180deg, #c2761d 0%, #9a4d12 60%, #6b2f08 100%)",
            border: "2px solid #4a1f06",
            boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.3)",
          }}
        >
          {/* Vertical seam */}
          <div className="absolute inset-y-1 left-1/2 w-[2px] -translate-x-1/2 bg-amber-950/70" />
          {/* Tape strip */}
          <div className="absolute inset-x-4 top-2 h-[6px] rounded-sm bg-amber-100/80 border border-amber-200" />
        </div>
        {mode === "on" ? (
          // Closed top — flat lid the character stands on
          <div
            className="absolute left-0 right-0 rounded-md shadow"
            style={{
              bottom: "36px",
              height: "14px",
              background: "linear-gradient(180deg, #e08a2a 0%, #b45309 70%, #8a3d08 100%)",
              border: "2px solid #4a1f06",
              borderBottom: "none",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.25)",
            }}
          />
        ) : (
          // Open flaps splayed outward, leaving a dark opening
          <>
            <div
              className="absolute"
              style={{
                left: 0,
                right: 0,
                bottom: "36px",
                height: "8px",
                background: "#1c0a02",
                borderRadius: "2px",
              }}
            />
            <div
              className="absolute origin-bottom-right rounded-md shadow"
              style={{
                left: "-4px",
                bottom: "40px",
                width: "52px",
                height: "22px",
                background: "linear-gradient(180deg, #e08a2a 0%, #b45309 100%)",
                border: "2px solid #4a1f06",
                transform: "rotate(-38deg)",
              }}
            />
            <div
              className="absolute origin-bottom-left rounded-md shadow"
              style={{
                right: "-4px",
                bottom: "40px",
                width: "52px",
                height: "22px",
                background: "linear-gradient(180deg, #e08a2a 0%, #b45309 100%)",
                border: "2px solid #4a1f06",
                transform: "rotate(38deg)",
              }}
            />
          </>
        )}
        {/* Ground shadow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            bottom: "-6px",
            width: "90px",
            height: "10px",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)",
          }}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

// ──────────────────────────────────────────────────────────────────────────
// WashHandsProp — sink basin with running faucet water + soap bubbles
// foaming over the character's hands. Renders at column level so it stays
// anchored even when the character body sways.
// ──────────────────────────────────────────────────────────────────────────
export const WashHandsProp = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="wash"
        className="absolute pointer-events-none z-40"
        style={{
          left: "50%",
          bottom: "44px", // sits in front of character around hand height
          width: "110px",
          height: "100px",
          transform: "translateX(-50%)",
        }}
        initial={{ opacity: 0, y: 10, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.3 }}
      >
        {/* Faucet body (back) */}
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "0px",
            width: "10px",
            height: "30px",
            background: "linear-gradient(180deg, #cbd5e1, #94a3b8)",
            border: "1.5px solid #475569",
            borderRadius: "3px",
            transform: "translateX(-50%)",
          }}
        />
        {/* Faucet spout */}
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "22px",
            width: "26px",
            height: "8px",
            background: "linear-gradient(180deg, #cbd5e1, #64748b)",
            border: "1.5px solid #475569",
            borderRadius: "0 0 4px 4px",
            transform: "translateX(-50%)",
          }}
        />
        {/* Running water stream */}
        <motion.div
          className="absolute"
          style={{
            left: "50%",
            top: "30px",
            width: "8px",
            height: "32px",
            background: "linear-gradient(180deg, rgba(125,211,252,0.95), rgba(59,130,246,0.6))",
            borderRadius: "4px",
            transform: "translateX(-50%)",
            filter: "drop-shadow(0 0 4px rgba(125,211,252,0.7))",
          }}
          animate={{ scaleY: [1, 1.08, 0.95, 1.05, 1] }}
          transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Water splash droplets bouncing off hands */}
        {[
          { x: -22, d: 0 },
          { x: -10, d: 0.15 },
          { x: 8, d: 0.3 },
          { x: 22, d: 0.45 },
        ].map((s, i) => (
          <motion.div
            key={`splash-${i}`}
            className="absolute rounded-full bg-sky-300"
            style={{
              left: "50%",
              top: "62px",
              width: "5px",
              height: "5px",
            }}
            animate={{
              x: [0, s.x],
              y: [0, -8, 14],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.7, delay: s.d, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
        {/* Foamy soap bubble cluster around hands */}
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "55px",
            width: "90px",
            height: "40px",
            transform: "translateX(-50%)",
          }}
        >
          {[
            { l: 10, t: 18, s: 14, d: 0 },
            { l: 28, t: 8, s: 18, d: 0.2 },
            { l: 48, t: 14, s: 16, d: 0.4 },
            { l: 64, t: 6, s: 14, d: 0.6 },
            { l: 20, t: 22, s: 11, d: 0.8 },
            { l: 58, t: 24, s: 12, d: 1.0 },
          ].map((b, i) => (
            <motion.div
              key={`foam-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${b.l}px`,
                top: `${b.t}px`,
                width: `${b.s}px`,
                height: `${b.s}px`,
                background:
                  "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.98), rgba(224,242,254,0.9) 55%, rgba(186,230,253,0.75))",
                border: "1px solid rgba(125,211,252,0.85)",
                boxShadow: "0 2px 4px rgba(14,165,233,0.25)",
              }}
              animate={{
                y: [0, -3, 0, -3, 0],
                scale: [1, 1.08, 1, 1.05, 1],
                opacity: [0.85, 1, 0.9, 1, 0.85],
              }}
              transition={{
                duration: 1.4,
                delay: b.d,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          {/* Small popping bubbles drifting upward */}
          {[
            { l: 14, s: 7, d: 0.1 },
            { l: 40, s: 6, d: 0.5 },
            { l: 66, s: 8, d: 0.9 },
          ].map((b, i) => (
            <motion.div
              key={`pop-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${b.l}px`,
                top: "20px",
                width: `${b.s}px`,
                height: `${b.s}px`,
                background:
                  "radial-gradient(circle at 35% 30%, rgba(255,255,255,1), rgba(224,242,254,0.6))",
                border: "1px solid rgba(125,211,252,0.7)",
              }}
              animate={{ y: [0, -28, -40], opacity: [0, 1, 0], scale: [0.5, 1, 0.6] }}
              transition={{ duration: 1.6, delay: b.d, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ──────────────────────────────────────────────────────────────────────────
// PlantSeedProp — terracotta pot on the GROUND beside character. Seed drops
// in, stem grows, flower blooms. Anchored at column level, NOT character.
// ──────────────────────────────────────────────────────────────────────────
export const PlantSeedProp = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="plant"
        className="absolute pointer-events-none z-30"
        style={{
          left: "50%",
          bottom: "10px", // sits on the ground, low in the column
          width: "70px",
          height: "110px",
          transform: "translateX(-50%)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
      >
        {/* Pot body */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 shadow-lg"
          style={{
            width: "50px",
            height: "34px",
            background: "linear-gradient(180deg, #d97243 0%, #b45309 60%, #7c2d12 100%)",
            borderRadius: "4px 4px 10px 10px",
            border: "2px solid #5a1e08",
            clipPath: "polygon(8% 0, 92% 0, 84% 100%, 16% 100%)",
          }}
        />
        {/* Pot rim */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: "30px",
            width: "56px",
            height: "10px",
            background: "linear-gradient(180deg, #ea580c 0%, #b45309 100%)",
            borderRadius: "3px",
            border: "2px solid #5a1e08",
          }}
        />
        {/* Soil mound */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: "32px",
            width: "44px",
            height: "7px",
            background: "linear-gradient(180deg, #5a2a18 0%, #2f1208 100%)",
            borderRadius: "4px 4px 2px 2px",
          }}
        />
        {/* Seed dropping in */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: "7px",
            height: "9px",
            background: "linear-gradient(180deg, #a16207, #713f12)",
            border: "1px solid #422006",
          }}
          initial={{ bottom: "100px", opacity: 1, rotate: 0 }}
          animate={{
            bottom: ["100px", "38px", "38px", "38px"],
            opacity: [1, 1, 1, 0],
            rotate: [0, 360, 360, 360],
          }}
          transition={{ duration: 2.2, times: [0, 0.32, 0.5, 0.55], ease: "easeIn" }}
        />
        {/* Stem growing */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: "37px",
            width: "5px",
            background: "linear-gradient(180deg, #16a34a 0%, #15803d 100%)",
            borderRadius: "999px",
            transformOrigin: "bottom center",
            boxShadow: "0 0 4px rgba(34,197,94,0.5)",
          }}
          initial={{ height: 0 }}
          animate={{ height: [0, 0, 36, 38] }}
          transition={{ duration: 2.2, times: [0, 0.5, 0.85, 1], ease: "easeOut" }}
        />
        {/* Left leaf */}
        <motion.div
          className="absolute"
          style={{
            left: "calc(50% - 14px)",
            bottom: "56px",
            width: "12px",
            height: "8px",
            background: "linear-gradient(135deg, #4ade80, #16a34a)",
            borderRadius: "999px 0 999px 0",
            transform: "rotate(20deg)",
            transformOrigin: "right center",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 0, 1] }}
          transition={{ duration: 2.2, times: [0, 0.7, 0.85], ease: "backOut" }}
        />
        {/* Right leaf */}
        <motion.div
          className="absolute"
          style={{
            left: "calc(50% + 2px)",
            bottom: "62px",
            width: "12px",
            height: "8px",
            background: "linear-gradient(135deg, #4ade80, #16a34a)",
            borderRadius: "0 999px 0 999px",
            transform: "rotate(-20deg)",
            transformOrigin: "left center",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 0, 1] }}
          transition={{ duration: 2.2, times: [0, 0.74, 0.88], ease: "backOut" }}
        />
        {/* Flower head */}
        <motion.div
          className="absolute left-1/2"
          style={{ bottom: "72px", transform: "translateX(-50%)", width: "26px", height: "26px" }}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: [0, 0, 0, 1.2, 1], rotate: [-30, -30, -30, 10, 0] }}
          transition={{ duration: 2.2, times: [0, 0.78, 0.85, 0.95, 1], ease: "backOut" }}
        >
          {[0, 72, 144, 216, 288].map((deg, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: "13px",
                height: "13px",
                background: "linear-gradient(180deg, #fda4af, #f43f5e)",
                transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-7px)`,
                border: "1.5px solid #be123c",
                boxShadow: "0 1px 2px rgba(190,18,60,0.4)",
              }}
            />
          ))}
          <div
            className="absolute left-1/2 top-1/2 rounded-full bg-amber-400"
            style={{
              width: "9px",
              height: "9px",
              transform: "translate(-50%, -50%)",
              border: "1.5px solid #b45309",
              boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.15)",
            }}
          />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ──────────────────────────────────────────────────────────────────────────
// ThrowBallProp — large baseball appears in character's hand, winds up,
// then arcs across the screen toward the knight with rotation + a motion
// trail. Anchored at column level so the throw goes ALL THE WAY across.
// ──────────────────────────────────────────────────────────────────────────
export const ThrowBallProp = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="ball"
        className="absolute pointer-events-none z-50"
        style={{
          left: "50%",
          bottom: "100px", // character hand height
          width: "26px",
          height: "26px",
          transform: "translateX(-50%)",
        }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{
          opacity: [0, 1, 1, 1, 1, 0],
          scale: [0.3, 1, 1.05, 1, 0.85, 0.6],
          // wind back (negative x = toward character body), then big arc right & up, then descend
          x: [0, -28, -32, 60, 160, 240],
          y: [10, 0, -2, -40, -25, 20],
          rotate: [0, -25, -30, 360, 720, 900],
        }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 1.7,
          times: [0, 0.18, 0.32, 0.6, 0.85, 1],
          ease: "easeOut",
        }}
      >
        {/* Baseball */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 28%, #ffffff 0%, #f1f5f9 55%, #94a3b8 100%)",
            border: "1.5px solid #475569",
            boxShadow: "0 3px 6px rgba(0,0,0,0.35), inset -2px -2px 0 rgba(0,0,0,0.15)",
          }}
        />
        {/* Red stitch curves */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 26 26">
          <path
            d="M 5 7 Q 13 12 5 19"
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
          <path
            d="M 21 7 Q 13 12 21 19"
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
        </svg>
      </motion.div>
    )}
  </AnimatePresence>
);


