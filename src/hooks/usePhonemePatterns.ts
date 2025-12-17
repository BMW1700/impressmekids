/**
 * Hook to track and analyze phoneme patterns across reading sessions
 * Persists patterns to student profile for longitudinal tracking
 * $0/month - all processing in-browser with Supabase storage
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  compareWordPhonemes, 
  analyzePhonemePatterns, 
  type PhonemeInferenceResult,
  type WordPhonemeComparison 
} from '@/lib/phonemeInference';
import { 
  generateInterventionReport, 
  getPhonemeImprovementMessage,
  type InterventionReport 
} from '@/lib/phonemeInterventions';

export interface PhonemePatternData {
  // Historical accuracy by phoneme (rolling average)
  phonemeAccuracyHistory: Record<string, number[]>;
  // Current session patterns
  currentSessionPatterns: PhonemeInferenceResult | null;
  // Aggregated problem phonemes across sessions
  persistentProblems: string[];
  // Last updated timestamp
  lastUpdated: string;
  // Total sessions analyzed
  sessionsAnalyzed: number;
}

export interface UsePhonemePatternResult {
  // Current session analysis
  currentAnalysis: PhonemeInferenceResult | null;
  // Historical patterns
  patterns: PhonemePatternData | null;
  // Intervention report
  interventionReport: InterventionReport | null;
  // Improvement messages to show
  improvementMessages: string[];
  // Loading state
  isLoading: boolean;
  // Analyze words from a reading session
  analyzeSession: (wordReadings: Array<{ word: string; index: number; correct: boolean }>, expectedWords: string[]) => void;
  // Persist patterns to database
  savePatterns: () => Promise<void>;
  // Get phoneme accuracy trend for a specific phoneme
  getAccuracyTrend: (phoneme: string) => number[];
}

export const usePhonemePatterns = (studentId?: string): UsePhonemePatternResult => {
  const [patterns, setPatterns] = useState<PhonemePatternData | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<PhonemeInferenceResult | null>(null);
  const [interventionReport, setInterventionReport] = useState<InterventionReport | null>(null);
  const [improvementMessages, setImprovementMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing patterns from database
  useEffect(() => {
    const loadPatterns = async () => {
      if (!studentId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('stats')
          .eq('user_id', studentId)
          .single();
        
        if (data?.stats && typeof data.stats === 'object') {
          const stats = data.stats as Record<string, unknown>;
          if (stats.phonemePatterns) {
            setPatterns(stats.phonemePatterns as PhonemePatternData);
          }
        }
      } catch (err) {
        console.error('Error loading phoneme patterns:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPatterns();
  }, [studentId]);

  /**
   * Analyze phoneme patterns from word readings
   */
  const analyzeSession = useCallback((
    wordReadings: Array<{ word: string; index: number; correct: boolean }>,
    expectedWords: string[]
  ) => {
    // Only analyze incorrect words for phoneme substitutions
    const incorrectReadings = wordReadings.filter(wr => !wr.correct);
    
    if (incorrectReadings.length === 0) {
      // Perfect session - still track phonemes as correct
      const perfectComparisons: WordPhonemeComparison[] = wordReadings.map(wr => ({
        word: expectedWords[wr.index] || wr.word,
        wordIndex: wr.index,
        expectedPhonemes: [],
        spokenPhonemes: [],
        substitutions: [],
        isMatch: true,
      }));
      
      setCurrentAnalysis({
        substitutions: [],
        problematicPhonemes: [],
        phonemeAccuracyBySound: {},
        overallPhonemeAccuracy: 100,
        interventionPriority: [],
      });
      return;
    }
    
    // Compare phonemes for each word
    const comparisons: WordPhonemeComparison[] = wordReadings.map(wr => {
      const expectedWord = expectedWords[wr.index] || wr.word;
      return compareWordPhonemes(wr.word, expectedWord, wr.index);
    });
    
    // Analyze patterns across all comparisons
    const analysis = analyzePhonemePatterns(comparisons);
    setCurrentAnalysis(analysis);
    
    // Check for improvements compared to historical data
    const messages: string[] = [];
    if (patterns?.phonemeAccuracyHistory) {
      Object.entries(analysis.phonemeAccuracyBySound).forEach(([phoneme, accuracy]) => {
        const history = patterns.phonemeAccuracyHistory[phoneme];
        if (history && history.length > 0) {
          const previousAvg = history.reduce((a, b) => a + b, 0) / history.length;
          const message = getPhonemeImprovementMessage(phoneme, previousAvg, accuracy);
          if (message) {
            messages.push(message);
          }
        }
      });
    }
    setImprovementMessages(messages);
    
    // Generate intervention report
    const report = generateInterventionReport(
      analysis.phonemeAccuracyBySound,
      analysis.problematicPhonemes,
      analysis.overallPhonemeAccuracy
    );
    setInterventionReport(report);
    
    // Update local patterns state
    setPatterns(prev => {
      const newHistory = { ...(prev?.phonemeAccuracyHistory || {}) };
      
      // Add current session accuracy to history (keep last 10 sessions)
      Object.entries(analysis.phonemeAccuracyBySound).forEach(([phoneme, accuracy]) => {
        if (!newHistory[phoneme]) {
          newHistory[phoneme] = [];
        }
        newHistory[phoneme] = [...newHistory[phoneme].slice(-9), accuracy];
      });
      
      // Identify persistent problems (appear in 3+ of last 5 sessions)
      const recentProblems: Record<string, number> = {};
      Object.entries(newHistory).forEach(([phoneme, history]) => {
        const recent = history.slice(-5);
        const problemCount = recent.filter(acc => acc < 70).length;
        if (problemCount >= 3) {
          recentProblems[phoneme] = problemCount;
        }
      });
      
      return {
        phonemeAccuracyHistory: newHistory,
        currentSessionPatterns: analysis,
        persistentProblems: Object.keys(recentProblems),
        lastUpdated: new Date().toISOString(),
        sessionsAnalyzed: (prev?.sessionsAnalyzed || 0) + 1,
      };
    });
  }, [patterns]);

  /**
   * Save patterns to database
   */
  const savePatterns = useCallback(async () => {
    if (!studentId || !patterns) return;
    
    try {
      // First get existing stats
      const { data: existing } = await supabase
        .from('student_profiles')
        .select('stats')
        .eq('user_id', studentId)
        .single();
      
      const existingStats = (existing?.stats as Record<string, unknown>) || {};
      
      // Merge phoneme patterns into stats
      const newStats = {
        ...existingStats,
        phonemePatterns: patterns,
      };
      
      const { error } = await supabase
        .from('student_profiles')
        .update({
          stats: newStats as any,
        })
        .eq('user_id', studentId);
      
      if (error) {
        console.error('Error saving phoneme patterns:', error);
      }
    } catch (err) {
      console.error('Error saving phoneme patterns:', err);
    }
  }, [studentId, patterns]);

  /**
   * Get accuracy trend for a specific phoneme
   */
  const getAccuracyTrend = useCallback((phoneme: string): number[] => {
    return patterns?.phonemeAccuracyHistory[phoneme] || [];
  }, [patterns]);

  return {
    currentAnalysis,
    patterns,
    interventionReport,
    improvementMessages,
    isLoading,
    analyzeSession,
    savePatterns,
    getAccuracyTrend,
  };
};
