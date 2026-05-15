import { motion } from "framer-motion";
import { Mic, Sparkles, TrendingUp } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Mic,
    title: "Students read aloud.",
    body: "Right in the browser. No app to install, no microphone uploads. The page listens.",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "Four ML models score it live.",
    body: "Phoneme inference, miscue analysis, prosody, plateau detection — all on-device, in milliseconds.",
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "Teachers see the truth.",
    body: "WCPM, mastery heatmaps, at-risk flags, and a generated intervention queue — every morning.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="relative bg-[hsl(270_30%_98%)] py-28 md:py-36">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            How it works
          </p>
          <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
            From a child reading aloud
            <br />
            <span className="text-muted-foreground">to a teacher's morning brief.</span>
          </h2>
        </motion.div>

        <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.9,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative grid grid-cols-1 items-center gap-6 rounded-3xl border border-border bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-[0_24px_60px_-20px_hsl(270_70%_55%/0.25)] md:grid-cols-[auto_1fr_auto] md:p-10"
              >
                <div className="flex items-center gap-6">
                  <span className="text-5xl font-bold tabular-nums text-muted-foreground/30 md:text-7xl">
                    {s.n}
                  </span>
                </div>
                <div>
                  <h3 className="mb-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {s.title}
                  </h3>
                  <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                    {s.body}
                  </p>
                </div>
                <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(280_80%_50%)] text-white shadow-[0_10px_30px_-10px_hsl(270_70%_55%/0.5)] transition-transform duration-500 group-hover:scale-110 md:flex">
                  <Icon className="h-7 w-7" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
