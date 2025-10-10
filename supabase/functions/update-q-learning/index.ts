import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseId, studentId, performance } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Updating Q-learning for exercise:', exerciseId);

    // Get exercise details
    const { data: exercise, error: exerciseError } = await supabase
      .from('practice_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (exerciseError) throw exerciseError;

    // Get student skill vector for state
    const { data: skillVector, error: skillError } = await supabase
      .from('student_skill_vectors')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (skillError) throw skillError;

    // Calculate reward based on performance
    const reward = performance.success_rate >= 0.8 ? 1.0 : 
                   performance.success_rate >= 0.6 ? 0.5 : 
                   performance.success_rate >= 0.4 ? 0 : -0.5;

    // Update Q-learning state (in real implementation, this would update the Q-table)
    const qLearningUpdate = {
      studentId,
      exerciseId,
      phonemeTargets: exercise.phoneme_targets,
      reward,
      currentState: {
        masteredPhonemes: skillVector.phoneme_scores ? Object.keys(skillVector.phoneme_scores).filter((p: string) => 
          (skillVector.phoneme_scores as Record<string, number>)[p] > 80
        ) : [],
        strugglingPhonemes: skillVector.phoneme_scores ? Object.keys(skillVector.phoneme_scores).filter((p: string) => 
          (skillVector.phoneme_scores as Record<string, number>)[p] < 60
        ) : [],
        currentLevel: skillVector.current_difficulty_level || 1,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Q-learning update:', qLearningUpdate);

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

    // Update skill vector with new performance data
    const updatedPhonemeScores = { ...(skillVector.phoneme_scores || {}) };
    for (const phoneme of exercise.phoneme_targets) {
      const currentScore = updatedPhonemeScores[phoneme] || 50;
      updatedPhonemeScores[phoneme] = Math.min(100, Math.max(0, 
        currentScore + (reward * 10) // Adjust score based on reward
      ));
    }

    await supabase
      .from('student_skill_vectors')
      .update({
        phoneme_scores: updatedPhonemeScores,
        last_updated: new Date().toISOString(),
      })
      .eq('student_id', studentId);

    return new Response(JSON.stringify({
      success: true,
      qLearningUpdate,
      updatedScores: updatedPhonemeScores,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Q-learning update error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
