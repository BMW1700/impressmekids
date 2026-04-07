import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, Heart, Coins, Star, Mic, MicOff, Pause, Play, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { ensureMicrophoneAccess } from "@/lib/micDiagnostics";
import { MicTroubleshooterModal } from "@/components/mic/MicTroubleshooterModal";
import { supabase } from "@/integrations/supabase/client";
import { useMLIntegration } from "@/hooks/useMLIntegration";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface RPGBalloonBattleProps {
  words: string[];
  heroName?: string;
  enemyName?: string;
  studentId?: string;
  storyTitle?: string;
  gradeMode?: string;
  onComplete: (victory: boolean, stats: { wordsRead: number; correctWords: number; balloonsLost: number }) => void;
  onWordResult?: (word: string, correct: boolean) => void;
}

const soundEffects = new SoundEffects();

// Theme-aware constants
const agentMode = isAgentMode();
const theme = getMinigameTheme('balloonBattle');

const HERO_BALLOON_COLORS = agentMode
  ? ['#0EA5E9', '#06B6D4', '#14B8A6', '#22D3EE', '#0891B2']
  : ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
const HERO_FACES = agentMode
  ? ['🎯', '🔒', '📡', '💻', '⚡']
  : ['⚔️', '🛡️', '🏹', '✨', '💫'];

const ENEMY_BALLOON_COLOR = agentMode ? '#0F172A' : '#1f2937';
const ENEMY_FACES = agentMode
  ? ['💣', '🚀', '☠️', '🔴', '⚠️']
  : ['👹', '💀', '🦇', '👻', '🐲'];

interface Balloon {
  id: number;
  color: string;
  face: string;
  hp: number;
  maxHp: number;
  popped: boolean;
}

interface FloatingReward {
  id: number;
  gold: number;
  xp: number;
  x: number;
  y: number;
}

export const RPGBalloonBattle = ({
  words,
  heroName = "Hero",
  enemyName = "Enemy",
  studentId,
  storyTitle,
  gradeMode,
  onComplete,
  onWordResult,
}: RPGBalloonBattleProps) => {
  // ML Integration for saving training data
  const { saveToAuraRecords } = useMLIntegration();
  const battleStartTime = useRef(Date.now());
  // Hero has 5 balloons with 1 HP each
  const [heroBalloons, setHeroBalloons] = useState<Balloon[]>(
    HERO_BALLOON_COLORS.map((color, i) => ({
      id: i,
      color,
      face: HERO_FACES[i],
      hp: 1,
      maxHp: 1,
      popped: false,
    }))
  );

  // Enemy has 5 balloons with 3 HP each (reduced from 5)
  const [enemyBalloons, setEnemyBalloons] = useState<Balloon[]>(
    Array(5).fill(null).map((_, i) => ({
      id: i,
      color: ENEMY_BALLOON_COLOR,
      face: ENEMY_FACES[i],
      hp: 3,
      maxHp: 3,
      popped: false,
    }))
  );

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [balloonsLost, setBalloonsLost] = useState(0);
  
  // Mic states - continuous with pause/resume (like Classic)
  const [isMicActive, setIsMicActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [poppingBalloon, setPoppingBalloon] = useState<{ side: 'hero' | 'enemy'; id: number } | null>(null);
  const [damageIndicator, setDamageIndicator] = useState<{ side: 'hero' | 'enemy'; id: number } | null>(null);
  
  // Rewards
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
  const [totalGold, setTotalGold] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const rewardIdRef = useRef(0);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  const currentWord = words[currentWordIndex] || "";
  const activeHeroBalloons = heroBalloons.filter(b => !b.popped);
  const activeEnemyBalloons = enemyBalloons.filter(b => !b.popped);
  const currentEnemyBalloon = activeEnemyBalloons[0];

  // Log on mount to prove component version
  useEffect(() => {
    console.log("[BALLOON-BATTLE] v2 mounted with pause/resume mic", {
      wordsCount: words.length,
      heroName,
      enemyName
    });
  }, []);

  // REMOVED: Auto-init of speech recognition in useEffect
  // Speech recognition must now be started via user gesture (startMic button)
  // This is required by browsers for microphone access
  
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Save reading data on game end
  const saveReadingData = useCallback(async (isVictory: boolean, finalWordsRead: number, finalCorrectWords: number) => {
    if (!studentId || finalWordsRead === 0) return;
    
    const durationSeconds = Math.max(1, (Date.now() - battleStartTime.current) / 1000);
    const wpm = Math.round((finalWordsRead / durationSeconds) * 60);
    const accuracyPercent = finalWordsRead > 0 ? Math.round((finalCorrectWords / finalWordsRead) * 100) : 0;
    const wcpm = Math.round(finalCorrectWords / (durationSeconds / 60));
    
    try {
      // Save to reading_sessions for teacher visibility
      const { error } = await supabase.from('reading_sessions').insert({
        student_id: studentId,
        passage_text: words.slice(0, 50).join(' '),
        words_read: finalWordsRead,
        duration_seconds: Math.round(durationSeconds),
        wpm: wpm,
        accuracy_percent: accuracyPercent,
        fluency_score: Math.min(100, Math.round(accuracyPercent * 0.7 + Math.min(wpm, 150) * 0.3)),
        wcpm: wcpm,
        fluency_level: accuracyPercent >= 95 ? 'independent' : accuracyPercent >= 90 ? 'instructional' : 'frustration',
        reading_mode: 'balloon_battle',
        grade_mode: gradeMode || 'k5',
      });
      
      if (error) {
        console.error('[BalloonBattle] Failed to save reading session:', error);
      } else {
        console.log('[BalloonBattle] Reading session saved');
      }
      
      // Save to aura_records for ML training
      await saveToAuraRecords({
        studentId,
        sessionId: `balloon_battle_${Date.now()}`,
        wpm,
        wcpm,
        accuracy: accuracyPercent,
        wordsRead: finalWordsRead,
        durationSeconds: Math.round(durationSeconds),
        pauseCount: 0,
        phonemeScores: {},
        includeSpeakingData: true,
      });
      console.log('[BalloonBattle] ML training data saved to aura_records');
    } catch (err) {
      console.error('[BalloonBattle] Error saving reading data:', err);
    }
  }, [studentId, words, saveToAuraRecords]);

  // Check for win/lose conditions
  useEffect(() => {
    if (gameOver) return;

    const heroRemaining = heroBalloons.filter(b => !b.popped).length;
    const enemyRemaining = enemyBalloons.filter(b => !b.popped).length;

    if (enemyRemaining === 0) {
      setGameOver(true);
      setVictory(true);
      soundEffects.celebrationSound();
      stopMic();
      // Save data before calling onComplete
      saveReadingData(true, wordsRead, correctWords);
      setTimeout(() => {
        onComplete(true, { wordsRead, correctWords, balloonsLost });
      }, 2000);
    } else if (heroRemaining === 0) {
      setGameOver(true);
      setVictory(false);
      soundEffects.rockCrumble();
      stopMic();
      // Save data before calling onComplete
      saveReadingData(false, wordsRead, correctWords);
      setTimeout(() => {
        onComplete(false, { wordsRead, correctWords, balloonsLost });
      }, 2000);
    }
  }, [heroBalloons, enemyBalloons, gameOver, wordsRead, correctWords, balloonsLost, onComplete, saveReadingData]);

  const showFloatingReward = useCallback((gold: number, xp: number, isEnemy: boolean, balloonId: number) => {
    const id = rewardIdRef.current++;
    const x = isEnemy ? 20 + (balloonId % 3) * 10 : 70 + (balloonId % 3) * 10;
    const y = 35 + Math.floor(balloonId / 3) * 10;
    setFloatingRewards(prev => [...prev, { id, gold, xp, x, y }]);
    setTimeout(() => {
      setFloatingRewards(prev => prev.filter(r => r.id !== id));
    }, 1500);
  }, []);

  const handleWordResult = useCallback((correct: boolean) => {
    setWordsRead(prev => prev + 1);
    
    if (correct) {
      setCorrectWords(prev => prev + 1);
      setFeedback('correct');
      soundEffects.correctWord();

      // Damage current enemy balloon
      if (currentEnemyBalloon) {
        setDamageIndicator({ side: 'enemy', id: currentEnemyBalloon.id });
        
        setEnemyBalloons(prev => prev.map(b => {
          if (b.id === currentEnemyBalloon.id) {
            const newHp = b.hp - 1;
            if (newHp <= 0) {
              setPoppingBalloon({ side: 'enemy', id: b.id });
              soundEffects.celebrationSound();
              // Reward for popping enemy balloon
              const goldReward = 10;
              const xpReward = 5;
              setTotalGold(prev => prev + goldReward);
              setTotalXp(prev => prev + xpReward);
              showFloatingReward(goldReward, xpReward, true, b.id);
              return { ...b, hp: 0, popped: true };
            }
            soundEffects.magicSparkle();
            // Small reward for damage
            const goldReward = 3;
            const xpReward = 2;
            setTotalGold(prev => prev + goldReward);
            setTotalXp(prev => prev + xpReward);
            showFloatingReward(goldReward, xpReward, true, b.id);
            return { ...b, hp: newHp };
          }
          return b;
        }));
      }
    } else {
      setFeedback('incorrect');
      soundEffects.incorrectWord();

      // Pop one hero balloon
      const firstActiveHero = heroBalloons.find(b => !b.popped);
      if (firstActiveHero) {
        setPoppingBalloon({ side: 'hero', id: firstActiveHero.id });
        setBalloonsLost(prev => prev + 1);
        soundEffects.rockCrumble();
        
        setHeroBalloons(prev => prev.map(b => {
          if (b.id === firstActiveHero.id) {
            return { ...b, hp: 0, popped: true };
          }
          return b;
        }));
      }
    }

    onWordResult?.(currentWord, correct);

    // Clear feedback and move to next word
    setTimeout(() => {
      setFeedback(null);
      setPoppingBalloon(null);
      setDamageIndicator(null);
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      }
    }, 800);
  }, [currentWord, currentWordIndex, words.length, currentEnemyBalloon, heroBalloons, onWordResult, showFloatingReward]);

  // Mic control functions - FIXED: Ensure mic access before starting recognition
  const startMic = useCallback(async () => {
    if (gameOver) return;
    
    setMicError(null);
    
    // STEP 1: Ensure we have mic permission first
    const micResult = await ensureMicrophoneAccess(false);
    
    if (!micResult.success) {
      console.error('[BalloonBattle] Microphone access failed:', micResult.error);
      setMicError(micResult.error?.userMessage || 'Microphone access failed');
      return;
    }
    
    // STEP 2: Create and start speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError('Speech recognition not supported in this browser');
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    setIsMicActive(true);
    setIsPaused(false);
    isListeningRef.current = true;

    recognitionRef.current.onresult = (event: any) => {
      if (!isListeningRef.current) return;
      
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.toLowerCase().trim();
        const targetWord = currentWord.toLowerCase().replace(/[^a-z]/g, '');
        const spokenWord = transcript.replace(/[^a-z]/g, '');
        
        const isCorrect = spokenWord === targetWord || 
                          transcript.includes(targetWord) ||
                          targetWord.includes(spokenWord);
        
        handleWordResult(isCorrect);
      }
    };

    recognitionRef.current.onerror = (e: any) => {
      console.log('[BalloonBattle] Speech error:', e.error);
      if (e.error === 'not-allowed') {
        setMicError('Microphone access was denied.');
        setIsMicActive(false);
        return;
      }
      if (e.error === 'no-speech') {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (isListeningRef.current && !isPaused) {
              recognitionRef.current.start();
            }
          }, 100);
        } catch (err) {}
      }
    };

    recognitionRef.current.onend = () => {
      if (isListeningRef.current && !isPaused && !gameOver) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      setIsMicActive(false);
      setMicError('Failed to start speech recognition');
    }
  }, [gameOver, currentWord, handleWordResult, isPaused]);

  const stopMic = useCallback(() => {
    isListeningRef.current = false;
    setIsMicActive(false);
    setIsPaused(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
  }, []);

  const pauseMic = useCallback(() => {
    setIsPaused(true);
    isListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
  }, []);

  const resumeMic = useCallback(() => {
    setIsPaused(false);
    isListeningRef.current = true;
    try {
      recognitionRef.current?.start();
    } catch (e) {}
  }, []);

  const renderBalloon = (balloon: Balloon, side: 'hero' | 'enemy', index: number) => {
    const isPopping = poppingBalloon?.side === side && poppingBalloon?.id === balloon.id;
    const isDamaged = damageIndicator?.side === side && damageIndicator?.id === balloon.id;
    const isTarget = side === 'enemy' && currentEnemyBalloon?.id === balloon.id;

    if (balloon.popped && !isPopping) return null;

    const balloonColor = side === 'enemy' ? `hsl(${220 + index * 15}, 30%, ${20 + index * 5}%)` : balloon.color;

    return (
      <motion.div
        key={balloon.id}
        className="relative"
        initial={{ scale: 1, opacity: 1 }}
        animate={
          isPopping
            ? { scale: [1, 1.4, 0], opacity: [1, 1, 0], rotate: [0, 15, -15, 0] }
            : isDamaged
            ? { scale: [1, 0.85, 1.15, 1], x: [0, -8, 8, 0] }
            : { scale: 1, y: [0, -6, 0] }
        }
        transition={
          isPopping
            ? { duration: 0.5 }
            : isDamaged
            ? { duration: 0.3 }
            : { duration: 2, repeat: Infinity, delay: index * 0.2 }
        }
      >
        {/* Balloon */}
        <div
          className={`w-20 h-24 rounded-[50%] relative ${isTarget ? 'ring-4 ring-yellow-400 ring-opacity-70' : ''}`}
          style={{
            background: `radial-gradient(ellipse at 30% 25%, ${balloonColor}ee, ${balloonColor}bb, ${balloonColor})`,
            boxShadow: isTarget 
              ? `0 0 25px ${balloonColor}80, 0 8px 25px rgba(0,0,0,0.3)` 
              : `0 8px 20px rgba(0,0,0,0.25)`,
          }}
        >
          {/* Glossy shine */}
          <div className="absolute top-3 left-4 w-6 h-6 bg-white/40 rounded-full blur-sm" />
          <div className="absolute top-5 left-5 w-3 h-3 bg-white/60 rounded-full" />
          
          {/* Face */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl drop-shadow-md">{balloon.face}</span>
          </div>
          
          {/* HP indicator for enemy balloons */}
          {side === 'enemy' && !balloon.popped && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {Array(balloon.maxHp).fill(null).map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-3 h-3 rounded-full border border-white/30 ${
                    i < balloon.hp ? 'bg-red-500' : 'bg-gray-600/50'
                  }`}
                  animate={i < balloon.hp ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          )}

          {/* String */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-0.5 h-10" 
               style={{ background: 'linear-gradient(to bottom, #9ca3af, #6b7280)' }} />
          
          {/* Knot */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
               style={{ backgroundColor: balloonColor }} />
        </div>

        {/* Pop particles + coins */}
        <AnimatePresence>
          {isPopping && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`pop-${i}`}
                  className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full"
                  style={{ backgroundColor: balloon.color }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: (Math.cos((i / 12) * Math.PI * 2) * 50),
                    y: (Math.sin((i / 12) * Math.PI * 2) * 50),
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5 }}
                />
              ))}
              {/* Coin burst on enemy pop */}
              {side === 'enemy' && [...Array(6)].map((_, i) => (
                <motion.div
                  key={`coin-${i}`}
                  className="absolute top-1/2 left-1/2 text-xl"
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 100,
                    y: -40 - Math.random() * 50,
                    scale: [0, 1.3, 1],
                    opacity: [1, 1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                >
                  🪙
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 ${agentMode ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-gray-900' : 'bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200'} flex flex-col`}>
      {/* V2 Badge */}
      <div className={`absolute top-2 left-2 z-50 ${agentMode ? 'bg-cyan-600' : 'bg-blue-500'} text-white text-xs font-bold px-2 py-1 rounded shadow-lg`}>
        {agentMode ? 'Payload v2 • Pause/Resume Mic' : 'Balloon v2 • Pause/Resume Mic'}
      </div>
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {agentMode ? (
          /* Tactical grid for agent mode */
          [...Array(8)].map((_, i) => (
            <motion.div
              key={`grid-${i}`}
              className="absolute bg-cyan-500/10 rounded"
              style={{
                width: 2,
                height: '100%',
                left: `${12.5 * (i + 1)}%`,
              }}
            />
          ))
        ) : (
          /* Clouds for classic */
          [...Array(5)].map((_, i) => (
            <motion.div
              key={`cloud-${i}`}
              className="absolute bg-white/60 rounded-full blur-md"
              style={{
                width: 100 + Math.random() * 100,
                height: 40 + Math.random() * 30,
                top: `${10 + Math.random() * 30}%`,
                left: `${-10 + i * 25}%`,
              }}
              animate={{ x: [0, 50, 0] }}
              transition={{ duration: 20 + i * 5, repeat: Infinity }}
            />
          ))
        )}
      </div>

      {/* Header */}
      <div className="p-4 text-center relative z-10">
        <h2 className="text-2xl font-black text-white drop-shadow-lg flex items-center justify-center gap-2">
          {theme.title}
        </h2>
        <p className={`${agentMode ? 'text-cyan-300/80' : 'text-white/80'} text-sm drop-shadow`}>
          {agentMode ? 'Neutralize all enemy payloads! Protect yours!' : 'Pop all enemy balloons! Don\'t lose yours!'}
        </p>
      </div>

      {/* Rewards Display */}
      <div className="flex justify-center gap-4 mb-2 relative z-10">
        <motion.div 
          className="flex items-center gap-1 bg-yellow-500/30 backdrop-blur-sm px-3 py-1 rounded-full"
          animate={{ scale: totalGold > 0 ? [1, 1.1, 1] : 1 }}
          key={totalGold}
        >
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="text-yellow-300 font-bold">{totalGold}</span>
        </motion.div>
        <motion.div 
          className="flex items-center gap-1 bg-purple-500/30 backdrop-blur-sm px-3 py-1 rounded-full"
          animate={{ scale: totalXp > 0 ? [1, 1.1, 1] : 1 }}
          key={totalXp}
        >
          <Star className="h-4 w-4 text-purple-400" />
          <span className="text-purple-300 font-bold">{totalXp} XP</span>
        </motion.div>
      </div>

      {/* Score Display */}
      <div className="flex justify-between px-8 mb-4 relative z-10">
        <div className="text-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg">
          <div className="text-red-600 font-bold">{enemyName}</div>
          <div className="text-white text-sm">
            {activeEnemyBalloons.length} balloons left
          </div>
        </div>
        <div className="text-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg">
          <div className="text-yellow-300 font-bold">Words: {wordsRead}</div>
          <div className="text-green-400 text-sm">
            {correctWords} correct / {balloonsLost} mistakes
          </div>
        </div>
        <div className="text-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg">
          <div className="text-blue-600 font-bold">{heroName}</div>
          <div className="text-white text-sm">
            {activeHeroBalloons.length} balloons left
          </div>
        </div>
      </div>

      {/* Floating Rewards */}
      <AnimatePresence>
        {floatingRewards.map(reward => (
          <motion.div
            key={reward.id}
            className="absolute pointer-events-none z-30 flex flex-col items-center"
            style={{ left: `${reward.x}%`, top: `${reward.y}%` }}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 1.2 }}
          >
            <div className="flex items-center gap-1 bg-yellow-500/90 px-2 py-1 rounded-full text-sm font-bold text-yellow-900 shadow-lg">
              <Coins className="h-3 w-3" /> +{reward.gold}
            </div>
            <div className="flex items-center gap-1 bg-purple-500/90 px-2 py-1 rounded-full text-sm font-bold text-purple-100 mt-1 shadow-lg">
              <Star className="h-3 w-3" /> +{reward.xp} XP
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Balloon Arena */}
      <div className="flex-1 relative z-10 flex items-center justify-around px-8">
        {/* Enemy Balloons (Left) */}
        <div className="flex flex-col items-center">
          <div className="text-gray-800 font-bold mb-4 text-lg">{enemyName}'s Balloons</div>
          <div className="flex gap-3 flex-wrap justify-center max-w-xs">
            {enemyBalloons.map((balloon, i) => renderBalloon(balloon, 'enemy', i))}
          </div>
          <div className="mt-8">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center shadow-lg border-4 border-gray-600">
              <span className="text-3xl">👹</span>
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="text-4xl font-black text-white drop-shadow-lg">VS</div>

        {/* Hero Balloons (Right) */}
        <div className="flex flex-col items-center">
          <div className="text-blue-800 font-bold mb-4 text-lg">{heroName}'s Balloons</div>
          <div className="flex gap-3 flex-wrap justify-center max-w-xs">
            {heroBalloons.map((balloon, i) => renderBalloon(balloon, 'hero', i))}
          </div>
          <div className="mt-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-300">
              <span className="text-3xl">⚔️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stakes Warning */}
      {activeHeroBalloons.length <= 2 && !gameOver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-full">
            <Heart className="h-4 w-4" />
            <span className="font-bold">Low balloons! Be careful!</span>
          </div>
        </motion.div>
      )}

      {/* Word Display & Reading Interface */}
      {!gameOver && (
        <div className="p-6 bg-white/80 backdrop-blur-sm relative z-10">
          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`text-center mb-4 text-2xl font-black ${
                  feedback === 'correct' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {feedback === 'correct' 
                  ? `✓ HIT! ${currentEnemyBalloon?.hp === 0 ? 'POP!' : `${currentEnemyBalloon?.hp || 0} HP left!`}` 
                  : '✗ MISS! Lost a balloon!'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Word */}
          <motion.div
            key={currentWordIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="text-gray-500 text-sm mb-2">Read this word to attack:</div>
            <div className="text-5xl font-black text-gray-800 tracking-wide">
              {currentWord}
            </div>
          </motion.div>

          {/* Mic Controls - Same pattern as Classic/TugOfWar */}
          <div className="flex justify-center gap-4">
            {!isMicActive ? (
              <Button
                size="lg"
                onClick={startMic}
                disabled={gameOver}
                className="px-8 py-6 text-xl font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
              >
                <Mic className="h-6 w-6 mr-2" />
                Start Reading
              </Button>
            ) : (
              <div className="flex gap-2">
                {isPaused ? (
                  <Button
                    size="lg"
                    onClick={resumeMic}
                    className="px-6 py-6 text-xl font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    <Play className="h-6 w-6 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={pauseMic}
                    className="px-6 py-6 text-xl font-bold rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                  >
                    <Pause className="h-6 w-6 mr-2" />
                    Pause
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={stopMic}
                  variant="destructive"
                  className="px-6 py-6 text-xl font-bold rounded-full"
                >
                  <MicOff className="h-6 w-6 mr-2" />
                  Stop
                </Button>
              </div>
            )}
          </div>

          {/* Mic Error Display */}
          {micError && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{micError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTroubleshooter(true)}
                className="text-red-600 border-red-300"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Fix
              </Button>
            </div>
          )}

          {/* Mic status indicator */}
          {isMicActive && !micError && (
            <motion.div 
              className={`text-center mt-3 text-sm font-bold ${isPaused ? 'text-yellow-600' : 'text-green-600'}`}
              animate={!isPaused ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {isPaused ? '⏸️ Paused' : '🎤 Listening...'}
            </motion.div>
          )}

          {/* Skip for testing */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWordResult(true)}
              className="text-green-600 hover:bg-green-100"
            >
              ✓ Mark Correct
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWordResult(false)}
              className="text-red-600 hover:bg-red-100"
            >
              ✗ Mark Wrong
            </Button>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              {victory ? (
                <>
                  <div className="text-6xl mb-4">🎉🎈🎉</div>
                  <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-4xl font-black text-green-400 mb-2">VICTORY!</h2>
                  <p className="text-white/80">You popped all enemy balloons!</p>
                  {balloonsLost === 0 && (
                    <div className="mt-2 text-yellow-300 font-bold">
                      ⭐ PERFECT! No balloons lost! ⭐
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">💨💨💨</div>
                  <Skull className="h-20 w-20 text-red-400 mx-auto mb-4" />
                  <h2 className="text-4xl font-black text-red-400 mb-2">DEFEAT!</h2>
                  <p className="text-white/80">All your balloons popped!</p>
                </>
              )}
              <div className="mt-4 text-white/60">
                <p>Words Read: {wordsRead}</p>
                <p>Accuracy: {wordsRead > 0 ? Math.round((correctWords / wordsRead) * 100) : 0}%</p>
                <p>Balloons Lost: {balloonsLost}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic Troubleshooter Modal */}
      <MicTroubleshooterModal
        open={showTroubleshooter}
        onOpenChange={setShowTroubleshooter}
        lastError={micError || undefined}
        onRetry={startMic}
      />
    </div>
  );
};