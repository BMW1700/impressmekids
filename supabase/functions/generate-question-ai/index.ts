import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a safe, curriculum-aware elementary school question writer.
Output EXACTLY a JSON object with a "questions" array containing 3 question objects. Do NOT add commentary.

Each question object must have:
{
  "type": "mcq" | "short" | "tf" | "fill",
  "prompt": "<single sentence or short prompt>",
  "choices": [{"id":"A","text":"..."}, {"id":"B","text":"..."}],  // ONLY for mcq
  "canonical_answer": "A" or "42" or "true",
  "difficulty": 1 to 5,
  "explanation": "short rationale for correct answer",
  "distractor_rationale": {"A":"why wrong", "B":"why wrong"}  // for mcq only
}

Constraints:
- Ensure content is age-appropriate and curriculum-relevant
- No profanity, no biased or political content
- Return strictly valid JSON`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { classroom_id, group_id, subject, grade, difficulty, lesson_context } = await req.json();

    console.log('Generating AI questions:', { classroom_id, group_id, subject, grade, difficulty });

    // Verify authorization
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is teacher of classroom
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroom_id)
      .single();

    if (classroomError || classroom.teacher_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not authorized for this classroom' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const userPrompt = `Grade: ${grade} (3-6)
Topic/lesson: "${lesson_context}"
Subject: ${subject}
Difficulty: ${difficulty}/5

Generate 3 questions following the exact format specified.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    console.log('AI response:', content);

    // Parse and validate AI response
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!parsedQuestions.questions || !Array.isArray(parsedQuestions.questions)) {
      return new Response(JSON.stringify({ error: 'AI response missing questions array' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert questions as unapproved
    const insertedQuestions = [];

    for (const q of parsedQuestions.questions) {
      // Validate required fields
      if (!q.type || !q.prompt || !q.canonical_answer) {
        console.warn('Skipping invalid question:', q);
        continue;
      }

      const { data: question, error: insertError } = await supabase
        .from('questions')
        .insert({
          classroom_id,
          group_id: group_id || null,
          subject,
          grade,
          question_type: q.type,
          question_text: q.prompt,
          answer_text: String(q.canonical_answer),
          options: q.choices || [],
          difficulty: q.difficulty || 3,
          source: 'ai',
          approved: false,
          created_by: user.id,
          explanation: q.explanation,
          distractor_rationale: q.distractor_rationale || {}
        })
        .select()
        .single();

      if (!insertError && question) {
        insertedQuestions.push(question);
      } else {
        console.error('Failed to insert question:', insertError);
      }
    }

    console.log('Inserted', insertedQuestions.length, 'questions');

    return new Response(JSON.stringify({ 
      questions: insertedQuestions,
      count: insertedQuestions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-question-ai:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
