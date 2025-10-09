import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { studentId, phonemeGaps, grade } = await req.json();

    if (!studentId || !phonemeGaps || phonemeGaps.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Fetch student's mastered phonemes from skill vectors
    const { data: skillVector } = await supabase
      .from('student_skill_vectors')
      .select('phoneme_scores')
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

    // Run transfer learning prediction
    const transferPredictions = predictPhonemeGains(masteredPhonemes, phonemeGaps, grade);

    console.log(`Transfer predictions for student ${studentId}:`, transferPredictions.slice(0, 3));

    // Generate exercises using Lovable AI with transfer learning insights
    const prompt = `Generate 3 fun, age-appropriate practice exercises for a grade ${grade || 5} student.

PROBLEMATIC PHONEMES: ${phonemeGaps.join(", ")}

🚀 TRANSFER LEARNING INSIGHTS:
Based on articulatory similarity analysis, this student is predicted to gain mastery of:
${transferPredictions.slice(0, 3).map(p => `- /${p.phoneme}/ (${p.transferProbability}% confidence): ${p.reasoning}`).join('\n')}

INSTRUCTIONS:
- Focus exercises on problematic phonemes: ${phonemeGaps.join(", ")}
- Include transfer-ready phonemes (${transferPredictions.slice(0, 2).map(p => p.phoneme).join(', ')}) to accelerate learning
- Design exercises that leverage known articulatory patterns
- Make them engaging and educational

Include:
1. One tongue twister focusing on these sounds
2. One short read-aloud passage (3-4 sentences) that naturally includes these phonemes
3. One creative speaking prompt that encourages use of these sounds

Return ONLY a JSON object with this structure:
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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert speech-language pathologist creating engaging pronunciation exercises for students. Always return valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;
    const parsed = JSON.parse(generatedContent);

    // Insert exercises into database with transfer predictions
    const exercisesToInsert = parsed.exercises.map((ex: any) => ({
      student_id: studentId,
      phoneme_targets: phonemeGaps,
      exercise_type: ex.type,
      content: ex.content,
      completed: false,
      transfer_predictions: transferPredictions, // NEW: Store predictions for tracking
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
