import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon, Palette } from "lucide-react";
import { getStoredTheme } from "@/lib/gameTheme";

type BackgroundTheme = 'castle' | 'dungeon' | 'forest' | 'throne' | 'volcano' | 'ice_cave' | 'ruins' | 'shadow_realm' | 'caverns' | 'sky_isles' | 'sunken_library' | 'void' | 'underground' | 'neon_district' | 'embassy' | 'syndicate_hq' | 'ember_highlands' | 'crystal_citadel' | 'starfall_peaks' | 'eternal_archive' | 'vault' | 'shadow_protocol' | 'arctic_outpost' | 'labyrinth' | 'project_zero' | 'omega_directive';

interface RPGBattleBackgroundProps {
  theme?: BackgroundTheme;
  enemyType?: string;
  worldNumber?: number;
}

// Map world numbers to world_id in database
const worldToDbId: Record<number, number> = {
  0: 0, // Tutorial
  1: 1, // Enchanted Forest
  2: 2, // Frozen Depths
  3: 3, // Ancient Ruins
  4: 4, // Throne Room
  5: 5, // Whispering Caverns
  6: 6, // Floating Isles
  7: 7, // Sunken Library
  8: 8, // The Void Between
};

// World names for the toggle button
const worldNames: Record<number, string> = {
  0: 'Tutorial',
  1: 'Enchanted Forest',
  2: 'Frozen Depths',
  3: 'Ancient Ruins',
  4: 'Throne Room',
  5: 'Whispering Caverns',
  6: 'Floating Isles',
  7: 'Sunken Library',
  8: 'The Void',
  9: 'Ember Highlands',
  10: 'Crystal Citadel',
  11: 'Starfall Peaks',
  12: 'Eternal Archive',
};

const agentWorldNames: Record<number, string> = {
  0: 'Training Grounds',
  1: 'The Underground',
  2: 'Neon District',
  3: 'The Embassy',
  4: 'Syndicate HQ',
  5: 'The Black Site',
  6: 'Skyfall Station',
  7: 'The Deep Web',
  8: 'Operation Endgame',
  9: 'The Vault',
  10: 'Shadow Protocol',
  11: 'Arctic Outpost',
  12: 'The Labyrinth',
  13: 'Project Zero',
  14: 'Omega Directive',
};

export const RPGBattleBackground = ({ 
  theme,
  enemyType = 'minion',
  worldNumber = 1
}: RPGBattleBackgroundProps) => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Toggle between AI and gradient backgrounds - default to gradient (more reliable)
  const [useAiBackground, setUseAiBackground] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rpg_use_ai_bg') === 'true';
    }
    return false;
  });

  // Get current world name for button display
  const gameTheme = getStoredTheme();
  const currentWorldName = gameTheme === 'agent' 
    ? (agentWorldNames[worldNumber] || 'Unknown Sector')
    : (worldNames[worldNumber] || 'Unknown');

  // Save preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rpg_use_ai_bg', useAiBackground.toString());
    }
  }, [useAiBackground]);

  // Agent mode world-to-DB mapping (IDs 10-14)
  const agentWorldToDbId: Record<number, number> = {
    0: 10, 1: 11, 2: 12, 3: 13, 4: 14,
    5: 15, 6: 16, 7: 17, 8: 18,
    9: 19, 10: 20, 11: 21, 12: 22, 13: 23, 14: 24,
  };

  // Fetch AI-generated background from database
  useEffect(() => {
    const fetchBackground = async () => {
      const dbWorldId = gameTheme === 'agent' 
        ? (agentWorldToDbId[worldNumber] || 11) 
        : (worldToDbId[worldNumber] || 1);
      
      const { data, error } = await supabase
        .from('world_backgrounds')
        .select('image_url')
        .eq('world_id', dbWorldId)
        .single();

      if (!error && data?.image_url) {
        setBackgroundImage(data.image_url);
      }
    };

    fetchBackground();
  }, [worldNumber]);

  // Preload image
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = backgroundImage;
    }
  }, [backgroundImage]);

  // Auto-select theme based on enemy type if not specified
  const selectedTheme: BackgroundTheme = theme || useMemo(() => {
    // Agent mode: select background by world number directly
    const currentTheme = getStoredTheme();
    if (currentTheme === 'agent') {
      const agentWorldThemes: Record<number, BackgroundTheme> = {
        0: 'underground',
        1: 'underground',
        2: 'neon_district',
        3: 'embassy',
        4: 'syndicate_hq',
        5: 'underground',
        6: 'neon_district',
        7: 'embassy',
        8: 'syndicate_hq',
        9: 'vault',
        10: 'shadow_protocol',
        11: 'arctic_outpost',
        12: 'labyrinth',
        13: 'project_zero',
        14: 'omega_directive',
      };
      return agentWorldThemes[worldNumber] || 'underground';
    }
    
    // Classic mode: select by enemy type
    switch (enemyType) {
      case 'final_boss': return 'throne';
      case 'boss': return 'volcano';
      case 'dragon': return 'volcano';
      case 'elite': return 'dungeon';
      case 'guard': return 'castle';
      case 'ice_golem': return 'ice_cave';
      case 'shadow_wraith': return 'shadow_realm';
      case 'stone_guardian': return 'ruins';
      case 'cave_troll': return 'caverns';
      case 'crystal_spider': return 'caverns';
      case 'echo_wraith': return 'caverns';
      case 'storm_harpy': return 'sky_isles';
      case 'cloud_giant': return 'sky_isles';
      case 'zephyr': return 'sky_isles';
      case 'ink_kraken': return 'sunken_library';
      case 'reef_guardian': return 'sunken_library';
      case 'leviathan': return 'sunken_library';
      case 'void_phantom': return 'void';
      case 'reality_shifter': return 'void';
      case 'word_eater': return 'void';
      case 'fire_elemental': case 'lava_hound': case 'ember_drake': return 'ember_highlands';
      case 'crystal_knight': case 'prism_mage': case 'crystal_queen': return 'crystal_citadel';
      case 'star_sprite': case 'comet_wolf': case 'nova_titan': return 'starfall_peaks';
      case 'tome_golem': case 'page_wraith': case 'the_librarian': return 'eternal_archive';
      default: return 'forest';
    }
  }, [enemyType, worldNumber]);

  // Theme-specific gradients and colors (fallback when no image)
  const themeStyles = useMemo(() => {
    switch (selectedTheme) {
      case 'throne':
        return {
          sky: 'from-purple-950 via-indigo-900 to-slate-900',
          ground: 'from-slate-800 to-slate-950',
          accent: 'bg-purple-500/20',
          particles: 'bg-purple-400',
          ambientColor: 'rgba(147, 51, 234, 0.3)',
          specialElements: 'throne',
        };
      case 'volcano':
        return {
          sky: 'from-red-950 via-orange-900 to-slate-900',
          ground: 'from-stone-800 to-stone-950',
          accent: 'bg-orange-500/30',
          particles: 'bg-orange-400',
          ambientColor: 'rgba(234, 88, 12, 0.3)',
          specialElements: 'lava',
        };
      case 'dungeon':
        return {
          sky: 'from-slate-950 via-stone-900 to-zinc-900',
          ground: 'from-stone-900 to-zinc-950',
          accent: 'bg-amber-500/10',
          particles: 'bg-amber-300',
          ambientColor: 'rgba(217, 119, 6, 0.2)',
          specialElements: 'torches',
        };
      case 'castle':
        return {
          sky: 'from-blue-950 via-slate-800 to-indigo-900',
          ground: 'from-slate-700 to-slate-900',
          accent: 'bg-blue-400/20',
          particles: 'bg-blue-300',
          ambientColor: 'rgba(59, 130, 246, 0.2)',
          specialElements: 'banners',
        };
      case 'ice_cave':
        return {
          sky: 'from-cyan-950 via-blue-900 to-slate-900',
          ground: 'from-cyan-900 to-slate-950',
          accent: 'bg-cyan-400/20',
          particles: 'bg-cyan-200',
          ambientColor: 'rgba(34, 211, 238, 0.2)',
          specialElements: 'crystals',
        };
      case 'shadow_realm':
        return {
          sky: 'from-purple-950 via-slate-900 to-black',
          ground: 'from-slate-900 to-black',
          accent: 'bg-purple-500/30',
          particles: 'bg-purple-400',
          ambientColor: 'rgba(147, 51, 234, 0.3)',
          specialElements: 'shadows',
        };
      case 'ruins':
        return {
          sky: 'from-amber-950 via-stone-800 to-slate-900',
          ground: 'from-stone-700 to-stone-950',
          accent: 'bg-amber-500/20',
          particles: 'bg-amber-300',
          ambientColor: 'rgba(217, 119, 6, 0.25)',
          specialElements: 'pillars',
        };
      case 'caverns':
        return {
          sky: 'from-slate-950 via-stone-900 to-zinc-950',
          ground: 'from-stone-800 to-zinc-900',
          accent: 'bg-violet-500/20',
          particles: 'bg-violet-300',
          ambientColor: 'rgba(139, 92, 246, 0.25)',
          specialElements: 'crystals',
        };
      case 'sky_isles':
        return {
          sky: 'from-sky-400 via-blue-500 to-indigo-600',
          ground: 'from-white/20 to-blue-200/30',
          accent: 'bg-white/30',
          particles: 'bg-white',
          ambientColor: 'rgba(255, 255, 255, 0.3)',
          specialElements: 'clouds',
        };
      case 'sunken_library':
        return {
          sky: 'from-teal-900 via-cyan-800 to-blue-950',
          ground: 'from-teal-800 to-blue-900',
          accent: 'bg-cyan-400/20',
          particles: 'bg-cyan-300',
          ambientColor: 'rgba(34, 211, 238, 0.25)',
          specialElements: 'bubbles',
        };
      case 'void':
        return {
          sky: 'from-purple-950 via-violet-950 to-black',
          ground: 'from-black to-purple-950/50',
          accent: 'bg-violet-500/40',
          particles: 'bg-violet-400',
          ambientColor: 'rgba(139, 92, 246, 0.4)',
          specialElements: 'void',
        };
      // Agent mode themes
      case 'underground':
        return {
          sky: 'from-zinc-950 via-stone-900 to-neutral-950',
          ground: 'from-stone-800 to-zinc-950',
          accent: 'bg-amber-500/15',
          particles: 'bg-amber-200',
          ambientColor: 'rgba(217, 119, 6, 0.15)',
          specialElements: 'torches',
        };
      case 'neon_district':
        return {
          sky: 'from-slate-950 via-indigo-950 to-purple-950',
          ground: 'from-slate-900 to-indigo-950',
          accent: 'bg-cyan-500/25',
          particles: 'bg-cyan-400',
          ambientColor: 'rgba(6, 182, 212, 0.3)',
          specialElements: 'neon',
        };
      case 'embassy':
        return {
          sky: 'from-slate-900 via-blue-950 to-slate-950',
          ground: 'from-slate-800 to-blue-950',
          accent: 'bg-blue-400/15',
          particles: 'bg-blue-200',
          ambientColor: 'rgba(59, 130, 246, 0.15)',
          specialElements: 'banners',
        };
      case 'syndicate_hq':
        return {
          sky: 'from-red-950 via-slate-950 to-black',
          ground: 'from-slate-900 to-red-950',
          accent: 'bg-red-500/25',
          particles: 'bg-red-400',
          ambientColor: 'rgba(239, 68, 68, 0.25)',
          specialElements: 'shadows',
        };
      case 'ember_highlands':
        return {
          sky: 'from-red-950 via-orange-900 to-amber-900',
          ground: 'from-stone-800 to-red-950',
          accent: 'bg-orange-500/30',
          particles: 'bg-orange-400',
          ambientColor: 'rgba(249, 115, 22, 0.3)',
          specialElements: 'lava',
        };
      case 'crystal_citadel':
        return {
          sky: 'from-violet-950 via-fuchsia-900 to-purple-900',
          ground: 'from-purple-800 to-violet-950',
          accent: 'bg-fuchsia-400/25',
          particles: 'bg-fuchsia-300',
          ambientColor: 'rgba(232, 121, 249, 0.3)',
          specialElements: 'crystals',
        };
      case 'starfall_peaks':
        return {
          sky: 'from-indigo-950 via-blue-950 to-violet-950',
          ground: 'from-indigo-900 to-slate-950',
          accent: 'bg-yellow-400/20',
          particles: 'bg-yellow-200',
          ambientColor: 'rgba(253, 230, 138, 0.25)',
          specialElements: 'void',
        };
      case 'eternal_archive':
        return {
          sky: 'from-stone-950 via-amber-950 to-yellow-950',
          ground: 'from-stone-900 to-amber-950',
          accent: 'bg-emerald-500/20',
          particles: 'bg-emerald-300',
          ambientColor: 'rgba(34, 197, 94, 0.2)',
          specialElements: 'torches',
        };
      case 'forest':
      default:
        return {
          sky: 'from-emerald-950 via-green-900 to-slate-900',
          ground: 'from-green-900 to-slate-950',
          accent: 'bg-emerald-500/20',
          particles: 'bg-emerald-300',
          ambientColor: 'rgba(16, 185, 129, 0.2)',
          specialElements: 'trees',
        };
    }
  }, [selectedTheme]);

  // Generate floating particles
  const particleCount = selectedTheme === 'void' ? 40 : selectedTheme === 'sky_isles' ? 30 : 20;
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 6,
      size: selectedTheme === 'void' ? 1 + Math.random() * 3 : 2 + Math.random() * 4,
    }));
  }, [particleCount, selectedTheme]);

  // Special elements based on theme
  const renderSpecialElements = () => {
    switch (themeStyles.specialElements) {
      case 'bubbles':
        return (
          <>
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={`bubble-${i}`}
                className="absolute rounded-full border border-cyan-300/50 bg-cyan-200/10"
                style={{
                  width: 10 + Math.random() * 20,
                  height: 10 + Math.random() * 20,
                  left: `${Math.random() * 100}%`,
                  bottom: '-10%',
                }}
                animate={{
                  y: [-50, -600],
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 8 + Math.random() * 4,
                  delay: Math.random() * 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </>
        );
      case 'clouds':
        return (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={`cloud-${i}`}
                className="absolute bg-white/40 rounded-full blur-xl"
                style={{
                  width: 100 + Math.random() * 150,
                  height: 40 + Math.random() * 40,
                  left: `${i * 20}%`,
                  top: `${20 + Math.random() * 30}%`,
                }}
                animate={{
                  x: [0, 50, 0],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 10 + Math.random() * 5,
                  delay: i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </>
        );
      case 'void':
        return (
          <>
            {/* Reality tears */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`tear-${i}`}
                className="absolute bg-gradient-to-b from-violet-500/50 via-purple-600/30 to-transparent"
                style={{
                  width: 2,
                  height: 50 + Math.random() * 100,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 60}%`,
                  transform: `rotate(${Math.random() * 30 - 15}deg)`,
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scaleY: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
            {/* Stars/void particles */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute rounded-full bg-white"
                style={{
                  width: 1 + Math.random() * 2,
                  height: 1 + Math.random() * 2,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </>
        );
      case 'crystals':
        return (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`crystal-${i}`}
                className="absolute"
                style={{
                  left: `${i * 12 + 5}%`,
                  bottom: `${10 + Math.random() * 15}%`,
                }}
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div 
                  className="w-4 h-16 bg-gradient-to-t from-violet-600/60 via-purple-400/40 to-transparent"
                  style={{ 
                    clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                    transform: `rotate(${Math.random() * 20 - 10}deg)`,
                  }}
                />
              </motion.div>
            ))}
          </>
        );
      case 'neon':
        return (
          <>
            {/* Neon signs */}
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={`neon-${i}`}
                className="absolute rounded-sm"
                style={{
                  width: 30 + Math.random() * 60,
                  height: 8 + Math.random() * 12,
                  left: `${10 + i * 18}%`,
                  top: `${20 + Math.random() * 30}%`,
                  background: ['#22D3EE', '#A855F7', '#F43F5E', '#10B981', '#F59E0B'][i],
                  opacity: 0.3,
                  filter: `blur(${1 + Math.random() * 2}px)`,
                }}
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
            {/* Digital rain effect */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={`rain-${i}`}
                className="absolute text-cyan-500/30 text-[8px] font-mono"
                style={{
                  left: `${5 + i * 8}%`,
                  top: '-5%',
                }}
                animate={{
                  y: [0, 500],
                  opacity: [0, 0.4, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  delay: Math.random() * 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {Array.from({ length: 8 }).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
              </motion.div>
            ))}
          </>
        );
      default:
        return null;
    }
  };

  const showAiImage = useAiBackground && backgroundImage && imageLoaded;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background Toggle Button - Below title area */}
      <motion.button
        className="absolute top-16 right-3 z-50 p-2 rounded-lg bg-slate-900/70 border border-slate-600/50 
          hover:bg-slate-800/80 transition-colors flex items-center gap-2"
        onClick={() => setUseAiBackground(!useAiBackground)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={useAiBackground ? `Switch to Classic ${currentWorldName}` : `Switch to ${currentWorldName}`}
      >
        {useAiBackground ? (
          <>
            <Palette className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-purple-300 hidden sm:inline">{currentWorldName}</span>
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-cyan-300 hidden sm:inline">{currentWorldName}</span>
          </>
        )}
      </motion.button>

      {/* AI-Generated Background Image (if available and enabled) */}
      {showAiImage && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={backgroundImage}
            alt="Battle Background"
            className="w-full h-full object-cover"
          />
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>
      )}

      {/* Gradient background (shows when AI is disabled or not loaded) */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: showAiImage ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
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
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_50px,rgba(0,0,0,0.1)_50px,rgba(0,0,0,0.1)_100px)]" />
          </div>
        </div>
      </motion.div>

      {/* Special Theme Elements (always visible for atmosphere) */}
      {renderSpecialElements()}

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
