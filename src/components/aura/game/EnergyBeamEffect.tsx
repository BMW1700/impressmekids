import { motion, AnimatePresence } from "framer-motion";

export type BeamType = 'attack' | 'damage' | 'power';
export type BeamDirection = 'left-to-right' | 'right-to-left';

interface EnergyBeamEffectProps {
  show: boolean;
  type: BeamType;
  direction: BeamDirection;
  isCritical?: boolean;
  onComplete?: () => void;
}

export const EnergyBeamEffect = ({
  show,
  type,
  direction,
  isCritical = false,
  onComplete,
}: EnergyBeamEffectProps) => {
  const isAttack = type === 'attack';
  const isPower = type === 'power';
  const isLeftToRight = direction === 'left-to-right';
  
  // Colors based on type - power gets purple fire!
  const beamColor = isPower
    ? 'from-purple-600 via-violet-500 to-fuchsia-400'
    : isAttack 
      ? isCritical 
        ? 'from-yellow-400 via-blue-400 to-cyan-300' 
        : 'from-blue-500 via-blue-400 to-cyan-300'
      : 'from-red-600 via-red-500 to-orange-400';
  
  const glowColor = isPower
    ? 'rgba(147, 51, 234, 0.7)'
    : isAttack 
      ? isCritical ? 'rgba(250, 204, 21, 0.6)' : 'rgba(59, 130, 246, 0.5)'
      : 'rgba(239, 68, 68, 0.5)';
  
  // Power beams are always "critical" for visual effect
  const shouldShowParticles = isCritical || isPower;

  const startX = isLeftToRight ? '-100%' : '100%';
  const endX = isLeftToRight ? '200%' : '-200%';

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Main beam */}
          <motion.div
            className={`absolute top-1/2 h-3 bg-gradient-to-r ${beamColor} rounded-full`}
            style={{
              width: shouldShowParticles ? '120%' : '80%',
              boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
              filter: isPower ? 'blur(2px)' : 'blur(1px)',
            }}
            initial={{ 
              x: startX, 
              y: '-50%',
              scaleY: 0.5,
            }}
            animate={{ 
              x: endX,
              scaleY: isPower ? [0.5, 2, 0.5] : [0.5, 1.5, 0.5],
            }}
            transition={{ 
              duration: isPower ? 0.5 : isCritical ? 0.4 : 0.3,
              ease: "easeOut",
            }}
          />
          
          {/* Extra glow layer for power attacks */}
          {isPower && (
            <motion.div
              className="absolute top-1/2 h-6 bg-gradient-to-r from-purple-500/50 via-violet-400/50 to-fuchsia-300/50 rounded-full"
              style={{
                width: '100%',
                filter: 'blur(8px)',
              }}
              initial={{ x: startX, y: '-50%', opacity: 0 }}
              animate={{ x: endX, opacity: [0, 1, 0] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}

          {/* Inner bright core */}
          <motion.div
            className="absolute top-1/2 h-1 bg-white rounded-full"
            style={{
              width: isCritical ? '100%' : '60%',
              boxShadow: '0 0 10px rgba(255,255,255,0.8)',
            }}
            initial={{ 
              x: startX, 
              y: '-50%',
            }}
            animate={{ 
              x: endX,
            }}
            transition={{ 
              duration: isCritical ? 0.35 : 0.25,
              ease: "easeOut",
            }}
          />

          {/* Particle trail */}
          {shouldShowParticles && (
            <>
              {[...Array(isPower ? 8 : 5)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 rounded-full ${
                    isPower ? 'bg-purple-300' : isAttack ? 'bg-cyan-300' : 'bg-orange-400'
                  }`}
                  style={{
                    top: `${35 + Math.random() * 30}%`,
                    boxShadow: `0 0 8px ${glowColor}`,
                  }}
                  initial={{ 
                    x: startX,
                    opacity: 1,
                    scale: isPower ? 1.5 : 1,
                  }}
                  animate={{ 
                    x: endX,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ 
                    duration: isPower ? 0.6 : 0.5,
                    delay: i * 0.04,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}

          {/* Impact flash at destination */}
          <motion.div
            className={`absolute top-1/2 w-16 h-16 rounded-full ${
              isPower ? 'bg-purple-400' : isAttack ? 'bg-cyan-300' : 'bg-red-400'
            }`}
            style={{
              left: isLeftToRight ? 'auto' : '10%',
              right: isLeftToRight ? '10%' : 'auto',
              boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
            }}
            initial={{ 
              opacity: 0,
              scale: 0,
              y: '-50%',
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: isPower ? [0, 3, 4] : [0, 2, 3],
            }}
            transition={{ 
              duration: isPower ? 0.5 : 0.4,
              delay: shouldShowParticles ? 0.3 : 0.2,
              ease: "easeOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
