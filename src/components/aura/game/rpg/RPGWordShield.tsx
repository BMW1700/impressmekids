import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Mic, Lock } from "lucide-react";
import { speechManager } from "@/lib/speechRecognitionManager";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface ShieldWord {
  id: number;
  word: string;
  spoken: boolean;
}

interface RPGWordShieldProps {
  words: string[];
  onComplete: (shieldStrength: number, damage: number) => void;
}

const sounds = new SoundEffects();

export const RPGWordShield = ({
  words,
  onComplete,
}: RPGWordShieldProps) => {
  const [shieldWords, setShieldWords] = useState<ShieldWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [shieldPower, setShieldPower] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [isListening, setIsListening] = useState(false);
  const [attackStarted, setAttackStarted] = useState(false);
  const [phase, setPhase] = useState<'building' | 'impact' | 'done'>('building');
  const [lastRecognized, setLastRecognized] = useState<string>('');
  
  // Use refs to avoid stale closures
  const isMountedRef = useRef(true);
  const currentWordIndexRef = useRef(0);
  const shieldWordsRef = useRef<ShieldWord[]>([]);
  const phaseRef = useRef<'building' | 'impact' | 'done'>('building');

  // Keep refs in sync with state
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  useEffect(() => {
    shieldWordsRef.current = shieldWords;
  }, [shieldWords]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Initialize words
  useEffect(() => {
    const initialWords = words.map((word, i) => ({ id: i, word, spoken: false }));
    setShieldWords(initialWords);
    shieldWordsRef.current = initialWords;
    
    // Play start sound
    sounds.miniGameStart();
    
    // Small delay before starting recognition
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        startListening();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [words]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'building') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          speechManager.stop('shield');
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
      setTimeout(() => {
        if (isMountedRef.current) {
          onComplete(shieldPower, damage);
        }
      }, 1500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [phase, shieldPower, onComplete]);

  // Start recognition using manager
  const startListening = useCallback(() => {
    speechManager.start({
      owner: 'shield',
      continuous: true,
      interimResults: true,
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
        if (!isMountedRef.current || phaseRef.current !== 'building') return;
        
        const spoken = transcript.toLowerCase().trim();
        setLastRecognized(spoken);
        const spokenWords = spoken.split(' ');
        
        spokenWords.forEach(spokenWord => {
          const cleanSpoken = spokenWord.replace(/[^a-z]/g, '');
          if (cleanSpoken.length < 2) return;
          
          const currentIdx = currentWordIndexRef.current;
          const words = shieldWordsRef.current;
          
          if (currentIdx < words.length) {
            const targetWord = words[currentIdx]?.word.toLowerCase().replace(/[^a-z]/g, '');
            
            // More lenient matching
            if (cleanSpoken === targetWord || 
                cleanSpoken.includes(targetWord) || 
                targetWord.includes(cleanSpoken) ||
                (cleanSpoken.length >= 3 && targetWord.startsWith(cleanSpoken.slice(0, 3)))) {
              // Word matched!
              sounds.correctWord();
              setShieldWords(prev => prev.map((w, idx) => 
                idx === currentIdx ? { ...w, spoken: true } : w
              ));
              setShieldPower(prev => Math.min(100, prev + Math.floor(100 / words.length)));
              setCurrentWordIndex(prev => prev + 1);
            }
          }
        });
      },
      onError: (error) => {
        console.log('[WordShield] Recognition error:', error);
      },
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      speechManager.abort('shield');
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {/* Background with dramatic gradient */}
      {(() => { const t = getMinigameTheme('wordShield'); const agent = isAgentMode(); return (
      <>
      <motion.div
        className={`absolute inset-0 bg-gradient-to-b ${t.bgGradient}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Animated energy particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 ${agent ? 'bg-teal-400' : 'bg-cyan-400'} rounded-full`}
          style={{ left: `${10 + Math.random() * 80}%`, top: `${Math.random() * 100}%` }}
          animate={{
            y: [0, -50, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Header */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className={`px-8 py-3 bg-gradient-to-r ${t.accentGradient} rounded-xl border-2 ${t.accentColor} shadow-lg`}>
          <span className="text-white font-black text-xl flex items-center gap-3">
            {agent ? <Lock className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
            {t.title}
            {agent ? <Lock className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
          </span>
        </div>
      </motion.div>
      </>
      ); })()}

      {/* Large central timer */}
      <motion.div
        className="absolute top-20 left-1/2 -translate-x-1/2 z-50"
        animate={timeLeft <= 3 ? { scale: [1, 1.3, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.3 }}
      >
        <div className={`text-8xl font-black drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] ${
          timeLeft <= 3 ? 'text-red-400' : timeLeft <= 5 ? 'text-yellow-400' : 'text-white'
        }`}>
          {timeLeft}
        </div>
      </motion.div>

      {/* Shield visualization - centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
        <motion.div
          className="relative w-48 h-56"
          animate={{ 
            scale: [1, 1.02, 1],
            rotate: [0, 1, -1, 0]
          }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          {/* Shield glow */}
          <motion.div
            className="absolute inset-0 bg-cyan-400/30 rounded-t-full rounded-b-[50%] blur-xl"
            style={{ transform: 'scale(1.3)' }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          
          {/* Shield base */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-600 to-blue-800 rounded-t-full rounded-b-[50%]
              border-4 border-cyan-300 shadow-[0_0_40px_rgba(59,130,246,0.7)] overflow-hidden"
          >
            {/* Shield power fill with animation */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-300 via-cyan-400 to-blue-400 rounded-b-[50%]"
              initial={{ height: '0%' }}
              animate={{ height: `${shieldPower}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              {/* Shimmer effect on fill */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />
            </motion.div>
            
            {/* Shield emblem */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-16 h-16 text-white/90 drop-shadow-lg" />
            </div>
          </div>

          {/* Power percentage display */}
          <motion.div 
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center"
            animate={{ scale: shieldPower > 0 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className={`text-4xl font-black ${
              shieldPower >= 75 ? 'text-emerald-400' : 
              shieldPower >= 50 ? 'text-cyan-300' : 
              shieldPower >= 25 ? 'text-yellow-400' : 'text-white'
            }`}>
              {shieldPower}%
            </span>
            <p className="text-sm text-cyan-300/80 mt-1">Shield Power</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Incoming attack indicator - right side */}
      <motion.div
        className="absolute right-8 top-1/2 -translate-y-1/2 z-40"
        animate={!attackStarted ? { x: [0, -30, 0] } : { x: -400, scale: 3 }}
        transition={!attackStarted ? { repeat: Infinity, duration: 0.8 } : { duration: 0.6 }}
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-yellow-400/60 rounded-full blur-2xl"
            style={{ transform: 'scale(2)' }}
            animate={{ scale: [1.5, 2.5, 1.5], opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.4 }}
          />
          <Zap className="w-24 h-24 text-yellow-400 relative z-10" />
        </div>
        {!attackStarted && (
          <motion.p 
            className="text-yellow-300 font-black text-lg text-center mt-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            INCOMING!
          </motion.p>
        )}
      </motion.div>

      {/* Current word to speak - prominent display */}
      {phase === 'building' && currentWordIndex < shieldWords.length && (
        <motion.div
          className="absolute bottom-44 left-1/2 -translate-x-1/2 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          key={currentWordIndex}
        >
          <motion.div 
            className="px-12 py-6 bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900 rounded-2xl border-4 border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.6)]"
            animate={{ 
              boxShadow: [
                '0 0 40px rgba(34,211,238,0.6)',
                '0 0 60px rgba(34,211,238,0.9)',
                '0 0 40px rgba(34,211,238,0.6)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <p className="text-cyan-300 text-sm mb-2 text-center">🎤 Speak now:</p>
            <p className="text-6xl font-black text-white text-center tracking-wide">
              {shieldWords[currentWordIndex]?.word}
            </p>
            
            {/* Listening indicator */}
            <motion.div 
              className="mt-4 flex items-center justify-center gap-3"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Mic className={`w-5 h-5 ${isListening ? 'text-emerald-400' : 'text-red-400'}`} />
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-6 bg-cyan-400 rounded-full"
                    animate={{ scaleY: isListening ? [0.3, 1, 0.3] : 0.3 }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <span className={`text-sm font-bold ${isListening ? 'text-emerald-400' : 'text-red-400'}`}>
                {isListening ? 'Listening...' : 'Starting...'}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Words progress bar at bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-8">
        <div className="flex justify-center gap-3">
          {shieldWords.map((word, idx) => (
            <motion.div
              key={word.id}
              className={`px-4 py-2 rounded-xl border-2 transition-all ${
                word.spoken 
                  ? 'bg-emerald-500/80 border-emerald-300 scale-90' 
                  : idx === currentWordIndex
                    ? 'bg-blue-600/90 border-yellow-400 scale-110 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
                    : 'bg-slate-700/60 border-slate-500'
              }`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <span className={`font-bold ${
                word.spoken ? 'text-emerald-200 line-through' : 
                idx === currentWordIndex ? 'text-yellow-300' : 'text-white/70'
              }`}>
                {word.word}
              </span>
            </motion.div>
          ))}
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 h-2 bg-slate-800/80 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentWordIndex / shieldWords.length) * 100}%` }}
            transition={{ type: 'spring' }}
          />
        </div>
      </div>

      {/* Impact result */}
      <AnimatePresence>
        {phase === 'impact' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Flash effect */}
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
            
            <motion.div
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
            >
              {(() => { const t = getMinigameTheme('wordShield'); return (
              <div className={`text-5xl font-black ${shieldPower >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                {shieldPower >= 80 
                  ? t.successMsg
                  : shieldPower >= 50 
                    ? (isAgentMode() ? '🔒 Firewall Held!' : '🛡️ Shield Held!')
                    : t.failMsg}
              </div>
              ); })()}
              <div className="text-2xl text-white mt-4">
                {shieldPower >= 50 
                  ? `Blocked ${shieldPower}% of damage!` 
                  : 'You take full damage!'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};