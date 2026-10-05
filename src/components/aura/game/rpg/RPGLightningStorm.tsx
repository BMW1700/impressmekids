import { useMinigameMicOwnership } from "@/hooks/useMinigameMicOwnership";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Zap, Cloud, Plug } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";

interface LightningWord {
  id: string;
  word: string;
  active: boolean;
  struck: boolean;
  missed: boolean;
  timeLeft: number;
}

interface RPGLightningStormProps {
  words: string[];
  onComplete: (wordsStruck: number, wordsMissed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGLightningStorm = ({
  words,
  onComplete,
  onWordHit,
}: RPGLightningStormProps) => {
  const [lightningWords, setLightningWords] = useState<LightningWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsStruck, setWordsStruck] = useState(0);
  const [wordsMissed, setWordsMissed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [flashScreen, setFlashScreen] = useState(false);
  const recognitionRef = useRef<any>(null);
  useMinigameMicOwnership('lightning_storm', recognitionRef);
  const struckRef = useRef(0);
  const missedRef = useRef(0);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentWordRef = useRef<LightningWord | null>(null);
  const hasProcessedRef = useRef(false);

  // Initialize lightning words
  useEffect(() => {
    const initialWords: LightningWord[] = words.slice(0, 10).map((word, index) => ({
      id: `lightning-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      active: false,
      struck: false,
      missed: false,
      timeLeft: 3000,
    }));
    setLightningWords(initialWords);
  }, [words]);

  const moveToNextWord = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setSpokenText("");
    hasProcessedRef.current = false;
    
    const nextIndex = currentWordIndex + 1;
    if (nextIndex >= lightningWords.length) {
      setIsActive(false);
      setTimeout(() => {
        onComplete(struckRef.current, missedRef.current);
      }, 500);
    } else {
      setTimeout(() => {
        setCurrentWordIndex(nextIndex);
      }, 500);
    }
  }, [currentWordIndex, lightningWords.length, onComplete]);

  const handleWordTimeout = useCallback(() => {
    const currentWord = lightningWords[currentWordIndex];
    if (!currentWord || currentWord.struck || currentWord.missed || hasProcessedRef.current) return;
    
    hasProcessedRef.current = true;
    soundEffects.incorrectWord();
    onWordHit(12);
    missedRef.current += 1;
    setWordsMissed(missedRef.current);
    
    setLightningWords(prev => prev.map((w, i) => 
      i === currentWordIndex ? { ...w, missed: true, active: false } : w
    ));
    
    moveToNextWord();
  }, [currentWordIndex, lightningWords, onWordHit, moveToNextWord]);

  // Start CONTINUOUS listening for current word
  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    
    unlockSpeechSynthesis();
    hasProcessedRef.current = false;
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // CONTINUOUS for lenient matching
    recognition.interimResults = true; // Process interim results immediately
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsListening(true);
      setSpokenText("");
    };

    recognition.onresult = (event: any) => {
      if (hasProcessedRef.current) return;
      
      const currentWord = currentWordRef.current;
      if (!currentWord) return;
      
      // Process all results including interim
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim().toLowerCase();
        setSpokenText(transcript);
        
        // Lenient matching - check all spoken words and alternatives
        const targetWord = currentWord.word;
        let matched = false;
        
        // Check all alternatives
        for (let j = 0; j < result.length && !matched; j++) {
          const alt = result[j]?.transcript?.trim().toLowerCase() || '';
          const altWords = alt.split(/\s+/);
          for (const spoken of altWords) {
            if (isWordMatchLenient(spoken, targetWord)) {
              matched = true;
              break;
            }
          }
        }
        
        if (matched && !hasProcessedRef.current) {
          hasProcessedRef.current = true;
          
          if (wordTimerRef.current) {
            clearTimeout(wordTimerRef.current);
          }
          
          soundEffects.correctWord();
          struckRef.current += 1;
          setWordsStruck(struckRef.current);
          
          setLightningWords(prev => prev.map((w, idx) => 
            idx === currentWordIndex ? { ...w, struck: true, active: false } : w
          ));
          
          moveToNextWord();
          return;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.log('[LightningStorm] Speech error:', event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Restart on recoverable errors
        setTimeout(() => {
          if (isActive && !hasProcessedRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        }, 100);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still active and not processed
      if (isActive && !hasProcessedRef.current) {
        setTimeout(() => {
          try { recognition.start(); } catch (e) {}
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {}
  }, [currentWordIndex, isActive, moveToNextWord]);

  // Start the lightning storm - words appear one at a time
  useEffect(() => {
    if (!isActive || currentWordIndex >= lightningWords.length) return;
    
    const currentWord = lightningWords[currentWordIndex];
    currentWordRef.current = currentWord;
    
    // Activate current word
    setLightningWords(prev => prev.map((w, i) => ({
      ...w,
      active: i === currentWordIndex,
    })));
    
    // Flash effect
    setFlashScreen(true);
    setTimeout(() => setFlashScreen(false), 100);
    
    // Play lightning sound
    soundEffects.lightningCrack();
    
    // Start listening
    startListening();
    
    // Word timeout - if not spoken in time, it's missed
    wordTimerRef.current = setTimeout(() => {
      handleWordTimeout();
    }, 3000);
    
    return () => {
      if (wordTimerRef.current) {
        clearTimeout(wordTimerRef.current);
      }
    };
  }, [currentWordIndex, isActive, lightningWords.length, startListening, handleWordTimeout]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (wordTimerRef.current) {
        clearTimeout(wordTimerRef.current);
      }
    };
  }, []);

  const currentWord = lightningWords[currentWordIndex];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Storm overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute inset-0 bg-gradient-to-b ${isAgentMode() ? 'from-slate-900/95 via-blue-950/90 to-slate-950/95' : 'from-slate-900/95 via-purple-950/90 to-slate-950/95'}`}
      />
      
      {/* Lightning flash */}
      <AnimatePresence>
        {flashScreen && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg-white/80 z-60"
          />
        )}
      </AnimatePresence>
      
      {/* Storm clouds */}
      <div className="absolute inset-x-0 top-0 h-40">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${i * 15 - 10}%`,
              top: `${10 + (i % 3) * 15}%`,
            }}
            animate={{ x: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.5 }}
          >
            <Cloud className="text-slate-700 w-24 h-24" />
          </motion.div>
        ))}
      </div>

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        {(() => { const t = getMinigameTheme('lightningStorm'); const agent = isAgentMode(); return (
        <div className={`bg-gradient-to-r ${agent ? 'from-blue-600 to-cyan-600' : 'from-yellow-600 to-amber-600'} px-6 py-3 rounded-lg
          shadow-lg border ${agent ? 'border-blue-400/50' : 'border-yellow-400/50'}`}>
          <div className="flex items-center gap-3 text-white">
            {agent ? <Plug className="h-6 w-6 animate-pulse" /> : <Zap className="h-6 w-6 animate-pulse" />}
            <span className="font-bold text-lg">{agent ? 'POWER SURGE! Speak FAST before the grid overloads!' : 'LIGHTNING STORM! Speak FAST before it strikes!'}</span>
            {agent ? <Plug className="h-6 w-6 animate-pulse" /> : <Zap className="h-6 w-6 animate-pulse" />}
          </div>
        </div>
        ); })()}
      </motion.div>

      {/* Progress bar */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 w-64 h-3 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 3, ease: 'linear' }}
          key={currentWordIndex}
        />
      </div>

      {/* Lightning bolt and word display */}
      {currentWord && currentWord.active && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Lightning bolt */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            className="absolute top-0 left-1/2 -translate-x-1/2"
          >
            <svg width="80" height="300" viewBox="0 0 80 300" className="drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]">
              <motion.path
                d="M40,0 L20,100 L50,100 L25,200 L60,200 L30,300"
                stroke="url(#lightning-gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2 }}
              />
              <defs>
                <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
          
          {/* Word in lightning */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 px-12 py-8 rounded-2xl
              shadow-[0_0_60px_rgba(234,179,8,0.8)] border-4 border-yellow-300"
          >
            <motion.p
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 0.3 }}
              className="text-5xl font-black text-black uppercase tracking-wide"
            >
              {currentWord.word}
            </motion.p>
          </motion.div>
        </div>
      )}

      {/* Listening indicator */}
      {isListening && currentWord?.active && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-40 left-1/2 -translate-x-1/2 pointer-events-auto"
        >
          <div className="flex items-center gap-3 text-yellow-400 bg-slate-900/90 px-6 py-3 rounded-lg">
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.4 }}>
              <Mic className="h-8 w-8" />
            </motion.div>
            <span className="font-bold text-xl">SPEAK NOW!</span>
          </div>
          
          {spokenText && (
            <p className="text-center text-slate-400 mt-2">
              Heard: "<span className="text-white">{spokenText}</span>"
            </p>
          )}
        </motion.div>
      )}

      {/* Word progress indicators */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
        {lightningWords.map((word, index) => (
          <motion.div
            key={word.id}
            className={`w-4 h-4 rounded-full ${
              word.struck 
                ? 'bg-emerald-400' 
                : word.missed 
                  ? 'bg-red-400' 
                  : index === currentWordIndex
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-slate-600'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 }}
          />
        ))}
      </div>

      {/* Score */}
      <div className="absolute top-40 right-6 pointer-events-auto">
        <div className="bg-slate-900/90 rounded-lg p-4 border border-yellow-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="font-bold text-lg">{wordsStruck}</span>
            <span className="text-sm text-slate-400">struck</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Missed: {wordsMissed}
          </div>
        </div>
      </div>
    </div>
  );
};
