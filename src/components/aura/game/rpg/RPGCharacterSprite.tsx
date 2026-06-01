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
    // Clap — left hand swings sharply across body to meet right hand
    clap:        { animate: { rotate: [-10, 75, -10, 75, -10, 75, -10, 75, -10] }, transition: { duration: 1.3, ease: 'easeInOut' } },
    // Wave — left arm stays at side (right arm does the waving)
    wave:        { animate: { rotate: [-10, -10, -10] }, transition: { duration: 1.5 } },
    // Run — arms pump forward/back as character moves
    run:         { animate: { rotate: [-70, 70, -70, 70, -70, 70, -70, 70] }, transition: { duration: 1.4, ease: 'linear' } },
    hop:         { animate: { rotate: [-10, -50, -10, -50, -10] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    jump:        { animate: { rotate: [-10, -120, -100, -10] }, transition: { duration: 1.7, ease: 'easeOut' } },
    // Dance — both arms up overhead, swaying side to side
    dance:       { animate: { rotate: [-150, -120, -150, -120, -150, -120, -150] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    sing:        { animate: { rotate: [-30, -30, -30] }, transition: { duration: 1.8 } },
    throw:       { animate: { rotate: [-10, -10, -10] }, transition: { duration: 1.6 } },
    eat:         { animate: { rotate: [-10, -10, -10] }, transition: { duration: 1.5 } },
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
    // Reaching out to the left — both arms extend leftward to comfort/help someone.
    reach_left:  { animate: { rotate: [-95, -115, -95, -115, -95] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
    // Receiving help — gentle inward pulse, like accepting a hug.
    comforted:   { animate: { rotate: [-5, 25, -5, 25, -5] }, transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } },
  };
  const ARM_R_FOR: Record<string, LimbAnim> = {
    // Clap — right hand swings sharply across body to meet left hand
    clap:        { animate: { rotate: [10, -75, 10, -75, 10, -75, 10, -75, 10] }, transition: { duration: 1.3, ease: 'easeInOut' } },
    // Wave — right arm raised overhead, hand rocks back and forth like a greeting
    wave:        { animate: { rotate: [10, -150, -170, -130, -170, -130, -170, -130] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    // Run — arms pump opposite to left arm
    run:         { animate: { rotate: [70, -70, 70, -70, 70, -70, 70, -70] }, transition: { duration: 1.4, ease: 'linear' } },
    hop:         { animate: { rotate: [10, 50, 10, 50, 10] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    jump:        { animate: { rotate: [10, 120, 100, 10] }, transition: { duration: 1.7, ease: 'easeOut' } },
    // Dance — right arm overhead swaying with left
    dance:       { animate: { rotate: [150, 120, 150, 120, 150, 120, 150] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    sing:        { animate: { rotate: [30, 30, 30] }, transition: { duration: 1.8 } },
    throw:       { animate: { rotate: [10, 120, 130, -120, -60, 10] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    eat:         { animate: { rotate: [10, -110, -120, -110, -120, -100, 10] }, transition: { duration: 1.5, ease: 'easeInOut' } },
    drink:       { animate: { rotate: [10, -120, -130, -130, -100, 10] }, transition: { duration: 1.5, ease: 'easeInOut' } },
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
    // Reaching to the left — right arm crosses body to the left (negative rotation).
    reach_left:  { animate: { rotate: [-85, -110, -85, -110, -85] }, transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } },
    // Receiving help — gentle inward pulse mirrored.
    comforted:   { animate: { rotate: [5, -25, 5, -25, 5] }, transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } },
  };
  const LEG_L_FOR: Record<string, LimbAnim> = {
    run:   { animate: { y: [0, -12, 0, -12, 0, -12, 0, -12], rotate: [0, -30, 0, -30, 0, -30, 0, -30] }, transition: { duration: 1.4, ease: 'linear' } },
    hop:   { animate: { y: [0, -8, 0, -8, 0] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    jump:  { animate: { y: [0, 8, -12, 0] }, transition: { duration: 1.7, ease: 'easeOut' } },
    dance: { animate: { y: [0, -6, 0, -6, 0], rotate: [0, -14, 0, 14, 0, -14, 0] }, transition: { duration: 1.6, ease: 'easeInOut' } },
  };
  const LEG_R_FOR: Record<string, LimbAnim> = {
    run:   { animate: { y: [-12, 0, -12, 0, -12, 0, -12, 0], rotate: [30, 0, 30, 0, 30, 0, 30, 0] }, transition: { duration: 1.4, ease: 'linear' } },
    hop:   { animate: { y: [0, -8, 0, -8, 0] }, transition: { duration: 1.6, ease: 'easeInOut' } },
    jump:  { animate: { y: [0, 8, -12, 0] }, transition: { duration: 1.7, ease: 'easeOut' } },
    dance: { animate: { y: [-6, 0, -6, 0, -6], rotate: [14, 0, -14, 0, 14, 0, -14] }, transition: { duration: 1.6, ease: 'easeInOut' } },
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
      <div className="absolute top-[35%] left-[30%] w-[12%] aspect-square bg-white rounded-full flex items-center justify-center z-10">
        <div className="w-1/2 h-1/2 bg-slate-900 rounded-full" />
      </div>
      <div className="absolute top-[35%] right-[30%] w-[12%] aspect-square bg-white rounded-full flex items-center justify-center z-10">
        <div className="w-1/2 h-1/2 bg-slate-900 rounded-full" />
      </div>
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
  const isSleeping = actKey === 'sleep';
  const isEating = actKey === 'eat';
  const isDrinking = actKey === 'drink';
  const showPrekProps = isSleeping || isEating || isDrinking;

  // Sleep posture: settle the character down into the bed.
  const restY = isSleeping ? [0, 18, 22, 22] : (isTakingDamage ? [0, -5, 0] : [0, -3, 0]);

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${isEnemy ? 'scale-x-[-1]' : ''}`}
      animate={{
        x: isAttacking ? (isEnemy ? 30 : -30) : runX,
        scale: isTakingDamage ? 0.95 : (isSleeping ? 0.85 : 1),
        y: restY,
      }}
      transition={{
        y: isSleeping
          ? { duration: 1.2, ease: 'easeOut' }
          : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
        x: isRunning
          ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' }
          : { type: 'spring', stiffness: 400, damping: 15 },
        scale: { duration: 0.4 },
      }}
      style={{ perspective: '200px' }}
    >
      {/* Wind streaks behind a running character */}
      {isRunning && (
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

      {/* Bed (behind character) for sleep */}
      {isSleeping && (
        <div
          key={`bed-${limbKey}`}
          className={`pointer-events-none absolute left-[-8%] right-[-8%] bottom-[-6%] h-[42%] z-0 ${isEnemy ? 'scale-x-[-1]' : ''}`}
        >
          <div className="absolute inset-x-0 bottom-0 h-[55%] rounded-md bg-gradient-to-b from-amber-700 to-amber-900 shadow-md" />
          <div className="absolute inset-x-[4%] bottom-[40%] h-[28%] rounded-sm bg-white shadow-inner" />
          <div className="absolute left-[32%] right-[4%] bottom-[40%] h-[34%] rounded-sm bg-gradient-to-b from-sky-400 to-blue-600 shadow" />
          <div className="absolute left-[6%] bottom-[60%] w-[28%] h-[20%] rounded-md bg-white shadow" />
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

      {/* Character Container */}
      <div className={`relative w-full h-full ${isEnemy ? 'scale-x-[-1]' : ''}`}>
        {renderCharacter()}
      </div>

      {/* Pre-K prop overlays */}
      {showPrekProps && (
        <div className={`pointer-events-none absolute inset-0 z-30 ${isEnemy ? 'scale-x-[-1]' : ''}`}>
          {isEating && (
            <motion.div
              key={`apple-${limbKey}`}
              className="absolute"
              style={{ right: '14%', top: '46%', width: '20%', height: '22%' }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{
                scale: [1, 1, 0.72, 0.72, 0.42, 0.42, 0],
                opacity: [1, 1, 1, 1, 1, 1, 0],
              }}
              transition={{
                duration: 2.4,
                times: [0, 0.18, 0.22, 0.52, 0.56, 0.85, 1],
                ease: 'easeInOut',
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
          )}

          {isDrinking && (
            <div
              key={`glass-${limbKey}`}
              className="absolute"
              style={{ right: '16%', top: '42%', width: '20%', height: '30%' }}
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
              <div className="absolute left-[28%] top-[37%] w-[16%] h-[2px] bg-slate-900 rounded-full" />
              <div className="absolute right-[28%] top-[37%] w-[16%] h-[2px] bg-slate-900 rounded-full" />
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
