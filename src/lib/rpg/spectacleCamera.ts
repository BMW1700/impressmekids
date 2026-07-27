/**
 * Spectacle camera rig.
 *
 * A push-in on the charge and a punch-out on contact does more for "wow"
 * than any particle. This is a tiny bus + hook so the choreography module can
 * drive the camera without the arena passing props down through the tree.
 *
 * Presentation only. Never gates gameplay.
 */

import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/rpgGameFeel';

export interface CameraState {
  scale: number;
  /** Normalised offsets, applied as a percentage translate. */
  x: number;
  y: number;
  /** Transition duration in seconds. */
  duration: number;
}

const NEUTRAL: CameraState = { scale: 1, x: 0, y: 0, duration: 0.35 };

type Listener = (s: CameraState) => void;
const listeners = new Set<Listener>();
let current: CameraState = NEUTRAL;
let settleTimer: ReturnType<typeof setTimeout> | null = null;

function push(state: CameraState, holdMs: number) {
  // Reduced motion keeps the beat but halves the travel — no nausea, no
  // loss of the "something big is happening" cue.
  const damp = prefersReducedMotion() ? 0.35 : 1;
  current = {
    scale: 1 + (state.scale - 1) * damp,
    x: state.x * damp,
    y: state.y * damp,
    duration: state.duration,
  };
  listeners.forEach((fn) => fn(current));

  if (settleTimer) clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    current = NEUTRAL;
    listeners.forEach((fn) => fn(current));
  }, holdMs);
}

/** Slow lean toward the attacker while the strike charges. */
export function cameraPushIn(towardX = 0.5, ms = 260) {
  push({ scale: 1.045, x: (0.5 - towardX) * 6, y: 0, duration: ms / 1000 }, ms);
}

/** Hard snap back out on contact — this is what sells the hit. */
export function cameraPunch(strength = 0.5) {
  push({ scale: 1 - 0.03 * strength, x: 0, y: 0, duration: 0.08 }, 220);
}

/** Slow drift used during boss phase transitions. */
export function cameraBossDrift(ms = 1400) {
  push({ scale: 1.09, x: 0, y: -1.5, duration: ms / 1000 }, ms);
}

export function cameraReset() {
  if (settleTimer) clearTimeout(settleTimer);
  current = NEUTRAL;
  listeners.forEach((fn) => fn(current));
}

export function useSpectacleCamera(): CameraState {
  const [state, setState] = useState<CameraState>(current);
  useEffect(() => {
    const fn: Listener = (s) => setState(s);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return state;
}
