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

  if (!isSpectacleEnabled()) return <ReducedMotionHitConfirm zIndex={zIndex} />;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? 'pointer-events-none absolute inset-0 h-full w-full'}
      style={{ zIndex }}
    />
  );
}

/**
 * Reduced-motion / spectacle-off fallback.
 *
 * Cues are still emitted when the canvas is disabled, so we keep a minimal
 * hit confirm: a short opacity-only tint. No transforms, no particles, no
 * animation — but the student never loses the feedback that a hit landed.
 */
function ReducedMotionHitConfirm({ zIndex }: { zIndex: number }) {
  const [flash, setFlash] = useState<{ hue: string; power: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = subscribeSpectacle((cue) => {
      if (cue.type !== 'burst' && cue.type !== 'screenFlash') return;
      setFlash({ hue: cue.hue ?? '0 0% 100%', power: cue.power ?? 0.4 });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setFlash(null), 160);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!flash) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        zIndex,
        background: `hsl(${flash.hue} / ${Math.min(0.28, 0.1 + flash.power * 0.18)})`,
      }}
    />
  );
}

export default RPGSpectacleCanvas;
