/**
 * RPG spectacle audio — procedural WebAudio SFX for the battle arena.
 *
 * Modelled on `castle/sfx.ts`: no asset files, one lazily-created AudioContext,
 * silent no-op when Web Audio is unavailable or the student has sound off.
 * A screen-wide plasma beam with no sound reads as a screensaver — these cues
 * exist so the spectacle actually lands.
 *
 * Presentation only. Nothing here touches combat, timing or speech input.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSpectacleAudioEnabled(v: boolean) {
  enabled = v;
}
export function isSpectacleAudioEnabled() {
  return enabled;
}

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  if (typeof window === 'undefined') return null;
  if (ctx) {
    // Mobile Safari suspends the context whenever the tab backgrounds.
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  vol?: number;
  attack?: number;
  release?: number;
  freqEnd?: number;
  delay?: number;
}

function tone(opts: ToneOpts) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(Math.max(20, opts.freq), now);
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), now + opts.duration);
  }
  const vol = Math.max(0, Math.min(1, opts.vol ?? 0.16));
  const atk = opts.attack ?? 0.005;
  const rel = opts.release ?? 0.06;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(vol, now + atk);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration + rel);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + opts.duration + rel + 0.02);
}

function noise(duration: number, vol = 0.12, lowpass = 1200, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(lowpass, now);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(now);
  src.stop(now + duration + 0.02);
}

/* ------------------------------------------------------------------ */
/* Cues — one per beat of the choreography                             */
/* ------------------------------------------------------------------ */

/** ANTICIPATION: rising whine while the attack charges. */
export function sfxCharge(durationMs = 250, power = 0.5) {
  tone({
    freq: 180,
    freqEnd: 180 + 520 * power,
    duration: durationMs / 1000,
    type: 'sawtooth',
    vol: 0.05 + 0.06 * power,
    attack: 0.04,
  });
}

/** STRIKE: the projectile crossing the arena. */
export function sfxStrike(power = 0.5) {
  tone({ freq: 900, freqEnd: 300, duration: 0.1, type: 'square', vol: 0.05 + 0.06 * power });
  noise(0.12, 0.04 + 0.05 * power, 3000);
}

/** IMPACT: thud + crack. Scales with how big the hit was. */
export function sfxImpact(power = 0.5) {
  tone({ freq: 120, freqEnd: 55, duration: 0.16 + 0.1 * power, type: 'sine', vol: 0.12 + 0.12 * power });
  noise(0.1 + 0.1 * power, 0.05 + 0.08 * power, 2200);
  if (power >= 0.7) {
    tone({ freq: 1320, freqEnd: 660, duration: 0.09, type: 'square', vol: 0.1, delay: 0.02 });
  }
}

/** A boss phase gate — the transformation stinger. */
export function sfxBossTransform() {
  tone({ freq: 90, freqEnd: 45, duration: 0.6, type: 'sawtooth', vol: 0.2 });
  tone({ freq: 200, freqEnd: 900, duration: 0.85, type: 'triangle', vol: 0.12, attack: 0.25 });
  noise(0.7, 0.09, 700);
  // The bloom at the top of the transform.
  tone({ freq: 1046, duration: 0.22, type: 'triangle', vol: 0.16, delay: 0.85 });
  noise(0.25, 0.1, 7000, 0.85);
}

/** Screen-wide super attack: long telegraph roar into a release. */
export function sfxSuperAttack(telegraphMs = 1500) {
  tone({
    freq: 110,
    freqEnd: 480,
    duration: telegraphMs / 1000,
    type: 'sawtooth',
    vol: 0.14,
    attack: 0.35,
  });
  noise(telegraphMs / 1000, 0.06, 900);
  const t = telegraphMs / 1000;
  tone({ freq: 1400, freqEnd: 200, duration: 0.45, type: 'square', vol: 0.18, delay: t });
  noise(0.5, 0.14, 5200, t);
}

/** The final blow: a beat of near-silence, then the boom. */
export function sfxFinalBlow() {
  tone({ freq: 1760, duration: 0.06, type: 'sine', vol: 0.14 });
  // The gap is the point — it makes the boom land.
  tone({ freq: 70, freqEnd: 34, duration: 0.9, type: 'sine', vol: 0.24, delay: 0.32 });
  noise(0.8, 0.13, 1500, 0.32);
  [0, 0.12, 0.24].forEach((d, i) =>
    tone({ freq: 523 * (1 + i * 0.26), duration: 0.3, type: 'triangle', vol: 0.12, delay: 0.75 + d })
  );
}

/** Boss entrance sting, paired with the entrance banner. */
export function sfxBossEntrance() {
  tone({ freq: 150, freqEnd: 80, duration: 0.5, type: 'sawtooth', vol: 0.2 });
  tone({ freq: 75, duration: 0.9, type: 'sine', vol: 0.16, delay: 0.2 });
  noise(0.5, 0.07, 500, 0.1);
}
