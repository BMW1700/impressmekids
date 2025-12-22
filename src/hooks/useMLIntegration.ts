/**
 * useMLIntegration - Hook for integrating ML into reading sessions
 * Handles: saving to aura_records for training, triggering Q-learning updates,
 * and using ML predictions during reading
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMLContextSafe } from '@/components/ml/MLStatusProvider';

interface ReadingSessionData {
  studentId: string;
  sessionId: string;
  wpm: number;
  wcpm: number;
  accuracy: number;
  wordsRead: number;
  durationSeconds: number;
  pauseCount: number;
  phonemeScores: Record<string, number>;
  miscueAnalysis?: {
    fluencyLevel: string;
    totalMiscues: number;
  };
  prosodyMetrics?: {
    overallScore: number;
  };
  assignmentId?: string | null;
  transcript?: string;
  audioUrl?: string | null;
  // NEW: Flag to also save as speaking data for Cross-Modal training
  includeSpeakingData?: boolean;
}

interface PhonemePerformance {
  phoneme: string;
  correct: boolean;
  word: string;
}

export const useMLIntegration = () => {
  const mlContext = useMLContextSafe();

  /**
   * Save reading session data to aura_records for ML training
   * This feeds the train-ml-models edge function
   */
  const saveToAuraRecords = useCallback(async (data: ReadingSessionData) => {
    console.log('[ML Integration] saveToAuraRecords called with:', {
      studentId: data.studentId,
      sessionId: data.sessionId,
      wpm: data.wpm,
      accuracy: data.accuracy,
      wordsRead: data.wordsRead,
    });

    try {
      // First verify the user is authenticated
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        console.error('[ML Integration] Not authenticated:', authError);
        return null;
      }

      console.log('[ML Integration] Auth verified, user:', authData.user.id);

      // Build the feedback array from phoneme scores
      const feedbackArray = Object.entries(data.phonemeScores).map(([phoneme, score]) => ({
        phoneme,
        score,
        timestamp: new Date().toISOString(),
      }));

      const insertData = {
        profile_id: data.studentId,
        request_id: `session-${data.sessionId}-${Date.now()}`,
        audio_url: data.audioUrl || '',
        transcript: data.transcript || '',
        language: 'en-US',
        words: data.wordsRead,
        wpm: data.wpm,
        duration_s: data.durationSeconds,
        pause_count: data.pauseCount,
        avg_silence_ms: data.pauseCount > 0 ? Math.round((data.durationSeconds * 1000) / data.pauseCount / 10) : 0,
        asr_confidence: data.accuracy / 100,
        pace: Math.min(100, Math.round((data.wpm / 150) * 100)),
        confidence: Math.round(data.accuracy),
        clarity: data.prosodyMetrics?.overallScore || 70,
        grade: data.accuracy,
        feedback: feedbackArray,
        reading_assignment_id: data.assignmentId || null,
        // CRITICAL FOR CROSS-MODAL: Mark as paired reading+speaking data
        // Word-by-word reading IS speaking - the student speaks each word aloud
        reading_type: data.includeSpeakingData !== false ? 'reading_speaking' : 'word_by_word',
        comprehension_score: data.accuracy,
        annotation_quality_score: Math.round(data.accuracy * 0.9),
        highlight_count: Math.max(1, Math.floor(data.wordsRead / 20)),
        performance_metrics: {
          wcpm: data.wcpm,
          fluencyLevel: data.miscueAnalysis?.fluencyLevel || 'instructional',
          totalMiscues: data.miscueAnalysis?.totalMiscues || 0,
          prosodyScore: data.prosodyMetrics?.overallScore || 70,
          sessionType: 'word_by_word_reading',
          mlIntegrated: true,
          // NEW: Speaking metrics for Cross-Modal training
          hasSpeakingData: true,
          pronunciationAccuracy: data.accuracy,
          phonemeScores: data.phonemeScores,
        },
      };

      console.log('[ML Integration] Inserting to aura_records:', JSON.stringify(insertData).substring(0, 500));

      const { data: result, error } = await supabase
        .from('aura_records')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[ML Integration] Failed to save to aura_records:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }

      console.log('[ML Integration] ✅ Successfully saved to aura_records:', result.id);
      return result;
    } catch (err) {
      console.error('[ML Integration] Exception saving to aura_records:', err);
      return null;
    }
  }, []);

  /**
   * Trigger Q-learning update after a reading session
   * This updates the phoneme Q-table based on performance
   */
  const triggerQLearningUpdate = useCallback(async (
    studentId: string,
    phonemePerformance: PhonemePerformance[],
    masteredPhonemes: string[],
    strugglingPhonemes: string[],
    difficultyLevel: number
  ) => {
    console.log('[ML Integration] triggerQLearningUpdate called:', {
      studentId,
      phonemePerformanceCount: phonemePerformance.length,
      masteredCount: masteredPhonemes.length,
      strugglingCount: strugglingPhonemes.length,
      difficultyLevel,
    });

    try {
      // Group performance by phoneme
      const phonemeResults: Record<string, { correct: number; total: number }> = {};
      
      for (const perf of phonemePerformance) {
        if (!phonemeResults[perf.phoneme]) {
          phonemeResults[perf.phoneme] = { correct: 0, total: 0 };
        }
        phonemeResults[perf.phoneme].total++;
        if (perf.correct) {
          phonemeResults[perf.phoneme].correct++;
        }
      }

      // Build learning experiences for Q-learning update
      const experiences = Object.entries(phonemeResults).map(([phoneme, result]) => ({
        phoneme,
        accuracy: result.total > 0 ? result.correct / result.total : 0,
        attempts: result.total,
      }));

      if (experiences.length === 0) {
        console.log('[ML Integration] No phoneme experiences to update');
        return null;
      }

      console.log('[ML Integration] Calling update-q-learning with experiences:', experiences.length);

      const { data, error } = await supabase.functions.invoke('update-q-learning', {
        body: {
          studentId,
          experiences,
          currentState: {
            masteredPhonemes,
            strugglingPhonemes,
            level: difficultyLevel,
          },
          exerciseType: 'word_by_word_reading',
        },
      });

      if (error) {
        console.error('[ML Integration] Q-learning update failed:', {
          error: error.message,
          context: error.context,
        });
        return null;
      }

      console.log('[ML Integration] ✅ Q-learning updated successfully:', data);
      return data;
    } catch (err) {
      console.error('[ML Integration] Exception in Q-learning update:', err);
      return null;
    }
  }, []);

  /**
   * Get ML-powered predictions for a reading session
   * Uses cross-modal network if available
   */
  const getMLPredictions = useCallback((readingFeatures: {
    comprehensionScore: number;
    annotationQuality: number;
    criticalThinkingScore: number;
    highlightCount: number;
    avgAnnotationLength: number;
  }) => {
    if (!mlContext) {
      return {
        fluency: 70,
        prosody: 70,
        confidence: 70,
        wpm: 100,
        pauseControl: 70,
        clarity: 70,
        isMLPowered: false,
      };
    }

    return mlContext.predictSpeakingFromReading(readingFeatures);
  }, [mlContext]);

  /**
   * Get the best phoneme to practice next using Q-learning
   */
  const getBestPhonemeToRecommend = useCallback((
    masteredPhonemes: string[],
    strugglingPhonemes: string[],
    level: number,
    candidatePhonemes: string[]
  ) => {
    if (!mlContext || candidatePhonemes.length === 0) {
      return {
        phoneme: candidatePhonemes[0] || 'θ',
        expectedReward: 0.5,
        reasoning: 'Default recommendation (ML not available)',
        isMLPowered: false,
      };
    }

    return mlContext.selectBestPhoneme(
      masteredPhonemes,
      strugglingPhonemes,
      level,
      candidatePhonemes
    );
  }, [mlContext]);

  /**
   * Get model status for display
   */
  const getModelStatus = useCallback(() => {
    if (!mlContext) {
      return {
        crossModalLoaded: false,
        qLearningLoaded: false,
        isLoading: false,
      };
    }

    return {
      crossModalLoaded: mlContext.modelStatus.crossModalNetwork.loaded,
      qLearningLoaded: mlContext.modelStatus.qLearningTable.loaded,
      isLoading: mlContext.isLoading,
    };
  }, [mlContext]);

  return {
    saveToAuraRecords,
    triggerQLearningUpdate,
    getMLPredictions,
    getBestPhonemeToRecommend,
    getModelStatus,
    mlContext,
  };
};
