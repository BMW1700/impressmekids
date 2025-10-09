/**
 * PATENTABLE: Cross-Modal Literacy Predictor
 * Bidirectional literacy prediction algorithm (reading ↔ speaking)
 */

export interface LiteracyTransferMatrix {
  readingToSpeaking: {
    predictedFluency: number; // 0-100
    predictedProsody: number; // 0-100
    predictedConfidence: number; // 0-100
    reasoning: string;
  };
  gapAnalysis: {
    likelyStrengths: string[];
    potentialWeaknesses: string[];
    targetedExercises: string[];
  };
}

/**
 * Predicts speaking performance from reading comprehension patterns
 */
export function predictSpeakingFromReading(
  comprehensionScore: number,
  annotationQuality: number,
  criticalThinkingScore: number,
  highlightCount: number,
  avgAnnotationLength: number
): LiteracyTransferMatrix {
  // Vocabulary sophistication → pronunciation prediction
  // Longer, more sophisticated annotations = likely better vocabulary = harder phonemes
  const vocabularyFactor = Math.min(100, avgAnnotationLength * 2);
  
  // Comprehension depth → speaking confidence
  // Deep understanding = confident speaking
  const confidenceFactor = comprehensionScore;
  
  // Critical thinking → prosody/expression
  // Analytical readers tend to speak with better prosody (they understand nuance)
  const prosodyFactor = criticalThinkingScore;
  
  // Annotation quality → fluency
  // Well-organized thoughts = fluent speech
  const fluencyFactor = annotationQuality;
  
  // Predict speaking metrics
  const predictedFluency = Math.round((fluencyFactor * 0.6) + (comprehensionScore * 0.4));
  const predictedProsody = Math.round((prosodyFactor * 0.7) + (vocabularyFactor * 0.3));
  const predictedConfidence = Math.round((confidenceFactor * 0.8) + (annotationQuality * 0.2));
  
  // Generate reasoning
  const reasoning = generatePredictionReasoning({
    vocabularyFactor,
    confidenceFactor,
    prosodyFactor,
    fluencyFactor,
    highlightCount,
  });
  
  // Gap analysis
  const gapAnalysis = analyzeReadingSpeakingGap({
    comprehensionScore,
    annotationQuality,
    criticalThinkingScore,
    predictedFluency,
    predictedProsody,
  });
  
  return {
    readingToSpeaking: {
      predictedFluency,
      predictedProsody,
      predictedConfidence,
      reasoning,
    },
    gapAnalysis,
  };
}

function generatePredictionReasoning(factors: {
  vocabularyFactor: number;
  confidenceFactor: number;
  prosodyFactor: number;
  fluencyFactor: number;
  highlightCount: number;
}): string {
  const { vocabularyFactor, confidenceFactor, prosodyFactor, fluencyFactor, highlightCount } = factors;
  
  const parts: string[] = [];
  
  if (vocabularyFactor > 70) {
    parts.push("Rich annotations suggest strong vocabulary, predicting good pronunciation ability.");
  } else {
    parts.push("Simple annotations may indicate need for phoneme practice.");
  }
  
  if (confidenceFactor > 70) {
    parts.push("Deep comprehension correlates with confident oral expression.");
  }
  
  if (prosodyFactor > 70) {
    parts.push("Critical thinking ability suggests expressive, prosodic speaking style.");
  }
  
  if (highlightCount < 5) {
    parts.push("Fewer highlights may indicate hesitation - this could transfer to speaking pace.");
  }
  
  return parts.join(' ');
}

function analyzeReadingSpeakingGap(data: {
  comprehensionScore: number;
  annotationQuality: number;
  criticalThinkingScore: number;
  predictedFluency: number;
  predictedProsody: number;
}): LiteracyTransferMatrix['gapAnalysis'] {
  const likelyStrengths: string[] = [];
  const potentialWeaknesses: string[] = [];
  const targetedExercises: string[] = [];
  
  // Identify strengths
  if (data.comprehensionScore > 75) {
    likelyStrengths.push("Strong reading comprehension → Clear verbal explanations");
  }
  if (data.criticalThinkingScore > 75) {
    likelyStrengths.push("Analytical thinking → Expressive, nuanced speech");
  }
  if (data.annotationQuality > 75) {
    likelyStrengths.push("Organized thoughts → Fluent, structured speech");
  }
  
  // Identify weaknesses
  if (data.comprehensionScore < 60) {
    potentialWeaknesses.push("Surface-level reading → May struggle with complex oral explanations");
    targetedExercises.push("Practice explaining passages aloud in your own words");
  }
  if (data.annotationQuality < 60) {
    potentialWeaknesses.push("Scattered highlighting → May have hesitant, disjointed speaking");
    targetedExercises.push("Record yourself summarizing the passage - listen for clarity");
  }
  if (data.criticalThinkingScore < 60) {
    potentialWeaknesses.push("Limited analysis → Flat, monotone speech patterns");
    targetedExercises.push("Read passages aloud with emotion and emphasis on key words");
  }
  
  // Universal exercise
  targetedExercises.push("Bridge reading and speaking: Highlight → Annotate → Explain aloud");
  
  return {
    likelyStrengths,
    potentialWeaknesses,
    targetedExercises,
  };
}

/**
 * Creates a visual literacy transfer matrix for display
 */
export function createTransferMatrixVisualization(matrix: LiteracyTransferMatrix) {
  return {
    readingStrength: 'High', // Would be calculated from actual data
    speakingPrediction: matrix.readingToSpeaking.predictedFluency > 70 ? 'High' : 
                       matrix.readingToSpeaking.predictedFluency > 50 ? 'Medium' : 'Low',
    correlationStrength: calculateCorrelation(matrix),
    recommendations: matrix.gapAnalysis.targetedExercises,
  };
}

function calculateCorrelation(matrix: LiteracyTransferMatrix): 'Strong' | 'Moderate' | 'Weak' {
  const avg = (
    matrix.readingToSpeaking.predictedFluency +
    matrix.readingToSpeaking.predictedProsody +
    matrix.readingToSpeaking.predictedConfidence
  ) / 3;
  
  if (avg > 70) return 'Strong';
  if (avg > 50) return 'Moderate';
  return 'Weak';
}
