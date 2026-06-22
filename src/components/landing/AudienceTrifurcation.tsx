import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, GraduationCap, Building2, ArrowRight } from "lucide-react";

interface Door {
  to: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  Icon: typeof Heart;
  accent: string; // hsl color value used for the icon halo + arrow
}

const DOORS: Door[] = [
  {
    to: "/for-families",
    eyebrow: "For Families & Daycares",
    title: "Meet Benny.",
    body: "Read-along adventures for ages 2–5. Built for parents and daycare centers.",
    cta: "Explore Benny",
    Icon: Heart,
    accent: "48 100% 60%",
  },
  {
    to: "/demos",
    eyebrow: "For K–12 Schools",
    title: "Adaptive literacy RPG.",
    body: "AI-powered fluency, comprehension, and intervention — while students play.",
    cta: "See the demo",
    Icon: GraduationCap,
    accent: "270 90% 70%",
  },
  {
    to: "/pricing",
    eyebrow: "For Districts",
    title: "NAEP-grade ML.",
    body: "$5–7 per student / year. FERPA, COPPA & SOC 2 aligned. iPad & Chromebook ready.",
    cta: "View pricing",
    Icon: Building2,
    accent: "200 90% 65%",
  },
];

export const AudienceTrifurcation = () => {
  return (
    <section
      aria-label="Choose your path"
      className="relative bg-[hsl(270_45%_6%)] py-24 text-white md:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, hsl(270 80% 25% / 0.6), transparent 70%)",
        }}
      />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-4 text-xs uppercase tracking-[0.24em] text-white/50">
            Choose your path
          </p>
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            One platform.{" "}
            <span className="bg-gradient-to-r from-[hsl(48_100%_75%)] to-[hsl(35_100%_60%)] bg-clip-text text-transparent">
              Three doors in.
            </span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {DOORS.map((d, i) => {
            const Icon = d.Icon;
            return (
              <motion.div
                key={d.to}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={d.to}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-all hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
                  style={{
                    boxShadow: `0 20px 60px -30px hsl(${d.accent} / 0.5)`,
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl transition-opacity group-hover:opacity-70"
                    style={{ background: `hsl(${d.accent} / 0.4)` }}
                  />

                  <div
                    className="relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: `hsl(${d.accent} / 0.15)`,
                      color: `hsl(${d.accent})`,
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <p className="relative mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                    {d.eyebrow}
                  </p>
                  <h3 className="relative mb-3 text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                    {d.title}
                  </h3>
                  <p className="relative mb-8 text-sm leading-relaxed text-white/65 md:text-base">
                    {d.body}
                  </p>

                  <span
                    className="relative mt-auto inline-flex items-center gap-2 text-sm font-semibold"
                    style={{ color: `hsl(${d.accent})` }}
                  >
                    {d.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
