import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export type TheDirectorState = 'idle' | 'hit' | 'attacking' | 'defeated' | 'ground_slam';

interface TheDirectorProps {
  state: TheDirectorState;
  healthPercent: number;
  currentHp?: number;
  maxHp?: number;
  showDamage?: number;
  size?: 'small' | 'medium' | 'large';
  flipX?: boolean;
  showHealthBar?: boolean;
}

const sizeConfig = {
  small: { width: 75, height: 130 },
  medium: { width: 110, height: 190 },
  large: { width: 140, height: 240 },
};

export const TheDirector = ({ state, healthPercent, currentHp, maxHp, showDamage, size = 'large', flipX = false }: TheDirectorProps) => {
  const { width, height } = sizeConfig[size];
  const [showDamageNum, setShowDamageNum] = useState(false);

  useEffect(() => {
    if (showDamage) {
      setShowDamageNum(true);
      const timer = setTimeout(() => setShowDamageNum(false), 800);
      return () => clearTimeout(timer);
    }
  }, [showDamage]);

  const isHit = state === 'hit';
  const isAttacking = state === 'attacking' || state === 'ground_slam';
  const isDefeated = state === 'defeated';

  return (
    <motion.div
      className="relative"
      style={{ width, height, transform: flipX ? 'scaleX(-1)' : undefined }}
      animate={isDefeated ? { opacity: 0, rotateX: 90, y: 30 } : isHit ? { x: [0, -8, 8, -4, 0] } : isAttacking ? { scale: [1, 1.15, 1], y: [0, -10, 0] } : { y: [0, -3, 0] }}
      transition={isDefeated ? { duration: 1.5 } : isHit ? { duration: 0.3 } : isAttacking ? { duration: 0.6 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 110 200" width={width} height={height}>
        <ellipse cx="55" cy="195" rx="35" ry="5" fill="rgba(0,0,0,0.4)" />
        
        {/* Red aura - menacing */}
        <motion.ellipse cx="55" cy="100" rx="50" ry="95" fill="none" stroke="#DC2626" strokeWidth="1"
          animate={{ opacity: [0.1, 0.4, 0.1], r: [50, 55, 50] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.ellipse cx="55" cy="100" rx="42" ry="80" fill="none" stroke="#EF4444" strokeWidth="0.5"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
        
        {/* Long coat - sweeps down */}
        <path d="M25 70 L25 170 Q35 175 55 175 Q75 175 85 170 L85 70 Q85 60 55 55 Q25 60 25 70 Z" fill="#1C1917" />
        {/* Coat inner lining - red */}
        <path d="M35 75 L40 165 L55 168 L70 165 L75 75" fill="#7F1D1D" opacity="0.6" />
        {/* Coat collar - high/dramatic */}
        <path d="M30 68 Q30 55 55 50 Q80 55 80 68 L75 72 Q55 60 35 72 Z" fill="#292524" />
        
        {/* Legs visible between coat */}
        <rect x="42" y="150" width="10" height="25" rx="3" fill="#1C1917" />
        <rect x="58" y="150" width="10" height="25" rx="3" fill="#1C1917" />
        {/* Boots */}
        <rect x="40" y="170" width="14" height="14" rx="3" fill="#0C0A09" />
        <rect x="56" y="170" width="14" height="14" rx="3" fill="#0C0A09" />
        
        {/* Arms in coat */}
        <rect x="15" y="72" width="13" height="45" rx="5" fill="#1C1917" />
        <rect x="82" y="72" width="13" height="45" rx="5" fill="#1C1917" />
        
        {/* Gloved hands */}
        <circle cx="21" cy="120" r="6" fill="#292524" />
        <circle cx="89" cy="120" r="6" fill="#292524" />
        
        {/* Energy in hand when attacking */}
        {isAttacking && (
          <motion.g>
            <motion.circle cx="89" cy="118" r="10" fill="#DC2626" opacity="0.5"
              animate={{ r: [8, 15, 8], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 0.3, repeat: 3 }}
            />
            <motion.circle cx="89" cy="118" r="5" fill="#FCA5A5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.2, repeat: 5 }}
            />
          </motion.g>
        )}
        
        {/* Head */}
        <circle cx="55" cy="40" r="22" fill="#C4A882" />
        
        {/* Hair - swept back, gray at temples */}
        <path d="M33 35 Q33 12 55 8 Q77 12 77 35 L77 28 Q77 10 55 5 Q33 10 33 28 Z" fill="#292524" />
        <path d="M33 30 Q33 22 40 20" fill="none" stroke="#6B7280" strokeWidth="2" />
        <path d="M77 30 Q77 22 70 20" fill="none" stroke="#6B7280" strokeWidth="2" />
        
        {/* Stern eyes */}
        <ellipse cx="46" cy="38" rx="4" ry="3" fill="white" />
        <ellipse cx="64" cy="38" rx="4" ry="3" fill="white" />
        <circle cx="46" cy="38" r="2" fill="#7F1D1D" />
        <circle cx="64" cy="38" r="2" fill="#7F1D1D" />
        {/* Red glint in eyes */}
        <motion.circle cx="46" cy="37" r="0.8" fill="#EF4444"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle cx="64" cy="37" r="0.8" fill="#EF4444"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        
        {/* Furrowed brows */}
        <line x1="40" y1="32" x2="50" y2="34" stroke="#44403C" strokeWidth="2" />
        <line x1="70" y1="32" x2="60" y2="34" stroke="#44403C" strokeWidth="2" />
        
        {/* Scar across left eye */}
        <line x1="42" y1="30" x2="48" y2="45" stroke="#A8A29E" strokeWidth="1" />
        
        {/* Thin stern mouth */}
        <line x1="45" y1="50" x2="65" y2="50" stroke="#78716C" strokeWidth="1.5" />
        
        {/* Medal/insignia on chest */}
        <circle cx="55" cy="75" r="5" fill="#B91C1C" />
        <motion.circle cx="55" cy="75" r="3" fill="#EF4444"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <polygon points="55,70 57,73 55,72 53,73" fill="#FCA5A5" />
        
        {isHit && <rect x="0" y="0" width="110" height="200" fill="rgba(255,255,255,0.4)" rx="10" />}
      </svg>

      {showDamageNum && showDamage && (
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl font-black text-red-500 pointer-events-none"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -50 }}
          style={{ textShadow: '2px 2px 0 #000' }}
        >
          -{showDamage}
        </motion.div>
      )}
    </motion.div>
  );
};
