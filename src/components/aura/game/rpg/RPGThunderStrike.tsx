import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Zap, Cloud } from "lucide-react";
import { isWordMatchLenient } from "@/lib/wordMatchingModes";
import { SoundEffects, unlockSpeechSynthesis } from "@/lib/pronunciationPlayer";

interface ThunderCloud {
  id: string;
  word: string;
  x: number;
  y: number;
  chargeLevel: number; // 0-100, increases over time
  discharged: boolean;
  exploded: boolean;
  selected: boolean;
}

interface RPGThunderStrikeProps {
  words: string[];
  onComplete: (wordsStruck: number, wordsMissed: number) => void;
  onWordHit: (damage: number) => void;
}

const soundEffects = new SoundEffects();

export const RPGThunderStrike = ({
  words,
  onComplete,
  onWordHit,
}: RPGThunderStrikeProps) => {
  const [thunderClouds, setThunderClouds] = useState<ThunderCloud[]>([]);
  const [selectedCloud, setSelectedCloud] = useState<ThunderCloud | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [wordsStruck, setWordsStruck] = useState(0);
  const [wordsMissed, setWordsMissed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(40);
  const recognitionRef = useRef<any>(null);
  const struckRef = useRef(0);
  const missedRef = useRef(0);
  const completedCountRef = useRef(0);
  const selectedCloudRef = useRef<ThunderCloud | null>(null);

  // Initialize thunder clouds with random positions
  useEffect(() => {
    const positions = [
      { x: 15, y: 20 }, { x: 40, y: 15 }, { x: 65, y: 20 }, { x: 85, y: 25 },
      { x: 25, y: 45 }, { x: 55, y: 40 }, { x: 80, y: 45 },
    ];
    
    const initialClouds: ThunderCloud[] = words.slice(0, 7).map((word, index) => ({
      id: `thunder-${index}`,
      word: word.replace(/[^a-zA-Z']/g, ''),
      x: positions[index % positions.length].x,
      y: positions[index % positions.length].y,
      chargeLevel: 20 + Math.random() * 30, // Start partially charged
      discharged: false,
      exploded: false,
      selected: false,
    }));
    setThunderClouds(initialClouds);
  }, [words]);

  // Charge clouds over time - if they reach 100%, they explode and deal damage
  useEffect(() => {
    if (!isActive) return;
    
    const chargeInterval = setInterval(() => {
      setThunderClouds(prev => {
        return prev.map(cloud => {
          if (cloud.discharged || cloud.exploded) return cloud;
          
          const newCharge = cloud.chargeLevel + 2; // Increase charge
          
          if (newCharge >= 100) {
            // Cloud explodes - deal damage
            missedRef.current += 1;
            setWordsMissed(missedRef.current);
            completedCountRef.current += 1;
            onWordHit(15);
            soundEffects.incorrectWord();
            return { ...cloud, chargeLevel: 100, exploded: true, selected: false };
          }
          
          return { ...cloud, chargeLevel: newCharge };
        });
      });
    }, 200);
    
    return () => clearInterval(chargeInterval);
  }, [isActive, onWordHit]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time up - all remaining clouds explode
          setThunderClouds(current => {
            const remaining = current.filter(c => !c.discharged && !c.exploded);
            remaining.forEach(() => {
              missedRef.current += 1;
              completedCountRef.current += 1;
              onWordHit(15);
            });
            setWordsMissed(missedRef.current);
            return current.map(c => 
              !c.discharged && !c.exploded ? { ...c, exploded: true } : c
            );
          });
          setIsActive(false);
          setTimeout(() => {
            onComplete(struckRef.current, missedRef.current);
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete, onWordHit]);

  // Check for completion
  useEffect(() => {
    if (!isActive) return;
    const totalClouds = 7;
    if (completedCountRef.current >= totalClouds) {
      setIsActive(false);
      setTimeout(() => {
        onComplete(struckRef.current, missedRef.current);
      }, 500);
    }
  }, [wordsStruck, wordsMissed, isActive, onComplete]);

  const resetListeningState = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setSpokenText("");
    setSelectedCloud(null);
    selectedCloudRef.current = null;
    setThunderClouds(prev => prev.map(c => ({ ...c, selected: false })));
  }, []);

  const handleSelectCloud = useCallback((cloud: ThunderCloud) => {
    if (cloud.discharged || cloud.exploded) return;
    
    resetListeningState();
    
    setThunderClouds(prev => prev.map(c => ({ ...c, selected: c.id === cloud.id })));
    setSelectedCloud(cloud);
    selectedCloudRef.current = cloud;
    startListening(cloud);
  }, [resetListeningState]);

  const startListening = useCallback((cloud: ThunderCloud) => {
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

    const lockedCloud = cloud;
    selectedCloudRef.current = cloud;

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
        const targetWord = lockedCloud.word;
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
          struckRef.current += 1;
          setWordsStruck(struckRef.current);
          completedCountRef.current += 1;
          
          setThunderClouds(prev => 
            prev.map(c => c.id === lockedCloud.id ? { ...c, discharged: true, selected: false } : c)
          );
        } else {
          soundEffects.incorrectWord();
          onWordHit(18);
          missedRef.current += 1;
          setWordsMissed(missedRef.current);
          completedCountRef.current += 1;
          
          setThunderClouds(prev => 
            prev.map(c => c.id === lockedCloud.id ? { ...c, exploded: true, selected: false } : c)
          );
        }

        resetListeningState();
      }
    };

    recognition.onerror = () => resetListeningState();
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { resetListeningState(); }
  }, [onWordHit, resetListeningState]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Stormy sky overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950"
      />
      
      {/* Lightning flash effects */}
      <motion.div
        className="absolute inset-0 bg-yellow-200/5"
        animate={{ 
          opacity: [0, 0.3, 0, 0.2, 0],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 4,
          times: [0, 0.02, 0.04, 0.08, 0.1],
        }}
      />
      
      {/* Animated clouds in background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${i * 15 - 10}%`,
              top: `${10 + (i % 3) * 15}%`,
            }}
            animate={{ 
              x: [0, 30, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 6 + i * 0.5,
              delay: i * 0.3,
            }}
          >
            <Cloud 
              className="text-slate-700" 
              style={{ 
                width: 60 + Math.random() * 40,
                height: 40 + Math.random() * 30,
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
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 px-6 py-3 rounded-lg
          shadow-[0_0_30px_rgba(234,179,8,0.6)] border border-yellow-400/50">
          <div className="flex items-center gap-3 text-white">
            <Zap className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">THUNDER STRIKE! Click clouds & speak to discharge!</span>
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Timer */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50">
        <div className={`text-3xl font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
          {timeLeft}s
        </div>
      </div>

      {/* Thunder Clouds */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {thunderClouds.map((cloud) => (
            <motion.button
              key={cloud.id}
              onClick={() => handleSelectCloud(cloud)}
              disabled={cloud.discharged || cloud.exploded}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: `${cloud.x}%`,
                top: `${cloud.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0, y: -50 }}
              animate={{ 
                scale: cloud.selected ? 1.15 : 1,
                opacity: cloud.discharged ? 0 : cloud.exploded ? 0.3 : 1,
                y: 0,
              }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {/* Cloud container */}
              <motion.div
                className={`relative px-6 py-4 rounded-3xl border-2 ${
                  cloud.discharged 
                    ? 'bg-emerald-600/50 border-emerald-400' 
                    : cloud.exploded
                      ? 'bg-red-900/50 border-red-500'
                      : cloud.selected
                        ? 'bg-gradient-to-br from-yellow-700/80 to-amber-800/80 border-yellow-400'
                        : cloud.chargeLevel > 70
                          ? 'bg-gradient-to-br from-purple-700/80 to-indigo-800/80 border-purple-400'
                          : 'bg-gradient-to-br from-slate-600/80 to-slate-700/80 border-slate-400'
                }`}
                animate={{
                  boxShadow: cloud.selected 
                    ? ['0 0 40px rgba(234,179,8,0.8)', '0 0 60px rgba(234,179,8,1)', '0 0 40px rgba(234,179,8,0.8)']
                    : cloud.chargeLevel > 70
                      ? ['0 0 20px rgba(168,85,247,0.5)', '0 0 40px rgba(168,85,247,0.8)', '0 0 20px rgba(168,85,247,0.5)']
                      : '0 0 10px rgba(148,163,184,0.3)',
                }}
                transition={{ repeat: Infinity, duration: cloud.chargeLevel > 70 ? 0.5 : 1.5 }}
              >
                {/* Cloud icon */}
                <div className="flex items-center justify-center mb-2">
                  <Cloud className={`h-8 w-8 ${
                    cloud.discharged ? 'text-emerald-300' : cloud.exploded ? 'text-red-400' : 'text-slate-200'
                  }`} />
                  {!cloud.discharged && !cloud.exploded && (
                    <Zap className={`h-5 w-5 absolute ${
                      cloud.chargeLevel > 70 ? 'text-yellow-300 animate-pulse' : 'text-yellow-500'
                    }`} />
                  )}
                </div>
                
                {/* Word inside cloud */}
                <span className={`font-black text-lg ${
                  cloud.discharged ? 'text-emerald-300' : cloud.exploded ? 'text-red-300' : 'text-white'
                }`}
                  style={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}
                >
                  {cloud.word}
                </span>
                
                {/* Charge bar */}
                {!cloud.discharged && !cloud.exploded && (
                  <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden w-full">
                    <motion.div 
                      className={`h-full ${
                        cloud.chargeLevel > 70 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 
                        cloud.chargeLevel > 40 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 
                        'bg-gradient-to-r from-blue-500 to-cyan-500'
                      }`}
                      style={{ width: `${cloud.chargeLevel}%` }}
                    />
                  </div>
                )}
                
                {/* Discharged checkmark */}
                {cloud.discharged && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <Zap className="h-4 w-4 text-white" />
                  </motion.div>
                )}
                
                {/* Exploded indicator */}
                {cloud.exploded && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white font-bold">✕</span>
                  </motion.div>
                )}
              </motion.div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Cloud Panel */}
      <AnimatePresence>
        {selectedCloud && !selectedCloud.discharged && !selectedCloud.exploded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="bg-slate-900/95 border-2 border-yellow-400 rounded-xl px-10 py-5
              shadow-[0_0_40px_rgba(234,179,8,0.5)]">
              <p className="text-yellow-400 text-sm mb-2 text-center font-medium">
                Speak to discharge the thunder:
              </p>
              <p className="text-4xl font-black text-white text-center">{selectedCloud.word}</p>
              
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
        <div className="bg-slate-900/90 rounded-lg p-4 border border-yellow-700 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="font-bold text-lg">{wordsStruck}</span>
            <span className="text-sm text-slate-400">discharged</span>
          </div>
          <div className="text-red-400 text-sm font-medium">
            Exploded: {wordsMissed}
          </div>
        </div>
      </div>
    </div>
  );
};
