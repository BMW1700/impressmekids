import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { exerciseEffectivenessSchema, validateInput } from "../_shared/validation.ts";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[AUTH] Missing authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Use ANON key with RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[AUTH] Invalid token:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Rate limiting (10 requests per minute - expensive ML operations)
    const rateLimitResult = await checkRateLimit(user.id, 'calculate-exercise-effectiveness', RATE_LIMITS.ML_TRAINING);
    if (!rateLimitResult.allowed) {
      console.warn('[RATE_LIMIT] Rate limit exceeded:', user.id);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Effectiveness calculations limited to 10 requests per minute.',
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

    const body = await req.json();

    // SECURITY: Zod validation
    const validation = validateInput(exerciseEffectivenessSchema, body);
    if (!validation.success) {
      console.error('[VALIDATION] Input validation failed:', validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { exerciseId, studentId } = validation.data;

    // SECURITY: Verify user is either the student or their teacher
    const isOwnData = user.id === studentId;
    
    let isTeacher = false;
    if (!isOwnData) {
      const { data: classrooms } = await supabase
        .from('classroom_students')
        .select('classroom_id, classrooms!inner(teacher_id)')
        .eq('student_id', studentId);
      
      isTeacher = classrooms?.some((cs: any) => cs.classrooms.teacher_id === user.id) || false;
    }

    if (!isOwnData && !isTeacher) {
      return new Response(JSON.stringify({ error: 'Not authorized - must be the student or their teacher' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calculating effectiveness for exercise:', exerciseId, 'user:', user.id, 'authorized:', isOwnData ? 'self' : 'teacher');

    // Get exercise details
    const { data: exercise, error: exerciseError } = await supabase
      .from('practice_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (exerciseError || !exercise) {
      throw new Error('Exercise not found');
    }

    if (!exercise.completed) {
      return new Response(
        JSON.stringify({ effectiveness_score: null, message: 'Exercise not completed yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetPhonemes = exercise.phoneme_targets;
    const completedAt = new Date(exercise.completed_at);
    const createdAt = new Date(exercise.created_at);

    // Get AURA records before exercise
    const { data: beforeRecords, error: beforeError } = await supabase
      .from('aura_records')
      .select('evidence')
      .eq('profile_id', studentId)
      .lt('created_at', createdAt.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (beforeError) throw beforeError;

    // Get AURA records after exercise completion
    const { data: afterRecords, error: afterError } = await supabase
      .from('aura_records')
      .select('evidence')
      .eq('profile_id', studentId)
      .gt('created_at', completedAt.toISOString())
      .order('created_at', { ascending: true })
      .limit(5);

    if (afterError) throw afterError;

    // Calculate average accuracy for target phonemes before and after
    const calculateAvgAccuracy = (records: any[]) => {
      if (!records || records.length === 0) return null;
      
      let totalAccuracy = 0;
      let count = 0;

      records.forEach(record => {
        const phonemeAccuracy = record.evidence?.phoneme_accuracy || [];
        targetPhonemes.forEach((targetPhoneme: string) => {
          const phonemeData = phonemeAccuracy.find((p: any) => p.phoneme === targetPhoneme);
          if (phonemeData) {
            totalAccuracy += phonemeData.accuracy;
            count++;
          }
        });
      });

      return count > 0 ? totalAccuracy / count : null;
    };

    const beforeAvg = calculateAvgAccuracy(beforeRecords);
    const afterAvg = calculateAvgAccuracy(afterRecords);

    let effectivenessScore = null;
    if (beforeAvg !== null && afterAvg !== null) {
      effectivenessScore = Math.round(afterAvg - beforeAvg);
    }

    // Update exercise with effectiveness score
    if (effectivenessScore !== null) {
      await supabase
        .from('practice_exercises')
        .update({ effectiveness_score: effectivenessScore })
        .eq('id', exerciseId);
    }

    console.log(`Exercise ${exerciseId}: Before=${beforeAvg?.toFixed(1)}%, After=${afterAvg?.toFixed(1)}%, Effectiveness=${effectivenessScore}%`);

    return new Response(
      JSON.stringify({
        success: true,
        effectiveness_score: effectivenessScore,
        before_avg: beforeAvg,
        after_avg: afterAvg,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating effectiveness:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});