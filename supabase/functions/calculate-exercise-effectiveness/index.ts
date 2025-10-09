import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseId, studentId } = await req.json();

    if (!exerciseId || !studentId) {
      throw new Error('exerciseId and studentId are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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