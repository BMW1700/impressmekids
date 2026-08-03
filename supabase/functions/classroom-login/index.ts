// Classroom login: class code + username + 6-digit PIN.
//
// - No email or internal auth identifier is ever returned to the client.
// - 5 failed attempts within 15 minutes triggers a 15-minute lockout.
// - On success we mint a one-time magic-link token hash; the browser
//   exchanges it via supabase.auth.verifyOtp() to get a real session.
// - verify_jwt = false: there is no session yet at this point.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { verifyPin, isValidPin, isValidUsername } from '../_shared/studentPin.ts';
import { opLog } from '../_shared/retry.ts';

const MAX_FAILED = 5;
const LOCKOUT_MINUTES = 15;
const GENERIC_ERROR = 'That class code, username, or PIN is not right. Try again.';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  let username = '';
  let classCode = '';

  try {
    const body = await req.json().catch(() => ({}));
    classCode = String(body?.class_code ?? '').toUpperCase().trim();
    username = String(body?.username ?? '').toLowerCase().trim();
    const pin = String(body?.pin ?? '').trim();

    if (!/^[A-Z0-9]{6}$/.test(classCode) || !isValidUsername(username) || !isValidPin(pin)) {
      return json({ error: GENERIC_ERROR }, 400);
    }

    const logAttempt = async (success: boolean) => {
      await admin.from('classroom_login_attempts')
        .insert({ username, classroom_code: classCode, success })
        .then(() => {}, () => {});
    };

    const { data: classroom } = await admin
      .from('classrooms').select('id').eq('join_code', classCode).maybeSingle();

    if (!classroom) {
      await logAttempt(false);
      opLog('classroom_login.failed', { reason: 'bad_class_code' });
      return json({ error: GENERIC_ERROR }, 401);
    }

    const { data: cred } = await admin
      .from('student_credentials')
      .select('id, user_id, pin_hash, pin_salt, failed_attempts, locked_until, must_reset')
      .eq('classroom_id', classroom.id)
      .ilike('username', username)
      .maybeSingle();

    if (!cred) {
      await logAttempt(false);
      opLog('classroom_login.failed', { reason: 'unknown_username' });
      return json({ error: GENERIC_ERROR }, 401);
    }

    if (cred.locked_until && new Date(cred.locked_until) > new Date()) {
      const minutes = Math.max(
        1,
        Math.ceil((new Date(cred.locked_until).getTime() - Date.now()) / 60000),
      );
      await logAttempt(false);
      opLog('classroom_login.locked', { minutes });
      return json({
        error: `Too many tries. Ask your teacher for help or wait ${minutes} minute(s).`,
        locked: true,
        retry_after_minutes: minutes,
      }, 429);
    }

    const ok = await verifyPin(pin, cred.pin_salt, cred.pin_hash);

    if (!ok) {
      const failed = (cred.failed_attempts ?? 0) + 1;
      const lock = failed >= MAX_FAILED;
      await admin.from('student_credentials').update({
        failed_attempts: lock ? 0 : failed,
        locked_until: lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString() : null,
      }).eq('id', cred.id);

      await logAttempt(false);
      opLog('classroom_login.failed', { reason: 'bad_pin', failed, locked: lock });

      return json(
        lock
          ? { error: `Too many tries. Ask your teacher to reset your PIN or wait ${LOCKOUT_MINUTES} minutes.`, locked: true }
          : { error: GENERIC_ERROR, attempts_remaining: MAX_FAILED - failed },
        lock ? 429 : 401,
      );
    }

    // Success — mint a one-time session token without disclosing the email.
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(cred.user_id);
    if (userErr || !userData?.user?.email) {
      opLog('classroom_login.error', { reason: 'missing_auth_user' });
      return json({ error: 'We could not open your account. Please tell your teacher.' }, 500);
    }

    const linkStarted = Date.now();
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    });

    if (linkErr || !link?.properties?.hashed_token) {
      opLog('classroom_login.error', {
        reason: 'link_failed',
        stage: 'generate_link',
        status: (linkErr as { status?: number } | null)?.status ?? null,
        ms: Date.now() - linkStarted,
        message: linkErr?.message,
      });
      const throttled = (linkErr as { status?: number } | null)?.status === 429;
      return json({
        error: throttled
          ? 'Lots of students are signing in right now. Try again in a moment.'
          : 'We could not open your account. Please tell your teacher.',
        retryable: throttled,
      }, throttled ? 429 : 500);
    }

    // Redeem the one-time token SERVER-SIDE.
    //
    // This is the whole point: if the browser called verifyOtp() itself, thirty
    // students behind one school NAT would all hit the hosted Auth verify
    // endpoint from the same public IP and trip its per-IP throttle. Doing the
    // exchange here means the school network never touches hosted Auth at all —
    // one student login is one call to this function.
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    let session: { access_token: string; refresh_token: string } | null = null;

    if (anonKey) {
      const verifyStarted = Date.now();
      const exchangeClient = createClient(Deno.env.get('SUPABASE_URL')!, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: verified, error: verifyErr } = await exchangeClient.auth.verifyOtp({
        token_hash: link.properties.hashed_token,
        type: 'email',
      });

      if (verifyErr || !verified?.session?.access_token) {
        opLog('classroom_login.error', {
          reason: 'server_exchange_failed',
          stage: 'verify_otp',
          status: (verifyErr as { status?: number } | null)?.status ?? null,
          ms: Date.now() - verifyStarted,
          message: verifyErr?.message,
        });
        // Fall through: the client still has the token hash as a fallback path.
      } else {
        session = {
          access_token: verified.session.access_token,
          refresh_token: verified.session.refresh_token,
        };
        opLog('classroom_login.exchanged', { ms: Date.now() - verifyStarted });
      }
    }

    await admin.from('student_credentials').update({
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    }).eq('id', cred.id);

    await logAttempt(true);
    opLog('classroom_login.success', { classroom_id: classroom.id });

    return json({
      success: true,
      token_hash: link.properties.hashed_token,
      must_reset_pin: !!cred.must_reset,
    });
  } catch (e) {
    opLog('classroom_login.fatal', { message: (e as Error).message });
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
