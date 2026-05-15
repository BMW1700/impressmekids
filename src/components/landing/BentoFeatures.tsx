import { motion } from "framer-motion";
import { Brain, Gamepad2, LineChart, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  {
    title: "AURA",
    eyebrow: "Adaptive Reading Assessment",
    body: "Browser-native speech analysis grades fluency in real time — WCPM, miscues, prosody — with no microphone uploads, no waiting, no per-test cost.",
    icon: Brain,
    accent: "from-[hsl(270_80%_55%)] to-[hsl(280_90%_45%)]",
    span: "md:col-span-2 md:row-span-2",
    href: "/demos",
  },
  {
    title: "LexiQuest",
    eyebrow: "RPG Reading Adventure",
    body: "Students battle bosses by reading. Fluency drives damage. They play. We measure.",
    icon: Gamepad2,
    accent: "from-[hsl(48_100%_60%)] to-[hsl(35_100%_55%)]",
    span: "md:col-span-1",
    href: "/demos",
  },
  {
    title: "Teacher Insights",
    eyebrow: "Classroom Intelligence",
    body: "Plateau detection, phoneme heatmaps, intervention queues. Built for the people who actually teach.",
    icon: LineChart,
    accent: "from-[hsl(217_91%_60%)] to-[hsl(213_93%_55%)]",
    span: "md:col-span-1",
    href: "/demos",
  },
  {
    title: "SSVRS Safety",
    eyebrow: "Integrated Student Safety",
    body: "Immutable audit logs, four-tier escalation, cross-role alerting — the only literacy platform with a real safety system inside it.",
    icon: ShieldCheck,
    accent: "from-[hsl(160_84%_39%)] to-[hsl(162_79%_45%)]",
    span: "md:col-span-2",
    href: "/demos",
  },
];

export const BentoFeatures = () => {
  return (
    <section className="relative overflow-hidden bg-[hsl(270_45%_6%)] py-28 text-white md:py-36">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-white/40">
            What's inside
          </p>
          <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            One platform. Four reasons schools sign.
          </h2>
        </motion.div>

        <div className="mx-auto grid max-w-6xl auto-rows-[18rem] grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-500 hover:border-white/25 hover:bg-white/[0.06] ${c.span}`}
              >
                {/* Gradient glow on hover */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br ${c.accent} opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-30`}
                />
                {/* Animated edge gradient */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${c.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08]`}
                />

                <div className="relative flex h-full flex-col">
                  <div
                    className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${c.accent} shadow-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">
                    {c.eyebrow}
                  </p>
                  <h3 className="mb-3 text-2xl font-semibold tracking-tight md:text-3xl">
                    {c.title}
                  </h3>
                  <p className="text-pretty text-base leading-relaxed text-white/65 md:text-[0.98rem]">
                    {c.body}
                  </p>
                  <Link
                    to={c.href}
                    className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-white/70 transition-colors hover:text-white"
                  >
                    Explore
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
