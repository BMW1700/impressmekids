/**
 * Attack choreography — every strike is a TIMELINE, not a single animation.
 *
 * The four beats, borrowed straight from the Kirby playbook:
 *
 *   ANTICIPATION (250ms)  charge glow + camera push-in
 *   STRIKE       (120ms)  beam/bolt fires, spark trail
 *   IMPACT       (90ms)   flash + shockwave + debris, hit-stop lands HERE
 *   RECOVERY     (400ms)  embers drift, camera settles
 *
 * This module owns sequencing only. It emits spectacle cues and invokes an
 * `onImpact` callback on the exact frame the hit lands, so the existing
 * `rpgGameFeel` shake / hit-stop / haptic fire on the SAME frame as the
 * visual instead of drifting apart.
 *
 * Presentation only — no damage math lives here.
 */

import { emitSpectacle, isSpectacleEnabled } from '@/lib/rpg/spectacleEngine';
import {
  sfxCharge,
  sfxStrike,
  sfxImpact,
  sfxBossTransform,
  sfxSuperAttack,
  sfxFinalBlow,
} from '@/lib/rpg/spectacleAudio';
import { cameraPushIn } from '@/lib/rpg/spectacleCamera';
import type { ImpactIntensity } from '@/lib/rpgGameFeel';


export interface Point {
  /** Normalised 0..1 within the arena box. */
  x: number;
  y: number;
}

/** Where things live on screen by default — tuned to the arena layout. */
export const ARENA_ANCHORS = {
  hero: { x: 0.22, y: 0.62 } as Point,
  enemy: { x: 0.76, y: 0.44 } as Point,
  centre: { x: 0.5, y: 0.5 } as Point,
};

/** Element hue per attack flavour. HSL triplets, additive-blend friendly. */
export const ELEMENT_HUES: Record<string, string> = {
  physical: '38 100% 66%',
  fire: '16 100% 58%',
  ice: '195 100% 68%',
  lightning: '52 100% 66%',
  nature: '135 80% 58%',
  arcane: '285 100% 70%',
  data: '175 100% 60%',
  shadow: '265 60% 48%',
  holy: '48 100% 78%',
};

const BEATS: Record<ImpactIntensity, { anticipation: number; strike: number; power: number }> = {
  tap: { anticipation: 90, strike: 60, power: 0.15 },
  normal: { anticipation: 180, strike: 100, power: 0.4 },
  heavy: { anticipation: 240, strike: 120, power: 0.62 },
  crit: { anticipation: 280, strike: 130, power: 0.82 },
  ultimate: { anticipation: 420, strike: 160, power: 1 },
  break: { anticipation: 320, strike: 140, power: 0.9 },
};

export interface ChoreographyOptions {
  from?: Point;
  to?: Point;
  intensity?: ImpactIntensity;
  element?: keyof typeof ELEMENT_HUES | string;
  /** Fired on the impact frame — wire shake / hit-stop / haptics here. */
  onImpact?: () => void;
  /** Fired when recovery finishes. */
  onComplete?: () => void;
  /**
   * Set false when the caller already owns the impact frame (e.g. the arena's
   * `triggerScreenShake`, which emits its own burst + shockwave). The
   * anticipation and strike beats still play, so the hit gets its wind-up
   * without doubling up particles on the landing frame.
   */
  impactVisuals?: boolean;
}

/**
 * Runs one attack timeline. Returns a cancel function — always call it on
 * unmount so a mid-flight beam can't fire into a torn-down arena.
 */
export function playAttack(opts: ChoreographyOptions = {}): () => void {
  const {
    from = ARENA_ANCHORS.hero,
    to = ARENA_ANCHORS.enemy,
    intensity = 'normal',
    element = 'physical',
    onImpact,
    onComplete,
    impactVisuals = true,
  } = opts;

  const beat = BEATS[intensity] ?? BEATS.normal;
  const hue = ELEMENT_HUES[element] ?? ELEMENT_HUES.physical;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

  // Spectacle can be off (reduced motion / school toggle) — the FIGHT must
  // still resolve on the same schedule, so only the visuals are skipped.
  const visuals = isSpectacleEnabled();

  /* ANTICIPATION — the charge. Without this the hit has no weight. */
  sfxCharge(beat.anticipation, beat.power);
  if (visuals) {
    emitSpectacle({
      type: 'bloomOrb',
      x: from.x,
      y: from.y,
      power: beat.power,
      hue,
      durationMs: beat.anticipation,
    });
    if (intensity === 'ultimate' || intensity === 'crit') {
      emitSpectacle({ type: 'embers', x: from.x, y: from.y, power: beat.power, hue });
    }
  }

  /* STRIKE — the projectile crosses the arena. */
  at(beat.anticipation, () => {
    sfxStrike(beat.power);
    if (!visuals) return;
    emitSpectacle({
      type: intensity === 'ultimate' ? 'beam' : 'plasmaBolt',
      x: from.x,
      y: from.y,
      tx: to.x,
      ty: to.y,
      power: beat.power,
      hue,
      durationMs: beat.strike + 140,
    });
  });

  /* IMPACT — everything lands on one frame. */
  at(beat.anticipation + beat.strike, () => {
    if (impactVisuals) sfxImpact(beat.power);
    if (visuals && impactVisuals) {
      emitSpectacle({ type: 'screenFlash', x: to.x, y: to.y, power: beat.power * 0.8, hue: '0 0% 100%' });
      emitSpectacle({ type: 'burst', x: to.x, y: to.y, power: beat.power, hue });
      emitSpectacle({ type: 'shockwave', x: to.x, y: to.y, power: beat.power, hue });
      if (beat.power >= 0.55) {
        emitSpectacle({ type: 'debris', x: to.x, y: to.y, power: beat.power, hue });
      }
    }
    onImpact?.();
  });


  /* RECOVERY — embers keep the moment alive for a beat after the number. */
  at(beat.anticipation + beat.strike + 90, () => {
    if (visuals && beat.power >= 0.6) {
      emitSpectacle({ type: 'embers', x: to.x, y: to.y, power: beat.power * 0.7, hue });
    }
  });

  at(beat.anticipation + beat.strike + 490, () => onComplete?.());

  return () => timers.forEach(clearTimeout);
}

/**
 * The enemy's turn. Mirrors `playAttack` but reads as *incoming* — longer,
 * more readable telegraph so the block window is fair.
 */
export function playEnemyAttack(opts: ChoreographyOptions = {}): () => void {
  return playAttack({
    from: ARENA_ANCHORS.enemy,
    to: ARENA_ANCHORS.hero,
    element: 'shadow',
    ...opts,
  });
}

/* ------------------------------------------------------------------ */
/* Boss set pieces                                                     */
/* ------------------------------------------------------------------ */

/**
 * A signature super attack: 1.5s of unmistakable wind-up, then a screen-wide
 * plasma sweep. These are the moments kids describe to their friends.
 */
export function playSuperAttack(
  opts: {
    origin?: Point;
    element?: string;
    /** Per-boss hue override (from the boss catalog's mechanicColor). */
    hue?: string;
    onImpact?: () => void;
    onComplete?: () => void;
  } = {}
): () => void {
  const { origin = ARENA_ANCHORS.enemy, element = 'arcane', onImpact, onComplete } = opts;
  const hue = opts.hue ?? ELEMENT_HUES[element] ?? ELEMENT_HUES.arcane;

  const timers: ReturnType<typeof setTimeout>[] = [];
  const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
  const visuals = isSpectacleEnabled();

  sfxSuperAttack(1500);
  if (visuals) {

    // Telegraph: a swelling orb plus converging embers. 1.5s is deliberate —
    // a child needs time to read the danger and choose to block.
    emitSpectacle({ type: 'bloomOrb', x: origin.x, y: origin.y, power: 1, hue, durationMs: 1500 });
    at(400, () => emitSpectacle({ type: 'embers', x: origin.x, y: origin.y, power: 1, hue }));
    at(900, () => emitSpectacle({ type: 'embers', x: origin.x, y: origin.y, power: 1, hue }));
  }

  at(1500, () => {
    if (visuals) {
      // Three staggered beams sweeping across the arena.
      [0.18, 0.5, 0.82].forEach((ty, i) =>
        setTimeout(
          () =>
            emitSpectacle({
              type: 'beam',
              x: origin.x,
              y: origin.y,
              tx: 0,
              ty,
              power: 1,
              hue,
              durationMs: 520,
            }),
          i * 90
        )
      );
      emitSpectacle({ type: 'screenFlash', x: 0.5, y: 0.5, power: 1, hue });
    }
    onImpact?.();
  });

  at(2100, () => onComplete?.());
  return () => timers.forEach(clearTimeout);
}

/**
 * Boss transformation at a phase gate. Pairs with the arena's palette shift.
 */
export function playBossTransform(
  opts: { origin?: Point; element?: string; hue?: string } = {}
): () => void {
  const { origin = ARENA_ANCHORS.enemy, element = 'shadow' } = opts;
  const hue = opts.hue ?? ELEMENT_HUES[element] ?? ELEMENT_HUES.shadow;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

  // Audio fires even when visuals are suppressed (reduced motion still wants
  // to know the boss just changed).
  sfxBossTransform();
  if (!isSpectacleEnabled()) return () => timers.forEach(clearTimeout);

  emitSpectacle({ type: 'bloomOrb', x: origin.x, y: origin.y, power: 1, hue, durationMs: 900 });
  at(300, () => emitSpectacle({ type: 'shockwave', x: origin.x, y: origin.y, power: 0.8, hue }));
  at(600, () => emitSpectacle({ type: 'shockwave', x: origin.x, y: origin.y, power: 1, hue }));

  at(900, () => {
    emitSpectacle({ type: 'screenFlash', x: 0.5, y: 0.5, power: 1, hue: '0 0% 100%' });
    emitSpectacle({ type: 'burst', x: origin.x, y: origin.y, power: 1, hue });
    emitSpectacle({ type: 'debris', x: origin.x, y: origin.y, power: 1, hue });
  });
  at(1100, () => emitSpectacle({ type: 'embers', x: origin.x, y: origin.y, power: 1, hue }));

  return () => timers.forEach(clearTimeout);
}

/**
 * The final blow: freeze → white-out → disintegration → embers.
 * `onFreeze` should trigger the arena's hit-stop; `onComplete` reveals the
 * victory banner.
 */
export function playFinalBlow(
  opts: {
    origin?: Point;
    element?: string;
    /** Per-boss hue override (from the boss catalog's mechanicColor). */
    hue?: string;
    onFreeze?: () => void;
    onComplete?: () => void;
  } = {}
): () => void {
  const { origin = ARENA_ANCHORS.enemy, element = 'holy', onFreeze, onComplete } = opts;
  const hue = opts.hue ?? ELEMENT_HUES[element] ?? ELEMENT_HUES.holy;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
  const visuals = isSpectacleEnabled();

  onFreeze?.();
  sfxFinalBlow();
  if (visuals) {

    emitSpectacle({ type: 'screenFlash', x: 0.5, y: 0.5, power: 1, hue: '0 0% 100%', durationMs: 420 });
    at(220, () => emitSpectacle({ type: 'shockwave', x: origin.x, y: origin.y, power: 1, hue }));
    at(320, () => emitSpectacle({ type: 'disintegrate', x: origin.x, y: origin.y, power: 1, hue }));
    at(700, () => emitSpectacle({ type: 'embers', x: origin.x, y: origin.y, power: 1, hue }));
    at(1100, () => emitSpectacle({ type: 'embers', x: 0.5, y: 0.7, power: 0.8, hue }));
  }
  at(1600, () => onComplete?.());

  return () => timers.forEach(clearTimeout);
}

/* ------------------------------------------------------------------ */
/* TRUE BOSS SET PIECES                                                */
/* ------------------------------------------------------------------ */

/**
 * The boss catalog stores colours as hex (`#dc2626`). The spectacle engine
 * speaks HSL triplets so it can blend additively. This converts between them
 * so every boss fights in its OWN colour instead of a shared purple.
 */
export function hexToHslTriplet(hex: string): string | undefined {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
  if (!m) return undefined;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let hue = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        hue = ((g - b) / d) % 6;
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export interface MechanicOptions {
  /** HSL triplet, usually derived from the boss's mechanicColor. */
  hue: string;
  origin?: Point;
  target?: Point;
  /** Fires on the mechanic's main impact frame. */
  onImpact?: () => void;
  onComplete?: () => void;
}

type MechanicShape =
  | 'barrage'
  | 'pull'
  | 'shatter'
  | 'nova'
  | 'lockOn'
  | 'sweep';

/**
 * Maps a boss's named mechanic to a distinct visual shape. Matching is on
 * keywords rather than exact strings so a new catalog entry ("SOLAR FLARE",
 * "PRISM STORM") picks up a sensible set piece without another code change.
 */
export function shapeForMechanic(name: string): MechanicShape {
  const n = name.toUpperCase();
  if (/BARRAGE|STORM|ASTEROID|FIREBALL|RAIN/.test(n)) return 'barrage';
  if (/PULL|VOID|BINDING|GRAVITY|DRAIN/.test(n)) return 'pull';
  if (/SHATTER|QUAKE|ROAR|CRUSH|EDGE|SLAM/.test(n)) return 'shatter';
  if (/NOVA|SOLAR|FLARE|SUN|LIGHT|PRISM/.test(n)) return 'nova';
  if (/EDIT|MARK|SNIPE|FOCUS|TARGET/.test(n)) return 'lockOn';
  return 'sweep';
}

/**
 * Plays a boss's signature mechanic as its own set piece.
 *
 * Every shape shares the same contract: a readable telegraph, one clear
 * impact frame (where `onImpact` fires so shake / hit-stop / haptics stay in
 * sync), then a recovery tail. Presentation only — the caller still owns any
 * damage the mechanic represents.
 */
export function playBossMechanic(name: string, opts: MechanicOptions): () => void {
  const {
    hue,
    origin = ARENA_ANCHORS.enemy,
    target = ARENA_ANCHORS.hero,
    onImpact,
    onComplete,
  } = opts;

  const shape = shapeForMechanic(name);
  const timers: ReturnType<typeof setTimeout>[] = [];
  const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
  const visuals = isSpectacleEnabled();

  // Shared telegraph so the danger is always readable, whatever the shape.
  sfxSuperAttack(1200);
  if (visuals) {
    emitSpectacle({ type: 'bloomOrb', x: origin.x, y: origin.y, power: 1, hue, durationMs: 1200 });
  }

  const IMPACT = 1200;

  at(IMPACT, () => {
    if (!visuals) {
      onImpact?.();
      return;
    }

    switch (shape) {
      /* Staggered bolts raining in from above the arena. */
      case 'barrage': {
        [0.2, 0.45, 0.7, 0.9, 0.32].forEach((x, i) =>
          at(i * 110, () =>
            emitSpectacle({
              type: 'plasmaBolt',
              x,
              y: -0.1,
              tx: x + (Math.random() - 0.5) * 0.12,
              ty: 0.78,
              power: 0.85,
              hue,
              durationMs: 420,
            })
          )
        );
        emitSpectacle({ type: 'screenFlash', x: 0.5, y: 0.2, power: 0.6, hue });
        break;
      }

      /* Everything drags inward toward the boss. */
      case 'pull': {
        [0.1, 0.32, 0.55, 0.8].forEach((x, i) =>
          at(i * 80, () =>
            emitSpectacle({
              type: 'sparkTrail',
              x,
              y: 0.2 + i * 0.16,
              tx: origin.x,
              ty: origin.y,
              power: 0.8,
              hue,
              durationMs: 520,
            })
          )
        );
        emitSpectacle({ type: 'embers', x: origin.x, y: origin.y, power: 1, hue });
        at(420, () =>
          emitSpectacle({ type: 'shockwave', x: origin.x, y: origin.y, power: 1, hue })
        );
        break;
      }

      /* The screen breaks: full flash, ring, heavy debris. */
      case 'shatter': {
        emitSpectacle({ type: 'screenFlash', x: 0.5, y: 0.5, power: 1, hue: '0 0% 100%' });
        emitSpectacle({ type: 'shockwave', x: 0.5, y: 0.5, power: 1, hue });
        emitSpectacle({ type: 'debris', x: 0.5, y: 0.5, power: 1, hue });
        at(160, () =>
          emitSpectacle({ type: 'shockwave', x: 0.5, y: 0.55, power: 0.8, hue })
        );
        at(300, () =>
          emitSpectacle({ type: 'debris', x: target.x, y: target.y, power: 0.7, hue })
        );
        break;
      }

      /* Expanding white-out from the boss, then drifting embers. */
      case 'nova': {
        emitSpectacle({ type: 'bloomOrb', x: origin.x, y: origin.y, power: 1, hue, durationMs: 420 });
        at(200, () => {
          emitSpectacle({ type: 'screenFlash', x: 0.5, y: 0.5, power: 1, hue: '0 0% 100%' });
          emitSpectacle({ type: 'burst', x: origin.x, y: origin.y, power: 1, hue });
        });
        at(520, () => emitSpectacle({ type: 'embers', x: 0.5, y: 0.4, power: 1, hue }));
        at(820, () => emitSpectacle({ type: 'embers', x: 0.5, y: 0.7, power: 0.7, hue }));
        break;
      }

      /* Beams lock onto the hero one at a time. */
      case 'lockOn': {
        [0, 1, 2].forEach((i) =>
          at(i * 220, () => {
            emitSpectacle({
              type: 'beam',
              x: origin.x,
              y: origin.y - 0.12 + i * 0.12,
              tx: target.x,
              ty: target.y,
              power: 1,
              hue,
              durationMs: 380,
            });
            emitSpectacle({ type: 'burst', x: target.x, y: target.y, power: 0.7, hue });
          })
        );
        break;
      }

      /* Fallback: the screen-wide three-beam sweep. */
      default: {
        [0.18, 0.5, 0.82].forEach((ty, i) =>
          at(i * 90, () =>
            emitSpectacle({
              type: 'beam',
              x: origin.x,
              y: origin.y,
              tx: 0,
              ty,
              power: 1,
              hue,
              durationMs: 520,
            })
          )
        );
        emitSpectacle({ type: 'screenFlash', x: 0.5, y: 0.5, power: 1, hue });
      }
    }

    onImpact?.();
  });

  at(IMPACT + 1300, () => onComplete?.());
  return () => timers.forEach(clearTimeout);
}
