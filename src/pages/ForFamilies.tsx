import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Heart, BookOpen, Mic } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BennyVideoHero } from "@/components/landing/BennyVideoHero";
import { SeriesTitle } from "@/components/landing/SeriesTitle";
import bennyCelebrate from "@/assets/benny-book-ears.png.asset.json";
import bennyIdle from "@/assets/benny-book-ears.png.asset.json";
import bennySad from "@/assets/benny-book-ears.png.asset.json";

const STEPS = [
  {
    Icon: BookOpen,
    title: "Watch the scene",
    body: "Sir Bookears' adventure unfolds in cinematic clips — like a Pixar short.",
  },
  {
    Icon: Mic,
    title: "Say the word",
    body: "When Sir Bookears needs help, your child says the word out loud. The mic listens.",
  },
  {
    Icon: Sparkles,
    title: "Sir Bookears' world responds",
    body: "Bridges appear. Doors unlock. The story moves forward because they read.",
  },
];

const BENNY_FRAMES = [
  { src: bennyCelebrate.url, caption: "Made it to Grandma's!" },
  { src: bennyIdle.url, caption: "Ready for the next adventure." },
  { src: bennySad.url, caption: "Help me… what's the word?" },
];

const ForFamilies = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(270_45%_6%)] text-white">
      <Helmet>
        <title>Sir Bookears' Reading Adventures — YubiLearn for Families</title>
        <meta
          name="description"
          content="Meet Sir Bookears. Read-along cinematic adventures for ages 2–5. Built for parents and daycare centers. No ads, COPPA-safe."
        />
        <link rel="canonical" href="https://yubilearn.com/for-families" />
        <meta property="og:title" content="Sir Bookears' Reading Adventures — YubiLearn for Families" />
        <meta
          property="og:description"
          content="Cinematic read-along adventures for ages 2–5. The first reading app your child asks for by name."
        />
        <meta property="og:url" content="https://yubilearn.com/for-families" />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* ===== Hero ===== */}
        <section className="relative isolate overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(50% 40% at 50% 0%, hsl(48 100% 55% / 0.18), transparent 70%)," +
                "radial-gradient(70% 60% at 50% 100%, hsl(270 80% 25% / 0.6), transparent 70%)",
            }}
          />
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mb-10 max-w-3xl text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(48_100%_70%)]" />
                <span>YUBI LEARN · AGES 2–5</span>
              </div>
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                Reading. With their{" "}
                <span className="bg-gradient-to-r from-[hsl(48_100%_75%)] via-[hsl(48_100%_60%)] to-[hsl(35_100%_60%)] bg-clip-text text-transparent">
                  first best friend.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-white/70 md:text-xl">
                Meet Sir Bookears as he takes you on an immersive early literacy adventure.
              </p>
            </motion.div>

            <SeriesTitle className="mb-6" />

            <BennyVideoHero />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button
                size="lg"
                asChild
                className="group h-14 rounded-full bg-white px-8 text-base font-semibold text-[hsl(270_45%_8%)] hover:bg-white"
              >
                <Link to="/game">
                  Start Sir Bookears' first adventure
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-14 rounded-full border-white/20 bg-white/5 px-8 text-base font-medium text-white backdrop-blur hover:border-white/40 hover:bg-white/10 hover:text-white"
              >
                <a href="#for-daycares">For daycare directors</a>
              </Button>
            </motion.div>

            <p className="mt-8 text-center text-xs uppercase tracking-[0.2em] text-white/40">
              Ages 2–5 · No ads · COPPA-safe
            </p>
          </div>
        </section>

        {/* ===== Meet Sir Bookears ===== */}
        <section className="border-t border-white/5 py-24 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-4 text-xs uppercase tracking-[0.24em] text-white/50">
                Meet Sir Bookears
              </p>
              <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                A friend kids{" "}
                <span className="bg-gradient-to-r from-[hsl(48_100%_75%)] to-[hsl(35_100%_60%)] bg-clip-text text-transparent">
                  remember by name.
                </span>
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {BENNY_FRAMES.map((frame, i) => (
                <motion.figure
                  key={frame.caption}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
                >
                  <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-[hsl(48_100%_55%/0.15)] to-[hsl(270_80%_30%/0.3)]">
                    <img
                      src={frame.src}
                      alt={frame.caption}
                      className="h-full w-full object-contain p-6"
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="px-6 py-4 text-sm text-white/70">
                    {frame.caption}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>

        {/* ===== How it works ===== */}
        <section className="border-t border-white/5 bg-[hsl(270_45%_8%)] py-24 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-4 text-xs uppercase tracking-[0.24em] text-white/50">
                How Pre-K works
              </p>
              <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                Three steps. No menus.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => {
                const Icon = step.Icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-8"
                  >
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(48_100%_55%/0.15)] text-[hsl(48_100%_70%)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                      Step {i + 1}
                    </p>
                    <h3 className="mb-3 text-xl font-bold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/65">
                      {step.body}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== Parents / Daycares split ===== */}
        <section id="for-daycares" className="border-t border-white/5 py-24 md:py-28">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7 }}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-[hsl(48_100%_55%/0.08)] to-transparent p-10"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(48_100%_55%/0.15)] text-[hsl(48_100%_70%)]">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
                  For parents
                </h3>
                <p className="mb-6 text-white/70">
                  Family-friendly pricing. Cancel anytime. No ads, no third-party
                  tracking, no in-app upsells aimed at your child.
                </p>
                <ul className="mb-8 space-y-2 text-sm text-white/65">
                  <li>· Works on iPad, iPhone, and any modern browser</li>
                  <li>· Multiple children on one family account</li>
                  <li>· Weekly progress notes — no spreadsheets</li>
                </ul>
                <Button
                  asChild
                  className="rounded-full bg-white px-6 text-sm font-semibold text-[hsl(270_45%_8%)] hover:bg-white"
                >
                  <Link to="/game">Start free</Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-[hsl(270_90%_60%/0.08)] to-transparent p-10"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(270_90%_60%/0.15)] text-[hsl(270_90%_75%)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
                  For daycares & Pre-K centers
                </h3>
                <p className="mb-6 text-white/70">
                  Center licenses with multi-classroom rosters and director
                  reporting. Simple onboarding — no IT department required.
                </p>
                <ul className="mb-8 space-y-2 text-sm text-white/65">
                  <li>· Classroom-by-classroom progress dashboards</li>
                  <li>· Parent-share links for weekly milestones</li>
                  <li>· Volume pricing for centers and franchise groups</li>
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 px-6 text-sm font-medium text-white backdrop-blur hover:border-white/40 hover:bg-white/10 hover:text-white"
                >
                  <Link to="/pricing">Talk to us</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== Safety strip ===== */}
        <section className="border-t border-white/5 bg-[hsl(270_45%_8%)] py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center md:flex-row md:text-left">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[hsl(48_100%_55%/0.15)] text-[hsl(48_100%_70%)]">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  Built for kids, not advertisers
                </p>
                <p className="text-sm leading-relaxed text-white/75 md:text-base">
                  COPPA-aligned. No ads. No third-party tracking. Voice never
                  leaves the device unless a parent enables progress sharing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Closing CTA ===== */}
        <section className="relative overflow-hidden py-28 md:py-36">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 50%, hsl(48 100% 55% / 0.22), transparent 70%)," +
                "radial-gradient(40% 40% at 80% 20%, hsl(270 80% 35% / 0.6), transparent 60%)",
            }}
          />
          <div className="container relative mx-auto px-4 text-center">
            <h2 className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Press play. Watch them read.
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="group h-14 rounded-full bg-white px-8 text-base font-semibold text-[hsl(270_45%_8%)] hover:bg-white"
              >
                <Link to="/game">
                  Start Sir Bookears' first adventure
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForFamilies;
