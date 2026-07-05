import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Sparkles, Shield, Package, HelpCircle, 
  ChevronRight, Volume2, VolumeX, ArrowRight, Trophy,
  Users, BarChart3, Gamepad2, Sword
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  message: string;
  highlight?: 'read' | 'magic' | 'defend' | 'items' | 'none';
  icon: React.ReactNode;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome, Young Reader!',
    message: "Welcome to YubiLearn! This game will make you an INCREDIBLE reader while having tons of fun! Let me show you how it works!",
    highlight: 'none',
    icon: <Sparkles className="h-8 w-8 text-yellow-400" />,
  },
  {
    id: 'words_offense',
    title: 'Words Are Your Offense!',
    message: "In this game, reading words is your OFFENSE! Every word you read correctly deals DAMAGE to the enemy. The more you read, the stronger you become!",
    highlight: 'none',
    icon: <Sword className="h-8 w-8 text-red-400" />,
  },
  {
    id: 'read_button',
    title: 'The READ Button',
    message: "Click READ to start reading words from the story. Speak each word clearly - when you get it right, you'll attack the enemy! Build streaks for MEGA damage!",
    highlight: 'read',
    icon: <BookOpen className="h-8 w-8 text-emerald-400" />,
  },
  {
    id: 'magic_button',
    title: 'The MAGIC Button',
    message: "MAGIC unleashes powerful spells! When you build up reading streaks, your spells become even stronger. Fire, Ice, and Lightning await!",
    highlight: 'magic',
    icon: <Sparkles className="h-8 w-8 text-purple-400" />,
  },
  {
    id: 'defend_button',
    title: 'The DEFEND Button',
    message: "DEFEND protects you when enemies attack! Sometimes enemies will throw mini-games at you - reading words defends you from their attacks!",
    highlight: 'defend',
    icon: <Shield className="h-8 w-8 text-blue-400" />,
  },
  {
    id: 'items_button',
    title: 'The ITEMS Button',
    message: "ITEMS help you in battle! Health potions heal you, magic potions restore your power. Use them wisely to survive tough fights!",
    highlight: 'items',
    icon: <Package className="h-8 w-8 text-amber-400" />,
  },
  {
    id: 'mini_games',
    title: 'Exciting Mini-Games!',
    message: "During battles, special mini-games will appear! Goblin Horde, Word Shield, Speed Blitz and more! Keep reading to win them all!",
    highlight: 'none',
    icon: <Gamepad2 className="h-8 w-8 text-pink-400" />,
  },
  {
    id: 'progress_tracking',
    title: 'Your Progress Matters!',
    message: "Every battle you play helps you improve! This game tracks your reading progress and helps make you better. Your teacher and parents can see how amazing you're doing!",
    highlight: 'none',
    icon: <BarChart3 className="h-8 w-8 text-cyan-400" />,
  },
  {
    id: 'ready',
    title: "You're Ready!",
    message: "That's everything! Remember: READ to attack, DEFEND against enemies, use MAGIC for power moves, and grab ITEMS when needed. Now go rescue those books! 📚",
    highlight: 'none',
    icon: <Trophy className="h-8 w-8 text-yellow-400" />,
  },
];

interface RPGTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export const RPGTutorial = ({ isOpen, onComplete, onBack }: RPGTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState<Set<number>>(new Set());

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  // Auto-play welcome on first load
  useEffect(() => {
    if (isOpen && currentStep === 0 && !hasPlayedAudio.has(0)) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        playStepAudio();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const playStepAudio = useCallback(async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setHasPlayedAudio(prev => new Set([...prev, currentStep]));
    
    // Use browser speech synthesis for tutorial (simple and works everywhere)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(step.message);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, step.message, isPlaying]);

  const stopAudio = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  const nextStep = useCallback(() => {
    stopAudio();
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, onComplete, stopAudio]);

  const prevStep = useCallback(() => {
    stopAudio();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, stopAudio]);

  // Auto-play audio when step changes
  useEffect(() => {
    if (isOpen && !hasPlayedAudio.has(currentStep)) {
      const timer = setTimeout(() => {
        playStepAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        {/* Tutorial Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="w-full max-w-2xl bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="h-2 bg-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Icon */}
            <motion.div
              key={step.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg"
            >
              {step.icon}
            </motion.div>

            {/* Title */}
            <motion.h2
              key={`title-${step.id}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl md:text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4"
            >
              {step.title}
            </motion.h2>

            {/* Message */}
            <motion.p
              key={`msg-${step.id}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-center text-slate-300 mb-6 leading-relaxed"
            >
              {step.message}
            </motion.p>

            {/* Highlighted Button Preview */}
            {step.highlight && step.highlight !== 'none' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-6"
              >
                <div className={`
                  px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2
                  ${step.highlight === 'read' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : ''}
                  ${step.highlight === 'magic' ? 'bg-gradient-to-r from-purple-500 to-violet-600' : ''}
                  ${step.highlight === 'defend' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : ''}
                  ${step.highlight === 'items' ? 'bg-gradient-to-r from-amber-500 to-orange-600' : ''}
                  animate-pulse shadow-lg
                `}>
                  {step.highlight === 'read' && <BookOpen className="h-5 w-5" />}
                  {step.highlight === 'magic' && <Sparkles className="h-5 w-5" />}
                  {step.highlight === 'defend' && <Shield className="h-5 w-5" />}
                  {step.highlight === 'items' && <Package className="h-5 w-5" />}
                  {step.highlight.toUpperCase()}
                </div>
              </motion.div>
            )}

            {/* Audio Control */}
            <div className="flex justify-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={isPlaying ? stopAudio : playStepAudio}
                className="text-slate-400 hover:text-white"
              >
                {isPlaying ? (
                  <>
                    <VolumeX className="h-4 w-4 mr-2" />
                    Stop Audio
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Hear Again
                  </>
                )}
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={currentStep === 0 ? onBack : prevStep}
                className="text-slate-400 hover:text-white"
              >
                {currentStep === 0 ? 'Back to Map' : 'Previous'}
              </Button>

              <div className="flex gap-1">
                {tutorialSteps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentStep 
                        ? 'bg-purple-500' 
                        : idx < currentStep 
                          ? 'bg-purple-500/50' 
                          : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                {isLastStep ? (
                  <>
                    Start Playing!
                    <Trophy className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Help Button (always visible) */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-4 right-4 p-3 rounded-full bg-purple-600/50 hover:bg-purple-600/80 transition-colors"
          title="Replay Tutorial"
        >
          <HelpCircle className="h-6 w-6 text-white" />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};