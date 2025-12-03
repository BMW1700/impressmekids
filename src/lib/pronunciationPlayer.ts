/**
 * Simple, reliable pronunciation player using Web Speech API
 * Rebuilt from scratch to avoid Chrome cancel() bugs
 */

let preferredVoice: SpeechSynthesisVoice | null = null;
let voicesReady = false;

// Initialize voices
const initVoices = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    preferredVoice = 
      voices.find(v => v.lang === 'en-US' && v.localService) ||
      voices.find(v => v.lang === 'en-US') || 
      voices.find(v => v.lang.startsWith('en')) || 
      voices[0];
    voicesReady = true;
  }
};

// Load voices on init and when they change
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  initVoices();
  window.speechSynthesis.onvoiceschanged = initVoices;
}

/**
 * Play pronunciation of a word - simple and reliable
 */
export const playCorrectPronunciation = (word: string): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }

    // Ensure voices are loaded
    if (!voicesReady) {
      initVoices();
      if (!voicesReady) {
        console.warn('No voices available');
        resolve();
        return;
      }
    }

    // Resume if paused (Chrome pauses when tab is backgrounded)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // DON'T call cancel() - this is what was breaking everything!
    // Just queue up the new speech
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      // Only log real errors, not 'interrupted' or 'canceled'
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error('Speech error:', e.error);
      }
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Stop all speech immediately
 */
export const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Unlock speech synthesis - call on user gesture
 */
export const unlockSpeechSynthesis = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  // Speak empty string to unlock
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
};

/**
 * Sound effects using Web Audio API
 */
export class SoundEffects {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  correctWord() {
    this.playTone(800, 0.1);
  }

  incorrectWord() {
    this.playTone(200, 0.15);
  }

  streakAchieved() {
    setTimeout(() => this.playTone(523, 0.1), 0);
    setTimeout(() => this.playTone(659, 0.1), 100);
    setTimeout(() => this.playTone(784, 0.2), 200);
  }

  celebrationSound() {
    this.playTone(523, 0.3);
    this.playTone(659, 0.3);
    this.playTone(784, 0.3);
    this.playTone(1047, 0.3);
  }
}
