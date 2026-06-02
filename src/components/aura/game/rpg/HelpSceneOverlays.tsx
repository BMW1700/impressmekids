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

