import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from '../_shared/cors.ts';

interface StudentData {
  email?: string;
  student_id?: string; // 8-digit Student ID for synthetic-email accounts
  full_name: string;
  classroom_code?: string;
  grade?: string;
}

interface StudentResult {
  identifier: string; // email or student_id
  success: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  emailQueued?: boolean;
}

const STUDENT_INTERNAL_DOMAIN = 'student.yubilearn.internal';
const MAX_BATCH = 500;

function isStudentId(v: string): boolean {
  return /^\d{8}$/.test(v.trim());
}

function syntheticEmail(studentId: string): string {
  return `${studentId.trim()}@${STUDENT_INTERNAL_DOMAIN}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin (role lives on profiles in this project)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only administrators can bulk import students' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { students, sendOnboardingEmails = true } = await req.json() as {
      students: StudentData[];
      sendOnboardingEmails?: boolean;
    };

    if (!students || !Array.isArray(students) || students.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No students provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (students.length > MAX_BATCH) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_BATCH} students per chunk` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: StudentResult[] = [];

    for (const student of students) {
      const rawEmail = (student.email || '').trim();
      const rawStudentId = (student.student_id || '').trim();
      const isSidMode = !rawEmail && isStudentId(rawStudentId);
      const isEmailMode = !!rawEmail;
      const identifier = rawEmail || rawStudentId || 'unknown';

      try {
        if (!student.full_name || student.full_name.trim().length < 2) {
          results.push({ identifier, success: false, error: 'Full name required' });
          continue;
        }

        if (!isSidMode && !isEmailMode) {
          results.push({
            identifier,
            success: false,
            error: 'Provide either an email or an 8-digit student_id',
          });
          continue;
        }

        if (isEmailMode && !rawEmail.includes('@')) {
          results.push({ identifier, success: false, error: 'Invalid email format' });
          continue;
        }

        if (rawStudentId && !isSidMode && !isEmailMode) {
          results.push({ identifier, success: false, error: 'student_id must be exactly 8 digits' });
          continue;
        }

        const authEmail = isSidMode ? syntheticEmail(rawStudentId) : rawEmail.toLowerCase();

        // Idempotency: if a profile already exists with this student_id or
        // synthetic email maps to an existing user, skip without error.
        if (isSidMode) {
          const { data: existing } = await adminClient
            .from('profiles')
            .select('id')
            .eq('student_id', rawStudentId)
            .maybeSingle();
          if (existing) {
            results.push({ identifier, success: true, skipped: true, reason: 'already_exists' });
            continue;
          }
        }

        const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!';

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: authEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: student.full_name.trim(),
            role: 'student',
            ...(isSidMode ? { student_id: rawStudentId } : {}),
          },
        });

        if (authError) {
          const msg = (authError.message || '').toLowerCase();
          if (msg.includes('already') || msg.includes('registered') || msg.includes('duplicate')) {
            results.push({ identifier, success: true, skipped: true, reason: 'already_exists' });
            continue;
          }
          results.push({ identifier, success: false, error: authError.message });
          continue;
        }

        const newUserId = authData.user?.id;

        // Persist student_id + verified flag for synthetic accounts
        if (newUserId && isSidMode) {
          await adminClient
            .from('profiles')
            .update({ student_id: rawStudentId, is_verified: true })
            .eq('id', newUserId);
        }

        // Optional: classroom join
        if (newUserId && student.classroom_code) {
          const { data: classroom } = await adminClient
            .from('classrooms')
            .select('id')
            .eq('join_code', student.classroom_code.toUpperCase())
            .maybeSingle();
          if (classroom) {
            await adminClient
              .from('classroom_students')
              .insert({ classroom_id: classroom.id, student_id: newUserId });
          }
        }

        // Optional: grade
        if (newUserId && student.grade) {
          const gradeNum = parseInt(student.grade, 10);
          if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 12) {
            await adminClient
              .from('profiles')
              .update({ grade: gradeNum })
              .eq('id', newUserId);
          }
        }

        // Queue onboarding email via Lovable Emails — ONLY for real-email accounts
        let emailQueued = false;
        if (isEmailMode && sendOnboardingEmails && newUserId) {
          try {
            const { error: invokeErr } = await adminClient.functions.invoke(
              'send-transactional-email',
              {
                body: {
                  templateName: 'student-onboarding',
                  recipientEmail: authEmail,
                  idempotencyKey: `onboarding-${newUserId}`,
                  templateData: {
                    fullName: student.full_name.trim(),
                    setupUrl: 'https://yubilearn.com/auth',
                  },
                },
              },
            );
            emailQueued = !invokeErr;
            if (invokeErr) {
              console.warn('Onboarding email enqueue failed for', authEmail, invokeErr.message);
            }
          } catch (e) {
            console.warn('Onboarding email enqueue exception:', (e as Error).message);
          }
        }

        results.push({ identifier, success: true, emailQueued });
      } catch (error: any) {
        console.error('Unexpected error for:', identifier, error);
        results.push({ identifier, success: false, error: error.message || 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success && !r.skipped).length;
    const skippedCount = results.filter(r => r.skipped).length;
    const failedCount = results.filter(r => !r.success).length;
    const emailsQueued = results.filter(r => r.emailQueued).length;

    console.log(
      `Bulk import: ${successCount} created, ${skippedCount} skipped, ${failedCount} failed, ${emailsQueued} emails queued`,
    );

    return new Response(
      JSON.stringify({ results, successCount, skippedCount, failedCount, emailsQueued }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Bulk create students error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
