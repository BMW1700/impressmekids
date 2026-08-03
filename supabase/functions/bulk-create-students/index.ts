// Secure bulk student provisioning.
//
// - Admins may provision anywhere in their school; teachers may provision
//   into a classroom they own.
// - Creates the auth account server-side with email confirmation already
//   set, so students never receive an email.
// - Issues a classroom username + 6-digit PIN. The PIN is returned ONCE
//   (so the teacher can print it) and stored only as a PBKDF2 hash.
// - Service-role key never leaves this function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { generatePin, generateSalt, hashPin, uniqueUsername } from '../_shared/studentPin.ts';
import { opLog } from '../_shared/retry.ts';

interface StudentData {
  email?: string;
  student_id?: string;
  full_name: string;
  classroom_code?: string;
  grade?: string;
  username?: string;
}

interface StudentResult {
  identifier: string;
  full_name?: string;
  username?: string;
  pin?: string;           // plaintext, returned once, never stored
  success: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  emailQueued?: boolean;
}

const STUDENT_INTERNAL_DOMAIN = 'student.yubilearn.internal';
const MAX_BATCH = 500;

const isStudentId = (v: string) => /^\d{8}$/.test(v.trim());
const syntheticEmail = (studentId: string) => `${studentId.trim()}@${STUDENT_INTERNAL_DOMAIN}`;

/** Deterministic synthetic email for roster students without an 8-digit ID. */
const rosterEmail = (username: string, classroomId: string) =>
  `${username}.${classroomId.slice(0, 8)}@${STUDENT_INTERNAL_DOMAIN}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: profile } = await adminClient
      .from('profiles').select('role').eq('id', user.id).maybeSingle();

    const callerRole = profile?.role ?? null;
    const isAdmin = callerRole === 'admin' || callerRole === 'super_admin';
    const isTeacher = callerRole === 'teacher';

    if (!isAdmin && !isTeacher) {
      return new Response(
        JSON.stringify({ error: 'Only teachers and administrators can provision students' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { students, sendOnboardingEmails = false } = await req.json() as {
      students: StudentData[];
      sendOnboardingEmails?: boolean;
    };

    if (!Array.isArray(students) || students.length === 0) {
      return new Response(JSON.stringify({ error: 'No students provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (students.length > MAX_BATCH) {
      return new Response(JSON.stringify({ error: `Maximum ${MAX_BATCH} students per chunk` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- Resolve + authorize classrooms up front ----------------------------
    const codes = [...new Set(
      students.map((s) => (s.classroom_code || '').toUpperCase().trim()).filter(Boolean),
    )];
    const classroomByCode = new Map<string, { id: string; teacher_id: string }>();

    if (codes.length > 0) {
      const { data: rooms } = await adminClient
        .from('classrooms').select('id, join_code, teacher_id').in('join_code', codes);
      for (const r of rooms ?? []) {
        classroomByCode.set(String(r.join_code).toUpperCase(), { id: r.id, teacher_id: r.teacher_id });
      }
    }

    if (isTeacher) {
      for (const [code, room] of classroomByCode) {
        if (room.teacher_id !== user.id) {
          return new Response(
            JSON.stringify({ error: `You do not own classroom ${code}` }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
      }
      if (classroomByCode.size === 0) {
        return new Response(
          JSON.stringify({ error: 'Teachers must provide a valid classroom code for each student' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Preload taken usernames per classroom so generated names never collide.
    const takenByClassroom = new Map<string, Set<string>>();
    for (const room of classroomByCode.values()) {
      const { data: existing } = await adminClient
        .from('student_credentials').select('username').eq('classroom_id', room.id);
      takenByClassroom.set(
        room.id,
        new Set((existing ?? []).map((r) => String(r.username).toLowerCase())),
      );
    }

    const results: StudentResult[] = [];

    for (const student of students) {
      const rawEmail = (student.email || '').trim();
      const rawStudentId = (student.student_id || '').trim();
      const fullName = (student.full_name || '').trim();
      const code = (student.classroom_code || '').toUpperCase().trim();
      const classroom = code ? classroomByCode.get(code) : undefined;
      const identifier = rawEmail || rawStudentId || fullName || 'unknown';

      try {
        if (fullName.length < 2) {
          results.push({ identifier, success: false, error: 'Full name required' });
          continue;
        }
        if (code && !classroom) {
          results.push({ identifier, full_name: fullName, success: false, error: `Unknown classroom code ${code}` });
          continue;
        }
        if (rawEmail && !rawEmail.includes('@')) {
          results.push({ identifier, full_name: fullName, success: false, error: 'Invalid email format' });
          continue;
        }
        if (rawStudentId && !isStudentId(rawStudentId)) {
          results.push({ identifier, full_name: fullName, success: false, error: 'student_id must be exactly 8 digits' });
          continue;
        }
        if (!rawEmail && !rawStudentId && !classroom) {
          results.push({
            identifier, full_name: fullName, success: false,
            error: 'Provide an email, an 8-digit student_id, or a classroom code',
          });
          continue;
        }

        // Idempotency on student_id
        if (rawStudentId) {
          const { data: existing } = await adminClient
            .from('profiles').select('id').eq('student_id', rawStudentId).maybeSingle();
          if (existing) {
            results.push({ identifier, full_name: fullName, success: true, skipped: true, reason: 'already_exists' });
            continue;
          }
        }

        const taken = classroom
          ? (takenByClassroom.get(classroom.id) ?? new Set<string>())
          : new Set<string>();
        const username = (student.username || '').toLowerCase().trim() ||
          uniqueUsername(fullName, taken);
        if (classroom) takenByClassroom.set(classroom.id, taken.add(username));

        const authEmail = rawEmail
          ? rawEmail.toLowerCase()
          : rawStudentId
            ? syntheticEmail(rawStudentId)
            : rosterEmail(username, classroom!.id);

        // Long random account password — students never use or see it;
        // they sign in with class code + username + PIN.
        const accountPassword = crypto.randomUUID() + crypto.randomUUID() + 'Aa1!';

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: authEmail,
          password: accountPassword,
          email_confirm: true, // never sends a confirmation email
          user_metadata: {
            full_name: fullName,
            role: 'student',
            ...(rawStudentId ? { student_id: rawStudentId } : {}),
          },
        });

        if (authError) {
          const msg = (authError.message || '').toLowerCase();
          if (msg.includes('already') || msg.includes('registered') || msg.includes('duplicate')) {
            results.push({ identifier, full_name: fullName, success: true, skipped: true, reason: 'already_exists' });
            continue;
          }
          opLog('provision.auth_error', { identifier, message: authError.message });
          results.push({ identifier, full_name: fullName, success: false, error: authError.message });
          continue;
        }

        const newUserId = authData.user?.id;
        if (!newUserId) {
          results.push({ identifier, full_name: fullName, success: false, error: 'Account creation returned no user' });
          continue;
        }

        const profileUpdate: Record<string, unknown> = { is_verified: true, full_name: fullName };
        if (rawStudentId) profileUpdate.student_id = rawStudentId;
        const gradeNum = student.grade ? parseInt(student.grade, 10) : NaN;
        if (!isNaN(gradeNum) && gradeNum >= 0 && gradeNum <= 12) profileUpdate.grade = gradeNum;
        await adminClient.from('profiles').update(profileUpdate).eq('id', newUserId);

        // Role (no client-side privilege escalation path)
        await adminClient
          .from('user_roles')
          .upsert({ user_id: newUserId, role: 'student' }, { onConflict: 'user_id' });

        if (classroom) {
          await adminClient
            .from('classroom_students')
            .insert({ classroom_id: classroom.id, student_id: newUserId });
        }

        // Classroom credential (PIN hashed, plaintext returned once)
        const pin = generatePin();
        const salt = generateSalt();
        const pinHash = await hashPin(pin, salt);

        const { error: credError } = await adminClient.from('student_credentials').insert({
          user_id: newUserId,
          classroom_id: classroom?.id ?? null,
          username,
          pin_hash: pinHash,
          pin_salt: salt,
          created_by: user.id,
        });

        if (credError) {
          opLog('provision.credential_error', { identifier, message: credError.message });
          results.push({ identifier, full_name: fullName, username, success: false, error: credError.message });
          continue;
        }

        let emailQueued = false;
        if (rawEmail && sendOnboardingEmails) {
          try {
            const { error: invokeErr } = await adminClient.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'student-onboarding',
                recipientEmail: authEmail,
                idempotencyKey: `onboarding-${newUserId}`,
                templateData: { fullName, setupUrl: 'https://yubilearn.com/auth' },
              },
            });
            emailQueued = !invokeErr;
          } catch (_e) { /* non-fatal */ }
        }

        results.push({ identifier, full_name: fullName, username, pin, success: true, emailQueued });
      } catch (error) {
        opLog('provision.unexpected', { identifier, message: (error as Error).message });
        results.push({ identifier, full_name: fullName, success: false, error: (error as Error).message });
      }
    }

    const successCount = results.filter((r) => r.success && !r.skipped).length;
    const skippedCount = results.filter((r) => r.skipped).length;
    const failedCount = results.filter((r) => !r.success).length;

    opLog('provision.batch', {
      actor_role: callerRole, total: students.length, successCount, skippedCount, failedCount,
    });

    return new Response(
      JSON.stringify({ results, successCount, skippedCount, failedCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    opLog('provision.fatal', { message: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message || 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
