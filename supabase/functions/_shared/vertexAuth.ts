/**
 * Shared Vertex AI authentication helper
 * Reusable JWT-based authentication for Google Cloud Vertex AI
 */

interface ServiceAccount {
  private_key: string;
  private_key_id: string;
  client_email: string;
  project_id: string;
}

let cachedToken: { token: string; projectId: string; expiresAt: number } | null = null;

/**
 * Create JWT for Google Cloud authentication
 */
async function createJWT(serviceAccount: ServiceAccount): Promise<string> {
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

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const privateKey = serviceAccount.private_key;
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  
  // Extract base64 content, removing header, footer, and all whitespace/newlines
  const pemContents = privateKey
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')  // Remove all whitespace including newlines
    .trim();
  
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

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

/**
 * Get Google Cloud access token and project ID (with caching)
 */
export async function getVertexAccessToken(): Promise<{ token: string; projectId: string }> {
  // Check cache
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return { token: cachedToken.token, projectId: cachedToken.projectId };
  }

  // Get credentials
  const googleCredentials = Deno.env.get('GOOGLE_VERTEX_AI_KEY');
  if (!googleCredentials) {
    throw new Error('GOOGLE_VERTEX_AI_KEY not configured');
  }

  // Parse service account - handle escaped newlines in private_key
  const serviceAccount: ServiceAccount = JSON.parse(googleCredentials);
  
  // Ensure private_key has proper newlines (replace literal \n with actual newlines)
  if (serviceAccount.private_key && serviceAccount.private_key.includes('\\n')) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  // Verify project_id exists
  if (!serviceAccount.project_id) {
    console.error('Service account JSON:', { 
      hasProjectId: !!serviceAccount.project_id,
      keys: Object.keys(serviceAccount)
    });
    throw new Error('GOOGLE_VERTEX_AI_KEY does not contain project_id field');
  }

  console.log('Using Google Cloud project:', serviceAccount.project_id);

  // Get access token
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

  const { access_token, expires_in } = await tokenResponse.json();

  // Cache token and project ID
  cachedToken = {
    token: access_token,
    projectId: serviceAccount.project_id,
    expiresAt: Date.now() + (expires_in - 60) * 1000, // Expire 1 min early
  };

  return { token: access_token, projectId: serviceAccount.project_id };
}

/**
 * Call Vertex AI Gemini API
 */
export async function callVertexAI(
  prompt: string,
  systemInstruction?: string,
  options: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  } = {}
): Promise<string> {
  const { token: accessToken, projectId } = await getVertexAccessToken();
  const region = Deno.env.get('GOOGLE_VERTEX_REGION') || 'us-central1';
  const model = options.model || 'gemini-2.5-flash';

  const vertexEndpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;

  const body: any = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 8192,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(vertexEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vertex AI error:', response.status, errorText);
    throw new Error(`Vertex AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('No content in Vertex AI response');
  }

  return content;
}

/**
 * Call Vertex AI Gemini Vision API (for image analysis)
 */
export async function callVertexVision(
  imageBase64: string,
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
  } = {}
): Promise<string> {
  const { token: accessToken, projectId } = await getVertexAccessToken();
  const region = Deno.env.get('GOOGLE_VERTEX_REGION') || 'us-central1';
  const model = options.model || 'gemini-2.5-flash';

  const vertexEndpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;

  // Prepare image URL
  let imageData = imageBase64;
  if (imageBase64.startsWith('data:')) {
    // Extract base64 from data URL
    imageData = imageBase64.split(',')[1];
  } else if (imageBase64.startsWith('http')) {
    // Download and convert to base64
    const imgResponse = await fetch(imageBase64);
    const imgBlob = await imgResponse.arrayBuffer();
    imageData = btoa(String.fromCharCode(...new Uint8Array(imgBlob)));
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.1,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(vertexEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vertex Vision error:', response.status, errorText);
    throw new Error(`Vertex Vision API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('No content in Vertex Vision response');
  }

  return content;
}
