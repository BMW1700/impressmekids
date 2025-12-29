import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Shield, Zap } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface BarrageWord {
  id: string;
  word: string;
  x: number;
  y: number;
  targetX: number;
  speed: number;
  destroyed: boolean;
}

interface RPGWordBarrageProps {
  words: string[];
  onComplete: (wordsDestroyed: number, wordsMissed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGWordBarrage = ({
  words,
  onComplete,
  onWordHit,
}: RPGWordBarrageProps) => {
  const [barrageWords, setBarrageWords] = useState<BarrageWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<BarrageWord | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsDestroyed, setWordsDestroyed] = useState(0);
  const [wordsMissed, setWordsMissed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize barrage words
  useEffect(() => {
    const initialWords: BarrageWord[] = words.map((word, index) => ({
      id: `barrage-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      x: -100 - (index * 80), // Start off-screen left with stagger
      y: 20 + (index % 3) * 25, // Vary vertical position
      targetX: 100, // Target is the right side (hero position)
      speed: 0.3 + Math.random() * 0.2, // Varying speeds
      destroyed: false,
    }));
    setBarrageWords(initialWords);
  }, [words]);

  // Animation loop - words drifting toward heroes
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      setBarrageWords(prev => {
        const updated = prev.map(w => {
          if (w.destroyed) return w;
          const newX = w.x + w.speed;
          
          // Check if word reached the heroes
          if (newX >= 85) {
            // Word hit the heroes!
            onWordHit(12);
            soundEffects.incorrectWord();
            setWordsMissed(m => m + 1);
            return { ...w, destroyed: true };
          }
          
          return { ...w, x: newX };
        });
        
        // Check if all words are done
        const allDone = updated.every(w => w.destroyed);
        if (allDone) {
          setIsActive(false);
          setTimeout(() => {
            onComplete(wordsDestroyed, wordsMissed);
          }, 500);
        }
        
        return updated;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, onComplete, onWordHit, wordsDestroyed, wordsMissed]);

  // Handle word selection
  const handleSelectWord = useCallback((word: BarrageWord) => {
    if (word.destroyed || isListening) return;
    setSelectedWord(word);
    startListening(word);
  }, [isListening]);

  // Speech recognition
  const startListening = useCallback((word: BarrageWord) => {
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsListening(true);
      setSpokenText("");
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0];
      const transcript = result[0].transcript.trim().toLowerCase();
      setSpokenText(transcript);

      if (result.isFinal) {
        let matched = false;
        
        // Check alternatives
        for (let i = 0; i < result.length && !matched; i++) {
          const alt = result[i]?.transcript?.trim().toLowerCase() || '';
          if (isWordMatchLenient(alt, word.word)) {
            matched = true;
          }
        }

        if (matched) {
          // Destroy the word!
          soundEffects.correctWord();
          setWordsDestroyed(d => d + 1);
          setBarrageWords(prev => 
            prev.map(w => w.id === word.id ? { ...w, destroyed: true } : w)
          );
        } else {
          soundEffects.incorrectWord();
        }

        setIsListening(false);
        setSelectedWord(null);
        setSpokenText("");
        recognition.stop();
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setSelectedWord(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dramatic Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-r from-purple-900/50 via-black/60 to-transparent"
      />

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="bg-gradient-to-r from-red-600 to-purple-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-400/50">
          <div className="flex items-center gap-3 text-white">
            <Zap className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">WORD BARRAGE! Click words to destroy them!</span>
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Barrage Words */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {barrageWords.map((word) => (
            !word.destroyed && (
              <motion.button
                key={word.id}
                className={`absolute pointer-events-auto px-4 py-2 rounded-full
                  font-bold text-lg cursor-pointer transition-all
                  ${selectedWord?.id === word.id 
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black scale-125 shadow-[0_0_40px_rgba(251,191,36,0.8)]' 
                    : 'bg-gradient-to-br from-purple-600 to-red-600 text-white shadow-[0_0_30px_rgba(147,51,234,0.6)]'
                  }
                  hover:scale-110 hover:shadow-[0_0_40px_rgba(147,51,234,0.8)]`}
                style={{
                  left: `${word.x}%`,
                  top: `${word.y}%`,
                }}
                onClick={() => handleSelectWord(word)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  y: [0, -10, 0],
                }}
                exit={{ 
                  scale: 2, 
                  opacity: 0,
                  transition: { duration: 0.3 }
                }}
                transition={{
                  y: { repeat: Infinity, duration: 2 + Math.random() },
                }}
                whileHover={{ scale: 1.15 }}
              >
                {word.word}
                
                {/* Energy Trail */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-purple-400/30 blur-sm -z-10"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              </motion.button>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Word Indicator */}
      <AnimatePresence>
        {selectedWord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="bg-slate-900/90 border-2 border-yellow-400 rounded-xl px-8 py-4
              shadow-[0_0_30px_rgba(251,191,36,0.4)]">
              <p className="text-yellow-400 text-sm mb-2 text-center">Say this word to destroy it:</p>
              <p className="text-3xl font-bold text-white text-center">{selectedWord.word}</p>
              
              {isListening && (
                <div className="flex items-center justify-center gap-2 mt-3 text-emerald-400">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  >
                    <Mic className="h-5 w-5" />
                  </motion.div>
                  <span className="text-sm">Listening...</span>
                  {spokenText && (
                    <span className="text-xs text-slate-400">"{spokenText}"</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Display */}
      <div className="absolute top-32 right-8 pointer-events-auto">
        <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Shield className="h-5 w-5" />
            <span className="font-bold">Destroyed: {wordsDestroyed}</span>
          </div>
          <div className="text-red-400 text-sm">
            Missed: {wordsMissed}
          </div>
          <div className="text-slate-400 text-xs mt-2">
            Remaining: {barrageWords.filter(w => !w.destroyed).length}
          </div>
        </div>
      </div>
    </div>
  );
};
