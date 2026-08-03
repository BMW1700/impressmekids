// Teacher/admin-controlled student PIN reset + username change.
//
// Returns the new plaintext PIN exactly once so the teacher can hand it
// to the student. Only the PBKDF2 hash is persisted.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { generatePin, generateSalt, hashPin, isValidPin, isValidUsername } from '../_shared/studentPin.ts';
import { opLog } from '../_shared/retry.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await caller.auth.getUser();
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });

    const { data: profile } = await admin
      .from('profiles').select('role').eq('id', user.id).maybeSingle();
    const role = profile?.role ?? null;
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin && role !== 'teacher') return json({ error: 'Not allowed' }, 403);

    const body = await req.json().catch(() => ({}));
    const studentUserId = String(body?.student_user_id ?? '').trim();
    const newUsername = String(body?.new_username ?? '').toLowerCase().trim();
    const explicitPin = String(body?.pin ?? '').trim();

    if (!/^[0-9a-f-]{36}$/i.test(studentUserId)) return json({ error: 'Invalid student id' }, 400);
    if (newUsername && !isValidUsername(newUsername)) return json({ error: 'Invalid username' }, 400);
    if (explicitPin && !isValidPin(explicitPin)) return json({ error: 'PIN must be 6 digits' }, 400);

    const { data: cred } = await admin
      .from('student_credentials')
      .select('id, classroom_id')
      .eq('user_id', studentUserId)
      .maybeSingle();

    if (!cred) return json({ error: 'This student has no classroom login yet' }, 404);

    if (!isAdmin) {
      if (!cred.classroom_id) return json({ error: 'Not allowed' }, 403);
      const { data: room } = await admin
        .from('classrooms').select('teacher_id').eq('id', cred.classroom_id).maybeSingle();
      if (!room || room.teacher_id !== user.id) return json({ error: 'Not allowed' }, 403);
    }

    const pin = explicitPin || generatePin();
    const salt = generateSalt();
    const pin_hash = await hashPin(pin, salt);

    const update: Record<string, unknown> = {
      pin_hash, pin_salt: salt, failed_attempts: 0, locked_until: null, must_reset: false,
    };
    if (newUsername) update.username = newUsername;

    const { error: updErr } = await admin
      .from('student_credentials').update(update).eq('id', cred.id);

    if (updErr) {
      const dup = (updErr.message || '').includes('duplicate');
      return json({ error: dup ? 'That username is already used in this class' : updErr.message }, 400);
    }

    opLog('pin_reset.success', { actor_role: role, classroom_id: cred.classroom_id });
    return json({ success: true, pin, username: newUsername || undefined });
  } catch (e) {
    opLog('pin_reset.fatal', { message: (e as Error).message });
    return json({ error: 'Internal server error' }, 500);
  }
});
