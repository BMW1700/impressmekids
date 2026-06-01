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
// with a gray duct-tape wrap during the 'fix' phase.
export const BrokenBatProp = ({ phase }: { phase: HelpPhase }) => {
  const broken = phase === "setup" || phase === "approach";
  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{ right: "-8%", bottom: "6%", width: "70%", height: "30%" }}
    >
      <div className="relative w-full h-full" style={{ transform: "rotate(-12deg)" }}>
        {/* Handle half (left) */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2"
          style={{ width: "44%", height: "60%", transformOrigin: "right center" }}
          animate={
            broken
              ? { x: -4, rotate: -8 }
              : { x: 0, rotate: 0 }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 rounded-l-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-700 shadow">
            {/* Grip wrap */}
            <div className="absolute left-[5%] inset-y-[20%] w-[35%] rounded-l-full bg-gradient-to-r from-slate-900 to-slate-700" />
          </div>
          {/* Jagged break edge on right */}
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
              ? { x: 4, rotate: 8 }
              : { x: 0, rotate: 0 }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 rounded-r-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 shadow">
            <div className="absolute top-[15%] right-[12%] w-[18%] h-[18%] rounded-full bg-amber-300/60 blur-[1px]" />
          </div>
          {/* Jagged break edge on left */}
          {broken && (
            <div
              className="absolute left-[-2px] top-0 bottom-0 w-[6%] bg-amber-700"
              style={{ clipPath: "polygon(100% 0, 0 20%, 100% 40%, 0 60%, 100% 80%, 0 100%, 100% 100%)" }}
            />
          )}
        </motion.div>

        {/* Duct-tape wrap appearing across the joint during 'fix' and 'happy' */}
        <AnimatePresence>
          {(phase === "fix" || phase === "happy") && (
            <motion.div
              key="tape-wrap"
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: "38%", width: "20%", height: "92%" }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="absolute inset-0 rounded-sm bg-gradient-to-b from-slate-400 via-slate-500 to-slate-700 shadow">
                {/* Tape texture lines */}
                <div className="absolute inset-y-[18%] left-[20%] w-[8%] bg-slate-300/50" />
                <div className="absolute inset-y-[18%] right-[20%] w-[8%] bg-slate-300/50" />
                <div className="absolute inset-x-[15%] top-[10%] h-[6%] bg-slate-200/40" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Happy lift wobble */}
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
export const DuctTapeProp = ({ phase }: { phase: HelpPhase }) => {
  // Tape only shows during the approach + fix; disappears for 'happy'.
  if (phase === "happy") return null;
  return (
    <div
      className="absolute pointer-events-none z-30"
      style={{ right: "8%", bottom: "26%", width: "20%", height: "20%" }}
    >
      <motion.div
        className="relative w-full h-full"
        animate={phase === "fix" ? { rotate: [0, -20, -40, -60] } : { rotate: 0 }}
        transition={phase === "fix" ? { duration: 1.2, ease: "linear" } : { duration: 0.3 }}
      >
        {/* Outer roll */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-400 via-slate-500 to-slate-700 shadow-md" />
        {/* Inner hole */}
        <div className="absolute inset-[30%] rounded-full bg-slate-100 shadow-inner" />
        {/* Side highlight */}
        <div className="absolute top-[10%] left-[18%] w-[28%] h-[16%] rounded-full bg-white/50 blur-[1px]" />
      </motion.div>
    </div>
  );
};
