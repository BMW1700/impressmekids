import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, Repeat, Radar } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";
import { getMinigameTheme, isAgentMode } from "@/lib/minigameTheme";
import { speechManager } from "@/lib/speechRecognitionManager";

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
  const [timeLeft, setTimeLeft] = useState(30);

  const isMountedRef = useRef(true);
  const completedRef = useRef(0);
  const failedRef = useRef(0);
  const currentWordIndexRef = useRef(0);
  const echoWordsRef = useRef<EchoWord[]>([]);
  const completionTriggeredRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMatchTimeRef = useRef(0);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);
  useEffect(() => { echoWordsRef.current = echoWords; }, [echoWords]);

  const completeGame = useCallback(() => {
    if (completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    speechManager.stop('word_echo');
    setIsListening(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimeout(() => {
      if (isMountedRef.current) {
        onCompleteRef.current(completedRef.current, failedRef.current);
      }
    }, 500);
  }, []);

  // Initialize echo words
  useEffect(() => {
    completionTriggeredRef.current = false;
    completedRef.current = 0;
    failedRef.current = 0;
    unlockSpeechSynthesis();
    const initialWords: EchoWord[] = words.slice(0, 6).map((word, index) => ({
      id: `echo-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      echosNeeded: 2,
      echosSpoken: 0,
      completed: false,
      failed: false,
    }));
    setEchoWords(initialWords);
    echoWordsRef.current = initialWords;
    setCurrentWordIndex(0);
    currentWordIndexRef.current = 0;
  }, [words]);

  // Countdown timer
  useEffect(() => {
    if (completionTriggeredRef.current) return;

    timerRef.current = setInterval(() => {
      if (completionTriggeredRef.current) return;
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [completeGame]);

  // Start listening via speechManager
  const startListening = useCallback(() => {
    if (completionTriggeredRef.current) return;

    speechManager.start({
      owner: 'word_echo',
      continuous: true,
      interimResults: true,
      onStart: () => { if (isMountedRef.current) setIsListening(true); },
      onEnd: () => { if (isMountedRef.current) setIsListening(false); },
      onResult: (transcript, alternatives, isFinal) => {
        if (!isMountedRef.current || completionTriggeredRef.current) return;
        setSpokenText(transcript);

        // Process both interim and final results for instant feedback
        const now = Date.now();
        if (now - lastMatchTimeRef.current < 500) return; // cooldown between matches

        const currentIdx = currentWordIndexRef.current;
        const currentWord = echoWordsRef.current[currentIdx];
        if (!currentWord || currentWord.completed || currentWord.failed) return;

        const targetWord = currentWord.word;
        let matched = false;
        const allTranscripts = [transcript, ...alternatives];
        for (const t of allTranscripts) {
          const altWords = t.toLowerCase().trim().split(/\s+/);
          for (const spoken of altWords) {
            if (isWordMatchLenient(spoken, targetWord)) {
              matched = true;
              break;
            }
          }
          if (matched) break;
        }

        if (matched) {
          lastMatchTimeRef.current = now;
          soundEffects.correctWord();
          const newEchosSpoken = currentWord.echosSpoken + 1;
          const isComplete = newEchosSpoken >= currentWord.echosNeeded;
          
          if (isComplete) {
            completedRef.current += 1;
            setWordsCompleted(completedRef.current);
          }

          setEchoWords(prev => prev.map((w, i) => {
            if (i === currentIdx) {
              return { ...w, echosSpoken: newEchosSpoken, completed: isComplete };
            }
            return w;
          }));

          if (isComplete) {
            const nextIndex = currentIdx + 1;
            if (nextIndex >= echoWordsRef.current.length) {
              completeGame();
            } else {
              setCurrentWordIndex(nextIndex);
              currentWordIndexRef.current = nextIndex;
            }
          }
        }
        // Don't penalize on interim — only on final with no match
        if (isFinal && !matched) {
          soundEffects.incorrectWord();
          onWordHit(15);
          failedRef.current += 1;
          setWordsFailed(failedRef.current);
          
          setEchoWords(prev => prev.map((w, i) => 
            i === currentIdx ? { ...w, failed: true } : w
          ));

          const nextIndex = currentIdx + 1;
          if (nextIndex >= echoWordsRef.current.length) {
            completeGame();
          } else {
            setCurrentWordIndex(nextIndex);
            currentWordIndexRef.current = nextIndex;
          }
          setSpokenText("");
        }
      },
      onError: (error) => {
        console.log('[WordEcho] Recognition error:', error);
      },
    });
  }, [completeGame, onWordHit]);

  // Auto-start listening
  useEffect(() => {
    const timer = setTimeout(() => startListening(), 500);
    return () => clearTimeout(timer);
  }, [startListening]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      speechManager.abort('word_echo');
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, []);

  const currentWord = echoWords[currentWordIndex];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`absolute inset-0 bg-gradient-to-b ${isAgentMode() ? 'from-slate-900/90 via-emerald-950/80 to-slate-950/95' : 'from-stone-900/90 via-amber-950/80 to-stone-950/95'}`}
      />
      
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div key={i} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/30"
            style={{ width: 100 + i * 80, height: 100 + i * 80 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 + i * 0.5, delay: i * 0.3 }}
          />
        ))}
      </div>

      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        {(() => { const t = getMinigameTheme('wordEcho'); const agent = isAgentMode(); return (
        <div className={`bg-gradient-to-r ${agent ? 'from-emerald-600 to-cyan-600' : 'from-amber-600 to-orange-600'} px-6 py-3 rounded-lg shadow-lg border ${agent ? 'border-emerald-400/50' : 'border-amber-400/50'}`}>
          <div className="flex items-center gap-3 text-white">
            {agent ? <Radar className="h-6 w-6 animate-pulse" /> : <Repeat className="h-6 w-6 animate-pulse" />}
            <span className="font-bold text-lg">{t.title} Say each word TWICE!</span>
            {agent ? <Radar className="h-6 w-6 animate-pulse" /> : <Repeat className="h-6 w-6 animate-pulse" />}
          </div>
        </div>
        ); })()}
      </motion.div>

      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50">
        <div className={`text-3xl font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
      </div>

      <div className="absolute inset-x-4 top-40 flex flex-wrap justify-center gap-3 pointer-events-auto">
        {echoWords.map((word, index) => (
          <motion.div key={word.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: index === currentWordIndex ? 1.1 : 1, opacity: word.completed ? 0.5 : word.failed ? 0.3 : 1 }}
            className={`relative px-6 py-4 rounded-xl border-2 ${
              word.completed ? 'bg-emerald-900/80 border-emerald-400' 
              : word.failed ? 'bg-red-900/80 border-red-400' 
              : index === currentWordIndex ? 'bg-amber-900/80 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
              : 'bg-stone-800/80 border-stone-600'
            }`}
          >
            <p className="text-2xl font-bold text-white">{word.word}</p>
            <div className="flex justify-center gap-2 mt-2">
              {[...Array(word.echosNeeded)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < word.echosSpoken ? 'bg-amber-400' : 'bg-stone-600'}`} />
              ))}
            </div>
            {word.completed && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✓</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {currentWord && !currentWord.completed && !currentWord.failed && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="bg-slate-900/95 border-2 border-amber-400 rounded-xl px-10 py-5 shadow-[0_0_40px_rgba(245,158,11,0.5)]">
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

      <div className="absolute top-28 right-6 pointer-events-auto">
        <div className="bg-slate-900/90 rounded-lg p-4 border border-amber-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Volume2 className="h-5 w-5 text-amber-400" />
            <span className="font-bold text-lg">{wordsCompleted}</span>
            <span className="text-sm text-slate-400">echoed</span>
          </div>
          <div className="text-red-400 text-sm font-medium">Failed: {wordsFailed}</div>
        </div>
      </div>
    </div>
  );
};
