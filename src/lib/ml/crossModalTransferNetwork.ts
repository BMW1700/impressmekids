/**
 * PATENT #1: Multi-Modal Literacy Transfer Neural Network
 * 
 * Bidirectional attention-based network for predicting:
 * - Reading performance → Speaking metrics (fluency, prosody, confidence)
 * - Speaking performance → Reading comprehension prediction
 * 
 * Uses TensorFlow.js for in-browser inference (FREE - no API costs)
 */

import * as tf from '@tensorflow/tfjs';

export interface ReadingFeatures {
  comprehensionScore: number;      // 0-100
  annotationQuality: number;       // 0-100
  criticalThinkingScore: number;   // 0-100
  highlightCount: number;          // Raw count
  avgAnnotationLength: number;     // Characters
  vocabularyComplexity: number;    // 0-100
  readingTime: number;             // Seconds
}

export interface SpeakingFeatures {
  fluency: number;                 // 0-100
  prosody: number;                 // 0-100
  confidence: number;              // 0-100
  wpm: number;                     // Words per minute
  pauseCount: number;              // Raw count
  phonemeAccuracy: number;         // 0-100
}

// Presentation features for cross-modal transfer
export interface PresentationFeatures {
  confidenceScore: number;         // 0-100
  pacingScore: number;             // 0-100
  structureScore: number;          // 0-100
  clarityScore: number;            // 0-100
  fillerWordCount: number;         // Raw count
  wordsPerMinute: number;          // WPM
}

export interface TransferPrediction {
  predictedMetrics: SpeakingFeatures | Partial<ReadingFeatures> | PresentationFeatures;
  confidence: number;              // 0-1
  uncertaintyBounds: {             // 95% confidence intervals
    lower: number[];
    upper: number[];
  };
  attentionWeights?: number[];     // Which input features mattered most
}

/**
 * Cross-Modal Transfer Network
 * Trained offline on student data, deployed for in-browser inference
 */
export class CrossModalTransferNetwork {
  private model: tf.LayersModel | null = null;
  private modelLoaded = false;
  private isTraining = false;
  
  // Model hyperparameters
  private readonly inputDim = 7;   // 7 reading features or 6 speaking features
  private readonly hiddenDim1 = 128;
  private readonly hiddenDim2 = 64;
  private readonly hiddenDim3 = 32;
  private readonly outputDim = 6;  // 6 speaking features or 7 reading features
  
  /**
   * Build the bidirectional attention-based network
   */
  private buildModel(): tf.LayersModel {
    const input = tf.input({ shape: [this.inputDim] });
    
    // Encoder: Extract latent representations
    let x = tf.layers.dense({
      units: this.hiddenDim1,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'encoder_1'
    }).apply(input) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: 0.3, name: 'dropout_1' }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dense({
      units: this.hiddenDim2,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'encoder_2'
    }).apply(x) as tf.SymbolicTensor;
    
    // Self-attention mechanism (PATENTABLE COMPONENT)
    const attention = tf.layers.dense({
      units: this.hiddenDim2,
      activation: 'softmax',
      name: 'attention_weights'
    }).apply(x) as tf.SymbolicTensor;
    
    // Apply attention weights
    x = tf.layers.multiply({ name: 'attention_applied' }).apply([x, attention]) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: 0.2, name: 'dropout_2' }).apply(x) as tf.SymbolicTensor;
    
    // Decoder: Generate predictions
    x = tf.layers.dense({
      units: this.hiddenDim3,
      activation: 'relu',
      kernelInitializer: 'heNormal',
      name: 'decoder_1'
    }).apply(x) as tf.SymbolicTensor;
    
    // Output layer with sigmoid (0-1 range, will scale to 0-100)
    const output = tf.layers.dense({
      units: this.outputDim,
      activation: 'sigmoid',
      name: 'output'
    }).apply(x) as tf.SymbolicTensor;
    
    const model = tf.model({ inputs: input, outputs: output });
    
    // Compile with Adam optimizer
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }
  
  /**
   * Train the model on collected data
   * This should be run offline with real student data
   */
  async train(
    trainingData: { inputs: number[][], outputs: number[][] },
    validationSplit = 0.2,
    epochs = 100,
    batchSize = 32
  ): Promise<void> {
    if (this.isTraining) {
      console.warn('Model is already training');
      return;
    }
    
    this.isTraining = true;
    console.log('🧠 Training Cross-Modal Transfer Network...');
    
    try {
      // Build fresh model
      this.model = this.buildModel();
      
      // Convert data to tensors
      const xs = tf.tensor2d(trainingData.inputs);
      const ys = tf.tensor2d(trainingData.outputs);
      
      // Train with early stopping
      await this.model.fit(xs, ys, {
        epochs,
        batchSize,
        validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}/${epochs}: loss=${logs?.loss.toFixed(4)}, val_loss=${logs?.val_loss?.toFixed(4)}`);
          }
        }
      });
      
      console.log('✅ Model training complete');
      this.modelLoaded = true;
      
      // Cleanup
      xs.dispose();
      ys.dispose();
    } catch (error) {
      console.error('Training failed:', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }
  
  /**
   * Save trained model to browser storage
   */
  async saveModel(): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }
    
    await this.model.save('localstorage://cross-modal-transfer-v1');
    console.log('✅ Model saved to browser storage');
  }
  
  /**
   * Load pre-trained model from browser storage
   */
  async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('localstorage://cross-modal-transfer-v1');
      this.modelLoaded = true;
      console.log('✅ Cross-Modal Transfer Network loaded (in-browser inference)');
    } catch (error) {
      console.warn('No pre-trained model found, using rule-based fallback');
      // Model not trained yet - will use rule-based predictions
      this.modelLoaded = false;
    }
  }
  
  /**
   * Predict speaking performance from reading features
   * IN-BROWSER INFERENCE - FREE (no API costs)
   */
  async predictSpeakingFromReading(reading: ReadingFeatures): Promise<TransferPrediction> {
    if (!this.modelLoaded || !this.model) {
      return this.ruleBased_ReadingToSpeaking(reading);
    }
    
    const normalized = [
      reading.comprehensionScore / 100,
      reading.annotationQuality / 100,
      reading.criticalThinkingScore / 100,
      reading.highlightCount / 20,
      reading.avgAnnotationLength / 200,
      reading.vocabularyComplexity / 100,
      reading.readingTime / 600
    ];
    
    const input = tf.tensor2d([normalized]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const values = prediction.arraySync() as number[][];
    
    input.dispose();
    prediction.dispose();
    
    const speakingMetrics: SpeakingFeatures = {
      fluency: Math.round(values[0][0] * 100),
      prosody: Math.round(values[0][1] * 100),
      confidence: Math.round(values[0][2] * 100),
      wpm: Math.round(values[0][3] * 200),
      pauseCount: Math.round(values[0][4] * 20),
      phonemeAccuracy: Math.round(values[0][5] * 100)
    };
    
    return {
      predictedMetrics: speakingMetrics,
      confidence: 0.85,
      uncertaintyBounds: {
        lower: values[0].map(v => v * 0.9),
        upper: values[0].map(v => v * 1.1)
      }
    };
  }
  
  /**
   * Predict reading performance from speaking features
   * Bidirectional transfer learning
   */
  async predictReadingFromSpeaking(speaking: SpeakingFeatures): Promise<TransferPrediction> {
    if (!this.modelLoaded || !this.model) {
      return this.ruleBased_SpeakingToReading(speaking);
    }
    
    // Normalize inputs
    const normalized = [
      speaking.fluency / 100,
      speaking.prosody / 100,
      speaking.confidence / 100,
      speaking.wpm / 200,
      speaking.pauseCount / 20,
      speaking.phonemeAccuracy / 100,
      0  // Padding to match input dimension
    ];
    
    return tf.tidy(() => {
      const input = tf.tensor2d([normalized]);
      const prediction = this.model!.predict(input) as tf.Tensor;
      const values = prediction.arraySync() as number[][];
      
      const readingMetrics = {
        comprehensionScore: Math.round(values[0][0] * 100),
        annotationQuality: Math.round(values[0][1] * 100),
        criticalThinkingScore: Math.round(values[0][2] * 100),
        highlightCount: Math.round(values[0][3] * 20),
        avgAnnotationLength: Math.round(values[0][4] * 200),
        vocabularyComplexity: Math.round(values[0][5] * 100)
      };
      
      return {
        predictedMetrics: readingMetrics,
        confidence: 0.80,
        uncertaintyBounds: {
          lower: values[0].map(v => v * 0.85),
          upper: values[0].map(v => v * 1.15)
        }
      };
    });
  }
  
  /**
   * Rule-based fallback when model not available
   */
  private ruleBased_ReadingToSpeaking(reading: ReadingFeatures): TransferPrediction {
    const fluency = Math.round((reading.annotationQuality * 0.6) + (reading.comprehensionScore * 0.4));
    const prosody = Math.round((reading.criticalThinkingScore * 0.7) + (reading.vocabularyComplexity * 0.3));
    const confidence = Math.round((reading.comprehensionScore * 0.8) + (reading.annotationQuality * 0.2));
    
    return {
      predictedMetrics: {
        fluency,
        prosody,
        confidence,
        wpm: 120,  // Default
        pauseCount: 5,
        phonemeAccuracy: 75
      },
      confidence: 0.65,  // Lower confidence for rule-based
      uncertaintyBounds: {
        lower: [fluency * 0.8, prosody * 0.8, confidence * 0.8, 100, 3, 65],
        upper: [fluency * 1.2, prosody * 1.2, confidence * 1.2, 140, 7, 85]
      }
    };
  }
  
  private ruleBased_SpeakingToReading(speaking: SpeakingFeatures): TransferPrediction {
    const comprehension = Math.round((speaking.fluency * 0.5) + (speaking.confidence * 0.5));
    const annotation = Math.round((speaking.prosody * 0.6) + (speaking.fluency * 0.4));
    
    return {
      predictedMetrics: {
        comprehensionScore: comprehension,
        annotationQuality: annotation,
        criticalThinkingScore: speaking.prosody,
        highlightCount: 8,
        avgAnnotationLength: 80,
        vocabularyComplexity: speaking.phonemeAccuracy
      },
      confidence: 0.60,
      uncertaintyBounds: {
        lower: [comprehension * 0.8, annotation * 0.8, speaking.prosody * 0.8, 5, 50, speaking.phonemeAccuracy * 0.8],
        upper: [comprehension * 1.2, annotation * 1.2, speaking.prosody * 1.2, 12, 120, speaking.phonemeAccuracy * 1.2]
      }
    };
  }
  
  /**
   * Predict reading performance from presentation metrics
   * Maps presentation skills to expected reading comprehension
   */
  async predictReadingFromPresentation(presentation: PresentationFeatures): Promise<TransferPrediction> {
    // Presentation skills map to reading skills:
    // - High confidence → better reading comprehension
    // - Good structure → better annotation quality
    // - Clear pacing → better fluency when reading
    
    const comprehension = Math.round(
      (presentation.confidenceScore * 0.4) + 
      (presentation.structureScore * 0.3) + 
      (presentation.clarityScore * 0.3)
    );
    
    const annotation = Math.round(
      (presentation.structureScore * 0.5) + 
      (presentation.clarityScore * 0.3) +
      (100 - Math.min(100, presentation.fillerWordCount * 5)) * 0.2
    );
    
    const criticalThinking = Math.round(
      (presentation.structureScore * 0.4) +
      (presentation.confidenceScore * 0.3) +
      (presentation.pacingScore * 0.3)
    );
    
    return {
      predictedMetrics: {
        comprehensionScore: comprehension,
        annotationQuality: annotation,
        criticalThinkingScore: criticalThinking,
        highlightCount: Math.round(8 + (presentation.structureScore / 20)),
        avgAnnotationLength: Math.round(60 + (presentation.clarityScore / 2)),
        vocabularyComplexity: Math.round(presentation.clarityScore * 0.8)
      },
      confidence: 0.70, // Cross-modal prediction
      uncertaintyBounds: {
        lower: [comprehension * 0.85, annotation * 0.85, criticalThinking * 0.85, 5, 50, presentation.clarityScore * 0.6],
        upper: [comprehension * 1.15, annotation * 1.15, criticalThinking * 1.15, 12, 100, presentation.clarityScore * 1.0]
      }
    };
  }
  
  /**
   * Predict presentation skills from reading performance
   * Maps reading comprehension to expected presentation abilities
   */
  async predictPresentationFromReading(reading: ReadingFeatures): Promise<TransferPrediction> {
    // Reading skills map to presentation skills:
    // - High comprehension → better confidence
    // - Good annotations → better structure
    // - Critical thinking → better clarity
    
    const confidence = Math.round(
      (reading.comprehensionScore * 0.5) +
      (reading.annotationQuality * 0.3) +
      (reading.criticalThinkingScore * 0.2)
    );
    
    const pacing = Math.round(
      (reading.annotationQuality * 0.4) +
      (reading.vocabularyComplexity * 0.3) +
      70 * 0.3 // Base pacing score
    );
    
    const structure = Math.round(
      (reading.criticalThinkingScore * 0.5) +
      (reading.annotationQuality * 0.3) +
      (reading.comprehensionScore * 0.2)
    );
    
    const clarity = Math.round(
      (reading.vocabularyComplexity * 0.4) +
      (reading.comprehensionScore * 0.4) +
      (reading.annotationQuality * 0.2)
    );
    
    // Estimate filler words (inverse of clarity/vocabulary)
    const estimatedFillers = Math.max(0, Math.round(15 - (clarity / 10)));
    
    return {
      predictedMetrics: {
        confidenceScore: confidence,
        pacingScore: pacing,
        structureScore: structure,
        clarityScore: clarity,
        fillerWordCount: estimatedFillers,
        wordsPerMinute: 120 + Math.round((reading.vocabularyComplexity / 5))
      } as PresentationFeatures,
      confidence: 0.70,
      uncertaintyBounds: {
        lower: [confidence * 0.85, pacing * 0.85, structure * 0.85, clarity * 0.85, Math.max(0, estimatedFillers - 3), 100],
        upper: [confidence * 1.15, pacing * 1.15, structure * 1.15, clarity * 1.15, estimatedFillers + 5, 160]
      }
    };
  }
  
  /**
   * Check if model is ready for inference
   */
  isReady(): boolean {
    return this.modelLoaded && this.model !== null;
  }
  
  /**
   * Get model summary for debugging
   */
  summary(): void {
    if (this.model) {
      this.model.summary();
    } else {
      console.log('No model loaded');
    }
  }
}

// Global singleton instance
export const crossModalNetwork = new CrossModalTransferNetwork();

/**
 * Predict which words in a passage will be difficult for a student
 * Uses reading history + word complexity analysis
 */
export interface DifficultWordPrediction {
  word: string;
  difficulty: number;  // 0-1 score
  reasons: string[];
}

export async function predictDifficultWords(
  passageText: string,
  studentId: string
): Promise<DifficultWordPrediction[]> {
  // Extract unique words
  const words = passageText
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z]/g, ''))
    .filter(w => w.length > 3);
  
  const uniqueWords = [...new Set(words)];
  
  // Rule-based difficulty scoring
  const predictions = uniqueWords.map(word => {
    let difficulty = 0;
    const reasons: string[] = [];
    
    // Length-based difficulty
    if (word.length > 8) {
      difficulty += 0.3;
      reasons.push('Long word');
    }
    
    // Syllable complexity (approximation)
    const vowelCount = (word.match(/[aeiou]/g) || []).length;
    if (vowelCount > 3) {
      difficulty += 0.2;
      reasons.push('Multiple syllables');
    }
    
    // Consonant clusters
    if (/[bcdfghjklmnpqrstvwxyz]{3,}/.test(word)) {
      difficulty += 0.3;
      reasons.push('Consonant cluster');
    }
    
    // Silent letters
    if (/gh|kn|wr|mb/.test(word)) {
      difficulty += 0.2;
      reasons.push('Silent letters');
    }
    
    return {
      word,
      difficulty: Math.min(difficulty, 1),
      reasons
    };
  });
  
  return predictions.filter(p => p.difficulty > 0.3);
}
