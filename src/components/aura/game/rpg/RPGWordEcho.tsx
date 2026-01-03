import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, Repeat } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface EchoWord {
  id: string;
  word: string;
  echosNeeded: number;
  echosSpoken: number;
  completed: boolean;
  failed: boolean;
}

interface RPGWordEchoProps {
  words: string[];
  onComplete: (wordsCompleted: number, wordsFailed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGWordEcho = ({
  words,
  onComplete,
  onWordHit,
}: RPGWordEchoProps) => {
  const [echoWords, setEchoWords] = useState<EchoWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [wordsFailed, setWordsFailed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const recognitionRef = useRef<any>(null);
  const completedRef = useRef(0);
  const failedRef = useRef(0);

  // Initialize echo words - each word needs to be spoken twice
  useEffect(() => {
    const initialWords: EchoWord[] = words.slice(0, 6).map((word, index) => ({
      id: `echo-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      echosNeeded: 2,
      echosSpoken: 0,
      completed: false,
      failed: false,
    }));
    setEchoWords(initialWords);
  }, [words]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false);
          setTimeout(() => {
            onComplete(completedRef.current, failedRef.current);
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete]);

  // Auto-start listening for current word
  useEffect(() => {
    if (isActive && currentWordIndex < echoWords.length && !isListening) {
      const currentWord = echoWords[currentWordIndex];
      if (currentWord && !currentWord.completed && !currentWord.failed) {
        startListening();
      }
    }
  }, [currentWordIndex, echoWords, isActive, isListening]);

  const resetListeningState = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setSpokenText("");
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    
    unlockSpeechSynthesis();
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

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
        const currentWord = echoWords[currentWordIndex];
        if (!currentWord) return;
        
        const targetWord = currentWord.word;
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
          
          setEchoWords(prev => prev.map((w, i) => {
            if (i === currentWordIndex) {
              const newEchosSpoken = w.echosSpoken + 1;
              if (newEchosSpoken >= w.echosNeeded) {
                completedRef.current += 1;
                setWordsCompleted(completedRef.current);
                return { ...w, echosSpoken: newEchosSpoken, completed: true };
              }
              return { ...w, echosSpoken: newEchosSpoken };
            }
            return w;
          }));
        } else {
          soundEffects.incorrectWord();
          onWordHit(15);
          failedRef.current += 1;
          setWordsFailed(failedRef.current);
          
          setEchoWords(prev => prev.map((w, i) => 
            i === currentWordIndex ? { ...w, failed: true } : w
          ));
        }

        resetListeningState();
        
        // Check if current word is done (completed or failed)
        setTimeout(() => {
          setEchoWords(prev => {
            const current = prev[currentWordIndex];
            if (current?.completed || current?.failed) {
              const nextIndex = currentWordIndex + 1;
              if (nextIndex >= prev.length) {
                setIsActive(false);
                setTimeout(() => {
                  onComplete(completedRef.current, failedRef.current);
                }, 500);
              } else {
                setCurrentWordIndex(nextIndex);
              }
            }
            return prev;
          });
        }, 300);
      }
    };

    recognition.onerror = () => resetListeningState();
    recognition.onend = () => {
      if (isListening) {
        setTimeout(() => startListening(), 200);
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { resetListeningState(); }
  }, [currentWordIndex, echoWords, isListening, onComplete, onWordHit, resetListeningState]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const currentWord = echoWords[currentWordIndex];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Cave overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-b from-stone-900/90 via-amber-950/80 to-stone-950/95"
      />
      
      {/* Echo wave effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/30"
            style={{
              width: 100 + i * 80,
              height: 100 + i * 80,
            }}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2 + i * 0.5,
              delay: i * 0.3,
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
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(245,158,11,0.6)] border border-amber-400/50">
          <div className="flex items-center gap-3 text-white">
            <Repeat className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">WORD ECHO! Say each word TWICE!</span>
            <Repeat className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Timer */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50">
        <div className={`text-3xl font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {timeLeft}s
        </div>
      </div>

      {/* Word cards */}
      <div className="absolute inset-x-4 top-40 flex flex-wrap justify-center gap-3 pointer-events-auto">
        {echoWords.map((word, index) => (
          <motion.div
            key={word.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: index === currentWordIndex ? 1.1 : 1,
              opacity: word.completed ? 0.5 : word.failed ? 0.3 : 1,
            }}
            className={`relative px-6 py-4 rounded-xl border-2 ${
              word.completed 
                ? 'bg-emerald-900/80 border-emerald-400' 
                : word.failed 
                  ? 'bg-red-900/80 border-red-400' 
                  : index === currentWordIndex
                    ? 'bg-amber-900/80 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                    : 'bg-stone-800/80 border-stone-600'
            }`}
          >
            <p className="text-2xl font-bold text-white">{word.word}</p>
            
            {/* Echo progress */}
            <div className="flex justify-center gap-2 mt-2">
              {[...Array(word.echosNeeded)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < word.echosSpoken ? 'bg-amber-400' : 'bg-stone-600'
                  }`}
                />
              ))}
            </div>
            
            {word.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-lg">✓</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Current word panel */}
      {currentWord && !currentWord.completed && !currentWord.failed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto"
        >
          <div className="bg-slate-900/95 border-2 border-amber-400 rounded-xl px-10 py-5
            shadow-[0_0_40px_rgba(245,158,11,0.5)]">
            <p className="text-amber-400 text-sm mb-2 text-center font-medium">
              Echo {currentWord.echosSpoken + 1} of {currentWord.echosNeeded}:
            </p>
            <p className="text-4xl font-black text-white text-center">{currentWord.word}</p>
            
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
        <div className="bg-slate-900/90 rounded-lg p-4 border border-amber-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Volume2 className="h-5 w-5 text-amber-400" />
            <span className="font-bold text-lg">{wordsCompleted}</span>
            <span className="text-sm text-slate-400">echoed</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Failed: {wordsFailed}
          </div>
        </div>
      </div>
    </div>
  );
};
