import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface ShieldWord {
  id: number;
  word: string;
  spoken: boolean;
}

interface RPGWordShieldProps {
  words: string[];
  onComplete: (shieldStrength: number, damage: number) => void;
}

export const RPGWordShield = ({
  words,
  onComplete,
}: RPGWordShieldProps) => {
  const [shieldWords, setShieldWords] = useState<ShieldWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [shieldPower, setShieldPower] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isListening, setIsListening] = useState(false);
  const [attackStarted, setAttackStarted] = useState(false);
  const [phase, setPhase] = useState<'building' | 'impact' | 'done'>('building');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize words
  useEffect(() => {
    setShieldWords(words.map((word, i) => ({ id: i, word, spoken: false })));
    startListening();
  }, [words]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'building') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setAttackStarted(true);
          setPhase('impact');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Handle attack impact
  useEffect(() => {
    if (phase !== 'impact') return;
    
    const timer = setTimeout(() => {
      const damage = Math.max(0, 30 - Math.floor(shieldPower * 0.3));
      setPhase('done');
      setTimeout(() => onComplete(shieldPower, damage), 1500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [phase, shieldPower, onComplete]);

  // Start continuous speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => {
      if (phase === 'building') {
        recognitionRef.current?.start();
      }
    };

    recognitionRef.current.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const spoken = event.results[i][0].transcript.toLowerCase().trim();
        const words = spoken.split(' ');
        
        // Check each spoken word against current target
        words.forEach(spokenWord => {
          if (currentWordIndex < shieldWords.length) {
            const targetWord = shieldWords[currentWordIndex]?.word.toLowerCase().replace(/[^a-z]/g, '');
            if (spokenWord.includes(targetWord) || targetWord.includes(spokenWord)) {
              // Word matched!
              setShieldWords(prev => prev.map((w, idx) => 
                idx === currentWordIndex ? { ...w, spoken: true } : w
              ));
              setShieldPower(prev => prev + 15);
              setCurrentWordIndex(prev => prev + 1);
            }
          }
        });
      }
    };

    recognitionRef.current.onerror = () => {};

    recognitionRef.current.start();
  }, [currentWordIndex, shieldWords, phase]);

  // Cleanup
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {/* Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-slate-900/70 to-blue-900/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Warning */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="px-6 py-2 bg-blue-600/90 rounded-lg border-2 border-blue-300">
          <span className="text-white font-black text-lg">🛡️ BUILD YOUR SHIELD! 🛡️</span>
        </div>
      </motion.div>

      {/* Timer */}
      <motion.div
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50"
        animate={timeLeft <= 3 ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        <div className={`text-6xl font-black ${timeLeft <= 3 ? 'text-red-400' : 'text-white'}`}>
          {timeLeft}
        </div>
      </motion.div>

      {/* Shield visualization */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 z-40">
        <motion.div
          className="relative w-32 h-40"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {/* Shield base */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-700 rounded-t-full rounded-b-[50%]
              border-4 border-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.6)]"
          >
            {/* Shield power fill */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-300 to-blue-400 rounded-b-[50%]"
              style={{ height: `${shieldPower}%` }}
              transition={{ type: 'spring' }}
            />
            
            {/* Shield emblem */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-12 h-12 text-white/80" />
            </div>
          </div>

          {/* Power percentage */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <span className="text-2xl font-black text-cyan-300">{shieldPower}%</span>
          </div>
        </motion.div>
      </div>

      {/* Incoming attack indicator */}
      <motion.div
        className="absolute right-10 top-1/2 -translate-y-1/2 z-40"
        animate={!attackStarted ? { x: [0, -20, 0] } : { x: -300, scale: 2 }}
        transition={!attackStarted ? { repeat: Infinity, duration: 1 } : { duration: 0.5 }}
      >
        <div className="relative">
          <Zap className="w-20 h-20 text-yellow-400" />
          <motion.div
            className="absolute inset-0 bg-yellow-400/50 rounded-full blur-xl"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
        </div>
        {!attackStarted && (
          <p className="text-yellow-300 font-bold text-center mt-2">INCOMING!</p>
        )}
      </motion.div>

      {/* Words to speak */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50">
        <div className="flex flex-wrap gap-3 justify-center max-w-xl">
          {shieldWords.map((word, idx) => (
            <motion.div
              key={word.id}
              className={`px-4 py-2 rounded-lg border-2 ${
                word.spoken 
                  ? 'bg-emerald-600/80 border-emerald-400 scale-90' 
                  : idx === currentWordIndex
                    ? 'bg-blue-600/80 border-yellow-400 scale-110'
                    : 'bg-slate-700/80 border-slate-500'
              }`}
              animate={idx === currentWordIndex ? { y: [0, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <span className={`font-bold ${word.spoken ? 'text-emerald-200 line-through' : 'text-white'}`}>
                {word.word}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Current word to speak */}
      {phase === 'building' && currentWordIndex < shieldWords.length && (
        <motion.div
          className="absolute bottom-48 left-1/2 -translate-x-1/2 z-50"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          <div className="px-8 py-4 bg-blue-900/95 rounded-xl border-2 border-cyan-400 shadow-2xl">
            <p className="text-cyan-300 text-sm mb-1">Speak now:</p>
            <p className="text-4xl font-black text-white">{shieldWords[currentWordIndex]?.word}</p>
            {isListening && (
              <motion.div 
                className="mt-2 flex items-center justify-center gap-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span className="text-cyan-400 text-sm">Listening...</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Impact result */}
      <AnimatePresence>
        {phase === 'impact' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-4xl font-black text-center"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
            >
              <div className={shieldPower >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                {shieldPower >= 80 
                  ? '✨ PERFECT SHIELD! ✨' 
                  : shieldPower >= 50 
                    ? '🛡️ Shield held!' 
                    : '💥 Shield cracked!'}
              </div>
              <div className="text-xl text-white mt-2">
                {shieldPower >= 50 ? 'Minimal damage!' : 'You take damage!'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
