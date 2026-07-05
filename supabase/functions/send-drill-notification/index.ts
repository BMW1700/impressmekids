import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from '../_shared/cors.ts';
import { sendBulkEmails } from '../_shared/resendClient.ts';

interface DrillNotificationPayload {
  type: 'student_checkin' | 'drill_scheduled' | 'drill_started' | 'all_clear' | 'recess_return' | 'unaccounted_child';
  drillSessionId?: string;
  studentId?: string;
  classroomId?: string;
  studentIds?: string[];
  markedByTeacher?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- AuthN/AuthZ: only teachers or admins may send safety notifications ---
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await userClient.rpc('has_role', { _user_id: authData.user.id, _role: 'admin' });
    const { data: isTeacher } = await userClient.rpc('has_role', { _user_id: authData.user.id, _role: 'teacher' });
    if (!isAdmin && !isTeacher) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: DrillNotificationPayload = await req.json();
    const { type, drillSessionId, studentId, classroomId, studentIds, markedByTeacher } = payload;

    console.log('Processing drill notification:', { type, drillSessionId, studentId, classroomId, studentIds, markedByTeacher });

    let drillSession: any = null;
    let drillTypeName = '';
    let isEmergency = false;

    // Get drill session details (except for recess_return)
    if (type !== 'recess_return' && drillSessionId) {
      const { data, error: drillError } = await supabaseClient
        .from('drill_sessions')
        .select('*, classrooms(name)')
        .eq('id', drillSessionId)
        .single();

      if (drillError || !data) {
        throw new Error('Drill session not found');
      }

      drillSession = data;
      drillTypeName = drillSession.drill_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      isEmergency = drillSession.is_real_emergency || false;
    }

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
          : markedByTeacher
          ? `Your child has been marked safe by their teacher during the ${drillTypeName}.`
          : `Your child has been marked safe during the ${drillTypeName}.`;

        // Log to audit
        await supabaseClient.from('safety_audit_log').insert({
          event_type: markedByTeacher ? 'teacher_marked_present' : 'student_checkin',
          drill_session_id: drillSessionId,
          user_id: studentId,
          event_data: {
            student_name: student?.full_name,
            is_emergency: isEmergency,
            drill_type: drillTypeName,
            parents_notified: targetUserIds.length,
            marked_by_teacher: markedByTeacher || false
          }
        });
        break;
      }

      case 'unaccounted_child': {
        if (!studentId) throw new Error('studentId required for unaccounted_child');

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

        notificationTitle = `🚨 URGENT: ${student?.full_name || 'Your Child'} Unaccounted For`;
        notificationBody = `Your child is currently unaccounted for during ${drillTypeName}. School staff are actively locating them. You will be notified when found.`;

        // Log to audit - critical event
        await supabaseClient.from('safety_audit_log').insert({
          event_type: 'unaccounted_child_alert',
          drill_session_id: drillSessionId,
          user_id: studentId,
          event_data: {
            student_name: student?.full_name,
            is_emergency: isEmergency,
            drill_type: drillTypeName,
            parents_notified: targetUserIds.length,
            severity: 'critical'
          }
        });
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

        // Log to audit
        await supabaseClient.from('safety_audit_log').insert({
          event_type: 'drill_scheduled',
          drill_session_id: drillSessionId,
          event_data: {
            drill_type: drillTypeName,
            scheduled_for: drillSession.scheduled_for,
            classroom_id: classroomId,
            users_notified: targetUserIds.length
          }
        });
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

        // Log to audit
        await supabaseClient.from('safety_audit_log').insert({
          event_type: isEmergency ? 'emergency_started' : 'drill_started',
          drill_session_id: drillSessionId,
          event_data: {
            drill_type: drillTypeName,
            is_emergency: isEmergency,
            classroom_id: classroomId,
            users_notified: targetUserIds.length
          }
        });
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

        // Log to audit
        await supabaseClient.from('safety_audit_log').insert({
          event_type: 'all_clear',
          drill_session_id: drillSessionId,
          event_data: {
            drill_type: drillTypeName,
            is_emergency: isEmergency,
            classroom_name: classroomName,
            users_notified: targetUserIds.length
          }
        });
        break;
      }

      case 'recess_return': {
        if (!studentIds || studentIds.length === 0) throw new Error('studentIds required for recess_return');

        // Get parents who have opted in for recess notifications
        const { data: parentLinks } = await supabaseClient
          .from('parent_student_links')
          .select(`
            parent_id,
            student_id,
            notify_on_recess_return,
            parent_accounts(user_id),
            profiles(full_name)
          `)
          .in('student_id', studentIds)
          .eq('approved', true)
          .eq('notify_on_recess_return', true);

        if (parentLinks && parentLinks.length > 0) {
          // Only send to parents who have opted in
          targetUserIds = parentLinks
            .map(link => (link.parent_accounts as any)?.user_id)
            .filter(Boolean);
        }

        notificationTitle = '✅ Children Returned from Recess';
        notificationBody = 'Your child has safely returned to class from recess.';

        // Log to audit
        await supabaseClient.from('safety_audit_log').insert({
          event_type: 'recess_return',
          event_data: {
            student_count: studentIds.length,
            parents_notified: targetUserIds.length
          }
        });
        break;
      }
    }

    // Determine if this is a critical notification that needs email fallback
    const isCriticalNotification = ['unaccounted_child', 'drill_started', 'all_clear'].includes(type) || isEmergency;
    
    // Get parent emails for email fallback (for critical notifications)
    let parentEmails: { email: string; userId: string; studentName?: string }[] = [];
    
    if (isCriticalNotification && studentId) {
      // Single student - get their parents
      const { data: parentLinks } = await supabaseClient
        .from('parent_student_links')
        .select(`
          parent_accounts(email, user_id),
          profiles(full_name)
        `)
        .eq('student_id', studentId)
        .eq('approved', true);
      
      if (parentLinks) {
        parentEmails = parentLinks
          .filter(link => (link.parent_accounts as any)?.email)
          .map(link => ({
            email: (link.parent_accounts as any).email,
            userId: (link.parent_accounts as any).user_id,
            studentName: (link.profiles as any)?.full_name
          }));
      }
    } else if (isCriticalNotification && (classroomId || !classroomId)) {
      // School-wide or classroom drill - get all relevant parent emails
      const { data: allParents } = await supabaseClient
        .from('parent_accounts')
        .select('email, user_id');
      
      if (allParents) {
        parentEmails = allParents
          .filter(p => p.email)
          .map(p => ({ email: p.email, userId: p.user_id }));
      }
    }

    // Send push notifications to all target users (using service role for server-to-server)
    const pushResults = await Promise.allSettled(
      targetUserIds.map(async (userId) => {
        try {
          const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
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

    const pushSuccessCount = pushResults.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length;
    console.log(`Push notifications sent: ${pushSuccessCount}/${targetUserIds.length}`);

    // Send email fallback for critical notifications via shared bulk-batched client
    let emailSuccessCount = 0;

    if (isCriticalNotification && parentEmails.length > 0) {
      console.log(`Sending email fallback for critical ${type} to ${parentEmails.length} parents`);

      const severityColor = isEmergency ? '#dc2626' :
        type === 'unaccounted_child' ? '#dc2626' :
        type === 'all_clear' ? '#16a34a' : '#ea580c';

      const cleanTitle = notificationTitle.replace(/[🚨✅📅]/g, '').trim();

      const whatToDo =
        type === 'unaccounted_child'
          ? 'Staff are actively locating your child. You will receive another notification when they are found. Please keep your phone nearby.'
          : type === 'all_clear'
          ? 'No action required. The situation has been resolved safely.'
          : 'Follow school emergency protocols. Check the parent portal for updates.';

      const buildHtml = (studentName?: string) => `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background-color: ${severityColor}; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${cleanTitle}</h1>
          </div>
          <div style="padding: 32px; background: #f9fafb;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              ${notificationBody}
            </p>
            ${studentName ? `
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                Student: <strong>${studentName}</strong>
              </p>
            ` : ''}
            <div style="margin-top: 24px; padding: 16px; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="color: #374151; font-size: 14px; margin: 0;">
                <strong>What to do:</strong> ${whatToDo}
              </p>
            </div>
          </div>
          <div style="padding: 20px; background: #f3f4f6; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated safety notification from YubiLearn.<br>
              For immediate questions, contact your school directly.
            </p>
          </div>
        </div>
      `;

      const bulkResult = await sendBulkEmails({
        from: "YubiLearn Safety <safety@yubilearn.com>",
        subject: cleanTitle,
        recipients: parentEmails.map((p) => ({
          to: p.email,
          html: buildHtml(p.studentName),
        })),
        functionName: "send-drill-notification",
        payloadSummary: { type, drillSessionId, isEmergency, classroomId },
      });
      emailSuccessCount = bulkResult.sent;
      console.log(
        `Email fallback sent: ${emailSuccessCount}/${bulkResult.totalRecipients} across ${bulkResult.batches} batch(es), ${bulkResult.failed} failed`,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationType: type,
        targetUsersCount: targetUserIds.length,
        pushSuccessCount,
        emailSuccessCount,
        emailsSent: parentEmails.length,
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
