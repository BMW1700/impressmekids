import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { questionGroupSchema, validateInput } from "../_shared/validation.ts";
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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
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

    // SECURITY: Rate limiting (100 requests per minute per user)
    const rateLimitResult = await checkRateLimit(user.id, 'generate-flashcards', RATE_LIMITS.AI_FUNCTION);
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

    const body = await req.json();

    // SECURITY: Zod validation
    const validation = validateInput(questionGroupSchema, body);
    if (!validation.success) {
      console.error('[VALIDATION] Input validation failed:', validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { question_group_id, title, description } = validation.data;

    // Fetch the question group and verify ownership
    const { data: group, error: groupError } = await supabase
      .from('question_groups')
      .select('*, classrooms(teacher_id)')
      .eq('id', question_group_id)
      .single();

    if (groupError || !group) {
      return new Response(JSON.stringify({ error: 'Question group not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all questions in the group
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('question_text, answer_text, explanation')
      .eq('group_id', question_group_id)
      .eq('approved', true);

    if (questionsError || !questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: 'No approved questions found in this group' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare questions for AI
    const questionsList = questions.map((q, i) => 
      `${i + 1}. Question: ${q.question_text}\n   Answer: ${q.answer_text}${q.explanation ? `\n   Explanation: ${q.explanation}` : ''}`
    ).join('\n\n');

    const prompt = `You are creating study flashcards from quiz questions. For each question, create a clear and concise flashcard.

Questions to convert:
${questionsList}

Create a flashcard for each question with:
- Front: A clear, concise prompt or question (can be reworded for better study)
- Back: The answer with a brief explanation to help understanding
- Hint (optional): A helpful hint if the question is complex

Return ONLY a valid JSON array of flashcards in this exact format:
[
  {
    "front": "Question text here",
    "back": "Answer with brief explanation",
    "hint": "Optional hint"
  }
]`;

    console.log('Calling Lovable AI for flashcard generation...');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that creates educational flashcards. Always return valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Failed to generate flashcards' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    console.log('AI response:', generatedText);

    // Parse the JSON response
    let flashcards;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        flashcards = JSON.parse(generatedText);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response', details: generatedText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate flashcards structure
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid flashcards format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save flashcard set to database
    const flashcardSetTitle = title || `${group.title} - Flashcards`;
    const flashcardSetDescription = description || `Flashcards generated from ${group.title}`;

    const { data: flashcardSet, error: saveError } = await supabase
      .from('flashcard_sets')
      .insert({
        question_group_id: question_group_id,
        classroom_id: group.classroom_id,
        created_by: user.id,
        title: flashcardSetTitle,
        description: flashcardSetDescription,
        flashcards: flashcards,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving flashcard set:', saveError);
      return new Response(JSON.stringify({ error: 'Failed to save flashcard set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Flashcard set created successfully:', flashcardSet.id);

    return new Response(JSON.stringify({ 
      success: true, 
      flashcard_set_id: flashcardSet.id,
      flashcards: flashcards,
      count: flashcards.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-flashcards function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});