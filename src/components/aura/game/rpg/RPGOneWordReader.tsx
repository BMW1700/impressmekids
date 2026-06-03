import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RPGCharacterSprite } from "./RPGCharacterSprite";
import {
  SadMood,
  HappyMood,
  BasketballProp,
  PumpProp,
  BrokenBatProp,
  DuctTapeProp,
  DogWithLeashProp,
  BoxProp,
  WashHandsProp,
  PlantSeedProp,
  ThrowBallProp,
} from "./HelpSceneOverlays";
import { RPGWordReader, type WordAttempt } from "./RPGWordReader";
import { VerbAnimationLayer } from "../effects/VerbAnimationLayer";
import { useVerbAnimation } from "@/hooks/useVerbAnimation";
import { resolveVerbAnimation, type CompoundVerbDescriptor } from "@/lib/verbAnimations";
import { resolvePreKVerb } from "@/lib/prekVerbAnimations";
import { getPreKContent, type PreKLevelContent } from "@/data/preKWordBanks";
import { type CampaignWorld } from "@/lib/campaignData";
import { type CampaignLevel } from "./RPGLevelSelect";
import { playCorrectPronunciation } from "@/lib/pronunciationPlayer";
import { getNabuLevelCopy, getNabuDemoWords, getNabuCreatureName, getNabuMeterLabel } from "@/lib/nabuStoryCopy";

type FriendlyEnemy = "wiggleworm" | "bouncer" | "echo_blob";

const enemyForWorld = (worldId: number): FriendlyEnemy => {
  if (worldId === 102) return "bouncer";
  if (worldId === 103) return "echo_blob";
  return "wiggleworm";
};


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
  const content: PreKLevelContent = useMemo(() => {
    const demoWords = getNabuDemoWords(world.id, level.id);
    if (demoWords && demoWords.length > 0) {
      return { kind: "single", words: demoWords };
    }
    return getPreKContent(world.id, level.id);
  }, [world.id, level.id]);

  const nabuCopy = useMemo(
    () => getNabuLevelCopy(world.id, level.id),
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
  // All Pre-K worlds (101/102/103) use the soft Pre-K HUD: no HP, no shake,
  // no knight, no combat language.
  const isPreK = world.id === 101 || world.id === 102 || world.id === 103;
  const showCombatUI = !isPreK;
  const creatureName = isPreK ? getNabuCreatureName(world.id) : (enemy === "bouncer" ? "Bobo" : enemy === "echo_blob" ? "Echo" : "Wiggleworm");
  const meterLabel = getNabuMeterLabel(world.id);
  // Per-level emotional staging flags
  const showEchoStuck = isPreK && world.id === 103 && level.id === 1;
  const showBoboLostBounce = isPreK && world.id === 102 && level.id === 1;
  const showVillageScene = isPreK && world.id === 101 && level.id === 3;

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
  const [prekScene, setPrekScene] = useState<{ id: number; descriptor: CompoundVerbDescriptor; phrase: string } | null>(null);
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
  // Help-scene narrative state: which scene + which sub-phase is playing.
  // - 'me' scene: blue is sad with a deflated basketball; yellow pumps it up.
  // - 'you' scene: yellow is sad with a broken bat; blue tapes it back together.
  const [helpStage, setHelpStage] = useState<null | "me" | "you">(null);
  const [helpPhase, setHelpPhase] = useState<"setup" | "approach" | "fix" | "happy">("setup");
  // Horizontal offset for the yellow helper. After the "help me" scene ends,
  // the helper slides further right to make room — and stays there for the
  // "help you" scene, where the blue lead walks over to him.
  const [helperOffsetX, setHelperOffsetX] = useState(0);
  // Dog scene: 'my' shows blue holding the leash; 'your' shows yellow holding it.
  const [dogStage, setDogStage] = useState<null | "my" | "your">(null);
  // Box scene: 'in' = character hops into a brown box; 'on' = character hops on top.
  const [boxStage, setBoxStage] = useState<null | "in" | "on">(null);
  const [washing, setWashing] = useState(false);
  const [planting, setPlanting] = useState(false);
  const [throwing, setThrowing] = useState(false);
  const helpTimersRef = useRef<number[]>([]);
  const clearHelpTimers = () => {
    helpTimersRef.current.forEach((id) => window.clearTimeout(id));
    helpTimersRef.current = [];
  };

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
    clearHelpTimers();
    setHelpStage(null);
    setHelpPhase("setup");
    setHelperOffsetX(0);
    setDogStage(null);
    setBoxStage(null);
    setWashing(false);
    setPlanting(false);
    setThrowing(false);
  }, [world.id, level.id]);
  useEffect(() => () => clearHelpTimers(), []);


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

    // Help-scene staging — narrative props + mood, played out over ~4.5s.
    const lower = phrase.toLowerCase().trim();
    if (lower === "help me") {
      // Blue is sad holding a deflated basketball; yellow walks in with a
      // pump and inflates it; blue becomes happy.
      clearHelpTimers();
      setHelpStage("me");
      setHelpPhase("setup");
      window.setTimeout(() => setHelperVisible(true), 250);
      helpTimersRef.current.push(
        window.setTimeout(() => setHelpPhase("approach"), 250),
        window.setTimeout(() => setHelpPhase("fix"), 1800),
        window.setTimeout(() => setHelpPhase("happy"), 3400),
        // Slide the yellow helper further right so he's clearly separated
        // from blue, ready as the target for the "help you" scene.
        window.setTimeout(() => setHelperOffsetX(110), 4200),
        window.setTimeout(() => setHelpStage(null), 4600),
      );
    } else if (lower === "help you") {
      // Yellow is sad with a broken bat; blue walks over carrying duct tape,
      // wraps the bat back together; yellow becomes happy.
      clearHelpTimers();
      setHelpStage("you");
      setHelpPhase("setup");
      window.setTimeout(() => setLeadHelping(true), 350);
      helpTimersRef.current.push(
        window.setTimeout(() => setHelpPhase("approach"), 250),
        // Apply the tape as soon as blue visually reaches the bat.
        window.setTimeout(() => setHelpPhase("fix"), 1800),
        window.setTimeout(() => setHelpPhase("happy"), 3600),
        window.setTimeout(() => setHelpStage(null), 9000),
      );
    } else if (lower === "my dog") {
      // Blue lead is shown holding the leash of a dog standing next to him.
      clearHelpTimers();
      setHelperVisible(false);
      setLeadHelping(false);
      setHelpStage(null);
      setDogStage("my");
      helpTimersRef.current.push(
        window.setTimeout(() => setDogStage(null), 4000),
      );
    } else if (lower === "your dog") {
      // Dog appears in front of the KNIGHT (right side) — no yellow helper.
      clearHelpTimers();
      setHelperVisible(false);
      setLeadHelping(false);
      setHelpStage(null);
      setHelperOffsetX(0);
      setDogStage("your");
      helpTimersRef.current.push(
        window.setTimeout(() => setDogStage(null), 4000),
      );
    } else if (lower === "in the box" || lower === "on the box") {
      clearHelpTimers();
      setBoxStage(lower === "in the box" ? "in" : "on");
      helpTimersRef.current.push(
        window.setTimeout(() => setBoxStage(null), 2400),
      );
    } else if (lower === "wash hands") {
      clearHelpTimers();
      setWashing(true);
      helpTimersRef.current.push(
        window.setTimeout(() => setWashing(false), 2200),
      );
    } else if (lower === "plant seed") {
      clearHelpTimers();
      setPlanting(true);
      helpTimersRef.current.push(
        window.setTimeout(() => setPlanting(false), 2400),
      );
    } else if (lower === "throw ball") {
      clearHelpTimers();
      setThrowing(true);
      helpTimersRef.current.push(
        window.setTimeout(() => setThrowing(false), 1900),
      );
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
      setPrekScene({ id: nonceRef.current, descriptor: prek, phrase });
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

      {/* Pre-K W101 L3 "Wake Up Nabu Village" decorative backdrop */}
      {showVillageScene && (
        <div className="absolute inset-0 pointer-events-none select-none">
          {/* Warm morning glow that brightens as the village wakes */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-amber-200/0 via-orange-200/20 to-rose-200/30"
            animate={{ opacity: allDone ? 1 : 0.45 }}
            transition={{ duration: 1.2 }}
          />
          {/* Sun: dim while sleepy, bright after success */}
          <motion.div
            className="absolute top-4 right-8 text-5xl"
            animate={{
              opacity: allDone ? 1 : 0.55,
              scale: allDone ? 1.15 : 1,
              filter: allDone ? "drop-shadow(0 0 18px rgba(253,224,71,0.9))" : "none",
            }}
            transition={{ duration: 1 }}
          >
            ☀️
          </motion.div>
          {/* Sleepy houses silhouette row */}
          <div className="absolute left-0 right-0 bottom-[22%] flex justify-around items-end px-6 opacity-80">
            <div className="text-4xl sm:text-5xl">🏠</div>
            <div className="text-5xl sm:text-6xl">🏡</div>
            <div className="text-4xl sm:text-5xl">🏠</div>
          </div>
          {/* Tiny lights that flicker on after success */}
          <motion.div
            className="absolute left-[22%] bottom-[30%] text-base"
            animate={{ opacity: allDone ? 1 : 0 }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute right-[24%] bottom-[32%] text-base"
            animate={{ opacity: allDone ? 1 : 0 }}
          >
            ✨
          </motion.div>
        </div>
      )}

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
            {nabuCopy?.title ?? `${world.name} · Lv ${level.id}`}
          </div>
          <div className="text-sm sm:text-base font-bold flex items-center gap-1 text-amber-700 bg-white/90 rounded-full px-3 py-1 shadow">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            {correctPhrases}/{phrases.length}
          </div>
        </div>

        {/* Nabu prompt banner — emotional one-liner shown until first success */}
        {nabuCopy && correctPhrases === 0 && !allDone && (
          <div className="mx-auto -mt-0.5 max-w-[92%] rounded-full bg-white/85 px-3 py-1 text-center text-xs sm:text-sm font-bold text-slate-700 shadow">
            {nabuCopy.prompt}
          </div>
        )}


        {/* Battle row — both characters aligned at exact same baseline */}
        <div className="flex min-h-0 flex-1 items-end justify-between gap-3 px-2 pt-14">
          {/* Friendly creature */}
          <div className="relative flex flex-col items-center w-[44%]">
            {/* Name + HP number + HP bar — absolutely positioned so it doesn't shift sprite baseline */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-14 flex flex-col items-center gap-1 w-full">
              <div className="text-xs sm:text-sm font-bold text-slate-700 bg-white/90 rounded-full px-3 py-0.5 shadow">
                {creatureName}
              </div>
              {showCombatUI ? (
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
              ) : (
                <>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-600 leading-none">
                    ✨ {meterLabel}
                  </div>
                  <div className="w-full max-w-[160px] h-2.5 bg-white/60 rounded-full overflow-hidden border border-white/80 shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-pink-300 via-amber-300 to-emerald-300"
                      animate={{ width: `${phrases.length > 0 ? (correctPhrases / phrases.length) * 100 : 0}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </>
              )}
            </div>
            {/* Ground-anchored props — siblings of the character's motion.div
                so they do NOT inherit its transform (no head-pots, no
                hand-level boxes). They render at the column level. */}
            <BoxProp visible={boxStage !== null} mode={boxStage ?? "on"} />
            <WashHandsProp visible={washing} />
            <PlantSeedProp visible={planting} />
            <ThrowBallProp visible={throwing} />
            <motion.div
              key={`enemy-${prekScene?.id ?? verb?.id ?? 0}-${leadHelping ? 'helping' : 'idle'}`}
              animate={
                leadHelping
                  ? { x: [0, 40, 90, 140, 180, 210, 220, 220], y: [0, -3, 0, -3, 0, -2, 0, 0] }
                  : prekScene?.descriptor.transform
                  ? prekScene.descriptor.transform.animate
                  : allDone
                  ? { y: -20, rotate: [0, -8, 8, -8, 8, 0], scale: 1.1 }
                  : verb?.descriptor.kind === "transform"
                  ? verb.descriptor.animate
                  : { y: [0, -8, 0] }
              }
              transition={
                leadHelping
                  ? { duration: 2.8, ease: "easeInOut" }
                  : prekScene?.descriptor.transform
                  ? { duration: prekScene.descriptor.duration, ease: "easeInOut" }
                  : allDone
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
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
                      ? prekScene.phrase
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

              {/* Help-ME scene overlays on the LEAD (blue) */}
              {helpStage === "me" && (
                <>
                  <SadMood visible={helpPhase !== "happy"} topPx={-110} />
                  <HappyMood visible={helpPhase === "happy"} topPx={-114} />
                  <BasketballProp phase={helpPhase} />
                </>
              )}
              {/* Help-YOU scene: blue carries duct tape as he walks to yellow */}
              {helpStage === "you" && leadHelping && (
                <DuctTapeProp phase={helpPhase} />
              )}
              {/* MY dog scene: dog beside the BLUE LEAD, leash to lead's hand.
                  YOUR dog renders in the KNIGHT column instead (see below). */}
              <DogWithLeashProp
                visible={dogStage === "my"}
                holder="left"
                rightPct={-55}
                scale={1}
                leashLength={60}
                leashAngleDeg={150}
              />




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
                    initial={dogStage === "your"
                      ? { x: helperOffsetX, opacity: 0 }
                      : { x: 260, opacity: 0 }}
                    animate={
                      dogStage === "your"
                        ? { x: helperOffsetX, opacity: 1, y: 0 }
                        : helpStage === "you"
                        ? { x: helperOffsetX, opacity: 1, y: 0 }
                        : { x: helperOffsetX, opacity: 1, y: [0, -5, 0, -5, 0, -3, 0] }
                    }
                    exit={{ x: 260, opacity: 0 }}
                    transition={{
                      x: { duration: dogStage === "your" ? 0 : 1.2, ease: "easeInOut" },
                      opacity: { duration: 0.4 },
                      y: dogStage === "your" || helpStage === "you"
                        ? { duration: 0.2 }
                        : { repeat: Infinity, duration: 1.4, ease: "easeInOut" },

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
                    {/* Help-ME: yellow helper carries a pump to inflate blue's basketball */}
                    {helpStage === "me" && <PumpProp phase={helpPhase} />}
                    {/* Help-YOU: yellow helper is sad with a broken bat until blue tapes it */}
                    {helpStage === "you" && (
                      <>
                        <SadMood visible={helpPhase !== "happy"} topPx={-86} />
                        <HappyMood visible={helpPhase === "happy"} topPx={-90} />
                        <BrokenBatProp phase={helpPhase} />
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>



          {/* Helper column — Pre-K shows a friendly Nabu Helper (voice-shield orb).
              K–12 keeps the knight. Same column footprint + motion wrapper so
              existing animation hooks (heroAttacking pulse) keep working. */}
          <div className="relative flex flex-col items-center w-[44%]">
            <div className="absolute left-1/2 -translate-x-1/2 -top-14 text-xs sm:text-sm font-bold text-slate-700 bg-white/90 rounded-full px-3 py-0.5 shadow whitespace-nowrap">
              {isPreK ? "Nabu Helper" : "You can do it!"}
            </div>
            <motion.div
              animate={
                heroAttacking
                  ? { x: -32, scale: 1.08 }
                  : dogStage === "your"
                  ? { x: 0, y: 0, scale: 1.04 }
                  : { x: 0, y: [0, -5, 0] }
              }
              transition={
                heroAttacking
                  ? { duration: 0.22, ease: "easeOut" }
                  : dogStage === "your"
                  ? { duration: 0.3 }
                  : { y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }
              }
              className="relative flex h-[112px] w-[118px] items-end justify-center sm:h-[132px] sm:w-[140px]"
            >
              {isPreK ? (
                <div className="relative h-full w-full flex items-end justify-center">
                  {/* Voice-shield orb: soft mic-sparkle helper, no weapons */}
                  <motion.div
                    className="relative w-[90px] h-[90px] sm:w-[104px] sm:h-[104px] rounded-full bg-gradient-to-br from-sky-200 via-cyan-200 to-emerald-200 shadow-[0_8px_24px_rgba(56,189,248,0.35)] flex items-center justify-center"
                    animate={{
                      scale: heroAttacking ? [1, 1.15, 1] : [1, 1.04, 1],
                      boxShadow: heroAttacking
                        ? "0 0 32px rgba(167,243,208,0.9)"
                        : "0 8px 24px rgba(56,189,248,0.35)",
                    }}
                    transition={{
                      duration: heroAttacking ? 0.4 : 2.4,
                      repeat: heroAttacking ? 0 : Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="absolute inset-2 rounded-full bg-white/70" />
                    <div className="relative text-4xl sm:text-5xl">🎤</div>
                    {/* Sparkle ring */}
                    <motion.div
                      className="absolute -top-2 -right-1 text-xl"
                      animate={{ rotate: [0, 12, -8, 0], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.6, repeat: Infinity }}
                    >
                      ✨
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-1 -left-2 text-base"
                      animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                    >
                      ✨
                    </motion.div>
                  </motion.div>
                </div>
              ) : (
                <RPGCharacterSprite type="knight" size="lg" isAttacking={heroAttacking} />
              )}
              {/* YOUR dog — sits just to the left of the helper, leash to helper's hand. */}
              <DogWithLeashProp
                visible={dogStage === "your"}
                holder="right"
                leftPct={-55}
                scale={1}
                leashLength={62}
                leashAngleDeg={-30}
              />
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
              <div
                className={`${
                  allDone && nabuCopy
                    ? "text-2xl sm:text-3xl text-emerald-700 font-extrabold"
                    : "text-5xl sm:text-6xl text-slate-900 font-black lowercase"
                } leading-tight`}
              >
                {currentPhrase || (allDone ? (nabuCopy?.successMessage ?? "🎉") : "")}
              </div>

              {!allDone && (
                <div className="mt-1 text-xs sm:text-sm font-bold text-slate-400 tracking-widest">
                  {syllableHint(currentPhrase)}
                </div>
              )}
              {verbHint && !allDone && (
                <div className="mt-1 inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                  {nabuCopy?.hint ?? "✨ Watch what happens!"}

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
