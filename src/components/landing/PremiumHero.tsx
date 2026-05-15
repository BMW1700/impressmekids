import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RPGShowcase } from "@/components/landing/RPGShowcase";

const HEADLINE = ["AI-Powered", "Literacy", "for", "every", "classroom."];

export const PremiumHero = () => {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[hsl(270_45%_8%)] text-white">
      {/* Animated mesh gradient — pure CSS, no WebGL */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 20%, hsl(270 80% 35% / 0.9), transparent 60%)," +
              "radial-gradient(50% 40% at 80% 10%, hsl(48 100% 55% / 0.35), transparent 60%)," +
              "radial-gradient(70% 60% at 70% 90%, hsl(280 90% 40% / 0.7), transparent 60%)," +
              "radial-gradient(40% 30% at 10% 90%, hsl(260 70% 30% / 0.6), transparent 60%)",
          }}
        />
        {/* Slow drifting orbs */}
        {!reduce && (
          <>
            <motion.div
              className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full"
              style={{ background: "radial-gradient(closest-side, hsl(270 90% 60% / 0.45), transparent)" }}
              animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-40 -right-32 h-[44rem] w-[44rem] rounded-full"
              style={{ background: "radial-gradient(closest-side, hsl(48 100% 55% / 0.25), transparent)" }}
              animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
              transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
        {/* Top + bottom vignette for depth */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[hsl(270_45%_6%)] to-transparent" />
      </div>

      <div className="container relative mx-auto px-4 pt-28 pb-32 md:pt-36 md:pb-40">
        <div className="mx-auto max-w-5xl text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-[hsl(48_100%_70%)]" />
            <span>NABU LEARN · K–12 LITERACY PLATFORM</span>
          </motion.div>

          {/* Kinetic headline */}
          <h1 className="mx-auto max-w-5xl text-balance font-bold leading-[0.95] tracking-tight text-5xl md:text-7xl lg:text-[5.5rem]">
            {HEADLINE.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.9,
                  delay: 0.15 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`mr-[0.25em] inline-block ${
                  word === "Literacy"
                    ? "bg-gradient-to-r from-[hsl(48_100%_75%)] via-[hsl(48_100%_60%)] to-[hsl(35_100%_60%)] bg-clip-text text-transparent"
                    : ""
                }`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-8 max-w-2xl text-balance text-lg text-white/70 md:text-xl"
          >
            Four proprietary ML models assess fluency, predict at-risk readers, and
            deliver targeted intervention — while students play an RPG adventure.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              asChild
              className="group h-14 rounded-full bg-white px-8 text-base font-semibold text-[hsl(270_45%_8%)] shadow-[0_8px_32px_-4px_hsl(48_100%_60%/0.4)] transition-all hover:scale-[1.02] hover:bg-white"
            >
              <Link to="/demos">
                Try the interactive demo
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-14 rounded-full border-white/20 bg-white/5 px-8 text-base font-medium text-white backdrop-blur hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              <Link to="/auth">Request a pilot</Link>
            </Button>
          </motion.div>

          {/* Quiet trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="mt-10 text-xs uppercase tracking-[0.2em] text-white/40"
          >
            FERPA · COPPA · SOC 2 aligned · $5–7 per student / year
          </motion.p>

          {/* RPG live battle showcase */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden shadow-[0_20px_80px_-20px_hsl(270_80%_30%/0.6)]"
          >
            <RPGShowcase variant="hero" />
            <div className="px-6 pb-5 pt-1 text-xs uppercase tracking-[0.2em] text-white/40">
              Live in-game · K–5 RPG mode
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
