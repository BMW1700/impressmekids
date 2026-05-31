import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * SELF-SERVICE account deletion (Apple Guideline 5.1.1(v)).
 *
 * Any authenticated user can call this on THEMSELVES. It:
 *   1. Verifies the JWT belongs to the caller
 *   2. Cascades deletion across all user-scoped tables
 *   3. Deletes the auth.users row (this is irreversible)
 *
 * No admin role required. No second-party approval.
 * The caller's session is invalidated as a side-effect of deleting auth.users.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Optional client confirmation token to prevent accidental calls
    const body = await req.json().catch(() => ({}))
    if (body?.confirm !== 'DELETE_MY_ACCOUNT') {
      return new Response(
        JSON.stringify({ error: 'Missing confirmation token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const userId = user.id
    const deleted: string[] = []
    const failed: { table: string; error: string }[] = []

    // Tables keyed by the caller's auth.users.id (covers students, parents,
    // teachers, admins — every table that stores user data).
    // Each entry deletes rows where <column> = userId.
    const userIdScopedTables: Array<{ table: string; column: string }> = [
      // Profile + role
      { table: 'profiles', column: 'id' },
      { table: 'public_profiles', column: 'id' },
      { table: 'user_roles', column: 'user_id' },
      { table: 'student_profiles', column: 'user_id' },
      { table: 'parent_accounts', column: 'user_id' },
      { table: 'district_admins', column: 'user_id' },
      { table: 'district_managers', column: 'user_id' },
      { table: 'pending_teacher_requests', column: 'user_id' },
      { table: 'account_verification_requests', column: 'user_id' },
      // Auth-scoped device state
      { table: 'push_subscriptions', column: 'user_id' },
      // Student-as-user data (when caller is a student)
      { table: 'aura_records', column: 'profile_id' },
      { table: 'aura_processing_failures', column: 'profile_id' },
      { table: 'reading_sessions', column: 'student_id' },
      { table: 'reading_streaks', column: 'student_id' },
      { table: 'reading_missions', column: 'student_id' },
      { table: 'reading_achievements', column: 'student_id' },
      { table: 'realtime_practice_sessions', column: 'student_id' },
      { table: 'practice_exercises', column: 'student_id' },
      { table: 'phonics_foundations_progress', column: 'student_id' },
      { table: 'player_achievements', column: 'student_id' },
      { table: 'player_equipped_items', column: 'student_id' },
      { table: 'player_inventory', column: 'student_id' },
      { table: 'player_pets', column: 'student_id' },
      { table: 'campaign_battle_sessions', column: 'student_id' },
      { table: 'campaign_progress', column: 'student_id' },
      { table: 'boss_rush_attempts', column: 'student_id' },
      { table: 'daily_login_rewards', column: 'student_id' },
      { table: 'duel_stats', column: 'student_id' },
      { table: 'castle_swarm_campaign_progress', column: 'user_id' },
      { table: 'castle_swarm_runs', column: 'user_id' },
      { table: 'castle_upgrades', column: 'user_id' },
      // Memberships
      { table: 'classroom_students', column: 'student_id' },
      { table: 'classroom_join_requests', column: 'student_id' },
      { table: 'club_members', column: 'user_id' },
      { table: 'club_join_requests', column: 'student_id' },
      { table: 'group_chat_messages', column: 'student_id' },
      // Safety / acknowledgements
      { table: 'safety_alert_acknowledgments', column: 'user_id' },
      // Parent-as-user data
      { table: 'parent_student_links', column: 'parent_id' },
      { table: 'parent_consents', column: 'parent_id' },
      { table: 'parent_notifications', column: 'parent_id' },
      { table: 'parent_notification_preferences', column: 'parent_id' },
      { table: 'parent_personal_events', column: 'parent_id' },
      { table: 'parent_student_events', column: 'parent_id' },
      { table: 'parent_drill_responses', column: 'parent_id' },
      { table: 'parent_phoneme_reports', column: 'parent_id' },
      { table: 'parent_access_requests', column: 'parent_id' },
      { table: 'discussion_posts', column: 'parent_id' },
    ]

    for (const { table, column } of userIdScopedTables) {
      try {
        const { error } = await admin.from(table).delete().eq(column, userId)
        if (error) {
          failed.push({ table, error: error.message })
        } else {
          deleted.push(table)
        }
      } catch (e) {
        failed.push({ table, error: (e as Error).message })
      }
    }

    // Audit log BEFORE auth.users delete (FK will null/cascade afterwards)
    try {
      await admin.from('security_audit_log').insert({
        user_id: userId,
        action_type: 'SELF_ACCOUNT_DELETION',
        table_name: 'auth.users',
        record_id: userId,
        metadata: {
          deleted_tables: deleted,
          failed_tables: failed,
          initiated_at: new Date().toISOString(),
          source: 'self-delete-account-edge-function',
        },
      })
    } catch (e) {
      console.warn('audit log insert failed:', e)
    }

    // Finally delete the auth user
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)
    if (deleteErr) {
      console.error('auth.admin.deleteUser failed:', deleteErr)
      return new Response(
        JSON.stringify({
          error: 'Account data cleared but final auth deletion failed. Contact support@nabulearn.com.',
          deleted, failed,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Self-delete completed for user ${userId}. Tables: ${deleted.length}, failures: ${failed.length}`)

    return new Response(
      JSON.stringify({ success: true, deleted_count: deleted.length, failed_count: failed.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('self-delete-account error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Deletion failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
