/**
 * Voice Mascot - Fresh rebuild for pronunciation coaching
 * Simple, reliable, and focused on helping students
 */

let voicesLoaded = false;
let preferredVoice: SpeechSynthesisVoice | null = null;
let isUnlocked = false;

// Initialize voices
const initVoices = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    // Prefer friendly US English voices
    preferredVoice = 
      voices.find(v => v.name.includes('Samantha')) ||
      voices.find(v => v.name.includes('Google US')) ||
      voices.find(v => v.lang === 'en-US' && v.localService) ||
      voices.find(v => v.lang === 'en-US') || 
      voices.find(v => v.lang.startsWith('en')) || 
      voices[0];
    voicesLoaded = true;
    console.log('🎤 Voice Mascot ready:', preferredVoice?.name);
  }
};

// Load voices immediately and on change
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  initVoices();
  window.speechSynthesis.onvoiceschanged = initVoices;
}

/**
 * MUST call on first user interaction (click/tap)
 */
export const unlockVoiceMascot = () => {
  if (isUnlocked) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Empty utterance to unlock
  const unlock = new SpeechSynthesisUtterance('');
  unlock.volume = 0;
  window.speechSynthesis.speak(unlock);
  isUnlocked = true;
  console.log('🎤 Voice Mascot UNLOCKED');
};

/**
 * Speak a word with friendly pronunciation
 */
export const speakWord = (word: string, onError?: () => void) => {
  console.log('🎤 SPEAK WORD:', word);
  
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('🎤 Speech not supported');
    onError?.();
    return;
  }

  // Force load voices if not ready
  if (!voicesLoaded) {
    initVoices();
  }

  // Retry if voices still not loaded (max 5 attempts)
  if (!voicesLoaded) {
    let attempts = 0;
    const retry = setInterval(() => {
      initVoices();
      attempts++;
      if (voicesLoaded || attempts >= 5) {
        clearInterval(retry);
        if (voicesLoaded) {
          doSpeak(word, onError);
        } else {
          console.error('🎤 Voices never loaded');
          onError?.();
        }
      }
    }, 200);
    return;
  }

  doSpeak(word, onError);
};

const doSpeak = (word: string, onError?: () => void) => {
  // Resume if paused
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // Cancel any pending speech
  window.speechSynthesis.cancel();

  // Small delay after cancel (Chrome bug)
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.15; // Friendly pitch
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => console.log('🎤 Speaking:', word);
    utterance.onend = () => console.log('🎤 Done:', word);
    utterance.onerror = (e) => {
      console.error('🎤 Speech error:', e.error);
      onError?.();
    };

    window.speechSynthesis.speak(utterance);
  }, 80);
};

/**
 * Speak encouraging message
 */
export const speakEncouragement = (message: string) => {
  if (!isUnlocked) return;
  
  // Strip emojis
  const cleanMessage = message.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  if (cleanMessage) {
    speakWord(cleanMessage);
  }
};

/**
 * Check if pronunciation is significantly wrong (worth correcting)
 * Returns true if mascot should speak the correct pronunciation
 */
export const shouldCorrectPronunciation = (spoken: string, expected: string): boolean => {
  const s = spoken.toLowerCase().replace(/[^a-z]/g, '');
  const e = expected.toLowerCase().replace(/[^a-z]/g, '');
  
  if (s === e) return false;
  if (!s || !e) return false;
  
  // First letter completely different = definitely wrong
  if (s[0] !== e[0]) {
    return true;
  }
  
  // Calculate similarity
  const maxLen = Math.max(s.length, e.length);
  let matches = 0;
  for (let i = 0; i < Math.min(s.length, e.length); i++) {
    if (s[i] === e[i]) matches++;
  }
  
  const similarity = matches / maxLen;
  
  // Only correct if less than 50% similar (significant error)
  return similarity < 0.5;
};

/**
 * Play a quick sound effect
 */
export class MascotSounds {
  private ctx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private tone(freq: number, dur: number, vol = 0.25) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  correct() {
    this.tone(700, 0.1);
  }

  incorrect() {
    this.tone(250, 0.12);
  }

  streak() {
    setTimeout(() => this.tone(523, 0.1), 0);
    setTimeout(() => this.tone(659, 0.1), 80);
    setTimeout(() => this.tone(784, 0.15), 160);
  }

  celebration() {
    this.tone(523, 0.25);
    this.tone(659, 0.25);
    this.tone(784, 0.25);
    this.tone(1047, 0.25);
  }
}
