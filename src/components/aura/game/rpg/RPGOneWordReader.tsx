import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RPGCharacterSprite } from "./RPGCharacterSprite";
import { RPGWordReader, type WordAttempt } from "./RPGWordReader";
import { VerbAnimationLayer } from "../effects/VerbAnimationLayer";
import { useVerbAnimation } from "@/hooks/useVerbAnimation";
import { resolveVerbAnimation, type CompoundVerbDescriptor } from "@/lib/verbAnimations";
import { resolvePreKVerb } from "@/lib/prekVerbAnimations";
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

  // Phrase mode (World 103): track the original phrases for display + progress,
  // but expand them into individual words for the speech recognizer.
  const phrases: string[] = useMemo(() => {
    if (content.kind === "phrase") return content.phrases;
    return content.words;
  }, [content]);

  // Flat word list fed to RPGWordReader. In phrase mode each phrase is split
  // on whitespace; in single mode each item is already one word.
  const { wordList, wordPhraseIndex } = useMemo(() => {
    const list: string[] = [];
    const map: number[] = [];
    phrases.forEach((p, pIdx) => {
      const parts = p.split(/\s+/).filter(Boolean);
      parts.forEach((w) => {
        list.push(w);
        map.push(pIdx);
      });
    });
    return { wordList: list, wordPhraseIndex: map };
  }, [phrases]);

  const enemy = enemyForWorld(world.id);
  const meadow = meadowFor(world.id);
  // Suppress the red HP indicator + shake on Action Time (102) and Word + Picture (103).
  const showCombatUI = world.id !== 102 && world.id !== 103;

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [correctPhrases, setCorrectPhrases] = useState(0);
  const correctPhrasesRef = useRef(0);
  const phraseWordHitsRef = useRef<Record<number, number>>({});
  const phraseWordCorrectRef = useRef<Record<number, number>>({});
  const [enemyHp, setEnemyHp] = useState(100);
  const damagePerPhrase = phrases.length > 0 ? 100 / phrases.length : 100;

  const [heroAttacking, setHeroAttacking] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [shake, setShake] = useState(false);

  const [verbTrigger, setVerbTrigger] = useState<{ word: string; nonce: number } | null>(null);
  const [prekScene, setPrekScene] = useState<{ id: number; descriptor: CompoundVerbDescriptor } | null>(null);
  const nonceRef = useRef(0);
  const verb = useVerbAnimation(verbTrigger);
  const verbActiveRef = useRef(false);
  const pendingCompleteRef = useRef<null | (() => void)>(null);

  // Helper character (e.g. yellow Bouncer) that walks onto the scene after the
  // user finishes saying "help me", and remains visible through "help you".
  const [helperVisible, setHelperVisible] = useState(false);
  // Becomes true after the user finishes "help you" — the blue lead then
  // walks across to reach the yellow helper with empathetic gestures.
  const [leadHelping, setLeadHelping] = useState(false);

  // Reset when level changes
  useEffect(() => {
    setCurrentPhraseIndex(0);
    setCorrectPhrases(0);
    correctPhrasesRef.current = 0;
    phraseWordHitsRef.current = {};
    phraseWordCorrectRef.current = {};
    setEnemyHp(100);
    verbActiveRef.current = false;
    pendingCompleteRef.current = null;
    setPrekScene(null);
    setHelperVisible(false);
    setLeadHelping(false);
  }, [world.id, level.id]);

  const currentPhrase = phrases[currentPhraseIndex] ?? "";
  const verbHint = useMemo(
    () => resolvePreKVerb(currentPhrase) ?? resolveVerbAnimation(currentPhrase),
    [currentPhrase]
  );
  const allDone = correctPhrases >= phrases.length;

  // Detect "help me" / "help you" so we can summon a helper companion.
  const phraseLower = currentPhrase.toLowerCase().trim();
  // The helper is the OPPOSITE friendly creature (yellow Bouncer helps blue
  // Echo, and vice versa). Picked once based on which character is the lead.
  const helperType: FriendlyEnemy = enemy === "echo_blob" ? "bouncer" : "echo_blob";

  // Track verb animation lifecycle so we can defer completion until it finishes
  useEffect(() => {
    if (!verb && !prekScene) return;
    verbActiveRef.current = true;
    const ms = prekScene ? prekScene.descriptor.duration * 1000 + 200 : 1400;
    const t = window.setTimeout(() => {
      verbActiveRef.current = false;
      if (pendingCompleteRef.current) {
        const fn = pendingCompleteRef.current;
        pendingCompleteRef.current = null;
        fn();
      }
    }, ms);
    return () => window.clearTimeout(t);
  }, [verb?.id, prekScene?.id]);

  const triggerHit = useCallback((phrase: string) => {
    setHeroAttacking(true);
    window.setTimeout(() => {
      setHeroAttacking(false);
      if (showCombatUI) {
        setEnemyHit(true);
        setShake(true);
      }
      setEnemyHp((hp) => Math.max(0, hp - damagePerPhrase));
      window.setTimeout(() => {
        setEnemyHit(false);
        setShake(false);
      }, 400);
    }, 220);

    // Help-scene staging: only trigger after the user has finished the phrase.
    const lower = phrase.toLowerCase().trim();
    if (lower === "help me") {
      // Yellow walks onto the scene from off-screen right.
      window.setTimeout(() => setHelperVisible(true), 250);
    } else if (lower === "help you") {
      // Blue lead walks across to the yellow helper.
      window.setTimeout(() => setLeadHelping(true), 250);
    }

    // Pre-K signature scene takes priority; fall back to legacy verb library.
    // For phrases, resolvePreKVerb checks the action word inside the phrase.
    const tokens = phrase.split(/\s+/).filter(Boolean);
    let prek: CompoundVerbDescriptor | null = resolvePreKVerb(phrase);
    let legacyWord = phrase;
    if (!prek) {
      for (const t of tokens) {
        const p = resolvePreKVerb(t);
        if (p) { prek = p; break; }
        if (resolveVerbAnimation(t)) { legacyWord = t; }
      }
    }
    if (prek) {
      nonceRef.current += 1;
      setPrekScene({ id: nonceRef.current, descriptor: prek });
      setVerbTrigger(null);
    } else if (resolveVerbAnimation(legacyWord)) {
      nonceRef.current += 1;
      setPrekScene(null);
      setVerbTrigger({ word: legacyWord, nonce: nonceRef.current });
    }
  }, [damagePerPhrase, showCombatUI]);

  const handleResult = useCallback(
    (correct: boolean, _spoken: string, wordIndex: number) => {
      const pIdx = wordPhraseIndex[wordIndex] ?? 0;
      const phraseLen = wordPhraseIndex.filter((p) => p === pIdx).length;
      phraseWordHitsRef.current[pIdx] = (phraseWordHitsRef.current[pIdx] || 0) + 1;
      if (correct) {
        phraseWordCorrectRef.current[pIdx] = (phraseWordCorrectRef.current[pIdx] || 0) + 1;
      }

      // When all words of the phrase have been attempted, advance phrase progress.
      if (phraseWordHitsRef.current[pIdx] >= phraseLen) {
        const allWordsCorrect = (phraseWordCorrectRef.current[pIdx] || 0) >= phraseLen;
        if (allWordsCorrect) {
          correctPhrasesRef.current += 1;
          setCorrectPhrases(correctPhrasesRef.current);
          triggerHit(phrases[pIdx]);
        }
        setCurrentPhraseIndex(Math.min(pIdx + 1, phrases.length - 1));
      }
    },
    [phrases, wordPhraseIndex, triggerHit]
  );

  const handleBatchComplete = useCallback(
    (results: WordAttempt[]) => {
      // Score by phrase completion (a phrase counts as correct only if every word was correct).
      const phraseCorrect = Object.keys(phraseWordCorrectRef.current).filter((k) => {
        const idx = Number(k);
        const need = wordPhraseIndex.filter((p) => p === idx).length;
        return (phraseWordCorrectRef.current[idx] || 0) >= need;
      }).length;
      const accuracy = phrases.length > 0 ? phraseCorrect / phrases.length : 0;
      const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
      const finish = () =>
        onComplete({ wordsRead: results.length, correctWords: phraseCorrect, stars });
      if (verbActiveRef.current) {
        pendingCompleteRef.current = finish;
      } else {
        window.setTimeout(finish, 600);
      }
    },
    [onComplete, phrases.length, wordPhraseIndex]
  );

  const handleHearIt = () => {
    if (currentPhrase) playCorrectPronunciation(currentPhrase);
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
            {correctPhrases}/{phrases.length}
          </div>
        </div>

        {/* Battle row — both characters aligned at exact same baseline */}
        <div className="flex min-h-0 flex-1 items-end justify-between gap-3 px-2 pt-14">
          {/* Friendly creature */}
          <div className="relative flex flex-col items-center w-[44%]">
            {/* Name + HP number + HP bar — absolutely positioned so it doesn't shift sprite baseline */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-14 flex flex-col items-center gap-1 w-full">
              <div className="text-xs sm:text-sm font-bold text-slate-700 bg-white/90 rounded-full px-3 py-0.5 shadow">
                {enemyName(enemy)}
              </div>
              {showCombatUI && (
                <>
                  <div className="text-sm sm:text-base font-black text-rose-700 drop-shadow-[0_1px_0_white] leading-none">
                    {Math.max(0, Math.round(enemyHp))} HP
                  </div>
                  <div className="w-full max-w-[160px] h-3 bg-slate-900/30 rounded-full overflow-hidden border border-white/60 shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-rose-400 via-rose-500 to-red-500"
                      animate={{ width: `${enemyHp}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </>
              )}
            </div>
            <motion.div
              key={`enemy-${prekScene?.id ?? verb?.id ?? 0}-${leadHelping ? 'helping' : 'idle'}`}
              animate={
                allDone
                  ? { y: -20, rotate: [0, -8, 8, -8, 8, 0], scale: 1.1 }
                  : leadHelping
                  ? { x: [0, 18, 36, 54, 70, 80, 80, 80], y: [0, -4, 0, -4, 0, -2, 0, 0], rotate: [0, 4, 8, 6, 10, 8, 8, 8] }
                  : prekScene?.descriptor.transform
                  ? prekScene.descriptor.transform.animate
                  : verb?.descriptor.kind === "transform"
                  ? verb.descriptor.animate
                  : { y: [0, -8, 0] }
              }
              transition={
                allDone
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                  : leadHelping
                  ? { duration: 2.4, ease: "easeInOut" }
                  : prekScene?.descriptor.transform
                  ? { duration: prekScene.descriptor.duration, ease: "easeInOut" }
                  : verb?.descriptor.kind === "transform"
                  ? { duration: 0.9, ease: "easeInOut" }
                  : { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }
              className="relative flex h-[112px] items-end justify-center sm:h-[132px] mb-16 sm:mb-20"
              style={{ transformOrigin: "center bottom" }}
            >
              <div className="h-full w-[118px] sm:w-[140px]">
                <RPGCharacterSprite
                  type={enemy}
                  isEnemy
                  size="lg"
                  isTakingDamage={enemyHit}
                  // During the help-scene: lead is "comforted" while helper is reaching out,
                  // and "reach_left" (visually right toward helper, since lead is mirrored)
                  // once the user has finished "help you".
                  action={
                    leadHelping
                      ? "reach_left"
                      : helperVisible
                      ? "comforted"
                      : prekScene
                      ? currentPhrase
                      : null
                  }
                  actionNonce={
                    leadHelping
                      ? 9000 + currentPhraseIndex
                      : helperVisible
                      ? 8000 + currentPhraseIndex
                      : prekScene?.id ?? 0
                  }
                />
              </div>
              <VerbAnimationLayer
                descriptor={!prekScene && verb?.descriptor.kind === "emoji" ? verb.descriptor : null}
                compound={prekScene?.descriptor ?? null}
                id={prekScene?.id ?? verb?.id ?? null}
                anchor={{ x: 60, y: 40 }}
              />

              {/* Helper companion — walks in after the user finishes "help me" and
                  remains through "help you", receiving the lead's empathy in turn. */}
              <AnimatePresence>
                {helperVisible && (
                  <motion.div
                    key="helper-companion"
                    className="absolute bottom-0 -right-[55%] sm:-right-[60%] h-[88px] w-[88px] sm:h-[104px] sm:w-[104px] z-20 pointer-events-none"
                    initial={{ x: 260, opacity: 0 }}
                    animate={{ x: 0, opacity: 1, y: [0, -5, 0, -5, 0, -3, 0] }}
                    exit={{ x: 260, opacity: 0 }}
                    transition={{
                      x: { duration: 1.6, ease: "easeOut" },
                      opacity: { duration: 0.5 },
                      y: { repeat: Infinity, duration: 1.4, ease: "easeInOut" },
                    }}
                  >
                    <RPGCharacterSprite
                      type={helperType}
                      size="md"
                      // Helper stays unmirrored so "reach_left" arms point toward
                      // the lead character on its visual left.
                      action={leadHelping ? "comforted" : "reach_left"}
                      actionNonce={leadHelping ? 7000 : 6000 + currentPhraseIndex}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>



          {/* Knight */}
          <div className="relative flex flex-col items-center w-[44%]">
            <div className="absolute left-1/2 -translate-x-1/2 -top-14 text-xs sm:text-sm font-bold text-slate-700 bg-white/90 rounded-full px-3 py-0.5 shadow whitespace-nowrap">
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
              key={`word-${currentPhraseIndex}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.02, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-white px-6 py-3 text-center"
            >
              <div className="text-5xl sm:text-6xl font-black text-slate-900 lowercase leading-none">
                {currentPhrase || (allDone ? "🎉" : "")}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-bold text-slate-400 tracking-widest">
                {syllableHint(currentPhrase)}
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
          {phrases.map((_, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full transition-all ${
                i < correctPhrases
                  ? "w-6 bg-emerald-500"
                  : i === currentPhraseIndex
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
            words={wordList}
            onResult={handleResult}
            onBatchComplete={handleBatchComplete}
            disabled={false}
            streak={0}
            batchSize={wordList.length}
            enableEchoRetry={true}
            mode="fast"
            compact
          />
        </div>
      </motion.div>
    </div>
  );
};
