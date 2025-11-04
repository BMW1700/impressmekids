import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { classroomIdSchema, validateInput } from "../_shared/validation.ts";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignmentWithAura {
  assignment_id: string;
  title: string;
  subject: string;
  completed: boolean;
  score: number | null;
  feedback: string | null;
  aura_metrics: {
    clarity: number;
    pace: number;
    confidence: number;
    feedback: string[];
  } | null;
}

interface StudentData {
  profile_id: string;
  name: string;
  assignments: AssignmentWithAura[];
  skillVector?: {
    phoneme_scores?: Record<string, number>;
    prosody_metrics?: any;
    fluency_metrics?: any;
  };
  auraMetrics?: {
    avgWpm?: number;
    avgPauseCount?: number;
    avgSilenceMs?: number;
    pronunciationFlags?: any[];
    prosodyData?: any;
  };
}

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

    // SECURITY: Use ANON key with RLS instead of service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[AUTH] Invalid token:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Rate limiting (100 requests per minute per user)
    const rateLimitResult = await checkRateLimit(user.id, 'generate-teacher-summary', RATE_LIMITS.AI_FUNCTION);
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
    const validation = validateInput(classroomIdSchema, body);
    if (!validation.success) {
      console.error('[VALIDATION] Input validation failed:', validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { classroom_id } = validation.data;

    // Check for recent summary (rate limiting: 1 per day)
    const { data: recentSummary } = await supabase
      .from('teacher_summaries')
      .select('*')
      .eq('classroom_id', classroom_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If summary exists from last 24 hours, validate structure before returning
    if (recentSummary) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const summaryDate = new Date(recentSummary.generated_at);
      
      if (summaryDate > oneDayAgo) {
        // SMART CACHE INVALIDATION: Check if cached summary has correct structure
        const summaryData = recentSummary.summary_data as any;
        
        // Validate that the summary has the required class_summary field
        if (summaryData && summaryData.class_summary) {
          const hoursAgo = Math.floor((Date.now() - summaryDate.getTime()) / (1000 * 60 * 60));
          console.log(`[CACHE] Returning valid cached summary from ${hoursAgo}h ago for classroom ${classroom_id}`);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              summary: recentSummary,
              data: recentSummary.summary_data,
              cached: true,
              hours_ago: hoursAgo
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Cached summary has outdated structure - regenerate
          console.warn(`[CACHE] Invalidating cached summary with outdated structure for classroom ${classroom_id}`);
        }
      }
    }

    // SECURITY: RLS will enforce teacher owns classroom
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, name, teacher_id')
      .eq('id', classroom_id)
      .single();

    if (classroomError || !classroom) {
      console.error('[AUTH] Classroom access denied or not found');
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all students in classroom
    const { data: students, error: studentsError } = await supabase
      .from('classroom_students')
      .select(`
        student_id,
        profiles!classroom_students_student_id_fkey (
          id,
          full_name
        )
      `)
      .eq('classroom_id', classroom_id);

    if (studentsError) {
      throw new Error('Failed to fetch students');
    }

    const studentsData: StudentData[] = [];

    // Get all assignment IDs for this classroom first
    const { data: classroomAssignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('classroom_id', classroom_id);

    const assignmentIds = classroomAssignments?.map(a => a.id) || [];

    // For each student, aggregate their data
    for (const student of students) {
      const studentId = student.student_id;
      const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles;
      const studentName = profile?.full_name || 'Unknown';

      // Get assignments for this student - only if there are assignments in the classroom
      let submissions = null;
      if (assignmentIds.length > 0) {
        const result = await supabase
          .from('assignment_submissions')
          .select(`
            id,
            assignment_id,
            status,
            grade,
            assignments (
              id,
              title,
              assignment_type
            )
          `)
          .eq('student_id', studentId)
          .in('assignment_id', assignmentIds);
        submissions = result.data;
      }

      // Get AURA records for this student with detailed metrics
      const { data: auraRecords } = await supabase
        .from('aura_records')
        .select(`
          clarity, pace, confidence, feedback, question_id,
          wpm, pause_count, avg_silence_ms,
          pronunciation_flags,
          prosody_metrics
        `)
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get skill vector for phoneme-level analysis
      const { data: skillVector } = await supabase
        .from('student_skill_vectors')
        .select('phoneme_scores, prosody_metrics, fluency_metrics')
        .eq('student_id', studentId)
        .maybeSingle();

      const assignments: AssignmentWithAura[] = [];

      if (submissions) {
        for (const sub of submissions) {
          const assignment = Array.isArray(sub.assignments) ? sub.assignments[0] : sub.assignments;
          if (!assignment) continue;

          // Find AURA metrics for this assignment if any
          let auraMetrics = null;
          if (auraRecords && auraRecords.length > 0) {
            const avgClarity = Math.round(
              auraRecords.reduce((sum, r) => sum + r.clarity, 0) / auraRecords.length
            );
            const avgPace = Math.round(
              auraRecords.reduce((sum, r) => sum + r.pace, 0) / auraRecords.length
            );
            const avgConfidence = Math.round(
              auraRecords.reduce((sum, r) => sum + r.confidence, 0) / auraRecords.length
            );

            const allFeedback = auraRecords
              .flatMap(r => r.feedback || [])
              .filter(f => typeof f === 'string');

            auraMetrics = {
              clarity: avgClarity,
              pace: avgPace,
              confidence: avgConfidence,
              feedback: allFeedback.slice(0, 5)
            };
          }

          assignments.push({
            assignment_id: assignment.id,
            title: assignment.title,
            subject: assignment.assignment_type || 'General',
            completed: sub.status === 'submitted' || sub.status === 'graded',
            score: sub.grade || null,
            feedback: null,
            aura_metrics: auraMetrics
          });
        }
      }

      // Calculate aggregate AURA metrics
      let auraMetrics = undefined;
      if (auraRecords && auraRecords.length > 0) {
        const validWpm = auraRecords.filter(r => r.wpm).map(r => r.wpm);
        const validPauses = auraRecords.filter(r => r.pause_count !== null).map(r => r.pause_count);
        const validSilence = auraRecords.filter(r => r.avg_silence_ms !== null).map(r => r.avg_silence_ms);
        
        auraMetrics = {
          avgWpm: validWpm.length > 0 ? Math.round(validWpm.reduce((a, b) => a + b, 0) / validWpm.length) : undefined,
          avgPauseCount: validPauses.length > 0 ? Math.round(validPauses.reduce((a, b) => a + b, 0) / validPauses.length) : undefined,
          avgSilenceMs: validSilence.length > 0 ? Math.round(validSilence.reduce((a, b) => a + b, 0) / validSilence.length) : undefined,
          pronunciationFlags: auraRecords.flatMap(r => r.pronunciation_flags || []).slice(0, 5),
          prosodyData: auraRecords[0]?.prosody_metrics
        };
      }

      studentsData.push({
        profile_id: studentId,
        name: studentName,
        assignments,
        skillVector: skillVector || undefined,
        auraMetrics
      });
    }

    // Call Vertex AI for analysis
    const systemPrompt = `You are an AI Teacher Assistant for the Impress Me Kids program. You must return ONLY valid JSON in this exact structure:
{
  "class_summary": {
    "top_performers": ["Student Name 1", "Student Name 2"],
    "students_at_risk": ["Student Name 3"],
    "subject_trends": {"Math": {"average_score": 85, "students_struggling": ["Student Name 4"]}},
    "general_notes": "Overall class performance summary"
  },
  "students": [
    {
      "profile_id": "uuid",
      "name": "Student Name",
      "strengths": ["Strong in reading"],
      "struggles": ["Needs help with math"],
      "completion_summary": "Completed 5/8 assignments",
      "aura_summary": {"clarity": 4, "pace": 3, "confidence": 5, "feedback": ["Great pronunciation"]},
      "phoneme_analysis": {"struggling_sounds": ["th"], "mastered_sounds": ["s", "r"]},
      "fluency_metrics": {"wpm": 120, "wpm_trend": "increasing", "grade_level_comparison": "Above grade level"},
      "actionable_recommendations": ["Practice th sounds", "Continue reading practice"]
    }
  ]
}

CRITICAL: Return ONLY the JSON object. No markdown, no code blocks, no extra text.`;

    const userPrompt = `Analyze this classroom data and return the JSON structure exactly as specified:

Classroom ID: ${classroom_id}
Students Data: ${JSON.stringify(studentsData, null, 2)}

Provide actionable insights for each student based on their assignments and AURA metrics.`;

    // Import Vertex AI helper
    const { callVertexAI } = await import('../_shared/vertexAuth.ts');
    
    const summaryText = await callVertexAI(userPrompt, systemPrompt, {
      model: 'gemini-2.5-flash-lite',
      temperature: 0.7,
    });
    let summaryData;

    try {
      // Clean markdown code fences if present
      let cleanedText = summaryText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7); // Remove ```json
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3); // Remove ```
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3); // Remove trailing ```
      }
      cleanedText = cleanedText.trim();
      
      summaryData = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', summaryText);
      throw new Error('Invalid JSON response from AI');
    }

    // Store summary in database
    const { data: savedSummary, error: saveError } = await supabase
      .from('teacher_summaries')
      .insert({
        classroom_id,
        teacher_id: user.id,
        summary_data: summaryData,
        students_count: studentsData.length,
        assignments_analyzed: studentsData.reduce((sum, s) => sum + s.assignments.length, 0),
        aura_records_analyzed: studentsData.reduce((sum, s) => 
          sum + (s.assignments.filter(a => a.aura_metrics).length), 0
        )
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save summary:', saveError);
      throw new Error('Failed to save summary');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: savedSummary,
        data: summaryData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-teacher-summary:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
