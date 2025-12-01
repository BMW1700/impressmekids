import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // VAPID keys (you'll need to generate these using web-push library)
    // For now, using Web Push Protocol directly
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushPayload = {
            title,
            body,
            icon: icon || '/android-chrome-192x192.png',
            badge: badge || '/favicon-32x32.png',
            data: data || {},
            tag: tag || 'default',
          };

          // Send push notification using Web Push Protocol
          const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400',
            },
            body: JSON.stringify({
              notification: pushPayload,
            }),
          });

          if (!response.ok) {
            // If subscription is no longer valid, delete it
            if (response.status === 404 || response.status === 410) {
              await supabaseClient
                .from('push_subscriptions')
                .delete()
                .eq('id', subscription.id);
              console.log(`Deleted invalid subscription ${subscription.id}`);
            }
            throw new Error(`Push failed: ${response.statusText}`);
          }

          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          console.error(`Error sending to subscription ${subscription.id}:`, error);
          return { success: false, subscriptionId: subscription.id, error };
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