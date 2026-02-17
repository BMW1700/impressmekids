import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from '../_shared/cors.ts';

interface StudentData {
  email: string;
  full_name: string;
  classroom_code?: string;
  grade?: string;
}

interface StudentResult {
  email: string;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Create client with user's token to verify identity
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Could not verify user role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.role !== 'admin') {
      console.log('User role:', profile.role, 'User ID:', user.id);
      return new Response(
        JSON.stringify({ error: 'Only administrators can bulk import students' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { students } = await req.json() as { students: StudentData[] };
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No students provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit batch size for safety
    if (students.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Maximum 100 students per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key for user creation
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: StudentResult[] = [];

    for (const student of students) {
      try {
        // Validate email
        if (!student.email || !student.email.includes('@')) {
          results.push({ email: student.email || 'unknown', success: false, error: 'Invalid email format' });
          continue;
        }

        // Validate name
        if (!student.full_name || student.full_name.length < 2) {
          results.push({ email: student.email, success: false, error: 'Full name required (min 2 chars)' });
          continue;
        }

        // Generate random password
        const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!';

        // Create auth user using admin API (server-side only)
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: student.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: student.full_name,
            role: 'student',
          }
        });

        if (authError) {
          console.error('Error creating user:', student.email, authError.message);
          results.push({ email: student.email, success: false, error: authError.message });
          continue;
        }

        // Join classroom if code provided
        if (student.classroom_code && authData.user) {
          const { data: classroom } = await adminClient
            .from('classrooms')
            .select('id')
            .eq('join_code', student.classroom_code.toUpperCase())
            .single();

          if (classroom) {
            await adminClient
              .from('classroom_students')
              .insert({
                classroom_id: classroom.id,
                student_id: authData.user.id
              });
          }
        }

        // Update grade if provided
        if (student.grade && authData.user) {
          const gradeNum = parseInt(student.grade);
          if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 12) {
            await adminClient
              .from('profiles')
              .update({ grade: gradeNum })
              .eq('id', authData.user.id);
          }
        }

        results.push({ email: student.email, success: true });
        console.log('Successfully created user:', student.email);
      } catch (error: any) {
        console.error('Unexpected error for:', student.email, error);
        results.push({ email: student.email, success: false, error: error.message || 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`Bulk import complete: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ results, successCount, failedCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Bulk create students error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
