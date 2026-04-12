import { motion, AnimatePresence } from "framer-motion";

export type FighterAction = 'idle' | 'punch' | 'kick' | 'block' | 'dodge' | 'special' | 'hit' | 'victory' | 'defeat';

interface RPGArenaFighterProps {
  name: string;
  hp: number;
  maxHp: number;
  action: FighterAction;
  position: 'left' | 'right';
  isPlayer?: boolean;
  color: string;
}

const ACTION_EMOJIS: Record<FighterAction, string> = {
  idle: '🧍',
  punch: '👊',
  kick: '🦶',
  block: '🛡️',
  dodge: '💨',
  special: '⚡',
  hit: '💥',
  victory: '🏆',
  defeat: '😵',
};

const ACTION_TEXT: Record<FighterAction, string> = {
  idle: '',
  punch: 'PUNCH!',
  kick: 'KICK!',
  block: 'BLOCK!',
  dodge: 'DODGE!',
  special: 'SPECIAL!',
  hit: 'HIT!',
  victory: 'WINNER!',
  defeat: 'K.O.',
};

export const RPGArenaFighter = ({
  name,
  hp,
  maxHp,
  action,
  position,
  isPlayer = false,
  color,
}: RPGArenaFighterProps) => {
  const isAttacking = action === 'punch' || action === 'kick' || action === 'special';
  const isHit = action === 'hit';
  const flipX = position === 'right';

  return (
    <div className={`relative ${flipX ? 'scale-x-[-1]' : ''}`}>
      {/* Action text popup */}
      <AnimatePresence>
        {action !== 'idle' && (
          <motion.div
            key={action}
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -60 }}
            className={`absolute -top-8 left-1/2 -translate-x-1/2 z-10 ${flipX ? 'scale-x-[-1]' : ''}`}
          >
            <span className={`text-lg font-black ${
              isAttacking ? 'text-yellow-400' : 
              isHit ? 'text-red-400' : 
              action === 'block' ? 'text-blue-400' :
              action === 'victory' ? 'text-yellow-400' : 'text-white'
            }`}>
              {ACTION_TEXT[action]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fighter body */}
      <motion.div
        animate={{
          x: isAttacking ? (position === 'left' ? 30 : -30) : isHit ? (position === 'left' ? -15 : 15) : 0,
          y: action === 'dodge' ? -20 : action === 'kick' ? 5 : 0,
          rotate: isHit ? (position === 'left' ? -10 : 10) : action === 'kick' ? (position === 'left' ? 15 : -15) : 0,
          scale: action === 'special' ? 1.2 : isHit ? 0.9 : 1,
        }}
        transition={{ type: "spring", damping: 10, stiffness: 300 }}
        className="relative"
      >
        {/* Character body */}
        <div className={`w-16 h-24 rounded-xl relative overflow-hidden border-2 ${
          isHit ? 'border-red-500 bg-red-900/50' : `border-white/30`
        }`} style={{ backgroundColor: isHit ? undefined : color }}>
          {/* Face */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-amber-200 rounded-full">
            {/* Eyes */}
            <div className="absolute top-3 left-2 w-2 h-2 bg-black rounded-full" />
            <div className="absolute top-3 right-2 w-2 h-2 bg-black rounded-full" />
            {/* Mouth */}
            <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-1.5 rounded-full ${
              isHit ? 'bg-red-500' : isAttacking ? 'bg-black' : 'bg-pink-400'
            }`} />
          </div>

          {/* Body marker */}
          {isPlayer && (
            <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white bg-black/50 px-1 rounded ${flipX ? 'scale-x-[-1]' : ''}`}>
              YOU
            </div>
          )}
        </div>

        {/* Arms */}
        {isAttacking && (
          <motion.div
            initial={{ opacity: 0, x: position === 'left' ? 0 : 0 }}
            animate={{ opacity: 1, x: position === 'left' ? 25 : -25 }}
            className="absolute top-8 text-2xl"
            style={{ [position === 'left' ? 'right' : 'left']: -20 }}
          >
            {ACTION_EMOJIS[action]}
          </motion.div>
        )}

        {/* Block shield */}
        {action === 'block' && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl"
          >
            🛡️
          </motion.div>
        )}

        {/* Special effect */}
        {action === 'special' && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.5, 2, 2.5] }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-yellow-400/30 border-2 border-yellow-400" />
          </motion.div>
        )}
      </motion.div>

      {/* HP Bar */}
      <div className={`mt-2 ${flipX ? 'scale-x-[-1]' : ''}`}>
        <div className="text-center text-xs font-bold text-white mb-1">{name}</div>
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
          <motion.div
            className={`h-full ${hp > maxHp * 0.5 ? 'bg-green-500' : hp > maxHp * 0.25 ? 'bg-yellow-500' : 'bg-red-500'}`}
            animate={{ width: `${(hp / maxHp) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
