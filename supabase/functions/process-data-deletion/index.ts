import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

import { corsHeaders } from '../_shared/cors.ts';

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

    // Verify calling user
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
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      console.warn(`Unauthorized data deletion attempt by user ${user.id}`)
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { request_id, action } = await req.json()

    if (!request_id) {
      return new Response(
        JSON.stringify({ error: 'request_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the deletion request
    const { data: request, error: reqError } = await supabaseAdmin
      .from('data_deletion_requests')
      .select('*')
      .eq('id', request_id)
      .single()

    if (reqError || !request) {
      return new Response(
        JSON.stringify({ error: 'Deletion request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (request.status !== 'approved' && action === 'process') {
      return new Response(
        JSON.stringify({ error: 'Request must be approved before processing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const studentId = request.student_id
    const deletedTables: string[] = []

    // Delete student data in dependency order
    const tablesToDelete = [
      // AURA data
      { table: 'aura_access_log', column: 'accessed_student' },
      { table: 'aura_processing_failures', column: 'profile_id' },
      { table: 'assignment_answers', column: 'submission_id', via: 'assignment_submissions' },
      { table: 'aura_records', column: 'profile_id' },
      // Assignment data
      { table: 'assignment_group_members', column: 'student_id' },
      // Behavior data
      { table: 'behavior_records', column: 'student_id' },
      { table: 'student_behavior_stats', column: 'student_id' },
      // Attendance
      { table: 'attendance_records', column: 'student_id' },
      { table: 'drill_attendance', column: 'student_id' },
      // Reading data
      { table: 'student_reading_progress', column: 'student_id' },
      { table: 'student_reading_stats', column: 'student_id' },
      { table: 'student_vocabulary', column: 'student_id' },
      { table: 'student_error_patterns', column: 'student_id' },
      // ML/Analytics data
      { table: 'student_skill_vectors', column: 'student_id' },
      { table: 'student_q_tables', column: 'student_id' },
      { table: 'student_benchmark_results', column: 'student_id' },
      { table: 'student_standard_scores', column: 'student_id' },
      { table: 'student_risk_history', column: 'student_id' },
      { table: 'student_interventions', column: 'student_id' },
      // Safety/medical data
      { table: 'student_allergies', column: 'student_id' },
      { table: 'student_medications', column: 'student_id' },
      { table: 'student_pickups', column: 'student_id' },
      // Teacher notes
      { table: 'teacher_student_notes', column: 'student_id' },
      // Campaign/game data
      { table: 'campaign_battle_sessions', column: 'student_id' },
      { table: 'campaign_progress', column: 'student_id' },
      { table: 'boss_rush_attempts', column: 'student_id' },
      { table: 'daily_login_rewards', column: 'student_id' },
      // Club memberships
      { table: 'club_members', column: 'user_id' },
      { table: 'club_join_requests', column: 'student_id' },
      // Classroom memberships
      { table: 'classroom_join_requests', column: 'student_id' },
      { table: 'classroom_students', column: 'student_id' },
      // Profiles
      { table: 'student_profiles', column: 'user_id' },
      { table: 'public_profiles', column: 'id' },
      // Parent links & consents
      { table: 'parent_student_links', column: 'student_id' },
      { table: 'parent_consents', column: 'student_id' },
    ]

    // First handle assignment_answers via submissions
    const { data: submissions } = await supabaseAdmin
      .from('assignment_submissions')
      .select('id')
      .eq('student_id', studentId)

    if (submissions && submissions.length > 0) {
      const subIds = submissions.map(s => s.id)
      const { error } = await supabaseAdmin
        .from('assignment_answers')
        .delete()
        .in('submission_id', subIds)
      if (!error) deletedTables.push('assignment_answers')
    }

    // Delete assignment_submissions
    const { error: subDelErr } = await supabaseAdmin
      .from('assignment_submissions')
      .delete()
      .eq('student_id', studentId)
    if (!subDelErr) deletedTables.push('assignment_submissions')

    // Delete from all other tables
    for (const { table, column, via } of tablesToDelete) {
      if (via || table === 'assignment_answers') continue // Already handled
      
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq(column, studentId)
        
        if (!error) {
          deletedTables.push(table)
        } else {
          // Table might not exist or column mismatch - log but continue
          console.warn(`Warning deleting from ${table}:`, error.message)
        }
      } catch (e) {
        console.warn(`Skipped ${table}:`, e)
      }
    }

    // Update request status to completed
    await supabaseAdmin
      .from('data_deletion_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', request_id)

    // Log to security_audit_log
    await supabaseAdmin
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action_type: 'DATA_DELETION',
        table_name: 'data_deletion_requests',
        record_id: studentId,
        metadata: {
          request_id,
          parent_id: request.parent_id,
          student_id: studentId,
          deleted_tables: deletedTables,
          admin_id: user.id,
          completed_at: new Date().toISOString(),
        }
      })

    console.log(`Data deletion completed for student ${studentId} by admin ${user.id}. Tables: ${deletedTables.join(', ')}`)

    return new Response(
      JSON.stringify({
        success: true,
        deleted_tables: deletedTables,
        student_id: studentId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Data deletion error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to process data deletion'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
