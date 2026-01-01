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
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  private ensureContext() {
    if (!this.audioContext) return false;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.soundEnabled;
  }

  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.ensureContext() || !this.audioContext) return;

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

  private playNoise(duration: number, volume: number = 0.2, filterFreq: number = 1000) {
    if (!this.ensureContext() || !this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    noise.start();
    noise.stop(this.audioContext.currentTime + duration);
  }

  correctWord() {
    this.playTone(800, 0.1, 0.2); // Higher pitch, short, softer
  }

  incorrectWord() {
    this.playTone(200, 0.15, 0.2); // Lower pitch, slightly longer, softer
  }

  streakAchieved() {
    // Play ascending notes
    setTimeout(() => this.playTone(523, 0.1, 0.25), 0);    // C
    setTimeout(() => this.playTone(659, 0.1, 0.25), 100);  // E
    setTimeout(() => this.playTone(784, 0.2, 0.25), 200);  // G
  }

  celebrationSound() {
    // Play a celebratory chord
    this.playTone(523, 0.3, 0.2); // C
    this.playTone(659, 0.3, 0.2); // E
    this.playTone(784, 0.3, 0.2); // G
    this.playTone(1047, 0.3, 0.2); // C (octave higher)
  }

  // === ELEMENTAL SOUND EFFECTS ===

  /**
   * Fire whoosh - warm filtered noise with pitch glide
   */
  fireWhoosh() {
    if (!this.ensureContext() || !this.audioContext) return;

    // Crackling noise component
    this.playNoise(0.4, 0.15, 2000);
    
    // Rising tone for the "whoosh"
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.4);
    
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.5);
  }

  /**
   * Ice shimmer - crystalline chime with sparkle
   */
  iceShimmer() {
    if (!this.ensureContext() || !this.audioContext) return;

    // High crystalline tones
    const freqs = [1200, 1500, 1800, 2200];
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.08, this.audioContext!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.audioContext!.destination);
        
        osc.start();
        osc.stop(this.audioContext!.currentTime + 0.35);
      }, i * 50);
    });

    // Add subtle shimmer noise
    setTimeout(() => this.playNoise(0.2, 0.05, 8000), 100);
  }

  /**
   * Lightning crack - sharp transient with rumble
   */
  lightningCrack() {
    if (!this.ensureContext() || !this.audioContext) return;

    // Sharp crack (white noise burst)
    const bufferSize = this.audioContext.sampleRate * 0.05;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      // Exponential decay
      const decay = Math.exp(-i / (bufferSize * 0.1));
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const crack = this.audioContext.createBufferSource();
    crack.buffer = buffer;

    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 2000;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.25;

    crack.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    crack.start();

    // Low rumble following the crack
    setTimeout(() => {
      this.playTone(60, 0.3, 0.15);
      this.playTone(80, 0.25, 0.1);
    }, 30);
  }

  /**
   * Rock crumble - low rumble for earth/physical attacks
   */
  rockCrumble() {
    if (!this.ensureContext() || !this.audioContext) return;

    // Multiple low tones for rumbling effect
    this.playTone(50, 0.3, 0.2);
    setTimeout(() => this.playTone(70, 0.25, 0.15), 50);
    setTimeout(() => this.playTone(60, 0.2, 0.1), 100);
    
    // Gritty noise
    this.playNoise(0.35, 0.1, 300);
  }

  /**
   * Magic sparkle - general spell cast sound
   */
  magicSparkle() {
    if (!this.ensureContext() || !this.audioContext) return;

    // Ascending sparkle tones
    const freqs = [600, 800, 1000, 1200];
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 0.1);
      }, i * 40);
    });
  }

  /**
   * Shield block - solid defensive sound
   */
  shieldBlock() {
    if (!this.ensureContext() || !this.audioContext) return;

    // Deep impact
    this.playTone(100, 0.2, 0.2);
    this.playTone(200, 0.15, 0.15);
    
    // Metallic ring
    setTimeout(() => {
      this.playTone(800, 0.1, 0.08);
      this.playTone(1200, 0.08, 0.05);
    }, 30);
  }

  /**
   * Combo success - ascending triumphant sound
   */
  comboSuccess() {
    const freqs = [400, 500, 600, 800, 1000];
    freqs.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 0.12), i * 60);
    });
  }

  /**
   * Mini-game start - attention-grabbing sound
   */
  miniGameStart() {
    this.playTone(400, 0.1, 0.15);
    setTimeout(() => this.playTone(600, 0.1, 0.15), 100);
    setTimeout(() => this.playTone(800, 0.15, 0.2), 200);
  }
}
