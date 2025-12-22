import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { updateQLearningSchema, validateInput } from '../_shared/validation.ts';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Q-Learning update with real persistence
class StudentQAgent {
  private qTable: Record<string, Record<string, number>>;
  private learningRate = 0.1;
  private discountFactor = 0.95;

  constructor(existingQTable: Record<string, Record<string, number>> = {}) {
    this.qTable = existingQTable;
  }

  private serializeState(mastered: string[], struggling: string[], level: number): string {
    return `${mastered.sort().slice(0, 5).join(',')}_${struggling.sort().slice(0, 5).join(',')}_${level}`;
  }

  getQValue(stateKey: string, action: string): number {
    if (!this.qTable[stateKey]) {
      this.qTable[stateKey] = {};
    }
    return this.qTable[stateKey][action] ?? 0.5;
  }

  update(
    mastered: string[],
    struggling: string[],
    level: number,
    action: string,
    reward: number,
    nextMastered: string[],
    nextStruggling: string[],
    nextLevel: number
  ): { qBefore: number; qAfter: number } {
    const stateKey = this.serializeState(mastered, struggling, level);
    const nextStateKey = this.serializeState(nextMastered, nextStruggling, nextLevel);

    if (!this.qTable[stateKey]) {
      this.qTable[stateKey] = {};
    }

    const qBefore = this.getQValue(stateKey, action);

    // Find max Q-value for next state
    let maxNextQ = 0;
    if (this.qTable[nextStateKey]) {
      const nextQValues = Object.values(this.qTable[nextStateKey]);
      maxNextQ = nextQValues.length > 0 ? Math.max(...nextQValues) : 0;
    }

    // Q-learning update rule: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    const qAfter = qBefore + this.learningRate * (reward + this.discountFactor * maxNextQ - qBefore);
    this.qTable[stateKey][action] = qAfter;

    return { qBefore, qAfter };
  }

  selectBestPhoneme(mastered: string[], struggling: string[], level: number, candidates: string[]): {
    phoneme: string;
    expectedReward: number;
    reasoning: string;
  } {
    const stateKey = this.serializeState(mastered, struggling, level);
    
    let bestPhoneme = candidates[0] || 's';
    let bestQ = -Infinity;

    for (const phoneme of candidates) {
      const q = this.getQValue(stateKey, phoneme);
      if (q > bestQ) {
        bestQ = q;
        bestPhoneme = phoneme;
      }
    }

    const reasoning = bestQ > 0.7 ? 'High success probability based on learned patterns' :
                      bestQ > 0.5 ? 'Moderate success expected from training data' :
                      'Exploratory recommendation to gather learning data';

    return {
      phoneme: bestPhoneme,
      expectedReward: bestQ,
      reasoning,
    };
  }

  exportQTable(): Record<string, Record<string, number>> {
    return this.qTable;
  }

  getStats(): { states: number; actions: number } {
    let actions = 0;
    for (const state of Object.values(this.qTable)) {
      actions += Object.keys(state).length;
    }
    return {
      states: Object.keys(this.qTable).length,
      actions,
    };
  }
}

// Type guards to distinguish between the two input formats
interface ExerciseInput {
  exerciseId: string;
  studentId: string;
  performance: {
    success_rate: number;
    completed_phonemes: string[];
  };
}

interface ReadingSessionInput {
  studentId: string;
  experiences: Array<{
    phoneme: string;
    accuracy: number;
    attempts: number;
  }>;
  currentState: {
    masteredPhonemes: string[];
    strugglingPhonemes: string[];
    level: number;
  };
  exerciseType?: string;
}

function isExerciseInput(data: unknown): data is ExerciseInput {
  return typeof data === 'object' && data !== null && 'exerciseId' in data && 'performance' in data;
}

function isReadingSessionInput(data: unknown): data is ReadingSessionInput {
  return typeof data === 'object' && data !== null && 'experiences' in data && 'currentState' in data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SECURITY: Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Rate limiting
    const rateLimitResult = await checkRateLimit(user.id, 'update-q-learning', RATE_LIMITS.ML_TRAINING);
    if (!rateLimitResult.allowed) {
      console.warn('[Q-Learning] Rate limit exceeded:', user.id);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Q-learning updates limited to 10 requests per minute.',
        resetAt: rateLimitResult.resetAt,
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          ...getRateLimitHeaders(rateLimitResult, RATE_LIMITS.ML_TRAINING),
          'Content-Type': 'application/json',
        },
      });
    }

    const requestData = await req.json();
    console.log('[Q-Learning] Received request:', JSON.stringify(requestData).substring(0, 500));

    // Validate input with Zod
    const validation = validateInput(updateQLearningSchema, requestData);
    if (!validation.success) {
      console.error('[Q-Learning] Validation failed:', validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validatedData = validation.data;

    // Determine which format was sent and handle accordingly
    if (isReadingSessionInput(validatedData)) {
      // Handle reading session format (from useMLIntegration)
      return await handleReadingSessionUpdate(supabase, user, validatedData);
    } else if (isExerciseInput(validatedData)) {
      // Handle exercise-based format (original implementation)
      return await handleExerciseUpdate(supabase, user, validatedData);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('[Q-Learning] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handle reading session Q-learning updates (from WordByWordReader)
async function handleReadingSessionUpdate(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  user: { id: string },
  data: ReadingSessionInput
) {
  const { studentId, experiences, currentState, exerciseType } = data;

  console.log('[Q-Learning] Processing reading session update for student:', studentId);
  console.log('[Q-Learning] Experiences count:', experiences.length);
  console.log('[Q-Learning] Current state:', JSON.stringify(currentState));

  // SECURITY: Verify user is either the student or their teacher
  const isOwnData = user.id === studentId;
  
  let isTeacher = false;
  if (!isOwnData) {
    const { data: classrooms } = await supabase
      .from('classroom_students')
      .select('classroom_id, classrooms!inner(teacher_id)')
      .eq('student_id', studentId);
    
    // deno-lint-ignore no-explicit-any
    isTeacher = classrooms?.some((cs: any) => cs.classrooms.teacher_id === user.id) || false;
  }

  if (!isOwnData && !isTeacher) {
    return new Response(JSON.stringify({ error: 'Not authorized - must be the student or their teacher' }), {
      status: 403,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }

  // Load student's existing Q-table or create new one
  const { data: existingStudentQ } = await supabase
    .from('student_q_tables')
    .select('*')
    .eq('student_id', studentId)
    .single();

  // Load global Q-table (trained model) as fallback
  const { data: globalQTable } = await supabase
    .from('ml_model_weights')
    .select('weights')
    .eq('model_type', 'q_learning_table')
    .eq('is_active', true)
    .single();

  // Merge global Q-table with student-specific Q-table
  // deno-lint-ignore no-explicit-any
  const baseQTable = (globalQTable as any)?.weights as Record<string, Record<string, number>> || {};
  // deno-lint-ignore no-explicit-any
  const studentQTable = (existingStudentQ as any)?.q_table as Record<string, Record<string, number>> || {};
  const mergedQTable = { ...baseQTable };
  
  for (const [state, actions] of Object.entries(studentQTable)) {
    if (!mergedQTable[state]) {
      mergedQTable[state] = {};
    }
    for (const [action, value] of Object.entries(actions)) {
      mergedQTable[state][action] = value;
    }
  }

  const qAgent = new StudentQAgent(mergedQTable);

  // Get or create skill vector for the student
  let { data: skillVector } = await supabase
    .from('student_skill_vectors')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (!skillVector) {
    // Create initial skill vector
    const { data: newSkillVector, error: createError } = await supabase
      .from('student_skill_vectors')
      .insert({
        student_id: studentId,
        phoneme_scores: {},
        current_difficulty_level: currentState.level,
      })
      .select()
      .single();

    if (createError) {
      console.error('[Q-Learning] Failed to create skill vector:', createError);
      throw createError;
    }
    skillVector = newSkillVector;
  }

  // Current phoneme scores
  // deno-lint-ignore no-explicit-any
  const phonemeScores = ((skillVector as any).phoneme_scores as Record<string, number>) || {};
  const currentMastered = currentState.masteredPhonemes;
  const currentStruggling = currentState.strugglingPhonemes;
  const currentLevel = currentState.level;

  // Process each phoneme experience
  const qUpdates: Array<{ phoneme: string; qBefore: number; qAfter: number; reward: number }> = [];
  const updatedPhonemeScores = { ...phonemeScores };

  for (const exp of experiences) {
    // Calculate reward based on accuracy
    const reward = exp.accuracy >= 0.8 ? 1.0 : 
                   exp.accuracy >= 0.6 ? 0.5 : 
                   exp.accuracy >= 0.4 ? 0 : -0.5;

    // Update phoneme score
    const currentScore = updatedPhonemeScores[exp.phoneme] || 50;
    updatedPhonemeScores[exp.phoneme] = Math.min(100, Math.max(0, 
      currentScore + (reward * 10 * Math.min(exp.attempts, 5) / 5) // Scale by attempts, max 5
    ));

    // Calculate next state after this phoneme
    const nextMastered = Object.keys(updatedPhonemeScores).filter(p => updatedPhonemeScores[p] > 80);
    const nextStruggling = Object.keys(updatedPhonemeScores).filter(p => updatedPhonemeScores[p] < 60);
    const nextLevel = currentLevel + (reward > 0.5 ? 0.05 : reward < 0 ? -0.05 : 0);

    // Update Q-value for this phoneme
    const update = qAgent.update(
      currentMastered,
      currentStruggling,
      Math.round(currentLevel),
      exp.phoneme,
      reward,
      nextMastered,
      nextStruggling,
      Math.round(nextLevel)
    );
    
    qUpdates.push({ phoneme: exp.phoneme, ...update, reward });
  }

  // Persist student's updated Q-table
  const studentQTableOnly = qAgent.exportQTable();
  const stats = qAgent.getStats();
  const lastPhoneme = experiences[experiences.length - 1]?.phoneme || 's';
  const avgReward = qUpdates.reduce((sum, u) => sum + u.reward, 0) / qUpdates.length;

  if (existingStudentQ) {
    // deno-lint-ignore no-explicit-any
    const existingUpdates = (existingStudentQ as any).total_updates || 0;
    await supabase
      .from('student_q_tables')
      .update({
        q_table: studentQTableOnly,
        total_updates: existingUpdates + experiences.length,
        last_action: lastPhoneme,
        last_reward: avgReward,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId);
  } else {
    await supabase
      .from('student_q_tables')
      .insert({
        student_id: studentId,
        q_table: studentQTableOnly,
        total_updates: experiences.length,
        last_action: lastPhoneme,
        last_reward: avgReward,
      });
  }

  // Update skill vector
  const newLevel = currentLevel + (avgReward > 0.5 ? 0.1 : avgReward < 0 ? -0.1 : 0);
  await supabase
    .from('student_skill_vectors')
    .update({
      phoneme_scores: updatedPhonemeScores,
      current_difficulty_level: Math.round(Math.max(1, Math.min(20, newLevel)) * 10) / 10,
      last_updated: new Date().toISOString(),
    })
    .eq('student_id', studentId);

  // Get next recommended phoneme
  const allPhonemes = ['b', 'p', 'd', 't', 'g', 'k', 'm', 'n', 'f', 'v', 's', 'z', 'sh', 'th', 'l', 'r', 'w', 'y'];
  const nextMastered = Object.keys(updatedPhonemeScores).filter(p => updatedPhonemeScores[p] > 80);
  const nextStruggling = Object.keys(updatedPhonemeScores).filter(p => updatedPhonemeScores[p] < 60);
  const candidatePhonemes = allPhonemes.filter(p => !nextMastered.includes(p));
  const nextRecommendation = qAgent.selectBestPhoneme(nextMastered, nextStruggling, Math.round(newLevel), candidatePhonemes);

  console.log('[Q-Learning] Reading session update complete:', {
    studentId,
    experiencesProcessed: experiences.length,
    avgReward,
    qUpdatesCount: qUpdates.length,
    totalStates: stats.states,
    nextRecommendation: nextRecommendation.phoneme,
  });

  return new Response(JSON.stringify({
    success: true,
    source: 'reading_session',
    qLearningUpdate: {
      studentId,
      experiencesProcessed: experiences.length,
      avgReward,
      updates: qUpdates,
      stats,
    },
    updatedScores: updatedPhonemeScores,
    nextRecommendation,
  }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}

// Handle exercise-based Q-learning updates (original implementation)
async function handleExerciseUpdate(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  user: { id: string },
  data: ExerciseInput
) {
  const { exerciseId, studentId, performance } = data;

  console.log('[Q-Learning] Processing exercise update:', exerciseId, 'student:', studentId);

  // SECURITY: Verify user is either the student or their teacher
  const isOwnData = user.id === studentId;
  
  let isTeacher = false;
  if (!isOwnData) {
    const { data: classrooms } = await supabase
      .from('classroom_students')
      .select('classroom_id, classrooms!inner(teacher_id)')
      .eq('student_id', studentId);
    
    // deno-lint-ignore no-explicit-any
    isTeacher = classrooms?.some((cs: any) => cs.classrooms.teacher_id === user.id) || false;
  }

  if (!isOwnData && !isTeacher) {
    return new Response(JSON.stringify({ error: 'Not authorized - must be the student or their teacher' }), {
      status: 403,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }

  // Get exercise details
  const { data: exercise, error: exerciseError } = await supabase
    .from('practice_exercises')
    .select('*')
    .eq('id', exerciseId)
    .single();

  if (exerciseError) {
    console.error('[Q-Learning] Exercise not found:', exerciseError);
    throw exerciseError;
  }

  // Get student skill vector
  let { data: skillVector, error: skillError } = await supabase
    .from('student_skill_vectors')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (skillError || !skillVector) {
    // Create initial skill vector
    const { data: newSkillVector, error: createError } = await supabase
      .from('student_skill_vectors')
      .insert({
        student_id: studentId,
        phoneme_scores: {},
        current_difficulty_level: 1,
      })
      .select()
      .single();

    if (createError) throw createError;
    skillVector = newSkillVector;
  }

  // Load student's existing Q-table
  const { data: existingStudentQ } = await supabase
    .from('student_q_tables')
    .select('*')
    .eq('student_id', studentId)
    .single();

  // Load global Q-table (trained model) as fallback
  const { data: globalQTable } = await supabase
    .from('ml_model_weights')
    .select('weights')
    .eq('model_type', 'q_learning_table')
    .eq('is_active', true)
    .single();

  // Merge global Q-table with student-specific Q-table (student takes precedence)
  // deno-lint-ignore no-explicit-any
  const baseQTable = (globalQTable as any)?.weights as Record<string, Record<string, number>> || {};
  // deno-lint-ignore no-explicit-any
  const studentQTable = (existingStudentQ as any)?.q_table as Record<string, Record<string, number>> || {};
  const mergedQTable = { ...baseQTable };
  
  // Overlay student-specific learning
  for (const [state, actions] of Object.entries(studentQTable)) {
    if (!mergedQTable[state]) {
      mergedQTable[state] = {};
    }
    for (const [action, value] of Object.entries(actions)) {
      mergedQTable[state][action] = value;
    }
  }

  const qAgent = new StudentQAgent(mergedQTable);

  // Calculate reward based on performance
  const reward = performance.success_rate >= 0.8 ? 1.0 : 
                 performance.success_rate >= 0.6 ? 0.5 : 
                 performance.success_rate >= 0.4 ? 0 : -0.5;

  // Current state
  // deno-lint-ignore no-explicit-any
  const phonemeScores = (skillVector as any).phoneme_scores as Record<string, number> || {};
  const currentMastered = Object.keys(phonemeScores).filter(p => phonemeScores[p] > 80);
  const currentStruggling = Object.keys(phonemeScores).filter(p => phonemeScores[p] < 60);
  // deno-lint-ignore no-explicit-any
  const currentLevel = (skillVector as any).current_difficulty_level || 1;

  // Update phoneme scores based on performance
  const updatedPhonemeScores = { ...phonemeScores };
  // deno-lint-ignore no-explicit-any
  const phonemeTargets = (exercise as any).phoneme_targets || [];
  
  for (const phoneme of phonemeTargets) {
    const currentScore = updatedPhonemeScores[phoneme] || 50;
    updatedPhonemeScores[phoneme] = Math.min(100, Math.max(0, 
      currentScore + (reward * 10)
    ));
  }

  // Next state (after this exercise)
  const nextMastered = Object.keys(updatedPhonemeScores).filter(p => updatedPhonemeScores[p] > 80);
  const nextStruggling = Object.keys(updatedPhonemeScores).filter(p => updatedPhonemeScores[p] < 60);
  const nextLevel = currentLevel + (reward > 0.5 ? 0.1 : reward < 0 ? -0.1 : 0);

  // Update Q-values for each practiced phoneme
  const qUpdates: Array<{ phoneme: string; qBefore: number; qAfter: number }> = [];
  for (const phoneme of phonemeTargets) {
    const update = qAgent.update(
      currentMastered,
      currentStruggling,
      currentLevel,
      phoneme,
      reward,
      nextMastered,
      nextStruggling,
      nextLevel
    );
    qUpdates.push({ phoneme, ...update });
  }

  // Get next recommended phoneme
  const allPhonemes = ['b', 'p', 'd', 't', 'g', 'k', 'm', 'n', 'f', 'v', 's', 'z', 'sh', 'th', 'l', 'r', 'w', 'y'];
  const candidatePhonemes = allPhonemes.filter(p => !nextMastered.includes(p));
  const nextRecommendation = qAgent.selectBestPhoneme(nextMastered, nextStruggling, Math.round(nextLevel), candidatePhonemes);

  // Persist student's updated Q-table
  const studentQTableOnly = qAgent.exportQTable();
  const stats = qAgent.getStats();

  if (existingStudentQ) {
    // deno-lint-ignore no-explicit-any
    const existingUpdates = (existingStudentQ as any).total_updates || 0;
    await supabase
      .from('student_q_tables')
      .update({
        q_table: studentQTableOnly,
        total_updates: existingUpdates + phonemeTargets.length,
        last_action: phonemeTargets[0],
        last_reward: reward,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId);
  } else {
    await supabase
      .from('student_q_tables')
      .insert({
        student_id: studentId,
        q_table: studentQTableOnly,
        total_updates: phonemeTargets.length,
        last_action: phonemeTargets[0],
        last_reward: reward,
      });
  }

  // Update exercise effectiveness
  await supabase
    .from('practice_exercises')
    .update({
      effectiveness_score: Math.round(performance.success_rate * 100),
      success_rate: performance.success_rate,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', exerciseId);

  // Update skill vector
  await supabase
    .from('student_skill_vectors')
    .update({
      phoneme_scores: updatedPhonemeScores,
      current_difficulty_level: Math.round(nextLevel * 10) / 10,
      last_updated: new Date().toISOString(),
    })
    .eq('student_id', studentId);

  console.log('[Q-Learning] Exercise update complete:', {
    studentId,
    exerciseId,
    reward,
    qUpdates: qUpdates.length,
    totalStates: stats.states,
    nextRecommendation: nextRecommendation.phoneme,
  });

  return new Response(JSON.stringify({
    success: true,
    source: 'exercise',
    qLearningUpdate: {
      studentId,
      exerciseId,
      reward,
      updates: qUpdates,
      stats,
    },
    updatedScores: updatedPhonemeScores,
    nextRecommendation,
  }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}
