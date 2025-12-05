import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization header exists
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client for auth user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    // Verify the calling user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for role checks and sending notifications
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if caller has teacher, admin, or is sending to themselves
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'teacher']);

    const payload: PushNotificationPayload = await req.json();
    const { userId, title, body, icon, badge, data, tag } = payload;

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'userId, title, and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization check: must be admin, teacher, or sending to self
    const isAdminOrTeacher = roleData && roleData.length > 0;
    const isSendingToSelf = userId === user.id;

    if (!isAdminOrTeacher && !isSendingToSelf) {
      console.warn(`Unauthorized push notification attempt by user ${user.id} to ${userId}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - insufficient permissions to send notifications' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} sending notification to ${userId}`);

    // Get VAPID keys
    const VAPID_PUBLIC_KEY = 'BBOQmeU-GndAJbPRu4b5Dt7mmnIjOH3AxacLwY5oznBCrF4JBVzLRkeJr_w_qoDmqu2o3gRlEjjkD7gP9snuJoI';
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    
    if (!VAPID_PRIVATE_KEY) {
      throw new Error('VAPID_PRIVATE_KEY not configured');
    }

    // Configure web-push with VAPID details
    webpush.setVapidDetails(
      'mailto:support@impressmekids.com',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    // Get all push subscriptions for this user
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions for user ${userId}`);

    const pushPayload = JSON.stringify({
      title,
      body,
      icon: icon || '/android-chrome-192x192.png',
      badge: badge || '/favicon-32x32.png',
      data: data || {},
      tag: tag || 'default',
    });

    // Send push notifications using web-push library
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          // Reconstruct subscription object from database fields
          const subscriptionObject = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };
          
          await webpush.sendNotification(subscriptionObject, pushPayload);

          return { success: true, subscriptionId: subscription.id };
        } catch (error: any) {
          console.error(`Error sending to subscription ${subscription.id}:`, error);
          
          // If subscription is no longer valid, delete it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            console.log(`Deleted invalid subscription ${subscription.id}`);
          }
          
          return { success: false, subscriptionId: subscription.id, error: error.message };
        }
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length;
    console.log(`Push notifications sent: ${successCount}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalSubscriptions: subscriptions.length,
        successCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
