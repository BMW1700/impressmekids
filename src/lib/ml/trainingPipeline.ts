/**
 * Training Pipeline for Cross-Modal Transfer Network
 * Collects data from Supabase and prepares it for training
 */

import { supabase } from '@/integrations/supabase/client';
import type { ReadingFeatures, SpeakingFeatures } from './crossModalTransferNetwork';

export interface TrainingExample {
  readingFeatures: ReadingFeatures;
  speakingFeatures: SpeakingFeatures;
  studentId: string;
  timestamp: string;
}

/**
 * Collect training data from aura_records and text_highlights
 * Pairs reading assignments with speaking recordings for the same student
 */
export async function collectTrainingData(): Promise<TrainingExample[]> {
  console.log('📊 Collecting training data from database...');
  
  try {
    // Fetch all aura records (speaking data)
    const { data: auraRecords, error: auraError } = await supabase
      .from('aura_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);  // Last 1000 records
    
    if (auraError) throw auraError;
    
    // Fetch all reading submissions
    const { data: submissions, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('id, student_id, grade, time_taken_seconds, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (submissionError) throw submissionError;
    
    // Fetch highlights separately to avoid deep nesting
    const submissionIds = submissions?.map(s => s.id) || [];
    const { data: allHighlights, error: highlightsError } = await supabase
      .from('text_highlights')
      .select('*')
      .in('submission_id', submissionIds);
    
    if (highlightsError) throw highlightsError;
    
    const trainingExamples: TrainingExample[] = [];
    
    // Create a map of submission ID to highlights
    const highlightsBySubmission = new Map<string, any[]>();
    for (const highlight of allHighlights || []) {
      const submissionId = highlight.submission_id;
      if (!highlightsBySubmission.has(submissionId)) {
        highlightsBySubmission.set(submissionId, []);
      }
      highlightsBySubmission.get(submissionId)!.push(highlight);
    }
    
    // Match speaking records with reading submissions for each student
    for (const auraRecord of auraRecords || []) {
      const studentSubmissions = submissions?.filter(
        s => s.student_id === auraRecord.profile_id
      ) || [];
      
      if (studentSubmissions.length === 0) continue;
      
      // Use most recent submission for this student
      const submission = studentSubmissions[0];
      const highlights = highlightsBySubmission.get(submission.id) || [];
      
      // Extract reading features
      const readingFeatures = extractReadingFeatures(submission, highlights);
      
      // Extract speaking features
      const speakingFeatures = extractSpeakingFeatures(auraRecord);
      
      trainingExamples.push({
        readingFeatures,
        speakingFeatures,
        studentId: auraRecord.profile_id,
        timestamp: auraRecord.created_at
      });
    }
    
    console.log(`✅ Collected ${trainingExamples.length} training examples`);
    return trainingExamples;
  } catch (error) {
    console.error('Error collecting training data:', error);
    return [];
  }
}

/**
 * Extract reading features from submission and highlights
 */
function extractReadingFeatures(submission: any, highlights: any[]): ReadingFeatures {
  const comprehensionScore = submission.grade || 50;
  
  // Calculate annotation quality
  const annotationsWithText = highlights.filter(h => h.annotation && h.annotation.length > 5);
  const annotationQuality = annotationsWithText.length > 0 
    ? Math.min(100, (annotationsWithText.length / Math.max(highlights.length, 1)) * 100)
    : 0;
  
  // Calculate critical thinking score (based on annotation depth)
  const avgAnnotationLength = annotationsWithText.length > 0
    ? annotationsWithText.reduce((sum, h) => sum + (h.annotation?.length || 0), 0) / annotationsWithText.length
    : 0;
  
  const criticalThinkingScore = Math.min(100, (avgAnnotationLength / 50) * 100);  // Normalize by 50 chars
  
  // Vocabulary complexity (estimate from annotation sophistication)
  const vocabularyComplexity = Math.min(100, (avgAnnotationLength / 100) * 100);
  
  return {
    comprehensionScore,
    annotationQuality,
    criticalThinkingScore,
    highlightCount: highlights.length,
    avgAnnotationLength,
    vocabularyComplexity,
    readingTime: submission.time_taken_seconds || 300  // Default 5 minutes
  };
}

/**
 * Extract speaking features from aura record
 */
function extractSpeakingFeatures(auraRecord: any): SpeakingFeatures {
  return {
    fluency: (auraRecord.pace || 3) * 20,  // Convert 1-5 scale to 0-100
    prosody: (auraRecord.clarity || 3) * 20,
    confidence: (auraRecord.confidence || 3) * 20,
    wpm: auraRecord.wpm || 120,
    pauseCount: auraRecord.pause_count || 5,
    phonemeAccuracy: auraRecord.annotation_quality_score || 75
  };
}

/**
 * Prepare data for TensorFlow training
 * Convert features to normalized arrays
 */
export function prepareTrainingData(examples: TrainingExample[]): {
  inputs: number[][];
  outputs: number[][];
} {
  const inputs: number[][] = [];
  const outputs: number[][] = [];
  
  for (const example of examples) {
    // Normalize reading features to 0-1 range
    const normalizedReading = [
      example.readingFeatures.comprehensionScore / 100,
      example.readingFeatures.annotationQuality / 100,
      example.readingFeatures.criticalThinkingScore / 100,
      example.readingFeatures.highlightCount / 20,
      example.readingFeatures.avgAnnotationLength / 200,
      example.readingFeatures.vocabularyComplexity / 100,
      example.readingFeatures.readingTime / 600
    ];
    
    // Normalize speaking features to 0-1 range
    const normalizedSpeaking = [
      example.speakingFeatures.fluency / 100,
      example.speakingFeatures.prosody / 100,
      example.speakingFeatures.confidence / 100,
      example.speakingFeatures.wpm / 200,
      example.speakingFeatures.pauseCount / 20,
      example.speakingFeatures.phonemeAccuracy / 100
    ];
    
    inputs.push(normalizedReading);
    outputs.push(normalizedSpeaking);
  }
  
  return { inputs, outputs };
}

/**
 * Split data into training and test sets
 */
export function trainTestSplit(
  data: { inputs: number[][], outputs: number[][] },
  testSize = 0.2
): {
  train: { inputs: number[][], outputs: number[][] };
  test: { inputs: number[][], outputs: number[][] };
} {
  const splitIndex = Math.floor(data.inputs.length * (1 - testSize));
  
  // Shuffle data
  const indices = Array.from({ length: data.inputs.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const trainIndices = indices.slice(0, splitIndex);
  const testIndices = indices.slice(splitIndex);
  
  return {
    train: {
      inputs: trainIndices.map(i => data.inputs[i]),
      outputs: trainIndices.map(i => data.outputs[i])
    },
    test: {
      inputs: testIndices.map(i => data.inputs[i]),
      outputs: testIndices.map(i => data.outputs[i])
    }
  };
}

/**
 * Complete training workflow
 * Run this once to train the model on existing data
 */
export async function runTrainingWorkflow() {
  console.log('🚀 Starting Cross-Modal Transfer Network training workflow...');
  
  // Step 1: Collect data
  const examples = await collectTrainingData();
  
  if (examples.length < 50) {
    console.warn('⚠️ Not enough training data (need at least 50 examples). Using rule-based fallback.');
    return null;
  }
  
  // Step 2: Prepare data
  const data = prepareTrainingData(examples);
  const split = trainTestSplit(data);
  
  console.log(`📊 Training set: ${split.train.inputs.length} examples`);
  console.log(`📊 Test set: ${split.test.inputs.length} examples`);
  
  return split.train;
}
