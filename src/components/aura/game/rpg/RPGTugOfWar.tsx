import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, Coins, Star, Timer, Volume2, Pause, Play, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { TugOfWarBackground } from "./TugOfWarBackground";
import { TugOfWarRope } from "./TugOfWarRope";
import { TugOfWarKid } from "./TugOfWarKid";
import { TugOfWarCharacterSelect } from "./TugOfWarCharacterSelect";
import { SirValor } from "../characters/SirValor";
import { Elara } from "../characters/Elara";
import { GoblinGuard } from "../characters/GoblinGuard";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { speechManager } from "@/lib/speechRecognitionManager";
import { supabase } from "@/integrations/supabase/client";

const soundEffects = new SoundEffects();

interface RPGTugOfWarProps {
  words: string[];
  heroName?: string;
  enemyName?: string;
  studentId?: string;
  storyTitle?: string;
  onComplete: (victory: boolean, stats: { wordsRead: number; correctWords: number; incorrectWords: number }) => void;
  onWordResult?: (word: string, correct: boolean) => void;
}

interface FloatingReward {
  id: number;
  gold: number;
  xp: number;
  x: number;
  y: number;
}

// Thresholds
const WIN_THRESHOLD = 10;
const LOSE_THRESHOLD = -10;
const AUTO_PULL_SECONDS = 20;

// Pull amounts
const HERO_PULL = 2;  // +2 for correct word
const ENEMY_PULL = 1; // -1 for incorrect word
const AUTO_PULL = 2;  // -2 for timeout

export const RPGTugOfWar = ({
  words,
  heroName = "Hero",
  enemyName = "Goblins",
  studentId,
  storyTitle,
  onComplete,
  onWordResult,
}: RPGTugOfWarProps) => {
  // Character selection
  const [selectedCharacter, setSelectedCharacter] = useState<'valor' | 'elara' | null>(null);
  
  // Rope position: -10 (enemy wins) to +10 (hero wins), starts at 0
  const [ropePosition, setRopePosition] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [pullingAnimation, setPullingAnimation] = useState<'hero' | 'enemy' | null>(null);
  
  // Auto-pull timer
  const [autoPullTimer, setAutoPullTimer] = useState(AUTO_PULL_SECONDS);
  
  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  
  // Rewards
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
  const [totalGold, setTotalGold] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const rewardIdRef = useRef(0);

  // Game completion ref to prevent multiple calls
  const gameCompletedRef = useRef(false);
  
  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const currentWordRef = useRef("");
  const processedWordsRef = useRef<Set<number>>(new Set());
  
  // Session tracking for data saving
  const battleStartTimeRef = useRef<number>(0);
  const echoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Current word
  const currentWord = words[currentWordIndex] || "";
  
  // Keep ref updated for speech callback
  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

  // Calculate the rope offset - moves the ENTIRE rig
  const ropeOffsetPercent = (ropePosition / WIN_THRESHOLD) * 15; // -15% to +15%

  // Save reading session to database
  const saveReadingSession = useCallback(async (isVictory: boolean) => {
    if (!studentId || wordsRead === 0) return;
    
    const durationSeconds = Math.max(1, (Date.now() - battleStartTimeRef.current) / 1000);
    const wpm = Math.round((wordsRead / durationSeconds) * 60);
    const wcpm = Math.round((correctWords / durationSeconds) * 60);
    const accuracyPercent = Math.round((correctWords / wordsRead) * 100);
    
    try {
      const { error } = await supabase.from('reading_sessions').insert({
        student_id: studentId,
        passage_text: words.slice(0, 50).join(' '),
        words_read: wordsRead,
        duration_seconds: Math.round(durationSeconds),
        wpm,
        wcpm,
        accuracy_percent: accuracyPercent,
        fluency_score: Math.min(100, Math.round(accuracyPercent * 0.7 + Math.min(wpm, 150) * 0.3)),
        fluency_level: accuracyPercent >= 95 ? 'independent' : accuracyPercent >= 90 ? 'instructional' : 'frustration',
        reading_mode: 'tug_of_war',
      });
      
      if (error) {
        console.error('[TugOfWar] Failed to save reading session:', error);
      } else {
        console.log('[TugOfWar] Reading session saved successfully');
      }
    } catch (err) {
      console.error('[TugOfWar] Error saving session:', err);
    }
  }, [studentId, wordsRead, correctWords, words]);

  // Check for win/lose conditions
  useEffect(() => {
    if (gameOver || gameCompletedRef.current) return;

    if (ropePosition >= WIN_THRESHOLD) {
      gameCompletedRef.current = true;
      setGameOver(true);
      setVictory(true);
      soundEffects.celebrationSound();
      saveReadingSession(true);
      setTimeout(() => {
        onComplete(true, { wordsRead, correctWords, incorrectWords });
      }, 2000);
    } else if (ropePosition <= LOSE_THRESHOLD) {
      gameCompletedRef.current = true;
      setGameOver(true);
      setVictory(false);
      soundEffects.rockCrumble();
      saveReadingSession(false);
      setTimeout(() => {
        onComplete(false, { wordsRead, correctWords, incorrectWords });
      }, 2000);
    }
  }, [ropePosition, gameOver, wordsRead, correctWords, incorrectWords, onComplete, saveReadingSession]);

  const showFloatingReward = useCallback((gold: number, xp: number) => {
    const id = rewardIdRef.current++;
    const x = 45 + Math.random() * 10;
    const y = 30 + Math.random() * 10;
    setFloatingRewards(prev => [...prev, { id, gold, xp, x, y }]);
    setTimeout(() => {
      setFloatingRewards(prev => prev.filter(r => r.id !== id));
    }, 1500);
  }, []);

  const handleEnemyAutoPull = useCallback(() => {
    if (gameOver || gameCompletedRef.current) return;
    
    setIncorrectWords(prev => prev + 1);
    setFeedback('incorrect');
    setPullingAnimation('enemy');
    setRopePosition(prev => Math.max(prev - AUTO_PULL, LOSE_THRESHOLD));
    soundEffects.incorrectWord();
    soundEffects.rockCrumble();
    
    setTimeout(() => {
      setFeedback(null);
      setPullingAnimation(null);
    }, 800);
  }, [gameOver]);

  // Auto-pull timer - enemies pull every 20 seconds
  // ONLY pauses when the game is paused (not while the mic is listening)
  useEffect(() => {
    if (gameOver || !selectedCharacter || isPaused) return;
    
    const interval = setInterval(() => {
      setAutoPullTimer(prev => {
        if (prev <= 1) {
          handleEnemyAutoPull();
          return AUTO_PULL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameOver, selectedCharacter, handleEnemyAutoPull, isPaused]);

  // Process a spoken word result
  const processWordResult = useCallback((correct: boolean, wordIdx: number) => {
    if (gameOver || gameCompletedRef.current) return;
    if (processedWordsRef.current.has(wordIdx)) return;
    processedWordsRef.current.add(wordIdx);
    
    // Clear echo retry timeout
    if (echoRetryTimeoutRef.current) {
      clearTimeout(echoRetryTimeoutRef.current);
      echoRetryTimeoutRef.current = null;
    }
    
    setWordsRead(prev => prev + 1);
    
    if (correct) {
      const newPosition = Math.min(ropePosition + HERO_PULL, WIN_THRESHOLD);
      setCorrectWords(prev => prev + 1);
      setFeedback('correct');
      setPullingAnimation('hero');
      setRopePosition(newPosition);
      soundEffects.correctWord();
      soundEffects.comboSuccess();
      
      // Award gold and XP
      const goldReward = 5;
      const xpReward = 2;
      setTotalGold(prev => prev + goldReward);
      setTotalXp(prev => prev + xpReward);
      showFloatingReward(goldReward, xpReward);
      
      // Bonus at milestones
      if (newPosition === 3 || newPosition === 6 || newPosition === 9) {
        const bonusGold = 10;
        const bonusXp = 5;
        setTotalGold(prev => prev + bonusGold);
        setTotalXp(prev => prev + bonusXp);
        setTimeout(() => showFloatingReward(bonusGold, bonusXp), 300);
      }
    } else {
      const newPosition = Math.max(ropePosition - ENEMY_PULL, LOSE_THRESHOLD);
      setIncorrectWords(prev => prev + 1);
      setFeedback('incorrect');
      setPullingAnimation('enemy');
      setRopePosition(newPosition);
      soundEffects.incorrectWord();
      soundEffects.rockCrumble();
    }

    onWordResult?.(currentWordRef.current, correct);

    // Clear feedback and move to next word
    setTimeout(() => {
      setFeedback(null);
      setPullingAnimation(null);
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      }
    }, 600);
  }, [currentWordIndex, words.length, onWordResult, ropePosition, showFloatingReward, gameOver]);

  // Handle speech result - continuous listening
  const handleSpeechResult = useCallback((transcript: string, alternatives: string[], isFinal: boolean) => {
    if (gameOver || gameCompletedRef.current || isPaused) return;
    
    const expected = currentWordRef.current.toLowerCase().trim();
    if (!expected) return;
    
    // Check main transcript
    const spoken = transcript.toLowerCase().trim();
    if (isWordMatchLenient(spoken, expected)) {
      processWordResult(true, currentWordIndex);
      return;
    }
    
    // Check alternatives
    for (const alt of alternatives) {
      if (isWordMatchLenient(alt.toLowerCase().trim(), expected)) {
        processWordResult(true, currentWordIndex);
        return;
      }
    }
    
    // Check if any word in transcript matches
    const spokenWords = spoken.split(/\s+/);
    for (const word of spokenWords) {
      if (isWordMatchLenient(word, expected)) {
        processWordResult(true, currentWordIndex);
        return;
      }
    }
    
    // On final result with no match, start echo retry window
    if (isFinal && spoken.length > 0) {
      // Give 1.5s for echo retry
      if (!echoRetryTimeoutRef.current) {
        echoRetryTimeoutRef.current = setTimeout(() => {
          // After echo retry window, mark as incorrect if still not matched
          if (!processedWordsRef.current.has(currentWordIndex)) {
            processWordResult(false, currentWordIndex);
          }
          echoRetryTimeoutRef.current = null;
        }, 1500);
      }
    }
  }, [gameOver, isPaused, currentWordIndex, processWordResult]);

  // Start continuous speech recognition
  const startRecognition = useCallback(() => {
    const success = speechManager.start({
      owner: 'reader',
      continuous: true,
      interimResults: true,
      onResult: handleSpeechResult,
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
      onError: (error) => {
        console.log('[TugOfWar] Speech error:', error);
      }
    });
    return success;
  }, [handleSpeechResult]);

  // Stop speech recognition
  const stopRecognition = useCallback(() => {
    speechManager.stop('reader');
    setIsListening(false);
  }, []);

  // Auto-start mic when character is selected and track start time
  useEffect(() => {
    if (selectedCharacter && !gameOver && !isPaused) {
      // Track when battle actually starts (character selected)
      if (battleStartTimeRef.current === 0) {
        battleStartTimeRef.current = Date.now();
      }
      // Small delay to ensure state is ready
      const timeout = setTimeout(() => {
        startRecognition();
      }, 100);
      return () => clearTimeout(timeout);
    }
    
    return () => {
      speechManager.stop('reader');
      if (echoRetryTimeoutRef.current) {
        clearTimeout(echoRetryTimeoutRef.current);
      }
    };
  }, [selectedCharacter, gameOver, isPaused, startRecognition]);

  // Handle pause/resume for speech - separate effect for clean restart
  useEffect(() => {
    if (!selectedCharacter || gameOver) return;
    
    if (isPaused) {
      stopRecognition();
    } else {
      // Restart recognition after unpause with small delay
      const timeout = setTimeout(() => {
        startRecognition();
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [isPaused, selectedCharacter, gameOver, startRecognition, stopRecognition]);

  // TTS to hear the word pronunciation
  const pronounceWord = useCallback(() => {
    if (currentWord && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord);
      utterance.rate = 0.75;
      utterance.pitch = 1;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, [currentWord]);

  // Pause/Resume handlers
  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Calculate visual positions
  const progressPercent = ((ropePosition + WIN_THRESHOLD) / (WIN_THRESHOLD * 2)) * 100;

  // Show character selection first
  if (!selectedCharacter) {
    return <TugOfWarCharacterSelect onSelect={setSelectedCharacter} />;
  }

  const LeaderComponent = selectedCharacter === 'valor' ? SirValor : Elara;
  const leaderState = pullingAnimation === 'hero' ? 'pulling' : pullingAnimation === 'enemy' ? 'hit' : 'idle';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background */}
      <TugOfWarBackground />

      {/* Header */}
      <div className="relative z-10 p-4 text-center">
        <h2 className="text-3xl font-black text-white drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          ⚔️ TUG OF WAR ⚔️
        </h2>
        <p className="text-white/90 text-sm drop-shadow">Read words to pull the rope!</p>
      </div>

      {/* Rewards & Timer Display */}
      <div className="relative z-10 flex justify-center gap-4 mb-2">
        <motion.div 
          className="flex items-center gap-1 bg-yellow-500/40 backdrop-blur-sm px-3 py-1 rounded-full"
          animate={{ scale: totalGold > 0 ? [1, 1.1, 1] : 1 }}
          key={totalGold}
        >
          <Coins className="h-4 w-4 text-yellow-300" />
          <span className="text-yellow-200 font-bold">{totalGold}</span>
        </motion.div>
        
        {/* Auto-pull timer */}
        <motion.div 
          className={`flex items-center gap-1 backdrop-blur-sm px-3 py-1 rounded-full ${
            autoPullTimer <= 5 ? 'bg-red-500/60' : 'bg-orange-500/40'
          }`}
          animate={autoPullTimer <= 5 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: autoPullTimer <= 5 ? Infinity : 0 }}
        >
          <Timer className="h-4 w-4 text-white" />
          <span className="text-white font-bold">{autoPullTimer}s</span>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-1 bg-purple-500/40 backdrop-blur-sm px-3 py-1 rounded-full"
          animate={{ scale: totalXp > 0 ? [1, 1.1, 1] : 1 }}
          key={totalXp}
        >
          <Star className="h-4 w-4 text-purple-300" />
          <span className="text-purple-200 font-bold">{totalXp} XP</span>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 px-8 mb-4">
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-red-400 font-bold drop-shadow">{enemyName}</span>
          <span className="text-white font-bold drop-shadow">Score: {correctWords}/{wordsRead}</span>
          <span className="text-green-400 font-bold drop-shadow">{heroName}</span>
        </div>
        <div className="h-4 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm relative">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          {/* Center marker */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-white/50" />
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

      {/* ============ WORD + CONTROLS (CENTER SKY) ============ */}
      {!gameOver && (
        <div className="absolute left-0 right-0 z-20" style={{ top: '200px' }}>
          <div className="mx-auto w-full max-w-3xl px-4">
            {/* Paused Overlay */}
            <AnimatePresence>
              {isPaused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30 rounded-2xl"
                >
                  <div className="text-center">
                    <Pause className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-white mb-2">PAUSED</h3>
                    <p className="text-white/70 mb-4">Timer frozen at {autoPullTimer}s</p>
                    
                    <Button
                      size="lg"
                      onClick={pronounceWord}
                      className="bg-blue-600 hover:bg-blue-700 text-white mb-4"
                    >
                      <Volume2 className="h-5 w-5 mr-2" />
                      Hear "{currentWord}"
                    </Button>
                    
                    <Button
                      size="lg"
                      onClick={handleResume}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Resume
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 p-4">
              {/* Feedback */}
              <AnimatePresence>
                {feedback && !isPaused && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`text-center mb-2 text-2xl font-black ${
                      feedback === 'correct' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {feedback === 'correct' ? '✓ HEAVE! Pull!' : '✗ They pulled back!'}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pause Button & Hear Word */}
              <div className="flex justify-center gap-3 mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePause}
                  className="bg-yellow-500/20 border-yellow-400/50 text-yellow-200 hover:bg-yellow-500/30"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={pronounceWord}
                  className="bg-blue-500/20 border-blue-400/50 text-blue-200 hover:bg-blue-500/30"
                >
                  <Volume2 className="h-4 w-4 mr-1" />
                  Hear Word
                </Button>
              </div>

              {/* Current Word Display with Listening Indicator */}
              <div className="text-center">
                <motion.div
                  key={currentWord}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl md:text-7xl font-black text-white mb-2 drop-shadow-lg"
                  style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.6)' }}
                >
                  {currentWord}
                </motion.div>
                
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <motion.div
                    animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <Mic className={`h-5 w-5 ${isListening ? 'text-green-400' : 'text-gray-400'}`} />
                  </motion.div>
                  <span className="text-sm font-medium">
                    {isListening ? 'Listening... Say the word!' : 'Mic paused'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TUG-OF-WAR SCENE (LARGER CHARACTERS) ============ */}
      <motion.div 
        className="absolute left-0 right-0 z-[10]"
        style={{ bottom: '40px', height: '320px' }}
        animate={{ x: `${ropeOffsetPercent}%` }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      >
        <div className="relative w-full h-full flex items-end justify-center">
          
          {/* Enemy Team (Left Side) - Goblins */}
          <motion.div 
            className="absolute left-[3%] bottom-0 flex flex-col items-center z-[15]"
            animate={pullingAnimation === 'enemy' ? { x: [-10, 0] } : pullingAnimation === 'hero' ? { x: [10, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-end">
              <div className="origin-bottom -mr-4">
                <GoblinGuard 
                  state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                  healthPercent={100}
                  size="medium"
                />
              </div>
              <div className="origin-bottom -mr-2">
                <GoblinGuard 
                  state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                  healthPercent={100}
                  size="large"
                />
              </div>
              <div className="origin-bottom">
                <GoblinGuard 
                  state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                  healthPercent={100}
                  size="large"
                />
              </div>
            </div>
            <div className="text-red-600 font-bold text-sm mt-2 bg-white/90 px-3 py-1 rounded-full shadow">
              {enemyName}
            </div>
          </motion.div>

          {/* THE ROPE - spans across the middle */}
          <div 
            className="absolute inset-x-0 pointer-events-none z-[12]"
            style={{ 
              top: '50%', 
              transform: 'translateY(-50%)',
              height: '90px',
              left: '15%',
              right: '15%',
              width: '70%',
            }}
          >
            <TugOfWarRope 
              ropePosition={ropePosition}
              maxPosition={WIN_THRESHOLD}
              isPulling={pullingAnimation}
            />
          </div>

          {/* Hero Team (Right Side) - Leader + Kids */}
          <motion.div 
            className="absolute right-[3%] bottom-0 flex flex-col items-center z-[15]"
            animate={pullingAnimation === 'hero' ? { x: [10, 0] } : pullingAnimation === 'enemy' ? { x: [-10, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-end">
              <div className="origin-bottom mr-2">
                <LeaderComponent 
                  state={leaderState as any}
                  healthPercent={100}
                  size="large"
                  flipX
                />
              </div>
              {[0, 1, 2].map(i => (
                <div key={i} className="origin-bottom -ml-4">
                  <TugOfWarKid 
                    index={i}
                    isPulling={pullingAnimation === 'hero'}
                    isStraining={pullingAnimation === 'enemy'}
                    side="hero"
                    size="large"
                  />
                </div>
              ))}
            </div>
            <div className="text-blue-600 font-bold text-sm mt-2 bg-white/90 px-3 py-1 rounded-full shadow">
              {heroName}'s Team
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              {victory ? (
                <>
                  <Trophy className="h-24 w-24 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-4xl font-black text-green-400 mb-2">VICTORY!</h2>
                  <p className="text-white/80">You pulled the rope to your side!</p>
                  <div className="mt-4 flex justify-center gap-4">
                    <div className="flex items-center gap-1 bg-yellow-500/30 px-3 py-1 rounded-full">
                      <Coins className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-300 font-bold">{totalGold} Gold</span>
                    </div>
                    <div className="flex items-center gap-1 bg-purple-500/30 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 text-purple-400" />
                      <span className="text-purple-300 font-bold">{totalXp} XP</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Skull className="h-24 w-24 text-red-400 mx-auto mb-4" />
                  <h2 className="text-4xl font-black text-red-400 mb-2">DEFEAT!</h2>
                  <p className="text-white/80">The goblins pulled the rope to their side!</p>
                </>
              )}
              <div className="mt-4 text-white/60">
                <p>Words Read: {wordsRead}</p>
                <p>Accuracy: {wordsRead > 0 ? Math.round((correctWords / wordsRead) * 100) : 0}%</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
