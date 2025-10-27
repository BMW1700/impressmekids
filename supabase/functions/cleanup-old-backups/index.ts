const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 signing helper functions
async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

async function sha256Hash(data: string | Uint8Array): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof data === 'string') {
    const encoded = new TextEncoder().encode(data);
    buffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer;
  } else {
    buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
  const kDate = hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp);
  return kDate.then(k => hmacSha256(k, regionName))
    .then(k => hmacSha256(k, serviceName))
    .then(k => hmacSha256(k, 'aws4_request'));
}

async function signAwsRequest(
  method: string,
  host: string,
  path: string,
  headers: Record<string, string>,
  accessKey: string,
  secretKey: string,
  region: string
): Promise<Record<string, string>> {
  const amzDate = headers['x-amz-date'];
  if (!amzDate) throw new Error('x-amz-date header required');
  
  const dateStamp = amzDate.substring(0, 8);
  const canonicalHeaders = Object.entries(headers)
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}\n`)
    .sort()
    .join('');
  const signedHeaders = Object.keys(headers).map(k => k.toLowerCase()).sort().join(';');
  const payloadHash = await sha256Hash('');
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const canonicalRequestHash = await sha256Hash(canonicalRequest);
  
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
  
  const signingKey = await getSignatureKey(secretKey, dateStamp, region, 's3');
  const signatureBytes = await hmacSha256(signingKey, stringToSign);
  const signature = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    ...headers,
    'Authorization': authorizationHeader,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticate user using direct REST API
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Direct REST API call for authentication
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseServiceKey,
      },
    });
    
    if (!userResponse.ok) {
      console.error('Auth error:', await userResponse.text());
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const user = await userResponse.json();

    // Check if user is admin using direct REST API
    const roleResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${user.id}&select=role`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!roleResponse.ok) {
      console.error('Role check failed:', await roleResponse.text());
      return new Response(JSON.stringify({ error: 'Failed to check role' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const roleData = await roleResponse.json();
    if (!roleData || roleData.length === 0 || roleData[0].role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting cleanup of old backups (>90 days)...');

    const accessKey = Deno.env.get('COLD_STORAGE_ACCESS_KEY')!;
    const secretKey = Deno.env.get('COLD_STORAGE_SECRET_KEY')!;
    const bucket = Deno.env.get('COLD_STORAGE_BUCKET')!;
    const region = Deno.env.get('COLD_STORAGE_REGION') || 'us-east-1';

    // Calculate cutoff date (90 days ago)
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    console.log('Cutoff date for cleanup:', cutoffDate.toISOString());

    // Find backups older than 90 days using direct REST API
    const backupsResponse = await fetch(
      `${supabaseUrl}/rest/v1/cold_storage_backups?backup_timestamp=lt.${cutoffDate.toISOString()}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backupsResponse.ok) {
      console.error('Error fetching old backups:', await backupsResponse.text());
      throw new Error('Failed to fetch old backups');
    }

    const oldBackups = await backupsResponse.json();

    if (!oldBackups || oldBackups.length === 0) {
      console.log('No backups older than 90 days found');
      
      // Log using direct REST API
      await fetch(`${supabaseUrl}/rest/v1/backup_audit_log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          user_id: user.id,
          action_type: 'cleanup',
          status: 'success',
          action_details: {
            deleted_count: 0,
            freed_space_bytes: 0,
            cutoff_date: cutoffDate.toISOString(),
          },
        }),
      });

      return new Response(JSON.stringify({
        success: true,
        deleted_count: 0,
        freed_space_bytes: 0,
        message: 'No backups older than 90 days found',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${oldBackups.length} backups to delete`);

    let deletedCount = 0;
    let freedSpaceBytes = 0;
    const errors = [];

    // Delete each old backup from S3 and database
    for (const backup of oldBackups) {
      try {
        console.log(`Deleting backup: ${backup.backup_name}`);

        // Delete from S3 using raw HTTP with AWS Signature V4
        const host = `${bucket}.s3.${region}.amazonaws.com`;
        const path = `/${backup.s3_key}`;
        const now = new Date();
        const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
        
        const deleteHeaders = {
          'host': host,
          'x-amz-date': amzDate,
          'x-amz-content-sha256': await sha256Hash(''),
        };
        
        const signedDeleteHeaders = await signAwsRequest('DELETE', host, path, deleteHeaders, accessKey, secretKey, region);
        
        const deleteResponse = await fetch(`https://${host}${path}`, {
          method: 'DELETE',
          headers: signedDeleteHeaders,
        });
        
        if (!deleteResponse.ok) {
          throw new Error(`S3 DELETE failed: ${deleteResponse.status}`);
        }
        
        console.log(`Deleted from S3: ${backup.s3_key}`);

        // Delete from database using direct REST API
        const dbDeleteResponse = await fetch(
          `${supabaseUrl}/rest/v1/cold_storage_backups?id=eq.${backup.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!dbDeleteResponse.ok) {
          console.error(`Failed to delete backup from DB: ${backup.id}`, await dbDeleteResponse.text());
          errors.push({
            backup_id: backup.id,
            backup_name: backup.backup_name,
            error: 'Failed to delete from database',
          });
          continue;
        }

        deletedCount++;
        freedSpaceBytes += backup.backup_size_bytes || 0;
        console.log(`Successfully deleted backup: ${backup.backup_name}`);

      } catch (error) {
        console.error(`Error deleting backup ${backup.backup_name}:`, error);
        errors.push({
          backup_id: backup.id,
          backup_name: backup.backup_name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`Cleanup completed. Deleted ${deletedCount} backups, freed ${freedSpaceBytes} bytes`);

    // Log the cleanup action using direct REST API
    await fetch(`${supabaseUrl}/rest/v1/backup_audit_log`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: user.id,
        action_type: 'cleanup',
        status: errors.length > 0 ? 'partial_success' : 'success',
        action_details: {
          deleted_count: deletedCount,
          freed_space_bytes: freedSpaceBytes,
          cutoff_date: cutoffDate.toISOString(),
          errors: errors.length > 0 ? errors : undefined,
        },
      }),
    });

    return new Response(JSON.stringify({
      success: true,
      deleted_count: deletedCount,
      freed_space_bytes: freedSpaceBytes,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully deleted ${deletedCount} old backups, freed ${(freedSpaceBytes / (1024 * 1024)).toFixed(2)} MB`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to cleanup old backups',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});