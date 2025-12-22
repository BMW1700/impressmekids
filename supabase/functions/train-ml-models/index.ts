import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { trainMLSchema, validateInput } from '../_shared/validation.ts';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simplified neural network for Cross-Modal Transfer (runs in Deno)
class SimpleCrossModalNetwork {
  private weights: number[][];
  private biases: number[];
  private learningRate = 0.01;

  constructor(inputSize = 6, hiddenSize = 8, outputSize = 6) {
    // Initialize weights with Xavier initialization
    this.weights = [];
    // Input to hidden
    for (let i = 0; i < inputSize; i++) {
      this.weights.push(Array(hiddenSize).fill(0).map(() => (Math.random() - 0.5) * Math.sqrt(2 / inputSize)));
    }
    // Hidden to output
    for (let i = 0; i < hiddenSize; i++) {
      this.weights.push(Array(outputSize).fill(0).map(() => (Math.random() - 0.5) * Math.sqrt(2 / hiddenSize)));
    }
    this.biases = Array(hiddenSize + outputSize).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  forward(input: number[]): number[] {
    // Forward pass through network
    const hidden: number[] = [];
    for (let j = 0; j < 8; j++) {
      let sum = this.biases[j];
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * this.weights[i][j];
      }
      hidden.push(this.relu(sum));
    }

    const output: number[] = [];
    for (let k = 0; k < 6; k++) {
      let sum = this.biases[8 + k];
      for (let j = 0; j < hidden.length; j++) {
        sum += hidden[j] * this.weights[6 + j][k];
      }
      output.push(this.sigmoid(sum) * 100); // Scale to 0-100
    }

    return output;
  }

  train(inputs: number[][], targets: number[][], epochs = 100): { loss: number; accuracy: number } {
    let totalLoss = 0;
    let correctPredictions = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      totalLoss = 0;

      for (let sample = 0; sample < inputs.length; sample++) {
        const input = inputs[sample];
        const target = targets[sample];
        
        // Forward pass
        const hidden: number[] = [];
        for (let j = 0; j < 8; j++) {
          let sum = this.biases[j];
          for (let i = 0; i < input.length; i++) {
            sum += input[i] * this.weights[i][j];
          }
          hidden.push(this.relu(sum));
        }

        const output: number[] = [];
        for (let k = 0; k < 6; k++) {
          let sum = this.biases[8 + k];
          for (let j = 0; j < hidden.length; j++) {
            sum += hidden[j] * this.weights[6 + j][k];
          }
          output.push(this.sigmoid(sum) * 100);
        }

        // Calculate loss (MSE)
        let sampleLoss = 0;
        for (let k = 0; k < output.length; k++) {
          sampleLoss += Math.pow(target[k] - output[k], 2);
        }
        totalLoss += sampleLoss / output.length;

        // Backward pass with gradient descent
        const outputGradients: number[] = [];
        for (let k = 0; k < output.length; k++) {
          const error = target[k] - output[k];
          const sigmoidDerivative = (output[k] / 100) * (1 - output[k] / 100);
          outputGradients.push(error * sigmoidDerivative * 100);
        }

        // Update hidden-to-output weights
        for (let j = 0; j < hidden.length; j++) {
          for (let k = 0; k < outputGradients.length; k++) {
            this.weights[6 + j][k] += this.learningRate * outputGradients[k] * hidden[j];
          }
        }

        // Update biases
        for (let k = 0; k < outputGradients.length; k++) {
          this.biases[8 + k] += this.learningRate * outputGradients[k];
        }
      }
    }

    // Calculate accuracy (within 10% is correct)
    for (let sample = 0; sample < inputs.length; sample++) {
      const output = this.forward(inputs[sample]);
      const target = targets[sample];
      let allCorrect = true;
      for (let k = 0; k < output.length; k++) {
        if (Math.abs(output[k] - target[k]) > 10) {
          allCorrect = false;
          break;
        }
      }
      if (allCorrect) correctPredictions++;
    }

    return {
      loss: totalLoss / inputs.length,
      accuracy: correctPredictions / inputs.length
    };
  }

  exportWeights(): { weights: number[][]; biases: number[] } {
    return { weights: this.weights, biases: this.biases };
  }

  importWeights(data: { weights: number[][]; biases: number[] }) {
    this.weights = data.weights;
    this.biases = data.biases;
  }
}

// Q-Learning with persistence
class PersistentQAgent {
  private qTable: Record<string, Record<string, number>> = {};
  private learningRate = 0.1;
  private discountFactor = 0.95;
  private explorationRate = 0.1;

  constructor(existingQTable?: Record<string, Record<string, number>>) {
    if (existingQTable) {
      this.qTable = existingQTable;
    }
  }

  private serializeState(state: { mastered: string[]; struggling: string[]; level: number }): string {
    return `${state.mastered.sort().join(',')}_${state.struggling.sort().join(',')}_${state.level}`;
  }

  getQValue(state: string, action: string): number {
    if (!this.qTable[state]) {
      this.qTable[state] = {};
    }
    return this.qTable[state][action] ?? 0.5; // Default Q-value
  }

  updateQValue(
    state: { mastered: string[]; struggling: string[]; level: number },
    action: string,
    reward: number,
    nextState: { mastered: string[]; struggling: string[]; level: number }
  ): void {
    const stateKey = this.serializeState(state);
    const nextStateKey = this.serializeState(nextState);

    if (!this.qTable[stateKey]) {
      this.qTable[stateKey] = {};
    }

    const currentQ = this.getQValue(stateKey, action);
    
    // Find max Q-value for next state
    let maxNextQ = 0;
    if (this.qTable[nextStateKey]) {
      const nextQValues = Object.values(this.qTable[nextStateKey]);
      maxNextQ = nextQValues.length > 0 ? Math.max(...nextQValues) : 0;
    }

    // Q-learning update rule
    const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
    this.qTable[stateKey][action] = newQ;
  }

  selectBestAction(state: { mastered: string[]; struggling: string[]; level: number }, candidates: string[]): string | null {
    const stateKey = this.serializeState(state);
    
    // Exploration vs exploitation
    if (Math.random() < this.explorationRate) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    let bestAction = candidates[0];
    let bestQ = -Infinity;

    for (const action of candidates) {
      const q = this.getQValue(stateKey, action);
      if (q > bestQ) {
        bestQ = q;
        bestAction = action;
      }
    }

    return bestAction;
  }

  trainBatch(updates: Array<{
    state: { mastered: string[]; struggling: string[]; level: number };
    action: string;
    reward: number;
    nextState: { mastered: string[]; struggling: string[]; level: number };
  }>): number {
    for (const update of updates) {
      this.updateQValue(update.state, update.action, update.reward, update.nextState);
    }
    return updates.length;
  }

  exportQTable(): Record<string, Record<string, number>> {
    return this.qTable;
  }

  getStats(): { totalStates: number; totalActions: number } {
    const states = Object.keys(this.qTable).length;
    let actions = 0;
    for (const state of Object.values(this.qTable)) {
      actions += Object.keys(state).length;
    }
    return { totalStates: states, totalActions: actions };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('[ML Training] Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
      });
      throw new Error('Missing Supabase configuration');
    }

    // Use ANON key + explicit bearer token to validate the caller
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('[ML Training] Unauthorized:', {
        authError: authError?.message,
        hasUser: !!user,
        authHeaderPrefix: authHeader.slice(0, 16),
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message ?? null }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user has admin or teacher role
    const { data: roles, error: roleError } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'teacher'])
      .maybeSingle();

    if (roleError) {
      console.error('[ML Training] Role check failed:', roleError);
      return new Response(JSON.stringify({ error: 'Role check failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!roles) {
      return new Response(JSON.stringify({ error: 'Access denied - admin or teacher required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client for DB writes/reads during training
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);


    const requestData = await req.json();
    const validation = validateInput(trainMLSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[ML Training] Starting real ML model training pipeline...');

    // Create training job record
    const { data: trainingJob, error: jobError } = await supabaseAdmin
      .from('ml_training_jobs')
      .insert({
        job_type: 'full',
        status: 'running',
        triggered_by: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('[ML Training] Failed to create job:', jobError);
      throw jobError;
    }

    try {
      // Collect training data
      const { data: auraRecords, error: auraError } = await supabaseAdmin
        .from('aura_records')
        .select('*')
        .limit(1000);

      if (auraError) throw auraError;

      const { data: submissions, error: submissionError } = await supabaseAdmin
        .from('assignment_submissions')
        .select(`*, text_highlights:text_highlights(*)`)
        .eq('status', 'graded')
        .limit(1000);

      if (submissionError) throw submissionError;

      console.log(`[ML Training] Collected ${auraRecords?.length || 0} AURA records and ${submissions?.length || 0} submissions`);

      // ===== CROSS-MODAL NETWORK TRAINING =====
      const trainingInputs: number[][] = [];
      const trainingTargets: number[][] = [];

      for (const aura of auraRecords || []) {
        const matchingSubmission = submissions?.find(s => 
          s.student_id === aura.profile_id && 
          Math.abs(new Date(s.created_at).getTime() - new Date(aura.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
        );

        if (matchingSubmission) {
          const highlights = matchingSubmission.text_highlights || [];
          
          // Reading features (input)
          trainingInputs.push([
            (matchingSubmission.grade || 50) / 100,
            (aura.annotation_quality_score || 50) / 100,
            Math.min(highlights.filter((h: any) => h.annotation).length * 10, 100) / 100,
            Math.min(aura.highlight_count || highlights.length, 20) / 20,
            Math.min(highlights.reduce((sum: number, h: any) => sum + (h.annotation?.length || 0), 0) / Math.max(highlights.length, 1), 200) / 200,
            (aura.comprehension_score || 50) / 100,
          ]);

          // Speaking features (target)
          trainingTargets.push([
            (aura.grade || 70) / 100 * 100,
            (aura.pace || 70) / 100 * 100,
            (aura.confidence || 70) / 100 * 100,
            Math.min(aura.wpm || 100, 200) / 2,
            Math.max(0, 100 - (aura.pause_count || 5) * 5),
            (aura.clarity || 70) / 100 * 100,
          ]);
        }
      }

      console.log(`[ML Training] Prepared ${trainingInputs.length} cross-modal training examples`);

      let crossModalResult = { loss: 0, accuracy: 0, trained: false, message: '' };
      let crossModalWeights = null;

      if (trainingInputs.length >= 10) {
        // Load existing weights if available
        const { data: existingWeights } = await supabaseAdmin
          .from('ml_model_weights')
          .select('*')
          .eq('model_type', 'cross_modal_network')
          .eq('is_active', true)
          .single();

        const network = new SimpleCrossModalNetwork();
        if (existingWeights?.weights) {
          try {
            network.importWeights(existingWeights.weights as { weights: number[][]; biases: number[] });
            console.log('[ML Training] Loaded existing cross-modal weights');
          } catch (e) {
            console.log('[ML Training] Starting fresh cross-modal network');
          }
        }

        // Train the network
        const result = network.train(trainingInputs, trainingTargets, 200);
        crossModalWeights = network.exportWeights();
        
        crossModalResult = {
          loss: result.loss,
          accuracy: result.accuracy,
          trained: true,
          message: `Trained on ${trainingInputs.length} examples with ${Math.round(result.accuracy * 100)}% accuracy`
        };

        // Deactivate old weights
        await supabaseAdmin
          .from('ml_model_weights')
          .update({ is_active: false })
          .eq('model_type', 'cross_modal_network')
          .eq('is_active', true);

        // Save new weights
        const newVersion = (existingWeights?.model_version || 0) + 1;
        await supabaseAdmin
          .from('ml_model_weights')
          .insert({
            model_type: 'cross_modal_network',
            model_version: newVersion,
            weights: crossModalWeights,
            metadata: {
              loss: result.loss,
              accuracy: result.accuracy,
              trainingExamples: trainingInputs.length,
              trainedAt: new Date().toISOString(),
            },
            is_active: true,
            training_examples_count: trainingInputs.length,
          });

        console.log(`[ML Training] Saved cross-modal network v${newVersion}`);
      } else {
        crossModalResult.message = `Need at least 10 examples (have ${trainingInputs.length})`;
      }

      // ===== Q-LEARNING TRAINING =====
      const qLearningUpdates: Array<{
        state: { mastered: string[]; struggling: string[]; level: number };
        action: string;
        reward: number;
        nextState: { mastered: string[]; struggling: string[]; level: number };
      }> = [];

      // Process AURA records for Q-learning updates
      const studentPhonemeHistory: Record<string, Array<{ phoneme: string; score: number; timestamp: string }>> = {};
      
      for (const aura of auraRecords || []) {
        if (!studentPhonemeHistory[aura.profile_id]) {
          studentPhonemeHistory[aura.profile_id] = [];
        }

        if (aura.feedback && Array.isArray(aura.feedback)) {
          for (const fb of aura.feedback as Array<{ phoneme?: string; score?: number }>) {
            if (fb.phoneme && typeof fb.score === 'number') {
              studentPhonemeHistory[aura.profile_id].push({
                phoneme: fb.phoneme,
                score: fb.score,
                timestamp: aura.created_at,
              });
            }
          }
        }
      }

      // Generate Q-learning transitions from phoneme history
      for (const [studentId, history] of Object.entries(studentPhonemeHistory)) {
        const sortedHistory = history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        for (let i = 0; i < sortedHistory.length - 1; i++) {
          const currentMastered = sortedHistory.slice(0, i + 1).filter(h => h.score > 80).map(h => h.phoneme);
          const currentStruggling = sortedHistory.slice(0, i + 1).filter(h => h.score < 60).map(h => h.phoneme);
          
          const nextMastered = sortedHistory.slice(0, i + 2).filter(h => h.score > 80).map(h => h.phoneme);
          const nextStruggling = sortedHistory.slice(0, i + 2).filter(h => h.score < 60).map(h => h.phoneme);

          const reward = sortedHistory[i].score > 80 ? 1.0 : 
                        sortedHistory[i].score > 60 ? 0.5 : 
                        sortedHistory[i].score > 40 ? 0 : -0.5;

          qLearningUpdates.push({
            state: { mastered: [...new Set(currentMastered)], struggling: [...new Set(currentStruggling)], level: 1 },
            action: sortedHistory[i].phoneme,
            reward,
            nextState: { mastered: [...new Set(nextMastered)], struggling: [...new Set(nextStruggling)], level: 1 },
          });
        }
      }

      console.log(`[ML Training] Prepared ${qLearningUpdates.length} Q-learning transitions`);

      let qLearningResult = { updates: 0, states: 0, trained: false, message: '' };

      if (qLearningUpdates.length >= 5) {
        // Load existing Q-table
        const { data: existingQTable } = await supabaseAdmin
          .from('ml_model_weights')
          .select('*')
          .eq('model_type', 'q_learning_table')
          .eq('is_active', true)
          .single();

        const qAgent = new PersistentQAgent(existingQTable?.weights as Record<string, Record<string, number>> || {});
        
        // Train with batch updates
        qAgent.trainBatch(qLearningUpdates);
        const stats = qAgent.getStats();
        
        qLearningResult = {
          updates: qLearningUpdates.length,
          states: stats.totalStates,
          trained: true,
          message: `Learned ${stats.totalStates} states, ${stats.totalActions} state-action pairs`
        };

        // Deactivate old Q-table
        await supabaseAdmin
          .from('ml_model_weights')
          .update({ is_active: false })
          .eq('model_type', 'q_learning_table')
          .eq('is_active', true);

        // Save new Q-table
        const newVersion = (existingQTable?.model_version || 0) + 1;
        await supabaseAdmin
          .from('ml_model_weights')
          .insert({
            model_type: 'q_learning_table',
            model_version: newVersion,
            weights: qAgent.exportQTable(),
            metadata: {
              totalStates: stats.totalStates,
              totalActions: stats.totalActions,
              updates: qLearningUpdates.length,
              trainedAt: new Date().toISOString(),
            },
            is_active: true,
            training_examples_count: qLearningUpdates.length,
          });

        console.log(`[ML Training] Saved Q-learning table v${newVersion}`);
      } else {
        qLearningResult.message = `Need at least 5 transitions (have ${qLearningUpdates.length})`;
      }

      // Update training job as completed
      await supabaseAdmin
        .from('ml_training_jobs')
        .update({
          status: 'completed',
          training_data_count: trainingInputs.length + qLearningUpdates.length,
          completed_at: new Date().toISOString(),
        })
        .eq('id', trainingJob.id);

      const trainingResults = {
        timestamp: new Date().toISOString(),
        status: 'completed',
        crossModalNetwork: crossModalResult,
        qLearningAgent: qLearningResult,
        dataCollected: {
          auraRecords: auraRecords?.length || 0,
          submissions: submissions?.length || 0,
        },
      };

      console.log('[ML Training] Pipeline completed:', trainingResults);

      return new Response(JSON.stringify({
        success: true,
        results: trainingResults,
        message: `Real ML training completed. Cross-Modal: ${crossModalResult.message}. Q-Learning: ${qLearningResult.message}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (trainingError) {
      // Update job as failed
      await supabaseAdmin
        .from('ml_training_jobs')
        .update({
          status: 'failed',
          error_message: trainingError instanceof Error ? trainingError.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', trainingJob.id);

      throw trainingError;
    }

  } catch (error) {
    console.error('[ML Training] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'ML training failed. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
