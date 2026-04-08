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

// Echo Wraith Silhouette (World 5 - Ghostly spectral form)
export const EchoWraithSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  
  return (
    <motion.div
      className="relative"
      animate={isUnlocked ? {
        filter: [
          'drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))',
          'drop-shadow(0 0 12px rgba(139, 92, 246, 0.8))',
          'drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="echoWraithGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#8B5CF6" : "#475569"} stopOpacity="0.8" />
            <stop offset="100%" stopColor={isUnlocked ? "#4C1D95" : "#1E293B"} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Ghostly body - wispy form */}
        <motion.path
          d="M40 10 Q55 15 55 35 Q60 45 55 55 Q50 70 40 75 Q30 70 25 55 Q20 45 25 35 Q25 15 40 10"
          fill="url(#echoWraithGrad)"
          animate={isUnlocked ? { opacity: [0.6, 0.9, 0.6] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Ethereal wisps */}
        <motion.path
          d="M25 40 Q15 35 10 45 Q15 50 25 48"
          stroke={isUnlocked ? "#A78BFA" : "#475569"}
          strokeWidth="2"
          fill="none"
          animate={isUnlocked ? { opacity: [0.3, 0.7, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.path
          d="M55 40 Q65 35 70 45 Q65 50 55 48"
          stroke={isUnlocked ? "#A78BFA" : "#475569"}
          strokeWidth="2"
          fill="none"
          animate={isUnlocked ? { opacity: [0.3, 0.7, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        {/* Glowing eyes */}
        {isUnlocked && (
          <>
            <motion.circle
              cx="34"
              cy="30"
              r="3"
              fill="#E879F9"
              animate={{
                opacity: [0.4, 1, 0.4],
                filter: ['drop-shadow(0 0 2px #E879F9)', 'drop-shadow(0 0 8px #E879F9)', 'drop-shadow(0 0 2px #E879F9)'],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.circle
              cx="46"
              cy="30"
              r="3"
              fill="#E879F9"
              animate={{
                opacity: [0.4, 1, 0.4],
                filter: ['drop-shadow(0 0 2px #E879F9)', 'drop-shadow(0 0 8px #E879F9)', 'drop-shadow(0 0 2px #E879F9)'],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// Zephyr Silhouette (World 6 - Wind lord with flowing robes)
export const ZephyrSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  
  return (
    <motion.div
      className="relative"
      animate={isUnlocked ? {
        filter: [
          'drop-shadow(0 0 4px rgba(56, 189, 248, 0.5))',
          'drop-shadow(0 0 12px rgba(56, 189, 248, 0.8))',
          'drop-shadow(0 0 4px rgba(56, 189, 248, 0.5))',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="zephyrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#38BDF8" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#0369A1" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Flowing robes */}
        <path
          d="M40 15 L55 30 L60 55 L55 75 L40 70 L25 75 L20 55 L25 30 L40 15"
          fill="url(#zephyrGrad)"
        />
        {/* Head */}
        <circle cx="40" cy="18" r="10" fill="url(#zephyrGrad)" />
        {/* Wind wings */}
        <motion.path
          d="M20 35 Q5 25 5 40 Q5 50 15 45 L20 40"
          fill="url(#zephyrGrad)"
          animate={isUnlocked ? { x: [-2, 2, -2], rotate: [-5, 5, -5] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.path
          d="M60 35 Q75 25 75 40 Q75 50 65 45 L60 40"
          fill="url(#zephyrGrad)"
          animate={isUnlocked ? { x: [2, -2, 2], rotate: [5, -5, 5] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        />
        {/* Wind swirls */}
        {isUnlocked && (
          <>
            <motion.circle
              cx="12"
              cy="60"
              r="4"
              stroke="#7DD3FC"
              strokeWidth="1.5"
              fill="none"
              animate={{ rotate: 360, opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="68"
              cy="60"
              r="4"
              stroke="#7DD3FC"
              strokeWidth="1.5"
              fill="none"
              animate={{ rotate: -360, opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
        {/* Glowing eyes */}
        {isUnlocked && (
          <>
            <motion.circle
              cx="36"
              cy="17"
              r="2"
              fill="#BAE6FD"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.circle
              cx="44"
              cy="17"
              r="2"
              fill="#BAE6FD"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.1 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// Leviathan Silhouette (World 7 - Sea serpent emerging from waves)
export const LeviathanSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  
  return (
    <motion.div
      className="relative"
      animate={isUnlocked ? {
        filter: [
          'drop-shadow(0 0 4px rgba(20, 184, 166, 0.5))',
          'drop-shadow(0 0 12px rgba(20, 184, 166, 0.8))',
          'drop-shadow(0 0 4px rgba(20, 184, 166, 0.5))',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="leviathanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#14B8A6" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#0F766E" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Serpent body rising from waves */}
        <motion.path
          d="M20 75 Q15 65 25 55 Q35 45 30 35 Q25 25 35 15 Q42 10 50 15 Q55 20 50 30"
          stroke="url(#leviathanGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          animate={isUnlocked ? { d: [
            "M20 75 Q15 65 25 55 Q35 45 30 35 Q25 25 35 15 Q42 10 50 15 Q55 20 50 30",
            "M20 75 Q18 63 28 53 Q38 43 33 33 Q28 23 38 13 Q45 8 53 13 Q58 18 53 28",
            "M20 75 Q15 65 25 55 Q35 45 30 35 Q25 25 35 15 Q42 10 50 15 Q55 20 50 30",
          ]} : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Head */}
        <motion.ellipse
          cx="50"
          cy="28"
          rx="12"
          ry="10"
          fill="url(#leviathanGrad)"
          animate={isUnlocked ? { cy: [28, 26, 28] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Waves */}
        <motion.path
          d="M5 70 Q15 65 25 70 Q35 75 45 70 Q55 65 65 70 Q75 75 80 70"
          stroke={isUnlocked ? "#5EEAD4" : "#64748B"}
          strokeWidth="3"
          fill="none"
          animate={isUnlocked ? { 
            d: [
              "M5 70 Q15 65 25 70 Q35 75 45 70 Q55 65 65 70 Q75 75 80 70",
              "M5 70 Q15 75 25 70 Q35 65 45 70 Q55 75 65 70 Q75 65 80 70",
              "M5 70 Q15 65 25 70 Q35 75 45 70 Q55 65 65 70 Q75 75 80 70",
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Glowing eyes */}
        {isUnlocked && (
          <>
            <motion.circle
              cx="45"
              cy="26"
              r="2"
              fill="#2DD4BF"
              animate={{
                opacity: [0.5, 1, 0.5],
                filter: ['drop-shadow(0 0 2px #2DD4BF)', 'drop-shadow(0 0 6px #2DD4BF)', 'drop-shadow(0 0 2px #2DD4BF)'],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.circle
              cx="55"
              cy="26"
              r="2"
              fill="#2DD4BF"
              animate={{
                opacity: [0.5, 1, 0.5],
                filter: ['drop-shadow(0 0 2px #2DD4BF)', 'drop-shadow(0 0 6px #2DD4BF)', 'drop-shadow(0 0 2px #2DD4BF)'],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// Word Eater Silhouette (World 8 - Void creature with glowing eyes)
export const WordEaterSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  
  return (
    <motion.div
      className="relative"
      animate={isUnlocked ? {
        filter: [
          'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))',
          'drop-shadow(0 0 15px rgba(168, 85, 247, 0.9))',
          'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <radialGradient id="wordEaterGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isUnlocked ? "#1E1B4B" : "#1E293B"} stopOpacity="1" />
            <stop offset="100%" stopColor={isUnlocked ? "#0F0A1A" : "#0F172A"} stopOpacity="1" />
          </radialGradient>
        </defs>
        {/* Void mass */}
        <motion.ellipse
          cx="40"
          cy="40"
          rx="30"
          ry="28"
          fill="url(#wordEaterGrad)"
          stroke={isUnlocked ? "#7C3AED" : "#475569"}
          strokeWidth="2"
          animate={isUnlocked ? { 
            rx: [30, 32, 30],
            ry: [28, 30, 28],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Dark tendrils */}
        <motion.path
          d="M15 45 Q5 50 8 60 Q12 65 18 58"
          stroke={isUnlocked ? "#6D28D9" : "#475569"}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={isUnlocked ? { d: [
            "M15 45 Q5 50 8 60 Q12 65 18 58",
            "M15 45 Q3 52 6 62 Q10 68 16 60",
            "M15 45 Q5 50 8 60 Q12 65 18 58",
          ]} : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M65 45 Q75 50 72 60 Q68 65 62 58"
          stroke={isUnlocked ? "#6D28D9" : "#475569"}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={isUnlocked ? { d: [
            "M65 45 Q75 50 72 60 Q68 65 62 58",
            "M65 45 Q77 52 74 62 Q70 68 64 60",
            "M65 45 Q75 50 72 60 Q68 65 62 58",
          ]} : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.path
          d="M35 68 Q30 75 40 78 Q50 75 45 68"
          stroke={isUnlocked ? "#6D28D9" : "#475569"}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={isUnlocked ? { opacity: [0.5, 0.8, 0.5] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Giant glowing eye */}
        {isUnlocked ? (
          <motion.g>
            <motion.ellipse
              cx="40"
              cy="38"
              rx="10"
              ry="8"
              fill="#1E1B4B"
              stroke="#A855F7"
              strokeWidth="2"
            />
            <motion.circle
              cx="40"
              cy="38"
              r="4"
              fill="#E879F9"
              animate={{
                r: [4, 5, 4],
                filter: ['drop-shadow(0 0 4px #E879F9)', 'drop-shadow(0 0 12px #E879F9)', 'drop-shadow(0 0 4px #E879F9)'],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.circle
              cx="40"
              cy="38"
              r="2"
              fill="#FFFFFF"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </motion.g>
        ) : (
          <ellipse cx="40" cy="38" rx="8" ry="6" fill="#334155" />
        )}
      </svg>
    </motion.div>
  );
};

// Agent Mode Boss Silhouettes

// The Broker Silhouette (Agent World 1 - suited crime boss)
export const BrokerSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative"
      animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))', 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.8))', 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="brokerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#78716C" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#292524" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M30 25 L25 75 L55 75 L50 25" fill="url(#brokerGrad)" />
        <circle cx="40" cy="20" r="10" fill="url(#brokerGrad)" />
        <path d="M28 15 L40 8 L52 15" fill="url(#brokerGrad)" />
        <line x1="40" y1="30" x2="40" y2="60" stroke={isUnlocked ? "#F59E0B" : "#475569"} strokeWidth="1.5" />
        {isUnlocked && (
          <>
            <motion.circle cx="36" cy="19" r="1.5" fill="#FBBF24" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
            <motion.circle cx="44" cy="19" r="1.5" fill="#FBBF24" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// The Architect Silhouette (Agent World 2 - tech helmet figure)
export const ArchitectSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative"
      animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(6, 182, 212, 0.5))', 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.8))', 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.5))'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="architectGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#0E7490" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#164E63" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M30 28 L20 75 L60 75 L50 28" fill="url(#architectGrad)" />
        <rect x="28" y="10" width="24" height="20" rx="4" fill="url(#architectGrad)" />
        <rect x="30" y="18" width="20" height="6" rx="2" fill={isUnlocked ? "#22D3EE" : "#475569"} opacity="0.5" />
        {isUnlocked && (
          <motion.rect x="32" y="19" width="16" height="4" rx="1" fill="#22D3EE" opacity="0.3"
            animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }} />
        )}
        <path d="M15 35 L30 30 L30 50 L15 45" fill="url(#architectGrad)" />
        <path d="M65 35 L50 30 L50 50 L65 45" fill="url(#architectGrad)" />
        {isUnlocked && (
          <>
            <motion.circle cx="40" cy="50" r="5" stroke="#22D3EE" strokeWidth="1" fill="none"
              animate={{ r: [5, 8, 5], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// The Double Agent Silhouette (Agent World 3 - split face)
export const DoubleAgentSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative"
      animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))', 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.8))', 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="doubleAgentGradL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#3B82F6" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#1E3A8A" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="doubleAgentGradR" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#EF4444" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#7F1D1D" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M40 10 L40 75 L25 75 L20 25 Q25 10 40 10" fill="url(#doubleAgentGradL)" />
        <path d="M40 10 L40 75 L55 75 L60 25 Q55 10 40 10" fill="url(#doubleAgentGradR)" />
        <line x1="40" y1="10" x2="40" y2="75" stroke={isUnlocked ? "#FBBF24" : "#64748B"} strokeWidth="1" />
        {isUnlocked && (
          <>
            <motion.circle cx="34" cy="25" r="2" fill="#60A5FA" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <motion.circle cx="46" cy="25" r="2" fill="#F87171" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// The Director Silhouette (Agent World 4 - commanding figure)
export const DirectorSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative"
      animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))', 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.9))', 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="directorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#1E293B" : "#475569"} stopOpacity="0.95" />
            <stop offset="100%" stopColor={isUnlocked ? "#0F172A" : "#1E293B"} stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path d="M25 20 L55 20 L60 55 L55 75 L25 75 L20 55 L25 20" fill="url(#directorGrad)" />
        <circle cx="40" cy="15" r="10" fill="url(#directorGrad)" />
        <path d="M15 25 L25 22 L25 50 L15 45" fill="url(#directorGrad)" />
        <path d="M65 25 L55 22 L55 50 L65 45" fill="url(#directorGrad)" />
        <path d="M30 20 L25 18 L35 12 L40 10 L45 12 L55 18 L50 20"
          fill={isUnlocked ? "#DC2626" : "#475569"} opacity="0.8" />
        {isUnlocked && (
          <>
            <motion.circle cx="36" cy="14" r="2" fill="#EF4444"
              animate={{ opacity: [0.5, 1, 0.5], filter: ['drop-shadow(0 0 2px #EF4444)', 'drop-shadow(0 0 6px #EF4444)', 'drop-shadow(0 0 2px #EF4444)'] }}
              transition={{ duration: 1, repeat: Infinity }} />
            <motion.circle cx="44" cy="14" r="2" fill="#EF4444"
              animate={{ opacity: [0.5, 1, 0.5], filter: ['drop-shadow(0 0 2px #EF4444)', 'drop-shadow(0 0 6px #EF4444)', 'drop-shadow(0 0 2px #EF4444)'] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
            <motion.rect x="30" y="40" width="20" height="3" rx="1" fill="#EF4444"
              animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// The Warden Silhouette (Agent World 5 - military commander)
export const WardenSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative"
      animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))', 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))', 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="wardenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#065F46" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#022C22" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M28 25 L52 25 L58 75 L22 75 Z" fill="url(#wardenGrad)" />
        <circle cx="40" cy="18" r="10" fill="url(#wardenGrad)" />
        <ellipse cx="40" cy="12" rx="14" ry="5" fill={isUnlocked ? "#065F46" : "#475569"} />
        <rect x="15" y="28" width="12" height="30" rx="3" fill="url(#wardenGrad)" />
        <rect x="53" y="28" width="12" height="30" rx="3" fill="url(#wardenGrad)" />
        {isUnlocked && (
          <>
            <motion.rect x="32" y="16" width="16" height="4" rx="1" fill="#10B981" opacity="0.6"
              animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <rect x="16" y="28" width="10" height="3" rx="1" fill="#D97706" opacity="0.8" />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// The Commander Silhouette (Agent World 6 - space commander)
export const CommanderSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative"
      animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(129, 140, 248, 0.5))', 'drop-shadow(0 0 12px rgba(129, 140, 248, 0.8))', 'drop-shadow(0 0 4px rgba(129, 140, 248, 0.5))'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="commanderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#312E81" : "#475569"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isUnlocked ? "#1E1B4B" : "#1E293B"} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M28 28 L22 75 L58 75 L52 28" fill="url(#commanderGrad)" />
        <circle cx="40" cy="20" r="11" fill="url(#commanderGrad)" />
        <rect x="15" y="30" width="12" height="28" rx="4" fill="url(#commanderGrad)" />
        <rect x="53" y="30" width="12" height="28" rx="4" fill="url(#commanderGrad)" />
        {isUnlocked && (
          <>
            <rect x="16" y="30" width="3" height="10" rx="1" fill="#F59E0B" opacity="0.8" />
            <rect x="21" y="30" width="3" height="10" rx="1" fill="#F59E0B" opacity="0.8" />
            <motion.polygon points="40,50 43,55 49,55 44,58 46,64 40,60 34,64 36,58 31,55 37,55" fill="#F59E0B"
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// The Phantom Silhouette (Agent World 7 - hooded hacker ghost)
export const PhantomSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative"
      animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(74, 222, 128, 0.5))', 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.8))', 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.5))'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="phantomGradS" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#14532D" : "#475569"} stopOpacity="0.8" />
            <stop offset="100%" stopColor={isUnlocked ? "#022C22" : "#1E293B"} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <path d="M40 12 L15 40 L12 75 L35 72 L40 70 L45 72 L68 75 L65 40 Z" fill="url(#phantomGradS)" />
        <path d="M28 20 Q40 8 52 20 Q54 35 40 38 Q26 35 28 20" fill={isUnlocked ? "#064E3B" : "#334155"} />
        {isUnlocked && (
          <>
            <motion.circle cx="35" cy="28" r="2.5" fill="#4ADE80"
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <motion.circle cx="45" cy="28" r="2.5" fill="#4ADE80"
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// The Overseer Silhouette (Agent World 8 - elegant mastermind, final boss)
export const OverseerSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative"
      animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(244, 63, 94, 0.5))', 'drop-shadow(0 0 15px rgba(244, 63, 94, 0.9))', 'drop-shadow(0 0 4px rgba(244, 63, 94, 0.5))'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="overseerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? "#1C1917" : "#475569"} stopOpacity="0.95" />
            <stop offset="100%" stopColor={isUnlocked ? "#000000" : "#1E293B"} stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path d="M27 22 L53 22 L58 55 L55 75 L25 75 L22 55 Z" fill="url(#overseerGrad)" />
        <circle cx="40" cy="16" r="11" fill="url(#overseerGrad)" />
        <path d="M38 22 L36 45 L40 65 L44 45 L42 22" fill={isUnlocked ? "#BE123C" : "#475569"} opacity="0.8" />
        <rect x="13" y="25" width="16" height="32" rx="4" fill="url(#overseerGrad)" />
        <rect x="51" y="25" width="16" height="32" rx="4" fill="url(#overseerGrad)" />
        {isUnlocked && (
          <>
            <motion.circle cx="36" cy="15" r="2" fill="#F43F5E"
              animate={{ opacity: [0.4, 1, 0.4], filter: ['drop-shadow(0 0 2px #F43F5E)', 'drop-shadow(0 0 6px #F43F5E)', 'drop-shadow(0 0 2px #F43F5E)'] }}
              transition={{ duration: 1, repeat: Infinity }} />
            <motion.circle cx="44" cy="15" r="2" fill="#F43F5E"
              animate={{ opacity: [0.4, 1, 0.4], filter: ['drop-shadow(0 0 2px #F43F5E)', 'drop-shadow(0 0 6px #F43F5E)', 'drop-shadow(0 0 2px #F43F5E)'] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
            <motion.rect x="36" y="45" width="8" height="2" rx="1" fill="#F59E0B"
              animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
          </>
        )}
      </svg>
    </motion.div>
  );
};

// Ember Drake Silhouette (World 9 boss)
export const EmberDrakeSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))', 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.8))', 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))'] } : {}} transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs><linearGradient id="emberDrakeSilGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={isUnlocked ? "#DC2626" : "#475569"} /><stop offset="100%" stopColor={isUnlocked ? "#92400E" : "#1E293B"} /></linearGradient></defs>
        <path d="M40 10 L55 25 L70 20 L60 35 L65 55 L50 50 L40 65 L30 50 L15 55 L20 35 L10 20 L25 25 Z" fill="url(#emberDrakeSilGrad)" />
        {isUnlocked && (<><motion.circle cx="35" cy="30" r="2" fill="#FCD34D" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} /><motion.circle cx="45" cy="30" r="2" fill="#FCD34D" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} /></>)}
      </svg>
    </motion.div>
  );
};

// Crystal Queen Silhouette (World 10 boss)
export const CrystalQueenSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(192, 132, 252, 0.5))', 'drop-shadow(0 0 12px rgba(232, 121, 249, 0.8))', 'drop-shadow(0 0 4px rgba(192, 132, 252, 0.5))'] } : {}} transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs><linearGradient id="crystalQueenSilGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={isUnlocked ? "#C084FC" : "#475569"} /><stop offset="100%" stopColor={isUnlocked ? "#E879F9" : "#1E293B"} /></linearGradient></defs>
        <path d="M28 25 L53 25 L58 60 L55 75 L25 75 L22 60 Z" fill="url(#crystalQueenSilGrad)" />
        <circle cx="40" cy="18" r="10" fill="url(#crystalQueenSilGrad)" />
        <path d="M30 12 L33 2 L37 9 L40 0 L43 9 L47 2 L50 12" fill={isUnlocked ? "#FCD34D" : "#475569"} />
        {isUnlocked && (<><motion.circle cx="36" cy="17" r="2" fill="#E879F9" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} /><motion.circle cx="44" cy="17" r="2" fill="#E879F9" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} /></>)}
      </svg>
    </motion.div>
  );
};

// Nova Titan Silhouette (World 11 boss)
export const NovaTitanSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(253, 230, 138, 0.5))', 'drop-shadow(0 0 12px rgba(253, 230, 138, 0.9))', 'drop-shadow(0 0 4px rgba(253, 230, 138, 0.5))'] } : {}} transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs><linearGradient id="novaTitanSilGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={isUnlocked ? "#312E81" : "#475569"} /><stop offset="100%" stopColor={isUnlocked ? "#4338CA" : "#1E293B"} /></linearGradient></defs>
        <path d="M28 22 L52 22 L58 55 L55 75 L25 75 L22 55 Z" fill="url(#novaTitanSilGrad)" />
        <circle cx="40" cy="16" r="11" fill="url(#novaTitanSilGrad)" />
        <path d="M30 10 L33 2 L36 8 L40 0 L44 8 L47 2 L50 10" fill={isUnlocked ? "#FDE68A" : "#475569"} />
        {isUnlocked && (<><motion.circle cx="36" cy="15" r="2" fill="#FDE68A" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} /><motion.circle cx="44" cy="15" r="2" fill="#FDE68A" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} /><motion.circle cx="40" cy="45" r="4" fill="#FDE68A" opacity="0.4" animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity }} /></>)}
      </svg>
    </motion.div>
  );
};

// The Librarian Silhouette (World 12 final boss)
export const LibrarianSilhouette = ({ isUnlocked, size = 'medium' }: SilhouetteProps) => {
  const { width, height } = sizeConfig[size];
  return (
    <motion.div className="relative" animate={isUnlocked ? { filter: ['drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))', 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.9))', 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))'] } : {}} transition={{ duration: 2, repeat: Infinity }}>
      <svg width={width} height={height} viewBox="0 0 80 80" fill="none">
        <defs><linearGradient id="librarianSilGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={isUnlocked ? "#1C1917" : "#475569"} /><stop offset="100%" stopColor={isUnlocked ? "#292524" : "#1E293B"} /></linearGradient></defs>
        <path d="M30 28 Q40 15 50 28 Q52 40 40 42 Q28 40 30 28" fill={isUnlocked ? "#292524" : "#334155"} />
        <path d="M27 25 L53 25 L58 55 L55 75 L25 75 L22 55 Z" fill="url(#librarianSilGrad)" />
        {isUnlocked && (<><motion.circle cx="36" cy="32" r="2.5" fill="#22C55E" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} /><motion.circle cx="44" cy="32" r="2.5" fill="#22C55E" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} /><motion.rect x="55" y="35" width="8" height="10" rx="1" fill="#92400E" opacity="0.7" animate={{ y: [35, 30, 35] }} transition={{ duration: 2, repeat: Infinity }} /></>)}
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
  EchoWraith: EchoWraithSilhouette,
  Zephyr: ZephyrSilhouette,
  Leviathan: LeviathanSilhouette,
  WordEater: WordEaterSilhouette,
  Broker: BrokerSilhouette,
  Architect: ArchitectSilhouette,
  DoubleAgent: DoubleAgentSilhouette,
  Director: DirectorSilhouette,
  Warden: WardenSilhouette,
  Commander: CommanderSilhouette,
  Phantom: PhantomSilhouette,
  Overseer: OverseerSilhouette,
  EmberDrake: EmberDrakeSilhouette,
  CrystalQueen: CrystalQueenSilhouette,
  NovaTitan: NovaTitanSilhouette,
  Librarian: LibrarianSilhouette,
};
