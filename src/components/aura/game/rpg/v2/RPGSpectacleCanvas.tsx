import { useEffect, useRef, useState } from 'react';
import {
  SpectacleRenderer,
  subscribeSpectacle,
  isSpectacleEnabled,
  detectQuality,
} from '@/lib/rpg/spectacleEngine';

interface Props {
  /** Stacking context above the arena art, below the reading UI. */
  zIndex?: number;
  className?: string;
}

/**
 * The single canvas that every combat effect draws into.
 *
 * Mount once per arena. It never intercepts pointer events, never re-renders
 * on cues (the rAF loop lives outside React), and disables itself entirely
 * under reduced-motion or the schools' spectacle toggle.
 */
export function RPGSpectacleCanvas({ zIndex = 57, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<SpectacleRenderer | null>(null);

  useEffect(() => {
    if (!isSpectacleEnabled()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new SpectacleRenderer(detectQuality());
    rendererRef.current = renderer;
    renderer.attach(canvas);

    const unsub = subscribeSpectacle((cue) => renderer.handle(cue));

    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(canvas);

    return () => {
      unsub();
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
      renderer.detach();
      rendererRef.current = null;
    };
  }, []);

  if (!isSpectacleEnabled()) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? 'pointer-events-none absolute inset-0 h-full w-full'}
      style={{ zIndex }}
    />
  );
}

export default RPGSpectacleCanvas;
