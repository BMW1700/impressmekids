import { motion } from "framer-motion";
import { useMemo } from "react";

type BackgroundTheme = 'castle' | 'dungeon' | 'forest' | 'throne' | 'volcano' | 'ice_cave';

interface RPGBattleBackgroundProps {
  theme?: BackgroundTheme;
  enemyType?: 'minion' | 'guard' | 'elite' | 'boss' | 'final_boss';
}

export const RPGBattleBackground = ({ 
  theme,
  enemyType = 'minion' 
}: RPGBattleBackgroundProps) => {
  // Auto-select theme based on enemy type if not specified
  const selectedTheme: BackgroundTheme = theme || useMemo(() => {
    switch (enemyType) {
      case 'final_boss': return 'throne';
      case 'boss': return 'volcano';
      case 'elite': return 'dungeon';
      case 'guard': return 'castle';
      default: return 'forest';
    }
  }, [enemyType]);

  // Theme-specific gradients and colors
  const themeStyles = useMemo(() => {
    switch (selectedTheme) {
      case 'throne':
        return {
          sky: 'from-purple-950 via-indigo-900 to-slate-900',
          ground: 'from-slate-800 to-slate-950',
          accent: 'bg-purple-500/20',
          particles: 'bg-purple-400',
          ambientColor: 'rgba(147, 51, 234, 0.3)',
        };
      case 'volcano':
        return {
          sky: 'from-red-950 via-orange-900 to-slate-900',
          ground: 'from-stone-800 to-stone-950',
          accent: 'bg-orange-500/30',
          particles: 'bg-orange-400',
          ambientColor: 'rgba(234, 88, 12, 0.3)',
        };
      case 'dungeon':
        return {
          sky: 'from-slate-950 via-stone-900 to-zinc-900',
          ground: 'from-stone-900 to-zinc-950',
          accent: 'bg-amber-500/10',
          particles: 'bg-amber-300',
          ambientColor: 'rgba(217, 119, 6, 0.2)',
        };
      case 'castle':
        return {
          sky: 'from-blue-950 via-slate-800 to-indigo-900',
          ground: 'from-slate-700 to-slate-900',
          accent: 'bg-blue-400/20',
          particles: 'bg-blue-300',
          ambientColor: 'rgba(59, 130, 246, 0.2)',
        };
      case 'ice_cave':
        return {
          sky: 'from-cyan-950 via-blue-900 to-slate-900',
          ground: 'from-cyan-900 to-slate-950',
          accent: 'bg-cyan-400/20',
          particles: 'bg-cyan-200',
          ambientColor: 'rgba(34, 211, 238, 0.2)',
        };
      case 'forest':
      default:
        return {
          sky: 'from-emerald-950 via-green-900 to-slate-900',
          ground: 'from-green-900 to-slate-950',
          accent: 'bg-emerald-500/20',
          particles: 'bg-emerald-300',
          ambientColor: 'rgba(16, 185, 129, 0.2)',
        };
    }
  }, [selectedTheme]);

  // Generate floating particles
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 6,
      size: 2 + Math.random() * 4,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky Layer */}
      <div className={`absolute inset-0 bg-gradient-to-b ${themeStyles.sky}`} />
      
      {/* Parallax Mountain/Structure Layer - Back */}
      <div className="absolute bottom-[30%] left-0 right-0 h-[40%]">
        <svg viewBox="0 0 1200 200" className="w-full h-full opacity-30" preserveAspectRatio="xMidYMax slice">
          <path 
            d="M0,200 L0,120 Q100,80 200,100 T400,90 T600,110 T800,85 T1000,100 T1200,95 L1200,200 Z" 
            fill="currentColor" 
            className="text-black/40"
          />
        </svg>
      </div>
      
      {/* Parallax Mountain/Structure Layer - Mid */}
      <div className="absolute bottom-[20%] left-0 right-0 h-[40%]">
        <svg viewBox="0 0 1200 200" className="w-full h-full opacity-50" preserveAspectRatio="xMidYMax slice">
          <path 
            d="M0,200 L0,140 Q150,100 300,120 T600,100 T900,115 T1200,105 L1200,200 Z" 
            fill="currentColor" 
            className="text-black/50"
          />
        </svg>
      </div>

      {/* Ground Layer */}
      <div className={`absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t ${themeStyles.ground}`}>
        {/* Ground texture */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_50px,rgba(0,0,0,0.1)_50px,rgba(0,0,0,0.1)_100px)]" />
        </div>
      </div>

      {/* Floor reflection/glow */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[10%] rounded-[100%] blur-2xl"
        style={{ backgroundColor: themeStyles.ambientColor }}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${themeStyles.particles} opacity-60`}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            bottom: '-5%',
          }}
          animate={{
            y: [0, -500],
            opacity: [0, 0.8, 0.8, 0],
            x: [0, Math.sin(particle.id) * 30],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Ambient Light Effects */}
      <motion.div
        className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full ${themeStyles.accent} blur-3xl`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={`absolute top-1/3 right-1/4 w-48 h-48 rounded-full ${themeStyles.accent} blur-3xl`}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Vignette Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Bottom gradient for UI readability */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
    </div>
  );
};
