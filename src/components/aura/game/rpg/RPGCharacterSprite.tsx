import { motion } from "framer-motion";

type CharacterType = 'knight' | 'wizard' | 'goblin' | 'boss' | 'sorcerer' | 'dragon' | 'ice_golem' | 'shadow_wraith' | 'stone_guardian' | 'agent_x' | 'cipher' | 'shadow_agent' | 'wiggleworm' | 'bouncer' | 'echo_blob';

interface RPGCharacterSpriteProps {
  type: CharacterType;
  isEnemy?: boolean;
  isAttacking?: boolean;
  isTakingDamage?: boolean;
  isDefending?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Verb/phrase currently being acted out (Pre-K). Drives arm + leg motion. */
  action?: string | null;
  /** Bump on each new verb trigger so identical actions replay. */
  actionNonce?: number;
}

export const RPGCharacterSprite = ({
  type,
  isEnemy = false,
  isAttacking = false,
  isTakingDamage = false,
  isDefending = false,
  size = 'md',
  action = null,
  actionNonce = 0,
}: RPGCharacterSpriteProps) => {
  const sizeClasses = {
    sm: 'w-20 h-24',
    md: 'w-28 h-36 md:w-36 md:h-44',
    lg: 'w-40 h-48 md:w-48 md:h-56',
  };

  const renderKnight = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Body/Armor */}
      <div className="absolute inset-x-[15%] top-[25%] bottom-[10%] 
        bg-gradient-to-b from-blue-400 via-blue-500 to-blue-700 
        rounded-t-[30%] rounded-b-[10%]
        shadow-[inset_-5px_-5px_20px_rgba(0,0,0,0.4),inset_5px_5px_10px_rgba(255,255,255,0.2)]"
        style={{ transform: 'perspective(100px) rotateY(-5deg)' }}>
        {/* Chest Plate Detail */}
        <div className="absolute top-[10%] left-[20%] right-[20%] h-[40%]
          bg-gradient-to-br from-slate-300 to-slate-500 rounded-lg
          shadow-[inset_2px_2px_4px_rgba(255,255,255,0.5)]" />
        {/* Belt */}
        <div className="absolute bottom-[30%] left-0 right-0 h-[8%]
          bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700" />
      </div>
      
      {/* Helmet */}
      <div className="absolute top-[5%] left-[20%] right-[20%] h-[25%]
        bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500
        rounded-t-[50%] rounded-b-[20%]
        shadow-[inset_-3px_-3px_10px_rgba(0,0,0,0.3),inset_3px_3px_8px_rgba(255,255,255,0.4)]"
        style={{ transform: 'perspective(100px) rotateX(10deg)' }}>
        {/* Visor */}
        <div className="absolute bottom-[20%] left-[15%] right-[15%] h-[25%]
          bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded" />
        {/* Plume */}
        <div className="absolute -top-[40%] left-[30%] right-[30%] h-[60%]
          bg-gradient-to-t from-red-600 to-red-400 rounded-t-full
          shadow-lg" />
      </div>
      
      {/* Sword (Right Hand) */}
      <div className="absolute right-[-5%] top-[30%] w-[20%] h-[50%]"
        style={{ transform: 'rotate(-25deg)' }}>
        {/* Blade */}
        <div className="absolute top-0 left-[30%] w-[40%] h-[70%]
          bg-gradient-to-t from-slate-300 via-white to-slate-200
          shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
          style={{ clipPath: 'polygon(20% 0, 80% 0, 90% 100%, 10% 100%)' }} />
        {/* Handle */}
        <div className="absolute bottom-[5%] left-[25%] w-[50%] h-[30%]
          bg-gradient-to-b from-amber-800 to-amber-900 rounded-b" />
        {/* Guard */}
        <div className="absolute top-[65%] left-0 right-0 h-[8%]
          bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 rounded" />
      </div>
      
      {/* Shield (Left Hand) */}
      <div className="absolute left-[-10%] top-[35%] w-[35%] h-[40%]
        bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900
        rounded-[20%] shadow-lg
        border-2 border-yellow-500"
        style={{ transform: 'perspective(50px) rotateY(15deg)' }}>
        {/* Emblem */}
        <div className="absolute inset-[25%]
          bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full
          shadow-inner" />
      </div>
      
      {/* Cape */}
      <div className="absolute top-[20%] left-[10%] right-[10%] bottom-0 -z-10
        bg-gradient-to-b from-blue-800 to-blue-900
        rounded-b-[30%]"
        style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)' }} />
    </div>
  );

  const renderWizard = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Robe */}
      <div className="absolute inset-x-[10%] top-[20%] bottom-[5%]
        bg-gradient-to-b from-purple-600 via-purple-700 to-purple-900
        rounded-t-[20%] rounded-b-[30%]
        shadow-[inset_-5px_-5px_15px_rgba(0,0,0,0.4),inset_3px_3px_10px_rgba(255,255,255,0.1)]">
        {/* Robe Pattern */}
        <div className="absolute top-[20%] left-[30%] right-[30%] h-[3%]
          bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
        <div className="absolute bottom-[40%] left-[35%] right-[35%] h-[3%]
          bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
      </div>
      
      {/* Hood/Head */}
      <div className="absolute top-[5%] left-[15%] right-[15%] h-[25%]
        bg-gradient-to-b from-purple-500 to-purple-700
        rounded-[50%]
        shadow-[inset_-3px_-3px_10px_rgba(0,0,0,0.4)]">
        {/* Face */}
        <div className="absolute bottom-[10%] left-[20%] right-[20%] h-[50%]
          bg-gradient-to-b from-amber-200 to-amber-300 rounded-full" />
      </div>
      
      {/* Wizard Hat */}
      <div className="absolute -top-[15%] left-[25%] right-[25%] h-[35%]
        bg-gradient-to-t from-purple-700 to-purple-500
        shadow-lg"
        style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
        {/* Hat Band */}
        <div className="absolute bottom-[15%] left-0 right-0 h-[15%]
          bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600" />
        {/* Star on Hat */}
        <div className="absolute bottom-[25%] left-[35%] text-yellow-400 text-sm">✦</div>
      </div>
      
      {/* Staff */}
      <div className="absolute right-[-15%] top-[10%] w-[15%] h-[80%]"
        style={{ transform: 'rotate(15deg)' }}>
        {/* Shaft */}
        <div className="absolute inset-x-[25%] top-[15%] bottom-0
          bg-gradient-to-b from-amber-700 to-amber-900
          rounded-full" />
        {/* Orb */}
        <div className="absolute top-0 left-0 right-0 aspect-square
          bg-gradient-to-br from-cyan-300 via-purple-400 to-pink-400
          rounded-full
          shadow-[0_0_20px_rgba(168,85,247,0.6)]
          animate-pulse" />
      </div>
      
      {/* Magical Aura */}
      <motion.div 
        className="absolute inset-0 rounded-full
          bg-gradient-to-b from-purple-400/20 to-transparent
          pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </div>
  );

  const renderGoblin = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Body */}
      <div className="absolute inset-x-[15%] top-[30%] bottom-[10%]
        bg-gradient-to-b from-green-500 via-green-600 to-green-800
        rounded-[30%]
        shadow-[inset_-4px_-4px_15px_rgba(0,0,0,0.4),inset_3px_3px_8px_rgba(255,255,255,0.1)]">
        {/* Leather Vest */}
        <div className="absolute top-[15%] left-[10%] right-[10%] h-[50%]
          bg-gradient-to-b from-amber-900 to-amber-950
          rounded-lg border border-amber-700/50" />
      </div>
      
      {/* Head */}
      <div className="absolute top-[5%] left-[20%] right-[20%] h-[30%]
        bg-gradient-to-b from-green-400 to-green-600
        rounded-[60%_60%_50%_50%]
        shadow-[inset_-3px_-3px_10px_rgba(0,0,0,0.3)]">
        {/* Ears */}
        <div className="absolute top-[20%] -left-[30%] w-[40%] h-[40%]
          bg-gradient-to-br from-green-400 to-green-600
          rounded-full"
          style={{ transform: 'rotate(-30deg)' }} />
        <div className="absolute top-[20%] -right-[30%] w-[40%] h-[40%]
          bg-gradient-to-bl from-green-400 to-green-600
          rounded-full"
          style={{ transform: 'rotate(30deg)' }} />
        {/* Eyes */}
        <div className="absolute top-[35%] left-[15%] w-[25%] h-[30%]
          bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full">
          <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] bg-black rounded-full" />
        </div>
        <div className="absolute top-[35%] right-[15%] w-[25%] h-[30%]
          bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full">
          <div className="absolute top-[30%] right-[40%] w-[40%] h-[40%] bg-black rounded-full" />
        </div>
        {/* Mouth */}
        <div className="absolute bottom-[10%] left-[25%] right-[25%] h-[15%]
          bg-gradient-to-b from-red-900 to-red-950 rounded-b-lg" />
      </div>
      
      {/* Weapon (Dagger) */}
      <div className="absolute right-[-5%] top-[45%] w-[25%] h-[35%]"
        style={{ transform: 'rotate(-20deg)' }}>
        <div className="absolute inset-x-[30%] top-0 h-[60%]
          bg-gradient-to-t from-slate-400 to-slate-200
          shadow-lg"
          style={{ clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0% 100%)' }} />
        <div className="absolute bottom-0 left-[20%] w-[60%] h-[35%]
          bg-gradient-to-b from-amber-800 to-amber-950 rounded-b" />
      </div>
    </div>
  );

  const renderBoss = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Large Body with Armor */}
      <div className="absolute inset-x-[5%] top-[25%] bottom-[5%]
        bg-gradient-to-b from-green-600 via-green-700 to-green-900
        rounded-[25%]
        shadow-[inset_-6px_-6px_20px_rgba(0,0,0,0.5),inset_4px_4px_10px_rgba(255,255,255,0.1)]">
        {/* Chest Armor */}
        <div className="absolute top-[10%] left-[15%] right-[15%] h-[40%]
          bg-gradient-to-br from-slate-600 to-slate-800
          rounded-lg border-2 border-slate-500
          shadow-lg" />
        {/* Skull Emblem */}
        <div className="absolute top-[18%] left-[35%] right-[35%] h-[25%]
          bg-gradient-to-b from-slate-200 to-slate-400 rounded-full">
          <div className="absolute top-[25%] left-[15%] w-[25%] h-[25%] bg-black rounded-full" />
          <div className="absolute top-[25%] right-[15%] w-[25%] h-[25%] bg-black rounded-full" />
        </div>
      </div>
      
      {/* Head with Crown */}
      <div className="absolute top-[0%] left-[15%] right-[15%] h-[30%]
        bg-gradient-to-b from-green-500 to-green-700
        rounded-[50%]
        shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.4)]">
        {/* Large Ears */}
        <div className="absolute top-[15%] -left-[35%] w-[45%] h-[50%]
          bg-gradient-to-br from-green-500 to-green-700 rounded-[80%]"
          style={{ transform: 'rotate(-40deg)' }} />
        <div className="absolute top-[15%] -right-[35%] w-[45%] h-[50%]
          bg-gradient-to-bl from-green-500 to-green-700 rounded-[80%]"
          style={{ transform: 'rotate(40deg)' }} />
        {/* Evil Eyes */}
        <div className="absolute top-[40%] left-[12%] w-[28%] h-[35%]
          bg-gradient-to-b from-red-400 to-red-600 rounded-full
          shadow-[0_0_10px_rgba(239,68,68,0.6)]">
          <div className="absolute top-[25%] left-[35%] w-[35%] h-[40%] bg-black rounded-full" />
        </div>
        <div className="absolute top-[40%] right-[12%] w-[28%] h-[35%]
          bg-gradient-to-b from-red-400 to-red-600 rounded-full
          shadow-[0_0_10px_rgba(239,68,68,0.6)]">
          <div className="absolute top-[25%] right-[35%] w-[35%] h-[40%] bg-black rounded-full" />
        </div>
      </div>
      
      {/* Crown */}
      <div className="absolute -top-[10%] left-[20%] right-[20%] h-[20%]
        bg-gradient-to-t from-yellow-600 to-yellow-500
        shadow-lg"
        style={{ clipPath: 'polygon(0% 100%, 15% 30%, 30% 100%, 50% 0%, 70% 100%, 85% 30%, 100% 100%)' }}>
        {/* Gems */}
        <div className="absolute bottom-[40%] left-[45%] w-[10%] aspect-square
          bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg" />
      </div>
      
      {/* Massive Club */}
      <div className="absolute right-[-20%] top-[20%] w-[30%] h-[70%]"
        style={{ transform: 'rotate(-15deg)' }}>
        <div className="absolute top-0 inset-x-[10%] h-[40%]
          bg-gradient-to-t from-amber-900 to-amber-800
          rounded-[40%]
          shadow-lg">
          {/* Spikes */}
          <div className="absolute top-[10%] -left-[20%] w-[25%] h-[20%]
            bg-gradient-to-l from-slate-400 to-slate-300 rounded-l-full" />
          <div className="absolute top-[10%] -right-[20%] w-[25%] h-[20%]
            bg-gradient-to-r from-slate-400 to-slate-300 rounded-r-full" />
        </div>
        <div className="absolute bottom-0 left-[30%] w-[40%] h-[55%]
          bg-gradient-to-b from-amber-800 to-amber-950 rounded-b" />
      </div>
    </div>
  );

  const renderSorcerer = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Dark Robes */}
      <div className="absolute inset-x-[5%] top-[15%] bottom-[5%]
        bg-gradient-to-b from-purple-900 via-slate-900 to-black
        rounded-t-[25%] rounded-b-[40%]
        shadow-[inset_-6px_-6px_20px_rgba(0,0,0,0.6),0_0_30px_rgba(147,51,234,0.4)]">
        {/* Rune Patterns */}
        <div className="absolute top-[25%] left-[20%] right-[20%] h-[3%]
          bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70" />
        <div className="absolute top-[45%] left-[25%] right-[25%] h-[2%]
          bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
      </div>
      
      {/* Hood */}
      <div className="absolute top-[5%] left-[10%] right-[10%] h-[20%]
        bg-gradient-to-b from-slate-800 to-slate-900
        rounded-[60%]
        shadow-[inset_-4px_-4px_15px_rgba(0,0,0,0.5)]">
        {/* Glowing Eyes */}
        <div className="absolute top-[40%] left-[25%] w-[15%] h-[30%]
          bg-gradient-to-b from-purple-400 to-purple-600 rounded-full
          shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
        <div className="absolute top-[40%] right-[25%] w-[15%] h-[30%]
          bg-gradient-to-b from-purple-400 to-purple-600 rounded-full
          shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
      </div>
      
      {/* Dark Energy Orb */}
      <motion.div 
        className="absolute top-[30%] left-[30%] right-[30%] aspect-square
          bg-gradient-to-br from-purple-600 via-black to-purple-800
          rounded-full
          shadow-[0_0_40px_rgba(147,51,234,0.6),inset_0_0_20px_rgba(0,0,0,0.8)]"
        animate={{ 
          boxShadow: [
            '0 0 40px rgba(147,51,234,0.6), inset 0 0 20px rgba(0,0,0,0.8)',
            '0 0 60px rgba(147,51,234,0.9), inset 0 0 20px rgba(0,0,0,0.8)',
            '0 0 40px rgba(147,51,234,0.6), inset 0 0 20px rgba(0,0,0,0.8)'
          ]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {/* Inner Energy */}
        <motion.div 
          className="absolute inset-[20%] bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full opacity-60"
          animate={{ scale: [0.8, 1, 0.8], opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </motion.div>
      
      {/* Floating Runes */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 text-purple-400 text-xs font-bold"
          style={{
            left: `${20 + i * 20}%`,
            top: '60%',
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            delay: i * 0.4,
          }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );

  const renderDragon = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Dragon Body */}
      <div className="absolute inset-x-[5%] top-[25%] bottom-[5%]
        bg-gradient-to-b from-orange-600 via-red-700 to-red-900
        rounded-[30%]
        shadow-[inset_-6px_-6px_20px_rgba(0,0,0,0.5),0_0_30px_rgba(249,115,22,0.4)]">
        {/* Scales */}
        <div className="absolute top-[15%] left-[20%] right-[20%] h-[60%]
          bg-gradient-to-b from-orange-500/30 to-transparent rounded-full" />
      </div>
      
      {/* Dragon Head */}
      <div className="absolute top-[0%] left-[15%] right-[15%] h-[30%]
        bg-gradient-to-b from-orange-500 to-red-700
        rounded-[50%_50%_40%_40%]
        shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.4)]">
        {/* Snout */}
        <div className="absolute bottom-[-10%] left-[30%] right-[30%] h-[40%]
          bg-gradient-to-b from-orange-600 to-red-800 rounded-b-[50%]" />
        {/* Eyes */}
        <div className="absolute top-[30%] left-[15%] w-[22%] h-[30%]
          bg-gradient-to-b from-yellow-300 to-amber-500 rounded-full
          shadow-[0_0_15px_rgba(251,191,36,0.8)]">
          <div className="absolute top-[35%] left-[35%] w-[40%] h-[40%] bg-black rounded-full" />
        </div>
        <div className="absolute top-[30%] right-[15%] w-[22%] h-[30%]
          bg-gradient-to-b from-yellow-300 to-amber-500 rounded-full
          shadow-[0_0_15px_rgba(251,191,36,0.8)]">
          <div className="absolute top-[35%] right-[35%] w-[40%] h-[40%] bg-black rounded-full" />
        </div>
        {/* Horns */}
        <div className="absolute -top-[25%] left-[10%] w-[20%] h-[40%]
          bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-full"
          style={{ transform: 'rotate(-20deg)' }} />
        <div className="absolute -top-[25%] right-[10%] w-[20%] h-[40%]
          bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-full"
          style={{ transform: 'rotate(20deg)' }} />
      </div>
      
      {/* Wings */}
      <motion.div 
        className="absolute top-[20%] -left-[40%] w-[50%] h-[50%]
          bg-gradient-to-br from-red-600/80 to-red-900/60"
        style={{ clipPath: 'polygon(100% 50%, 0% 0%, 20% 50%, 0% 100%)' }}
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <motion.div 
        className="absolute top-[20%] -right-[40%] w-[50%] h-[50%]
          bg-gradient-to-bl from-red-600/80 to-red-900/60"
        style={{ clipPath: 'polygon(0% 50%, 100% 0%, 80% 50%, 100% 100%)' }}
        animate={{ rotate: [5, -5, 5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      
      {/* Fire Breath Effect */}
      <motion.div
        className="absolute bottom-[35%] left-[-20%] w-[25%] h-[15%]
          bg-gradient-to-l from-orange-500 via-yellow-400 to-transparent
          rounded-full blur-sm"
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
        transition={{ repeat: Infinity, duration: 1 }}
      />
    </div>
  );

  // Ice Golem - Crystalline ice creature
  const renderIceGolem = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Body - Crystalline Ice */}
      <div className="absolute inset-x-[10%] top-[20%] bottom-[5%]
        bg-gradient-to-b from-cyan-300 via-blue-400 to-blue-700
        rounded-[25%]
        shadow-[inset_-6px_-6px_20px_rgba(0,0,0,0.3),0_0_40px_rgba(34,211,238,0.5)]"
        style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)' }}>
        {/* Ice Cracks */}
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[2px] bg-white/60 rotate-12" />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[1px] bg-white/40 -rotate-6" />
        <div className="absolute top-[60%] right-[25%] w-[25%] h-[1px] bg-white/50 rotate-3" />
      </div>
      
      {/* Head */}
      <div className="absolute top-[5%] left-[20%] right-[20%] h-[22%]
        bg-gradient-to-b from-cyan-200 to-cyan-400
        rounded-[40%]
        shadow-[inset_-3px_-3px_10px_rgba(0,0,0,0.2),0_0_20px_rgba(34,211,238,0.4)]">
        {/* Glowing Eyes */}
        <motion.div 
          className="absolute top-[40%] left-[20%] w-[20%] h-[25%]
            bg-gradient-to-b from-white to-cyan-200 rounded-full
            shadow-[0_0_15px_rgba(255,255,255,0.9)]"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <motion.div 
          className="absolute top-[40%] right-[20%] w-[20%] h-[25%]
            bg-gradient-to-b from-white to-cyan-200 rounded-full
            shadow-[0_0_15px_rgba(255,255,255,0.9)]"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </div>
      
      {/* Ice Spikes on Shoulders */}
      <div className="absolute top-[18%] -left-[5%] w-[20%] h-[25%]
        bg-gradient-to-t from-cyan-400 to-cyan-100
        shadow-lg"
        style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
      <div className="absolute top-[18%] -right-[5%] w-[20%] h-[25%]
        bg-gradient-to-t from-cyan-400 to-cyan-100
        shadow-lg"
        style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
      
      {/* Floating Ice Shards */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-5 bg-gradient-to-t from-cyan-400 to-white rounded-sm"
          style={{ left: `${15 + i * 22}%`, top: '65%' }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 180, 360],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            delay: i * 0.3,
          }}
        />
      ))}
      
      {/* Cold Mist */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[20%]
          bg-gradient-to-t from-cyan-300/50 to-transparent rounded-b-full"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </div>
  );

  // Shadow Wraith - Ethereal ghost creature
  const renderShadowWraith = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Body - Ethereal Form */}
      <motion.div 
        className="absolute inset-x-[10%] top-[15%] bottom-[10%]
          bg-gradient-to-b from-purple-800/80 via-slate-900/90 to-purple-900/60
          rounded-t-[40%] rounded-b-[60%]
          shadow-[0_0_40px_rgba(147,51,234,0.5)]"
        animate={{ opacity: [0.7, 0.9, 0.7] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {/* Wispy edges */}
        <div className="absolute inset-0 rounded-t-[40%] rounded-b-[60%]
          bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />
      </motion.div>
      
      {/* Hood */}
      <motion.div 
        className="absolute top-[5%] left-[15%] right-[15%] h-[25%]
          bg-gradient-to-b from-slate-800 to-purple-900
          rounded-[50%]
          shadow-[inset_-4px_-4px_15px_rgba(0,0,0,0.6),0_0_20px_rgba(147,51,234,0.4)]"
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        {/* Glowing Purple Eyes */}
        <motion.div 
          className="absolute top-[45%] left-[25%] w-[18%] h-[25%]
            bg-gradient-to-b from-purple-400 to-purple-600 rounded-full
            shadow-[0_0_20px_rgba(168,85,247,1)]"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <motion.div 
          className="absolute top-[45%] right-[25%] w-[18%] h-[25%]
            bg-gradient-to-b from-purple-400 to-purple-600 rounded-full
            shadow-[0_0_20px_rgba(168,85,247,1)]"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
        />
      </motion.div>
      
      {/* Shadow Particles Rising */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-purple-500/60 rounded-full"
          style={{ left: `${10 + i * 14}%`, bottom: '20%' }}
          animate={{
            y: [0, -60, -80],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            delay: i * 0.4,
          }}
        />
      ))}
      
      {/* Ghostly Trail */}
      <motion.div
        className="absolute bottom-0 left-[20%] right-[20%] h-[30%]
          bg-gradient-to-t from-purple-600/40 to-transparent"
        style={{ filter: 'blur(8px)' }}
        animate={{ opacity: [0.3, 0.6, 0.3], scaleY: [0.8, 1.2, 0.8] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
    </div>
  );

  // Stone Guardian - Ancient rock creature
  const renderStoneGuardian = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Body - Rocky Form */}
      <div className="absolute inset-x-[5%] top-[20%] bottom-[5%]
        bg-gradient-to-b from-stone-500 via-stone-600 to-stone-800
        rounded-[20%]
        shadow-[inset_-6px_-6px_20px_rgba(0,0,0,0.5),inset_4px_4px_10px_rgba(255,255,255,0.1)]">
        {/* Rock Texture Lines */}
        <div className="absolute top-[15%] left-[10%] w-[80%] h-[2px] bg-stone-700/60" />
        <div className="absolute top-[35%] left-[15%] w-[70%] h-[1px] bg-stone-400/40" />
        <div className="absolute top-[55%] left-[20%] w-[60%] h-[2px] bg-stone-700/50" />
        
        {/* Glowing Runes */}
        <motion.div 
          className="absolute top-[20%] left-[30%] w-[40%] h-[15%]
            flex items-center justify-center"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-amber-400 text-lg drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">᚛᚜</span>
        </motion.div>
        <motion.div 
          className="absolute top-[45%] left-[25%] w-[50%] h-[10%]
            flex items-center justify-center"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
        >
          <span className="text-amber-400 text-sm drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]">ᛟᛞᚨᛚ</span>
        </motion.div>
      </div>
      
      {/* Head */}
      <div className="absolute top-[5%] left-[15%] right-[15%] h-[22%]
        bg-gradient-to-b from-stone-400 to-stone-600
        rounded-[40%_40%_30%_30%]
        shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.4)]">
        {/* Glowing Eyes */}
        <motion.div 
          className="absolute top-[40%] left-[18%] w-[22%] h-[30%]
            bg-gradient-to-b from-amber-400 to-orange-500 rounded-[30%]
            shadow-[0_0_15px_rgba(251,191,36,0.8)]"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <motion.div 
          className="absolute top-[40%] right-[18%] w-[22%] h-[30%]
            bg-gradient-to-b from-amber-400 to-orange-500 rounded-[30%]
            shadow-[0_0_15px_rgba(251,191,36,0.8)]"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </div>
      
      {/* Moss Patches */}
      <div className="absolute top-[30%] left-[5%] w-[15%] h-[10%]
        bg-gradient-to-r from-green-600 to-green-500 rounded-full opacity-70" />
      <div className="absolute top-[50%] right-[8%] w-[12%] h-[8%]
        bg-gradient-to-r from-green-500 to-green-600 rounded-full opacity-60" />
      
      {/* Ground Cracks */}
      <motion.div
        className="absolute bottom-[-5%] left-[10%] right-[10%] h-[10%]"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-full h-full bg-gradient-to-t from-amber-600/40 to-transparent"
          style={{ clipPath: 'polygon(20% 100%, 25% 50%, 30% 100%, 50% 60%, 55% 100%, 70% 50%, 80% 100%)' }} />
      </motion.div>
      
      {/* Dust Particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-stone-400/60 rounded-full"
          style={{ left: `${20 + i * 18}%`, bottom: '15%' }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );

  const renderAgentX = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-x-[15%] top-[25%] bottom-[10%]
        bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900
        rounded-t-[30%] rounded-b-[10%]
        shadow-[inset_-5px_-5px_20px_rgba(0,0,0,0.4),inset_5px_5px_10px_rgba(255,255,255,0.1)]">
        <div className="absolute top-[15%] left-[30%] right-[30%] h-[3%] bg-cyan-400/40" />
        <div className="absolute bottom-[30%] left-0 right-0 h-[8%]
          bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600" />
      </div>
      <div className="absolute top-[5%] left-[22%] right-[22%] h-[25%]
        bg-gradient-to-b from-amber-200 to-amber-300 rounded-[50%]
        shadow-[inset_-3px_-3px_10px_rgba(0,0,0,0.2)]">
        <div className="absolute top-[15%] left-[15%] right-[15%] h-[30%]
          bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-[50%]" />
        <div className="absolute top-[55%] left-[25%] w-[15%] h-[15%] bg-slate-800 rounded-full" />
        <div className="absolute top-[55%] right-[25%] w-[15%] h-[15%] bg-slate-800 rounded-full" />
      </div>
      <div className="absolute right-[-5%] top-[35%] w-[20%] h-[40%]"
        style={{ transform: 'rotate(-15deg)' }}>
        <div className="absolute top-0 left-[30%] w-[40%] h-[70%]
          bg-gradient-to-t from-slate-400 via-slate-300 to-slate-200
          shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
          style={{ clipPath: 'polygon(30% 0, 70% 0, 60% 100%, 40% 100%)' }} />
        <div className="absolute bottom-[5%] left-[25%] w-[50%] h-[25%]
          bg-gradient-to-b from-slate-700 to-slate-800 rounded-b" />
      </div>
      <div className="absolute top-[20%] left-[10%] right-[10%] bottom-0 -z-10
        bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-[30%]"
        style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)' }} />
    </div>
  );

  const renderCipher = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-x-[12%] top-[22%] bottom-[8%]
        bg-gradient-to-b from-cyan-800 via-teal-900 to-slate-900
        rounded-t-[25%] rounded-b-[15%]
        shadow-[inset_-5px_-5px_20px_rgba(0,0,0,0.4)]">
        <motion.div className="absolute top-[20%] left-[15%] w-[2px] h-[40%] bg-cyan-400/50"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }} />
        <motion.div className="absolute top-[25%] right-[15%] w-[2px] h-[35%] bg-cyan-400/50"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
      </div>
      <div className="absolute top-[5%] left-[20%] right-[20%] h-[22%]
        bg-gradient-to-b from-amber-300 to-amber-400 rounded-[50%]
        shadow-[inset_-3px_-3px_10px_rgba(0,0,0,0.2)]">
        <div className="absolute top-[10%] left-[10%] right-[10%] h-[35%]
          bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-[50%]" />
        <div className="absolute top-[10%] left-[5%] w-[15%] h-[20%] bg-cyan-400/60" />
        <div className="absolute top-[45%] left-[15%] right-[15%] h-[18%]
          bg-cyan-700/80 rounded-lg" />
        <motion.div className="absolute top-[47%] left-[18%] right-[18%] h-[14%]
          bg-cyan-400/30 rounded"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
      </div>
      <motion.div className="absolute right-[-10%] top-[40%] w-[25%] h-[30%]"
        animate={isAttacking ? { opacity: 1 } : { opacity: 0.7 }}>
        <div className="w-full h-full bg-gradient-to-br from-cyan-600/40 to-cyan-400/20 rounded-lg border border-cyan-500/30" />
        {isAttacking && (
          <motion.div className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 0.3, repeat: 3 }}>
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );

  const renderShadowAgent = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-x-[12%] top-[22%] bottom-[8%]
        bg-gradient-to-b from-slate-800 via-slate-900 to-black
        rounded-t-[25%] rounded-b-[15%]
        shadow-[inset_-5px_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-[50%] left-[30%] right-[30%] h-[5%]
          bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      </div>
      <div className="absolute top-[3%] left-[18%] right-[18%] h-[25%]
        bg-gradient-to-b from-slate-700 to-slate-900 rounded-[50%]
        shadow-[inset_-3px_-3px_10px_rgba(0,0,0,0.5)]">
        <motion.div className="absolute top-[40%] left-[20%] w-[20%] h-[25%]
          bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }} />
        <motion.div className="absolute top-[40%] right-[20%] w-[20%] h-[25%]
          bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} />
      </div>
      <motion.div className="absolute inset-0 rounded-xl bg-slate-500/10 pointer-events-none"
        animate={{ opacity: [0, 0.15, 0] }}
        transition={{ repeat: Infinity, duration: 3 }} />
      <div className="absolute top-[18%] left-[8%] right-[8%] bottom-0 -z-10
        bg-gradient-to-b from-slate-900 to-black rounded-b-[30%] opacity-60"
        style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)' }} />
    </div>
  );

  // ============ PRE-K FRIENDLY SPRITES ============
  const renderWiggleworm = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Body — pink wiggly worm with stacked segments */}
      <motion.div
        className="absolute inset-x-[15%] top-[20%] bottom-[15%] flex flex-col items-center justify-end gap-1"
        animate={{ rotate: [0, -4, 4, -4, 4, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-full bg-gradient-to-br from-pink-300 via-pink-400 to-rose-500
              shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.2),inset_3px_3px_6px_rgba(255,255,255,0.5)]"
            style={{
              width: `${65 - i * 5}%`,
              height: `${22 - i * 2}%`,
              opacity: 1 - i * 0.05,
            }}
          />
        ))}
      </motion.div>
      {/* Face on top segment */}
      <div className="absolute top-[18%] left-[25%] right-[25%] h-[22%] flex items-center justify-around z-10 pt-[6%]">
        <div className="w-[18%] aspect-square bg-white rounded-full flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-slate-900 rounded-full" />
        </div>
        <div className="w-[18%] aspect-square bg-white rounded-full flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-slate-900 rounded-full" />
        </div>
      </div>
      {/* Smile */}
      <div className="absolute top-[32%] left-[40%] right-[40%] h-[6%] z-10
        border-b-4 border-rose-700 rounded-b-full" />
      {/* Cheek blushes */}
      <div className="absolute top-[33%] left-[22%] w-[10%] h-[6%] bg-rose-300 rounded-full opacity-70 z-10" />
      <div className="absolute top-[33%] right-[22%] w-[10%] h-[6%] bg-rose-300 rounded-full opacity-70 z-10" />
    </div>
  );

  // ────────────────────────────────────────────────────────────
  // Pre-K limb animation tables: per-verb arm + leg motion.
  // Applied INSIDE Bouncer/Echo on top of the body transform.
  // ────────────────────────────────────────────────────────────
  type LimbAnim = { animate: any; transition: any };
  const IDLE_ARM_L: LimbAnim = {
    animate: { rotate: [0, 8, 0, -4, 0] },
    transition: { repeat: Infinity, duration: 2.6, ease: 'easeInOut' },
  };
  const IDLE_ARM_R: LimbAnim = {
    animate: { rotate: [0, -8, 0, 4, 0] },
    transition: { repeat: Infinity, duration: 2.6, ease: 'easeInOut' },
  };
  const IDLE_LEG: LimbAnim = {
    animate: { y: [0, 0] },
    transition: { duration: 0.4 },
  };

  const ARM_L_FOR: Record<string, LimbAnim> = {
    // Clap — left arm swings inward to meet right hand at center-front, 4 claps.
    clap:        { animate: { rotate: [-10, 90, -10, 90, -10, 90, -10, 90, -10] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
    // Wave — left arm stays at side (right arm does the waving)
    wave:        { animate: { rotate: [-10, -10, -10] }, transition: { duration: 1.8 } },
    // Run — arms pump forward/back as character moves
    run:         { animate: { rotate: [-70, 70, -70, 70, -70, 70, -70, 70] }, transition: { repeat: Infinity, duration: 0.5, ease: 'linear' } },
    hop:         { animate: { rotate: [-10, -50, -10, -50, -10] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    jump:        { animate: { rotate: [-10, -120, -100, -10] }, transition: { duration: 1.7, ease: 'easeOut' } },
    // Dance — both arms up overhead, swaying side to side
    dance:       { animate: { rotate: [-150, -120, -150, -120, -150, -120, -150] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
    sing:        { animate: { rotate: [-30, -30, -30] }, transition: { duration: 1.8 } },
    throw:       { animate: { rotate: [-10, -10, -10] }, transition: { duration: 1.6 } },
    // Eat — left arm steady at side; right hand brings apple to mouth.
    eat:         { animate: { rotate: [-10, -10, -10] }, transition: { duration: 1.5 } },
    // Drink — left arm slightly out to brace the glass.
    drink:       { animate: { rotate: [-10, -10, -10] }, transition: { duration: 1.5 } },
    sleep:       { animate: { rotate: [25, 25, 25] }, transition: { duration: 1.8 } },
    'help me':   { animate: { rotate: [-10, 40, -10, 40, -10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    'help you':  { animate: { rotate: [-10, -10, -10] }, transition: { duration: 1.9 } },
    wash:        { animate: { rotate: [-30, 30, -30, 30, -30, 20, -10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    'wash hands':{ animate: { rotate: [-30, 30, -30, 30, -30, 20, -10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    plant:       { animate: { rotate: [-10, 80, 80, 40, -10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    'plant seed':{ animate: { rotate: [-10, 80, 80, 40, -10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    grow:        { animate: { rotate: [-10, -90, -120, -110, -100] }, transition: { duration: 1.8, ease: 'easeOut' } },
    shrink:      { animate: { rotate: [-10, 20, 30, 30, 30] }, transition: { duration: 1.5, ease: 'easeIn' } },
    wiggle:      { animate: { rotate: [-30, 30, -30, 30, -30, 20, -10] }, transition: { duration: 1.4, ease: 'easeInOut' } },
    flip:        { animate: { rotate: [-10, -360, -370] }, transition: { duration: 1.5, ease: 'easeInOut' } },
    spin:        { animate: { rotate: [-10, 350, 710] }, transition: { duration: 1.4, ease: 'linear' } },
    twirl:       { animate: { rotate: [-10, -180, -360, -540] }, transition: { duration: 1.6, ease: 'linear' } },
    fly:         { animate: { rotate: [-60, -40, -60, -40, -60] }, transition: { duration: 1.8, ease: 'easeInOut' } },
    reach_left:  { animate: { rotate: [-95, -115, -95, -115, -95] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
    comforted:   { animate: { rotate: [-5, 25, -5, 25, -5] }, transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } },
  };
  const ARM_R_FOR: Record<string, LimbAnim> = {
    // Clap — right arm swings inward to meet left hand at center-front, 4 claps.
    clap:        { animate: { rotate: [10, -90, 10, -90, 10, -90, 10, -90, 10] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
    // Wave — right arm raised overhead, hand rocks back and forth like a greeting
    wave:        { animate: { rotate: [10, -150, -170, -130, -170, -130, -170, -130] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
    // Run — arms pump opposite to left arm
    run:         { animate: { rotate: [70, -70, 70, -70, 70, -70, 70, -70] }, transition: { repeat: Infinity, duration: 0.5, ease: 'linear' } },
    hop:         { animate: { rotate: [10, 50, 10, 50, 10] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    jump:        { animate: { rotate: [10, 120, 100, 10] }, transition: { duration: 1.7, ease: 'easeOut' } },
    // Dance — right arm overhead swaying with left
    dance:       { animate: { rotate: [150, 120, 150, 120, 150, 120, 150] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
    sing:        { animate: { rotate: [-115, -120, -115, -120, -115] }, transition: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } },
    throw:       { animate: { rotate: [10, 120, 130, -120, -60, 10] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    // Eat — right arm brings apple from front to mouth three times.
    eat:         { animate: { rotate: [10, -110, -120, -110, -120, -110, -120, -100, 10] }, transition: { duration: 2.5, ease: 'easeInOut' } },
    // Drink — right arm holds glass at mouth for entire 3s drink.
    drink:       { animate: { rotate: [10, -120, -130, -130, -130, -130, -110, 10] }, transition: { duration: 3, ease: 'easeInOut' } },
    sleep:       { animate: { rotate: [-25, -25, -25] }, transition: { duration: 1.8 } },
    'help me':   { animate: { rotate: [10, -40, 10, -40, 10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    'help you':  { animate: { rotate: [10, 100, 110, 100, 110, 60, 10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    wash:        { animate: { rotate: [30, -30, 30, -30, 30, -20, 10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    'wash hands':{ animate: { rotate: [30, -30, 30, -30, 30, -20, 10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    plant:       { animate: { rotate: [10, -80, -80, -40, 10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    'plant seed':{ animate: { rotate: [10, -80, -80, -40, 10] }, transition: { duration: 1.9, ease: 'easeInOut' } },
    grow:        { animate: { rotate: [10, 90, 120, 110, 100] }, transition: { duration: 1.8, ease: 'easeOut' } },
    shrink:      { animate: { rotate: [10, -20, -30, -30, -30] }, transition: { duration: 1.5, ease: 'easeIn' } },
    wiggle:      { animate: { rotate: [30, -30, 30, -30, 30, -20, 10] }, transition: { duration: 1.4, ease: 'easeInOut' } },
    flip:        { animate: { rotate: [10, 360, 370] }, transition: { duration: 1.5, ease: 'easeInOut' } },
    spin:        { animate: { rotate: [10, 350, 710] }, transition: { duration: 1.4, ease: 'linear' } },
    twirl:       { animate: { rotate: [10, 180, 360, 540] }, transition: { duration: 1.6, ease: 'linear' } },
    fly:         { animate: { rotate: [60, 40, 60, 40, 60] }, transition: { duration: 1.8, ease: 'easeInOut' } },
    reach_left:  { animate: { rotate: [-85, -110, -85, -110, -85] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
    comforted:   { animate: { rotate: [5, -25, 5, -25, 5] }, transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } },
  };
  const LEG_L_FOR: Record<string, LimbAnim> = {
    run:   { animate: { y: [0, -12, 0, -12, 0, -12, 0, -12], rotate: [0, -30, 0, -30, 0, -30, 0, -30] }, transition: { repeat: Infinity, duration: 0.5, ease: 'linear' } },
    hop:   { animate: { y: [0, -8, 0, -8, 0] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    jump:  { animate: { y: [0, 8, -12, 0] }, transition: { duration: 1.7, ease: 'easeOut' } },
    dance: { animate: { y: [0, -6, 0, -6, 0], rotate: [0, -14, 0, 14, 0, -14, 0] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
  };
  const LEG_R_FOR: Record<string, LimbAnim> = {
    run:   { animate: { y: [-12, 0, -12, 0, -12, 0, -12, 0], rotate: [30, 0, 30, 0, 30, 0, 30, 0] }, transition: { repeat: Infinity, duration: 0.5, ease: 'linear' } },
    hop:   { animate: { y: [0, -8, 0, -8, 0] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    jump:  { animate: { y: [0, 8, -12, 0] }, transition: { duration: 1.7, ease: 'easeOut' } },
    dance: { animate: { y: [-6, 0, -6, 0, -6], rotate: [14, 0, -14, 0, 14, 0, -14] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
  };

  // Lookup with first-word fallback so phrases like "clap your hands" still match "clap".
  const rawAct = (action ?? '').toLowerCase().trim();
  const hasExact = !!(ARM_L_FOR[rawAct] || ARM_R_FOR[rawAct] || LEG_L_FOR[rawAct] || LEG_R_FOR[rawAct]);
  const actKey = hasExact ? rawAct : (rawAct.split(/\s+/)[0] || '');
  const armL = ARM_L_FOR[actKey] ?? IDLE_ARM_L;
  const armR = ARM_R_FOR[actKey] ?? IDLE_ARM_R;
  const legL = LEG_L_FOR[actKey] ?? IDLE_LEG;
  const legR = LEG_R_FOR[actKey] ?? IDLE_LEG;
  const isRunning = actKey === 'run';
  const isFlying = actKey === 'fly';
  const isSinging = actKey === 'sing';
  // Re-key on actionNonce so the same action replays cleanly
  const limbKey = `${actKey}-${actionNonce}`;

  const renderBouncer = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Round bouncy body */}
      <motion.div
        className="absolute inset-[18%] rounded-full
          bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-500
          shadow-[inset_-8px_-8px_20px_rgba(0,0,0,0.25),inset_6px_6px_14px_rgba(255,255,255,0.6)]"
        animate={{ scaleY: [1, 0.9, 1.05, 1], scaleX: [1, 1.08, 0.95, 1] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
      >
        {/* Highlight gleam */}
        <div className="absolute top-[12%] left-[18%] w-[28%] h-[20%] bg-white/60 rounded-full blur-sm" />
      </motion.div>

      {/* LEFT ARM — shoulder at top of arm, swings from there */}
      <motion.div
        key={`armL-${limbKey}`}
        className="absolute top-[44%] left-[10%] w-[12%] h-[26%] rounded-full
          bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500
          shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.25),inset_2px_2px_4px_rgba(255,255,255,0.5)] z-20"
        style={{ transformOrigin: 'top center' }}
        animate={armL.animate}
        transition={armL.transition}
      >
        {/* Hand */}
        <div className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[140%] aspect-square
          rounded-full bg-gradient-to-br from-amber-400 to-orange-600
          shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)]" />
      </motion.div>

      {/* RIGHT ARM */}
      <motion.div
        key={`armR-${limbKey}`}
        className="absolute top-[44%] right-[10%] w-[12%] h-[26%] rounded-full
          bg-gradient-to-bl from-amber-300 via-amber-400 to-orange-500
          shadow-[inset_2px_-2px_5px_rgba(0,0,0,0.25),inset_-2px_2px_4px_rgba(255,255,255,0.5)] z-20"
        style={{ transformOrigin: 'top center' }}
        animate={armR.animate}
        transition={armR.transition}
      >
        <div className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[140%] aspect-square
          rounded-full bg-gradient-to-bl from-amber-400 to-orange-600
          shadow-[inset_2px_-2px_4px_rgba(0,0,0,0.3)]" />
      </motion.div>

      {/* Eyes */}
      {isSleeping ? (
        <>
          <div className="absolute top-[38%] left-[29%] w-[14%] h-[4%] bg-slate-900 rounded-full z-30" />
          <div className="absolute top-[38%] right-[29%] w-[14%] h-[4%] bg-slate-900 rounded-full z-30" />
        </>
      ) : (
        <>
          <div className="absolute top-[35%] left-[30%] w-[12%] aspect-square bg-white rounded-full flex items-center justify-center z-10">
            <div className="w-1/2 h-1/2 bg-slate-900 rounded-full" />
          </div>
          <div className="absolute top-[35%] right-[30%] w-[12%] aspect-square bg-white rounded-full flex items-center justify-center z-10">
            <div className="w-1/2 h-1/2 bg-slate-900 rounded-full" />
          </div>
        </>
      )}
      {/* Big grin */}
      <div className="absolute top-[52%] left-[35%] right-[35%] h-[12%] bg-rose-700 rounded-b-full z-10
        border-t-2 border-rose-800" />

      {/* Feet (animatable legs) */}
      <motion.div
        key={`legL-${limbKey}`}
        className="absolute bottom-[10%] left-[30%] w-[12%] h-[8%] bg-orange-700 rounded-full z-10"
        style={{ transformOrigin: 'top center' }}
        animate={legL.animate}
        transition={legL.transition}
      />
      <motion.div
        key={`legR-${limbKey}`}
        className="absolute bottom-[10%] right-[30%] w-[12%] h-[8%] bg-orange-700 rounded-full z-10"
        style={{ transformOrigin: 'top center' }}
        animate={legR.animate}
        transition={legR.transition}
      />

      {/* Singing: microphone at mouth + sound waves */}
      {isSinging && (
        <>
          {/* Microphone head (round mesh) just in front of mouth */}
          <div className="absolute top-[50%] left-[58%] w-[14%] aspect-square rounded-full
            bg-gradient-to-br from-slate-500 via-slate-700 to-slate-900
            shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.5),inset_2px_2px_3px_rgba(255,255,255,0.4)] z-30">
            <div className="absolute inset-[18%] rounded-full border border-slate-400/60" />
          </div>
          {/* Microphone handle extending down to the hand */}
          <div className="absolute top-[60%] left-[62%] w-[5%] h-[18%] rounded-full
            bg-gradient-to-b from-slate-700 to-slate-900 z-30" />

          {/* Sound wave lines coming out of the mouth (to the right) */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`sw-${limbKey}-${i}`}
              className="absolute top-[56%] left-[72%] z-30"
              animate={{ opacity: [0, 1, 0], x: [0, 18, 36], scale: [0.6, 1, 1.2] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut', delay: i * 0.35 }}
            >
              <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
                <path d="M2 11 Q 8 2, 14 11 T 26 11" stroke="hsl(45 95% 55%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M2 11 Q 8 20, 14 11 T 26 11" stroke="hsl(45 95% 55%)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
              </svg>
            </motion.div>
          ))}
          {/* Musical notes drifting up */}
          {[0, 1].map((i) => (
            <motion.div
              key={`note-${limbKey}-${i}`}
              className="absolute top-[40%] left-[78%] text-amber-400 font-bold text-lg z-30"
              animate={{ opacity: [0, 1, 0], y: [0, -30, -60], x: [0, 6, 12] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut', delay: i * 0.6 }}
            >
              ♪
            </motion.div>
          ))}
        </>
      )}
    </div>
  );

  const renderEchoBlob = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Pulsing aura rings (the "echo") */}
      <motion.div
        className="absolute inset-[10%] rounded-full border-4 border-cyan-300/60"
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-[10%] rounded-full border-4 border-cyan-200/50"
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut", delay: 0.6 }}
      />
      {/* Blob body — soft amorphous shape */}
      <motion.div
        className="absolute inset-[22%] rounded-[42%]
          bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-500
          shadow-[inset_-6px_-6px_18px_rgba(0,0,0,0.2),inset_5px_5px_12px_rgba(255,255,255,0.6)]"
        animate={{ borderRadius: ["42% 42% 42% 42%", "50% 38% 45% 40%", "42% 42% 42% 42%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      />

      {/* LEFT ARM */}
      <motion.div
        key={`echo-armL-${limbKey}`}
        className="absolute top-[48%] left-[14%] w-[11%] h-[24%] rounded-full
          bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-500
          shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.5)] z-20"
        style={{ transformOrigin: 'top center' }}
        animate={armL.animate}
        transition={armL.transition}
      >
        <div className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[140%] aspect-square
          rounded-full bg-gradient-to-br from-sky-400 to-blue-600" />
      </motion.div>
      {/* RIGHT ARM */}
      <motion.div
        key={`echo-armR-${limbKey}`}
        className="absolute top-[48%] right-[14%] w-[11%] h-[24%] rounded-full
          bg-gradient-to-bl from-cyan-200 via-sky-400 to-blue-500
          shadow-[inset_2px_-2px_5px_rgba(0,0,0,0.2),inset_-2px_2px_4px_rgba(255,255,255,0.5)] z-20"
        style={{ transformOrigin: 'top center' }}
        animate={armR.animate}
        transition={armR.transition}
      >
        <div className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[140%] aspect-square
          rounded-full bg-gradient-to-bl from-sky-400 to-blue-600" />
      </motion.div>

      {/* Eyes */}
      <div className="absolute top-[40%] left-[34%] w-[10%] aspect-square bg-white rounded-full flex items-center justify-center z-10">
        <div className="w-1/2 h-1/2 bg-slate-900 rounded-full" />
      </div>
      <div className="absolute top-[40%] right-[34%] w-[10%] aspect-square bg-white rounded-full flex items-center justify-center z-10">
        <div className="w-1/2 h-1/2 bg-slate-900 rounded-full" />
      </div>
      {/* Open mouth (singing the echo) */}
      <div className="absolute top-[55%] left-[42%] right-[42%] aspect-square bg-slate-900 rounded-full z-10" />
    </div>
  );


  const renderCharacter = () => {
    switch (type) {
      case 'knight': return renderKnight();
      case 'wizard': return renderWizard();
      case 'goblin': return renderGoblin();
      case 'boss': return renderBoss();
      case 'sorcerer': return renderSorcerer();
      case 'dragon': return renderDragon();
      case 'ice_golem': return renderIceGolem();
      case 'shadow_wraith': return renderShadowWraith();
      case 'stone_guardian': return renderStoneGuardian();
      case 'agent_x': return renderAgentX();
      case 'cipher': return renderCipher();
      case 'shadow_agent': return renderShadowAgent();
      case 'wiggleworm': return renderWiggleworm();
      case 'bouncer': return renderBouncer();
      case 'echo_blob': return renderEchoBlob();
      default: return renderKnight();
    }
  };

  // For running: move character horizontally to the right (visually).
  // When isEnemy, the wrapper is mirrored via scale-x-[-1], so local +x becomes
  // visual -x. Flip the sign so the character always runs to the screen-right.
  const runX = isRunning ? (isEnemy ? [0, -30, -60, -90, -60, -30, 0] : [0, 30, 60, 90, 60, 30, 0]) : 0;
  // Flying: start in place, swoop UP, then drift to the RIGHT across the screen.
  const flyX = isFlying ? (isEnemy ? [0, -10, -40, -90, -150, -200] : [0, 10, 40, 90, 150, 200]) : 0;
  const flyY = isFlying ? [0, -30, -60, -80, -90, -90] : 0;
  const isSleeping = actKey === 'sleep';
  const isEating = actKey === 'eat';
  const isDrinking = actKey === 'drink';
  const isClapping = actKey === 'clap';
  const isDancing = actKey === 'dance';
  const showPrekProps = isSleeping || isEating || isDrinking || isClapping || isDancing;

  // Sleep posture: settle the character down into the bed.
  const restY = isSleeping ? [0, 18, 22, 22] : (isTakingDamage ? [0, -5, 0] : [0, -3, 0]);

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${isEnemy ? 'scale-x-[-1]' : ''}`}
      animate={{
        x: isAttacking ? (isEnemy ? 30 : -30) : (isFlying ? flyX : runX),
        scale: isTakingDamage ? 0.95 : (isSleeping ? 0.85 : 1),
        y: isFlying ? flyY : restY,
      }}
      transition={{
        y: isFlying
          ? { duration: 2.4, ease: 'easeOut' }
          : isSleeping
          ? { duration: 1.2, ease: 'easeOut' }
          : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
        x: isRunning
          ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' }
          : isFlying
          ? { duration: 2.4, ease: 'easeOut' }
          : { type: 'spring', stiffness: 400, damping: 15 },
        scale: { duration: 0.4 },
      }}
      style={{ perspective: '200px' }}
    >
      {/* Wind streaks behind a running OR flying character */}
      {(isRunning || isFlying) && (
        <div className="pointer-events-none absolute inset-y-0 -left-8 w-16 z-0 flex flex-col justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={`wind-${i}-${limbKey}`}
              className="h-1 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.7)]"
              initial={{ x: 30, opacity: 0, width: '40%' }}
              animate={{ x: [30, -40], opacity: [0, 0.9, 0], width: ['30%', '95%', '40%'] }}
              transition={{
                repeat: Infinity,
                duration: 0.55,
                ease: 'easeOut',
                delay: i * 0.12,
              }}
            />
          ))}
        </div>
      )}

      {/* Bed (behind character) for sleep — pillow on the RIGHT (under head), blanket over body */}
      {isSleeping && (
        <div
          key={`bed-${limbKey}`}
          className={`pointer-events-none absolute left-[-8%] right-[-8%] bottom-[-6%] h-[42%] z-0 ${isEnemy ? 'scale-x-[-1]' : ''}`}
        >
          {/* Bed frame */}
          <div className="absolute inset-x-0 bottom-0 h-[55%] rounded-md bg-gradient-to-b from-amber-700 to-amber-900 shadow-md" />
          {/* White sheet */}
          <div className="absolute inset-x-[4%] bottom-[40%] h-[28%] rounded-sm bg-white shadow-inner" />
          {/* Pillow on the RIGHT side */}
          <div className="absolute right-[4%] bottom-[55%] w-[30%] h-[26%] rounded-md bg-white shadow z-10" />
        </div>
      )}

      {/* Shadow (hidden while sleeping in bed) */}
      {!isSleeping && (
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-4 
            bg-black/40 rounded-[100%] blur-md"
          animate={{
            scale: isAttacking ? 0.5 : [1, 1.05, 1],
            opacity: isAttacking ? 0.3 : 0.5,
          }}
          transition={{
            scale: { repeat: isAttacking ? 0 : Infinity, duration: 2.5 },
          }}
        />
      )}

      {/* Character Container — lay sideways while sleeping; turn to profile facing right while running */}
      <div
        className={`relative w-full h-full ${isEnemy ? 'scale-x-[-1]' : ''}`}
        style={
          isSleeping
            ? { transform: `${isEnemy ? 'scaleX(-1) ' : ''}translateX(50%) rotate(90deg)`, transformOrigin: 'center' }
            : isFlying
              ? { transform: `${isEnemy ? 'scaleX(-1) ' : ''}rotate(-20deg)`, transformOrigin: 'center' }
              : isRunning
                ? { transform: `${isEnemy ? 'scaleX(-1) ' : ''}rotateY(-20deg) rotate(-6deg)`, transformOrigin: 'center', transformStyle: 'preserve-3d' }
                : undefined
        }
      >
        {renderCharacter()}

        {/* Flapping wings — appear behind body while flying */}
        {isFlying && (
          <>
            <motion.div
              key={`wing-l-${limbKey}`}
              className="pointer-events-none absolute top-[28%] left-[-18%] w-[42%] h-[34%] rounded-[50%] bg-gradient-to-br from-white to-slate-200 shadow-md z-0"
              style={{ transformOrigin: '90% 50%' }}
              animate={{ rotate: [-10, -55, -10, -55, -10, -55, -10] }}
              transition={{ repeat: Infinity, duration: 0.45, ease: 'easeInOut' }}
            />
            <motion.div
              key={`wing-r-${limbKey}`}
              className="pointer-events-none absolute top-[28%] right-[-18%] w-[42%] h-[34%] rounded-[50%] bg-gradient-to-bl from-white to-slate-200 shadow-md z-0"
              style={{ transformOrigin: '10% 50%' }}
              animate={{ rotate: [10, 55, 10, 55, 10, 55, 10] }}
              transition={{ repeat: Infinity, duration: 0.45, ease: 'easeInOut' }}
            />
          </>
        )}
      </div>




      {/* Blanket drapes OVER the body (in front of character, behind head) */}
      {isSleeping && (
        <div
          key={`blanket-${limbKey}`}
          className="pointer-events-none absolute right-[-8%] left-[18%] bottom-[-2%] h-[78%] z-40 rounded-md bg-gradient-to-b from-sky-400 to-blue-600 shadow-lg"
        />
      )}

      {/* Pre-K prop overlays */}
      {showPrekProps && (
        <div className={`pointer-events-none absolute inset-0 z-30 ${isEnemy ? 'scale-x-[-1]' : ''}`}>
          {isEating && (
            <motion.div
              key={`apple-${limbKey}`}
              className="absolute"
              style={{ right: '22%', top: '64%', width: '16%', height: '18%' }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                // Hand → mouth → hand, repeated 3 times (sync with eat arm swing 2.5s)
                x: [0, -10, -10, 0, -10, -10, 0, -10, -10, 0],
                y: [0, -55, -55, 0, -55, -55, 0, -55, -55, 0],
                opacity: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
              }}
              transition={{
                duration: 2.5,
                times: [0, 0.18, 0.28, 0.38, 0.5, 0.6, 0.7, 0.82, 0.9, 1],
                ease: 'easeInOut',
              }}
            >
              {/* Apple body — bites taken on each mouth-touch via clip-path */}
              <motion.div
                className="absolute inset-0"
                initial={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                animate={{
                  clipPath: [
                    // full
                    'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                    'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                    // bite 1 (top-right wedge removed)
                    'polygon(0% 0%, 70% 0%, 60% 18%, 78% 32%, 100% 38%, 100% 100%, 0% 100%)',
                    'polygon(0% 0%, 70% 0%, 60% 18%, 78% 32%, 100% 38%, 100% 100%, 0% 100%)',
                    // bite 2 (right side gone)
                    'polygon(0% 0%, 60% 0%, 48% 20%, 38% 42%, 50% 62%, 65% 78%, 60% 100%, 0% 100%)',
                    'polygon(0% 0%, 60% 0%, 48% 20%, 38% 42%, 50% 62%, 65% 78%, 60% 100%, 0% 100%)',
                    // bite 3 (mostly core)
                    'polygon(0% 0%, 35% 0%, 28% 30%, 18% 50%, 28% 80%, 38% 100%, 0% 100%)',
                  ],
                }}
                transition={{
                  duration: 2.5,
                  times: [0, 0.22, 0.3, 0.48, 0.55, 0.72, 0.8],
                  ease: 'linear',
                }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-700 shadow-md" />
                <div className="absolute top-[15%] left-[18%] w-[26%] h-[22%] rounded-full bg-white/60 blur-[1px]" />
                <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[6%] h-[20%] rounded-sm bg-amber-900" />
                <div
                  className="absolute -top-[8%] left-[58%] w-[28%] h-[18%] rounded-full bg-green-500"
                  style={{ transform: 'rotate(35deg)' }}
                />
              </motion.div>
            </motion.div>
          )}

          {isDrinking && (
            <div
              key={`glass-${limbKey}`}
              className="absolute"
              style={{ left: '36%', top: '38%', width: '18%', height: '28%' }}
            >
              <div className="absolute inset-0 rounded-b-xl rounded-t-sm border-[3px] border-white/90 bg-white/10 overflow-hidden shadow-md">
                <motion.div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-500 via-sky-400 to-cyan-300"
                  initial={{ height: '88%' }}
                  animate={{ height: ['88%', '60%', '32%', '6%', '0%'] }}
                  transition={{ duration: 3, times: [0, 0.3, 0.6, 0.9, 1], ease: 'easeInOut' }}
                />
              </div>
              <div className="absolute top-[10%] left-[14%] w-[14%] h-[60%] rounded-full bg-white/40 blur-[1px]" />
            </div>
          )}

          {isSleeping && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`z-${i}-${limbKey}`}
                  className="absolute font-extrabold text-white select-none"
                  style={{
                    top: '12%',
                    left: `${52 + i * 9}%`,
                    fontSize: `${18 + i * 4}px`,
                    textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  }}
                  initial={{ opacity: 0, y: 10, scale: 0.7 }}
                  animate={{ opacity: [0, 1, 1, 0], y: [10, -10, -30, -50], scale: [0.7, 1, 1.2, 1.3] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    delay: i * 0.7,
                    ease: 'easeOut',
                  }}
                >
                  Z
                </motion.div>
              ))}
              {/* Closed eyes — vertical pair on the right side (where the rotated head is) */}
              <div className="absolute right-[12%] top-[36%] w-[2px] h-[14%] bg-slate-900 rounded-full z-30" />
              <div className="absolute right-[12%] top-[54%] w-[2px] h-[14%] bg-slate-900 rounded-full z-30" />
            </>
          )}

          {isClapping && (
            <>
              {/* Impact burst between the hands on each clap (4 claps over 1.6s) */}
              <motion.div
                key={`clap-burst-${limbKey}`}
                className="absolute"
                style={{ left: '50%', top: '58%', width: '32%', height: '32%', transform: 'translate(-50%, -50%)' }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{
                  opacity: [0, 1, 0, 1, 0, 1, 0, 1, 0],
                  scale: [0.4, 1.2, 0.4, 1.2, 0.4, 1.2, 0.4, 1.2, 0.4],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', times: [0, 0.08, 0.2, 0.32, 0.45, 0.57, 0.7, 0.82, 1] }}
              >
                <div className="absolute inset-0 rounded-full bg-yellow-300/70 blur-md" />
                <div className="absolute inset-[28%] rounded-full bg-white" />
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <div
                    key={`ray-${deg}`}
                    className="absolute left-1/2 top-1/2 w-[6%] h-[55%] bg-amber-400 rounded-full origin-top"
                    style={{ transform: `translate(-50%, 0) rotate(${deg}deg)` }}
                  />
                ))}
              </motion.div>
            </>
          )}

          {isDancing && (
            <>
              {/* Disco ball above the head */}
              <motion.div
                key={`disco-${limbKey}`}
                className="absolute"
                style={{ left: '50%', top: '-12%', width: '26%', height: '26%', transform: 'translateX(-50%)' }}
                animate={{ rotate: [0, 360], y: [0, -3, 0, -3, 0] }}
                transition={{
                  rotate: { repeat: Infinity, duration: 3, ease: 'linear' },
                  y: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
                }}
              >
                {/* String to ceiling */}
                <div className="absolute left-1/2 -top-3 w-px h-3 bg-slate-400" />
                {/* Ball */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-700 shadow-[0_0_18px_rgba(192,132,252,0.7)]">
                  {/* Mirror facets */}
                  <div className="absolute inset-[10%] grid grid-cols-4 grid-rows-4 gap-[1px] rounded-full overflow-hidden opacity-80">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className={i % 3 === 0 ? 'bg-fuchsia-300' : i % 3 === 1 ? 'bg-cyan-200' : 'bg-amber-200'} />
                    ))}
                  </div>
                  {/* Highlight */}
                  <div className="absolute top-[15%] left-[18%] w-[26%] h-[20%] rounded-full bg-white/80 blur-[1px]" />
                </div>
              </motion.div>

              {/* Floating music notes */}
              {[
                { left: '8%', top: '18%', delay: 0, note: '♪', color: 'text-fuchsia-500' },
                { left: '78%', top: '24%', delay: 0.5, note: '♫', color: 'text-cyan-500' },
                { left: '20%', top: '40%', delay: 1.0, note: '♬', color: 'text-amber-500' },
                { left: '70%', top: '46%', delay: 0.3, note: '♩', color: 'text-emerald-500' },
              ].map((n, i) => (
                <motion.div
                  key={`note-${i}-${limbKey}`}
                  className={`absolute font-extrabold ${n.color} text-2xl sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] select-none`}
                  style={{ left: n.left, top: n.top }}
                  initial={{ opacity: 0, y: 10, rotate: -10 }}
                  animate={{ opacity: [0, 1, 1, 0], y: [10, -10, -28, -48], rotate: [-10, 8, -6, 10] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: n.delay, ease: 'easeOut' }}
                >
                  {n.note}
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Damage Flash */}
      {isTakingDamage && (
        <motion.div
          className="absolute inset-0 bg-red-500 rounded-xl mix-blend-overlay"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: [0.8, 0, 0.6, 0] }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Defending Shield Overlay */}
      {isDefending && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="absolute inset-[-5%] border-4 border-blue-400/60 rounded-xl"
            animate={{
              boxShadow: [
                '0 0 15px rgba(59,130,246,0.5)',
                '0 0 30px rgba(59,130,246,0.8)',
                '0 0 15px rgba(59,130,246,0.5)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};
