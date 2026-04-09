import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface EmojiPopup {
  id: number;
  emoji: string;
  word: string;
  x: number;
  y: number;
  startX?: number;
  startY?: number;
}

interface RPGEmojiPopProps {
  emoji: string;
  word: string;
  initialOffsetX?: number;
  initialOffsetY?: number;
  onComplete?: () => void;
}

// Single emoji popup animation
export const RPGEmojiPop = ({
  emoji,
  word,
  initialOffsetX = 0,
  initialOffsetY = 0,
  onComplete,
}: RPGEmojiPopProps) => {
  const [phase, setPhase] = useState<'rising' | 'popping' | 'done'>('rising');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const popTimer = setTimeout(() => {
      setPhase('popping');
    }, 1200);

    const completeTimer = setTimeout(() => {
      setPhase('done');
      onCompleteRef.current?.();
    }, 1800);

    return () => {
      clearTimeout(popTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <motion.div
      className="pointer-events-none relative z-[100]"
      initial={{ 
        opacity: 0, 
        scale: 0.5, 
        x: initialOffsetX,
        y: initialOffsetY,
      }}
      animate={phase === 'rising' ? { 
        opacity: 1, 
        scale: 1, 
        x: 0,
        y: 0,
        rotate: [0, -5, 5, -3, 3, 0],
      } : {
        scale: [1, 1.5, 0],
        opacity: [1, 1, 0],
      }}
      transition={phase === 'rising' ? { 
        duration: 1.2, 
        ease: "easeOut",
        rotate: { duration: 0.8, repeat: Infinity }
      } : {
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      {/* Bubble container */}
      <motion.div
        className="relative flex flex-col items-center"
        animate={{ 
          x: [0, 8, -8, 6, -6, 0],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Bubble background */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-sm"
          style={{
            width: 100,
            height: 100,
            left: -50,
            top: -20,
          }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(255,255,255,0.3), inset 0 0 20px rgba(255,255,255,0.2)',
              '0 0 40px rgba(255,255,255,0.5), inset 0 0 30px rgba(255,255,255,0.3)',
              '0 0 20px rgba(255,255,255,0.3), inset 0 0 20px rgba(255,255,255,0.2)',
            ],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        
        {/* Bubble shine */}
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-white/60"
          style={{ top: -15, left: -30 }}
        />
        
        {/* Emoji */}
        <motion.span 
          className="text-6xl relative z-10 drop-shadow-lg"
          animate={phase === 'popping' ? { 
            scale: [1, 1.3, 0],
            rotate: [0, 15, -15, 0],
          } : {}}
        >
          {emoji}
        </motion.span>
        
        {/* Word label */}
        <motion.div
          className="mt-2 px-3 py-1 bg-slate-900/80 rounded-full border border-white/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-white font-bold text-sm tracking-wide uppercase">
            {word}
          </span>
        </motion.div>
      </motion.div>

      {/* Pop particles */}
      <AnimatePresence>
        {phase === 'popping' && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: `hsl(${i * 45}, 80%, 60%)`,
                  left: 0,
                  top: 0,
                }}
                initial={{ scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 80,
                  y: Math.sin((i / 8) * Math.PI * 2) * 80 - 40,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            ))}
            {/* Sparkles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-2xl"
                style={{
                  left: 0,
                  top: 0,
                }}
                initial={{ scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 12) * Math.PI * 2) * 100,
                  y: Math.sin((i / 12) * Math.PI * 2) * 100 - 30,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.02 }}
              >
                ✨
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Manager component that handles multiple emoji popups
interface RPGEmojiManagerProps {
  popups: EmojiPopup[];
  onPopupComplete: (id: number) => void;
}

export const RPGEmojiManager = ({ popups, onPopupComplete }: RPGEmojiManagerProps) => {
  return (
    <AnimatePresence>
      {popups.map(popup => (
        <motion.div
          key={popup.id}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: popup.x,
            top: popup.y,
            zIndex: 100,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <RPGEmojiPop
            emoji={popup.emoji}
            word={popup.word}
            initialOffsetX={(popup.startX ?? popup.x) - popup.x}
            initialOffsetY={(popup.startY ?? popup.y) - popup.y}
            onComplete={() => onPopupComplete(popup.id)}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export type { EmojiPopup };
