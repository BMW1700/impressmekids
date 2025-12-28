import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { RPGCharacter as RPGCharacterType, RPGEnemy } from "@/lib/rpgBattleData";

interface RPGCharacterProps {
  character: RPGCharacterType | RPGEnemy;
  currentHp: number;
  isEnemy?: boolean;
  isAttacking?: boolean;
  isTakingDamage?: boolean;
  damageNumber?: number;
  showDamage?: boolean;
}

export const RPGCharacter = ({
  character,
  currentHp,
  isEnemy = false,
  isAttacking = false,
  isTakingDamage = false,
  damageNumber = 0,
  showDamage = false,
}: RPGCharacterProps) => {
  const hpPercentage = (currentHp / character.maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`relative flex flex-col items-center ${isEnemy ? 'scale-x-[-1]' : ''}`}>
      {/* Damage Number */}
      {showDamage && damageNumber > 0 && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -50, scale: 1.5 }}
          transition={{ duration: 0.8 }}
          className={`absolute -top-8 z-20 text-2xl font-black ${isEnemy ? 'text-red-500 scale-x-[-1]' : 'text-red-400'}`}
        >
          -{damageNumber}
        </motion.div>
      )}

      {/* Name & HP Bar */}
      <div className={`mb-2 text-center ${isEnemy ? 'scale-x-[-1]' : ''}`}>
        <p className="font-bold text-sm text-foreground">{character.name}</p>
        {'title' in character && character.title && (
          <p className="text-xs text-muted-foreground">{character.title}</p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Heart className="h-3 w-3 text-red-500" />
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${hpColor}`}
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercentage}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
            />
          </div>
          <span className="text-xs font-mono">{currentHp}/{character.maxHp}</span>
        </div>
      </div>

      {/* Character Sprite */}
      <motion.div
        animate={{
          x: isAttacking ? (isEnemy ? -30 : 30) : 0,
          scale: isTakingDamage ? 0.9 : 1,
          rotate: isTakingDamage ? (isEnemy ? 5 : -5) : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className={`relative w-20 h-24 md:w-28 md:h-32 rounded-lg bg-gradient-to-b ${character.color} 
          flex items-center justify-center shadow-lg border-2 border-black/20
          ${isTakingDamage ? 'animate-pulse' : ''}`}
      >
        {/* Character Avatar or Emoji */}
        {character.avatar ? (
          <img
            src={character.avatar}
            alt={character.name}
            className={`w-full h-full object-cover rounded-lg ${isEnemy ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <span className={`text-4xl md:text-5xl ${isEnemy ? 'scale-x-[-1]' : ''}`}>
            {isEnemy ? (
              character.type === 'final_boss' ? '🧙‍♂️' :
              character.type === 'boss' ? '👹' :
              character.type === 'elite' ? '👺' :
              character.type === 'guard' ? '🛡️' : '👾'
            ) : (
              ('type' in character && character.type === 'ally') ? '🧙‍♀️' : '⚔️'
            )}
          </span>
        )}

        {/* Attack Effect */}
        {isAttacking && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-4xl">💥</span>
          </motion.div>
        )}

        {/* Damage Flash */}
        {isTakingDamage && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-red-500 rounded-lg"
          />
        )}
      </motion.div>

      {/* Idle Animation */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="absolute bottom-0"
      >
        <div className="w-16 h-2 bg-black/20 rounded-full blur-sm" />
      </motion.div>
    </div>
  );
};
