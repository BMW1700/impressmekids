import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { extractTextSchema, validateInput } from '../_shared/validation.ts';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../_shared/rateLimiter.ts';

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
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Rate limiting (100 requests per minute per user)
    const rateLimitResult = await checkRateLimit(user.id, 'extract-text-from-image');
    if (!rateLimitResult.allowed) {
      console.warn('[RATE_LIMIT] Rate limit exceeded:', user.id);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        resetAt: rateLimitResult.resetAt,
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          ...getRateLimitHeaders(rateLimitResult, RATE_LIMITS.AI_FUNCTION),
          'Content-Type': 'application/json',
        },
      });
    }

    const requestData = await req.json();
    
    // Validate input with Zod
    const validation = validateInput(extractTextSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image } = validation.data;

    console.log('Sending OCR request to Google Vertex AI...');

    // Import Vertex AI helper
    const { callVertexVision } = await import('../_shared/vertexAuth.ts');

    const prompt = `Extract all text from this image of a reading passage. 
Preserve paragraph breaks and formatting as much as possible.
Return clean, formatted text suitable for students to read.
Ignore headers, footers, and page numbers if present.
If the image contains multiple columns, read from left to right, top to bottom.
Return only the extracted text, no additional commentary.`;

    // Call Vertex AI Vision
    const extractedText = await callVertexVision(image, prompt, {
      model: 'gemini-2.5-flash',
      temperature: 0.1,
    });

    if (!extractedText) {
      console.error('No text extracted from response');
      return new Response(
        JSON.stringify({ error: 'No text could be extracted from the image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted text, length:', extractedText.length);

    // Return extracted text with metadata
    return new Response(
      JSON.stringify({
        extracted_text: extractedText.trim(),
        confidence: 0.95, // Gemini Flash is highly accurate
        character_count: extractedText.trim().length,
        word_count: extractedText.trim().split(/\s+/).length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in extract-text-from-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process image. Please try again.' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
