import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Sparkles, Mic, MicOff, Shield, Zap, Flame, Snowflake } from "lucide-react";
import { MiniGoblin } from "@/components/aura/game/rpg/MiniGoblin";
import { speechManager } from "@/lib/speechRecognitionManager";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";
import { curatedStories } from "@/data/curatedStories";
import { planWave, coinsForWave, TUTORIAL_WAVES } from "./WaveDirector";
import { WaveSurvivedCard, RunSummary } from "./WaveSurvivedCard";

interface Enemy {
  id: number;
  x: number;          // px from castle (right side). Decreases over time.
  hp: number;
  maxHp: number;
  speed: number;      // px / sec, scaled by slow effects
  slowUntil: number;  // performance.now() timestamp
  dying: boolean;
}

interface Knight {
  id: number;
  x: number;          // px from castle, advances left
  hp: number;
  targetEnemyId: number | null;
}

interface Props {
  onExit: () => void;
}

const ARENA_WIDTH = 900;       // virtual px; visually scaled to container
const CASTLE_HP_MAX = 100;
const KNIGHT_HP = 3;
const KNIGHT_SPEED = 25;
const SUPER_FILL_PER_WORD = 4;     // % per correctly read word
const SUPER_FILL_PER_SENTENCE = 35; // % per cleanly read passage
const POWER_COOLDOWN_MS = 7000;

type PowerId = "fireball" | "ice" | "lightning";
const POWERS: { id: PowerId; label: string; icon: typeof Flame; color: string }[] = [
  { id: "fireball", label: "Fireball", icon: Flame, color: "from-orange-500 to-red-600" },
  { id: "ice", label: "Ice", icon: Snowflake, color: "from-cyan-400 to-blue-600" },
  { id: "lightning", label: "Lightning", icon: Zap, color: "from-yellow-300 to-amber-500" },
];

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z']/g, "");

export const CastleSwarmArena = ({ onExit }: Props) => {
  const { user } = useAuth();
  const gradeMode = getGradeMode(getStoredTheme());
  const characterName = gradeMode === "6to12" ? "Agent X" : "Sir Valor";

  // ---------- Source words & passages (reuse curated stories for the player's grade band) ----------
  const wordPool = useMemo(() => {
    const stories = curatedStories.filter(s =>
      gradeMode === "6to12" ? s.grade_level >= 6 : s.grade_level <= 5
    );
    const text = (stories.length ? stories : curatedStories)
      .slice(0, 12)
      .map(s => s.passage_text)
      .join(" ");
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
      .filter(p => p.split(/\s+/).length >= 5 && p.split(/\s+/).length <= 14)
      .slice(0, 80);
  }, [gradeMode]);

  // ---------- React state (HUD only, throttled) ----------
  const [castleHp, setCastleHp] = useState(CASTLE_HP_MAX);
  const [superMeter, setSuperMeter] = useState(0);
  const [wave, setWave] = useState(1);
  const [waveBanner, setWaveBanner] = useState<string | null>("Wave 1");
  const [enemyTick, setEnemyTick] = useState(0); // bump to re-render enemy positions
  const [activeWord, setActiveWord] = useState(""); // currently-prompted word
  const [activePassage, setActivePassage] = useState<string | null>(null);
  const [recognising, setRecognising] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const [powerCooldowns, setPowerCooldowns] = useState<Record<PowerId, number>>({ fireball: 0, ice: 0, lightning: 0 });
  const [summary, setSummary] = useState<RunSummary | null>(null);

  // ---------- Refs (volatile counters per memory rule) ----------
  const enemiesRef = useRef<Enemy[]>([]);
  const knightsRef = useRef<Knight[]>([]);
  const enemyIdRef = useRef(1);
  const knightIdRef = useRef(1);
  const waveSpawnedRef = useRef(0);
  const waveTotalRef = useRef(0);
  const nextSpawnAtRef = useRef(0);
  const waveStartedAtRef = useRef(0);
  const passageDueAtRef = useRef(0);
  const wordIndexRef = useRef(0);

  const wordsReadRef = useRef(0);
  const wordsAttemptedRef = useRef(0);
  const knightsSummonedRef = useRef(0);
  const streakRef = useRef(0);
  const longestStreakRef = useRef(0);
  const coinsRef = useRef(0);
  const castleDamageDealtRef = useRef(0); // placeholder, used in phase 2
  const endedRef = useRef(false);

  // ---------- Pick next word for prompt ----------
  const pickWord = useCallback(() => {
    const w = wordPool[wordIndexRef.current % wordPool.length];
    wordIndexRef.current += 1;
    setActiveWord(w);
  }, [wordPool]);

  // ---------- Start a wave ----------
  const startWave = useCallback((n: number) => {
    const plan = planWave(n);
    waveSpawnedRef.current = 0;
    waveTotalRef.current = plan.totalEnemies;
    nextSpawnAtRef.current = performance.now() + 1200;
    waveStartedAtRef.current = performance.now();
    passageDueAtRef.current = performance.now() + 18000;
    setWave(n);
    setWaveBanner(plan.isEndless ? `Endless · Wave ${n}` : `Wave ${n}`);
    setTimeout(() => setWaveBanner(null), 2200);
  }, []);

  // ---------- End run ----------
  const endRun = useCallback((reason: "win" | "loss" | "quit") => {
    if (endedRef.current) return;
    endedRef.current = true;
    speechManager.stop("castle_swarm" as any);
    const acc = wordsAttemptedRef.current === 0
      ? 100
      : Math.round((wordsReadRef.current / wordsAttemptedRef.current) * 100);
    const finalCoins = coinsRef.current;
    const s: RunSummary = {
      waveReached: wave,
      wordsRead: wordsReadRef.current,
      accuracy: acc,
      knightsSummoned: knightsSummonedRef.current,
      coinsEarned: finalCoins,
      longestStreak: longestStreakRef.current,
      endedReason: reason,
      characterName,
    };
    setSummary(s);
    if (user?.id) {
      supabase.from("castle_swarm_runs").insert({
        user_id: user.id,
        grade_mode: gradeMode,
        character_id: characterName,
        wave_reached: wave,
        words_read: wordsReadRef.current,
        accuracy: acc,
        knights_summoned: knightsSummonedRef.current,
        enemy_castle_hp_dealt: castleDamageDealtRef.current,
        coins_earned: finalCoins,
        ended_reason: reason,
      }).then(({ error }) => { if (error) console.error("[CastleSwarm] save failed", error); });
    }
  }, [wave, characterName, gradeMode, user?.id]);

  // ---------- Speech recognition ----------
  const handleTranscript = useCallback((transcript: string) => {
    if (endedRef.current) return;
    const said = normalize(transcript);
    if (!said) return;
    setLastHeard(transcript);

    // Passage scoring (any phrase mode): require >=60% of words present
    if (activePassage) {
      const target = activePassage.split(/\s+/).map(normalize).filter(Boolean);
      const heardWords = new Set(said.split(/\s+/).filter(Boolean));
      const hit = target.filter(w => heardWords.has(w)).length;
      if (hit / target.length >= 0.6) {
        setSuperMeter(prev => Math.min(100, prev + SUPER_FILL_PER_SENTENCE));
        wordsReadRef.current += target.length;
        wordsAttemptedRef.current += target.length;
        streakRef.current += target.length;
        longestStreakRef.current = Math.max(longestStreakRef.current, streakRef.current);
        setFeedback({ text: "+Super charged!", good: true, id: Date.now() });
        setActivePassage(null);
        passageDueAtRef.current = performance.now() + 22000;
      }
      return;
    }

    // Single-word fire
    const target = activeWord;
    if (!target) return;
    const heardWords = said.split(/\s+/);
    wordsAttemptedRef.current += 1;
    if (heardWords.some(w => w === target)) {
      wordsReadRef.current += 1;
      streakRef.current += 1;
      longestStreakRef.current = Math.max(longestStreakRef.current, streakRef.current);

      // Fire an attack at the front-most enemy
      const enemies = enemiesRef.current;
      if (enemies.length) {
        const front = enemies.reduce((a, b) => (a.x < b.x ? a : b));
        front.hp -= 1;
        if (front.hp <= 0) front.dying = true;
      }
      // Power-word bonus: long words summon a knight
      if (target.length >= 7) {
        knightsRef.current.push({
          id: knightIdRef.current++,
          x: ARENA_WIDTH - 60,
          hp: KNIGHT_HP,
          targetEnemyId: null,
        });
        knightsSummonedRef.current += 1;
        setFeedback({ text: "Knight summoned!", good: true, id: Date.now() });
      } else {
        setFeedback({ text: `+${target}`, good: true, id: Date.now() });
      }
      setSuperMeter(prev => Math.min(100, prev + SUPER_FILL_PER_WORD));
      pickWord();
    } else {
      streakRef.current = 0;
      setFeedback({ text: "try again", good: false, id: Date.now() });
    }
  }, [activeWord, activePassage, pickWord]);

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

  // ---------- Powers ----------
  const castPower = useCallback((id: PowerId) => {
    if ((powerCooldowns[id] ?? 0) > Date.now()) return;
    setPowerCooldowns(prev => ({ ...prev, [id]: Date.now() + POWER_COOLDOWN_MS }));
    const enemies = enemiesRef.current;
    if (id === "fireball") {
      // line damage: hits 3 nearest enemies for 2
      enemies.slice().sort((a, b) => a.x - b.x).slice(0, 3).forEach(e => {
        e.hp -= 2; if (e.hp <= 0) e.dying = true;
      });
    } else if (id === "ice") {
      // slow all enemies for 4s, 1 damage
      enemies.forEach(e => { e.slowUntil = performance.now() + 4000; e.hp -= 1; if (e.hp <= 0) e.dying = true; });
    } else if (id === "lightning") {
      // 1 damage to all
      enemies.forEach(e => { e.hp -= 1; if (e.hp <= 0) e.dying = true; });
    }
    setFeedback({ text: `${id} cast!`, good: true, id: Date.now() });
  }, [powerCooldowns]);

  const castSuper = useCallback(() => {
    if (superMeter < 100) return;
    setSuperMeter(0);
    enemiesRef.current.forEach(e => { e.hp = 0; e.dying = true; });
    setFeedback({ text: "SCREEN CLEAR!", good: true, id: Date.now() });
  }, [superMeter]);

  // ---------- Game loop ----------
  useEffect(() => {
    pickWord();
    startWave(1);

    let raf = 0;
    let last = performance.now();
    let hudTick = 0;

    const loop = (now: number) => {
      if (endedRef.current) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      // 1. Spawning
      if (waveSpawnedRef.current < waveTotalRef.current && now >= nextSpawnAtRef.current) {
        const plan = planWave(wave);
        enemiesRef.current.push({
          id: enemyIdRef.current++,
          x: ARENA_WIDTH,
          hp: plan.enemyHp,
          maxHp: plan.enemyHp,
          speed: plan.enemySpeedPxPerSec,
          slowUntil: 0,
          dying: false,
        });
        waveSpawnedRef.current += 1;
        nextSpawnAtRef.current = now + plan.cadenceMs;
      }

      // 2. Move enemies
      enemiesRef.current.forEach(e => {
        if (e.dying) return;
        const slowed = now < e.slowUntil;
        e.x -= e.speed * dt * (slowed ? 0.4 : 1);
        if (e.x <= 0) {
          // Enemy reached castle
          setCastleHp(prev => {
            const next = Math.max(0, prev - 10);
            return next;
          });
          e.dying = true;
        }
      });

      // 3. Move knights & engage enemies
      knightsRef.current.forEach(k => {
        const target = enemiesRef.current.find(e => !e.dying && Math.abs(e.x - k.x) < 25);
        if (target) {
          target.hp -= 1 * dt * 2; // 2 dps
          if (target.hp <= 0) target.dying = true;
          k.hp -= 1 * dt * 1.5;
        } else {
          k.x -= KNIGHT_SPEED * dt;
        }
      });

      // 4. Cleanup
      enemiesRef.current = enemiesRef.current.filter(e => !e.dying || e.hp > -3);
      enemiesRef.current = enemiesRef.current.filter(e => !(e.dying && e.hp <= -2));
      knightsRef.current = knightsRef.current.filter(k => k.hp > 0 && k.x > -40);

      // 5. Passage prompt
      if (!activePassage && now >= passageDueAtRef.current && passagePool.length) {
        const p = passagePool[Math.floor(Math.random() * passagePool.length)];
        setActivePassage(p);
        passageDueAtRef.current = now + 60_000; // safety cap
      }

      // 6. Wave clear?
      if (
        waveSpawnedRef.current >= waveTotalRef.current &&
        enemiesRef.current.length === 0 &&
        !endedRef.current
      ) {
        const earned = coinsForWave(wave);
        coinsRef.current += earned;
        startWave(wave + 1);
      }

      // 7. Game over?
      if (castleHp <= 0 && !endedRef.current) {
        endRun("loss");
        return;
      }

      // 8. HUD throttle ~10hz
      hudTick += dt;
      if (hudTick > 0.08) {
        hudTick = 0;
        setEnemyTick(t => t + 1);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wave, castleHp, activePassage, passagePool]);

  // Cleanup speech on unmount
  useEffect(() => () => { speechManager.stop("castle_swarm" as any); }, []);

  // ---------- Render ----------
  const enemies = enemiesRef.current;
  const knights = knightsRef.current;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950 overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-black/40 backdrop-blur-sm">
        <Button variant="ghost" size="sm" onClick={() => endRun("quit")} className="text-white">
          <ArrowLeft className="w-4 h-4 mr-1" /> Exit
        </Button>
        <div className="text-amber-300 font-bold text-sm">
          {wave > TUTORIAL_WAVES ? `ENDLESS · Wave ${wave}` : `Wave ${wave} / ${TUTORIAL_WAVES}`}
        </div>
        <div className="flex items-center gap-2 text-white">
          <Heart className="w-4 h-4 text-red-400" />
          <div className="w-32 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all" style={{ width: `${castleHp}%` }} />
          </div>
          <span className="text-xs w-8 text-right">{castleHp}</span>
        </div>
      </div>

      {/* Wave banner */}
      <AnimatePresence>
        {waveBanner && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-amber-500 text-black font-black rounded-full shadow-lg"
          >
            {waveBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battlefield */}
      <div className="absolute inset-x-0 top-14 bottom-44 flex">
        <div className="relative w-full h-full" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(20,40,20,0.5))" }}>
          {/* Castle (right side) */}
          <div className="absolute right-0 top-0 bottom-0 w-20 flex items-end justify-center">
            <div className="text-6xl pb-4">🏰</div>
          </div>
          {/* Enemy spawn (left side) */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-end justify-center opacity-40 text-3xl pb-4">⛰️</div>

          {/* Enemies */}
          {enemies.map(e => {
            const pct = (e.x / ARENA_WIDTH) * 100;
            return (
              <div
                key={e.id}
                className="absolute bottom-6 transition-opacity"
                style={{ left: `${100 - pct}%`, opacity: e.dying ? 0 : 1 }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-1 bg-slate-700 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-red-500" style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
                  </div>
                  <MiniGoblin size={44} />
                </div>
              </div>
            );
          })}

          {/* Knights */}
          {knights.map(k => {
            const pct = (k.x / ARENA_WIDTH) * 100;
            return (
              <div
                key={k.id}
                className="absolute bottom-6"
                style={{ left: `${100 - pct}%` }}
              >
                <div className="text-3xl" title="Mini-Knight">🛡️</div>
              </div>
            );
          })}

          {/* Feedback float */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                key={feedback.id}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -40, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                onAnimationComplete={() => setFeedback(null)}
                className={`absolute bottom-24 left-1/2 -translate-x-1/2 font-bold text-lg ${feedback.good ? "text-emerald-300" : "text-rose-300"}`}
              >
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom control panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/70 backdrop-blur-sm p-3 space-y-2">
        {/* Super meter */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-pink-500 transition-all" style={{ width: `${superMeter}%` }} />
          </div>
          <Button size="sm" disabled={superMeter < 100} onClick={castSuper} className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-7">
            SUPER
          </Button>
        </div>

        {/* Active prompt */}
        <div className="bg-slate-800/70 rounded-lg p-2 min-h-[56px] flex flex-col items-center justify-center text-center">
          {activePassage ? (
            <>
              <div className="text-[10px] uppercase text-amber-300">Read this passage to charge SUPER</div>
              <div className="text-white text-sm leading-snug">{activePassage}</div>
            </>
          ) : (
            <>
              <div className="text-[10px] uppercase text-slate-400">Read aloud to attack</div>
              <div className="text-white text-3xl font-black tracking-wide">{activeWord || "—"}</div>
              {activeWord.length >= 7 && (
                <div className="text-[10px] text-emerald-300 mt-0.5">Power word — summons a knight!</div>
              )}
            </>
          )}
          {lastHeard && <div className="text-[10px] text-slate-500 mt-0.5">heard: "{lastHeard}"</div>}
        </div>

        {/* Powers + mic */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {POWERS.map(p => {
              const remaining = Math.max(0, (powerCooldowns[p.id] ?? 0) - Date.now());
              const ready = remaining === 0;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => castPower(p.id)}
                  disabled={!ready}
                  className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg disabled:opacity-40 transition`}
                  title={p.label}
                >
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
          <Button
            onClick={toggleMic}
            className={`h-12 px-4 font-bold ${recognising ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"} text-white`}
          >
            {recognising ? <><MicOff className="w-4 h-4 mr-1" /> Listening</> : <><Mic className="w-4 h-4 mr-1" /> Talk</>}
          </Button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <WaveSurvivedCard
          summary={summary}
          onPlayAgain={() => { window.location.reload(); }}
          onExit={onExit}
        />
      )}
    </div>
  );
};
