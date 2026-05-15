import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: 44, suffix: "", label: "English phonemes covered" },
  { value: 4, suffix: "", label: "Proprietary ML models" },
  { value: 280, suffix: "+", label: "Decodability-aligned stories" },
  { value: 0, prefix: "$", suffix: "", label: "Microphone uploads. Ever." },
];

const Counter = ({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
      return controls.stop;
    }
  }, [inView, to, mv]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

export const OutcomesStrip = () => {
  return (
    <section className="relative overflow-hidden bg-[hsl(270_45%_8%)] py-24 text-white md:py-32">
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 0%, hsl(270 80% 30% / 0.6), transparent 60%)",
        }}
      />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="text-center md:text-left md:px-6 md:border-l md:border-white/10 md:first:border-l-0"
            >
              <div className="mb-3 text-5xl font-bold tracking-tight tabular-nums md:text-6xl lg:text-7xl">
                <Counter to={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <p className="text-sm leading-snug text-white/55 md:text-base">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
