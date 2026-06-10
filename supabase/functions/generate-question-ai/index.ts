import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { generateQuestionSchema, validateInput } from '../_shared/validation.ts';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../_shared/rateLimiter.ts';

import { corsHeaders } from '../_shared/cors.ts';

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

    const requestData = await req.json();

    // Validate input with Zod
    const validation = validateInput(generateQuestionSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { classroom_id, group_id, subject, grade, difficulty, lesson_context } = validation.data;

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

    // SECURITY: Rate limiting (100 requests per minute per user)
    const rateLimitResult = await checkRateLimit(user.id, 'generate-question-ai');
    if (!rateLimitResult.allowed) {
      console.warn('[RATE_LIMIT] Rate limit exceeded:', user.id);
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

    // Call Vertex AI
    const userPrompt = `Grade: ${grade} (3-6)
Topic/lesson: "${lesson_context}"
Subject: ${subject}
Difficulty: ${difficulty}/5

Generate 3 questions following the exact format specified.`;

    // Import Vertex AI helper + PII scrubber (FERPA/COPPA defense-in-depth)
    const { callVertexAI } = await import('../_shared/vertexAuth.ts');
    const { scrubPII } = await import('../_shared/pseudonymize.ts');

    const content = await callVertexAI(scrubPII(userPrompt), SYSTEM_PROMPT, {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
    });

    console.log('AI response:', content);

    // Strip markdown code fences if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7); // Remove ```json
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3); // Remove ```
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3); // Remove trailing ```
    }
    cleanedContent = cleanedContent.trim();

    // Parse and validate AI response
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      console.error('Raw content:', content);
      console.error('Cleaned content:', cleanedContent);
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

    // Map numeric difficulty to enum
    const mapDifficultyToEnum = (difficultyNum: number): string => {
      if (difficultyNum <= 2) return 'easy';
      if (difficultyNum <= 3) return 'medium';
      return 'hard';
    };

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
          difficulty: q.difficulty ? mapDifficultyToEnum(q.difficulty) : 'medium',
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
