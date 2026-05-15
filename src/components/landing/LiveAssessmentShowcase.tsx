import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Mic, CheckCircle2, AlertTriangle, Activity, ShieldCheck } from "lucide-react";

/**
 * LiveAssessmentShowcase
 * Buyer-facing hero visualization: child reads aloud → AI transcribes →
 * miscues / prosody flagged → teacher metrics card materializes.
 * Pure presentation. No backend, no audio. Loops while visible.
 */

type WordState = "pending" | "correct" | "miscue" | "prosody";

interface Sample {
  sentence: string[];
  miscueIdx: number;
  miscueLabel: string;
  prosodyIdx: number;
  wcpm: number;
  accuracy: number;
  phoneme: string;
}

const SAMPLES: Sample[] = [
  {
    sentence: ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog."],
    miscueIdx: 1,
    miscueLabel: "miscue · /kw/ → /k/",
    prosodyIdx: 7,
    wcpm: 87,
    accuracy: 94,
    phoneme: "/kw/",
  },
  {
    sentence: ["She", "sells", "seashells", "by", "the", "seashore", "today."],
    miscueIdx: 2,
    miscueLabel: "miscue · blend /sh/",
    prosodyIdx: 5,
    wcpm: 102,
    accuracy: 96,
    phoneme: "/sh/",
  },
  {
    sentence: ["The", "tall", "giraffe", "reached", "for", "the", "highest", "leaf."],
    miscueIdx: 2,
    miscueLabel: "miscue · soft /g/",
    prosodyIdx: 6,
    wcpm: 95,
    accuracy: 92,
    phoneme: "/dʒ/",
  },
];

type Phase = "listen" | "transcribe" | "analyze" | "score" | "reset";

const PHASE_DURATIONS: Record<Phase, number> = {
  listen: 1500,
  transcribe: 2400,
  analyze: 1800,
  score: 2400,
  reset: 700,
};

export const LiveAssessmentShowcase = () => {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("listen");
  const [revealedCount, setRevealedCount] = useState(0);

  const sample = SAMPLES[sampleIdx];

  // Pause when off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Phase machine
  useEffect(() => {
    if (reduce || !visible) return;
    const t = setTimeout(() => {
      setPhase((p) => {
        const order: Phase[] = ["listen", "transcribe", "analyze", "score", "reset"];
        const next = order[(order.indexOf(p) + 1) % order.length];
        if (next === "listen") {
          setSampleIdx((i) => (i + 1) % SAMPLES.length);
          setRevealedCount(0);
        }
        return next;
      });
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(t);
  }, [phase, visible, reduce]);

  // Word-by-word reveal during transcribe
  useEffect(() => {
    if (phase !== "transcribe") return;
    const total = sample.sentence.length;
    const interval = PHASE_DURATIONS.transcribe / (total + 1);
    let i = 0;
    setRevealedCount(0);
    const tick = setInterval(() => {
      i += 1;
      setRevealedCount(i);
      if (i >= total) clearInterval(tick);
    }, interval);
    return () => clearInterval(tick);
  }, [phase, sample]);

  const wordStateFor = (idx: number): WordState => {
    if (phase === "listen") return "pending";
    if (phase === "transcribe") return idx < revealedCount ? "correct" : "pending";
    // analyze, score, reset
    if (idx === sample.miscueIdx) return "miscue";
    if (idx === sample.prosodyIdx) return "prosody";
    return "correct";
  };

  const showMetrics = phase === "score" || (reduce && true);
  const showAnalysisFlags = phase === "analyze" || phase === "score";

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl bg-gradient-to-br from-[hsl(270_50%_12%)] to-[hsl(270_45%_8%)] overflow-hidden"
      style={{ minHeight: 380 }}
    >
      {/* Subtle grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 p-6 md:p-8">
        {/* LEFT: listening + transcript */}
        <div className="flex flex-col gap-5 min-h-[320px]">
          {/* Status chip */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-[hsl(270_70%_30%)]">
              <Mic className="h-4 w-4 text-white" />
              {!reduce && (phase === "listen" || phase === "transcribe") && (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-full border border-[hsl(48_100%_70%)]"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-full border border-[hsl(48_100%_70%)]"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                  />
                </>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                {phase === "listen" && "Listening"}
                {phase === "transcribe" && "Transcribing"}
                {phase === "analyze" && "Analyzing"}
                {phase === "score" && "Report ready"}
                {phase === "reset" && "Next reader"}
              </span>
              <span className="text-sm text-white/85 font-medium">
                Student · Grade 2 · Oral reading fluency
              </span>
            </div>
          </div>

          {/* Waveform — visible during listen */}
          <AnimatePresence>
            {phase === "listen" && !reduce && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 h-10"
              >
                {Array.from({ length: 32 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-1 rounded-full bg-[hsl(48_100%_60%)]"
                    animate={{ height: [6, 22 + (i % 5) * 4, 6] }}
                    transition={{
                      duration: 0.8 + (i % 4) * 0.15,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.04,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript */}
          <div className="flex-1 rounded-xl bg-black/30 border border-white/5 p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-3">
              Live transcript
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-3 text-xl md:text-2xl font-medium leading-relaxed">
              {sample.sentence.map((word, i) => {
                const state = wordStateFor(i);
                const visible = phase !== "listen" && (phase !== "transcribe" || i < revealedCount);
                const color =
                  state === "miscue"
                    ? "text-[hsl(35_100%_65%)]"
                    : state === "prosody"
                    ? "text-white/85 underline decoration-dotted decoration-[hsl(48_100%_60%)] underline-offset-4"
                    : state === "correct"
                    ? "text-[hsl(140_60%_70%)]"
                    : "text-white/30";
                return (
                  <motion.span
                    key={`${sampleIdx}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{
                      opacity: visible ? 1 : 0.15,
                      y: 0,
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`inline-flex items-center gap-1 transition-colors duration-500 ${color}`}
                  >
                    {word}
                    {showAnalysisFlags && state === "miscue" && (
                      <AlertTriangle className="h-3.5 w-3.5 text-[hsl(35_100%_65%)]" />
                    )}
                    {showAnalysisFlags && state === "correct" && phase === "analyze" && (
                      <CheckCircle2 className="h-3 w-3 text-[hsl(140_60%_60%)]/70" />
                    )}
                  </motion.span>
                );
              })}
            </div>

            {/* Inline annotation */}
            <AnimatePresence>
              {showAnalysisFlags && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mt-4 flex flex-wrap gap-2 text-xs"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(35_100%_55%/0.15)] border border-[hsl(35_100%_55%/0.3)] px-2.5 py-1 text-[hsl(35_100%_75%)]">
                    <AlertTriangle className="h-3 w-3" />
                    {sample.miscueLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(48_100%_60%/0.12)] border border-[hsl(48_100%_60%/0.25)] px-2.5 py-1 text-[hsl(48_100%_80%)]">
                    <Activity className="h-3 w-3" />
                    prosody · flat intonation
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: teacher metrics card */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={`metrics-${sampleIdx}-${showMetrics ? "on" : "off"}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: showMetrics || reduce ? 1 : 0.15,
                x: showMetrics || reduce ? 0 : 12,
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl bg-white/[0.04] border border-white/10 p-5 backdrop-blur-sm"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">
                Teacher report
              </div>

              <div className="space-y-4">
                <Metric label="WCPM" value={sample.wcpm} suffix="" animate={showMetrics && !reduce} />
                <Metric
                  label="Accuracy"
                  value={sample.accuracy}
                  suffix="%"
                  animate={showMetrics && !reduce}
                />

                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-2">
                    Phoneme mastery
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-white/85">{sample.phoneme}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-[hsl(35_100%_70%)]">
                      <AlertTriangle className="h-3 w-3" />
                      needs practice
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-2">
                    Risk flag
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(140_50%_40%/0.2)] border border-[hsl(140_50%_50%/0.4)] px-2.5 py-1 text-xs text-[hsl(140_60%_75%)]">
                    <ShieldCheck className="h-3 w-3" />
                    Low · on track
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-white/35 text-right">
            Generated in real time · no test setup
          </div>
        </div>
      </div>
    </div>
  );
};

const Metric = ({
  label,
  value,
  suffix,
  animate,
}: {
  label: string;
  value: number;
  suffix: string;
  animate: boolean;
}) => {
  const [display, setDisplay] = useState(animate ? 0 : value);
  useEffect(() => {
    if (!animate) {
      setDisplay(value);
      return;
    }
    setDisplay(0);
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);

  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</span>
      <span className="font-bold text-3xl text-white tabular-nums">
        {display}
        <span className="text-base text-white/60 font-medium">{suffix}</span>
      </span>
    </div>
  );
};
