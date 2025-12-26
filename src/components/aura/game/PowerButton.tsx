import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PowerButtonProps {
  powerReady: boolean;
  powerCharging: number; // 0-100 percentage
  onActivate: () => void;
  disabled?: boolean;
}

export const PowerButton = ({
  powerReady,
  powerCharging,
  onActivate,
  disabled = false,
}: PowerButtonProps) => {
  return (
    <div className="relative">
      <AnimatePresence>
        {powerReady && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 20px rgba(147, 51, 234, 0.5)',
                '0 0 40px rgba(147, 51, 234, 0.8)',
                '0 0 20px rgba(147, 51, 234, 0.5)',
              ]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>
      
      <Button
        onClick={onActivate}
        disabled={disabled || !powerReady}
        className={`relative w-14 h-14 rounded-full p-0 overflow-hidden transition-all ${
          powerReady 
            ? 'bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 shadow-lg shadow-purple-500/50' 
            : 'bg-muted'
        }`}
      >
        {/* Charge progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted-foreground/20"
          />
          <motion.circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={powerReady ? 'text-purple-300' : 'text-purple-500'}
            strokeDasharray={150.8}
            initial={{ strokeDashoffset: 150.8 }}
            animate={{ strokeDashoffset: 150.8 - (powerCharging / 100) * 150.8 }}
            transition={{ duration: 0.3 }}
          />
        </svg>
        
        {/* Icon */}
        <motion.div
          className="relative z-10"
          animate={powerReady ? { 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0] 
          } : {}}
          transition={{ duration: 0.5, repeat: powerReady ? Infinity : 0 }}
        >
          <Zap className={`w-6 h-6 ${powerReady ? 'text-yellow-300' : 'text-muted-foreground'}`} />
        </motion.div>
        
        {/* Ready label */}
        {powerReady && (
          <motion.span
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-bold text-purple-400 whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            POWER!
          </motion.span>
        )}
      </Button>
    </div>
  );
};
