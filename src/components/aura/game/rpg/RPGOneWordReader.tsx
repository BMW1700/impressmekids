import { useMemo, useRef, useState, useCallback } from "react";
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

// Bright Pre-K meadow palettes — matches the soft, friendly Pre-K aesthetic
// while staying visually consistent with the framed battle-arena layout.
const meadowFor = (worldId: number) => {
  switch (worldId) {
    case 102:
      return {
        sky: "from-amber-200 via-yellow-300 to-orange-300",
        ground: "from-amber-300/60 to-orange-400/70",
        accent: "rgba(251, 191, 36, 0.35)",
      };
    case 103:
      return {
        sky: "from-emerald-200 via-teal-300 to-cyan-300",
        ground: "from-emerald-300/60 to-teal-400/70",
        accent: "rgba(45, 212, 191, 0.35)",
      };
    default:
      return {
        sky: "from-pink-200 via-rose-300 to-orange-300",
        ground: "from-rose-300/60 to-orange-400/70",
        accent: "rgba(244, 114, 182, 0.35)",
      };
  }
};

// Phonetic syllable hint for kids — "j • u • mp"
const syllableHint = (word: string): string => {
  if (!word) return "";
  const w = word.toLowerCase();
  if (w.length <= 3) return w.split("").join(" • ");
  // Naive split on vowel boundaries for very short words
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

  // Track current word index by listening to RPGWordReader results
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const correctRef = useRef(0);

  // Verb animation triggered when child correctly reads an action word
  const [verbTrigger, setVerbTrigger] = useState<{ word: string; nonce: number } | null>(null);
  const nonceRef = useRef(0);
  const verb = useVerbAnimation(verbTrigger);

  const currentWord = items[currentIndex] ?? "";
  const verbHint = useMemo(() => resolveVerbAnimation(currentWord), [currentWord]);

  const handleResult = useCallback(
    (correct: boolean, _spoken: string, wordIndex: number) => {
      // Move our local pointer in lockstep with the reader so the chrome,
      // sprite animation and progress dots update together.
      setCurrentIndex(Math.min(wordIndex + 1, items.length - 1));

      if (correct) {
        correctRef.current += 1;
        setCorrectCount(correctRef.current);
        const word = items[wordIndex];
        if (word && resolveVerbAnimation(word)) {
          nonceRef.current += 1;
          setVerbTrigger({ word, nonce: nonceRef.current });
        }
      }
    },
    [items]
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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${meadow.sky} relative overflow-hidden`}>
      {/* Soft meadow decorations */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-8 left-12 text-5xl">☁️</div>
        <div className="absolute top-16 right-20 text-4xl">☀️</div>
        <div className="absolute top-32 left-1/3 text-3xl">☁️</div>
        <div className="absolute bottom-24 left-[15%] text-3xl">🌷</div>
        <div className="absolute bottom-20 right-[20%] text-3xl">🌼</div>
        <div className="absolute bottom-16 left-[45%] text-2xl">🌸</div>
      </div>
      {/* Soft ground band */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t ${meadow.ground} pointer-events-none`}
      />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 backdrop-blur-sm bg-white/30">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-800">
          <ArrowLeft className="h-4 w-4 mr-2" /> Map
        </Button>
        <div className="text-sm font-bold text-slate-700">
          {world.name} · Level {level.id}
        </div>
        <div className="text-sm font-bold flex items-center gap-1 text-amber-700 bg-white/70 rounded-full px-3 py-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
          {correctCount}/{items.length}
        </div>
      </div>

      {/* Battle stage: framed card matching arena visual language */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-4">
        <div className="rounded-3xl border-4 border-white/70 shadow-2xl bg-white/30 backdrop-blur-md p-4 md:p-6">
          {/* Character row */}
          <div className="flex items-end justify-between gap-4 mb-4 min-h-[180px]">
            {/* Friendly enemy */}
            <div className="relative flex flex-col items-center">
              <motion.div
                key={`enemy-${currentIndex}-${verb?.id ?? 0}`}
                initial={{ y: 0 }}
                animate={
                  verb?.descriptor.kind === "transform"
                    ? verb.descriptor.animate
                    : { y: [0, -8, 0] }
                }
                transition={
                  verb?.descriptor.kind === "transform"
                    ? { duration: 0.9, ease: "easeInOut" }
                    : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }
                className="relative"
                style={{ transformOrigin: "center center" }}
              >
                <RPGCharacterSprite type={enemy} isEnemy size="lg" />
                <VerbAnimationLayer
                  descriptor={verb?.descriptor.kind === "emoji" ? verb.descriptor : null}
                  id={verb?.id ?? null}
                  anchor={{ x: 56, y: 56 }}
                />
              </motion.div>
              <div className="mt-1 px-3 py-1 bg-white/90 rounded-full text-xs font-bold text-slate-800 shadow">
                {enemyName(enemy)}
              </div>
            </div>

            {/* Knight cheering */}
            <div className="relative flex flex-col items-center">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <RPGCharacterSprite type="knight" size="lg" />
              </motion.div>
              <div className="mt-1 px-3 py-1 bg-white/90 rounded-full text-xs font-bold text-slate-800 shadow">
                You can do it!
              </div>
            </div>
          </div>

          {/* Big word card */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`word-${currentIndex}`}
                initial={{ scale: 0.7, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.05, opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="bg-white rounded-3xl shadow-xl border-4 border-white/90 px-6 py-8 text-center"
              >
                <div className="text-7xl md:text-8xl font-black text-slate-900 lowercase tracking-wide select-none leading-none">
                  {currentWord}
                </div>
                <div className="mt-3 text-lg md:text-xl font-bold text-slate-400 tracking-widest select-none">
                  {syllableHint(currentWord)}
                </div>
                {verbHint && (
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    ✨ Watch what happens!
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Hear-it helper button — pinned to the side of the card */}
            <Button
              size="sm"
              variant="secondary"
              onClick={handleHearIt}
              className="absolute -top-2 right-0 rounded-full shadow"
            >
              <Volume2 className="h-4 w-4 mr-1" /> Hear it
            </Button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {items.map((_, i) => (
              <div
                key={i}
                className={`h-2.5 rounded-full transition-all ${
                  i < correctCount
                    ? "w-6 bg-emerald-500"
                    : i === currentIndex
                    ? "w-6 bg-slate-700"
                    : "w-2.5 bg-slate-300"
                }`}
              />
            ))}
          </div>

          {/* Real mic — drives the whole flow */}
          <div className="mt-4 rounded-2xl bg-white/70 p-3 shadow-inner">
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
        </div>
      </div>
    </div>
  );
};
