/**
 * Hook to load and use trained ML models from the database
 * Provides real ML-powered predictions instead of rule-based fallbacks
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CrossModalWeights {
  weights: number[][];
  biases: number[];
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

interface CrossModalPrediction {
  fluency: number;
  prosody: number;
  confidence: number;
  wpm: number;
  pauseControl: number;
  clarity: number;
}

// Simple neural network forward pass (matches edge function)
function forwardPass(weights: number[][], biases: number[], input: number[]): number[] {
  const relu = (x: number) => Math.max(0, x);
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));

  // Hidden layer
  const hidden: number[] = [];
  for (let j = 0; j < 8; j++) {
    let sum = biases[j];
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * weights[i][j];
    }
    hidden.push(relu(sum));
  }

  // Output layer
  const output: number[] = [];
  for (let k = 0; k < 6; k++) {
    let sum = biases[8 + k];
    for (let j = 0; j < hidden.length; j++) {
      sum += hidden[j] * weights[6 + j][k];
    }
    output.push(sigmoid(sum) * 100);
  }

  return output;
}

export const useTrainedMLModels = () => {
  const [crossModalWeights, setCrossModalWeights] = useState<CrossModalWeights | null>(null);
  const [qLearningTable, setQLearningTable] = useState<Record<string, Record<string, number>> | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    crossModalNetwork: { loaded: false, version: null, accuracy: null, trainingExamples: 0 },
    qLearningTable: { loaded: false, version: null, totalStates: 0, totalActions: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  // Reusable loadModels function
  const loadModels = useCallback(async () => {
    setIsLoading(true);

    try {
      // Load Cross-Modal Network weights
      const { data: crossModalData } = await supabase
        .from('ml_model_weights')
        .select('*')
        .eq('model_type', 'cross_modal_network')
        .eq('is_active', true)
        .single();

      if (crossModalData?.weights) {
        const weights = crossModalData.weights as unknown as CrossModalWeights;
        setCrossModalWeights(weights);
        const metadata = crossModalData.metadata as unknown as Record<string, any> || {};
        setModelStatus(prev => ({
          ...prev,
          crossModalNetwork: {
            loaded: true,
            version: crossModalData.model_version,
            accuracy: metadata.accuracy || null,
            trainingExamples: crossModalData.training_examples_count,
          },
        }));
        console.log('[ML] Loaded Cross-Modal Network v' + crossModalData.model_version);
      }

      // Load Q-Learning table
      const { data: qLearningData } = await supabase
        .from('ml_model_weights')
        .select('*')
        .eq('model_type', 'q_learning_table')
        .eq('is_active', true)
        .single();

      if (qLearningData?.weights) {
        const table = qLearningData.weights as Record<string, Record<string, number>>;
        setQLearningTable(table);
        const metadata = qLearningData.metadata as Record<string, any> || {};
        setModelStatus(prev => ({
          ...prev,
          qLearningTable: {
            loaded: true,
            version: qLearningData.model_version,
            totalStates: metadata.totalStates || Object.keys(table).length,
            totalActions: metadata.totalActions || 0,
          },
        }));
        console.log('[ML] Loaded Q-Learning Table v' + qLearningData.model_version);
      }
    } catch (error) {
      console.error('[ML] Failed to load models:', error);
    }

    setIsLoading(false);
  }, []);

  // Load trained models on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Predict speaking performance from reading features
  const predictSpeakingFromReading = useCallback((readingFeatures: {
    comprehensionScore: number;
    annotationQuality: number;
    criticalThinkingScore: number;
    highlightCount: number;
    avgAnnotationLength: number;
    vocabularyComplexity?: number;
  }): CrossModalPrediction & { isMLPowered: boolean } => {
    if (!crossModalWeights) {
      // Fallback to rule-based
      const baseScore = (readingFeatures.comprehensionScore + readingFeatures.annotationQuality) / 2;
      return {
        fluency: Math.round(baseScore * 0.9),
        prosody: Math.round(baseScore * 0.85),
        confidence: Math.round(baseScore * 0.8),
        wpm: Math.round(100 + baseScore * 0.5),
        pauseControl: Math.round(baseScore * 0.75),
        clarity: Math.round(baseScore * 0.85),
        isMLPowered: false,
      };
    }

    // Normalize inputs
    const input = [
      (readingFeatures.comprehensionScore || 50) / 100,
      (readingFeatures.annotationQuality || 50) / 100,
      Math.min((readingFeatures.criticalThinkingScore || 0), 100) / 100,
      Math.min((readingFeatures.highlightCount || 0), 20) / 20,
      Math.min((readingFeatures.avgAnnotationLength || 0), 200) / 200,
      (readingFeatures.vocabularyComplexity || 50) / 100,
    ];

    // Run neural network
    const output = forwardPass(crossModalWeights.weights, crossModalWeights.biases, input);

    return {
      fluency: Math.round(output[0]),
      prosody: Math.round(output[1]),
      confidence: Math.round(output[2]),
      wpm: Math.round(output[3] * 2), // Scale back to WPM range
      pauseControl: Math.round(output[4]),
      clarity: Math.round(output[5]),
      isMLPowered: true,
    };
  }, [crossModalWeights]);

  // Get Q-value for a phoneme action
  const getPhonemeQValue = useCallback((
    masteredPhonemes: string[],
    strugglingPhonemes: string[],
    level: number,
    phoneme: string
  ): { qValue: number; isMLPowered: boolean } => {
    if (!qLearningTable) {
      return { qValue: 0.5, isMLPowered: false };
    }

    const stateKey = `${masteredPhonemes.sort().slice(0, 5).join(',')}_${strugglingPhonemes.sort().slice(0, 5).join(',')}_${level}`;
    
    if (qLearningTable[stateKey] && qLearningTable[stateKey][phoneme] !== undefined) {
      return { qValue: qLearningTable[stateKey][phoneme], isMLPowered: true };
    }

    // Check similar states
    for (const [state, actions] of Object.entries(qLearningTable)) {
      if (state.includes(phoneme) && actions[phoneme] !== undefined) {
        return { qValue: actions[phoneme], isMLPowered: true };
      }
    }

    return { qValue: 0.5, isMLPowered: false };
  }, [qLearningTable]);

  // Select best phoneme to practice
  const selectBestPhoneme = useCallback((
    masteredPhonemes: string[],
    strugglingPhonemes: string[],
    level: number,
    candidatePhonemes: string[]
  ): { phoneme: string; expectedReward: number; reasoning: string; isMLPowered: boolean } => {
    if (!qLearningTable || candidatePhonemes.length === 0) {
      return {
        phoneme: candidatePhonemes[0] || 's',
        expectedReward: 0.5,
        reasoning: 'Using default recommendation (model not trained yet)',
        isMLPowered: false,
      };
    }

    let bestPhoneme = candidatePhonemes[0];
    let bestQ = -Infinity;

    for (const phoneme of candidatePhonemes) {
      const { qValue } = getPhonemeQValue(masteredPhonemes, strugglingPhonemes, level, phoneme);
      if (qValue > bestQ) {
        bestQ = qValue;
        bestPhoneme = phoneme;
      }
    }

    const reasoning = bestQ > 0.7 
      ? `High success probability (${Math.round(bestQ * 100)}%) based on ${modelStatus.qLearningTable.totalStates} learned patterns`
      : bestQ > 0.5 
        ? `Moderate success expected (${Math.round(bestQ * 100)}%) from ML training data`
        : 'Exploratory recommendation to improve learning model';

    return {
      phoneme: bestPhoneme,
      expectedReward: bestQ,
      reasoning,
      isMLPowered: true,
    };
  }, [qLearningTable, getPhonemeQValue, modelStatus.qLearningTable.totalStates]);

  // Trigger training and refetch models after success
  const triggerTraining = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsTraining(true);
    try {
      const { data, error } = await supabase.functions.invoke('train-ml-models', {
        body: {},
      });

      if (error) throw error;

      // Refetch models after successful training
      await loadModels();

      return {
        success: true,
        message: data?.message || 'Training completed',
      };
    } catch (error) {
      console.error('[ML] Training failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Training failed',
      };
    } finally {
      setIsTraining(false);
    }
  }, [loadModels]);

  return {
    modelStatus,
    isLoading,
    isTraining,
    predictSpeakingFromReading,
    getPhonemeQValue,
    selectBestPhoneme,
    triggerTraining,
    refetchModels: loadModels,
  };
};
