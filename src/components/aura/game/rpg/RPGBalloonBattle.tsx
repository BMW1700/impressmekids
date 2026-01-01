import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundEffects } from "@/lib/pronunciationPlayer";

interface RPGBalloonBattleProps {
  words: string[];
  heroName?: string;
  enemyName?: string;
  onComplete: (victory: boolean, stats: { wordsRead: number; correctWords: number; balloonsLost: number }) => void;
  onWordResult?: (word: string, correct: boolean) => void;
}

const soundEffects = new SoundEffects();

const HERO_BALLOON_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
const ENEMY_BALLOON_COLOR = '#1f2937';

interface Balloon {
  id: number;
  color: string;
  hp: number;
  maxHp: number;
  popped: boolean;
}

export const RPGBalloonBattle = ({
  words,
  heroName = "Hero",
  enemyName = "Enemy",
  onComplete,
  onWordResult,
}: RPGBalloonBattleProps) => {
  // Hero has 5 balloons with 1 HP each
  const [heroBalloons, setHeroBalloons] = useState<Balloon[]>(
    HERO_BALLOON_COLORS.map((color, i) => ({
      id: i,
      color,
      hp: 1,
      maxHp: 1,
      popped: false,
    }))
  );

  // Enemy has 5 balloons with 5 HP each
  const [enemyBalloons, setEnemyBalloons] = useState<Balloon[]>(
    Array(5).fill(null).map((_, i) => ({
      id: i,
      color: ENEMY_BALLOON_COLOR,
      hp: 5,
      maxHp: 5,
      popped: false,
    }))
  );

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [balloonsLost, setBalloonsLost] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [poppingBalloon, setPoppingBalloon] = useState<{ side: 'hero' | 'enemy'; id: number } | null>(null);
  const [damageIndicator, setDamageIndicator] = useState<{ side: 'hero' | 'enemy'; id: number } | null>(null);

  const recognitionRef = useRef<any>(null);

  const currentWord = words[currentWordIndex] || "";
  const activeHeroBalloons = heroBalloons.filter(b => !b.popped);
  const activeEnemyBalloons = enemyBalloons.filter(b => !b.popped);
  const currentEnemyBalloon = activeEnemyBalloons[0];

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
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

  // Check for win/lose conditions
  useEffect(() => {
    if (gameOver) return;

    const heroRemaining = heroBalloons.filter(b => !b.popped).length;
    const enemyRemaining = enemyBalloons.filter(b => !b.popped).length;

    if (enemyRemaining === 0) {
      setGameOver(true);
      setVictory(true);
      soundEffects.celebrationSound();
      setTimeout(() => {
        onComplete(true, { wordsRead, correctWords, balloonsLost });
      }, 2000);
    } else if (heroRemaining === 0) {
      setGameOver(true);
      setVictory(false);
      soundEffects.rockCrumble();
      setTimeout(() => {
        onComplete(false, { wordsRead, correctWords, balloonsLost });
      }, 2000);
    }
  }, [heroBalloons, enemyBalloons, gameOver, wordsRead, correctWords, balloonsLost, onComplete]);

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
              return { ...b, hp: 0, popped: true };
            }
            soundEffects.magicSparkle();
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
  }, [currentWord, currentWordIndex, words.length, currentEnemyBalloon, heroBalloons, onWordResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening || gameOver) return;

    setIsListening(true);

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const targetWord = currentWord.toLowerCase().replace(/[^a-z]/g, '');
      const spokenWord = transcript.replace(/[^a-z]/g, '');
      
      const isCorrect = spokenWord === targetWord || 
                        transcript.includes(targetWord) ||
                        targetWord.includes(spokenWord);
      
      handleWordResult(isCorrect);
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      setIsListening(false);
    }
  }, [isListening, gameOver, currentWord, handleWordResult]);

  const renderBalloon = (balloon: Balloon, side: 'hero' | 'enemy', index: number) => {
    const isPopping = poppingBalloon?.side === side && poppingBalloon?.id === balloon.id;
    const isDamaged = damageIndicator?.side === side && damageIndicator?.id === balloon.id;
    const isTarget = side === 'enemy' && currentEnemyBalloon?.id === balloon.id;

    if (balloon.popped && !isPopping) return null;

    return (
      <motion.div
        key={balloon.id}
        className="relative"
        initial={{ scale: 1, opacity: 1 }}
        animate={
          isPopping
            ? { scale: [1, 1.3, 0], opacity: [1, 1, 0], rotate: [0, 10, -10, 0] }
            : isDamaged
            ? { scale: [1, 0.9, 1.1, 1], x: [0, -5, 5, 0] }
            : { scale: 1, y: [0, -5, 0] }
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
          className={`w-16 h-20 rounded-full relative ${isTarget ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''}`}
          style={{
            background: `radial-gradient(ellipse at 30% 30%, ${balloon.color}dd, ${balloon.color})`,
            boxShadow: `0 4px 20px ${balloon.color}40`,
          }}
        >
          {/* Shine effect */}
          <div className="absolute top-3 left-3 w-4 h-4 bg-white/40 rounded-full blur-sm" />
          
          {/* HP indicator for enemy balloons */}
          {side === 'enemy' && !balloon.popped && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {Array(balloon.maxHp).fill(null).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < balloon.hp ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}

          {/* String */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-400" />
        </div>

        {/* Pop particles */}
        <AnimatePresence>
          {isPopping && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`pop-${i}`}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                  style={{ backgroundColor: balloon.color }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: (Math.cos((i / 8) * Math.PI * 2) * 40),
                    y: (Math.sin((i / 8) * Math.PI * 2) * 40),
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200 flex flex-col">
      {/* Clouds background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
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
        ))}
      </div>

      {/* Header */}
      <div className="p-4 text-center relative z-10">
        <h2 className="text-2xl font-black text-white drop-shadow-lg flex items-center justify-center gap-2">
          🎈 BALLOON BATTLE 🎈
        </h2>
        <p className="text-white/80 text-sm drop-shadow">Pop all enemy balloons! Don't lose yours!</p>
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

          {/* Listen Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={startListening}
              disabled={isListening || gameOver}
              className={`px-8 py-6 text-xl font-bold rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400'
              }`}
            >
              {isListening ? '🎤 Listening...' : '🎤 Tap & Speak'}
            </Button>
          </div>

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
    </div>
  );
};
