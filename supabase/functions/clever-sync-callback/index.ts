import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleverStudent {
  data: {
    id: string;
    name: { first: string; last: string };
    email: string;
    grade: string;
  };
}

interface CleverTeacher {
  data: {
    id: string;
    name: { first: string; last: string };
    email: string;
  };
}

interface CleverSection {
  data: {
    id: string;
    name: string;
    subject: string;
    grade: string;
    teacher: string;
    students: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error('No authorization code provided');
    }

    // Exchange code for access token
    const cleverClientId = Deno.env.get('CLEVER_CLIENT_ID');
    const cleverClientSecret = Deno.env.get('CLEVER_CLIENT_SECRET');

    if (!cleverClientId || !cleverClientSecret) {
      throw new Error('Clever credentials not configured');
    }

    const tokenResponse = await fetch('https://clever.com/oauth/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${cleverClientId}:${cleverClientSecret}`)}`,
      },
      body: JSON.stringify({
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/clever-sync-callback`,
      }),
    });

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    if (!accessToken) {
      throw new Error('Failed to get access token from Clever');
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch district data
    const districtResponse = await fetch('https://api.clever.com/v3.0/district', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const districtData = await districtResponse.json();

    console.log('Syncing district:', districtData.data.name);

    // Fetch and sync students
    const studentsResponse = await fetch('https://api.clever.com/v3.0/students', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const studentsData = await studentsResponse.json();

    for (const student of studentsData.data as CleverStudent[]) {
      const email = student.data.email;
      const fullName = `${student.data.name.first} ${student.data.name.last}`;
      const grade = parseInt(student.data.grade);

      // Create student account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'student',
          clever_id: student.data.id,
        },
      });

      if (authData?.user) {
        // Update grade in public profile
        await supabaseAdmin
          .from('public_profiles')
          .update({ grade })
          .eq('id', authData.user.id);

        console.log(`Created student: ${fullName} (${email})`);
      } else if (authError?.message.includes('already registered')) {
        console.log(`Student already exists: ${email}`);
      }
    }

    // Fetch and sync teachers
    const teachersResponse = await fetch('https://api.clever.com/v3.0/teachers', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const teachersData = await teachersResponse.json();

    for (const teacher of teachersData.data as CleverTeacher[]) {
      const email = teacher.data.email;
      const fullName = `${teacher.data.name.first} ${teacher.data.name.last}`;

      // Create teacher account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'teacher',
          clever_id: teacher.data.id,
        },
      });

      if (authData?.user) {
        console.log(`Created teacher: ${fullName} (${email})`);
      } else if (authError?.message.includes('already registered')) {
        console.log(`Teacher already exists: ${email}`);
      }
    }

    // Fetch and sync sections (classrooms)
    const sectionsResponse = await fetch('https://api.clever.com/v3.0/sections', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const sectionsData = await sectionsResponse.json();

    for (const section of sectionsData.data as CleverSection[]) {
      const classroomName = section.data.name;
      const subject = section.data.subject;
      const teacherCleverId = section.data.teacher;

      // Find teacher by Clever ID
      const { data: teacherProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', teacherCleverId)
        .single();

      if (teacherProfile) {
        // Generate unique join code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create classroom
        const { data: classroom, error: classroomError } = await supabaseAdmin
          .from('classrooms')
          .insert({
            name: classroomName,
            subject,
            teacher_id: teacherProfile.id,
            join_code: joinCode,
            grade: parseInt(section.data.grade),
          })
          .select()
          .single();

        if (classroom) {
          // Enroll students
          for (const studentCleverId of section.data.students) {
            const { data: studentProfile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('email', studentCleverId)
              .single();

            if (studentProfile) {
              await supabaseAdmin
                .from('classroom_students')
                .insert({
                  classroom_id: classroom.id,
                  student_id: studentProfile.id,
                });
            }
          }

          console.log(`Created classroom: ${classroomName} with ${section.data.students.length} students`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Clever data synced successfully',
        district: districtData.data.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Clever sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
