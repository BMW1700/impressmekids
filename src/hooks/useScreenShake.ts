import { useState, useCallback, useRef } from 'react';

interface ShakeConfig {
  intensity?: number;
  duration?: number;
}

export const useScreenShake = () => {
  const [shakeStyle, setShakeStyle] = useState<React.CSSProperties>({});
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const shake = useCallback(({ intensity = 3, duration = 150 }: ShakeConfig = {}) => {
    // Clear any existing shake
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }

    // Generate random direction
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * intensity;
    const y = Math.sin(angle) * intensity;

    setShakeStyle({
      transform: `translate(${x}px, ${y}px)`,
      transition: 'transform 0.05s ease-out',
    });

    // Quick oscillation
    setTimeout(() => {
      setShakeStyle({
        transform: `translate(${-x * 0.5}px, ${-y * 0.5}px)`,
        transition: 'transform 0.05s ease-out',
      });
    }, 50);

    // Reset
    shakeTimeoutRef.current = setTimeout(() => {
      setShakeStyle({
        transform: 'translate(0, 0)',
        transition: 'transform 0.1s ease-out',
      });
    }, duration);
  }, []);

  const criticalShake = useCallback(() => {
    shake({ intensity: 5, duration: 200 });
  }, [shake]);

  return { shakeStyle, shake, criticalShake };
};
