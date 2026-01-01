import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, Coins, Star, Mic, MicOff, Pause, Play, Timer, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { TugOfWarBackground } from "./TugOfWarBackground";
import { TugOfWarRope } from "./TugOfWarRope";
import { TugOfWarKid } from "./TugOfWarKid";
import { TugOfWarCharacterSelect } from "./TugOfWarCharacterSelect";
import { SirValor } from "../characters/SirValor";
import { Elara } from "../characters/Elara";
import { GoblinGuard } from "../characters/GoblinGuard";

interface RPGTugOfWarProps {
  words: string[];
  heroName?: string;
  enemyName?: string;
  onComplete: (victory: boolean, stats: { wordsRead: number; correctWords: number; incorrectWords: number }) => void;
  onWordResult?: (word: string, correct: boolean) => void;
}

const soundEffects = new SoundEffects();

interface FloatingReward {
  id: number;
  gold: number;
  xp: number;
  x: number;
  y: number;
}

export const RPGTugOfWar = ({
  words,
  heroName = "Hero",
  enemyName = "Goblins",
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
  
  // Microphone states - continuous with pause
  const [isMicActive, setIsMicActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Auto-pull timer
  const [autoPullTimer, setAutoPullTimer] = useState(10);
  
  // Rewards
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);
  const [totalGold, setTotalGold] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const rewardIdRef = useRef(0);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  const currentWord = words[currentWordIndex] || "";
  const WIN_THRESHOLD = 10;
  const LOSE_THRESHOLD = -10;

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Log on mount to prove v2 is loaded
  useEffect(() => {
    console.log("[TUG-OF-WAR] v2 mounted", { 
      selectedCharacter, 
      ropePosition, 
      isMicActive, 
      isPaused,
      wordsCount: words.length 
    });
  }, []);

  // Auto-pull timer is set up below after handleEnemyAutoPull is defined

  // Check for win/lose conditions
  useEffect(() => {
    if (gameOver) return;

    if (ropePosition >= WIN_THRESHOLD) {
      setGameOver(true);
      setVictory(true);
      soundEffects.celebrationSound();
      stopMic();
      setTimeout(() => {
        onComplete(true, { wordsRead, correctWords, incorrectWords });
      }, 2000);
    } else if (ropePosition <= LOSE_THRESHOLD) {
      setGameOver(true);
      setVictory(false);
      soundEffects.rockCrumble();
      stopMic();
      setTimeout(() => {
        onComplete(false, { wordsRead, correctWords, incorrectWords });
      }, 2000);
    }
  }, [ropePosition, gameOver, wordsRead, correctWords, incorrectWords, onComplete]);

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
    if (gameOver) return;
    
    const newPosition = Math.max(ropePosition - 2, LOSE_THRESHOLD);
    setIncorrectWords(prev => prev + 1);
    setFeedback('incorrect');
    setPullingAnimation('enemy');
    setRopePosition(newPosition);
    soundEffects.incorrectWord();
    soundEffects.rockCrumble();
    
    setTimeout(() => {
      setFeedback(null);
      setPullingAnimation(null);
    }, 800);
  }, [gameOver, ropePosition]);

  // Auto-pull timer - enemies pull every 10 seconds EVEN IF MIC IS ACTIVE (creates pressure)
  useEffect(() => {
    if (gameOver || !selectedCharacter || isPaused) return;
    
    const interval = setInterval(() => {
      setAutoPullTimer(prev => {
        if (prev <= 1) {
          handleEnemyAutoPull();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameOver, selectedCharacter, isPaused, handleEnemyAutoPull]);

  const handleWordResult = useCallback((correct: boolean) => {
    setWordsRead(prev => prev + 1);
    const newPosition = correct 
      ? Math.min(ropePosition + 1, WIN_THRESHOLD)
      : Math.max(ropePosition - 2, LOSE_THRESHOLD);
    
    if (correct) {
      setCorrectWords(prev => prev + 1);
      setFeedback('correct');
      setPullingAnimation('hero');
      setRopePosition(newPosition);
      soundEffects.correctWord();
      soundEffects.comboSuccess();
      
      // Reset auto-pull timer on correct word
      setAutoPullTimer(10);
      
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
      setIncorrectWords(prev => prev + 1);
      setFeedback('incorrect');
      setPullingAnimation('enemy');
      setRopePosition(newPosition);
      soundEffects.incorrectWord();
      soundEffects.rockCrumble();
    }

    onWordResult?.(currentWord, correct);

    // Clear feedback and move to next word
    setTimeout(() => {
      setFeedback(null);
      setPullingAnimation(null);
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      }
    }, 800);
  }, [currentWord, currentWordIndex, words.length, onWordResult, ropePosition, showFloatingReward]);

  const startMic = useCallback(() => {
    if (!recognitionRef.current || gameOver) return;

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
      console.log('Speech error:', e.error);
      if (e.error === 'no-speech') {
        // Restart on no speech
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
      // Restart if still active and not paused
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

  // TTS to hear the word pronunciation
  const pronounceWord = useCallback(() => {
    if (currentWord && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord);
      utterance.rate = 0.75; // Slower for clarity
      utterance.pitch = 1;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, [currentWord]);

  const resumeMic = useCallback(() => {
    setIsPaused(false);
    isListeningRef.current = true;
    try {
      recognitionRef.current?.start();
    } catch (e) {}
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
            autoPullTimer <= 3 ? 'bg-red-500/60' : 'bg-orange-500/40'
          }`}
          animate={autoPullTimer <= 3 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: autoPullTimer <= 3 ? Infinity : 0 }}
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

      {/* Rope - positioned in the middle where teams connect */}
      <TugOfWarRope 
        ropePosition={ropePosition}
        maxPosition={WIN_THRESHOLD}
        isPulling={pullingAnimation}
      />

      {/* Teams Container - positioned at rope level */}
      <div className="absolute left-0 right-0 z-10 flex items-center justify-between px-4" style={{ bottom: '100px' }}>
        {/* Enemy Team (Left) - Goblins pulling rope */}
        <motion.div 
          className="flex flex-col items-center"
          animate={pullingAnimation === 'enemy' ? { x: [-12, 0] } : pullingAnimation === 'hero' ? { x: [12, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-end gap-0">
            {/* Goblins in a row - all facing right toward rope */}
            <div className="scale-[0.55] origin-bottom-right -mr-3">
              <GoblinGuard 
                state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                healthPercent={100}
                size="small"
              />
            </div>
            <div className="scale-[0.65] origin-bottom -mr-2">
              <GoblinGuard 
                state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                healthPercent={100}
                size="small"
              />
            </div>
            <div className="scale-[0.75] origin-bottom -mr-1">
              <GoblinGuard 
                state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                healthPercent={100}
                size="small"
              />
            </div>
            {/* Leader goblin - largest */}
            <div className="scale-[0.9] origin-bottom">
              <GoblinGuard 
                state={pullingAnimation === 'enemy' ? 'pulling' : pullingAnimation === 'hero' ? 'hit' : 'idle'}
                healthPercent={100}
                size="medium"
              />
            </div>
          </div>
          <div className="text-red-600 font-bold text-sm mt-2 bg-white/90 px-3 py-1 rounded-full shadow">
            {enemyName}
          </div>
        </motion.div>

        {/* Hero Team (Right) - Leader + Kids pulling rope */}
        <motion.div 
          className="flex flex-col items-center"
          animate={pullingAnimation === 'hero' ? { x: [12, 0] } : pullingAnimation === 'enemy' ? { x: [-12, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-end gap-0">
            {/* Leader character - facing left toward rope */}
            <div className="scale-[0.9] origin-bottom">
              <LeaderComponent 
                state={leaderState as any}
                healthPercent={100}
                size="medium"
                flipX
              />
            </div>
            {/* Kids in a row - facing left toward rope, much larger */}
            {[0, 1, 2].map(i => (
              <div key={i} className="-ml-2">
                <TugOfWarKid 
                  index={i}
                  isPulling={pullingAnimation === 'hero'}
                  isStraining={pullingAnimation === 'enemy'}
                  side="hero"
                  size="medium"
                />
              </div>
            ))}
          </div>
          <div className="text-blue-600 font-bold text-sm mt-2 bg-white/90 px-3 py-1 rounded-full shadow">
            {heroName}'s Team
          </div>
        </motion.div>
      </div>

      {/* Word Display & Controls */}
      {!gameOver && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`text-center mb-4 text-2xl font-black ${
                  feedback === 'correct' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {feedback === 'correct' ? '✓ HEAVE! Pull!' : '✗ They pulled back!'}
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
            <div className="text-white/60 text-sm mb-2">Read this word:</div>
            <div className="text-5xl font-black text-white tracking-wide drop-shadow-lg">
              {currentWord}
            </div>
          </motion.div>

          {/* Mic Controls */}
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
                  <>
                    <Button
                      size="lg"
                      onClick={pronounceWord}
                      className="px-6 py-6 text-xl font-bold rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500"
                    >
                      <Volume2 className="h-6 w-6 mr-2" />
                      Hear Word
                    </Button>
                    <Button
                      size="lg"
                      onClick={resumeMic}
                      className="px-6 py-6 text-xl font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                    >
                      <Play className="h-6 w-6 mr-2" />
                      Resume
                    </Button>
                  </>
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

          {/* Mic status indicator */}
          {isMicActive && (
            <motion.div 
              className={`text-center mt-3 text-sm font-bold ${isPaused ? 'text-yellow-400' : 'text-green-400'}`}
              animate={!isPaused ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {isPaused ? '⏸️ Paused - Timer running!' : '🎤 Listening...'}
            </motion.div>
          )}

          {/* Testing buttons */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWordResult(true)}
              className="text-green-400 hover:bg-green-400/20"
            >
              ✓ Correct
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWordResult(false)}
              className="text-red-400 hover:bg-red-400/20"
            >
              ✗ Wrong
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
