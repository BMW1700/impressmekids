import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Droplet, Eye } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface InkWord {
  id: string;
  word: string;
  obscureLevel: number; // 0-3, higher = more obscured
  revealed: boolean;
  failed: boolean;
  selected: boolean;
}

interface RPGInkSplashProps {
  words: string[];
  onComplete: (wordsRevealed: number, wordsFailed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

// Obscure word by replacing some characters with ink blots
const obscureWord = (word: string, level: number): string => {
  if (level === 0) return word;
  const chars = word.split('');
  const indicesToObscure: number[] = [];
  
  // Determine how many characters to obscure
  const obscureCount = Math.min(Math.ceil(chars.length * (level * 0.25)), chars.length - 1);
  
  while (indicesToObscure.length < obscureCount) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    if (!indicesToObscure.includes(randomIndex)) {
      indicesToObscure.push(randomIndex);
    }
  }
  
  return chars.map((char, i) => indicesToObscure.includes(i) ? '█' : char).join('');
};

export const RPGInkSplash = ({
  words,
  onComplete,
  onWordHit,
}: RPGInkSplashProps) => {
  const [inkWords, setInkWords] = useState<InkWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsRevealed, setWordsRevealed] = useState(0);
  const [wordsFailed, setWordsFailed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(40);
  const recognitionRef = useRef<any>(null);
  const revealedRef = useRef(0);
  const failedRef = useRef(0);
  const completedCountRef = useRef(0); // Track completion to avoid stale closure issues

  // Initialize ink words with varying obscure levels
  useEffect(() => {
    const initialWords: InkWord[] = words.slice(0, 8).map((word, index) => ({
      id: `ink-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      obscureLevel: 1 + (index % 3), // Vary between 1-3
      revealed: false,
      failed: false,
      selected: false,
    }));
    setInkWords(initialWords);
  }, [words]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false);
          setTimeout(() => {
            onComplete(revealedRef.current, failedRef.current);
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete]);

  const resetListeningState = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setSpokenText("");
    setInkWords(prev => prev.map(w => ({ ...w, selected: false })));
  }, []);

  const handleSelectWord = useCallback((inkWord: InkWord, index: number) => {
    if (inkWord.revealed || inkWord.failed) return;
    
    resetListeningState();
    
    setCurrentWordIndex(index);
    setInkWords(prev => prev.map((w, i) => ({ ...w, selected: i === index })));
    startListening(inkWord);
  }, [resetListeningState]);

  const startListening = useCallback((inkWord: InkWord) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      resetListeningState();
      return;
    }

    const lockedWord = inkWord;

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
        const targetWord = lockedWord.word;
        let matched = false;
        
        for (let i = 0; i < result.length && !matched; i++) {
          const alt = result[i]?.transcript?.trim().toLowerCase() || '';
          const altWords = alt.split(/\s+/);
          for (const spoken of altWords) {
            if (isWordMatchLenient(spoken, targetWord)) {
              matched = true;
              break;
            }
          }
        }

        if (matched) {
          soundEffects.correctWord();
          revealedRef.current += 1;
          setWordsRevealed(revealedRef.current);
          setInkWords(prev => 
            prev.map(w => w.id === lockedWord.id ? { ...w, revealed: true, selected: false } : w)
          );
        } else {
          soundEffects.incorrectWord();
          onWordHit(18);
          failedRef.current += 1;
          setWordsFailed(failedRef.current);
          setInkWords(prev => 
            prev.map(w => w.id === lockedWord.id ? { ...w, failed: true, selected: false } : w)
          );
        }

        resetListeningState();
        
        // Increment completed count (using ref to avoid stale closure)
        completedCountRef.current += 1;
        
        // Check completion using ref instead of stale state
        setTimeout(() => {
          const totalWords = 8; // Always 8 words (line 62: words.slice(0, 8))
          if (completedCountRef.current >= totalWords) {
            setIsActive(false);
            setTimeout(() => {
              onComplete(revealedRef.current, failedRef.current);
            }, 500);
          }
        }, 300);
      }
    };

    recognition.onerror = () => resetListeningState();
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { resetListeningState(); }
  }, [inkWords, onComplete, onWordHit, resetListeningState]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const currentWord = inkWords[currentWordIndex];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Underwater/ink overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-b from-indigo-950/95 via-purple-950/90 to-slate-950/95"
      />
      
      {/* Ink blot effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-black/40"
            style={{
              width: 50 + Math.random() * 100,
              height: 50 + Math.random() * 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(20px)',
            }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(99,102,241,0.6)] border border-indigo-400/50">
          <div className="flex items-center gap-3 text-white">
            <Droplet className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">INK SPLASH! Read through the ink!</span>
            <Droplet className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Timer */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50">
        <div className={`text-3xl font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {timeLeft}s
        </div>
      </div>

      {/* Word cards with ink */}
      <div className="absolute inset-x-4 top-40 flex flex-wrap justify-center gap-4 pointer-events-auto">
        {inkWords.map((word, index) => (
          <motion.button
            key={word.id}
            onClick={() => handleSelectWord(word, index)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: word.selected ? 1.1 : 1,
              opacity: word.revealed ? 0.5 : word.failed ? 0.3 : 1,
            }}
            className={`relative px-6 py-4 rounded-xl border-2 cursor-pointer transition-all ${
              word.revealed 
                ? 'bg-emerald-900/80 border-emerald-400' 
                : word.failed 
                  ? 'bg-red-900/80 border-red-400' 
                  : word.selected
                    ? 'bg-indigo-800/80 border-yellow-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]'
                    : 'bg-slate-800/80 border-indigo-600 hover:border-indigo-400'
            }`}
          >
            {/* Obscured word */}
            <p className={`text-2xl font-bold font-mono tracking-wider ${
              word.revealed ? 'text-emerald-300' : word.failed ? 'text-red-300' : 'text-white'
            }`}>
              {word.revealed ? word.word : obscureWord(word.word, word.obscureLevel)}
            </p>
            
            {/* Difficulty indicator */}
            <div className="flex justify-center gap-1 mt-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < word.obscureLevel ? 'bg-purple-400' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
            
            {/* Ink drip effect on unselected */}
            {!word.revealed && !word.failed && !word.selected && (
              <motion.div
                className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
                style={{ filter: 'blur(2px)' }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-8 bg-black/30 rounded-b-full"
                    style={{
                      left: `${20 + i * 30}%`,
                      top: -8,
                    }}
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                  />
                ))}
              </motion.div>
            )}
            
            {word.revealed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <Eye className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Current word panel */}
      {currentWord && currentWord.selected && !currentWord.revealed && !currentWord.failed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto"
        >
          <div className="bg-slate-900/95 border-2 border-indigo-400 rounded-xl px-10 py-5
            shadow-[0_0_40px_rgba(99,102,241,0.5)]">
            <p className="text-indigo-400 text-sm mb-2 text-center font-medium">
              What word is hidden? Look carefully:
            </p>
            <p className="text-4xl font-black text-white text-center font-mono tracking-wider">
              {obscureWord(currentWord.word, currentWord.obscureLevel)}
            </p>
            
            {isListening && (
              <div className="flex items-center justify-center gap-3 mt-4 text-emerald-400">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>
                  <Mic className="h-6 w-6" />
                </motion.div>
                <span className="font-medium">Listening...</span>
              </div>
            )}
            
            {spokenText && (
              <p className="text-center text-slate-400 text-sm mt-2">
                Heard: "<span className="text-white">{spokenText}</span>"
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Score */}
      <div className="absolute top-28 right-6 pointer-events-auto">
        <div className="bg-slate-900/90 rounded-lg p-4 border border-indigo-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Eye className="h-5 w-5 text-indigo-400" />
            <span className="font-bold text-lg">{wordsRevealed}</span>
            <span className="text-sm text-slate-400">revealed</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Lost: {wordsFailed}
          </div>
        </div>
      </div>
    </div>
  );
};
