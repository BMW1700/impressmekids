import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get world backgrounds that need generation
    const { data: worlds, error: fetchError } = await supabase
      .from('world_backgrounds')
      .select('*')
      .is('image_url', null)
      .order('world_id', { ascending: true });

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
