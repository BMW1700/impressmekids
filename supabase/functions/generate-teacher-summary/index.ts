import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { classroom_id } = await req.json();

    // Verify teacher owns classroom
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, name, teacher_id')
      .eq('id', classroom_id)
      .eq('teacher_id', user.id)
      .single();

    if (classroomError || !classroom) {
      throw new Error('Classroom not found or access denied');
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

    // For each student, aggregate their data
    for (const student of students) {
      const studentId = student.student_id;
      const studentName = student.profiles?.full_name || 'Unknown';

      // Get assignments for this student
      const { data: submissions } = await supabase
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
        .in('assignment_id', 
          supabase
            .from('assignments')
            .select('id')
            .eq('classroom_id', classroom_id)
        );

      // Get AURA records for this student
      const { data: auraRecords } = await supabase
        .from('aura_records')
        .select('clarity, pace, confidence, feedback, question_id')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);

      const assignments: AssignmentWithAura[] = [];

      if (submissions) {
        for (const sub of submissions) {
          const assignment = sub.assignments;
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

      studentsData.push({
        profile_id: studentId,
        name: studentName,
        assignments
      });
    }

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI Teacher Assistant for the Impress Me Kids program. Your role is to provide clear, actionable, and kind summaries of student progress for teachers. You must output strict JSON with all requested fields. Never include commentary outside JSON. Tone must be supportive and professional.`;

    const userPrompt = `Classroom: ${classroom_id}
Teacher: ${user.id}
Students: ${JSON.stringify(studentsData, null, 2)}

TASK:
For each student, evaluate:
- Which subjects/assignments they excel at
- Which subjects/assignments they struggle with
- AURA feedback trends (clarity, pace, confidence)
- Completion trends (missing assignments, on-time vs late)
- Overall recommendations (specific, actionable)

Also provide class-level insights:
- Top performers
- Students at risk
- General subject trends
- Patterns worth noting

OUTPUT:
Return strict JSON only with the following schema:
{
  "class_summary": {
    "top_performers": ["Student Name"],
    "students_at_risk": ["Student Name"],
    "subject_trends": {
      "Math": {"average_score": 87, "students_struggling": ["Name"]}
    },
    "general_notes": "max 100 words"
  },
  "students": [
    {
      "profile_id": "uuid",
      "name": "Student Name",
      "strengths": ["Math", "Reading Fluency"],
      "struggles": ["Spelling", "Speaking Pace"],
      "completion_summary": "Completed 5/6 assignments, 1 late",
      "aura_summary": {
        "clarity": 4,
        "pace": 3,
        "confidence": 5,
        "feedback": ["Try pausing after commas"]
      },
      "actionable_recommendations": ["Assign extra reading", "1-on-1 practice"]
    }
  ]
}

RULES:
- Concise, actionable insights
- Limit text to <100 words
- Valid JSON always
- Include both AURA and assignment data
- Constructive, professional tone`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summaryText = aiData.choices[0].message.content;
    let summaryData;

    try {
      summaryData = JSON.parse(summaryText);
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
