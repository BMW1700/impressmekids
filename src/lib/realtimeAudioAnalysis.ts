/**
 * Real-time Audio Analysis Utilities
 * Provides instant feedback during recording
 */

export interface RealtimeFeedbackEvent {
  timestamp: number;
  type: 'pace' | 'clarity' | 'volume' | 'confidence' | 'phoneme';
  message: string;
  severity: 'info' | 'warning' | 'success';
  confidence: number;
}

export interface LiveMetrics {
  currentVolume: number;       // 0-100
  avgPitch: number;            // Hz
  speechRate: number;          // words per minute
  clarityScore: number;        // 0-100
  confidenceScore: number;     // 0-100
  energyLevel: number;         // 0-100
}

/**
 * Analyze audio in real-time using AudioContext
 */
export class RealtimeAudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));
  private animationFrame: number | null = null;
  private startTime: number = 0;
  private silenceThreshold = 30; // Amplitude threshold for speech detection
  
  private onMetricsUpdate: (metrics: LiveMetrics) => void;
  private onFeedback: (event: RealtimeFeedbackEvent) => void;

  // Performance tracking
  private volumeHistory: number[] = [];
  private pitchHistory: number[] = [];
  private lastFeedbackTime = 0;
  private feedbackCooldown = 3000; // 3 seconds between feedback messages

  constructor(
    onMetricsUpdate: (metrics: LiveMetrics) => void,
    onFeedback: (event: RealtimeFeedbackEvent) => void
  ) {
    this.onMetricsUpdate = onMetricsUpdate;
    this.onFeedback = onFeedback;
  }

  async start(stream: MediaStream) {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    const source = this.audioContext.createMediaStreamSource(stream);
    
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    source.connect(this.analyser);
    
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
    
    this.startTime = Date.now();
    this.analyze();
  }

  private analyze = () => {
    if (!this.analyser || this.dataArray.length === 0) return;

    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate volume (RMS)
    const volume = this.calculateVolume(this.dataArray);
    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > 50) this.volumeHistory.shift();

    // Calculate pitch
    const pitch = this.estimatePitch(this.dataArray);
    this.pitchHistory.push(pitch);
    if (this.pitchHistory.length > 50) this.pitchHistory.shift();

    // Calculate metrics
    const avgVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
    const avgPitch = this.pitchHistory.filter(p => p > 0).reduce((a, b) => a + b, 0) / 
                     this.pitchHistory.filter(p => p > 0).length || 0;

    // Speech rate estimation (simplified)
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    const speechRate = volume > this.silenceThreshold ? 120 : 0; // Simplified WPM

    // Clarity score based on pitch stability
    const pitchVariation = this.calculateVariation(this.pitchHistory);
    const clarityScore = Math.max(0, Math.min(100, 100 - pitchVariation * 2));

    // Confidence score based on volume consistency
    const volumeVariation = this.calculateVariation(this.volumeHistory);
    const confidenceScore = Math.max(0, Math.min(100, 100 - volumeVariation));

    // Energy level
    const energyLevel = Math.min(100, (avgVolume / 128) * 100);

    const metrics: LiveMetrics = {
      currentVolume: Math.round(volume),
      avgPitch: Math.round(avgPitch),
      speechRate: Math.round(speechRate),
      clarityScore: Math.round(clarityScore),
      confidenceScore: Math.round(confidenceScore),
      energyLevel: Math.round(energyLevel),
    };

    this.onMetricsUpdate(metrics);

    // Generate real-time feedback
    this.generateFeedback(metrics);

    this.animationFrame = requestAnimationFrame(this.analyze);
  };

  private calculateVolume(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);
    return Math.min(128, rms);
  }

  private estimatePitch(data: Uint8Array): number {
    // Find dominant frequency bin
    let maxIndex = 0;
    let maxValue = 0;
    
    for (let i = 1; i < data.length / 2; i++) {
      if (data[i] > maxValue) {
        maxValue = data[i];
        maxIndex = i;
      }
    }

    if (maxValue < 50) return 0; // Too quiet to determine pitch
    
    const sampleRate = this.audioContext?.sampleRate || 24000;
    const pitch = (maxIndex * sampleRate) / (this.analyser?.fftSize || 2048);
    
    return pitch > 50 && pitch < 500 ? pitch : 0; // Human voice range
  }

  private calculateVariation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  private generateFeedback(metrics: LiveMetrics) {
    const now = Date.now();
    if (now - this.lastFeedbackTime < this.feedbackCooldown) return;

    // Volume feedback
    if (metrics.currentVolume < 20) {
      this.onFeedback({
        timestamp: now,
        type: 'volume',
        message: 'Speak a bit louder',
        severity: 'warning',
        confidence: 0.9,
      });
      this.lastFeedbackTime = now;
    } else if (metrics.currentVolume > 100) {
      this.onFeedback({
        timestamp: now,
        type: 'volume',
        message: 'Volume is too high',
        severity: 'warning',
        confidence: 0.85,
      });
      this.lastFeedbackTime = now;
    }

    // Clarity feedback
    if (metrics.clarityScore < 60) {
      this.onFeedback({
        timestamp: now,
        type: 'clarity',
        message: 'Try to speak more clearly',
        severity: 'info',
        confidence: 0.75,
      });
      this.lastFeedbackTime = now;
    } else if (metrics.clarityScore > 85) {
      this.onFeedback({
        timestamp: now,
        type: 'clarity',
        message: 'Great clarity!',
        severity: 'success',
        confidence: 0.9,
      });
      this.lastFeedbackTime = now;
    }

    // Pace feedback
    if (metrics.speechRate > 160) {
      this.onFeedback({
        timestamp: now,
        type: 'pace',
        message: 'Slow down a little',
        severity: 'warning',
        confidence: 0.8,
      });
      this.lastFeedbackTime = now;
    }
  }

  stop() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.analyser = null;
    this.dataArray = new Uint8Array(new ArrayBuffer(0));
  }
}