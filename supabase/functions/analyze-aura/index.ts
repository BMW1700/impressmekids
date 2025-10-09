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
    const { transcript, durationSeconds, audioUrl, contextText, questionId } = await req.json();

    if (!transcript || !durationSeconds) {
      throw new Error('Transcript and duration are required');
    }

    // Initialize Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Calculate basic metrics
    const words = transcript.trim().split(/\s+/).length;
    const wpm = (words / durationSeconds) * 60;
    
    // Calculate pace rating (1-5 scale)
    let pace = 3;
    if (wpm < 100) pace = 2;
    else if (wpm < 130) pace = 3;
    else if (wpm < 160) pace = 4;
    else pace = 5;

    // Estimate pauses and silence
    const pauseCount = (transcript.match(/[.!?]/g) || []).length;
    const avgSilenceMs = (durationSeconds * 1000) / Math.max(pauseCount, 1);

    // Call Lovable AI for deep analysis
    const aiPrompt = `You are an expert speech coach analyzing a student's oral reading performance.

Transcript: "${transcript}"
${contextText ? `Context/Question: "${contextText}"` : ''}

Speaking metrics:
- Duration: ${durationSeconds}s
- Words: ${words}
- WPM: ${wpm.toFixed(1)}
- Pauses: ${pauseCount}

Provide a detailed analysis with:
1. Pronunciation quality (rate 1-5)
2. Clarity score (rate 1-5)
3. Confidence level (rate 1-5)
4. List 3-5 specific pronunciation issues or problem words
5. List 3-5 strengths
6. Provide 3 personalized feedback messages
7. Suggest 3 targeted practice exercises

Format as JSON:
{
  "pronunciation": <1-5>,
  "clarity": <1-5>,
  "confidence": <1-5>,
  "pronunciationFlags": ["word1: issue", "word2: issue"],
  "strengths": ["strength1", "strength2"],
  "feedback": ["message1", "message2", "message3"],
  "suggestedExercises": [
    {"title": "Exercise 1", "description": "details", "difficulty": "easy|medium|hard"},
    ...
  ],
  "evidence": {
    "pace_analysis": "explanation",
    "clarity_analysis": "explanation",
    "confidence_analysis": "explanation"
  }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert speech analysis AI. Always respond with valid JSON.' },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const aiAnalysis = JSON.parse(aiData.choices[0].message.content);

    // Calculate overall grade (weighted average)
    const grade = Math.round(
      (aiAnalysis.pronunciation * 0.3 +
       aiAnalysis.clarity * 0.3 +
       aiAnalysis.confidence * 0.2 +
       pace * 0.2) * 20
    );

    // Store in aura_records
    const { data: record, error: insertError } = await supabase
      .from('aura_records')
      .insert({
        profile_id: user.id,
        transcript,
        audio_url: audioUrl,
        language: 'en',
        duration_s: durationSeconds,
        words,
        wpm,
        pace,
        clarity: aiAnalysis.clarity,
        confidence: aiAnalysis.confidence,
        pronunciation_flags: aiAnalysis.pronunciationFlags || [],
        feedback: aiAnalysis.feedback || [],
        evidence: aiAnalysis.evidence || {},
        suggested_exercises: aiAnalysis.suggestedExercises || [],
        grade,
        pause_count: pauseCount,
        avg_silence_ms: avgSilenceMs,
        asr_confidence: 0.95,
        context_text: contextText,
        question_id: questionId,
        request_id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update student skill vector
    const { data: existingVector } = await supabase
      .from('student_skill_vectors')
      .select('vector')
      .eq('student_id', user.id)
      .single();

    const currentVector = existingVector?.vector || {};
    const updatedVector = {
      ...currentVector,
      pronunciation: aiAnalysis.pronunciation,
      clarity: aiAnalysis.clarity,
      confidence: aiAnalysis.confidence,
      pace,
      last_grade: grade,
      total_recordings: (currentVector.total_recordings || 0) + 1,
    };

    await supabase
      .from('student_skill_vectors')
      .upsert({
        student_id: user.id,
        vector: updatedVector,
        last_updated: new Date().toISOString(),
      });

    return new Response(JSON.stringify({
      success: true,
      record,
      analysis: {
        grade,
        wpm,
        pronunciation: aiAnalysis.pronunciation,
        clarity: aiAnalysis.clarity,
        confidence: aiAnalysis.confidence,
        feedback: aiAnalysis.feedback,
        pronunciationFlags: aiAnalysis.pronunciationFlags,
        suggestedExercises: aiAnalysis.suggestedExercises,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-aura:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
