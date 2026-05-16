import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Sparkles, Mic, MicOff, Zap, Flame, Snowflake, Pause, Play, Flame as Combo } from "lucide-react";
import { speechManager } from "@/lib/speechRecognitionManager";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";
import { curatedStories } from "@/data/curatedStories";
import {
  planWave, coinsForWave, TUTORIAL_WAVES,
  makeSeededRng, hashSeed, computeStars,
} from "./WaveDirector";
import { ENEMY_TYPES, EnemyType } from "./enemyTypes";
import { SwarmEnemy } from "./SwarmEnemy";
import { EnemyCastle } from "./EnemyCastle";
import { WaveInterstitial } from "./WaveInterstitial";
import { WaveSurvivedCard, RunSummary } from "./WaveSurvivedCard";
import type { CampaignLevel } from "./campaignLevels";
import { useCastleCampaign } from "@/hooks/useCastleCampaign";
import { useCastleUpgrades } from "@/hooks/useCastleUpgrades";

interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  hp: number;
  maxHp: number;
  speed: number;
  slowUntil: number;
  dying: boolean;
  flying: boolean;
}
interface Knight {
  id: number; x: number; hp: number; maxHp: number;
}

export type CastleRunMode =
  | { kind: "endless" }
  | { kind: "campaign"; level: CampaignLevel }
  | { kind: "daily"; seed: string };

interface Props {
  mode: CastleRunMode;
  onExit: () => void;
}

const ARENA_WIDTH = 900;
const CASTLE_HP_MAX = 100;
const KNIGHT_SPEED = 25;
const POWER_COOLDOWN_MS = 7000;
const SUPER_FILL_PER_WORD = 4;
const SUPER_FILL_PER_SENTENCE = 35;

type PowerId = "fireball" | "ice" | "lightning";
const POWERS: { id: PowerId; label: string; icon: typeof Flame; color: string }[] = [
  { id: "fireball", label: "Fireball", icon: Flame, color: "from-orange-500 to-red-600" },
  { id: "ice", label: "Ice", icon: Snowflake, color: "from-cyan-400 to-blue-600" },
  { id: "lightning", label: "Lightning", icon: Zap, color: "from-yellow-300 to-amber-500" },
];

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z']/g, "");

export const CastleSwarmArena = ({ mode, onExit }: Props) => {
  const { user } = useAuth();
  const gradeMode = getGradeMode(getStoredTheme());
  const characterName = gradeMode === "6to12" ? "Agent X" : "Sir Valor";
  const { save: saveCampaign } = useCastleCampaign();
  const { stats: knightStats } = useCastleUpgrades();

  // ---- Reading content ----
  const wordPool = useMemo(() => {
    const stories = curatedStories.filter(s =>
      gradeMode === "6to12" ? s.grade_level >= 6 : s.grade_level <= 5
    );
    const text = (stories.length ? stories : curatedStories)
      .slice(0, 12).map(s => s.passage_text).join(" ");
    const words = Array.from(new Set(
      text.split(/\s+/).map(normalize).filter(w => w.length >= 2 && w.length <= 10)
    ));
    return words.length ? words : ["read", "brave", "knight", "castle", "story", "magic"];
  }, [gradeMode]);

  const passagePool = useMemo(() => {
    const stories = curatedStories.filter(s =>
      gradeMode === "6to12" ? s.grade_level >= 6 : s.grade_level <= 5
    );
    const source = stories.length ? stories : curatedStories;
    return source.flatMap(s => s.passage_text.split(/(?<=[.!?])\s+/))
      .filter(p => { const n = p.split(/\s+/).length; return n >= 5 && n <= 14; })
      .slice(0, 80);
  }, [gradeMode]);

  // ---- React state (HUD-visible only, throttled) ----
  const [castleHpHud, setCastleHpHud] = useState(CASTLE_HP_MAX);
  const [enemyCastleHpHud, setEnemyCastleHpHud] = useState(0);
  const [superMeter, setSuperMeter] = useState(0);
  const [waveHud, setWaveHud] = useState(1);
  const [waveBanner, setWaveBanner] = useState<string | null>(null);
  const [enemyTick, setEnemyTick] = useState(0);
  const [activeWordHud, setActiveWordHud] = useState("");
  const [activePassageHud, setActivePassageHud] = useState<string | null>(null);
  const [recognising, setRecognising] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const [powerCooldowns, setPowerCooldowns] = useState<Record<PowerId, number>>({ fireball: 0, ice: 0, lightning: 0 });
  const [summary, setSummary] = useState<(RunSummary & { stars: number }) | null>(null);
  const [paused, setPaused] = useState(false);
  const [comboHud, setComboHud] = useState(0);
  const [interstitial, setInterstitial] = useState<{ wave: number; coins: number } | null>(null);

  // ---- Refs (volatile counters per memory rule) ----
  const enemiesRef = useRef<Enemy[]>([]);
  const knightsRef = useRef<Knight[]>([]);
  const enemyIdRef = useRef(1);
  const knightIdRef = useRef(1);
  const waveRef = useRef(1);
  const waveSpawnedRef = useRef(0);
  const waveTotalRef = useRef(0);
  const nextSpawnAtRef = useRef(0);
  const passageDueAtRef = useRef(0);
  const compositionRef = useRef<EnemyType[]>(["goblin"]);
  const compositionIdxRef = useRef(0);
  const wordIndexRef = useRef(0);
  const wordsReadRef = useRef(0);
  const wordsAttemptedRef = useRef(0);
  const knightsSummonedRef = useRef(0);
  const streakRef = useRef(0);
  const longestStreakRef = useRef(0);
  const coinsRef = useRef(0);
  const enemyCastleDmgRef = useRef(0);
  const castleHpRef = useRef(CASTLE_HP_MAX);
  const enemyCastleHpRef = useRef(0);
  const superMeterRef = useRef(0);
  const endedRef = useRef(false);
  const pausedRef = useRef(false);
  const transitioningRef = useRef(false);
  // Stale-closure-safe mirrors for the speech callback
  const activeWordRef = useRef("");
  const activePassageRef = useRef<string | null>(null);
  // Seeded RNG (daily) or Math.random
  const rngRef = useRef<() => number>(Math.random);

  // ---- Pick next word ----
  const pickWord = useCallback(() => {
    const w = wordPool[wordIndexRef.current % wordPool.length];
    wordIndexRef.current += 1;
    activeWordRef.current = w;
    setActiveWordHud(w);
  }, [wordPool]);

  // ---- Save run ----
  const persistRun = useCallback((reason: "win" | "loss" | "quit", finalAcc: number, finalCoins: number) => {
    if (!user?.id) return;
    supabase.from("castle_swarm_runs").insert({
      user_id: user.id,
      grade_mode: gradeMode,
      character_id: characterName,
      wave_reached: waveRef.current,
      words_read: wordsReadRef.current,
      accuracy: finalAcc,
      knights_summoned: knightsSummonedRef.current,
      enemy_castle_hp_dealt: enemyCastleDmgRef.current,
      coins_earned: finalCoins,
      ended_reason: reason,
      challenge_seed: mode.kind === "daily" ? mode.seed : null,
    }).then(({ error }) => { if (error) console.error("[CastleSwarm] save", error); });
  }, [user?.id, gradeMode, characterName, mode]);

  // ---- End run ----
  const endRun = useCallback((reason: "win" | "loss" | "quit") => {
    if (endedRef.current) return;
    endedRef.current = true;
    speechManager.stop("castle_swarm" as any);
    const acc = wordsAttemptedRef.current === 0
      ? 100
      : Math.round((wordsReadRef.current / wordsAttemptedRef.current) * 100);
    const finalCoins = coinsRef.current;
    const won = reason === "win";

    let stars = 0;
    if (mode.kind === "campaign") {
      stars = computeStars(
        { needAccuracy: mode.level.starThresholds.needAccuracy, needWords: mode.level.starThresholds.needWords, mustWin: true },
        { won, accuracy: acc, wordsRead: wordsReadRef.current }
      );
      saveCampaign({
        level_id: mode.level.id,
        stars,
        wave: waveRef.current,
        accuracy: acc,
        words_read: wordsReadRef.current,
        won,
      });
    }

    setSummary({
      waveReached: waveRef.current,
      wordsRead: wordsReadRef.current,
      accuracy: acc,
      knightsSummoned: knightsSummonedRef.current,
      coinsEarned: finalCoins,
      longestStreak: longestStreakRef.current,
      endedReason: reason,
      characterName,
      stars,
    });
    persistRun(reason, acc, finalCoins);
  }, [mode, characterName, saveCampaign, persistRun]);

  // ---- Start a wave ----
  const startWave = useCallback((n: number) => {
    transitioningRef.current = false;
    let composition: EnemyType[];
    let totalEnemies: number;
    let cadenceMs: number;
    let baseSpeed: number;
    let hpBonus: number;
    let isEndless = false;
    let banner = `Wave ${n}`;

    if (mode.kind === "campaign") {
      const lvl = mode.level;
      composition = lvl.composition;
      totalEnemies = 3 + Math.floor(n * 1.5);
      cadenceMs = Math.max(700, 1800 - n * 90);
      baseSpeed = lvl.baseSpeedPxPerSec + n * 3;
      hpBonus = Math.floor(n / 3);
      banner = `${lvl.name} · Wave ${n}/${lvl.waveCount}`;
    } else {
      const plan = planWave(n);
      composition = plan.composition;
      totalEnemies = plan.totalEnemies;
      cadenceMs = plan.cadenceMs;
      baseSpeed = plan.baseSpeedPxPerSec;
      hpBonus = plan.hpBonus;
      isEndless = plan.isEndless;
      banner = isEndless ? `Endless · Wave ${n}` : `Wave ${n}`;
    }

    // Boss wave every 5th wave (endless/daily/campaign): single tanky orc
    const isBossWave = n > 0 && n % 5 === 0;
    if (isBossWave) {
      composition = ["orc"];
      totalEnemies = 1;
      cadenceMs = 1500;
      hpBonus = hpBonus + Math.max(6, Math.floor(n * 1.5)); // 3x-ish HP swell
      banner = `⚔️ Boss Wave ${n}!`;
    }

    compositionRef.current = composition;
    compositionIdxRef.current = 0;
    waveSpawnedRef.current = 0;
    waveTotalRef.current = totalEnemies;
    nextSpawnAtRef.current = performance.now() + 1000;
    passageDueAtRef.current = performance.now() + 18000;
    waveRef.current = n;
    setWaveHud(n);
    setWaveBanner(banner);
    setTimeout(() => setWaveBanner(null), isBossWave ? 2600 : 2000);

    // Stash plan params on a single shared "wavePlan" via refs (closures read them below)
    (window as any).__cs_wave = { cadenceMs, baseSpeed, hpBonus };
  }, [mode]);

  // ---- Initial setup ----
  useEffect(() => {
    // RNG
    if (mode.kind === "daily") rngRef.current = makeSeededRng(hashSeed(mode.seed));

    // Enemy castle setup
    if (mode.kind === "campaign") {
      enemyCastleHpRef.current = mode.level.enemyCastleHp;
      setEnemyCastleHpHud(mode.level.enemyCastleHp);
    } else if (mode.kind === "endless" || mode.kind === "daily") {
      enemyCastleHpRef.current = 0;       // no enemy castle in endless
      setEnemyCastleHpHud(0);
    }

    castleHpRef.current = CASTLE_HP_MAX;
    setCastleHpHud(CASTLE_HP_MAX);
    pickWord();
    startWave(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Speech ----
  const handleTranscript = useCallback((transcript: string) => {
    if (endedRef.current || pausedRef.current) return;
    const said = normalize(transcript);
    if (!said) return;
    setLastHeard(transcript);

    // Passage scoring
    const passage = activePassageRef.current;
    if (passage) {
      const target = passage.split(/\s+/).map(normalize).filter(Boolean);
      const heardWords = new Set(said.split(/\s+/).filter(Boolean));
      const hit = target.filter(w => heardWords.has(w)).length;
      if (hit / target.length >= 0.6) {
        superMeterRef.current = Math.min(100, superMeterRef.current + SUPER_FILL_PER_SENTENCE);
        setSuperMeter(superMeterRef.current);
        wordsReadRef.current += target.length;
        wordsAttemptedRef.current += target.length;
        streakRef.current += target.length;
        longestStreakRef.current = Math.max(longestStreakRef.current, streakRef.current);
        setComboHud(streakRef.current);
        setFeedback({ text: "+Super charged!", good: true, id: Date.now() });
        activePassageRef.current = null;
        setActivePassageHud(null);
        passageDueAtRef.current = performance.now() + 22000;
      }
      return;
    }

    // Word fire
    const target = activeWordRef.current;
    if (!target) return;
    const heardWords = said.split(/\s+/);
    wordsAttemptedRef.current += 1;
    if (heardWords.some(w => w === target)) {
      wordsReadRef.current += 1;
      streakRef.current += 1;
      longestStreakRef.current = Math.max(longestStreakRef.current, streakRef.current);
      setComboHud(streakRef.current);

      // Attack front non-flying enemy first; flying still hittable but knights miss them
      const enemies = enemiesRef.current.filter(e => !e.dying);
      if (enemies.length) {
        const front = enemies.reduce((a, b) => (a.x < b.x ? a : b));
        front.hp -= 1;
        if (front.hp <= 0) front.dying = true;
      }
      if (target.length >= 7 && knightsRef.current.length < knightStats.summonCap) {
        knightsRef.current.push({
          id: knightIdRef.current++,
          x: ARENA_WIDTH - 60,
          hp: knightStats.knightHp,
          maxHp: knightStats.knightHp,
        });
        knightsSummonedRef.current += 1;
        setFeedback({ text: "Knight summoned!", good: true, id: Date.now() });
      } else {
        setFeedback({ text: `+${target}`, good: true, id: Date.now() });
      }
      superMeterRef.current = Math.min(100, superMeterRef.current + SUPER_FILL_PER_WORD);
      setSuperMeter(superMeterRef.current);
      pickWord();
    } else {
      streakRef.current = 0;
      setComboHud(0);
      setFeedback({ text: "try again", good: false, id: Date.now() });
    }
  }, [pickWord, knightStats.knightHp, knightStats.summonCap]);

  const toggleMic = useCallback(() => {
    if (recognising) {
      speechManager.stop("castle_swarm" as any);
      setRecognising(false);
      return;
    }
    const ok = speechManager.start({
      owner: "castle_swarm" as any,
      continuous: true,
      interimResults: false,
      onResult: (transcript, _alts, isFinal) => { if (isFinal) handleTranscript(transcript); },
      onStart: () => setRecognising(true),
      onEnd: () => setRecognising(false),
      onError: () => setRecognising(false),
    });
    if (!ok) setRecognising(false);
  }, [recognising, handleTranscript]);

  // ---- Powers ----
  const castPower = useCallback((id: PowerId) => {
    if ((powerCooldowns[id] ?? 0) > Date.now()) return;
    setPowerCooldowns(prev => ({ ...prev, [id]: Date.now() + POWER_COOLDOWN_MS }));
    const enemies = enemiesRef.current;
    if (id === "fireball") {
      enemies.slice().filter(e => !e.dying).sort((a, b) => a.x - b.x).slice(0, 3).forEach(e => {
        e.hp -= 2; if (e.hp <= 0) e.dying = true;
      });
    } else if (id === "ice") {
      enemies.forEach(e => {
        if (e.dying) return;
        if (!ENEMY_TYPES[e.type].ignoresSlow) e.slowUntil = performance.now() + 4000;
        e.hp -= 1; if (e.hp <= 0) e.dying = true;
      });
    } else if (id === "lightning") {
      enemies.forEach(e => { if (e.dying) return; e.hp -= 1; if (e.hp <= 0) e.dying = true; });
    }
    setFeedback({ text: `${id} cast!`, good: true, id: Date.now() });
  }, [powerCooldowns]);

  const castSuper = useCallback(() => {
    if (superMeterRef.current < 100) return;
    superMeterRef.current = 0;
    setSuperMeter(0);
    enemiesRef.current.forEach(e => { e.hp = 0; e.dying = true; });
    setFeedback({ text: "SCREEN CLEAR!", good: true, id: Date.now() });
  }, []);

  // ---- Main loop (refs-only deps; never restarts) ----
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let hudTick = 0;

    const loop = (now: number) => {
      if (endedRef.current) return;
      const dt = pausedRef.current ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;

      if (!pausedRef.current) {
        const wp = (window as any).__cs_wave as { cadenceMs: number; baseSpeed: number; hpBonus: number } | undefined;

        // 1. Spawn
        if (wp && waveSpawnedRef.current < waveTotalRef.current && now >= nextSpawnAtRef.current) {
          const type = compositionRef.current[compositionIdxRef.current % compositionRef.current.length];
          compositionIdxRef.current += 1;
          const def = ENEMY_TYPES[type];
          const hp = def.baseHp + wp.hpBonus;
          enemiesRef.current.push({
            id: enemyIdRef.current++,
            type,
            x: ARENA_WIDTH,
            hp,
            maxHp: hp,
            speed: wp.baseSpeed * def.speedMul,
            slowUntil: 0,
            dying: false,
            flying: !!def.flying,
          });
          waveSpawnedRef.current += 1;
          nextSpawnAtRef.current = now + wp.cadenceMs;
        }

        // 2. Shaman healing
        const livingEnemies = enemiesRef.current.filter(e => !e.dying);
        livingEnemies.forEach(e => {
          if (ENEMY_TYPES[e.type].healsAllies) {
            // heal nearest non-shaman ally up to maxHp
            const ally = livingEnemies.find(a => a.id !== e.id && !ENEMY_TYPES[a.type].healsAllies && a.hp < a.maxHp);
            if (ally) ally.hp = Math.min(ally.maxHp, ally.hp + 1 * dt);
          }
        });

        // 3. Move enemies
        enemiesRef.current.forEach(e => {
          if (e.dying) return;
          const slowed = now < e.slowUntil;
          e.x -= e.speed * dt * (slowed ? 0.4 : 1);
          if (e.x <= 0) {
            castleHpRef.current = Math.max(0, castleHpRef.current - ENEMY_TYPES[e.type].castleDamage);
            e.dying = true;
          }
        });

        // 4. Move/engage knights
        knightsRef.current.forEach(k => {
          const target = enemiesRef.current.find(e => !e.dying && !e.flying && Math.abs(e.x - k.x) < 25);
          if (target) {
            target.hp -= knightStats.knightDps * dt;
            if (target.hp <= 0) target.dying = true;
            k.hp -= 1.2 * dt;
          } else if (enemyCastleHpRef.current > 0 && k.x <= 60) {
            // Knight attacks enemy castle
            const dmg = knightStats.knightDps * dt;
            enemyCastleHpRef.current = Math.max(0, enemyCastleHpRef.current - dmg);
            enemyCastleDmgRef.current += dmg;
          } else {
            k.x -= KNIGHT_SPEED * dt;
          }
        });

        // 5. Cleanup
        enemiesRef.current = enemiesRef.current.filter(e => !(e.dying && e.hp <= -3));
        knightsRef.current = knightsRef.current.filter(k => k.hp > 0 && k.x > -10);

        // 6. Passage prompt
        if (!activePassageRef.current && now >= passageDueAtRef.current && passagePool.length) {
          const p = passagePool[Math.floor(rngRef.current() * passagePool.length)];
          activePassageRef.current = p;
          setActivePassageHud(p);
          passageDueAtRef.current = now + 60_000;
        }

        // 7. Wave clear?
        if (!transitioningRef.current &&
            waveSpawnedRef.current >= waveTotalRef.current &&
            enemiesRef.current.filter(e => !e.dying).length === 0) {
          transitioningRef.current = true;
          const earned = coinsForWave(waveRef.current);
          coinsRef.current += earned;
          const completedWave = waveRef.current;

          // Campaign: end after waveCount; win condition can also be enemy castle 0
          const isCampaign = mode.kind === "campaign";
          const totalWaves = isCampaign ? (mode.level as CampaignLevel).waveCount : Infinity;

          if (completedWave >= totalWaves) {
            // Survived all waves: campaign win if enemy castle defeated, else partial
            if (isCampaign && enemyCastleHpRef.current <= 0) {
              setTimeout(() => endRun("win"), 600);
            } else if (isCampaign) {
              // Campaign without breaking enemy keep = loss/partial
              setTimeout(() => endRun(enemyCastleHpRef.current <= 0 ? "win" : "loss"), 600);
            }
          } else {
            setInterstitial({ wave: completedWave, coins: earned });
            setTimeout(() => {
              setInterstitial(null);
              startWave(completedWave + 1);
            }, 1600);
          }
        }

        // 8. Enemy castle defeated mid-wave (campaign instant win)
        if (mode.kind === "campaign" && enemyCastleHpRef.current <= 0 && enemyCastleHpRef.current !== -1) {
          enemyCastleHpRef.current = -1;
          setTimeout(() => endRun("win"), 500);
        }

        // 9. Game over
        if (castleHpRef.current <= 0 && !endedRef.current) {
          endRun("loss");
        }
      }

      // 10. HUD throttle ~10hz
      hudTick += (now - last + dt * 1000) / 1000;
      if (hudTick > 0.08) {
        hudTick = 0;
        setCastleHpHud(castleHpRef.current);
        if (mode.kind === "campaign") setEnemyCastleHpHud(Math.max(0, enemyCastleHpRef.current));
        setEnemyTick(t => t + 1);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep paused flag mirrored
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  // Cleanup speech
  useEffect(() => () => { speechManager.stop("castle_swarm" as any); }, []);

  // ---- Render ----
  const enemies = enemiesRef.current;
  const knights = knightsRef.current;
  const enemyCastleMax = mode.kind === "campaign" ? mode.level.enemyCastleHp : 0;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-black/40 backdrop-blur-sm">
        <Button variant="ghost" size="sm" onClick={() => endRun("quit")} className="text-white">
          <ArrowLeft className="w-4 h-4 mr-1" /> Exit
        </Button>
        <div className="text-amber-300 font-bold text-sm">
          {mode.kind === "campaign"
            ? `${mode.level.name} · ${waveHud}/${mode.level.waveCount}`
            : mode.kind === "daily" ? `Daily · Wave ${waveHud}`
            : waveHud > TUTORIAL_WAVES ? `ENDLESS · Wave ${waveHud}` : `Wave ${waveHud} / ${TUTORIAL_WAVES}`}
        </div>
        <div className="flex items-center gap-2 text-white">
          <Heart className="w-4 h-4 text-red-400" />
          <div className="w-28 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all" style={{ width: `${castleHpHud}%` }} />
          </div>
          <span className="text-xs w-6 text-right">{castleHpHud}</span>
          <Button variant="ghost" size="icon" onClick={() => setPaused(p => !p)} className="text-white h-7 w-7">
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Wave banner */}
      <AnimatePresence>
        {waveBanner && (
          <motion.div
            initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-amber-500 text-black font-black rounded-full shadow-lg"
          >
            {waveBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo */}
      {comboHud >= 3 && (
        <div className="absolute top-16 right-4 z-20 flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/90 text-white font-bold text-sm shadow-lg">
          <Combo className="w-4 h-4" /> Combo x{comboHud}
        </div>
      )}

      {/* Battlefield */}
      <div className="absolute inset-x-0 top-14 bottom-44 flex">
        <div className="relative w-full h-full" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(20,40,20,0.5))" }}>
          {/* Player castle (right) */}
          <div className="absolute right-0 top-0 bottom-0 w-20 flex items-end justify-center">
            <div className="text-6xl pb-4">🏰</div>
          </div>
          {/* Enemy castle (left) — only in campaign */}
          {mode.kind === "campaign" && <EnemyCastle hp={enemyCastleHpHud} maxHp={enemyCastleMax} />}

          {/* Enemies */}
          {enemies.map(e => {
            const pct = (e.x / ARENA_WIDTH) * 100;
            return (
              <div key={e.id} className="absolute bottom-6 transition-opacity"
                style={{ left: `${100 - pct}%`, opacity: e.dying ? 0 : 1 }}>
                <SwarmEnemy type={e.type} hp={e.hp} maxHp={e.maxHp} flying={e.flying} />
              </div>
            );
          })}

          {/* Knights */}
          {knights.map(k => {
            const pct = (k.x / ARENA_WIDTH) * 100;
            return (
              <div key={k.id} className="absolute bottom-6 flex flex-col items-center" style={{ left: `${100 - pct}%` }}>
                <div className="w-8 h-1 bg-slate-700 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-emerald-500" style={{ width: `${(k.hp / k.maxHp) * 100}%` }} />
                </div>
                <div className="text-3xl">🛡️</div>
              </div>
            );
          })}

          {/* Feedback float */}
          <AnimatePresence>
            {feedback && (
              <motion.div key={feedback.id}
                initial={{ y: 0, opacity: 1 }} animate={{ y: -40, opacity: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                onAnimationComplete={() => setFeedback(null)}
                className={`absolute bottom-24 left-1/2 -translate-x-1/2 font-bold text-lg ${feedback.good ? "text-emerald-300" : "text-rose-300"}`}>
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pause overlay */}
          {paused && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
              <div className="text-white font-black text-4xl">PAUSED</div>
            </div>
          )}

          {/* Interstitial */}
          <WaveInterstitial show={!!interstitial} wave={interstitial?.wave ?? 0} coins={interstitial?.coins ?? 0} />
        </div>
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/70 backdrop-blur-sm p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-pink-500 transition-all" style={{ width: `${superMeter}%` }} />
          </div>
          <Button size="sm" disabled={superMeter < 100} onClick={castSuper} className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-7">
            SUPER
          </Button>
        </div>

        <div className="bg-slate-800/70 rounded-lg p-2 min-h-[56px] flex flex-col items-center justify-center text-center">
          {activePassageHud ? (
            <>
              <div className="text-[10px] uppercase text-amber-300">Read this passage to charge SUPER</div>
              <div className="text-white text-sm leading-snug">{activePassageHud}</div>
            </>
          ) : (
            <>
              <div className="text-[10px] uppercase text-slate-400">Read aloud to attack</div>
              <div className="text-white text-3xl font-black tracking-wide">{activeWordHud || "—"}</div>
              {activeWordHud.length >= 7 && (
                <div className="text-[10px] text-emerald-300 mt-0.5">Power word — summons a knight!</div>
              )}
            </>
          )}
          {lastHeard && <div className="text-[10px] text-slate-500 mt-0.5">heard: "{lastHeard}"</div>}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {POWERS.map(p => {
              const remaining = Math.max(0, (powerCooldowns[p.id] ?? 0) - Date.now());
              const ready = remaining === 0;
              const Icon = p.icon;
              return (
                <button key={p.id} onClick={() => castPower(p.id)} disabled={!ready}
                  className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg disabled:opacity-40 transition`}
                  title={p.label}>
                  <Icon className="w-6 h-6 text-white" />
                  {!ready && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/40 rounded-xl">
                      {Math.ceil(remaining / 1000)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Button onClick={toggleMic}
            className={`h-12 px-4 font-bold ${recognising ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"} text-white`}>
            {recognising ? <><MicOff className="w-4 h-4 mr-1" /> Listening</> : <><Mic className="w-4 h-4 mr-1" /> Talk</>}
          </Button>
        </div>
      </div>

      {summary && (
        <WaveSurvivedCard
          summary={summary}
          stars={summary.stars}
          showStars={mode.kind === "campaign"}
          onPlayAgain={() => { window.location.reload(); }}
          onExit={onExit}
        />
      )}
    </div>
  );
};
