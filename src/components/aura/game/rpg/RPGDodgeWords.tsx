import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface FlyingWord {
  id: number;
  word: string;
  isCorrect: boolean;
  x: number;
  y: number;
  speed: number;
  destroyed: boolean;
  hitHero: boolean;
  visible: boolean; // NEW: words start invisible and appear one at a time
}

interface RPGDodgeWordsProps {
  correctWords: string[];
  wrongWords: string[];
  onComplete: (correctHits: number, wrongHits: number, dodged: number) => void;
  onDamage: (damage: number) => void;
}

// Some common wrong/trap words
const defaultWrongWords = [
  "teh", "recieve", "wierd", "definately", "occured",
  "seperate", "untill", "goverment", "probaly", "enviroment",
];

export const RPGDodgeWords = ({
  correctWords,
  wrongWords = defaultWrongWords,
  onComplete,
  onDamage,
}: RPGDodgeWordsProps) => {
  const [flyingWords, setFlyingWords] = useState<FlyingWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<FlyingWord | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [correctHits, setCorrectHits] = useState(0);
  const [wrongHits, setWrongHits] = useState(0);
  const [dodged, setDodged] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const recognitionRef = useRef<any>(null);
  const spawnedRef = useRef(false);

  // Initialize flying words - all start INVISIBLE
  useEffect(() => {
    if (spawnedRef.current) return;
    spawnedRef.current = true;

    const allWords: FlyingWord[] = [];
    const numCorrect = Math.min(correctWords.length, 5);
    const numWrong = Math.min(wrongWords.length, 3);
    
    // Add correct words - start at right side (x: 100+)
    for (let i = 0; i < numCorrect; i++) {
      allWords.push({
        id: i,
        word: correctWords[i],
        isCorrect: true,
        x: 105, // Start off-screen right
        y: 25 + Math.random() * 50, // Random vertical position
        speed: 0.15 + Math.random() * 0.1, // MUCH SLOWER: 0.15-0.25 instead of 0.6-0.9
        destroyed: false,
        hitHero: false,
        visible: false, // Start invisible
      });
    }
    
    // Add wrong words
    for (let i = 0; i < numWrong; i++) {
      allWords.push({
        id: numCorrect + i,
        word: wrongWords[i],
        isCorrect: false,
        x: 105,
        y: 25 + Math.random() * 50,
        speed: 0.12 + Math.random() * 0.1, // Slightly slower for wrong words
        destroyed: false,
        hitHero: false,
        visible: false,
      });
    }

    // Shuffle
    setFlyingWords(allWords.sort(() => Math.random() - 0.5));
  }, [correctWords, wrongWords]);

  // Staggered word spawning - one at a time with 2.5 second delays
  useEffect(() => {
    if (flyingWords.length === 0) return;
    if (currentWordIndex >= flyingWords.length) return;

    // Make the current word visible
    setFlyingWords(prev => prev.map((word, idx) => 
      idx === currentWordIndex ? { ...word, visible: true } : word
    ));

    // Schedule next word spawn after 2.5 seconds
    const timer = setTimeout(() => {
      setCurrentWordIndex(prev => prev + 1);
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentWordIndex, flyingWords.length]);

  // Animation loop - SLOWER interval (100ms instead of 50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setFlyingWords(prev => {
        const updated = prev.map(word => {
          if (word.destroyed || word.hitHero || !word.visible) return word;
          
          const newX = word.x - word.speed;
          
          // Word reaches hero zone
          if (newX <= 15) {
            if (word.isCorrect) {
              // Correct word missed - no damage, but no points
              return { ...word, hitHero: true };
            } else {
              // Wrong word dodged successfully!
              setDodged(d => d + 1);
              return { ...word, destroyed: true };
            }
          }
          
          return { ...word, x: newX };
        });
        
        // Check completion - all visible words are done
        const visibleWords = updated.filter(w => w.visible);
        const allDone = visibleWords.length > 0 && visibleWords.every(w => w.destroyed || w.hitHero);
        const allSpawned = currentWordIndex >= prev.length;
        
        if (allDone && allSpawned) {
          setTimeout(() => onComplete(correctHits, wrongHits, dodged), 1000);
        }
        
        return updated;
      });
    }, 100); // SLOWER: 100ms instead of 50ms

    return () => clearInterval(interval);
  }, [correctHits, wrongHits, dodged, onComplete, currentWordIndex]);

  // Handle word selection
  const handleSelectWord = useCallback((word: FlyingWord) => {
    if (word.destroyed || word.hitHero || isListening || !word.visible) return;
    
    setSelectedWord(word);
    startListening(word);
  }, [isListening]);

  // Start speech recognition
  const startListening = useCallback((word: FlyingWord) => {
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.onresult = (event: any) => {
      const spoken = event.results[0][0].transcript.toLowerCase().trim();
      const expected = word.word.toLowerCase().replace(/[^a-z]/g, '');
      
      if (spoken.includes(expected) || expected.includes(spoken)) {
        // Word was spoken
        if (word.isCorrect) {
          // Good! Correct word hit
          setFlyingWords(prev => prev.map(w => 
            w.id === word.id ? { ...w, destroyed: true } : w
          ));
          setCorrectHits(c => c + 1);
        } else {
          // Bad! Spoke a wrong word
          setFlyingWords(prev => prev.map(w => 
            w.id === word.id ? { ...w, destroyed: true } : w
          ));
          setWrongHits(w => w + 1);
          onDamage(15);
        }
      }
      setSelectedWord(null);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      setSelectedWord(null);
    };

    recognitionRef.current.start();
  }, [onDamage]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto z-50">
      {/* Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 via-slate-900/70 to-indigo-900/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Title */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="px-6 py-2 bg-indigo-600/90 rounded-lg border-2 border-indigo-300">
          <span className="text-white font-black text-lg">⚔️ DODGE & SPEAK ⚔️</span>
        </div>
      </motion.div>

      {/* Legend */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-600/80 rounded-lg">
          <Check className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-bold">Speak these!</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-600/80 rounded-lg">
          <X className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-bold">Avoid these!</span>
        </div>
      </div>

      {/* Upcoming word indicator */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50">
        <div className="px-4 py-2 bg-slate-800/80 rounded-lg border border-slate-600">
          <span className="text-slate-300 text-sm">
            Word {Math.min(currentWordIndex + 1, flyingWords.length)} of {flyingWords.length}
          </span>
        </div>
      </div>

      {/* Hero zone indicator */}
      <div className="absolute left-[12%] top-[20%] bottom-[20%] w-2 bg-blue-500/50 rounded-full">
        <motion.div
          className="absolute inset-0 bg-blue-400"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>

      {/* Flying words - only render visible ones */}
      <AnimatePresence>
        {flyingWords.map((word) => (
          word.visible && !word.destroyed && !word.hitHero && (
            <motion.button
              key={word.id}
              className="absolute pointer-events-auto cursor-pointer z-20"
              style={{ left: `${word.x}%`, top: `${word.y}%` }}
              initial={{ scale: 0, rotate: -10, x: 50 }}
              animate={{ scale: 1, rotate: [0, 3, -3, 0], x: 0 }}
              exit={word.isCorrect 
                ? { scale: 1.5, opacity: 0, y: -30 } 
                : { scale: 0, opacity: 0, rotate: 180 }
              }
              transition={{ 
                rotate: { repeat: Infinity, duration: 3 },
                scale: { duration: 0.3 },
                x: { duration: 0.3 }
              }}
              onClick={() => handleSelectWord(word)}
            >
              <div className={`relative px-5 py-3 rounded-xl border-2 shadow-lg
                ${word.isCorrect 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-700 border-emerald-300' 
                  : 'bg-gradient-to-br from-red-500 to-rose-700 border-red-300'}
                ${selectedWord?.id === word.id ? 'ring-4 ring-yellow-400' : ''}`}
              >
                {/* Icon */}
                <div className="absolute -top-2 -right-2">
                  {word.isCorrect ? (
                    <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <span className="font-black text-lg text-white drop-shadow-md">
                  {word.word}
                </span>

                {/* Glow effect */}
                <motion.div
                  className={`absolute inset-0 rounded-xl ${
                    word.isCorrect ? 'bg-emerald-400/30' : 'bg-red-400/30'
                  }`}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              </div>
            </motion.button>
          )
        ))}
      </AnimatePresence>

      {/* Selected word speaking panel */}
      <AnimatePresence>
        {selectedWord && (
          <motion.div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <div className={`px-8 py-4 rounded-xl border-2 shadow-2xl
              ${selectedWord.isCorrect 
                ? 'bg-emerald-900/95 border-emerald-400' 
                : 'bg-red-900/95 border-red-400'}`}
            >
              <p className={`text-sm mb-2 ${selectedWord.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                {selectedWord.isCorrect ? 'Speak it!' : '⚠️ This is a TRAP word!'}
              </p>
              <p className="text-3xl font-black text-white">{selectedWord.word}</p>
              {isListening && (
                <motion.div 
                  className="mt-2 flex items-center justify-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedWord.isCorrect ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className={selectedWord.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                    Listening...
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score display */}
      <div className="absolute bottom-4 right-4 flex gap-4 z-50">
        <div className="px-4 py-2 bg-emerald-600/90 rounded-lg">
          <span className="text-white font-bold">Correct: {correctHits}</span>
        </div>
        <div className="px-4 py-2 bg-red-600/90 rounded-lg">
          <span className="text-white font-bold">Traps Hit: {wrongHits}</span>
        </div>
        <div className="px-4 py-2 bg-blue-600/90 rounded-lg">
          <span className="text-white font-bold">Dodged: {dodged}</span>
        </div>
      </div>
    </div>
  );
};
