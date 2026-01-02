/**
 * Plays correct pronunciation of a word using Web Speech API
 * Fixed to handle Chrome's voice loading and cancel() bug
 */

let voicesLoaded = false;
let preferredVoice: SpeechSynthesisVoice | null = null;
let speechUnlocked = false;

// Pre-load voices on module initialization
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Prefer US English voices, fallback to any English, then any voice
      preferredVoice = 
        voices.find(v => v.lang === 'en-US') || 
        voices.find(v => v.lang.startsWith('en')) || 
        voices[0];
      voicesLoaded = true;
    }
  };
  
  // Load immediately if already available
  loadVoices();
  
  // Also listen for async voice loading (Chrome needs this)
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Unlock speech synthesis - must be called from user gesture (click/tap)
 * Call this on first user interaction with the reading component
 */
export const unlockSpeechSynthesis = () => {
  if (speechUnlocked) return;
  
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Speak empty utterance to unlock
  const unlockUtterance = new SpeechSynthesisUtterance('');
  unlockUtterance.volume = 0;
  window.speechSynthesis.speak(unlockUtterance);
  speechUnlocked = true;
};

export const playCorrectPronunciation = (word: string, retryCount = 0) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Force load voices if not loaded yet
  if (!voicesLoaded) {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      preferredVoice = 
        voices.find(v => v.lang === 'en-US') || 
        voices.find(v => v.lang.startsWith('en')) || 
        voices[0];
      voicesLoaded = true;
    }
  }

  // Wait for voices if not loaded yet (max 8 retries, 250ms each = 2 seconds total)
  if (!voicesLoaded && retryCount < 8) {
    setTimeout(() => playCorrectPronunciation(word, retryCount + 1), 250);
    return;
  }

  if (!voicesLoaded) {
    // Show user-visible error
    if (typeof window !== 'undefined' && (window as any).__showVoiceError) {
      (window as any).__showVoiceError();
    }
    return;
  }

  // Resume if paused (Chrome sometimes pauses synthesis)
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // Cancel any pending speech first
  window.speechSynthesis.cancel();
  
  // Longer delay after cancel to ensure it completes (Chrome bug workaround)
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher pitch
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onerror = (e) => {
      // If error is "not-allowed", speech wasn't unlocked
      if (e.error === 'not-allowed') {
        speechUnlocked = false;
        if (typeof window !== 'undefined' && (window as any).__showVoiceError) {
          (window as any).__showVoiceError();
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  }, 100);
};

/**
 * Plays sound effects using Web Audio API
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

    // Resume audio context if suspended (required after user gesture)
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
    this.playTone(800, 0.1); // Higher pitch, short
  }

  incorrectWord() {
    this.playTone(200, 0.15); // Lower pitch, slightly longer
  }

  streakAchieved() {
    // Play ascending notes
    setTimeout(() => this.playTone(523, 0.1), 0);    // C
    setTimeout(() => this.playTone(659, 0.1), 100);  // E
    setTimeout(() => this.playTone(784, 0.2), 200);  // G
  }

  celebrationSound() {
    // Play a celebratory chord
    this.playTone(523, 0.3); // C
    this.playTone(659, 0.3); // E
    this.playTone(784, 0.3); // G
    this.playTone(1047, 0.3); // C (octave higher)
  }
}
