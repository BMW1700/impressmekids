/**
 * MLStatusProvider - Global ML context that wires up auto-training and provides ML status
 * This component should wrap the app to enable automatic ML training when sufficient data exists
 */

import { createContext, useContext, ReactNode } from 'react';
import { useAutoMLTraining } from '@/hooks/useAutoMLTraining';
import { useTrainedMLModels } from '@/hooks/useTrainedMLModels';

// Re-export the hook types for consumers
interface CrossModalPrediction {
  fluency: number;
  prosody: number;
  confidence: number;
  wpm: number;
  pauseControl: number;
  clarity: number;
  isMLPowered: boolean;
}

interface ModelStatus {
  crossModalNetwork: {
    loaded: boolean;
    version: number | null;
    accuracy: number | null;
    trainingExamples: number;
  };
  qLearningTable: {
    loaded: boolean;
    version: number | null;
    totalStates: number;
    totalActions: number;
  };
}

interface MLContextType {
  // Model status
  modelStatus: ModelStatus;
  isLoading: boolean;
  
  // Predictions - matches useTrainedMLModels signatures
  predictSpeakingFromReading: (readingFeatures: {
    comprehensionScore: number;
    annotationQuality: number;
    criticalThinkingScore: number;
    highlightCount: number;
    avgAnnotationLength: number;
    vocabularyComplexity?: number;
  }) => CrossModalPrediction;
  
  // Q-learning - matches useTrainedMLModels signatures
  getPhonemeQValue: (
    masteredPhonemes: string[],
    strugglingPhonemes: string[],
    level: number,
    phoneme: string
  ) => { qValue: number; isMLPowered: boolean };
  
  selectBestPhoneme: (
    masteredPhonemes: string[],
    strugglingPhonemes: string[],
    level: number,
    candidatePhonemes: string[]
  ) => { phoneme: string; expectedReward: number; reasoning: string; isMLPowered: boolean };
  
  // Training
  triggerTraining: () => Promise<{ success: boolean; message: string }>;
  isTraining: boolean;
}

const MLContext = createContext<MLContextType | null>(null);

export const useMLContext = () => {
  const context = useContext(MLContext);
  if (!context) {
    throw new Error('useMLContext must be used within an MLStatusProvider');
  }
  return context;
};

// Safe hook for optional usage (doesn't throw if not in provider)
export const useMLContextSafe = () => {
  return useContext(MLContext);
};

interface MLStatusProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export const MLStatusProvider = ({ children, enabled = true }: MLStatusProviderProps) => {
  // Auto-training hook - runs background training when sufficient data exists
  const { isTraining } = useAutoMLTraining(enabled);
  
  // Trained models hook - loads and uses ML models for predictions
  const {
    modelStatus,
    isLoading,
    predictSpeakingFromReading,
    getPhonemeQValue,
    selectBestPhoneme,
    triggerTraining,
  } = useTrainedMLModels();

  const value: MLContextType = {
    modelStatus,
    isLoading,
    predictSpeakingFromReading,
    getPhonemeQValue,
    selectBestPhoneme,
    triggerTraining,
    isTraining,
  };

  return (
    <MLContext.Provider value={value}>
      {children}
    </MLContext.Provider>
  );
};
