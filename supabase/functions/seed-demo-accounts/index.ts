import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Seeds the three reviewer demo accounts referenced in
 * `docs/app-store-submission.md`. Idempotent — safe to re-run.
 *
 * SECURITY: This endpoint is restricted to platform admins. It uses
 * service-role to create users with verified emails so reviewers can
 * sign in immediately.
 *
 * Invoke once before submission:
 *   curl -X POST https://<project>.functions.supabase.co/seed-demo-accounts \
 *     -H "Authorization: Bearer <admin-jwt>"
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    )

    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Caller must be platform admin
    const { data: roleData } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const accounts: Array<{
      email: string
      password: string
      role: 'student' | 'teacher' | 'parent'
      fullName: string
    }> = [
      {
        email: 'demo-student@nabulearn.com',
        password: 'DemoStudent2026!',
        role: 'student',
        fullName: 'Demo Student (Apple Reviewer)',
      },
      {
        email: 'demo-teacher@nabulearn.com',
        password: 'DemoTeacher2026!',
        role: 'teacher',
        fullName: 'Demo Teacher (Apple Reviewer)',
      },
      {
        email: 'demo-parent@nabulearn.com',
        password: 'DemoParent2026!',
        role: 'parent',
        fullName: 'Demo Parent (Apple Reviewer)',
      },
    ]

    const results: Array<{ email: string; status: string; user_id?: string; error?: string }> = []

    for (const acct of accounts) {
      try {
        // Check if already exists
        const { data: existing } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        })
        const found = existing?.users?.find((u: any) => u.email === acct.email)

        let uid: string
        if (found) {
          uid = found.id
          // Reset password so it always matches docs
          await admin.auth.admin.updateUserById(uid, {
            password: acct.password,
            email_confirm: true,
            user_metadata: { full_name: acct.fullName, demo: true },
          })
          results.push({ email: acct.email, status: 'updated', user_id: uid })
        } else {
          const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email: acct.email,
            password: acct.password,
            email_confirm: true,
            user_metadata: { full_name: acct.fullName, demo: true },
          })
          if (createErr || !created.user) {
            results.push({ email: acct.email, status: 'failed', error: createErr?.message })
            continue
          }
          uid = created.user.id
          results.push({ email: acct.email, status: 'created', user_id: uid })
        }

        // Ensure role row exists
        await admin
          .from('user_roles')
          .upsert({ user_id: uid, role: acct.role }, { onConflict: 'user_id,role' })

        // Ensure profile row exists (best-effort)
        await admin.from('profiles').upsert(
          { id: uid, full_name: acct.fullName, role: acct.role },
          { onConflict: 'id' }
        ).catch(() => {})
      } catch (e) {
        results.push({ email: acct.email, status: 'failed', error: (e as Error).message })
      }
    }

    console.log('Demo accounts seeded:', JSON.stringify(results))

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('seed-demo-accounts error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Seeding failed'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
