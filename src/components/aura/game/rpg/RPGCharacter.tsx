import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Sparkles } from "lucide-react";
import { RPGCharacter as RPGCharacterType, RPGEnemy } from "@/lib/rpgBattleData";

interface RPGCharacterProps {
  character: RPGCharacterType | RPGEnemy;
  currentHp: number;
  isEnemy?: boolean;
  isAttacking?: boolean;
  isTakingDamage?: boolean;
  damageNumber?: number;
  showDamage?: boolean;
  isDefending?: boolean;
  showSprite?: boolean;
}

export const RPGCharacter = ({
  character,
  currentHp,
  isEnemy = false,
  isAttacking = false,
  isTakingDamage = false,
  damageNumber = 0,
  showDamage = false,
  isDefending = false,
  showSprite = true,
}: RPGCharacterProps) => {
  const hpPercentage = (currentHp / character.maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'from-emerald-400 to-green-500' : 
                  hpPercentage > 25 ? 'from-yellow-400 to-amber-500' : 
                  'from-red-400 to-rose-500';

  // Get character-appropriate emoji/icon
  const getCharacterEmoji = () => {
    if (isEnemy) {
      const enemy = character as RPGEnemy;
      switch (enemy.type) {
        case 'final_boss': return '🧙‍♂️';
        case 'boss': return '👹';
        case 'elite': return '👺';
        case 'guard': return '🛡️';
        default: return '👾';
      }
    } else {
      const hero = character as RPGCharacterType;
      return hero.type === 'ally' ? '🧙‍♀️' : '⚔️';
    }
  };

  return (
    <div className={`relative flex flex-col items-center ${isEnemy ? '' : ''}`}>
      {/* Damage Number - Floats up */}
      <AnimatePresence>
        {showDamage && damageNumber > 0 && (
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 1.5 }}
            animate={{ opacity: 0, y: -80, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute -top-4 z-30 pointer-events-none"
          >
            <span 
              className="text-3xl md:text-4xl font-black text-red-500"
              style={{ 
                textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                WebkitTextStroke: '1px black',
              }}
            >
              -{damageNumber}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Critical Hit Effect */}
      <AnimatePresence>
        {showDamage && damageNumber >= 20 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 z-30 text-yellow-400 font-black text-sm"
          >
            ⚡ CRITICAL! ⚡
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name Plate */}
      <motion.div 
        className="mb-2 text-center"
        animate={isTakingDamage ? { x: [-3, 3, -3, 3, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg
          bg-gradient-to-r ${character.color} shadow-lg`}>
          <span className="font-bold text-sm text-white tracking-wide drop-shadow-md">
            {character.name}
          </span>
          {isDefending && <Shield className="h-3 w-3 text-blue-200" />}
        </div>
        
        {'title' in character && character.title && (
          <p className="text-xs text-slate-400 mt-0.5">{character.title}</p>
        )}

        {/* HP Bar */}
        <div className="mt-2 flex items-center gap-2">
          <Heart className="h-3 w-3 text-red-400" />
          <div className="relative w-28 h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700">
            <motion.div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${hpColor} rounded-full`}
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercentage}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
            {/* Shine */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent h-1/2 rounded-full" />
          </div>
          <span className="text-xs font-mono text-slate-300 w-14 text-right">
            {currentHp}/{character.maxHp}
          </span>
        </div>
      </motion.div>

      {/* Character Sprite Container */}
      {showSprite && (
        <motion.div
          animate={{
            x: isAttacking ? (isEnemy ? -50 : 50) : 0,
            scale: isTakingDamage ? 0.9 : 1,
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 15,
            duration: isAttacking ? 0.2 : 0.3,
          }}
          className="relative"
        >
          {/* Shadow under character */}
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/40 rounded-[100%] blur-md"
            animate={{
              scale: isAttacking ? 0.5 : [1, 1.05, 1],
              opacity: isAttacking ? 0.3 : 0.5,
            }}
            transition={{ 
              duration: 2, 
              repeat: isAttacking ? 0 : Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Main Sprite */}
          <motion.div
            className={`relative w-28 h-36 md:w-36 md:h-44 rounded-xl 
              bg-gradient-to-b ${character.color} 
              flex items-center justify-center 
              shadow-[0_10px_40px_rgba(0,0,0,0.5)] 
              border-2 border-white/20
              ${isEnemy ? '' : ''}`}
            animate={{
              y: isTakingDamage ? [0, -5, 0] : [0, -4, 0],
              rotate: isTakingDamage ? [0, -5, 5, -5, 0] : 0,
            }}
            transition={{
              duration: isTakingDamage ? 0.3 : 2.5,
              repeat: isTakingDamage ? 0 : Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 via-transparent to-white/10" />

            {/* Character Avatar or Emoji */}
            {character.avatar ? (
              <img
                src={character.avatar}
                alt={character.name}
                className={`w-full h-full object-cover rounded-xl ${isEnemy ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <motion.span 
                className="text-5xl md:text-6xl drop-shadow-lg"
                animate={{
                  scale: isAttacking ? [1, 1.3, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {getCharacterEmoji()}
              </motion.span>
            )}

            {/* Attack Effect */}
            <AnimatePresence>
              {isAttacking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1.5, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span className="text-5xl">💥</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Damage Flash Overlay */}
            <AnimatePresence>
              {isTakingDamage && (
                <motion.div
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: [0.8, 0, 0.6, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-red-500 rounded-xl"
                />
              )}
            </AnimatePresence>

            {/* Defending Shield Effect */}
            <AnimatePresence>
              {isDefending && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    className="absolute inset-0 border-4 border-blue-400/50 rounded-xl"
                    animate={{ 
                      boxShadow: ['0 0 10px rgba(59,130,246,0.5)', '0 0 30px rgba(59,130,246,0.8)', '0 0 10px rgba(59,130,246,0.5)']
                    }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  <Shield className="h-12 w-12 text-blue-400 drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Magical particles for boss enemies */}
            {isEnemy && (character as RPGEnemy).type === 'final_boss' && (
              <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-purple-400 rounded-full"
                    style={{
                      left: `${20 + i * 15}%`,
                      bottom: '10%',
                    }}
                    animate={{
                      y: [0, -60, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.3,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
