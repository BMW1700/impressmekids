import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Volume2, Heart } from "lucide-react";
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

  const enemyMaxHp = items.length * 20;
  const damagePerWord = 20;

  const [enemyHp, setEnemyHp] = useState(enemyMaxHp);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const correctRef = useRef(0);

  const [heroAttacking, setHeroAttacking] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [shake, setShake] = useState(false);
  const [floatDmg, setFloatDmg] = useState<{ id: number; value: number } | null>(null);

  const [verbTrigger, setVerbTrigger] = useState<{ word: string; nonce: number } | null>(null);
  const nonceRef = useRef(0);
  const verb = useVerbAnimation(verbTrigger);

  // Reset when level changes
  useEffect(() => {
    setEnemyHp(enemyMaxHp);
    setCurrentIndex(0);
    setCorrectCount(0);
    correctRef.current = 0;
  }, [world.id, level.id, enemyMaxHp]);

  const currentWord = items[currentIndex] ?? "";
  const verbHint = useMemo(() => resolveVerbAnimation(currentWord), [currentWord]);
  const enemyDefeated = enemyHp <= 0;

  const triggerHit = useCallback((word: string) => {
    setHeroAttacking(true);
    setFloatDmg({ id: Date.now(), value: damagePerWord });
    window.setTimeout(() => {
      setHeroAttacking(false);
      setEnemyHit(true);
      setShake(true);
      setEnemyHp((prev) => Math.max(0, prev - damagePerWord));
      window.setTimeout(() => {
        setEnemyHit(false);
        setShake(false);
      }, 400);
      window.setTimeout(() => setFloatDmg(null), 900);
    }, 220);

    if (resolveVerbAnimation(word)) {
      nonceRef.current += 1;
      setVerbTrigger({ word, nonce: nonceRef.current });
    }
  }, []);

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
      onComplete({ wordsRead: results.length, correctWords: correct, stars });
    },
    [onComplete]
  );

  const handleHearIt = () => {
    if (currentWord) playCorrectPronunciation(currentWord);
  };

  const hpPercent = Math.max(0, Math.round((enemyHp / enemyMaxHp) * 100));

  return (
    <div className={`relative w-full h-full min-h-0 overflow-hidden rounded-2xl bg-gradient-to-br ${meadow.sky}`}>
      {/* Soft meadow decorations */}
      <div className="absolute inset-0 pointer-events-none opacity-40 select-none">
        <div className="absolute top-2 left-4 text-3xl">☁️</div>
        <div className="absolute top-3 right-6 text-2xl">☀️</div>
        <div className="absolute bottom-4 left-[10%] text-2xl">🌷</div>
        <div className="absolute bottom-3 right-[15%] text-2xl">🌼</div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t ${meadow.ground} pointer-events-none`} />

      <motion.div
        animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 flex flex-col h-full max-h-full p-2 sm:p-3 gap-2"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-800 hover:bg-white/40 h-8">
            <ArrowLeft className="h-4 w-4 mr-1" /> Map
          </Button>
          <div className="text-xs sm:text-sm font-bold text-slate-700 truncate">
            {world.name} · Lv {level.id}
          </div>
          <div className="text-xs sm:text-sm font-bold flex items-center gap-1 text-amber-700 bg-white/80 rounded-full px-2 py-0.5 shadow">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
            {correctCount}/{items.length}
          </div>
        </div>

        {/* Battle row: enemy w/ HP + knight */}
        <div className="flex items-end justify-between gap-2 shrink-0 px-1">
          {/* Enemy */}
          <div className="relative flex flex-col items-center w-[42%]">
            {/* HP bar */}
            <div className="w-full max-w-[180px] mb-1">
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-800">
                <span className="truncate">{enemyName(enemy)}</span>
                <span className="flex items-center gap-0.5 text-rose-700">
                  <Heart className="h-3 w-3 fill-rose-500 text-rose-600" />
                  {enemyHp}/{enemyMaxHp}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/70 overflow-hidden border border-white shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 via-lime-400 to-rose-400"
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 22 }}
                />
              </div>
            </div>
            <motion.div
              key={`enemy-${verb?.id ?? 0}`}
              animate={
                enemyDefeated
                  ? { y: 30, opacity: 0, rotate: 25 }
                  : verb?.descriptor.kind === "transform"
                  ? verb.descriptor.animate
                  : { y: [0, -6, 0] }
              }
              transition={
                enemyDefeated
                  ? { duration: 0.6 }
                  : verb?.descriptor.kind === "transform"
                  ? { duration: 0.9, ease: "easeInOut" }
                  : { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }
              className="relative h-[88px] sm:h-[110px] flex items-end justify-center"
              style={{ transformOrigin: "center bottom" }}
            >
              <div className="h-full w-[110px] sm:w-[140px]">
                <RPGCharacterSprite
                  type={enemy}
                  isEnemy
                  size="md"
                  isTakingDamage={enemyHit}
                />
              </div>
              <VerbAnimationLayer
                descriptor={verb?.descriptor.kind === "emoji" ? verb.descriptor : null}
                id={verb?.id ?? null}
                anchor={{ x: 50, y: 50 }}
              />
              {/* Floating damage number */}
              <AnimatePresence>
                {floatDmg && (
                  <motion.div
                    key={floatDmg.id}
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -50, scale: 1.2 }}
                    exit={{ opacity: 0, y: -70 }}
                    transition={{ duration: 0.7 }}
                    className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl font-black text-rose-600 drop-shadow-[0_2px_0_white]"
                  >
                    -{floatDmg.value}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Knight */}
          <div className="relative flex flex-col items-center w-[42%]">
            <div className="text-[10px] sm:text-xs font-bold text-slate-700 bg-white/80 rounded-full px-2 py-0.5 shadow mb-1">
              You can do it!
            </div>
            <motion.div
              animate={
                heroAttacking
                  ? { x: -28, scale: 1.05 }
                  : { x: 0, y: [0, -4, 0] }
              }
              transition={
                heroAttacking
                  ? { duration: 0.22, ease: "easeOut" }
                  : { y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }
              }
              className="h-[88px] sm:h-[110px] w-[110px] sm:w-[140px] flex items-end justify-center"
            >
              <RPGCharacterSprite type="knight" size="md" isAttacking={heroAttacking} />
            </motion.div>
          </div>
        </div>

        {/* Word card */}
        <div className="relative shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`word-${currentIndex}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.02, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-white px-4 py-2 sm:py-3 text-center"
            >
              <div className="text-4xl sm:text-5xl font-black text-slate-900 lowercase leading-none">
                {currentWord || (enemyDefeated ? "🎉" : "")}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-bold text-slate-400 tracking-widest">
                {syllableHint(currentWord)}
              </div>
              {verbHint && !enemyDefeated && (
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                  ✨ Watch what happens!
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleHearIt}
            className="absolute -top-1 right-1 h-7 px-2 rounded-full shadow text-xs"
          >
            <Volume2 className="h-3.5 w-3.5 mr-1" /> Hear
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 shrink-0">
          {items.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < correctCount
                  ? "w-5 bg-emerald-500"
                  : i === currentIndex
                  ? "w-5 bg-slate-700"
                  : "w-2 bg-white/70"
              }`}
            />
          ))}
        </div>

        {/* Mic reader — flex-1 so it scrolls within the frame instead of pushing content off-screen */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-xl bg-white/80 backdrop-blur-sm p-2 shadow-inner">
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
          />
        </div>
      </motion.div>
    </div>
  );
};
