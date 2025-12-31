import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DamageInstance {
  id: number;
  value: number;
  isCritical: boolean;
  x: number;
  y: number;
}

interface DamageNumberProps {
  damage: number;
  trigger: number;
  isCritical?: boolean;
  type?: 'enemy' | 'player' | 'heal';
  position?: { x: number; y: number };
}

const typeColors = {
  enemy: {
    normal: 'text-red-500',
    critical: 'text-yellow-400',
    shadow: 'drop-shadow-[0_2px_4px_rgba(239,68,68,0.8)]',
    criticalShadow: 'drop-shadow-[0_2px_8px_rgba(250,204,21,1)]',
  },
  player: {
    normal: 'text-white',
    critical: 'text-red-600',
    shadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
    criticalShadow: 'drop-shadow-[0_2px_8px_rgba(220,38,38,1)]',
  },
  heal: {
    normal: 'text-emerald-400',
    critical: 'text-emerald-300',
    shadow: 'drop-shadow-[0_2px_4px_rgba(52,211,153,0.8)]',
    criticalShadow: 'drop-shadow-[0_2px_8px_rgba(110,231,183,1)]',
  },
};

export const DamageNumber = ({
  damage,
  trigger,
  isCritical = false,
  type = 'enemy',
  position = { x: 50, y: 30 },
}: DamageNumberProps) => {
  const [instances, setInstances] = useState<DamageInstance[]>([]);
  const colors = typeColors[type];

  useEffect(() => {
    if (trigger > 0 && damage > 0) {
      const newInstance: DamageInstance = {
        id: Date.now(),
        value: damage,
        isCritical,
        x: position.x + (Math.random() - 0.5) * 20,
        y: position.y,
      };
      setInstances(prev => [...prev, newInstance]);

      // Clean up after animation
      setTimeout(() => {
        setInstances(prev => prev.filter(i => i.id !== newInstance.id));
      }, 1000);
    }
  }, [trigger, damage, isCritical, position.x, position.y]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      <AnimatePresence>
        {instances.map((instance) => (
          <motion.div
            key={instance.id}
            className={`absolute font-black ${
              instance.isCritical 
                ? `${colors.critical} ${colors.criticalShadow} text-3xl` 
                : `${colors.normal} ${colors.shadow} text-2xl`
            }`}
            style={{
              left: `${instance.x}%`,
              top: `${instance.y}%`,
              transform: 'translate(-50%, -50%)',
              textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
            }}
            initial={{ 
              scale: instance.isCritical ? 1.5 : 1.2, 
              opacity: 1, 
              y: 0 
            }}
            animate={{ 
              scale: 1, 
              opacity: 0, 
              y: -50 
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {instance.isCritical && (
              <motion.span
                className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-yellow-300 whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                CRITICAL!
              </motion.span>
            )}
            {type === 'heal' ? '+' : '-'}{instance.value}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
