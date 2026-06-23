import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

import { corsHeaders } from '../_shared/cors.ts';

// Hard cap on AI image generations per invocation. Protects the $0/month AI
// cost model from a runaway loop or repeated invocations. Lower than the full
// world catalog by design — admins can re-invoke if more remain.
const MAX_GENERATIONS_PER_CALL = 5;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    // --- Auth gate: require a signed-in super_admin caller ---
    // verify_jwt is false at the edge (signing-keys system), so we validate in code.
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Only super_admin may trigger AI image generation.
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (!roleRow) {
      console.warn(
        `generate-world-backgrounds: rejected non-admin caller ${userData.user.id}`
      );
      return new Response(
        JSON.stringify({ error: 'Forbidden: super_admin required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get world backgrounds that need generation (capped — see MAX_GENERATIONS_PER_CALL)
    const { data: worlds, error: fetchError } = await supabase
      .from('world_backgrounds')
      .select('*')
      .is('image_url', null)
      .order('world_id', { ascending: true })
      .limit(MAX_GENERATIONS_PER_CALL);

    if (fetchError) {
      throw new Error(`Failed to fetch worlds: ${fetchError.message}`);
    }

    if (!worlds || worlds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All world backgrounds already generated', generated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    console.log(`Generating backgrounds for ${worlds.length} worlds...`);

    const results = [];

    for (const world of worlds) {
      console.log(`Generating background for World ${world.world_id}: ${world.world_name}`);

      try {
        // Call Lovable AI to generate image
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [
              {
                role: 'user',
                content: world.prompt
              }
            ],
            modalities: ['image', 'text']
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI API error for world ${world.world_id}:`, errorText);
          results.push({ world_id: world.world_id, success: false, error: errorText });
          continue;
        }

        const aiData = await response.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          console.error(`No image generated for world ${world.world_id}`);
          results.push({ world_id: world.world_id, success: false, error: 'No image in response' });
          continue;
        }

        // Extract base64 data
        const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          console.error(`Invalid image format for world ${world.world_id}`);
          results.push({ world_id: world.world_id, success: false, error: 'Invalid image format' });
          continue;
        }

        const imageType = base64Match[1];
        const base64Data = base64Match[2];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to Supabase Storage
        const fileName = `world-${world.world_id}-${world.world_name.toLowerCase().replace(/\s+/g, '-')}.${imageType}`;
        
        const { error: uploadError } = await supabase.storage
          .from('world-backgrounds')
          .upload(fileName, binaryData, {
            contentType: `image/${imageType}`,
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for world ${world.world_id}:`, uploadError);
          results.push({ world_id: world.world_id, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('world-backgrounds')
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Update database with image URL
        const { error: updateError } = await supabase
          .from('world_backgrounds')
          .update({ 
            image_url: publicUrl,
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('world_id', world.world_id);

        if (updateError) {
          console.error(`DB update error for world ${world.world_id}:`, updateError);
          results.push({ world_id: world.world_id, success: false, error: updateError.message });
          continue;
        }

        console.log(`Successfully generated and stored background for World ${world.world_id}`);
        results.push({ world_id: world.world_id, success: true, image_url: publicUrl });

        // Add delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (worldError) {
        console.error(`Error processing world ${world.world_id}:`, worldError);
        results.push({ 
          world_id: world.world_id, 
          success: false, 
          error: worldError instanceof Error ? worldError.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Generated ${successCount} of ${worlds.length} world backgrounds`,
        generated: successCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-world-backgrounds:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
