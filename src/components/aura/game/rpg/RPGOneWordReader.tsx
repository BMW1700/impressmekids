import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RPGCharacterSprite } from "./RPGCharacterSprite";
import { RPGWordReader, type WordAttempt } from "./RPGWordReader";
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

const meadowFor = (worldId: number) => {
  switch (worldId) {
    case 102:
      return { sky: "from-amber-200 via-yellow-300 to-orange-300", ground: "from-amber-300/60 to-orange-400/70" };
    case 103:
      return { sky: "from-emerald-200 via-teal-300 to-cyan-300", ground: "from-emerald-300/60 to-teal-400/70" };
    default:
      return { sky: "from-pink-200 via-rose-300 to-orange-300", ground: "from-rose-300/60 to-orange-400/70" };
  }
};

const syllableHint = (word: string): string => {
  if (!word) return "";
  const w = word.toLowerCase();
  if (w.length <= 3) return w.split("").join(" • ");
  const out: string[] = [];
  let buf = "";
  const vowels = "aeiouy";
  for (let i = 0; i < w.length; i++) {
    buf += w[i];
    if (vowels.includes(w[i]) && i < w.length - 1 && !vowels.includes(w[i + 1])) {
      out.push(buf);
      buf = "";
    }
  }
  if (buf) out.push(buf);
  return out.join(" • ");
};

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

  const enemy = enemyForWorld(world.id);
  const meadow = meadowFor(world.id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const correctRef = useRef(0);
  const [enemyHp, setEnemyHp] = useState(100);
  const damagePerWord = items.length > 0 ? 100 / items.length : 100;

  const [heroAttacking, setHeroAttacking] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [shake, setShake] = useState(false);

  const [verbTrigger, setVerbTrigger] = useState<{ word: string; nonce: number } | null>(null);
  const nonceRef = useRef(0);
  const verb = useVerbAnimation(verbTrigger);
  const verbActiveRef = useRef(false);
  const pendingCompleteRef = useRef<null | (() => void)>(null);

  // Reset when level changes
  useEffect(() => {
    setCurrentIndex(0);
    setCorrectCount(0);
    correctRef.current = 0;
    setEnemyHp(100);
    verbActiveRef.current = false;
    pendingCompleteRef.current = null;
  }, [world.id, level.id]);

  const currentWord = items[currentIndex] ?? "";
  const verbHint = useMemo(() => resolveVerbAnimation(currentWord), [currentWord]);
  const allDone = correctCount >= items.length;

  // Track verb animation lifecycle so we can defer completion until it finishes
  useEffect(() => {
    if (!verb) return;
    verbActiveRef.current = true;
    const t = window.setTimeout(() => {
      verbActiveRef.current = false;
      if (pendingCompleteRef.current) {
        const fn = pendingCompleteRef.current;
        pendingCompleteRef.current = null;
        fn();
      }
    }, 1400);
    return () => window.clearTimeout(t);
  }, [verb?.id]);

  const triggerHit = useCallback((word: string) => {
    setHeroAttacking(true);
    window.setTimeout(() => {
      setHeroAttacking(false);
      setEnemyHit(true);
      setShake(true);
      setEnemyHp((hp) => Math.max(0, hp - damagePerWord));
      window.setTimeout(() => {
        setEnemyHit(false);
        setShake(false);
      }, 400);
    }, 220);

    if (resolveVerbAnimation(word)) {
      nonceRef.current += 1;
      setVerbTrigger({ word, nonce: nonceRef.current });
    }
  }, [damagePerWord]);

  const handleResult = useCallback(
    (correct: boolean, _spoken: string, wordIndex: number) => {
      setCurrentIndex(Math.min(wordIndex + 1, items.length - 1));
      if (correct) {
        correctRef.current += 1;
        setCorrectCount(correctRef.current);
        const word = items[wordIndex];
        if (word) triggerHit(word);
      }
    },
    [items, triggerHit]
  );

  const handleBatchComplete = useCallback(
    (results: WordAttempt[]) => {
      const correct = results.filter((r) => r.result === "correct").length;
      const accuracy = results.length > 0 ? correct / results.length : 0;
      const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
      const finish = () =>
        onComplete({ wordsRead: results.length, correctWords: correct, stars });
      // If a verb animation is still playing, wait for it to finish before ending.
      if (verbActiveRef.current) {
        pendingCompleteRef.current = finish;
      } else {
        // Tiny grace period so the last hit/star can render
        window.setTimeout(finish, 600);
      }
    },
    [onComplete]
  );

  const handleHearIt = () => {
    if (currentWord) playCorrectPronunciation(currentWord);
  };

  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden rounded-3xl bg-gradient-to-br ${meadow.sky} shadow-xl`}>
      {/* Soft meadow decorations */}
      <div className="absolute inset-0 pointer-events-none opacity-40 select-none">
        <div className="absolute top-4 left-6 text-4xl">☁️</div>
        <div className="absolute top-6 right-10 text-3xl">☀️</div>
        <div className="absolute top-24 left-[20%] text-3xl">☁️</div>
          <div className="absolute bottom-6 left-[8%] text-2xl">🌷</div>
          <div className="absolute bottom-5 right-[12%] text-2xl">🌼</div>
          <div className="absolute bottom-8 left-[40%] text-xl">🌿</div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t ${meadow.ground} pointer-events-none`} />

      <motion.div
        animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 flex h-full min-h-0 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-800 hover:bg-white/40">
            <ArrowLeft className="h-4 w-4 mr-1" /> Map
          </Button>
          <div className="text-base sm:text-lg font-extrabold text-slate-800 truncate">
            {world.name} · Lv {level.id}
          </div>
          <div className="text-sm sm:text-base font-bold flex items-center gap-1 text-amber-700 bg-white/90 rounded-full px-3 py-1 shadow">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            {correctCount}/{items.length}
          </div>
        </div>

        {/* Battle row — both characters aligned at center vertically */}
        <div className="flex min-h-0 flex-1 items-center justify-between gap-3 px-2">
          {/* Friendly creature with HP bar */}
          <div className="relative flex flex-col items-center w-[44%]">
            <div className="text-xs sm:text-sm font-bold text-slate-700 bg-white/90 rounded-full px-3 py-1 shadow mb-1">
              {enemyName(enemy)}
            </div>
            {/* HP bar */}
            <div className="w-full max-w-[160px] h-3 bg-slate-900/30 rounded-full overflow-hidden border border-white/60 shadow-inner mb-2">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-400 via-rose-500 to-red-500"
                animate={{ width: `${enemyHp}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <motion.div
              key={`enemy-${verb?.id ?? 0}`}
              animate={
                allDone
                  ? { y: -20, rotate: [0, -8, 8, -8, 8, 0], scale: 1.1 }
                  : verb?.descriptor.kind === "transform"
                  ? verb.descriptor.animate
                  : { y: [0, -8, 0] }
              }
              transition={
                allDone
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                  : verb?.descriptor.kind === "transform"
                  ? { duration: 0.9, ease: "easeInOut" }
                  : { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }
              className="relative flex h-[112px] items-end justify-center sm:h-[132px]"
              style={{ transformOrigin: "center bottom" }}
            >
              <div className="h-full w-[118px] sm:w-[140px]">
                <RPGCharacterSprite
                  type={enemy}
                  isEnemy
                  size="lg"
                  isTakingDamage={enemyHit}
                />
              </div>
              <VerbAnimationLayer
                descriptor={verb?.descriptor.kind === "emoji" ? verb.descriptor : null}
                id={verb?.id ?? null}
                anchor={{ x: 50, y: 50 }}
              />
              <AnimatePresence>
                {floatStar && (
                  <motion.div
                    key={floatStar.id}
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -60, scale: 1.3 }}
                    exit={{ opacity: 0, y: -80 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl font-black text-amber-500 drop-shadow-[0_2px_0_white] flex items-center gap-1"
                  >
                    +1 ⭐
                  </motion.div>
                )}
                {floatDmg && (
                  <motion.div
                    key={floatDmg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -40, scale: 1.4 }}
                    exit={{ opacity: 0, y: -70 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-10 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl font-black text-red-500 drop-shadow-[0_2px_0_white]"
                  >
                    -{floatDmg.n}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Knight */}
          <div className="relative flex flex-col items-center w-[44%]">
            <div className="text-xs sm:text-sm font-bold text-slate-700 bg-white/90 rounded-full px-3 py-1 shadow mb-2">
              You can do it!
            </div>
            <motion.div
              animate={
                heroAttacking
                  ? { x: -32, scale: 1.08 }
                  : { x: 0, y: [0, -5, 0] }
              }
              transition={
                heroAttacking
                  ? { duration: 0.22, ease: "easeOut" }
                  : { y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }
              }
              className="flex h-[112px] w-[118px] items-end justify-center sm:h-[132px] sm:w-[140px]"
            >
              <RPGCharacterSprite type="knight" size="lg" isAttacking={heroAttacking} />
            </motion.div>
          </div>
        </div>

        {/* Word card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`word-${currentIndex}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.02, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-white px-6 py-3 text-center"
            >
              <div className="text-5xl sm:text-6xl font-black text-slate-900 lowercase leading-none">
                {currentWord || (allDone ? "🎉" : "")}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-bold text-slate-400 tracking-widest">
                {syllableHint(currentWord)}
              </div>
              {verbHint && !allDone && (
                <div className="mt-1 inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                  ✨ Watch what happens!
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleHearIt}
            className="absolute -top-2 right-2 h-9 px-3 rounded-full shadow"
          >
            <Volume2 className="h-4 w-4 mr-1" /> Hear
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full transition-all ${
                i < correctCount
                  ? "w-6 bg-emerald-500"
                  : i === currentIndex
                  ? "w-6 bg-slate-700"
                  : "w-2.5 bg-white/70"
              }`}
            />
          ))}
        </div>

        {/* Mic reader — natural height inside the page scroll */}
        <div className="rounded-2xl bg-white/85 backdrop-blur-sm p-2 sm:p-3 shadow-inner">
          <RPGWordReader
            key={`prek-${world.id}-${level.id}`}
            words={items}
            onResult={handleResult}
            onBatchComplete={handleBatchComplete}
            disabled={false}
            streak={0}
            batchSize={items.length}
            enableEchoRetry={true}
            mode="fast"
            compact
          />
        </div>
      </motion.div>
    </div>
  );
};
