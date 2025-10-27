const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BACKUP_ENCRYPTION_KEY = Deno.env.get('BACKUP_ENCRYPTION_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
  
  // Create canonical headers
  const canonicalHeaders = Object.entries(headers)
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}\n`)
    .sort()
    .join('');
  
  const signedHeaders = Object.keys(headers)
    .map(k => k.toLowerCase())
    .sort()
    .join(';');
  
  // Use the payload hash from headers
  const payloadHash = headers['x-amz-content-sha256'];
  
  // Create canonical request with proper format
  const canonicalRequest = [
    method,
    path,
    '', // query string (empty for GET)
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const canonicalRequestHash = await sha256Hash(canonicalRequest);
  
  // Create string to sign
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  // Calculate signature
  const signingKey = await getSignatureKey(secretKey, dateStamp, region, 's3');
  const signatureBytes = await hmacSha256(signingKey, stringToSign);
  const signature = Array.from(signatureBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Add authorization header
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
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    
    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const user = await userResponse.json();

    // Check admin role using direct REST API
    const roleResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${user.id}&select=role`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!roleResponse.ok) {
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

    const accessKey = Deno.env.get('COLD_STORAGE_ACCESS_KEY')!;
    const secretKey = Deno.env.get('COLD_STORAGE_SECRET_KEY')!;
    const bucket = Deno.env.get('COLD_STORAGE_BUCKET')!;
    const region = Deno.env.get('COLD_STORAGE_REGION') || 'us-east-1';

    const { backup_id, execute_restore = false, tables = [] } = await req.json();

    if (!backup_id) {
      return new Response(JSON.stringify({ error: 'backup_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get backup metadata using direct REST API
    const backupResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/cold_storage_backups?id=eq.${backup_id}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backupResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch backup' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const backupData = await backupResponse.json();
    if (!backupData || backupData.length === 0) {
      return new Response(JSON.stringify({ error: 'Backup not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const backup = backupData[0];

    // Download from S3 using raw HTTP with AWS Signature V4
    const s3Key = backup.backup_name;
    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const path = `/${s3Key}`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    
    const getHeaders = {
      'Host': host,  // Capital H to match working create function
      'x-amz-date': amzDate,
      'x-amz-content-sha256': await sha256Hash(''),
    };
    
    const signedGetHeaders = await signAwsRequest('GET', host, path, getHeaders, accessKey, secretKey, region);
    
    const s3Response = await fetch(`https://${host}${path}`, {
      method: 'GET',
      headers: signedGetHeaders,
    });
    
    if (!s3Response.ok) {
      throw new Error(`S3 GET failed: ${s3Response.status} ${await s3Response.text()}`);
    }
    
    const encryptedDataArray = new Uint8Array(await s3Response.arrayBuffer());

    // Decrypt using AES-256-GCM
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const encryptionKeyMaterial = encoder.encode(BACKUP_ENCRYPTION_KEY!);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encryptionKeyMaterial.slice(0, 32),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const iv = encryptedDataArray.slice(0, 12);
    const encryptedContent = encryptedDataArray.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedContent
    );

    const decryptedData = JSON.parse(decoder.decode(decryptedBuffer));

    // If not executing restore, just return data for viewing
    if (!execute_restore) {
      // Log using direct REST API
      await fetch(`${SUPABASE_URL}/rest/v1/backup_audit_log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          backup_id: backup.id,
          action_type: 'VIEW_BACKUP',
          performed_by: user.id,
          action_details: {
            tables: Object.keys(decryptedData),
            record_count: backup.record_count,
          },
          status: 'success',
        }),
      });

      console.log(`👁️ Backup viewed: ${backup.backup_name}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Backup data retrieved for viewing',
          tables: Object.keys(decryptedData),
          record_count: backup.record_count,
          backup_data: decryptedData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute actual restore - here we need Supabase client for upsert operations
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const tablesToRestore = tables.length > 0 ? tables : Object.keys(decryptedData);
    const restoredTables: string[] = [];
    let totalRecordsRestored = 0;

    for (const tableName of tablesToRestore) {
      if (!decryptedData[tableName]) continue;

      const records = decryptedData[tableName];
      let recordsRestored = 0;

      try {
        for (const record of records) {
          const { error: insertError } = await supabaseAdmin
            .from(tableName)
            .upsert(record, { onConflict: 'id', ignoreDuplicates: false });

          if (!insertError) {
            recordsRestored++;
          }
        }

        restoredTables.push(tableName);
        totalRecordsRestored += recordsRestored;
        console.log(`✅ Restored ${recordsRestored} records to ${tableName}`);
      } catch (error) {
        console.error(`❌ Error restoring ${tableName}:`, error);
      }
    }

    // Log restore action
    await supabaseAdmin.from('backup_audit_log').insert({
      backup_id: backup.id,
      action_type: 'RESTORE_BACKUP',
      performed_by: user.id,
      action_details: {
        tables: restoredTables,
        record_count: totalRecordsRestored,
      },
      status: 'success',
    });

    console.log(`✅ Backup restored: ${backup.backup_name}, ${totalRecordsRestored} records`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup restored successfully',
        restored_tables: restoredTables,
        total_records: totalRecordsRestored,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Restore backup error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});