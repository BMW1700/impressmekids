import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Generate exercises using Lovable AI
    const prompt = `Generate 3 fun, age-appropriate practice exercises for a grade ${grade || 5} student struggling with these phonemes: ${phonemeGaps.join(", ")}.

Include:
1. One tongue twister focusing on these sounds
2. One short read-aloud passage (3-4 sentences) that naturally includes these phonemes
3. One creative speaking prompt that encourages use of these sounds

Make them engaging, educational, and specifically target the problematic phonemes. Return ONLY a JSON object with this structure:
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

    // Insert exercises into database
    const exercisesToInsert = parsed.exercises.map((ex: any) => ({
      student_id: studentId,
      phoneme_targets: phonemeGaps,
      exercise_type: ex.type,
      content: ex.content,
      completed: false,
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
