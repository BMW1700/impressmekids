/**
 * RPG Game Feel — the 100ms layer between "child reads the word" and
 * "child feels the hit land."
 *
 * Everything here is presentation-only: shake curves, hit-stop windows,
 * impact flashes and haptics. No damage math, no quest credit, no speech
 * pipeline. Hit-stop is a *visual* pause flag only — it must never gate the
 * speech recognizer.
 *
 * All effects honour `prefers-reduced-motion` (flashes and rapid shake are a
 * real photosensitivity concern for K-5) and the shared game mute setting.
 */

export type ImpactIntensity = 'tap' | 'normal' | 'heavy' | 'crit' | 'ultimate' | 'break';

export interface ImpactProfile {
  /** Horizontal shake keyframes in px. */
  shakeX: number[];
  /** Small rotation keyframes in deg — sells weight without nausea. */
  shakeRotate: number[];
  /** Shake duration in seconds. */
  shakeDuration: number;
  /** Visual freeze window in ms. 0 disables hit-stop. */
  hitStopMs: number;
  /** Impact flash opacity (0 = no flash). */
  flashOpacity: number;
  /** Camera punch-in scale (1 = none). */
  zoom: number;
}

const PROFILES: Record<ImpactIntensity, ImpactProfile> = {
  tap: {
    shakeX: [-2, 2, 0],
    shakeRotate: [0, 0, 0],
    shakeDuration: 0.14,
    hitStopMs: 0,
    flashOpacity: 0,
    zoom: 1,
  },
  normal: {
    shakeX: [-6, 6, -4, 3, 0],
    shakeRotate: [-0.2, 0.2, 0],
    shakeDuration: 0.24,
    hitStopMs: 60,
    flashOpacity: 0.16,
    zoom: 1.008,
  },
  heavy: {
    shakeX: [-12, 11, -8, 6, -3, 0],
    shakeRotate: [-0.5, 0.5, -0.3, 0],
    shakeDuration: 0.34,
    hitStopMs: 90,
    flashOpacity: 0.26,
    zoom: 1.018,
  },
  crit: {
    shakeX: [-18, 16, -13, 9, -5, 0],
    shakeRotate: [-0.9, 0.9, -0.5, 0],
    shakeDuration: 0.42,
    hitStopMs: 140,
    flashOpacity: 0.42,
    zoom: 1.04,
  },
  ultimate: {
    shakeX: [-24, 22, -18, 14, -8, 4, 0],
    shakeRotate: [-1.2, 1.2, -0.7, 0],
    shakeDuration: 0.6,
    hitStopMs: 180,
    flashOpacity: 0.6,
    zoom: 1.055,
  },
  break: {
    shakeX: [-20, 18, -15, 11, -6, 0],
    shakeRotate: [-1, 1, -0.6, 0],
    shakeDuration: 0.5,
    hitStopMs: 220,
    flashOpacity: 0.5,
    zoom: 1.045,
  },
};

/** Reduced-motion variants: keep the *timing* beats, drop the flash and swing. */
function reduceProfile(p: ImpactProfile): ImpactProfile {
  return {
    ...p,
    shakeX: p.shakeX.map((v) => Math.sign(v) * Math.min(Math.abs(v) * 0.25, 3)),
    shakeRotate: [0, 0, 0],
    shakeDuration: Math.min(p.shakeDuration, 0.2),
    hitStopMs: Math.min(p.hitStopMs, 80),
    flashOpacity: 0,
    // Reduced-motion swaps the flash for a gentle scale pop instead.
    zoom: 1 + (p.zoom - 1) * 0.5,
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getImpactProfile(intensity: ImpactIntensity): ImpactProfile {
  const base = PROFILES[intensity] ?? PROFILES.normal;
  return prefersReducedMotion() ? reduceProfile(base) : base;
}

/**
 * Map a hit to an intensity band by how much of the enemy's health bar it
 * removed. A 4-damage poke and a 90-damage crit must not feel the same.
 */
export function intensityForDamage(
  damage: number,
  enemyMaxHp: number,
  opts: { isCritical?: boolean; isUltimate?: boolean } = {}
): ImpactIntensity {
  if (opts.isUltimate) return 'ultimate';
  if (opts.isCritical) return 'crit';
  if (damage <= 0) return 'tap';
  const pct = enemyMaxHp > 0 ? damage / enemyMaxHp : 0;
  if (pct >= 0.18) return 'crit';
  if (pct >= 0.08) return 'heavy';
  return 'normal';
}

/* ------------------------------------------------------------------ */
/* Haptics                                                             */
/* ------------------------------------------------------------------ */

export type HapticStrength = 'light' | 'medium' | 'heavy' | 'error' | 'success';

let hapticsEnabled = true;

/** Wired to the same toggle as game sound so classrooms can silence it. */
export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

const WEB_PATTERNS: Record<HapticStrength, number | number[]> = {
  light: 10,
  medium: 22,
  heavy: 45,
  error: [18, 40, 18],
  success: [12, 30, 12],
};

/**
 * Fires a native haptic on iOS/Android (Capacitor) and falls back to the web
 * Vibration API elsewhere. Always fire-and-forget — a haptic must never be
 * able to throw into or delay the battle loop.
 */
export function haptic(strength: HapticStrength = 'light') {
  if (!hapticsEnabled) return;
  if (typeof window === 'undefined') return;

  try {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      // Dynamic import keeps the web bundle from paying for the native plugin.
      import('@capacitor/haptics')
        .then(({ Haptics, ImpactStyle, NotificationType }) => {
          switch (strength) {
            case 'light':
              return Haptics.impact({ style: ImpactStyle.Light });
            case 'medium':
              return Haptics.impact({ style: ImpactStyle.Medium });
            case 'heavy':
              return Haptics.impact({ style: ImpactStyle.Heavy });
            case 'error':
              return Haptics.notification({ type: NotificationType.Warning });
            case 'success':
              return Haptics.notification({ type: NotificationType.Success });
          }
        })
        .catch(() => {
          /* plugin unavailable — silently skip */
        });
      return;
    }
  } catch {
    /* fall through to web */
  }

  try {
    navigator.vibrate?.(WEB_PATTERNS[strength]);
  } catch {
    /* unsupported — silently skip */
  }
}

/** Convenience: the haptic that matches a visual impact band. */
export function hapticForIntensity(intensity: ImpactIntensity) {
  switch (intensity) {
    case 'tap':
      return haptic('light');
    case 'normal':
      return haptic('medium');
    case 'heavy':
    case 'crit':
      return haptic('heavy');
    case 'ultimate':
    case 'break':
      return haptic('heavy');
  }
}

/* ------------------------------------------------------------------ */
/* Streak heat                                                         */
/* ------------------------------------------------------------------ */

export type StreakTier = 0 | 1 | 2 | 3;

export interface StreakHeat {
  tier: StreakTier;
  label: string | null;
  /** Tailwind-safe glow colour token for the aura ring. */
  glow: string;
  /** Sound pitch step — the rising ladder is the core dopamine device. */
  pitch: number;
}

const STREAK_HEAT: Record<StreakTier, StreakHeat> = {
  0: { tier: 0, label: null, glow: 'transparent', pitch: 660 },
  1: { tier: 1, label: 'HEATING UP', glow: 'hsl(35 100% 55%)', pitch: 784 },
  2: { tier: 2, label: 'ON FIRE', glow: 'hsl(15 100% 55%)', pitch: 988 },
  3: { tier: 3, label: 'UNSTOPPABLE', glow: 'hsl(285 100% 65%)', pitch: 1175 },
};

export function streakTier(streak: number): StreakTier {
  if (streak >= 8) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1;
  return 0;
}

export function streakHeat(streak: number): StreakHeat {
  return STREAK_HEAT[streakTier(streak)];
}

/* ------------------------------------------------------------------ */
/* Ultimate meter                                                      */
/* ------------------------------------------------------------------ */

export const ULTIMATE_MAX = 100;

/**
 * Charge earned per correct word. Longer words and hotter streaks fill the
 * bar faster, so reading well is what buys the spectacle.
 */
export function ultimateChargeForWord(wordLength: number, streak: number): number {
  const base = 7;
  const lengthBonus = Math.min(Math.floor(wordLength / 3), 4);
  const streakBonus = streakTier(streak) * 2;
  return base + lengthBonus + streakBonus;
}

/** Ultimate damage: a guaranteed, feels-enormous chunk of the health bar. */
export function ultimateDamage(enemyMaxHp: number, attackStat: number): number {
  const chunk = Math.max(30, Math.floor(enemyMaxHp * 0.28));
  return chunk + Math.floor(attackStat * 2);
}
