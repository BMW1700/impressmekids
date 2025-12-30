import { motion } from "framer-motion";

type CharacterType = 'knight' | 'wizard' | 'goblin' | 'boss' | 'sorcerer' | 'dragon';

interface RPGCharacterSpriteProps {
  type: CharacterType;
  isEnemy?: boolean;
  isAttacking?: boolean;
  isTakingDamage?: boolean;
  isDefending?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RPGCharacterSprite = ({
  type,
  isEnemy = false,
  isAttacking = false,
  isTakingDamage = false,
  isDefending = false,
  size = 'md',
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

  const renderCharacter = () => {
    switch (type) {
      case 'knight': return renderKnight();
      case 'wizard': return renderWizard();
      case 'goblin': return renderGoblin();
      case 'boss': return renderBoss();
      case 'sorcerer': return renderSorcerer();
      case 'dragon': return renderDragon();
      default: return renderKnight();
    }
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${isEnemy ? 'scale-x-[-1]' : ''}`}
      animate={{
        x: isAttacking ? (isEnemy ? 30 : -30) : 0,
        scale: isTakingDamage ? 0.95 : 1,
        y: isTakingDamage ? [0, -5, 0] : [0, -3, 0],
      }}
      transition={{
        y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
        x: { type: 'spring', stiffness: 400, damping: 15 },
        scale: { duration: 0.2 },
      }}
      style={{ perspective: '200px' }}
    >
      {/* Shadow */}
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

      {/* Character Container */}
      <div className={`relative w-full h-full ${isEnemy ? 'scale-x-[-1]' : ''}`}>
        {renderCharacter()}
      </div>

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
