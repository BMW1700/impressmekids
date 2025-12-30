import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface ComboWord {
  id: number;
  word: string;
  spoken: boolean;
  current: boolean;
}

interface RPGSpellComboProps {
  words: string[];
  onComplete: (success: boolean, comboMultiplier: number) => void;
}

export const RPGSpellCombo = ({
  words,
  onComplete,
}: RPGSpellComboProps) => {
  const [comboWords, setComboWords] = useState<ComboWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'casting' | 'success' | 'failed'>('ready');
  const [isListening, setIsListening] = useState(false);
  const [comboProgress, setComboProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize combo words
  useEffect(() => {
    const limitedWords = words.slice(0, 5); // Max 5 words for combo
    setComboWords(limitedWords.map((word, i) => ({
      id: i,
      word,
      spoken: false,
      current: i === 0,
    })));
    
    setTimeout(() => {
      setPhase('casting');
      startListening();
    }, 1500);
  }, [words]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'casting') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase('failed');
          recognitionRef.current?.stop();
          setTimeout(() => onComplete(false, 1), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, onComplete]);

  // Check for completion
  useEffect(() => {
    if (phase !== 'casting') return;
    
    const allSpoken = comboWords.every(w => w.spoken);
    if (allSpoken && comboWords.length > 0) {
      setPhase('success');
      recognitionRef.current?.stop();
      const multiplier = Math.min(5, comboWords.length);
      setTimeout(() => onComplete(true, multiplier), 2500);
    }
  }, [comboWords, phase, onComplete]);

  // Start speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => {
      if (phase === 'casting') {
        recognitionRef.current?.start();
      }
    };

    recognitionRef.current.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const spoken = event.results[i][0].transcript.toLowerCase().trim();
        const spokenWords = spoken.split(' ');
        
        spokenWords.forEach(spokenWord => {
          if (currentIndex < comboWords.length) {
            const targetWord = comboWords[currentIndex]?.word.toLowerCase().replace(/[^a-z]/g, '');
            if (spokenWord.includes(targetWord) || targetWord.includes(spokenWord)) {
              // Word matched!
              setComboWords(prev => prev.map((w, idx) => ({
                ...w,
                spoken: idx <= currentIndex ? true : w.spoken,
                current: idx === currentIndex + 1,
              })));
              setComboProgress(prev => prev + (100 / comboWords.length));
              setCurrentIndex(prev => prev + 1);
            }
          }
        });
      }
    };

    recognitionRef.current.onerror = () => {};
    recognitionRef.current.start();
  }, [currentIndex, comboWords, phase]);

  // Cleanup
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {/* Magical background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-purple-950/80 via-indigo-900/70 to-purple-900/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Magic particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 1, 0.3],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          ✦
        </motion.div>
      ))}

      {/* Title */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="px-6 py-2 bg-purple-600/90 rounded-lg border-2 border-yellow-400">
          <span className="text-white font-black text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            SPELL COMBO
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </span>
        </div>
      </motion.div>

      {/* Timer */}
      {phase === 'casting' && (
        <motion.div
          className="absolute top-16 left-1/2 -translate-x-1/2 z-50"
          animate={timeLeft <= 5 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          <div className={`text-4xl font-black ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
            {timeLeft}s
          </div>
        </motion.div>
      )}

      {/* Combo chain visualization */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-2">
          {comboWords.map((word, idx) => (
            <div key={word.id} className="flex items-center">
              {/* Word orb */}
              <motion.div
                className={`relative w-20 h-20 rounded-full flex items-center justify-center
                  ${word.spoken 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-600' 
                    : word.current
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-600'
                      : 'bg-gradient-to-br from-slate-600 to-slate-800'}
                  border-2 ${word.current ? 'border-yellow-300' : word.spoken ? 'border-emerald-300' : 'border-slate-500'}
                  shadow-lg`}
                animate={word.current ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <span className="text-white font-bold text-sm text-center px-1">
                  {word.word}
                </span>
                
                {/* Sparkle on success */}
                {word.spoken && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="absolute inset-0 bg-emerald-400/50 rounded-full" />
                  </motion.div>
                )}
              </motion.div>

              {/* Chain link */}
              {idx < comboWords.length - 1 && (
                <motion.div
                  className={`w-8 h-1 rounded-full ${
                    word.spoken ? 'bg-gradient-to-r from-emerald-400 to-yellow-400' : 'bg-slate-600'
                  }`}
                  animate={word.spoken ? { boxShadow: ['0 0 5px #fbbf24', '0 0 15px #fbbf24', '0 0 5px #fbbf24'] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Combo progress bar */}
        <div className="mt-8 w-full max-w-md mx-auto">
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-purple-500">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"
              style={{ width: `${comboProgress}%` }}
              transition={{ type: 'spring' }}
            />
          </div>
          <p className="text-center text-purple-300 mt-2 font-bold">
            Combo: {comboWords.filter(w => w.spoken).length} / {comboWords.length}
          </p>
        </div>
      </div>

      {/* Current word prompt */}
      {phase === 'casting' && currentIndex < comboWords.length && (
        <motion.div
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          <div className="px-10 py-5 bg-purple-900/95 rounded-xl border-2 border-yellow-400 shadow-2xl">
            <p className="text-yellow-300 text-sm mb-1">Speak the spell:</p>
            <p className="text-5xl font-black text-white">{comboWords[currentIndex]?.word}</p>
            {isListening && (
              <motion.div 
                className="mt-3 flex items-center justify-center gap-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <span className="text-yellow-400">Casting...</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Success/Failure state */}
      <AnimatePresence>
        {(phase === 'success' || phase === 'failed') && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
            >
              {phase === 'success' ? (
                <>
                  <div className="text-6xl mb-4">✨⚡✨</div>
                  <div className="text-4xl font-black text-yellow-400">
                    COMBO COMPLETE!
                  </div>
                  <div className="text-2xl text-emerald-400 mt-2">
                    {comboWords.length}x DAMAGE MULTIPLIER!
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">💔</div>
                  <div className="text-4xl font-black text-red-400">
                    COMBO BROKEN
                  </div>
                  <div className="text-xl text-slate-300 mt-2">
                    Normal damage only
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ready phase */}
      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Zap className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              <div className="text-3xl font-black text-white">
                Prepare to cast!
              </div>
              <div className="text-xl text-purple-300 mt-2">
                Speak all {words.slice(0, 5).length} words in order!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
