import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { generateExercisesSchema, validateInput } from "../_shared/validation.ts";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rateLimiter.ts";

import { corsHeaders } from '../_shared/cors.ts';

// Transfer learning model (replicated from client-side)
const phonemeFeatures: { [key: string]: { voicing: number; place: number; manner: number } } = {
  'b': { voicing: 1, place: 1, manner: 1 }, 'p': { voicing: 0, place: 1, manner: 1 },
  'd': { voicing: 1, place: 2, manner: 1 }, 't': { voicing: 0, place: 2, manner: 1 },
  'g': { voicing: 1, place: 3, manner: 1 }, 'ɡ': { voicing: 1, place: 3, manner: 1 },
  'k': { voicing: 0, place: 3, manner: 1 },
  'f': { voicing: 0, place: 4, manner: 2 }, 'v': { voicing: 1, place: 4, manner: 2 },
  'θ': { voicing: 0, place: 5, manner: 2 }, 'ð': { voicing: 1, place: 5, manner: 2 },
  's': { voicing: 0, place: 2, manner: 2 }, 'z': { voicing: 1, place: 2, manner: 2 },
  'ʃ': { voicing: 0, place: 6, manner: 2 }, 'ʒ': { voicing: 1, place: 6, manner: 2 },
  'h': { voicing: 0, place: 7, manner: 2 },
  'tʃ': { voicing: 0, place: 6, manner: 3 }, 'dʒ': { voicing: 1, place: 6, manner: 3 },
  'm': { voicing: 1, place: 1, manner: 4 }, 'n': { voicing: 1, place: 2, manner: 4 },
  'ŋ': { voicing: 1, place: 3, manner: 4 },
  'l': { voicing: 1, place: 2, manner: 5 }, 'ɹ': { voicing: 1, place: 2, manner: 6 },
  'w': { voicing: 1, place: 8, manner: 6 }, 'j': { voicing: 1, place: 9, manner: 6 },
};

const phonemeDistance = (p1: string, p2: string): number => {
  if (p1 === p2) return 0.0;
  const f1 = phonemeFeatures[p1];
  const f2 = phonemeFeatures[p2];
  if (!f1 || !f2) return 0.9;
  const voicingDiff = Math.abs(f1.voicing - f2.voicing) * 0.3;
  const placeDiff = Math.abs(f1.place - f2.place) / 12 * 0.4;
  const mannerDiff = Math.abs(f1.manner - f2.manner) / 10 * 0.3;
  return Math.min(1.0, voicingDiff + placeDiff + mannerDiff);
};

const predictPhonemeGains = (masteredPhonemes: string[], strugglingPhonemes: string[], grade?: number) => {
  const allPhonemes = Object.keys(phonemeFeatures);
  const targetPhonemes = allPhonemes.filter(
    p => !masteredPhonemes.includes(p) && !strugglingPhonemes.includes(p)
  );

  const predictions: any[] = [];

  for (const targetPhoneme of targetPhonemes) {
    const distancesToMastered = masteredPhonemes
      .map(m => phonemeDistance(targetPhoneme, m))
      .filter(d => d < 0.9);
    
    if (distancesToMastered.length === 0) continue;

    const avgDistanceToMastered = distancesToMastered.reduce((a, b) => a + b, 0) / distancesToMastered.length;

    const distancesToStruggling = strugglingPhonemes
      .map(s => phonemeDistance(targetPhoneme, s))
      .filter(d => d < 0.9);
    
    const minDistanceToStruggling = distancesToStruggling.length > 0 
      ? Math.min(...distancesToStruggling)
      : 1.0;

    const similarMastered = masteredPhonemes
      .map(m => ({ phoneme: m, distance: phonemeDistance(targetPhoneme, m) }))
      .filter(({ distance }) => distance < 0.4)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(({ phoneme }) => phoneme);

    let transferProbability = 0;
    let readinessLevel = 'low';
    let reasoning = '';

    if (avgDistanceToMastered < 0.25 && minDistanceToStruggling > 0.5) {
      transferProbability = Math.round((1 - avgDistanceToMastered) * 100);
      readinessLevel = 'high';
      reasoning = `Very similar to mastered ${similarMastered.map(p => `/${p}/`).join(', ')}`;
    } else if (avgDistanceToMastered < 0.4) {
      transferProbability = Math.round((1 - avgDistanceToMastered) * 80);
      readinessLevel = 'medium';
      reasoning = `Shares features with ${similarMastered.map(p => `/${p}/`).join(', ')}`;
    } else {
      transferProbability = Math.round((1 - avgDistanceToMastered) * 60);
      readinessLevel = 'low';
      reasoning = 'Different from familiar sounds';
    }

    predictions.push({
      phoneme: targetPhoneme,
      transferProbability: Math.min(95, Math.max(5, transferProbability)),
      reasoning,
      similarToMastered: similarMastered,
      readinessLevel,
    });
  }

  return predictions
    .sort((a, b) => b.transferProbability - a.transferProbability)
    .slice(0, 5);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[AUTH] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode JWT to get user ID (already verified by Supabase gateway since verify_jwt = true)
    const token = authHeader.replace('Bearer ', '');
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub;
    
    if (!userId) {
      console.error('[AUTH] Invalid token - no user ID');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-practice-exercises] User:', userId);

    // SECURITY: Use ANON key with RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // SECURITY: Rate limiting (100 requests per minute per user)
    const rateLimitResult = await checkRateLimit(userId, 'generate-practice-exercises', RATE_LIMITS.AI_FUNCTION);
    if (!rateLimitResult.allowed) {
      console.warn('[RATE_LIMIT] Rate limit exceeded:', userId);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        resetAt: rateLimitResult.resetAt,
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          ...getRateLimitHeaders(rateLimitResult, RATE_LIMITS.AI_FUNCTION),
          'Content-Type': 'application/json',
        },
      });
    }

    const body = await req.json();

    // SECURITY: Zod validation
    const validation = validateInput(generateExercisesSchema, body);
    if (!validation.success) {
      console.error('[VALIDATION] Input validation failed:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { studentId, phonemeGaps, grade } = validation.data;

    // CRITICAL SECURITY: Verify user is authorized to generate exercises for this student
    // User must be either the student themselves OR their teacher
    const isOwnData = userId === studentId;
    
    let isTeacher = false;
    if (!isOwnData) {
      const { data: classrooms } = await supabase
        .from('classroom_students')
        .select('classroom_id, classrooms!inner(teacher_id)')
        .eq('student_id', studentId);
      
      isTeacher = classrooms?.some((cs: any) => cs.classrooms.teacher_id === userId) || false;
    }

    if (!isOwnData && !isTeacher) {
      console.error('[AUTH] User not authorized for student:', { userId, studentId });
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch student's skill vector with difficulty level
    const { data: skillVector } = await supabase
      .from('student_skill_vectors')
      .select('phoneme_scores, current_difficulty_level, performance_trend, weekly_improvement')
      .eq('student_id', studentId)
      .single();

    const masteredPhonemes: string[] = [];
    if (skillVector?.phoneme_scores) {
      for (const [phoneme, score] of Object.entries(skillVector.phoneme_scores)) {
        if (typeof score === 'number' && score > 85) {
          masteredPhonemes.push(phoneme);
        }
      }
    }

    // Fetch recent performance for difficulty calculation
    const { data: recentRecords } = await supabase
      .from('aura_records')
      .select('grade')
      .eq('profile_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentGrades = recentRecords?.map(r => r.grade).filter(g => g !== null) || [];
    const avgGrade = recentGrades.length > 0 
      ? recentGrades.reduce((a: number, b: number) => a + b, 0) / recentGrades.length
      : 70;

    // ========== V2: RL + CROSS-MODAL DIFFICULTY SCALING ==========
    const currentDifficultyLevel = skillVector?.current_difficulty_level || 1;
    const performanceTrend = skillVector?.performance_trend || 0;
    const weeklyImprovement = skillVector?.weekly_improvement || 0;

    let targetDifficultyLevel = currentDifficultyLevel;
    let difficultyReasoning = 'Maintaining current level';
    let articulatoryFatigueRisk = 0;

    // Fetch recent practice sessions to estimate fatigue
    const { data: recentSessions } = await supabase
      .from('realtime_practice_sessions')
      .select('duration_seconds, created_at')
      .eq('student_id', studentId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
      .order('created_at', { ascending: false });

    const totalPracticeMinutesLast24h = (recentSessions || [])
      .reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60;

    // Estimate fatigue: 0 (none) to 1 (exhausted)
    articulatoryFatigueRisk = Math.min(1.0, totalPracticeMinutesLast24h / 120); // Max out at 2 hours

    // ENHANCED DIFFICULTY SCALING WITH RL INSIGHTS
    // Rule 1: High fatigue → reduce difficulty
    if (articulatoryFatigueRisk > 0.7) {
      targetDifficultyLevel = Math.max(1, currentDifficultyLevel - 1);
      difficultyReasoning = `Articulatory fatigue detected (${Math.round(articulatoryFatigueRisk * 100)}%). Reducing to prevent burnout.`;
    }
    // Rule 2: Excellent recent performance + low fatigue → increase
    else if (avgGrade >= 85 && recentGrades.length >= 3 && articulatoryFatigueRisk < 0.4) {
      targetDifficultyLevel = Math.min(5, currentDifficultyLevel + 1);
      difficultyReasoning = `Excellent performance (${Math.round(avgGrade)}/100) with low fatigue. Ready for level ${targetDifficultyLevel}!`;
    }
    // Rule 3: Struggling performance → decrease
    else if (avgGrade < 60 && recentGrades.length >= 3) {
      targetDifficultyLevel = Math.max(1, currentDifficultyLevel - 1);
      difficultyReasoning = `Performance struggling (${Math.round(avgGrade)}/100). Lowering for confidence building.`;
    }
    // Rule 4: Strong improvement trend → slight increase
    else if (weeklyImprovement > 15 && avgGrade >= 75) {
      targetDifficultyLevel = Math.min(5, currentDifficultyLevel + 1);
      difficultyReasoning = `Strong weekly improvement (+${Math.round(weeklyImprovement)}%). Advancing difficulty.`;
    }
    // Rule 5: Maintain for consistency
    else {
      targetDifficultyLevel = currentDifficultyLevel;
      difficultyReasoning = `Stable performance (${Math.round(avgGrade)}/100). Maintaining level ${currentDifficultyLevel}.`;
    }

    console.log(`🎯 Difficulty Scaling: ${currentDifficultyLevel} → ${targetDifficultyLevel} (${difficultyReasoning})`);
    console.log(`⚡ Fatigue Risk: ${Math.round(articulatoryFatigueRisk * 100)}% (${Math.round(totalPracticeMinutesLast24h)}min practice in 24h)`);

    // Get difficulty parameters
    const difficultyParams: { [key: number]: any } = {
      1: { complexity: 'very simple, single-syllable words', vocabulary: 'basic common words', length: 'short (3-5 words)', pacing: 'slow' },
      2: { complexity: 'simple phrases', vocabulary: 'everyday vocabulary', length: 'medium (5-8 words)', pacing: 'moderate' },
      3: { complexity: 'multi-syllable words', vocabulary: 'grade-level appropriate', length: 'medium-long (8-12 words)', pacing: 'natural' },
      4: { complexity: 'complex sentences', vocabulary: 'academic vocabulary', length: 'long (12-15 words)', pacing: 'faster' },
      5: { complexity: 'intricate tongue twisters', vocabulary: 'advanced and idiomatic', length: 'very long (15+ words)', pacing: 'rapid' },
    };

    const diffParams = difficultyParams[targetDifficultyLevel] || difficultyParams[3];

    // Run transfer learning prediction
    const transferPredictions = predictPhonemeGains(masteredPhonemes, phonemeGaps, grade);

    console.log(`Transfer predictions for student ${studentId}:`, transferPredictions.slice(0, 3));

    // Generate exercises using Vertex AI with RL-enhanced scaling
    const recommendedRestMinutes = articulatoryFatigueRisk > 0.7 
      ? Math.ceil(articulatoryFatigueRisk * 30) 
      : 0;

    const prompt = `Generate 3 practice exercises for a grade ${grade || 5} student at DIFFICULTY LEVEL ${targetDifficultyLevel}/5.

PROBLEMATIC PHONEMES: ${phonemeGaps.join(", ")}

🎯 DIFFICULTY LEVEL ${targetDifficultyLevel}/5 REQUIREMENTS:
- Complexity: ${diffParams.complexity}
- Vocabulary: ${diffParams.vocabulary}
- Length: ${diffParams.length}
- Pacing: ${diffParams.pacing}

🚀 TRANSFER LEARNING INSIGHTS (RL-Based Phoneme Sequencing):
${transferPredictions.slice(0, 3).map(p => `- /${p.phoneme}/ (${p.transferProbability}% confidence): ${p.reasoning}`).join('\n')}

📊 ADAPTIVE STUDENT CONTEXT:
- Recent average: ${Math.round(avgGrade)}/100
- Performance trend: ${performanceTrend > 0 ? 'improving' : performanceTrend < 0 ? 'declining' : 'stable'}
- Weekly improvement: ${weeklyImprovement > 0 ? '+' : ''}${Math.round(weeklyImprovement)}%
- Articulatory fatigue: ${Math.round(articulatoryFatigueRisk * 100)}%
${recommendedRestMinutes > 0 ? `- ⚠️ RECOMMEND ${recommendedRestMinutes}min rest before practice` : ''}

⚡ RL-ENHANCED INSTRUCTIONS:
- Prioritize transfer-ready phonemes for optimal muscle memory: ${transferPredictions.slice(0, 2).map(p => p.phoneme).join(', ')}
- Sequence exercises to minimize articulatory fatigue
- ${articulatoryFatigueRisk > 0.5 ? 'IMPORTANT: Keep exercises SHORT to avoid burnout' : 'Student is fresh - can handle full complexity'}
- Match difficulty level ${targetDifficultyLevel} EXACTLY

Include:
1. One tongue twister matching the difficulty level
2. One read-aloud passage (3-4 sentences) with appropriate vocabulary
3. One creative speaking prompt that encourages use of target sounds

Return ONLY a JSON object:
{
  "exercises": [
    {
      "type": "tongue_twister",
      "content": "..."
    },
    {
      "type": "read_aloud",
      "content": "..."
    },
    {
      "type": "creative",
      "content": "..."
    }
  ]
}`;

    // Import Vertex AI helper
    const { callVertexAI } = await import('../_shared/vertexAuth.ts');
    
    const systemInstruction = "You are an expert speech-language pathologist creating engaging pronunciation exercises for students. Always return valid JSON.";
    
    const generatedContent = await callVertexAI(prompt, systemInstruction, {
      model: "gemini-2.5-flash",
      temperature: 0.7,
    });
    
    const parsed = JSON.parse(generatedContent);

    // Insert exercises into database with V2 difficulty tracking
    const exercisesToInsert = parsed.exercises.map((ex: any) => ({
      student_id: studentId,
      phoneme_targets: phonemeGaps,
      exercise_type: ex.type,
      content: ex.content,
      completed: false,
      transfer_predictions: transferPredictions,
      difficulty_level: targetDifficultyLevel,
      adaptive_metadata: {
        generated_at: new Date().toISOString(),
        version: 'v2_rl_enhanced',
        avg_grade: avgGrade,
        current_level: currentDifficultyLevel,
        target_level: targetDifficultyLevel,
        difficulty_reasoning: difficultyReasoning,
        articulatory_fatigue_risk: articulatoryFatigueRisk,
        recommended_rest_minutes: recommendedRestMinutes,
        performance_trend: performanceTrend,
        weekly_improvement: weeklyImprovement,
        total_practice_minutes_24h: totalPracticeMinutesLast24h,
      },
    }));

    const { data: insertedExercises, error: insertError } = await supabase
      .from("practice_exercises")
      .insert(exercisesToInsert)
      .select();

    if (insertError) throw insertError;

    console.log(`Generated ${insertedExercises.length} exercises for student ${studentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        exercises: insertedExercises,
        count: insertedExercises.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-practice-exercises:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
