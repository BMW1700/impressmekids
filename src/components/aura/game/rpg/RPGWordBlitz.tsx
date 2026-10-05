import { useMinigameMicOwnership } from "@/hooks/useMinigameMicOwnership";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Timer } from "lucide-react";

interface BlitzWord {
  id: number;
  word: string;
  x: number;
  y: number;
  destroyed: boolean;
  speed: number;
}

interface RPGWordBlitzProps {
  words: string[];
  onComplete: (correctHits: number, missed: number, damage: number) => void;
  onDamage: (damage: number) => void;
}

export const RPGWordBlitz = ({
  words,
  onComplete,
  onDamage,
}: RPGWordBlitzProps) => {
  const [blitzWords, setBlitzWords] = useState<BlitzWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [correctHits, setCorrectHits] = useState(0);
  const [missed, setMissed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20); // 20 second time limit
  const [gameOver, setGameOver] = useState(false);
  const recognitionRef = useRef<any>(null);
  useMinigameMicOwnership('word_blitz', recognitionRef);
  const isListeningRef = useRef(false);

  // Initialize words
  useEffect(() => {
    const initialWords: BlitzWord[] = words.slice(0, 8).map((word, i) => ({
      id: i,
      word: word.replace(/[^a-zA-Z]/g, ''),
      x: 100 + i * 15, // Stagger starting positions
      y: 30 + Math.random() * 40,
      destroyed: false,
      speed: 0.8 + Math.random() * 0.4,
    }));
    setBlitzWords(initialWords);
  }, [words]);

  // Timer countdown
  useEffect(() => {
    if (gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver]);

  // Game over handling
  useEffect(() => {
    if (gameOver) {
      stopListening();
      const damage = correctHits * 15 + streak * 5;
      setTimeout(() => onComplete(correctHits, missed, damage), 1000);
    }
  }, [gameOver, correctHits, missed, streak, onComplete]);

  // Word movement
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBlitzWords(prev => {
        const updated = prev.map(word => {
          if (word.destroyed) return word;
          
          const newX = word.x - word.speed;
          
          // Word escaped
          if (newX <= 5) {
            setMissed(m => m + 1);
            setStreak(0);
            onDamage(5);
            return { ...word, destroyed: true };
          }
          
          return { ...word, x: newX };
        });

        // Check if all words done
        const allDone = updated.every(w => w.destroyed);
        if (allDone && !gameOver) {
          setGameOver(true);
        }

        return updated;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver, onDamage]);

  // Start continuous listening
  useEffect(() => {
    startListening();
    return () => stopListening();
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;
      isListeningRef.current = true;

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          const spokenWords = transcript.split(/\s+/);

          setBlitzWords(prev => {
            const updated = [...prev];
            for (const spoken of spokenWords) {
              const cleanSpoken = spoken.replace(/[^a-z]/g, '');
              if (cleanSpoken.length < 2) continue;

              // Find matching word
              for (const word of updated) {
                if (word.destroyed) continue;
                const target = word.word.toLowerCase();
                
                if (cleanSpoken === target || 
                    target.startsWith(cleanSpoken.slice(0, 3)) ||
                    cleanSpoken.startsWith(target.slice(0, 3))) {
                  word.destroyed = true;
                  setCorrectHits(c => c + 1);
                  setStreak(s => s + 1);
                  break;
                }
              }
            }
            return updated;
          });
        }
      };

      recognition.onerror = () => {
        if (isListeningRef.current && !gameOver) {
          setTimeout(() => startListening(), 200);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isListeningRef.current && !gameOver) {
          setTimeout(() => startListening(), 100);
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
    }
  }, [gameOver]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    setIsListening(false);
  }, []);

  if (gameOver) {
    const totalDamage = correctHits * 15 + streak * 5;
    return (
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-yellow-900/95 to-amber-950/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center p-8 rounded-2xl bg-slate-900/80 border-2 border-yellow-500/50"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
        >
          <motion.div 
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3 }}
          >
            ⚡
          </motion.div>
          <h2 className="text-3xl font-black text-yellow-400 mb-4">
            BLITZ COMPLETE!
          </h2>
          <div className="flex gap-8 justify-center mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{correctHits}</p>
              <p className="text-sm text-slate-400">Words Hit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">{streak}</p>
              <p className="text-sm text-slate-400">Best Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{totalDamage}</p>
              <p className="text-sm text-slate-400">Damage</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-900 via-amber-800 to-orange-900" />
      
      {/* Lightning effects */}
      <motion.div
        className="absolute inset-0 bg-yellow-400/10"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      />

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
        <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-yellow-500/50">
          <h2 className="text-xl font-black text-yellow-400 flex items-center gap-2">
            <Zap className="h-5 w-5" /> WORD BLITZ!
          </h2>
          <p className="text-sm text-yellow-300">Speak words as fast as you can!</p>
        </div>
        
        <div className="flex gap-4">
          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            timeLeft <= 5 ? 'bg-red-900/80 border-red-500' : 'bg-slate-900/80 border-yellow-500/50'
          }`}>
            <Timer className={`h-5 w-5 ${timeLeft <= 5 ? 'text-red-400' : 'text-yellow-400'}`} />
            <span className={`font-bold text-xl ${timeLeft <= 5 ? 'text-red-400' : 'text-yellow-300'}`}>
              {timeLeft}s
            </span>
          </div>
          
          {/* Streak */}
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-cyan-500/50">
            <span className="text-cyan-400 font-bold">🔥 {streak}</span>
          </div>
          
          {/* Score */}
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-green-500/50">
            <span className="text-green-400 font-bold">{correctHits}</span>
            <span className="text-slate-400"> / {blitzWords.length}</span>
          </div>
        </div>
      </div>

      {/* Player zone */}
      <div className="absolute left-[3%] top-[20%] bottom-[20%] w-2 bg-blue-500/50 rounded-full" />

      {/* Flying words */}
      <AnimatePresence>
        {blitzWords.map((word) => (
          !word.destroyed && (
            <motion.div
              key={word.id}
              className="absolute z-20 pointer-events-none"
              style={{ left: `${word.x}%`, top: `${word.y}%` }}
              initial={{ scale: 0, x: 50 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 1.5, opacity: 0, y: -30 }}
            >
              <div className="relative px-5 py-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl border-2 border-yellow-300 shadow-lg shadow-yellow-500/30">
                <motion.div
                  className="absolute -inset-1 bg-yellow-400/30 rounded-xl blur-sm"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
                <span className="relative font-black text-lg text-white drop-shadow-md">
                  {word.word}
                </span>
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Listening indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          className={`px-6 py-3 rounded-xl ${
            isListening 
              ? 'bg-green-600 shadow-[0_0_30px_rgba(34,197,94,0.5)]' 
              : 'bg-slate-700'
          }`}
          animate={isListening ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="flex items-center gap-3">
            <Zap className={`h-6 w-6 ${isListening ? 'text-yellow-300' : 'text-slate-400'}`} />
            <span className={`font-bold ${isListening ? 'text-white' : 'text-slate-400'}`}>
              {isListening ? 'SPEAK NOW!' : 'Starting...'}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
