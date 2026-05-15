import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Gamepad2, Brain, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RPGShowcase } from "@/components/landing/RPGShowcase";

export const GameModeSection = () => {
  return (
    <section className="relative overflow-hidden bg-[hsl(270_45%_8%)] py-24 text-white md:py-32">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 50% at 20% 30%, hsl(280 80% 35% / 0.5), transparent 60%)," +
            "radial-gradient(40% 40% at 80% 70%, hsl(48 100% 55% / 0.18), transparent 60%)",
        }}
      />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70">
            <Gamepad2 className="h-3 w-3" />
            Game mode · K–5
          </span>
          <h2 className="mt-6 text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Kids think it's a game.
            <br />
            <span className="bg-gradient-to-r from-[hsl(48_100%_75%)] to-[hsl(35_100%_60%)] bg-clip-text text-transparent">
              Teachers get NAEP-grade data.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/65 md:text-lg">
            The same ML pipeline that scores your fluency assessments runs underneath every
            boss fight. No new device, no extra prep, no testing fatigue.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-[0_20px_80px_-20px_hsl(270_80%_30%/0.6)]"
          >
            <RPGShowcase variant="hero" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <Bullet
              icon={<Brain className="h-5 w-5" />}
              title="Same voice. Same pipeline."
              body="Phoneme inference, miscues, prosody, and WCPM scored mid-battle — not in a separate test session."
            />
            <Bullet
              icon={<Gamepad2 className="h-5 w-5" />}
              title="Engagement is the moat."
              body="Reading aloud feels like casting spells. Time-on-task quadruples vs. traditional assessment."
            />
            <Bullet
              icon={<Users className="h-5 w-5" />}
              title="Two interfaces, one source of truth."
              body="Students see boss fights and rewards. Teachers see standards, growth curves, and intervention triggers."
            />

            <div className="pt-2">
              <Button
                size="lg"
                asChild
                className="group h-12 rounded-full bg-white px-7 text-sm font-semibold text-[hsl(270_45%_8%)] hover:bg-white"
              >
                <Link to="/demos">
                  See game mode
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Bullet = ({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) => (
  <div className="flex gap-4">
    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[hsl(48_100%_70%)]">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-white/65 leading-relaxed">{body}</p>
    </div>
  </div>
);
