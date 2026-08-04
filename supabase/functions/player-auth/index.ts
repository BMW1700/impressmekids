// player-auth — signup + login for the main (game) portal, executed server-side.
//
// Why this exists: hosted Auth throttles per public IP. Thirty kids in one
// classroom share one IP, and the sign-up/sign-in endpoint tops out around
// 30 requests / 5 minutes per IP. Doing the auth call here means the school
// network talks only to this function; the hosted Auth call originates from
// the function's egress instead of the classroom.
//
// verify_jwt = false: there is no session yet at this point.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const STUDENT_DOMAIN = "student.yubilearn.internal";
// Per-student bucket for the sign-in rate RPC. A shared constant would make
// its "network" limit global — 10 failures anywhere locks out every child.
const bucketFor = (studentId: string) => `sid-${studentId}`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isStudentId = (v: string) => /^\d{8}$/.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

const anon = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

interface Session {
  access_token: string;
  refresh_token: string;
}

/** Mint a session for a known user without a password round-trip. */
async function mintSession(email: string): Promise<Session | null> {
  const { data: link, error: linkErr } = await admin().auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkErr || !link?.properties?.hashed_token) {
    console.error("[player-auth] generateLink failed", linkErr?.message);
    return null;
  }
  const { data: verified, error: verifyErr } = await anon().auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "email",
  });
  if (verifyErr || !verified?.session?.access_token) {
    console.error("[player-auth] verifyOtp failed", verifyErr?.message);
    return null;
  }
  return {
    access_token: verified.session.access_token,
    refresh_token: verified.session.refresh_token,
  };
}

const throttled = (err: { status?: number; message?: string } | null) =>
  err?.status === 429 || /rate limit|too many requests/i.test(err?.message ?? "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const mode = String(body?.mode ?? "email");
    const password = String(body?.password ?? "");
    const studentId = String(body?.student_id ?? "").trim();
    const emailInput = String(body?.email ?? "").trim().toLowerCase();
    const isStudentMode = mode === "studentId";

    if (action !== "signup" && action !== "login") {
      return json({ error: "Unknown action." }, 400);
    }
    if (isStudentMode ? !isStudentId(studentId) : !isEmail(emailInput)) {
      return json({ error: "Check your details and try again." }, 400);
    }
    if (password.length < 6 || password.length > 128) {
      return json({ error: "Password must be at least 6 characters." }, 400);
    }

    const email = isStudentMode ? `${studentId}@${STUDENT_DOMAIN}` : emailInput;
    const db = admin();

    // ---------------------------------------------------------------- login
    if (action === "login") {
      if (isStudentMode) {
        const { data: gate } = await db.rpc("check_student_id_signin_rate", {
          p_ip_hash: bucketFor(studentId),
          p_student_id_attempt: studentId,
        });
        const allowed = (gate as { allowed?: boolean } | null)?.allowed !== false;
        if (!allowed) {
          return json(
            { error: (gate as { error?: string })?.error ?? "Too many tries. Wait a few minutes." },
            429,
          );
        }
      }

      const { data, error } = await anon().auth.signInWithPassword({ email, password });

      if (error || !data?.session) {
        if (throttled(error as never)) {
          return json({ error: "Lots of people signing in right now. Try again in a moment.", retryable: true }, 429);
        }
        return json({ error: "Wrong details. Please try again." }, 401);
      }

      if (isStudentMode) {
        await db.rpc("record_student_id_signin_success", {
          p_ip_hash: bucketFor(studentId),
          p_student_id_attempt: studentId,
        }).then(() => {}, () => {});
      }

      return json({
        success: true,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      });
    }

    // --------------------------------------------------------------- signup
    const fullName = String(body?.full_name ?? "").trim().slice(0, 120);
    const role = String(body?.role ?? "game_player");
    const joinCode = String(body?.join_code ?? "").trim().toUpperCase();
    const redirectTo = String(body?.redirect_to ?? "");

    if (!fullName) return json({ error: "Please enter a name." }, 400);
    // Roles the two public doors can request. Elevated roles (district_manager,
    // super_admin) are never self-assigned here.
    if (!["game_player", "student", "teacher", "parent", "admin"].includes(role)) {
      return json({ error: "Invalid account type." }, 400);
    }

    const metadata: Record<string, unknown> = { full_name: fullName, role };
    if (isStudentMode) metadata.student_id = studentId;

    // Email accounts keep the normal confirmation flow: signUp() sends the
    // email. Student ID accounts have no mailbox, so we create them confirmed
    // and mint the session here.
    if (!isStudentMode) {
      const { data, error } = await anon().auth.signUp({
        email,
        password,
        options: { data: metadata, emailRedirectTo: redirectTo || undefined },
      });

      if (error) {
        if (throttled(error as never)) {
          return json({ error: "Lots of people signing up right now. Try again in a moment.", retryable: true }, 429);
        }
        return json({ error: error.message }, 400);
      }

      return json({
        success: true,
        user_id: data.user?.id ?? null,
        needs_email_confirmation: !data.session,
        session: data.session
          ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
          : null,
      });
    }

    const { data: taken } = await db
      .from("profiles").select("id").eq("student_id", studentId).maybeSingle();
    if (taken) {
      return json({ error: "That 8-digit ID is already registered." }, 409);
    }

    const { data: created, error: createErr } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (createErr || !created?.user) {
      const msg = createErr?.message ?? "";
      if (/already been registered|duplicate|already exists/i.test(msg)) {
        return json({ error: "That 8-digit ID is already registered." }, 409);
      }
      if (throttled(createErr as never)) {
        return json({ error: "Lots of people signing up right now. Try again in a moment.", retryable: true }, 429);
      }
      console.error("[player-auth] createUser failed", msg);
      return json({ error: "We couldn't create that account. Try again." }, 500);
    }

    let joinedClass: boolean | undefined;
    if (/^[A-Z0-9]{6}$/.test(joinCode)) {
      const { data: redeem } = await db.rpc("redeem_classroom_join_code", {
        p_student_id: created.user.id,
        p_join_code: joinCode,
      });
      joinedClass = !!(redeem as { success?: boolean } | null)?.success;
    }

    const session = await mintSession(email);
    if (!session) {
      return json({ error: "Account created — please sign in.", account_created: true }, 202);
    }

    return json({ success: true, session, joined_class: joinedClass, needs_email_confirmation: false });
  } catch (e) {
    console.error("[player-auth] fatal", (e as Error).message);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
