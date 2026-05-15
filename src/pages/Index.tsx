import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { PremiumHero } from "@/components/landing/PremiumHero";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { OutcomesStrip } from "@/components/landing/OutcomesStrip";
import { TrustSection } from "@/components/landing/TrustSection";
import { ResearchSection } from "@/components/landing/ResearchSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { GameModeSection } from "@/components/landing/GameModeSection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main>
        {/* 1. Cinematic hero — kinetic type, animated mesh */}
        <PremiumHero />

        {/* 2. Bento feature pillars — dark continuation */}
        <BentoFeatures />

        {/* 3. Outcomes strip — count-up numbers on dark */}
        <OutcomesStrip />

        {/* 4. How it works — three steps, light section */}
        <HowItWorks />

        {/* 4b. Game mode — reframe the RPG as the engagement moat */}
        <GameModeSection />

        {/* 5. Research credibility */}
        <ResearchSection />

        {/* 6. Trust & security */}
        <TrustSection />

        {/* 7. See it in action */}
        <TestimonialSection />

        {/* 8. Closing CTA — refined, dark, confident */}
        <section className="relative overflow-hidden bg-[hsl(270_45%_8%)] py-28 text-white md:py-36">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 50%, hsl(270 80% 35% / 0.7), transparent 70%)," +
                "radial-gradient(40% 40% at 80% 20%, hsl(48 100% 55% / 0.25), transparent 60%)",
            }}
          />
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-4xl text-center"
            >
              <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
                Replace expensive assessments.
                <br />
                <span className="bg-gradient-to-r from-[hsl(48_100%_75%)] to-[hsl(35_100%_60%)] bg-clip-text text-transparent">
                  Keep the kids reading.
                </span>
              </h2>
              <p className="mx-auto mt-8 max-w-2xl text-lg text-white/65 md:text-xl">
                Pilot Nabu Learn in your school this semester. Setup in minutes.
                FERPA &amp; COPPA aligned. No credit card.
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  asChild
                  className="group h-14 rounded-full bg-white px-8 text-base font-semibold text-[hsl(270_45%_8%)] hover:bg-white"
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
              </div>
              <p className="mt-8 text-xs uppercase tracking-[0.2em] text-white/40">
                $5–7 per student / year · K–12 · iPad &amp; Chromebook ready
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
