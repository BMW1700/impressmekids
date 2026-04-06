import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Star, Target, Link2 } from "lucide-react";
import { speechManager } from "@/lib/speechRecognitionManager";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface RhymeWord {
  id: number;
  word: string;
  rhymesWith: string;
  spoken: boolean;
  missed: boolean;
}

interface RPGRhymeChainProps {
  words: string[];
  onComplete: (score: number, damage: number) => void;
  onDamage: (damage: number) => void;
}

const sounds = new SoundEffects();

// Common rhyme patterns
const rhymePairs: Record<string, string[]> = {
  cat: ['hat', 'bat', 'mat', 'rat', 'sat', 'flat'],
  dog: ['log', 'fog', 'jog', 'frog', 'hog', 'blog'],
  run: ['fun', 'sun', 'bun', 'gun', 'done', 'won'],
  see: ['tree', 'bee', 'free', 'key', 'me', 'we'],
  day: ['way', 'play', 'say', 'may', 'stay', 'pay'],
  night: ['light', 'fight', 'right', 'sight', 'bright', 'flight'],
  book: ['look', 'cook', 'took', 'hook', 'brook', 'shook'],
  time: ['rhyme', 'climb', 'chime', 'prime', 'mime', 'slime'],
  house: ['mouse', 'blouse'],
  king: ['ring', 'sing', 'thing', 'bring', 'wing', 'spring'],
  make: ['take', 'cake', 'lake', 'wake', 'bake', 'shake'],
  sleep: ['deep', 'keep', 'leap', 'creep', 'sheep', 'steep'],
};

const getRandomRhyme = (word: string): string | null => {
  const lowerWord = word.toLowerCase();
  for (const [key, rhymes] of Object.entries(rhymePairs)) {
    if (lowerWord.includes(key) || rhymes.some(r => lowerWord.includes(r))) {
      const allOptions = [key, ...rhymes].filter(w => w !== lowerWord);
      return allOptions[Math.floor(Math.random() * allOptions.length)];
    }
  }
  // Fallback: pick a random rhyme set
  const keys = Object.keys(rhymePairs);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return rhymePairs[randomKey][Math.floor(Math.random() * rhymePairs[randomKey].length)];
};

export const RPGRhymeChain = ({
  words,
  onComplete,
  onDamage,
}: RPGRhymeChainProps) => {
  const [rhymeWords, setRhymeWords] = useState<RhymeWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'complete'>('ready');
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const isMountedRef = useRef(true);
  const currentIndexRef = useRef(0);
  const rhymeWordsRef = useRef<RhymeWord[]>([]);
  const phaseRef = useRef<'ready' | 'playing' | 'complete'>('ready');

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    rhymeWordsRef.current = rhymeWords;
  }, [rhymeWords]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Initialize rhyme words
  useEffect(() => {
    const limitedWords = words.slice(0, 6);
    const rhymes: RhymeWord[] = limitedWords.map((word, i) => ({
      id: i,
      word,
      rhymesWith: getRandomRhyme(word) || 'cat',
      spoken: false,
      missed: false,
    }));
    setRhymeWords(rhymes);
    rhymeWordsRef.current = rhymes;
    
    sounds.miniGameStart();
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setPhase('playing');
        startListening();
      }
    }, 1500);
  }, [words]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          speechManager.stop('rhyme_chain');
          setPhase('complete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Check for completion
  useEffect(() => {
    if (phase === 'complete') {
      const damage = score * 8 + combo * 15;
      setTimeout(() => {
        if (isMountedRef.current) {
          onComplete(score, damage);
        }
      }, 1500);
    }
  }, [phase, score, combo, onComplete]);

  // Start recognition using manager
  const startListening = useCallback(() => {
    speechManager.start({
      owner: 'rhyme_chain',
      continuous: true,
      interimResults: false,
      onStart: () => {
        if (isMountedRef.current) {
          setIsListening(true);
        }
      },
      onEnd: () => {
        if (isMountedRef.current) {
          setIsListening(false);
        }
      },
      onResult: (transcript, alternatives, isFinal) => {
        if (!isFinal || !isMountedRef.current || phaseRef.current !== 'playing') return;
        
        const currentIdx = currentIndexRef.current;
        const words = rhymeWordsRef.current;
        
        if (currentIdx >= words.length) return;
        
        const currentRhyme = words[currentIdx];
        const expectedRhyme = currentRhyme.rhymesWith.toLowerCase();
        const spoken = transcript.toLowerCase().trim();
        const isMatch = spoken.includes(expectedRhyme) || expectedRhyme.includes(spoken);
        
        if (isMatch) {
          sounds.correctWord();
          setFeedback('correct');
          setScore(prev => prev + 1);
          setCombo(prev => prev + 1);
          setRhymeWords(prev => prev.map((w, i) => 
            i === currentIdx ? { ...w, spoken: true } : w
          ));
          setCurrentIndex(prev => prev + 1);
          
          // Check if all done
          if (currentIdx >= words.length - 1) {
            speechManager.stop('rhyme_chain');
            setPhase('complete');
          }
        } else {
          sounds.incorrectWord();
          setFeedback('wrong');
          setCombo(0);
          onDamage(8);
        }
        
        setTimeout(() => setFeedback(null), 500);
      },
      onError: (error) => {
        console.log('[RhymeChain] Recognition error:', error);
      },
    });
  }, [onDamage]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      speechManager.abort('rhyme_chain');
    };
  }, []);

  const currentWord = rhymeWords[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 bg-gradient-to-br ${getMinigameTheme('rhymeChain').bgGradient} flex flex-col items-center justify-center`}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 500),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 500),
              opacity: 0.2,
            }}
            animate={{
              y: [null, -50, null],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
            }}
          >
            {isAgentMode() ? '🔗' : '🎵'}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <motion.div 
        className="text-center mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {(() => { const t = getMinigameTheme('rhymeChain'); const agent = isAgentMode(); return (
        <>
        <div className="flex items-center justify-center gap-3 mb-2">
          {agent ? <Link2 className="h-8 w-8 text-cyan-400" /> : <Music className="h-8 w-8 text-pink-400" />}
          <h1 className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${t.accentGradient}`}>
            {t.title}
          </h1>
          {agent ? <Link2 className="h-8 w-8 text-teal-400" /> : <Music className="h-8 w-8 text-purple-400" />}
        </div>
        <p className={agent ? 'text-cyan-200' : 'text-pink-200'}>
          {agent ? 'Match the code pattern for each word!' : 'Speak the word that RHYMES with each word!'}
        </p>
        </>
        ); })()}
      </motion.div>

      {/* Timer & Score */}
      <div className="flex gap-8 mb-8">
        <motion.div 
          className="bg-pink-900/60 px-6 py-3 rounded-xl border border-pink-500/50"
          animate={timeLeft <= 3 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <span className={`text-3xl font-black ${timeLeft <= 3 ? 'text-red-400' : 'text-pink-300'}`}>
            {timeLeft}s
          </span>
        </motion.div>
        
        <div className="bg-purple-900/60 px-6 py-3 rounded-xl border border-purple-500/50 flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" />
          <span className="text-3xl font-black text-purple-300">{score}</span>
        </div>
        
        {combo > 1 && (
          <motion.div 
            className="bg-orange-900/60 px-6 py-3 rounded-xl border border-orange-500/50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <span className="text-3xl font-black text-orange-300">x{combo}</span>
          </motion.div>
        )}
      </div>

      {/* Ready phase */}
      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-6xl font-black text-yellow-400 mb-4"
            >
              GET READY!
            </motion.div>
            <p className="text-pink-200 text-xl">Listen for the rhyming word...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playing phase */}
      {phase === 'playing' && currentWord && (
        <div className="text-center space-y-8">
          {/* Word to rhyme with */}
          <motion.div
            key={currentWord.id}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="bg-slate-900/80 px-12 py-6 rounded-2xl border-2 border-pink-500"
          >
            <p className="text-slate-400 text-sm mb-2">What rhymes with...</p>
            <p className="text-5xl font-black text-white">{currentWord.word}</p>
          </motion.div>

          {/* Target rhyme hint */}
          <motion.div
            className="flex items-center justify-center gap-3"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Target className="h-6 w-6 text-green-400" />
            <p className="text-green-300 text-xl">
              Say: <span className="font-bold text-green-400 text-2xl">{currentWord.rhymesWith}</span>
            </p>
          </motion.div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`text-4xl font-black ${
                  feedback === 'correct' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {feedback === 'correct' ? (isAgentMode() ? '✓ PATTERN MATCH!' : '✓ RHYME!') : (isAgentMode() ? '✗ MISMATCH!' : '✗ TRY AGAIN!')}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Listening indicator */}
          {isListening && (
            <motion.div
              className="flex items-center justify-center gap-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-300">Listening...</span>
            </motion.div>
          )}
        </div>
      )}

      {/* Progress dots */}
      <div className="flex gap-3 mt-8">
        {rhymeWords.map((word, i) => (
          <motion.div
            key={word.id}
            className={`w-4 h-4 rounded-full ${
              word.spoken ? 'bg-green-400' : 
              word.missed ? 'bg-red-400' :
              i === currentIndex ? 'bg-yellow-400' : 'bg-slate-600'
            }`}
            animate={i === currentIndex ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Complete phase */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <div className="text-center bg-purple-900/90 p-8 rounded-2xl border-2 border-purple-500">
              <h2 className={`text-4xl font-black ${isAgentMode() ? 'text-cyan-300' : 'text-purple-300'} mb-4`}>{isAgentMode() ? 'PATTERN COMPLETE!' : 'CHAIN COMPLETE!'}</h2>
              <div className="flex gap-6 justify-center">
                <div>
                  <p className="text-5xl font-black text-green-400">{score}</p>
                  <p className="text-sm text-slate-400">Rhymes</p>
                </div>
                <div>
                  <p className="text-5xl font-black text-orange-400">{combo}</p>
                  <p className="text-sm text-slate-400">Best Combo</p>
                </div>
                <div>
                  <p className="text-5xl font-black text-red-400">{score * 8 + combo * 15}</p>
                  <p className="text-sm text-slate-400">Damage</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};