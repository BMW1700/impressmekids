/**
 * Castle Swarm — tiny procedural SFX layer.
 *
 * Pure Web Audio API, no asset files. Lazy-inits a single AudioContext on
 * first call (must be invoked from a user gesture — every game start does
 * this naturally via the tap on "Start"). Silently no-ops if Web Audio is
 * unavailable or disabled.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSfxEnabled(v: boolean) { enabled = v; }
export function isSfxEnabled() { return enabled; }

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  if (typeof window === "undefined") return null;
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
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
  duration: number;          // seconds
  type?: OscillatorType;
  vol?: number;              // 0..1
  attack?: number;
  release?: number;
  freqEnd?: number;          // sweep target
}

function tone(opts: ToneOpts) {
  const c = getCtx(); if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), now + opts.duration);
  }
  const vol = Math.max(0, Math.min(1, opts.vol ?? 0.18));
  const atk = opts.attack ?? 0.005;
  const rel = opts.release ?? 0.06;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(vol, now + atk);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration + rel);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + opts.duration + rel + 0.02);
}

function noise(duration: number, vol = 0.12, lowpass = 1200) {
  const c = getCtx(); if (!c) return;
  const now = c.currentTime;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(lowpass, now);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(now);
  src.stop(now + duration + 0.02);
}

export const playCrit = () => {
  tone({ freq: 880, freqEnd: 1760, duration: 0.09, type: "square", vol: 0.18 });
  tone({ freq: 220, duration: 0.12, type: "sawtooth", vol: 0.10 });
};

export const playPhonemeHit = () => {
  tone({ freq: 660, freqEnd: 990, duration: 0.10, type: "triangle", vol: 0.15 });
  setTimeout(() => tone({ freq: 1320, duration: 0.08, type: "sine", vol: 0.12 }), 50);
};

export const playBossLaugh = () => {
  tone({ freq: 140, freqEnd: 90, duration: 0.35, type: "sawtooth", vol: 0.20 });
  setTimeout(() => tone({ freq: 110, freqEnd: 70, duration: 0.30, type: "sawtooth", vol: 0.18 }), 180);
  noise(0.4, 0.06, 400);
};

export const playChantBroken = () => {
  // Bright shimmer + low boom
  tone({ freq: 523, duration: 0.12, type: "triangle", vol: 0.16 });
  setTimeout(() => tone({ freq: 784, duration: 0.12, type: "triangle", vol: 0.16 }), 80);
  setTimeout(() => tone({ freq: 1046, duration: 0.18, type: "triangle", vol: 0.18 }), 160);
  setTimeout(() => tone({ freq: 80, duration: 0.25, type: "sine", vol: 0.22 }), 60);
  setTimeout(() => noise(0.18, 0.08, 6000), 0);
};

export const playShieldUp = () => {
  tone({ freq: 392, freqEnd: 784, duration: 0.18, type: "sine", vol: 0.16 });
};

export const playKnightSummon = () => {
  tone({ freq: 392, duration: 0.10, type: "square", vol: 0.14 });
  setTimeout(() => tone({ freq: 587, duration: 0.14, type: "square", vol: 0.16 }), 80);
};
