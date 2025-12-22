import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { transcribeAudioSchema, validateInput } from '../_shared/validation.ts';

// Google Cloud Speech-to-Text API configuration
const GOOGLE_SPEECH_API = 'https://speech.googleapis.com/v1/speech:recognize';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create JWT for Google Cloud authentication
async function createJWT(serviceAccount: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key - properly clean PEM format (remove headers/footers and all whitespace/newlines)
  const privateKey = serviceAccount.private_key;
  const pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[\n\r\s]/g, ''); // Remove all newlines, carriage returns, and whitespace
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${encodedSignature}`;
}

// Estimate audio duration from base64 size (rough estimate for webm)
function estimateAudioDuration(base64Audio: string): number {
  // Base64 to bytes: multiply by 0.75
  // WebM Opus is typically ~16-24 kbps for speech
  // Using 20 kbps = 2500 bytes per second
  const bytesPerSecond = 2500;
  const audioBytes = base64Audio.length * 0.75;
  return audioBytes / bytesPerSecond;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user ID from JWT (already verified by Supabase gateway since verify_jwt = true)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode JWT to get user ID (no need to verify - gateway already did)
    const token = authHeader.replace('Bearer ', '');
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[transcribe-audio] User:', userId);

    const requestData = await req.json();
    
    // Validate input with Zod
    const validation = validateInput(transcribeAudioSchema, requestData);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { audio } = validation.data;

    // Check audio duration before sending to API
    const estimatedDuration = estimateAudioDuration(audio);
    console.log('[transcribe-audio] Estimated duration:', estimatedDuration.toFixed(1), 'seconds');
    
    if (estimatedDuration > 55) {
      // Google Speech API sync limit is 60 seconds, give 5s buffer
      console.warn('[transcribe-audio] Audio too long for sync API:', estimatedDuration.toFixed(1), 's');
      return new Response(JSON.stringify({ 
        error: 'Audio too long. Please keep recordings under 1 minute.',
        code: 'AUDIO_TOO_LONG',
        estimatedDuration: Math.round(estimatedDuration),
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Google Cloud credentials
    const googleCredentials = Deno.env.get('GOOGLE_VERTEX_AI_KEY');
    if (!googleCredentials) {
      throw new Error('Google Cloud credentials not configured');
    }

    // Parse the service account key
    const serviceAccount = JSON.parse(googleCredentials);
    
    // Get access token for Google Cloud API
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createJWT(serviceAccount),
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${await tokenResponse.text()}`);
    }

    const { access_token } = await tokenResponse.json();

    // Call Google Cloud Speech-to-Text API
    const response = await fetch(GOOGLE_SPEECH_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: audio,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[transcribe-audio] Google API error:', errorText);
      
      // Check for specific error about audio length
      if (errorText.includes('Sync input too long')) {
        return new Response(JSON.stringify({ 
          error: 'Audio too long. Please keep recordings under 1 minute.',
          code: 'AUDIO_TOO_LONG',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Google Speech API error: ${errorText}`);
    }

    const result = await response.json();
    
    // Extract transcription from Google's response format
    const transcription = result.results
      ?.map((r: any) => r.alternatives?.[0]?.transcript)
      .join(' ') || '';

    console.log('[transcribe-audio] Success, transcript length:', transcription.length);

    return new Response(
      JSON.stringify({ text: transcription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[transcribe-audio] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to transcribe audio. Please try again.',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
