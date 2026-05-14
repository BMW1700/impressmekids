import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, Sparkles, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RPGCharacterSprite } from "./RPGCharacterSprite";
import { VerbAnimationLayer } from "../effects/VerbAnimationLayer";
import { useVerbAnimation } from "@/hooks/useVerbAnimation";
import { resolveVerbAnimation } from "@/lib/verbAnimations";
import { getPreKContent, type PreKLevelContent } from "@/data/preKWordBanks";
import { type CampaignWorld } from "@/lib/campaignData";
import { type CampaignLevel } from "./RPGLevelSelect";
import { playCorrectPronunciation } from "@/lib/pronunciationPlayer";

type FriendlyEnemy = "wiggleworm" | "bouncer" | "echo_blob";

const enemyForWorld = (worldId: number): FriendlyEnemy => {
  if (worldId === 102) return "bouncer";
  if (worldId === 103) return "echo_blob";
  return "wiggleworm";
};

const enemyName = (e: FriendlyEnemy) =>
  e === "bouncer" ? "Bouncer" : e === "echo_blob" ? "Echo" : "Wiggleworm";

interface RPGOneWordReaderProps {
  world: CampaignWorld;
  level: CampaignLevel;
  onBack: () => void;
  onComplete: (stats: { wordsRead: number; correctWords: number; stars: number }) => void;
}

export const RPGOneWordReader = ({ world, level, onBack, onComplete }: RPGOneWordReaderProps) => {
  const content: PreKLevelContent = useMemo(
    () => getPreKContent(world.id, level.id),
    [world.id, level.id]
  );

  const items: string[] = useMemo(() => {
    if (content.kind === "single") return content.words;
    return content.phrases;
  }, [content]);

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [verbTrigger, setVerbTrigger] = useState<{ word: string; nonce: number } | null>(null);
  const nonceRef = useRef(0);
  const enemy = enemyForWorld(world.id);

  const current = items[index] ?? "";
  const isLast = index >= items.length - 1;

  // Hint when current word maps to a verb animation
  const verbHint = useMemo(() => resolveVerbAnimation(current), [current]);

  const verb = useVerbAnimation(verbTrigger);

  const handleHear = () => {
    if (!current) return;
    playCorrectPronunciation(current);
  };

  const handleReadIt = () => {
    if (!current) return;
    nonceRef.current += 1;
    setVerbTrigger({ word: current, nonce: nonceRef.current });
    setCorrect((c) => c + 1);

    // Advance after the animation has had time to play
    const advanceDelay = resolveVerbAnimation(current) ? 1100 : 450;
    window.setTimeout(() => {
      if (isLast) {
        const accuracy = items.length > 0 ? (correct + 1) / items.length : 0;
        const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
        onComplete({ wordsRead: items.length, correctWords: correct + 1, stars });
      } else {
        setIndex((i) => i + 1);
      }
    }, advanceDelay);
  };

  const handleSkip = () => {
    if (isLast) {
      const accuracy = items.length > 0 ? correct / items.length : 0;
      const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
      onComplete({ wordsRead: items.length, correctWords: correct, stars });
    } else {
      setIndex((i) => i + 1);
    }
  };

  const gradient = world.gradient || "from-pink-300 via-rose-300 to-orange-300";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Map
        </Button>
        <div className="text-sm font-bold text-muted-foreground">
          Word {Math.min(index + 1, items.length)} of {items.length}
        </div>
        <div className="text-sm font-bold flex items-center gap-1 text-yellow-500">
          <Star className="h-4 w-4 fill-yellow-400" /> {correct}
        </div>
      </div>

      {/* Stage */}
      <div
        className={`relative flex-1 mx-3 rounded-3xl overflow-hidden bg-gradient-to-br ${gradient} p-6 flex flex-col`}
      >
        {/* Sky/cloud decoration */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-6 left-8 text-5xl">☁️</div>
          <div className="absolute top-12 right-12 text-4xl">☀️</div>
          <div className="absolute bottom-8 left-1/4 text-3xl">🌷</div>
          <div className="absolute bottom-6 right-1/4 text-3xl">🌼</div>
        </div>

        {/* Characters row */}
        <div className="relative flex items-end justify-between gap-4 z-10">
          {/* Friendly creature */}
          <div className="relative flex flex-col items-center">
            <motion.div
              key={`enemy-${index}`}
              initial={{ y: 0 }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <RPGCharacterSprite type={enemy} isEnemy size="md" />
              <VerbAnimationLayer
                descriptor={verb?.descriptor.kind === 'emoji' ? verb.descriptor : null}
                id={verb?.id ?? null}
                anchor={{ x: 40, y: 40 }}
              />
            </motion.div>
            <div className="mt-1 px-3 py-1 bg-white/80 rounded-full text-xs font-bold text-slate-800">
              {enemyName(enemy)}
            </div>
          </div>

          {/* Knight cheering on */}
          <div className="relative flex flex-col items-center">
            <RPGCharacterSprite type="knight" size="md" />
            <div className="mt-1 px-3 py-1 bg-white/80 rounded-full text-xs font-bold text-slate-800">
              You can do it!
            </div>
          </div>
        </div>

        {/* Big Word Card */}
        <div className="relative z-10 flex-1 flex items-center justify-center mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`word-${index}`}
              initial={{ scale: 0.6, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.1, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="w-full max-w-xl"
            >
              <Card className="bg-white border-4 border-white/90 shadow-2xl rounded-3xl px-6 py-10 text-center">
                <div className="text-6xl md:text-8xl font-black text-slate-900 tracking-wide select-none">
                  {current}
                </div>
                {verbHint && (
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    <Sparkles className="h-3 w-3" /> Watch what happens!
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="relative z-10 flex items-center justify-center gap-3 pb-2">
          <Button size="lg" variant="secondary" onClick={handleHear} className="rounded-full">
            <Volume2 className="h-5 w-5 mr-2" /> Hear it
          </Button>
          <Button
            size="lg"
            onClick={handleReadIt}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-bold px-8"
          >
            <Check className="h-5 w-5 mr-2" /> I read it!
          </Button>
          <Button size="lg" variant="ghost" onClick={handleSkip} className="rounded-full">
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};
