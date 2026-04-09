import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Flame, Crosshair } from "lucide-react";
import { SoundEffects } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

const agentMode = isAgentMode();
const theme = getMinigameTheme('fireballBarrage');

interface Fireball {
  id: string;
  word: string;
  x: number;
  y: number;
  speed: number;
  destroyed: boolean;
  scale: number;
}

interface RPGFireballBarrageProps {
  words: string[];
  onComplete: (wordsDestroyed: number, wordsMissed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGFireballBarrage = ({
  words,
  onComplete,
  onWordHit,
}: RPGFireballBarrageProps) => {
  const [fireballs, setFireballs] = useState<Fireball[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [wordsDestroyed, setWordsDestroyed] = useState(0);
  const [wordsMissed, setWordsMissed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [nextTargetWord, setNextTargetWord] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);
  const fireballsRef = useRef<Fireball[]>([]);
  const isActiveRef = useRef(true);

  // Initialize fireballs
  useEffect(() => {
    const initialFireballs: Fireball[] = words.map((word, index) => ({
      id: `fireball-${index}`,
      word: word.replace(/[^a-zA-Z']/g, '').toLowerCase(),
      x: -10 - (index * 8),
      y: 25 + (index % 4) * 15,
      speed: 0.08 + Math.random() * 0.05,
      destroyed: false,
      scale: 0.8 + Math.random() * 0.4,
    }));
    setFireballs(initialFireballs);
    fireballsRef.current = initialFireballs;
    
    // Set first target word
    if (initialFireballs.length > 0) {
      setNextTargetWord(initialFireballs[0].word);
    }
  }, [words]);

  // Animation loop
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      const current = fireballsRef.current;
      let anyMissed = false;
      
      const updated = current.map(f => {
        if (f.destroyed) return f;
        
        const newX = f.x + f.speed;
        
        if (newX >= 72) {
          if (!anyMissed) {
            anyMissed = true;
            onWordHit(20);
            soundEffects.incorrectWord();
            missedRef.current += 1;
            setWordsMissed(missedRef.current);
          }
          return { ...f, destroyed: true, x: newX };
        }
        
        return { ...f, x: newX };
      });
      
      fireballsRef.current = updated;
      setFireballs([...updated]);
      
      // Update next target word
      const nextActive = updated.find(f => !f.destroyed);
      if (nextActive) {
        setNextTargetWord(nextActive.word);
      }
      
      // Check completion
      const allDone = updated.every(f => f.destroyed);
      if (allDone && isActiveRef.current) {
        isActiveRef.current = false;
        setIsActive(false);
        setTimeout(() => {
          onComplete(destroyedRef.current, missedRef.current);
        }, 500);
      }
      
      if (isActiveRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, onComplete, onWordHit]);

  // Continuous speech recognition - FIX: match directly against ref, no nested setState
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
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          const spokenWords = transcript.split(/\s+/);

          // Match against ref (not inside setState) to avoid batching issues
          const currentFireballs = fireballsRef.current;
          const activeFireballs = currentFireballs.filter(f => !f.destroyed);

          for (const fireball of activeFireballs) {
            const targetWord = fireball.word.toLowerCase();

            for (const spoken of spokenWords) {
              const cleanSpoken = spoken.replace(/[^a-z']/g, '');

              if (cleanSpoken.length >= 1) {
                const startsWithMatch = targetWord.startsWith(cleanSpoken.slice(0, 2)) ||
                  cleanSpoken.startsWith(targetWord.slice(0, 2));
                const containsMatch = targetWord.includes(cleanSpoken) ||
                  cleanSpoken.includes(targetWord);
                const exactMatch = cleanSpoken === targetWord;

                if (exactMatch || startsWithMatch || containsMatch) {
                  // Directly mutate ref and sync to state
                  const updatedFireballs = fireballsRef.current.map(f =>
                    f.id === fireball.id ? { ...f, destroyed: true } : f
                  );
                  fireballsRef.current = updatedFireballs;
                  setFireballs([...updatedFireballs]);
                  destroyedRef.current += 1;
                  setWordsDestroyed(destroyedRef.current);
                  soundEffects.correctWord();
                  
                  // Update next target
                  const nextActive = updatedFireballs.find(f => !f.destroyed);
                  if (nextActive) setNextTargetWord(nextActive.word);
                  
                  break;
                }
              }
            }
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
  }, []);

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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Fire overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-r from-orange-900/40 via-red-900/30 to-red-950/50"
      />
      
      {/* Heat distortion effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className={`bg-gradient-to-r ${agentMode ? 'from-cyan-600 to-slate-600' : 'from-orange-600 to-red-600'} px-6 py-3 rounded-lg
          shadow-[0_0_30px_${agentMode ? 'rgba(6,182,212,0.6)' : 'rgba(249,115,22,0.6)'}] border ${agentMode ? 'border-cyan-400/50' : 'border-orange-400/50'}`}>
          <div className="flex items-center gap-3 text-white">
            {agentMode ? <Crosshair className="h-6 w-6 animate-pulse" /> : <Flame className="h-6 w-6 animate-pulse" />}
            <span className="font-bold text-lg">{agentMode ? 'INCOMING PROJECTILES! Speak words to intercept!' : 'FIREBALL BARRAGE! Speak words to extinguish!'}</span>
            {agentMode ? <Crosshair className="h-6 w-6 animate-pulse" /> : <Flame className="h-6 w-6 animate-pulse" />}
          </div>
        </div>
      </motion.div>

      {/* Fireballs */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {fireballs.map((fireball) => (
            !fireball.destroyed && (
              <motion.div
                key={fireball.id}
                className="absolute z-20"
                style={{
                  left: `${fireball.x}%`,
                  top: `${fireball.y}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: fireball.scale,
                  opacity: 1,
                }}
                exit={{ 
                  scale: 3,
                  opacity: 0,
                  transition: { duration: 0.3 }
                }}
              >
                {/* Fireball core */}
                <motion.div
                  className="relative w-28 h-28 rounded-full flex items-center justify-center
                    bg-gradient-to-br from-orange-400 via-red-500 to-red-700"
                  animate={{
                    boxShadow: ['0 0 40px rgba(249,115,22,0.7)', '0 0 60px rgba(249,115,22,0.9)', '0 0 40px rgba(249,115,22,0.7)'],
                  }}
                  transition={{ repeat: Infinity, duration: 0.4 }}
                >
                  <span 
                    className="font-black text-xl z-10 uppercase tracking-wider px-2 py-1 rounded
                      text-white bg-black/40"
                    style={{
                      textShadow: '0 0 10px rgba(255,255,255,0.8), 2px 2px 0 #000, -2px -2px 0 #000',
                    }}
                  >
                    {fireball.word}
                  </span>
                  
                  {/* Inner glow */}
                  <motion.div
                    className="absolute inset-2 rounded-full bg-gradient-to-t from-transparent via-yellow-300/40 to-yellow-200/60"
                    animate={{ opacity: [0.5, 0.9, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                  />
                  
                  {/* Hot core */}
                  <motion.div
                    className="absolute inset-6 rounded-full bg-gradient-to-br from-white/60 to-yellow-200/30"
                    animate={{ scale: [0.8, 1, 0.8], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  />
                </motion.div>
                  
                {/* Fire trail */}
                <motion.div
                  className="absolute -left-8 top-1/2 -translate-y-1/2 w-12 h-16"
                  style={{ filter: 'blur(3px)' }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-gradient-to-r from-orange-500 to-transparent"
                      style={{
                        width: 8 + i * 3,
                        height: 8 + i * 3,
                        left: -i * 6,
                        top: `${40 + Math.sin(i) * 20}%`,
                      }}
                      animate={{ 
                        opacity: [0.8, 0.3, 0.8],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.1 }}
                    />
                  ))}
                </motion.div>
                
                {/* Danger pulse when close */}
                {fireball.x > 50 && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-yellow-300"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 0.4 }}
                  />
                )}
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Next target prompt */}
      {nextTargetWord && isActive && (
        <motion.div
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="bg-slate-900/95 border-2 border-orange-400/60 rounded-xl px-8 py-4
            shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <p className="text-orange-300 text-sm mb-1 text-center font-medium">🔥 Say this word to extinguish:</p>
            <p className="text-3xl font-black text-white text-center uppercase tracking-wider">
              {nextTargetWord}
            </p>
          </div>
        </motion.div>
      )}

      {/* Mic control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <motion.div
          className={`p-6 rounded-full cursor-pointer ${
            isMicActive 
              ? 'bg-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.6)]' 
              : 'bg-slate-700'
          }`}
          animate={isMicActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          onClick={() => isMicActive ? stopMic() : startMic()}
        >
          <Mic className={`h-10 w-10 ${isMicActive ? 'text-white' : 'text-slate-400'}`} />
        </motion.div>
        {isMicActive && (
          <motion.p 
            className="text-center text-orange-300 mt-2 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🎤 Listening...
          </motion.p>
        )}
      </div>

      {/* Score */}
      <div className="absolute top-28 right-6 pointer-events-auto">
        <div className="bg-slate-900/90 rounded-lg p-4 border border-orange-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <span className="font-bold text-lg">{wordsDestroyed}</span>
            <span className="text-sm text-slate-400">extinguished</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Burned: {wordsMissed}
          </div>
        </div>
      </div>
    </div>
  );
};
