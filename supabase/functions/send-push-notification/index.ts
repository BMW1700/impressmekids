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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: PushNotificationPayload = await req.json();
    const { userId, title, body, icon, badge, data, tag } = payload;

    if (!userId || !title || !body) {
      throw new Error('userId, title, and body are required');
    }

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
    const { data: subscriptions, error: subsError } = await supabaseClient
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
            await supabaseClient
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
