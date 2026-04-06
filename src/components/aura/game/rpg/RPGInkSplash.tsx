import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Droplet, Eye, FileSearch } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface InkWord {
  id: string;
  word: string;
  obscureLevel: number;
  revealed: boolean;
  failed: boolean;
  active: boolean;
}

interface RPGInkSplashProps {
  words: string[];
  onComplete: (wordsRevealed: number, wordsFailed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

const obscureWord = (word: string, level: number): string => {
  if (level === 0) return word;
  const chars = word.split('');
  const indicesToObscure: number[] = [];
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
  const [isMicActive, setIsMicActive] = useState(false);
  const [wordsRevealed, setWordsRevealed] = useState(0);
  const [wordsFailed, setWordsFailed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(40);
  const [spokenText, setSpokenText] = useState("");

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const revealedRef = useRef(0);
  const failedRef = useRef(0);
  const inkWordsRef = useRef<InkWord[]>([]);
  const isActiveRef = useRef(true);

  // Initialize ink words
  useEffect(() => {
    const initialWords: InkWord[] = words.slice(0, 8).map((word, index) => ({
      id: `ink-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      obscureLevel: 1 + (index % 3),
      revealed: false,
      failed: false,
      active: index === 0, // First word auto-selected
    }));
    setInkWords(initialWords);
    inkWordsRef.current = initialWords;
  }, [words]);

  // Countdown timer - game ONLY ends when timer expires
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          isActiveRef.current = false;
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

  // Auto-advance to next unprocessed word
  const advanceToNextWord = useCallback(() => {
    const current = inkWordsRef.current;
    const nextIndex = current.findIndex(w => !w.revealed && !w.failed);
    if (nextIndex >= 0) {
      const updated = current.map((w, i) => ({ ...w, active: i === nextIndex }));
      setInkWords(updated);
      inkWordsRef.current = updated;
    }
  }, []);

  // Continuous speech recognition (like Fireball Barrage pattern)
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 5;
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.toLowerCase().trim();
          setSpokenText(transcript);

          // Find the currently active word
          const activeWord = inkWordsRef.current.find(w => w.active && !w.revealed && !w.failed);
          if (!activeWord) continue;

          const targetWord = activeWord.word.toLowerCase();

          // Check all alternatives for a match
          let matched = false;
          for (let alt = 0; alt < result.length && !matched; alt++) {
            const altText = result[alt]?.transcript?.toLowerCase().trim() || '';
            const spokenWords = altText.split(/\s+/);

            for (const spoken of spokenWords) {
              if (isWordMatchLenient(spoken, targetWord)) {
                matched = true;
                break;
              }
            }
          }

          if (result.isFinal) {
            if (matched) {
              soundEffects.correctWord();
              revealedRef.current += 1;
              setWordsRevealed(revealedRef.current);
              const updated = inkWordsRef.current.map(w =>
                w.id === activeWord.id ? { ...w, revealed: true, active: false } : w
              );
              setInkWords(updated);
              inkWordsRef.current = updated;
              // Auto-advance to next word
              setTimeout(() => advanceToNextWord(), 300);
            } else {
              soundEffects.incorrectWord();
              onWordHit(18);
              failedRef.current += 1;
              setWordsFailed(failedRef.current);
              const updated = inkWordsRef.current.map(w =>
                w.id === activeWord.id ? { ...w, failed: true, active: false } : w
              );
              setInkWords(updated);
              inkWordsRef.current = updated;
              // Auto-advance to next word
              setTimeout(() => advanceToNextWord(), 300);
            }
            setSpokenText("");
          }
        }
      };

      recognition.onerror = () => {
        if (isListeningRef.current && isActiveRef.current) {
          setTimeout(() => startListening(), 200);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && isActiveRef.current) {
          setTimeout(() => startListening(), 100);
        }
      };

      recognition.start();
    } catch {}
  }, [advanceToNextWord, onWordHit]);

  const startMic = useCallback(() => {
    setIsMicActive(true);
    isListeningRef.current = true;
    startListening();
  }, [startListening]);

  const stopMic = useCallback(() => {
    setIsMicActive(false);
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
  }, []);

  // Auto-start mic on mount
  useEffect(() => {
    const timer = setTimeout(() => startMic(), 500);
    return () => {
      clearTimeout(timer);
      stopMic();
    };
  }, []);

  // Allow tapping to manually select a word
  const handleSelectWord = useCallback((inkWord: InkWord, index: number) => {
    if (inkWord.revealed || inkWord.failed) return;
    const updated = inkWordsRef.current.map((w, i) => ({ ...w, active: i === index }));
    setInkWords(updated);
    inkWordsRef.current = updated;
  }, []);

  const activeWord = inkWords.find(w => w.active && !w.revealed && !w.failed);

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
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 + Math.random() * 2, delay: Math.random() * 2 }}
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
              scale: word.active ? 1.1 : 1,
              opacity: word.revealed ? 0.5 : word.failed ? 0.3 : 1,
            }}
            className={`relative px-6 py-4 rounded-xl border-2 cursor-pointer transition-all ${
              word.revealed
                ? 'bg-emerald-900/80 border-emerald-400'
                : word.failed
                  ? 'bg-red-900/80 border-red-400'
                  : word.active
                    ? 'bg-indigo-800/80 border-yellow-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]'
                    : 'bg-slate-800/80 border-indigo-600 hover:border-indigo-400'
            }`}
          >
            <p className={`text-2xl font-bold font-mono tracking-wider ${
              word.revealed ? 'text-emerald-300' : word.failed ? 'text-red-300' : 'text-white'
            }`}>
              {word.revealed ? word.word : obscureWord(word.word, word.obscureLevel)}
            </p>

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

            {!word.revealed && !word.failed && !word.active && (
              <motion.div
                className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
                style={{ filter: 'blur(2px)' }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-8 bg-black/30 rounded-b-full"
                    style={{ left: `${20 + i * 30}%`, top: -8 }}
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

      {/* Current active word prompt */}
      {activeWord && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto"
        >
          <div className="bg-slate-900/95 border-2 border-indigo-400 rounded-xl px-10 py-5
            shadow-[0_0_40px_rgba(99,102,241,0.5)]">
            <p className="text-indigo-400 text-sm mb-2 text-center font-medium">
              🎯 Say this word:
            </p>
            <p className="text-4xl font-black text-white text-center font-mono tracking-wider">
              {obscureWord(activeWord.word, activeWord.obscureLevel)}
            </p>

            {spokenText && (
              <p className="text-center text-slate-400 text-sm mt-2">
                Heard: "<span className="text-white">{spokenText}</span>"
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Mic control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <motion.div
          className={`p-5 rounded-full cursor-pointer ${
            isMicActive
              ? 'bg-indigo-600 shadow-[0_0_30px_rgba(99,102,241,0.6)]'
              : 'bg-slate-700'
          }`}
          animate={isMicActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          onClick={() => isMicActive ? stopMic() : startMic()}
        >
          <Mic className={`h-8 w-8 ${isMicActive ? 'text-white' : 'text-slate-400'}`} />
        </motion.div>
        {isMicActive && (
          <motion.p
            className="text-center text-indigo-300 mt-2 font-medium text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🎤 Listening...
          </motion.p>
        )}
      </div>

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
