import { motion } from "framer-motion";

interface SilhouetteProps {
  isUnlocked: boolean;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = {
  small: { width: 40, height: 40 },
  medium: { width: 60, height: 60 },
  large: { width: 80, height: 80 },
};

// Drake the Dragon Silhouette
export const DrakeSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  
  return (
    <motion.div
      className="relative"
      animate={isUnlocked ? {
        filter: [
          'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))',
          'drop-shadow(0 0 12px rgba(239, 68, 68, 0.8))',
          'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="drakeSilhouetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#EF4444" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#7F1D1D" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Dragon body silhouette */}
        <path
          d="M40 10 L55 20 L60 15 L58 25 L70 30 L60 35 L65 50 L50 45 L45 60 L40 50 L35 60 L30 45 L15 50 L20 35 L10 30 L22 25 L20 15 L25 20 L40 10"
          fill="url(#drakeSilhouetteGrad)"
        />
        {/* Wings */}
        <motion.path
          d="M15 25 L5 15 L8 30 L15 25"
          fill="url(#drakeSilhouetteGrad)"
          animate={isUnlocked ? { y: [0, -2, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.path
          d="M65 25 L75 15 L72 30 L65 25"
          fill="url(#drakeSilhouetteGrad)"
          animate={isUnlocked ? { y: [0, -2, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        />
        {/* Glowing eyes */}
        {isUnlocked && (
          <>
            <motion.circle
              cx="35"
              cy="25"
              r="2"
              fill="#FBBF24"
              animate={{
                opacity: [0.5, 1, 0.5],
                filter: ['drop-shadow(0 0 2px #FCD34D)', 'drop-shadow(0 0 6px #FCD34D)', 'drop-shadow(0 0 2px #FCD34D)'],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.circle
              cx="45"
              cy="25"
              r="2"
              fill="#FBBF24"
              animate={{
                opacity: [0.5, 1, 0.5],
                filter: ['drop-shadow(0 0 2px #FCD34D)', 'drop-shadow(0 0 6px #FCD34D)', 'drop-shadow(0 0 2px #FCD34D)'],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// Ice Golem Silhouette
export const IceGolemSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  
  return (
    <motion.div
      className="relative"
      animate={isUnlocked ? {
        filter: [
          'drop-shadow(0 0 4px rgba(6, 182, 212, 0.5))',
          'drop-shadow(0 0 12px rgba(6, 182, 212, 0.8))',
          'drop-shadow(0 0 4px rgba(6, 182, 212, 0.5))',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="iceGolemSilhouetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#06B6D4" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#0E7490" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Crystalline body */}
        <path
          d="M40 5 L55 20 L60 45 L50 70 L40 75 L30 70 L20 45 L25 20 L40 5"
          fill="url(#iceGolemSilhouetteGrad)"
        />
        {/* Crystal spikes */}
        <path d="M25 20 L15 10 L20 25" fill="url(#iceGolemSilhouetteGrad)" />
        <path d="M55 20 L65 10 L60 25" fill="url(#iceGolemSilhouetteGrad)" />
        <path d="M30 30 L20 25 L28 35" fill="url(#iceGolemSilhouetteGrad)" />
        <path d="M50 30 L60 25 L52 35" fill="url(#iceGolemSilhouetteGrad)" />
        {/* Glowing core */}
        {isUnlocked && (
          <motion.circle
            cx="40"
            cy="40"
            r="8"
            fill="#22D3EE"
            opacity="0.6"
            animate={{
              r: [8, 10, 8],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </svg>
    </motion.div>
  );
};

// Stone Guardian Silhouette
export const StoneGuardianSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  
  return (
    <motion.div
      className="relative"
      animate={isUnlocked ? {
        filter: [
          'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))',
          'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))',
          'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="stoneGuardianSilhouetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#78716C" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#44403C" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Massive body */}
        <path
          d="M25 15 L55 15 L65 30 L60 55 L55 75 L25 75 L20 55 L15 30 L25 15"
          fill="url(#stoneGuardianSilhouetteGrad)"
        />
        {/* Head */}
        <rect x="30" y="8" width="20" height="15" rx="2" fill="url(#stoneGuardianSilhouetteGrad)" />
        {/* Arms */}
        <path d="M15 30 L5 35 L10 50 L20 45" fill="url(#stoneGuardianSilhouetteGrad)" />
        <path d="M65 30 L75 35 L70 50 L60 45" fill="url(#stoneGuardianSilhouetteGrad)" />
        {/* Glowing runes */}
        {isUnlocked && (
          <>
            <motion.rect
              x="35" y="35" width="10" height="3" rx="1"
              fill="#F59E0B"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.rect
              x="35" y="45" width="10" height="3" rx="1"
              fill="#F59E0B"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
            <motion.rect
              x="35" y="55" width="10" height="3" rx="1"
              fill="#F59E0B"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// Grog the Goblin King Silhouette
export const GrogSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  
  return (
    <motion.div
      className="relative"
      animate={isUnlocked ? {
        filter: [
          'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))',
          'drop-shadow(0 0 12px rgba(34, 197, 94, 0.8))',
          'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="grogSilhouetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#22C55E" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#14532D" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Goblin body */}
        <ellipse cx="40" cy="50" rx="20" ry="25" fill="url(#grogSilhouetteGrad)" />
        {/* Head */}
        <circle cx="40" cy="25" r="15" fill="url(#grogSilhouetteGrad)" />
        {/* Pointy ears */}
        <path d="M25 20 L15 5 L28 15" fill="url(#grogSilhouetteGrad)" />
        <path d="M55 20 L65 5 L52 15" fill="url(#grogSilhouetteGrad)" />
        {/* Crown */}
        <path
          d="M28 12 L30 5 L35 10 L40 3 L45 10 L50 5 L52 12"
          fill={isUnlocked ? "#FBBF24" : "#64748B"}
          stroke={isUnlocked ? "#F59E0B" : "#475569"}
          strokeWidth="1"
        />
        {/* Glowing eyes */}
        {isUnlocked && (
          <>
            <motion.circle
              cx="34"
              cy="23"
              r="2"
              fill="#EF4444"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.circle
              cx="46"
              cy="23"
              r="2"
              fill="#EF4444"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// Galair the Sorcerer Silhouette
export const GalairSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  
  return (
    <motion.div
      className="relative"
      animate={isUnlocked ? {
        filter: [
          'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))',
          'drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))',
          'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="galairSilhouetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#A855F7" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#581C87" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Robes */}
        <path
          d="M30 25 L20 75 L60 75 L50 25"
          fill="url(#galairSilhouetteGrad)"
        />
        {/* Head */}
        <circle cx="40" cy="18" r="10" fill="url(#galairSilhouetteGrad)" />
        {/* Wizard hat */}
        <path
          d="M30 15 L40 0 L50 15"
          fill="url(#galairSilhouetteGrad)"
        />
        {/* Staff */}
        <line x1="60" y1="15" x2="65" y2="70" stroke={isUnlocked ? "#A855F7" : "#475569"} strokeWidth="3" />
        {/* Staff orb */}
        {isUnlocked && (
          <motion.circle
            cx="60"
            cy="12"
            r="5"
            fill="#E879F9"
            animate={{
              opacity: [0.5, 1, 0.5],
              filter: ['drop-shadow(0 0 3px #E879F9)', 'drop-shadow(0 0 8px #E879F9)', 'drop-shadow(0 0 3px #E879F9)'],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        {/* Glowing eyes */}
        {isUnlocked && (
          <>
            <motion.circle
              cx="36"
              cy="17"
              r="2"
              fill="#E879F9"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.circle
              cx="44"
              cy="17"
              r="2"
              fill="#E879F9"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.1 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// Combined export for convenience
export const BossSilhouettes = {
  Drake: DrakeSilhouette,
  IceGolem: IceGolemSilhouette,
  StoneGuardian: StoneGuardianSilhouette,
  Grog: GrogSilhouette,
  Galair: GalairSilhouette,
};
