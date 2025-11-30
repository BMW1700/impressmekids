import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star, Zap, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

type AuraState = 'idle' | 'excited' | 'encouraging' | 'celebrating' | 'thinking';

interface AuraCharacterProps {
  state: AuraState;
  message?: string;
  enableVoice?: boolean;
}

const stateConfig = {
  idle: {
    icon: Sparkles,
    color: 'from-blue-400 to-purple-400',
    bgColor: 'bg-blue-500/10',
    animation: { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] },
    duration: 3,
  },
  excited: {
    icon: Star,
    color: 'from-yellow-400 to-orange-400',
    bgColor: 'bg-yellow-500/10',
    animation: { scale: [1, 1.2, 1.1], rotate: [0, 10, -10, 0], y: [0, -10, 0] },
    duration: 0.5,
  },
  encouraging: {
    icon: Heart,
    color: 'from-pink-400 to-rose-400',
    bgColor: 'bg-pink-500/10',
    animation: { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] },
    duration: 0.6,
  },
  celebrating: {
    icon: Zap,
    color: 'from-green-400 to-emerald-400',
    bgColor: 'bg-green-500/10',
    animation: { scale: [1, 1.3, 1.2], rotate: [0, 360], y: [0, -20, 0] },
    duration: 0.8,
  },
  thinking: {
    icon: Target,
    color: 'from-indigo-400 to-blue-400',
    bgColor: 'bg-indigo-500/10',
    animation: { scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] },
    duration: 2,
  },
};

const encouragingPhrases = {
  correct: [
    "Perfect! Keep going! 🌟",
    "You're amazing! 🎉",
    "Brilliant reading! ⭐",
    "Fantastic work! 🎯",
    "You're on fire! 🔥",
  ],
  incorrect: [
    "That's okay, try again! 💪",
    "You've got this! 🌈",
    "Great effort! Keep going! 🌟",
    "Almost there! 💫",
    "Learning is growing! 🌱",
  ],
  streak: [
    "Amazing streak! 🚀",
    "You're unstoppable! ⚡",
    "On fire! Keep it up! 🔥",
    "Incredible! 🌟🌟🌟",
    "Reading champion! 👑",
  ],
};

export const AuraCharacter = ({ state, message, enableVoice = false }: AuraCharacterProps) => {
  const [displayMessage, setDisplayMessage] = useState(message);
  const [speechKey, setSpeechKey] = useState(0);
  const config = stateConfig[state];
  const Icon = config.icon;

  useEffect(() => {
    if (message) {
      setDisplayMessage(message);
      
      // Text-to-speech for encouragement
      if (enableVoice && 'speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(message.replace(/[🌟🎉⭐🎯🔥💪🌈💫🌱🚀⚡👑]/g, ''));
        utterance.rate = 1.1;
        utterance.pitch = 1.2;
        utterance.volume = 0.7;
        
        // Small delay to ensure previous speech is cancelled
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 100);
      }
      
      setSpeechKey(prev => prev + 1);
    }
  }, [message, enableVoice]);

  const getRandomPhrase = (type: keyof typeof encouragingPhrases) => {
    const phrases = encouragingPhrases[type];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        key={state}
        className={`relative ${config.bgColor} rounded-full p-6`}
        animate={config.animation}
        transition={{
          duration: config.duration,
          repeat: state === 'idle' || state === 'thinking' ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {/* Glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-20 blur-xl`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Character icon */}
        <motion.div
          className={`relative z-10 bg-gradient-to-br ${config.color} rounded-full p-4`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className="h-12 w-12 text-white" />
        </motion.div>

        {/* Particle effects for celebrating state */}
        {state === 'celebrating' && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 6) * 50,
                  y: Math.sin((i * Math.PI * 2) / 6) * 50,
                  opacity: [1, 0],
                }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Message bubble */}
      <AnimatePresence mode="wait">
        {displayMessage && (
          <motion.div
            key={speechKey}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-xs"
          >
            <div className={`${config.bgColor} backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-3 shadow-lg`}>
              <p className="text-sm font-medium text-center text-foreground">
                {displayMessage}
              </p>
            </div>
            {/* Speech bubble tail */}
            <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 ${config.bgColor} border-l border-t border-border/50 rotate-45`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper hook for managing AURA character state
export const useAuraCharacterState = () => {
  const [state, setState] = useState<AuraState>('idle');
  const [message, setMessage] = useState<string>('');

  const reactToCorrect = () => {
    setState('excited');
    setMessage(encouragingPhrases.correct[Math.floor(Math.random() * encouragingPhrases.correct.length)]);
    setTimeout(() => setState('idle'), 2000);
  };

  const reactToIncorrect = () => {
    setState('encouraging');
    setMessage(encouragingPhrases.incorrect[Math.floor(Math.random() * encouragingPhrases.incorrect.length)]);
    setTimeout(() => setState('idle'), 3000);
  };

  const reactToStreak = (streakCount: number) => {
    setState('celebrating');
    setMessage(`${streakCount} in a row! ${encouragingPhrases.streak[Math.floor(Math.random() * encouragingPhrases.streak.length)]}`);
    setTimeout(() => setState('idle'), 3000);
  };

  const setThinking = () => {
    setState('thinking');
    setMessage('Listening carefully... 👂');
  };

  const reset = () => {
    setState('idle');
    setMessage('');
  };

  return {
    state,
    message,
    reactToCorrect,
    reactToIncorrect,
    reactToStreak,
    setThinking,
    reset,
  };
};
