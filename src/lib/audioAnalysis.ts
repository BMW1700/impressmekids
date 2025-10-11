import Meyda from 'meyda';

export interface AudioFeatures {
  avgPitch: number;
  pitchVariance: number;
  avgEnergy: number;
  energyVariance: number;
  avgMFCC: number[];
  zcr: number; // Zero crossing rate
  spectralCentroid: number;
  spectralRolloff: number;
  pauseCount?: number;
  avgSilenceDuration?: number;
  prosodyScore?: number;
}

export interface PhonemeData {
  phoneme: string;
  timestamp: number;
  duration: number;
  confidence: number;
}

/**
 * Extract audio features from an audio buffer using Meyda
 */
export const extractAudioFeatures = async (audioBlob: Blob): Promise<AudioFeatures> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get audio data from first channel
        const audioData = audioBuffer.getChannelData(0);
        
        // Configure Meyda
        const bufferSize = 512;
        const hopSize = 256;
        const features: any[] = [];
        
        // Extract features in chunks
        for (let i = 0; i < audioData.length - bufferSize; i += hopSize) {
          const buffer = audioData.slice(i, i + bufferSize);
          const meydaFeatures = Meyda.extract([
            'rms',
            'zcr',
            'spectralCentroid',
            'spectralRolloff',
            'mfcc'
          ], buffer);
          
          if (meydaFeatures) {
            features.push(meydaFeatures);
          }
        }
        
        // Calculate averages
        const avgEnergy = features.reduce((sum, f) => sum + (f.rms || 0), 0) / features.length;
        const energyValues = features.map(f => f.rms || 0);
        const energyVariance = calculateVariance(energyValues);
        
        const avgZcr = features.reduce((sum, f) => sum + (f.zcr || 0), 0) / features.length;
        const avgSpectralCentroid = features.reduce((sum, f) => sum + (f.spectralCentroid || 0), 0) / features.length;
        const avgSpectralRolloff = features.reduce((sum, f) => sum + (f.spectralRolloff || 0), 0) / features.length;
        
        // Average MFCC coefficients
        const mfccCoeffs = features[0]?.mfcc?.length || 13;
        const avgMFCC = Array(mfccCoeffs).fill(0).map((_, idx) => {
          return features.reduce((sum, f) => sum + (f.mfcc?.[idx] || 0), 0) / features.length;
        });
        
        // Estimate pitch from spectral features
        const avgPitch = avgSpectralCentroid * 0.5; // Rough approximation
        const pitchVariance = calculateVariance(features.map(f => (f.spectralCentroid || 0) * 0.5));
        
        resolve({
          avgPitch,
          pitchVariance,
          avgEnergy,
          energyVariance,
          avgMFCC,
          zcr: avgZcr,
          spectralCentroid: avgSpectralCentroid,
          spectralRolloff: avgSpectralRolloff
        });
        
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read audio file'));
    reader.readAsArrayBuffer(audioBlob);
  });
};

/**
 * Calculate variance of a numeric array
 */
const calculateVariance = (values: number[]): number => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Estimate pause count and average silence duration from energy levels
 */
export const analyzePauses = (audioFeatures: AudioFeatures, durationSeconds: number): {
  pauseCount: number;
  avgSilenceDuration: number;
} => {
  // Estimate pauses based on energy variance and duration
  // Higher variance suggests more pauses
  const energyThreshold = audioFeatures.avgEnergy * 0.3;
  const estimatedPauseRate = Math.max(0, (audioFeatures.energyVariance / audioFeatures.avgEnergy) * 10);
  const pauseCount = Math.round(estimatedPauseRate * (durationSeconds / 60));
  
  const avgSilenceDuration = pauseCount > 0 ? (durationSeconds / pauseCount) * 0.2 : 0;
  
  return {
    pauseCount: Math.max(0, pauseCount),
    avgSilenceDuration: Math.max(0, avgSilenceDuration * 1000) // Convert to ms
  };
};

/**
 * Calculate prosody score from audio features
 */
export const calculateProsodyScore = (audioFeatures: AudioFeatures): number => {
  // Good prosody has moderate pitch variance and consistent energy
  const pitchScore = Math.min(100, (audioFeatures.pitchVariance / 100) * 100);
  const energyConsistency = 100 - Math.min(100, (audioFeatures.energyVariance / audioFeatures.avgEnergy) * 100);
  
  return Math.round((pitchScore * 0.6 + energyConsistency * 0.4));
};
