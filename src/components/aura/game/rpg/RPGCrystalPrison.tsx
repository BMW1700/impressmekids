import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Snowflake, Sparkles, Battery } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";
import { speechManager } from "@/lib/speechRecognitionManager";

interface CrystalWord {
  id: string;
  word: string;
  frozen: boolean;
  crackLevel: number; // 0-3, how cracked the ice is
  freed: boolean;
  failed: boolean;
  selected: boolean;
  x: number;
  y: number;
}

interface RPGCrystalPrisonProps {
  words: string[];
  onComplete: (wordsFreed: number, wordsFailed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGCrystalPrison = ({
  words,
  onComplete,
  onWordHit,
}: RPGCrystalPrisonProps) => {
  const [crystalWords, setCrystalWords] = useState<CrystalWord[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsFreed, setWordsFreed] = useState(0);
  const [wordsFailed, setWordsFailed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [meltTimer, setMeltTimer] = useState(45);
  const freedRef = useRef(0);
  const failedRef = useRef(0);
  const crystalWordsRef = useRef<CrystalWord[]>([]);
  const selectedWordIdRef = useRef<string | null>(null);
  const completionTriggeredRef = useRef(false);
  const nextMatchAllowedAtRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const onWordHitRef = useRef(onWordHit);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onWordHitRef.current = onWordHit; }, [onWordHit]);
  useEffect(() => { crystalWordsRef.current = crystalWords; }, [crystalWords]);

  const selectedWord = selectedWordId
    ? crystalWords.find((word) => word.id === selectedWordId) ?? null
    : null;

  const finishGame = useCallback(() => {
    if (completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    speechManager.stop('ice_crystal');
    setIsListening(false);
    setIsActive(false);
    setSelectedWordId(null);
    selectedWordIdRef.current = null;
    setTimeout(() => {
      onCompleteRef.current(freedRef.current, failedRef.current);
    }, 500);
  }, []);

  const checkForCompletion = useCallback((updatedWords?: CrystalWord[]) => {
    const wordsToCheck = updatedWords ?? crystalWordsRef.current;
    if (wordsToCheck.length > 0 && wordsToCheck.every((word) => word.freed || word.failed)) {
      finishGame();
    }
  }, [finishGame]);

  // Initialize crystal words
  useEffect(() => {
    completionTriggeredRef.current = false;
    freedRef.current = 0;
    failedRef.current = 0;
    nextMatchAllowedAtRef.current = 0;
    setWordsFreed(0);
    setWordsFailed(0);
    setMeltTimer(45);
    setIsActive(true);
    setIsListening(false);
    setSpokenText("");
    setSelectedWordId(null);
    selectedWordIdRef.current = null;
    speechManager.stop('ice_crystal');

    const positions = [
      { x: 15, y: 25 }, { x: 45, y: 20 }, { x: 75, y: 25 },
      { x: 20, y: 50 }, { x: 50, y: 45 }, { x: 80, y: 50 },
    ];
    
    const initialWords: CrystalWord[] = words.slice(0, 6).map((word, index) => ({
      id: `crystal-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      frozen: true,
      crackLevel: 0,
      freed: false,
      failed: false,
      selected: false,
      x: positions[index % positions.length].x,
      y: positions[index % positions.length].y,
    }));
    setCrystalWords(initialWords);
    crystalWordsRef.current = initialWords;
  }, [words]);

  // Melt timer - words take damage if not freed in time
  useEffect(() => {
    if (!isActive || meltTimer <= 0 || completionTriggeredRef.current) return;
    
    const timer = setInterval(() => {
      setMeltTimer(prev => {
        if (prev <= 1) {
          if (completionTriggeredRef.current) return 0;
          // Time's up - count remaining frozen words as failed
          setCrystalWords(current => {
            const remaining = current.filter(w => !w.freed && !w.failed);
            remaining.forEach(() => {
              failedRef.current += 1;
              onWordHitRef.current(10);
            });
            setWordsFailed(failedRef.current);
            const updated = current.map(w => 
              !w.freed && !w.failed ? { ...w, failed: true } : w
            );
            crystalWordsRef.current = updated;
            return updated;
          });
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [finishGame, isActive, meltTimer]);

  const resetListeningState = useCallback(() => {
    speechManager.stop('ice_crystal');
    setIsListening(false);
    setSpokenText("");
    setSelectedWordId(null);
    selectedWordIdRef.current = null;
    nextMatchAllowedAtRef.current = 0;
    setCrystalWords(prev => {
      const updated = prev.map(w => ({ ...w, selected: false }));
      crystalWordsRef.current = updated;
      return updated;
    });
  }, []);

  const handleSelectWord = useCallback((crystalWord: CrystalWord) => {
    if (!isActive || crystalWord.freed || crystalWord.failed) return;
    
    resetListeningState();
    
    setCrystalWords(prev => {
      const updated = prev.map(w => ({ ...w, selected: w.id === crystalWord.id }));
      crystalWordsRef.current = updated;
      return updated;
    });
    setSelectedWordId(crystalWord.id);
    selectedWordIdRef.current = crystalWord.id;
    startListening(crystalWord.id);
  }, [isActive, resetListeningState]);

  const startListening = useCallback((wordId: string) => {
    unlockSpeechSynthesis();

    const selectedCrystal = crystalWordsRef.current.find((word) => word.id === wordId);
    if (!selectedCrystal) {
      resetListeningState();
      return;
    }

    speechManager.start({
      owner: 'ice_crystal',
      continuous: true,
      interimResults: true,
      onStart: () => {
        setIsListening(true);
        setSpokenText("");
      },
      onEnd: () => {
        setIsListening(false);
      },
      onResult: (transcript, alternatives, isFinal) => {
        if (!isActive || completionTriggeredRef.current) return;

        const activeWordId = selectedWordIdRef.current;
        if (!activeWordId) return;

        const activeWord = crystalWordsRef.current.find((word) => word.id === activeWordId);
        if (!activeWord || activeWord.freed || activeWord.failed) return;

        const heardText = transcript.trim().toLowerCase();
        setSpokenText(heardText);

        if (Date.now() < nextMatchAllowedAtRef.current) {
          return;
        }

        const allTranscripts = [transcript, ...alternatives];
        const matched = allTranscripts.some((candidate) =>
          candidate
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .some((spoken) => {
              const cleanSpoken = spoken.replace(/[^a-z']/g, '');
              return cleanSpoken.length >= 1 && isWordMatchLenient(cleanSpoken, activeWord.word);
            })
        );

        if (matched) {
          nextMatchAllowedAtRef.current = Date.now() + 700;
          soundEffects.iceShimmer();

          let updatedWords: CrystalWord[] = crystalWordsRef.current;
          let freedWord = false;

          setCrystalWords(prev => {
            updatedWords = prev.map((word) => {
              if (word.id !== activeWord.id) return word;

              const newCrackLevel = Math.min(2, word.crackLevel + 1);
              if (newCrackLevel >= 2) {
                freedWord = true;
                return { ...word, crackLevel: newCrackLevel, freed: true, frozen: false, selected: false };
              }

              return { ...word, crackLevel: newCrackLevel, selected: true };
            });

            crystalWordsRef.current = updatedWords;
            return updatedWords;
          });

          if (freedWord) {
            freedRef.current += 1;
            setWordsFreed(freedRef.current);
            soundEffects.correctWord();
            setSelectedWordId(null);
            selectedWordIdRef.current = null;
            setSpokenText("");
            speechManager.stop('ice_crystal');
            checkForCompletion(updatedWords);
          }

          return;
        }

        if (isFinal && heardText) {
          soundEffects.incorrectWord();
          onWordHitRef.current(15);
          failedRef.current += 1;
          setWordsFailed(failedRef.current);

          let updatedWords: CrystalWord[] = crystalWordsRef.current;
          setCrystalWords(prev => {
            updatedWords = prev.map((word) =>
              word.id === activeWord.id ? { ...word, failed: true, selected: false } : word
            );
            crystalWordsRef.current = updatedWords;
            return updatedWords;
          });

          setSelectedWordId(null);
          selectedWordIdRef.current = null;
          setSpokenText(heardText);
          speechManager.stop('ice_crystal');
          checkForCompletion(updatedWords);
        }
      },
      onError: () => {
        setIsListening(false);
      },
    });
  }, [checkForCompletion, isActive, resetListeningState]);

  useEffect(() => {
    return () => {
      speechManager.abort('ice_crystal');
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Frozen cavern overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute inset-0 bg-gradient-to-b ${isAgentMode() ? 'from-slate-900/95 via-emerald-950/90 to-slate-950/95' : 'from-cyan-900/95 via-blue-950/90 to-indigo-950/95'}`}
      />
      
      {/* Ice crystal effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <Sparkles 
              className="text-cyan-300/30" 
              style={{ 
                width: 10 + Math.random() * 20,
                height: 10 + Math.random() * 20,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Warning Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        {(() => { const t = getMinigameTheme('crystalPrison'); const agent = isAgentMode(); return (
        <div className={`bg-gradient-to-r ${agent ? 'from-emerald-600 to-green-600' : 'from-cyan-600 to-blue-600'} px-6 py-3 rounded-lg
          shadow-lg border ${agent ? 'border-emerald-400/50' : 'border-cyan-400/50'}`}>
          <div className="flex items-center gap-3 text-white">
            {agent ? <Battery className="h-6 w-6 animate-pulse" /> : <Snowflake className="h-6 w-6 animate-spin" style={{ animationDuration: '3s' }} />}
            <span className="font-bold text-lg">{agent ? 'CONTAINMENT FIELD! Say words TWICE to disable!' : 'CRYSTAL PRISON! Say words TWICE to break the ice!'}</span>
            {agent ? <Battery className="h-6 w-6 animate-pulse" /> : <Snowflake className="h-6 w-6 animate-spin" style={{ animationDuration: '3s' }} />}
          </div>
        </div>
        ); })()}
      </motion.div>

      {/* Timer */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50">
        <div className={`text-3xl font-black ${meltTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
          {meltTimer}s
        </div>
      </div>

      {/* Crystal Words */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {crystalWords.map((word) => (
            <motion.button
              key={word.id}
              onClick={() => handleSelectWord(word)}
              disabled={word.freed || word.failed}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: word.selected ? 1.2 : 1,
                opacity: word.freed ? 0 : word.failed ? 0.3 : 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {/* Crystal container */}
              <motion.div
                className={`relative px-8 py-6 ${
                  word.freed 
                    ? 'bg-transparent' 
                    : word.failed
                      ? 'bg-red-900/50'
                      : word.crackLevel >= 1
                        ? 'bg-gradient-to-br from-cyan-300/40 via-blue-400/30 to-cyan-200/40'
                        : 'bg-gradient-to-br from-cyan-400/60 via-blue-500/50 to-cyan-300/60'
                }`}
                style={{
                  clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)',
                  backdropFilter: word.freed ? 'none' : 'blur(4px)',
                }}
                animate={{
                  boxShadow: word.selected 
                    ? ['0 0 40px rgba(251,191,36,0.8)', '0 0 60px rgba(251,191,36,1)', '0 0 40px rgba(251,191,36,0.8)']
                    : word.freed
                      ? 'none'
                      : ['0 0 20px rgba(6,182,212,0.5)', '0 0 30px rgba(6,182,212,0.7)', '0 0 20px rgba(6,182,212,0.5)'],
                }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                {/* Word inside crystal */}
                <span className={`font-black text-xl ${
                  word.freed ? 'text-emerald-400' : word.failed ? 'text-red-300' : 'text-white'
                }`}
                  style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
                >
                  {word.word}
                </span>
                
                {/* Crack overlay */}
                {word.crackLevel >= 1 && !word.freed && (
                  <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
                      <path
                        d="M30,10 L50,50 L70,30 M50,50 L40,80 M50,50 L80,60"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Crack progress indicator */}
              <div className="flex justify-center gap-1 mt-2">
                {[0, 1].map((level) => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-full border-2 ${
                      level < word.crackLevel 
                        ? 'bg-cyan-400 border-cyan-300' 
                        : 'bg-transparent border-cyan-600'
                    }`}
                  />
                ))}
              </div>
              
              {/* Freed sparkle effect */}
              {word.freed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sparkles className="h-12 w-12 text-cyan-300" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Word Panel */}
      <AnimatePresence>
        {selectedWord && !selectedWord.freed && !selectedWord.failed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="bg-slate-900/95 border-2 border-cyan-400 rounded-xl px-10 py-5
              shadow-[0_0_40px_rgba(6,182,212,0.5)]">
              <p className="text-cyan-400 text-sm mb-2 text-center font-medium">
                Crack {selectedWord.crackLevel + 1} of 2 - Say to shatter:
              </p>
              <p className="text-4xl font-black text-white text-center">{selectedWord.word}</p>
              
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
      </AnimatePresence>

      {/* Score */}
      <div className="absolute top-28 right-6 pointer-events-auto">
        <div className="bg-slate-900/90 rounded-lg p-4 border border-cyan-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Snowflake className="h-5 w-5 text-cyan-400" />
            <span className="font-bold text-lg">{wordsFreed}</span>
            <span className="text-sm text-slate-400">freed</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Frozen: {wordsFailed}
          </div>
        </div>
      </div>
    </div>
  );
};
