import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrillNotificationPayload {
  type: 'student_checkin' | 'drill_scheduled' | 'drill_started' | 'all_clear';
  drillSessionId: string;
  studentId?: string;
  classroomId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: DrillNotificationPayload = await req.json();
    const { type, drillSessionId, studentId, classroomId } = payload;

    console.log('Processing drill notification:', { type, drillSessionId, studentId, classroomId });

    // Get drill session details
    const { data: drillSession, error: drillError } = await supabaseClient
      .from('drill_sessions')
      .select('*, classrooms(name)')
      .eq('id', drillSessionId)
      .single();

    if (drillError || !drillSession) {
      throw new Error('Drill session not found');
    }

    const drillTypeName = drillSession.drill_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    const isEmergency = drillSession.is_real_emergency || false;

    let targetUserIds: string[] = [];
    let notificationTitle = '';
    let notificationBody = '';

    switch (type) {
      case 'student_checkin': {
        if (!studentId) throw new Error('studentId required for student_checkin');

        // Get student info
        const { data: student } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', studentId)
          .single();

        // Get parent user_ids for this student
        const { data: parentLinks } = await supabaseClient
          .from('parent_student_links')
          .select('parent_id, parent_accounts(user_id)')
          .eq('student_id', studentId)
          .eq('approved', true);

        if (parentLinks && parentLinks.length > 0) {
          targetUserIds = parentLinks
            .map(link => (link.parent_accounts as any)?.user_id)
            .filter(Boolean);
        }

        notificationTitle = isEmergency ? `🚨 ${student?.full_name || 'Student'} is SAFE` : `✅ ${student?.full_name || 'Student'} Checked In`;
        notificationBody = isEmergency 
          ? `EMERGENCY UPDATE: Your child has been marked SAFE during the ${drillTypeName.toUpperCase()} emergency.`
          : `Your child has been marked safe during the ${drillTypeName}.`;
        break;
      }

      case 'drill_scheduled': {
        // Notify all students and parents in affected classrooms
        if (classroomId) {
          // Single classroom drill
          const { data: students } = await supabaseClient
            .from('classroom_students')
            .select('student_id')
            .eq('classroom_id', classroomId);

          if (students) {
            targetUserIds = students.map(s => s.student_id);
          }
        } else {
          // School-wide drill - notify all users
          const { data: allUsers } = await supabaseClient
            .from('profiles')
            .select('id')
            .in('role', ['student', 'parent', 'teacher', 'admin']);

          if (allUsers) {
            targetUserIds = allUsers.map(u => u.id);
          }
        }

        const scheduledTime = new Date(drillSession.scheduled_for!).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

        notificationTitle = `📅 ${drillTypeName} Scheduled`;
        notificationBody = `A ${drillTypeName} has been scheduled for ${scheduledTime}`;
        break;
      }

      case 'drill_started': {
        // Notify all students and parents in affected classrooms
        if (classroomId) {
          const { data: students } = await supabaseClient
            .from('classroom_students')
            .select('student_id')
            .eq('classroom_id', classroomId);

          if (students) {
            targetUserIds = students.map(s => s.student_id);

            // Also notify parents
            const { data: parentLinks } = await supabaseClient
              .from('parent_student_links')
              .select('parent_id, parent_accounts(user_id)')
              .in('student_id', students.map(s => s.student_id))
              .eq('approved', true);

            if (parentLinks) {
              const parentUserIds = parentLinks
                .map(link => (link.parent_accounts as any)?.user_id)
                .filter(Boolean);
              targetUserIds = [...targetUserIds, ...parentUserIds];
            }
          }
        } else {
          // School-wide drill
          const { data: allUsers } = await supabaseClient
            .from('profiles')
            .select('id');

          if (allUsers) {
            targetUserIds = allUsers.map(u => u.id);
          }
        }

        notificationTitle = isEmergency ? `🚨 EMERGENCY: ${drillTypeName.toUpperCase()}` : `🚨 ${drillTypeName} In Progress`;
        notificationBody = isEmergency
          ? `REAL ${drillTypeName.toUpperCase()} EMERGENCY - THIS IS NOT A DRILL. Follow emergency protocols immediately.`
          : `A ${drillTypeName} has started. Follow your teacher's instructions.`;
        break;
      }

      case 'all_clear': {
        // Notify parents and admins
        if (classroomId) {
          // Get students in classroom
          const { data: students } = await supabaseClient
            .from('classroom_students')
            .select('student_id')
            .eq('classroom_id', classroomId);

          if (students) {
            // Get parents
            const { data: parentLinks } = await supabaseClient
              .from('parent_student_links')
              .select('parent_id, parent_accounts(user_id)')
              .in('student_id', students.map(s => s.student_id))
              .eq('approved', true);

            if (parentLinks) {
              targetUserIds = parentLinks
                .map(link => (link.parent_accounts as any)?.user_id)
                .filter(Boolean);
            }
          }
        }

        // Add admins
        const { data: admins } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

        if (admins) {
          targetUserIds = [...targetUserIds, ...admins.map(a => a.id)];
        }

        const classroomName = (drillSession.classrooms as any)?.name || 'the classroom';
        notificationTitle = isEmergency ? `✅ All Clear - ${drillTypeName.toUpperCase()} Emergency Resolved` : `✅ All Clear`;
        notificationBody = isEmergency
          ? `The ${drillTypeName.toUpperCase()} emergency has been resolved. All students in ${classroomName} are confirmed safe.`
          : `Drill complete - all students in ${classroomName} are safe.`;
        break;
      }
    }

    // Send push notifications to all target users
    const results = await Promise.allSettled(
      targetUserIds.map(async (userId) => {
        try {
          const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({
              userId,
              title: notificationTitle,
              body: notificationBody,
              icon: '/android-chrome-192x192.png',
              tag: `drill-${drillSessionId}`,
              data: {
                type: 'drill_notification',
                drillSessionId,
                notificationType: type,
              },
            }),
          });

          return { userId, success: response.ok };
        } catch (error) {
          console.error(`Error sending notification to user ${userId}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { userId, success: false, error: errorMessage };
        }
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length;
    console.log(`Drill notifications sent: ${successCount}/${targetUserIds.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        notificationType: type,
        targetUsersCount: targetUserIds.length,
        successCount,
        notificationTitle,
        notificationBody,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-drill-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
