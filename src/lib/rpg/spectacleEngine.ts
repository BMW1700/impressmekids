/**
 * RPG Spectacle Engine — the canvas layer that lifts combat from
 * "polished web game" to Kirby-grade set piece.
 *
 * Design rules:
 *  - Presentation ONLY. No damage math, no quest credit, no speech pipeline.
 *  - One rAF loop, one canvas, one pooled particle array. Effects are DATA
 *    (cues) pushed onto a bus, never React components mounted per hit.
 *  - Additive blending (`lighter`) so plasma actually glows instead of
 *    looking like a coloured rectangle.
 *  - Hard particle cap with automatic degradation on low-end / iOS so a
 *    classroom iPad never drops below 60fps.
 *  - Honours `prefers-reduced-motion` and an explicit settings toggle —
 *    schools will ask, and photosensitivity in K-5 is a real concern.
 *
 * Coordinates in cues are NORMALISED (0..1) against the arena box, so callers
 * never need to know pixel sizes or handle resize.
 */

import { prefersReducedMotion } from '@/lib/rpgGameFeel';

/* ------------------------------------------------------------------ */
/* Cues                                                                */
/* ------------------------------------------------------------------ */

export type SpectacleCueType =
  | 'burst'
  | 'beam'
  | 'shockwave'
  | 'debris'
  | 'sparkTrail'
  | 'plasmaBolt'
  | 'bloomOrb'
  | 'screenFlash'
  | 'embers'
  | 'disintegrate';

export interface SpectacleCue {
  type: SpectacleCueType;
  /** Origin, normalised 0..1 within the arena box. */
  x: number;
  y: number;
  /** Target (beams, bolts, trails), normalised 0..1. */
  tx?: number;
  ty?: number;
  /** 0..1 — scales count, size, speed and lifetime. */
  power?: number;
  /** HSL triplet string, e.g. "45 100% 60%". Design-token friendly. */
  hue?: string;
  /** Optional lifetime override in ms (beams/orbs). */
  durationMs?: number;
}

type Listener = (cue: SpectacleCue) => void;

const listeners = new Set<Listener>();

/** Push a cue to whichever canvas is currently mounted. */
export function emitSpectacle(cue: SpectacleCue) {
  if (!spectacleEnabled) return;
  listeners.forEach((fn) => {
    try {
      fn(cue);
    } catch {
      /* a broken listener must never break the battle loop */
    }
  });
}

/** Emit several cues as one choreographed beat. */
export function emitSpectacleBatch(cues: SpectacleCue[]) {
  cues.forEach(emitSpectacle);
}

export function subscribeSpectacle(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/* ------------------------------------------------------------------ */
/* Global enable / quality                                             */
/* ------------------------------------------------------------------ */

let spectacleEnabled = true;

/** Wired to the same settings surface as sound + haptics. */
export function setSpectacleEnabled(enabled: boolean) {
  spectacleEnabled = enabled;
}

export function isSpectacleEnabled() {
  return spectacleEnabled && !prefersReducedMotion();
}

export type SpectacleQuality = 'high' | 'medium' | 'low';

/**
 * Pick a particle budget from what the device actually is, not what we hope
 * it is. Deliberately conservative: a stutter reads as "broken" to a child,
 * while 200 well-lit particles still read as "explosion".
 */
export function detectQuality(): SpectacleQuality {
  if (typeof window === 'undefined') return 'medium';
  if (prefersReducedMotion()) return 'low';

  const cores = (navigator as any).hardwareConcurrency ?? 4;
  const mem = (navigator as any).deviceMemory ?? 4;
  const touch = 'ontouchstart' in window;

  if (cores <= 4 || mem <= 2) return 'low';
  if (touch && cores <= 6) return 'medium';
  return 'high';
}

export const PARTICLE_BUDGET: Record<SpectacleQuality, number> = {
  high: 600,
  medium: 320,
  low: 160,
};

/* ------------------------------------------------------------------ */
/* Particles                                                           */
/* ------------------------------------------------------------------ */

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Gravity in px/s^2. */
  g: number;
  /** Air drag multiplier applied per second. */
  drag: number;
  life: number;
  maxLife: number;
  size: number;
  /** Shrink factor across lifetime (1 = constant size). */
  shrink: number;
  hue: string;
  /** 'dot' | 'streak' | 'ring' | 'shard' */
  shape: 'dot' | 'streak' | 'ring' | 'shard';
  rot: number;
  vrot: number;
}

function blank(): Particle {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    g: 0,
    drag: 1,
    life: 0,
    maxLife: 1,
    size: 1,
    shrink: 1,
    hue: '45 100% 60%',
    shape: 'dot',
    rot: 0,
    vrot: 0,
  };
}

/** Beams and orbs are rendered as timed primitives, not particles. */
interface Primitive {
  kind: 'beam' | 'orb' | 'shockwave' | 'flash';
  x: number;
  y: number;
  tx: number;
  ty: number;
  life: number;
  maxLife: number;
  power: number;
  hue: string;
}

/**
 * The renderer. Owned by RPGSpectacleCanvas; one instance per mounted arena.
 * Kept as a plain class (not a hook) so the rAF loop never re-renders React.
 */
export class SpectacleRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private raf = 0;
  private last = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;

  private pool: Particle[] = [];
  private prims: Primitive[] = [];
  private quality: SpectacleQuality;
  private budget: number;
  /** Rolling frame-time average — drops quality if the device can't keep up. */
  private frameAvg = 16;

  constructor(quality: SpectacleQuality = detectQuality()) {
    this.quality = quality;
    this.budget = PARTICLE_BUDGET[quality];
    for (let i = 0; i < this.budget; i++) this.pool.push(blank());
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  detach() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ctx = null;
    this.canvas = null;
    this.prims.length = 0;
    this.pool.forEach((p) => (p.active = false));
  }

  resize() {
    const c = this.canvas;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 2 : 1.5);
    this.w = rect.width;
    this.h = rect.height;
    c.width = Math.max(1, Math.floor(rect.width * this.dpr));
    c.height = Math.max(1, Math.floor(rect.height * this.dpr));
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /* ---------------- emitters ---------------- */

  private take(): Particle | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) return this.pool[i];
    }
    return null; // budget reached — drop silently rather than stutter
  }

  handle(cue: SpectacleCue) {
    const px = cue.x * this.w;
    const py = cue.y * this.h;
    const tx = (cue.tx ?? cue.x) * this.w;
    const ty = (cue.ty ?? cue.y) * this.h;
    const power = Math.max(0, Math.min(1, cue.power ?? 0.5));
    const hue = cue.hue ?? '45 100% 62%';
    const scale = this.quality === 'low' ? 0.4 : this.quality === 'medium' ? 0.7 : 1;

    switch (cue.type) {
      case 'burst': {
        const n = Math.round((26 + power * 90) * scale);
        for (let i = 0; i < n; i++) {
          const p = this.take();
          if (!p) break;
          const a = Math.random() * Math.PI * 2;
          const sp = (90 + Math.random() * 460) * (0.5 + power);
          Object.assign(p, {
            active: true,
            x: px,
            y: py,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            g: 420,
            drag: 0.9,
            life: 0,
            maxLife: 0.35 + Math.random() * (0.45 + power * 0.5),
            size: 1.6 + Math.random() * (3 + power * 5),
            shrink: 0.25,
            hue,
            shape: Math.random() < 0.35 ? 'streak' : 'dot',
            rot: 0,
            vrot: 0,
          });
        }
        break;
      }

      case 'debris': {
        const n = Math.round((10 + power * 26) * scale);
        for (let i = 0; i < n; i++) {
          const p = this.take();
          if (!p) break;
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
          const sp = (120 + Math.random() * 380) * (0.5 + power);
          Object.assign(p, {
            active: true,
            x: px + (Math.random() - 0.5) * 40,
            y: py + (Math.random() - 0.5) * 20,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            g: 1200,
            drag: 0.98,
            life: 0,
            maxLife: 0.6 + Math.random() * 0.7,
            size: 3 + Math.random() * (4 + power * 6),
            shrink: 0.8,
            hue,
            shape: 'shard',
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 14,
          });
        }
        break;
      }

      case 'embers': {
        const n = Math.round((12 + power * 30) * scale);
        for (let i = 0; i < n; i++) {
          const p = this.take();
          if (!p) break;
          Object.assign(p, {
            active: true,
            x: px + (Math.random() - 0.5) * this.w * 0.35,
            y: py + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 40,
            vy: -20 - Math.random() * 70,
            g: -30,
            drag: 0.96,
            life: 0,
            maxLife: 0.9 + Math.random() * 1.4,
            size: 1.2 + Math.random() * 2.6,
            shrink: 0.4,
            hue,
            shape: 'dot',
            rot: 0,
            vrot: 0,
          });
        }
        break;
      }

      case 'sparkTrail': {
        const n = Math.round((14 + power * 26) * scale);
        for (let i = 0; i < n; i++) {
          const p = this.take();
          if (!p) break;
          const t = i / n;
          Object.assign(p, {
            active: true,
            x: px + (tx - px) * t,
            y: py + (ty - py) * t,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            g: 200,
            drag: 0.88,
            life: 0,
            maxLife: 0.22 + Math.random() * 0.3,
            size: 1.5 + Math.random() * 3,
            shrink: 0.2,
            hue,
            shape: 'streak',
            rot: 0,
            vrot: 0,
          });
        }
        break;
      }

      case 'disintegrate': {
        // The boss coming apart: a dense column of upward-drifting motes.
        const n = Math.round((40 + power * 120) * scale);
        for (let i = 0; i < n; i++) {
          const p = this.take();
          if (!p) break;
          Object.assign(p, {
            active: true,
            x: px + (Math.random() - 0.5) * this.w * 0.18,
            y: py + (Math.random() - 0.5) * this.h * 0.26,
            vx: (Math.random() - 0.5) * 90,
            vy: -60 - Math.random() * 200,
            g: -60,
            drag: 0.97,
            life: 0,
            maxLife: 0.8 + Math.random() * 1.6,
            size: 1.5 + Math.random() * 4,
            shrink: 0.15,
            hue,
            shape: Math.random() < 0.4 ? 'shard' : 'dot',
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 8,
          });
        }
        break;
      }

      case 'beam':
      case 'plasmaBolt':
        this.prims.push({
          kind: 'beam',
          x: px,
          y: py,
          tx,
          ty,
          life: 0,
          maxLife: (cue.durationMs ?? (cue.type === 'beam' ? 420 : 220)) / 1000,
          power,
          hue,
        });
        // A beam without sparks at the muzzle reads as a static rectangle.
        this.handle({ ...cue, type: 'sparkTrail' });
        break;

      case 'shockwave':
        this.prims.push({
          kind: 'shockwave',
          x: px,
          y: py,
          tx: px,
          ty: py,
          life: 0,
          maxLife: (cue.durationMs ?? 420) / 1000,
          power,
          hue,
        });
        break;

      case 'bloomOrb':
        this.prims.push({
          kind: 'orb',
          x: px,
          y: py,
          tx: px,
          ty: py,
          life: 0,
          maxLife: (cue.durationMs ?? 600) / 1000,
          power,
          hue,
        });
        break;

      case 'screenFlash':
        this.prims.push({
          kind: 'flash',
          x: px,
          y: py,
          tx: px,
          ty: py,
          life: 0,
          maxLife: (cue.durationMs ?? 160) / 1000,
          power,
          hue,
        });
        break;
    }
  }

  /* ---------------- loop ---------------- */

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const ctx = this.ctx;
    if (!ctx) return;

    const rawDt = now - this.last;
    this.last = now;
    // Clamp so a backgrounded tab doesn't teleport every particle offscreen.
    const dt = Math.min(rawDt, 50) / 1000;

    // Adaptive degradation: sustained slow frames shrink the live budget.
    this.frameAvg = this.frameAvg * 0.92 + rawDt * 0.08;
    if (this.frameAvg > 26 && this.budget > 120) this.budget = Math.max(120, this.budget - 4);

    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';

    let live = 0;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      if (live >= this.budget) {
        p.active = false;
        continue;
      }
      live++;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      const dragK = Math.pow(p.drag, dt * 60);
      p.vx *= dragK;
      p.vy = p.vy * dragK + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;

      const t = p.life / p.maxLife;
      const alpha = (1 - t) * (1 - t);
      const size = p.size * (1 - t * (1 - p.shrink));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${p.hue})`;
      ctx.strokeStyle = `hsl(${p.hue})`;

      switch (p.shape) {
        case 'streak': {
          const len = Math.min(26, Math.hypot(p.vx, p.vy) * 0.035);
          const a = Math.atan2(p.vy, p.vx);
          ctx.lineWidth = Math.max(1, size * 0.7);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - Math.cos(a) * len, p.y - Math.sin(a) * len);
          ctx.stroke();
          break;
        }
        case 'shard': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-size * 0.5, -size * 0.32, size, size * 0.64);
          ctx.restore();
          break;
        }
        case 'ring': {
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        default: {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    /* primitives */
    for (let i = this.prims.length - 1; i >= 0; i--) {
      const s = this.prims[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        this.prims.splice(i, 1);
        continue;
      }
      const t = s.life / s.maxLife;

      if (s.kind === 'beam') {
        // Grow fast, hold, snap out — a beam that fades linearly looks limp.
        const env = t < 0.18 ? t / 0.18 : 1 - (t - 0.18) / 0.82;
        const width = (6 + s.power * 46) * env;
        ctx.globalAlpha = 0.9 * env;
        ctx.lineCap = 'round';
        // Outer bloom
        ctx.strokeStyle = `hsl(${s.hue} / 0.35)`;
        ctx.lineWidth = width * 2.4;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.tx, s.ty);
        ctx.stroke();
        // Core
        ctx.strokeStyle = `hsl(${s.hue})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.tx, s.ty);
        ctx.stroke();
        // White-hot centre line
        ctx.strokeStyle = 'hsl(0 0% 100%)';
        ctx.lineWidth = Math.max(1, width * 0.3);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.tx, s.ty);
        ctx.stroke();
      } else if (s.kind === 'shockwave') {
        const r = (18 + s.power * 260) * t;
        ctx.globalAlpha = (1 - t) * 0.85;
        ctx.strokeStyle = `hsl(${s.hue})`;
        ctx.lineWidth = Math.max(1, 10 * (1 - t) * (0.4 + s.power));
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.kind === 'orb') {
        const r = (10 + s.power * 90) * (0.6 + 0.4 * Math.sin(t * Math.PI));
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        grad.addColorStop(0, 'hsl(0 0% 100% / 0.95)');
        grad.addColorStop(0.35, `hsl(${s.hue} / 0.7)`);
        grad.addColorStop(1, `hsl(${s.hue} / 0)`);
        ctx.globalAlpha = 1 - t * 0.4;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.kind === 'flash') {
        ctx.globalAlpha = (1 - t) * (0.25 + s.power * 0.55);
        ctx.fillStyle = `hsl(${s.hue})`;
        ctx.fillRect(0, 0, this.w, this.h);
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };
}
