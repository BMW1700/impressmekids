import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Sparkles, Zap, Flame, Snowflake, Pause, Play, Flame as Combo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";
import { curatedStories } from "@/data/curatedStories";
import {
  planWave, coinsForWave, TUTORIAL_WAVES, computeEnemyHp,
  makeSeededRng, hashSeed, computeStars,
} from "./WaveDirector";
import { ENEMY_TYPES, EnemyType } from "./enemyTypes";
import { SwarmEnemy } from "./SwarmEnemy";
import { EnemyCastle } from "./EnemyCastle";
import { PlayerCastle } from "./sprites/PlayerCastle";
import { ArenaBackground } from "./ArenaBackground";
import { WaveInterstitial } from "./WaveInterstitial";
import { WaveSurvivedCard, RunSummary } from "./WaveSurvivedCard";
import type { CampaignLevel } from "./campaignLevels";
import { useCastleCampaign } from "@/hooks/useCastleCampaign";
import { useCastleUpgrades } from "@/hooks/useCastleUpgrades";
import { RPGWordReader } from "../rpg/RPGWordReader";
import { scoreWord, pickPhonemeForWave, PhonemeTarget } from "./wordEconomy";

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
  hitFlashUntil: number;
}
interface Knight {
  id: number; x: number; hp: number; maxHp: number; spawnedAt: number;
}
interface FloatingHit {
  id: number; x: number; y: number; text: string; color: string; born: number;
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
const WORD_BATCH = 6;

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
      .slice(0, 24).map(s => s.passage_text).join(" ");
    const words = Array.from(new Set(
      text.split(/\s+/).map(normalize).filter(w => w.length >= 2 && w.length <= 10)
    ));
    return words.length ? words : ["read", "brave", "knight", "castle", "story", "magic", "shield", "valor"];
  }, [gradeMode]);

  // Sliding word batch fed to RPGWordReader
  const [batchOffset, setBatchOffset] = useState(0);
  const currentBatch = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < WORD_BATCH; i++) {
      out.push(wordPool[(batchOffset + i) % wordPool.length]);
    }
    return out;
  }, [batchOffset, wordPool]);

  // ---- React state (HUD-visible only, throttled) ----
  const [castleHpHud, setCastleHpHud] = useState(CASTLE_HP_MAX);
  const [enemyCastleHpHud, setEnemyCastleHpHud] = useState(0);
  const [superMeter, setSuperMeter] = useState(0);
  const [waveHud, setWaveHud] = useState(1);
  const [waveBanner, setWaveBanner] = useState<string | null>(null);
  const [enemyTick, setEnemyTick] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const [powerCooldowns, setPowerCooldowns] = useState<Record<PowerId, number>>({ fireball: 0, ice: 0, lightning: 0 });
  const [summary, setSummary] = useState<(RunSummary & { stars: number }) | null>(null);
  const [paused, setPaused] = useState(false);
  const [comboHud, setComboHud] = useState(0);
  const [interstitial, setInterstitial] = useState<{ wave: number; coins: number } | null>(null);
  const [shake, setShake] = useState(0); // increments to retrigger shake
  const [phonemeOfWave, setPhonemeOfWave] = useState<PhonemeTarget>(() => pickPhonemeForWave(1));
  const [shieldHud, setShieldHud] = useState(0); // Resolve shield 0–100
  const [floatingHits, setFloatingHits] = useState<FloatingHit[]>([]);

  // ---- Refs ----
  const enemiesRef = useRef<Enemy[]>([]);
  const sightStreakRef = useRef(0);
  const shieldRef = useRef(0); // 0–100
  const hitStopUntilRef = useRef(0);
  const floatingIdRef = useRef(1);
  const phonemeRef = useRef<PhonemeTarget>(pickPhonemeForWave(1));
  const knightsRef = useRef<Knight[]>([]);
  const enemyIdRef = useRef(1);
  const knightIdRef = useRef(1);
  const waveRef = useRef(1);
  const waveSpawnedRef = useRef(0);
  const waveTotalRef = useRef(0);
  const nextSpawnAtRef = useRef(0);
  const compositionRef = useRef<EnemyType[]>(["goblin"]);
  const compositionIdxRef = useRef(0);
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
  const rngRef = useRef<() => number>(Math.random);

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
    let hpMultiplier: number;
    let isBossWave: boolean;
    let banner = `Wave ${n}`;

    if (mode.kind === "campaign") {
      const lvl = mode.level;
      const plan = planWave(n);
      isBossWave = plan.isBossWave;
      composition = isBossWave ? plan.composition : lvl.composition;
      totalEnemies = isBossWave ? 1 : 3 + Math.floor(n * 1.5);
      cadenceMs = isBossWave ? 1500 : Math.max(700, 1800 - n * 90);
      baseSpeed = isBossWave ? plan.baseSpeedPxPerSec : lvl.baseSpeedPxPerSec + n * 3;
      hpBonus = isBossWave ? plan.hpBonus : Math.floor(n / 2);
      hpMultiplier = isBossWave ? plan.hpMultiplier : 1;
      banner = isBossWave ? `⚔️ BOSS WAVE ${n}!` : `${lvl.name} · Wave ${n}/${lvl.waveCount}`;
    } else {
      const plan = planWave(n);
      composition = plan.composition;
      totalEnemies = plan.totalEnemies;
      cadenceMs = plan.cadenceMs;
      baseSpeed = plan.baseSpeedPxPerSec;
      hpBonus = plan.hpBonus;
      hpMultiplier = plan.hpMultiplier;
      isBossWave = plan.isBossWave;
      banner = isBossWave ? `⚔️ BOSS WAVE ${n}!` : plan.isEndless ? `Endless · Wave ${n}` : `Wave ${n}`;
    }

    compositionRef.current = composition;
    compositionIdxRef.current = 0;
    waveSpawnedRef.current = 0;
    waveTotalRef.current = totalEnemies;
    nextSpawnAtRef.current = performance.now() + 1000;
    waveRef.current = n;
    setWaveHud(n);
    setWaveBanner(banner);
    setTimeout(() => setWaveBanner(null), isBossWave ? 2600 : 1800);

    // Rotate phoneme target each wave
    const ph = pickPhonemeForWave(n);
    phonemeRef.current = ph;
    setPhonemeOfWave(ph);

    (window as any).__cs_wave = { cadenceMs, baseSpeed, hpBonus, hpMultiplier };
  }, [mode]);

  // ---- Initial setup ----
  useEffect(() => {
    if (mode.kind === "daily") rngRef.current = makeSeededRng(hashSeed(mode.seed));

    if (mode.kind === "campaign") {
      enemyCastleHpRef.current = mode.level.enemyCastleHp;
      setEnemyCastleHpHud(mode.level.enemyCastleHp);
    } else {
      enemyCastleHpRef.current = 0;
      setEnemyCastleHpHud(0);
    }

    castleHpRef.current = CASTLE_HP_MAX;
    setCastleHpHud(CASTLE_HP_MAX);
    startWave(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Word-attack handler from RPGWordReader ----
  const spawnFloatingHit = useCallback((x: number, text: string, color: string) => {
    const id = floatingIdRef.current++;
    setFloatingHits(prev => [...prev, { id, x, y: 0, text, color, born: performance.now() }]);
    setTimeout(() => setFloatingHits(prev => prev.filter(f => f.id !== id)), 900);
  }, []);

  const handleWordResult = useCallback((correct: boolean, spokenWord: string, wordIndex: number) => {
    if (endedRef.current || pausedRef.current) return;
    const target = currentBatch[wordIndex] || "";
    wordsAttemptedRef.current += 1;

    if (correct) {
      wordsReadRef.current += 1;
      streakRef.current += 1;
      longestStreakRef.current = Math.max(longestStreakRef.current, streakRef.current);
      setComboHud(streakRef.current);

      const result = scoreWord(target, {
        phonemeOfWave: phonemeRef.current,
        sightStreak: sightStreakRef.current,
      });

      // Track sight-word streak (mirrors scoreWord's internal sight check)
      const isSightWord = result.shieldCharge > 0;
      sightStreakRef.current = isSightWord ? sightStreakRef.current + 1 : 0;

      // Apply damage
      const living = enemiesRef.current.filter(e => !e.dying);
      const target_enemy = (() => {
        if (!living.length) return null;
        // If pierces, prefer armored enemies first; else front-most.
        if (result.pierces) {
          const armored = living.find(e => e.type === "armored_orc");
          if (armored) return armored;
        }
        return living.reduce((a, b) => (a.x < b.x ? a : b));
      })();

      if (target_enemy) {
        const dmg = result.crit ? result.dmg * 2 : result.dmg;
        target_enemy.hp -= dmg;
        target_enemy.hitFlashUntil = performance.now() + (result.crit ? 260 : 180);
        if (target_enemy.hp <= 0) target_enemy.dying = true;
        const xPct = 100 - (target_enemy.x / ARENA_WIDTH) * 100;
        const color = result.phonemeHit ? "text-amber-300"
                    : result.crit ? "text-rose-300"
                    : result.heal > 0 ? "text-emerald-300"
                    : "text-sky-200";
        spawnFloatingHit(xPct, `-${dmg}${result.crit ? "!" : ""}`, color);
        // Hit-stop on crit
        if (result.crit) hitStopUntilRef.current = performance.now() + 70;
      }

      // Knight summon
      if (result.summonsKnight && knightsRef.current.length < knightStats.summonCap) {
        knightsRef.current.push({
          id: knightIdRef.current++,
          x: 60,
          hp: knightStats.knightHp,
          maxHp: knightStats.knightHp,
          spawnedAt: performance.now(),
        });
        knightsSummonedRef.current += 1;
      }

      // Resolve shield
      if (result.shieldCharge > 0) {
        shieldRef.current = Math.min(100, shieldRef.current + result.shieldCharge);
        setShieldHud(shieldRef.current);
      }

      // Heal castle (rare vocab word)
      if (result.heal > 0) {
        castleHpRef.current = Math.min(CASTLE_HP_MAX, castleHpRef.current + result.heal);
      }

      setFeedback({ text: result.flavor, good: true, id: Date.now() });

      superMeterRef.current = Math.min(100, superMeterRef.current + result.superFill);
      setSuperMeter(superMeterRef.current);
    } else {
      streakRef.current = 0;
      sightStreakRef.current = 0;
      setComboHud(0);
      // If shield charged, it absorbs the miss instead of penalty.
      if (shieldRef.current >= 20) {
        shieldRef.current = Math.max(0, shieldRef.current - 20);
        setShieldHud(shieldRef.current);
        setFeedback({ text: "🛡 blocked", good: true, id: Date.now() });
      } else {
        setFeedback({ text: "try again", good: false, id: Date.now() });
      }
    }
  }, [currentBatch, knightStats.knightHp, knightStats.summonCap, spawnFloatingHit]);


  const handleBatchComplete = useCallback(() => {
    // Slide the word window forward
    setBatchOffset(o => o + WORD_BATCH);
  }, []);

  // ---- Powers ----
  const castPower = useCallback((id: PowerId) => {
    if (pausedRef.current) return;
    if ((powerCooldowns[id] ?? 0) > Date.now()) return;
    setPowerCooldowns(prev => ({ ...prev, [id]: Date.now() + POWER_COOLDOWN_MS }));
    const enemies = enemiesRef.current;
    if (id === "fireball") {
      enemies.slice().filter(e => !e.dying).sort((a, b) => a.x - b.x).slice(0, 3).forEach(e => {
        e.hp -= 3; e.hitFlashUntil = performance.now() + 220;
        if (e.hp <= 0) e.dying = true;
      });
    } else if (id === "ice") {
      enemies.forEach(e => {
        if (e.dying) return;
        if (!ENEMY_TYPES[e.type].ignoresSlow) e.slowUntil = performance.now() + 4000;
        e.hp -= 1; e.hitFlashUntil = performance.now() + 220;
        if (e.hp <= 0) e.dying = true;
      });
    } else if (id === "lightning") {
      enemies.forEach(e => {
        if (e.dying) return;
        e.hp -= 2; e.hitFlashUntil = performance.now() + 220;
        if (e.hp <= 0) e.dying = true;
      });
    }
    setFeedback({ text: `${id.toUpperCase()}!`, good: true, id: Date.now() });
  }, [powerCooldowns]);

  const castSuper = useCallback(() => {
    if (superMeterRef.current < 100) return;
    superMeterRef.current = 0;
    setSuperMeter(0);
    enemiesRef.current.forEach(e => { e.hp = 0; e.dying = true; });
    setShake(s => s + 1);
    setFeedback({ text: "💥 SCREEN CLEAR!", good: true, id: Date.now() });
  }, []);

  // ---- Main loop ----
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let hudTick = 0;

    const loop = (now: number) => {
      if (endedRef.current) return;
      const inHitStop = now < hitStopUntilRef.current;
      const dt = (pausedRef.current || inHitStop) ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;

      if (!pausedRef.current) {
        const wp = (window as any).__cs_wave as
          { cadenceMs: number; baseSpeed: number; hpBonus: number; hpMultiplier: number } | undefined;

        // 1. Spawn
        if (wp && waveSpawnedRef.current < waveTotalRef.current && now >= nextSpawnAtRef.current) {
          const type = compositionRef.current[compositionIdxRef.current % compositionRef.current.length];
          compositionIdxRef.current += 1;
          const def = ENEMY_TYPES[type];
          const hp = computeEnemyHp(def.baseHp, wp.hpBonus, waveRef.current, wp.hpMultiplier);
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
            hitFlashUntil: 0,
          });
          waveSpawnedRef.current += 1;
          nextSpawnAtRef.current = now + wp.cadenceMs;
        }

        // 2. Shaman healing
        const living = enemiesRef.current.filter(e => !e.dying);
        living.forEach(e => {
          if (ENEMY_TYPES[e.type].healsAllies) {
            const ally = living.find(a => a.id !== e.id && !ENEMY_TYPES[a.type].healsAllies && a.hp < a.maxHp);
            if (ally) ally.hp = Math.min(ally.maxHp, ally.hp + 1 * dt);
          }
        });

        // 3. Move enemies
        enemiesRef.current.forEach(e => {
          if (e.dying) return;
          const slowed = now < e.slowUntil;
          e.x -= e.speed * dt * (slowed ? 0.4 : 1);
          if (e.x <= 0) {
            const raw = ENEMY_TYPES[e.type].castleDamage;
            // Resolve shield absorbs up to its current value, point-for-point.
            const absorbed = Math.min(shieldRef.current, raw);
            shieldRef.current -= absorbed;
            const dmg = raw - absorbed;
            if (dmg > 0) castleHpRef.current = Math.max(0, castleHpRef.current - dmg);
            e.dying = true;
            setShake(s => s + 1);
          }
        });

        // 4. Move/engage knights
        knightsRef.current.forEach(k => {
          const target = enemiesRef.current.find(e => !e.dying && !e.flying && Math.abs(e.x - k.x) < 25);
          if (target) {
            target.hp -= knightStats.knightDps * dt;
            target.hitFlashUntil = performance.now() + 120;
            if (target.hp <= 0) target.dying = true;
            k.hp -= 1.2 * dt;
          } else if (enemyCastleHpRef.current > 0 && k.x >= ARENA_WIDTH - 60) {
            const dmg = knightStats.knightDps * dt;
            enemyCastleHpRef.current = Math.max(0, enemyCastleHpRef.current - dmg);
            enemyCastleDmgRef.current += dmg;
          } else {
            k.x += KNIGHT_SPEED * dt;
          }
        });

        // 5. Cleanup
        enemiesRef.current = enemiesRef.current.filter(e => !(e.dying && e.hp <= -3));
        knightsRef.current = knightsRef.current.filter(k => k.hp > 0 && k.x < ARENA_WIDTH + 10);

        // 6. Wave clear?
        if (!transitioningRef.current &&
            waveSpawnedRef.current >= waveTotalRef.current &&
            enemiesRef.current.filter(e => !e.dying).length === 0) {
          transitioningRef.current = true;
          const earned = coinsForWave(waveRef.current);
          coinsRef.current += earned;
          const completedWave = waveRef.current;

          const isCampaign = mode.kind === "campaign";
          const totalWaves = isCampaign ? (mode.level as CampaignLevel).waveCount : Infinity;

          if (completedWave >= totalWaves) {
            if (isCampaign && enemyCastleHpRef.current <= 0) {
              setTimeout(() => endRun("win"), 600);
            } else if (isCampaign) {
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

        // 7. Enemy castle defeated mid-wave (campaign instant win)
        if (mode.kind === "campaign" && enemyCastleHpRef.current <= 0 && enemyCastleHpRef.current !== -1) {
          enemyCastleHpRef.current = -1;
          setTimeout(() => endRun("win"), 500);
        }

        // 8. Game over
        if (castleHpRef.current <= 0 && !endedRef.current) {
          endRun("loss");
        }
      }

      // HUD throttle ~10hz
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

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // ---- Render ----
  const enemies = enemiesRef.current;
  const knights = knightsRef.current;
  const enemyCastleMax = mode.kind === "campaign" ? mode.level.enemyCastleHp : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">
      <ArenaBackground />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" size="sm" onClick={() => endRun("quit")} className="text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-1" /> Exit
        </Button>
        <div className="text-amber-300 font-black text-sm tracking-wide drop-shadow">
          {mode.kind === "campaign"
            ? `${mode.level.name} · ${waveHud}/${mode.level.waveCount}`
            : mode.kind === "daily" ? `Daily · Wave ${waveHud}`
            : waveHud > TUTORIAL_WAVES ? `ENDLESS · Wave ${waveHud}` : `Wave ${waveHud} / ${TUTORIAL_WAVES}`}
        </div>
        <div className="flex items-center gap-2 text-white">
          <Heart className="w-4 h-4 text-rose-400" />
          <div className="w-28 h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700">
            <div className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all" style={{ width: `${castleHpHud}%` }} />
          </div>
          <span className="text-xs w-6 text-right font-bold">{castleHpHud}</span>
          <Button variant="ghost" size="icon" onClick={() => setPaused(p => !p)} className="text-white h-7 w-7 hover:bg-white/10">
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Wave banner */}
      <AnimatePresence>
        {waveBanner && (
          <motion.div
            initial={{ y: -40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-6 py-2 bg-gradient-to-r from-rose-600 to-red-700 text-white font-black rounded-full shadow-2xl border-2 border-amber-400 text-lg"
          >
            {waveBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phoneme-of-wave badge — kids "hunt" for matching words */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-slate-900/85 border border-amber-400/60 text-amber-200 text-xs font-bold shadow-lg flex items-center gap-2 mt-12 sm:mt-0">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-slate-300 font-medium">Hunt:</span>
        <span className="text-amber-300 font-black tracking-wider">{phonemeOfWave.label}</span>
      </div>

      {/* Combo */}
      {comboHud >= 3 && (
        <div className="absolute top-16 right-4 z-30 flex items-center gap-1 px-3 py-1 rounded-full bg-rose-700/90 text-white font-bold text-sm shadow-lg border border-rose-400">
          <Combo className="w-4 h-4" /> Combo x{comboHud}
        </div>
      )}

      {/* Battlefield (with screen-shake) */}
      <motion.div
        key={`shake-${shake}`}
        animate={shake > 0 ? { x: [0, -8, 8, -5, 5, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="absolute inset-x-0 top-14 bottom-56 z-10"
      >
        <div className="relative w-full h-full">
          {/* Player castle (right) */}
          <div className="absolute right-2 bottom-2 z-10">
            <PlayerCastle
              hp={castleHpHud}
              maxHp={CASTLE_HP_MAX}
              variant={gradeMode === "6to12" ? "agent" : "classic"}
            />
          </div>
          {/* Enemy castle (left) — campaign only */}
          {mode.kind === "campaign" && <EnemyCastle hp={enemyCastleHpHud} maxHp={enemyCastleMax} />}

          {/* Enemies */}
          {enemies.map(e => {
            const pct = (e.x / ARENA_WIDTH) * 100;
            return (
              <motion.div
                key={e.id}
                className="absolute bottom-16"
                style={{ left: `${100 - pct}%`, opacity: e.dying ? 0 : 1 }}
                animate={e.dying ? { scale: 0.5, opacity: 0, y: 20 } : {}}
                transition={{ duration: 0.4 }}
              >
                <SwarmEnemy
                  type={e.type}
                  hp={e.hp}
                  maxHp={e.maxHp}
                  flying={e.flying}
                  takingDamage={performance.now() < e.hitFlashUntil}
                />
              </motion.div>
            );
          })}

          {/* Knights */}
          {knights.map(k => {
            const pct = (k.x / ARENA_WIDTH) * 100;
            const age = performance.now() - k.spawnedAt;
            const charging = age < 400;
            return (
              <div key={k.id} className="absolute bottom-16 flex flex-col items-center" style={{ left: `${100 - pct}%` }}>
                <div className="w-10 h-1.5 bg-slate-900/80 rounded-full overflow-hidden mb-1 border border-slate-700">
                  <div className="h-full bg-emerald-500" style={{ width: `${(k.hp / k.maxHp) * 100}%` }} />
                </div>
                <div className="relative">
                  {charging && (
                    <div
                      className="absolute inset-0 -m-2 rounded-full bg-amber-300/60 blur-md animate-pulse pointer-events-none"
                      aria-hidden
                    />
                  )}
                  <svg width="38" height="46" viewBox="0 0 38 46" className="relative">
                    {/* knight body */}
                    <rect x="11" y="22" width="16" height="18" rx="2" fill="#3b82f6" />
                    <rect x="11" y="22" width="16" height="4" fill="#60a5fa" />
                    {/* helmet */}
                    <ellipse cx="19" cy="14" rx="9" ry="10" fill="#94a3b8" />
                    <rect x="14" y="14" width="10" height="3" fill="#1a1a1a" />
                    {/* plume */}
                    <path d="M19 5 Q22 0 25 5 Q22 8 19 6 Z" fill="#dc2626" />
                    {/* shield */}
                    <rect x="2" y="24" width="9" height="13" rx="1" fill="#1d4ed8" />
                    <path d="M5 27 L8 27 M6.5 26 L6.5 32" stroke="#fef3c7" strokeWidth="1" />
                    {/* sword */}
                    <rect x="28" y="14" width="2" height="20" fill="#e5e7eb" />
                    <rect x="26" y="32" width="6" height="2" fill="#92400e" />
                  </svg>
                </div>
              </div>
            );
          })}

          {/* Floating damage numbers */}
          <AnimatePresence>
            {floatingHits.map(f => (
              <motion.div
                key={f.id}
                initial={{ y: 0, opacity: 1, scale: 0.9 }}
                animate={{ y: -40, opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                className={`absolute bottom-32 font-black text-base drop-shadow-lg pointer-events-none ${f.color}`}
                style={{ left: `${f.x}%`, transform: "translateX(-50%)" }}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Feedback float */}
          <AnimatePresence>
            {feedback && (
              <motion.div key={feedback.id}
                initial={{ y: 0, opacity: 1, scale: 0.9 }}
                animate={{ y: -50, opacity: 0, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                onAnimationComplete={() => setFeedback(null)}
                className={`absolute bottom-32 left-1/2 -translate-x-1/2 font-black text-xl drop-shadow-lg ${feedback.good ? "text-emerald-300" : "text-rose-300"}`}>
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pause overlay */}
          {paused && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="text-white font-black text-4xl tracking-widest">PAUSED</div>
            </div>
          )}

          {/* Interstitial */}
          <WaveInterstitial show={!!interstitial} wave={interstitial?.wave ?? 0} coins={interstitial?.coins ?? 0} />
        </div>
      </motion.div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-slate-950/90 to-slate-950/60 backdrop-blur-sm p-3 space-y-2 border-t border-rose-900/40">
        {/* Resolve shield bar (from sight-word streaks) */}
        {shieldHud > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-cyan-300 text-xs font-bold" aria-hidden>🛡</span>
            <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all" style={{ width: `${shieldHud}%` }} />
            </div>
            <span className="text-cyan-200 text-[10px] font-bold w-8 text-right">Resolve</span>
          </div>
        )}
        {/* Super bar */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <div className="flex-1 h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700">
            <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all" style={{ width: `${superMeter}%` }} />
          </div>
          <Button
            size="sm"
            disabled={superMeter < 100}
            onClick={castSuper}
            className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black h-7 disabled:opacity-40"
          >
            SUPER
          </Button>
        </div>

        {/* Powers + word reader */}
        <div className="flex items-stretch gap-3">
          <div className="flex flex-col gap-2">
            {POWERS.map(p => {
              const remaining = Math.max(0, (powerCooldowns[p.id] ?? 0) - Date.now());
              const ready = remaining === 0;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => castPower(p.id)}
                  disabled={!ready || paused}
                  className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg disabled:opacity-40 transition hover:scale-105 active:scale-95`}
                  title={p.label}
                >
                  <Icon className="w-6 h-6 text-white drop-shadow" />
                  {!ready && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/50 rounded-xl">
                      {Math.ceil(remaining / 1000)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex-1 rounded-2xl bg-slate-900/60 border border-slate-800 p-1.5 overflow-hidden">
            <RPGWordReader
              key={`castle-batch-${batchOffset}`}
              words={currentBatch}
              onResult={handleWordResult}
              onBatchComplete={handleBatchComplete}
              batchSize={WORD_BATCH}
              enableEchoRetry={true}
              mode="fast"
              compact
              disabled={paused}
              streak={comboHud}
            />
          </div>
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
