import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { simpleG2PFallback, arpabetToIPAPhonemes } from "./_shared/cmuDictUtils.ts";
import { calculatePhonemeAccuracy } from "./_shared/phonemeDistance.ts";
import cmudict from "npm:cmu-pronouncing-dictionary@3.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      transcript, 
      durationSeconds, 
      audioUrl, 
      contextText, 
      questionId,
      audioFeatures,
      phonemes 
    } = await req.json();

    if (!transcript || !durationSeconds) {
      throw new Error('Transcript and duration are required');
    }

    console.log('🎯 AURA AI Analysis Starting...');
    console.log('Audio features received:', !!audioFeatures);
    console.log('Phonemes received:', phonemes?.length || 0);

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

    // Use enhanced pause analysis if available
    let pauseCount = (transcript.match(/[.!?]/g) || []).length;
    let avgSilenceMs = (durationSeconds * 1000) / Math.max(pauseCount, 1);
    
    if (audioFeatures?.pauseCount) {
      pauseCount = audioFeatures.pauseCount;
      avgSilenceMs = audioFeatures.avgSilenceDuration;
    }

    // Analyze phoneme accuracy with CMUDict + FUZZY MATCHING
    let phonemeAccuracy = 85; // Default baseline
    let problematicPhonemes: string[] = [];
    let perPhonemeAccuracy: Array<{ phoneme: string; accuracy: number }> = [];
    
    if (phonemes && phonemes.length > 0) {
      const words = transcript.toLowerCase().split(/\s+/);
      
      // Use CMUDict for accurate G2P conversion
      const expectedPhonemes = words.flatMap((word: string) => {
        const normalized = word.replace(/[^a-z]/g, '');
        if (!normalized) return [];
        
        // Try CMUDict first
        const arpabet = (cmudict as any)[normalized] as string | undefined;
        if (arpabet) {
          return arpabetToIPAPhonemes(arpabet);
        }
        
        // Fallback to simple G2P
        return simpleG2PFallback(normalized);
      });
      
      // Use feature-based phoneme distance for fuzzy matching
      const detectedPhonemes = phonemes.map((p: any) => p.phoneme);
      const result = calculatePhonemeAccuracy(detectedPhonemes, expectedPhonemes);
      
      phonemeAccuracy = result.accuracy;
      problematicPhonemes = result.problematicPhonemes;
      
      // Calculate per-phoneme accuracy for tracking
      const uniquePhonemes = [...new Set(expectedPhonemes)] as string[];
      perPhonemeAccuracy = uniquePhonemes.map((phoneme: string) => {
        const expectedCount = expectedPhonemes.filter((p: string) => p === phoneme).length;
        const detectedCount = detectedPhonemes.filter((p: string) => p === phoneme).length;
        const accuracy = Math.min(100, (detectedCount / expectedCount) * 100);
        return { phoneme, accuracy };
      });
      
      console.log('✅ Phoneme accuracy (CMUDict + fuzzy):', phonemeAccuracy.toFixed(1), '%');
      console.log('⚠️ Problematic phonemes:', problematicPhonemes);
      console.log('📊 Per-phoneme accuracy:', perPhonemeAccuracy);
    }

    // Build enhanced AI prompt with phoneme and audio feature data
    let phonemeSection = '';
    if (phonemes && phonemes.length > 0) {
      const phonemeSummary = phonemes.slice(0, 20).map((p: any) => 
        `${p.phoneme} (${p.timestamp.toFixed(1)}s, conf: ${(p.confidence * 100).toFixed(0)}%)`
      ).join(', ');
      
      phonemeSection = `
PHONEME ANALYSIS (Browser-side AI detection):
- Total phonemes detected: ${phonemes.length}
- Overall phoneme accuracy: ${phonemeAccuracy.toFixed(1)}%
- Sample phonemes: ${phonemeSummary}
${problematicPhonemes.length > 0 ? `- Problematic sounds: ${problematicPhonemes.join(', ')}` : ''}
`;
    }

    let audioSection = '';
    if (audioFeatures) {
      audioSection = `
AUDIO FEATURES (Real-time analysis):
- Average pitch: ${audioFeatures.avgPitch.toFixed(1)} Hz
- Pitch variance: ${audioFeatures.pitchVariance.toFixed(2)}
- Average energy: ${audioFeatures.avgEnergy.toFixed(3)}
- Energy consistency: ${(100 - Math.min(100, (audioFeatures.energyVariance / audioFeatures.avgEnergy) * 100)).toFixed(1)}%
- Zero crossing rate: ${audioFeatures.zcr.toFixed(2)}
- Spectral centroid: ${audioFeatures.spectralCentroid.toFixed(1)} Hz
- Prosody score: ${audioFeatures.prosodyScore || 'N/A'}
`;
    }

    // Call Lovable AI for deep analysis with enhanced data
    const aiPrompt = `You are an expert speech coach with expertise in phonetics, prosody, and public speaking. Analyze this student's speech performance using advanced acoustic and linguistic data.

TRANSCRIPT: "${transcript}"
${contextText ? `\nCONTEXT/QUESTION: "${contextText}"` : ''}

BASIC METRICS:
- Duration: ${durationSeconds}s
- Words: ${words}
- Speaking rate: ${wpm.toFixed(1)} WPM
- Pauses: ${pauseCount} (avg ${avgSilenceMs.toFixed(0)}ms silence)
${phonemeSection}${audioSection}

Based on this comprehensive data, provide a detailed analysis with:
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

    // Store in aura_records with per-phoneme tracking
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
        evidence: {
          ...aiAnalysis.evidence,
          phoneme_accuracy: perPhonemeAccuracy, // Store per-phoneme data for tracking
        },
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

    // Update student skill vector with enhanced metrics
    const { data: existingVector } = await supabase
      .from('student_skill_vectors')
      .select('*')
      .eq('student_id', user.id)
      .single();

    const currentVector = existingVector?.vector || {};
    const currentPhonemeScores = existingVector?.phoneme_scores || {};
    const currentProsodyMetrics = existingVector?.prosody_metrics || {};
    const currentFluencyMetrics = existingVector?.fluency_metrics || {};
    
    // Update phoneme scores with ACTUAL ACCURACY PERCENTAGES (not decrements)
    const updatedPhonemeScores = { ...currentPhonemeScores };
    
    // Store per-phoneme accuracy as percentages
    perPhonemeAccuracy.forEach(({ phoneme, accuracy }) => {
      // Use exponential moving average for smooth tracking
      const currentScore = updatedPhonemeScores[phoneme] || 75;
      const alpha = 0.3; // Weight new data at 30%
      updatedPhonemeScores[phoneme] = Math.round(alpha * accuracy + (1 - alpha) * currentScore);
    });
    
    updatedPhonemeScores['overall'] = Math.round(phonemeAccuracy);
    
    // Update prosody metrics
    const updatedProsodyMetrics = {
      ...currentProsodyMetrics,
      avg_pitch: audioFeatures?.avgPitch || currentProsodyMetrics.avg_pitch,
      pitch_variance: audioFeatures?.pitchVariance || currentProsodyMetrics.pitch_variance,
      prosody_score: audioFeatures?.prosodyScore || currentProsodyMetrics.prosody_score,
    };
    
    // Update fluency metrics
    const updatedFluencyMetrics = {
      ...currentFluencyMetrics,
      avg_wpm: wpm,
      pause_frequency: pauseCount / durationSeconds,
      avg_silence_ms: avgSilenceMs,
    };
    
    // Calculate weekly improvement
    const prevGrade = currentVector.last_grade || grade;
    const weeklyImprovement = grade - prevGrade;

    const updatedVector = {
      ...currentVector,
      pronunciation: aiAnalysis.pronunciation,
      clarity: aiAnalysis.clarity,
      confidence: aiAnalysis.confidence,
      pace,
      phoneme_accuracy: phonemeAccuracy,
      last_grade: grade,
      total_recordings: (currentVector.total_recordings || 0) + 1,
    };

    await supabase
      .from('student_skill_vectors')
      .upsert({
        student_id: user.id,
        vector: updatedVector,
        phoneme_scores: updatedPhonemeScores,
        prosody_metrics: updatedProsodyMetrics,
        fluency_metrics: updatedFluencyMetrics,
        weekly_improvement: weeklyImprovement,
        last_updated: new Date().toISOString(),
      });
      
    console.log('✅ Skill vector updated with phoneme and prosody data');

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
        problematicPhonemes, // Add for practice generator
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
