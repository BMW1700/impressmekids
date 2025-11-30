/**
 * Plays correct pronunciation of a word using Web Speech API
 */
export const playCorrectPronunciation = (word: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.8; // Slightly slower for clarity
  utterance.pitch = 1.1; // Slightly higher pitch
  utterance.volume = 1.0;
  utterance.lang = 'en-US';

  window.speechSynthesis.speak(utterance);
};

/**
 * Plays sound effects using Web Audio API
 */
export class SoundEffects {
  private audioContext: AudioContext | null = null;

  constructor() {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.audioContext) return;

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
