import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COLD_STORAGE_ACCESS_KEY = Deno.env.get('COLD_STORAGE_ACCESS_KEY');
const COLD_STORAGE_SECRET_KEY = Deno.env.get('COLD_STORAGE_SECRET_KEY');
const COLD_STORAGE_BUCKET = Deno.env.get('COLD_STORAGE_BUCKET');
const COLD_STORAGE_REGION = Deno.env.get('COLD_STORAGE_REGION') || 'us-east-1';
const BACKUP_ENCRYPTION_KEY = Deno.env.get('BACKUP_ENCRYPTION_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// AWS Signature V4 signing helper functions
async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  // Create a proper ArrayBuffer from Uint8Array - cast to ArrayBuffer for Deno's type system
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
  // Create proper ArrayBuffer - cast to ArrayBuffer for Deno's type system
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
  body: Uint8Array,
  accessKey: string,
  secretKey: string,
  region: string
): Promise<Record<string, string>> {
  // Extract x-amz-date from headers (must be provided by caller)
  const amzDate = headers['x-amz-date'];
  if (!amzDate) {
    throw new Error('x-amz-date header is required in input headers');
  }
  const dateStamp = amzDate.substring(0, 8);
  
  console.log('🔐 Creating canonical request...');
  console.log(`📅 Using x-amz-date: ${amzDate}`);
  
  // Create canonical headers
  const canonicalHeaders = Object.entries(headers)
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}\n`)
    .sort()
    .join('');
  
  const signedHeaders = Object.keys(headers)
    .map(k => k.toLowerCase())
    .sort()
    .join(';');
  
  console.log(`📋 Signed headers: ${signedHeaders}`);
  
  // Use the payload hash from headers (already calculated)
  const payloadHash = headers['x-amz-content-sha256'] || await sha256Hash(body);
  
  // Create canonical request
  const canonicalRequest = [
    method,
    path,
    '', // query string (empty for PUT)
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const canonicalRequestHash = await sha256Hash(canonicalRequest);
  console.log(`🎯 Canonical request hash: ${canonicalRequestHash.substring(0, 16)}...`);
  console.log(`📋 Canonical request (first 200 chars):\n${canonicalRequest.substring(0, 200)}...`);
  
  // Create string to sign
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  console.log('🔏 String to sign created');
  
  // Calculate signature
  const signingKey = await getSignatureKey(secretKey, dateStamp, region, 's3');
  const signatureBytes = await hmacSha256(signingKey, stringToSign);
  const signature = Array.from(signatureBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  console.log(`✍️ Signature: ${signature.substring(0, 16)}...`);
  
  // Add authorization header
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  // Return headers with authorization (x-amz-date already in input headers)
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
    console.log('🔍 Validating AWS credentials...');
    // Validate AWS credentials are present
    if (!COLD_STORAGE_ACCESS_KEY || !COLD_STORAGE_SECRET_KEY || !COLD_STORAGE_BUCKET) {
      console.error('❌ Missing AWS credentials');
      return new Response(
        JSON.stringify({ error: 'Missing AWS credentials. Please configure COLD_STORAGE_ACCESS_KEY, COLD_STORAGE_SECRET_KEY, and COLD_STORAGE_BUCKET secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ AWS credentials validated');

    console.log('🔧 Initializing Supabase admin client...');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔐 Verifying authentication...');
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    // If no auth header, this is a cron job - proceed with backup
    if (!authHeader) {
      console.log('📅 Cron job detected - proceeding with automated backup');
      userId = null; // Cron jobs have no specific user
    } else {
      // Manual call - verify admin role
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) {
        console.error('❌ Authentication failed:', authError);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('✅ User authenticated:', user.id);
      userId = user.id;

      console.log('🔍 Checking admin role...');
      // Check admin role
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!roleData || roleData.role !== 'admin') {
        console.error('❌ User is not admin:', roleData?.role);
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('✅ Admin role verified');
    }

    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${backupTimestamp}.enc`;
    console.log(`📋 Creating backup: ${backupName}`);

    // Tables to backup (excluding system tables)
    const tablesToBackup = [
      'profiles', 'classrooms', 'classroom_students', 'assignments',
      'assignment_submissions', 'questions', 'question_groups', 
      'aura_records', 'tournaments', 'matches', 'parent_accounts',
      'parent_student_links', 'parent_access_requests', 'teacher_summaries'
    ];

    let totalRecords = 0;
    const backupData: any = {};

    console.log(`📊 Fetching data from ${tablesToBackup.length} tables...`);
    // Fetch data from all tables
    for (const table of tablesToBackup) {
      const { data, error } = await supabaseAdmin.from(table).select('*');
      if (!error && data) {
        backupData[table] = data;
        totalRecords += data.length;
        console.log(`  ✓ ${table}: ${data.length} records`);
      } else if (error) {
        console.warn(`  ⚠ ${table}: ${error.message}`);
      }
    }
    console.log(`✅ Data collection complete: ${totalRecords} total records`);

    // Convert to JSON
    console.log('🔄 Converting data to JSON...');
    const jsonData = JSON.stringify(backupData);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(jsonData);
    console.log(`📏 Data size: ${dataBytes.length} bytes`);

    // Proper AES-256-GCM encryption
    console.log('🔐 Encrypting backup data...');
    const encryptionKeyMaterial = encoder.encode(BACKUP_ENCRYPTION_KEY!);
    
    // Import key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encryptionKeyMaterial.slice(0, 32), // Use first 32 bytes for AES-256
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    console.log('🎲 Generated random IV');
    
    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBytes
    );
    console.log('✅ Data encrypted successfully');

    // Combine IV + encrypted data for storage
    const encryptedData = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    encryptedData.set(iv, 0);
    encryptedData.set(new Uint8Array(encryptedBuffer), iv.length);

    console.log(`📦 Prepared encrypted backup: ${encryptedData.length} bytes`);

    // Upload to S3 using direct REST API
    console.log('🚀 Uploading to S3...');
    
    // Calculate payload hash BEFORE creating headers (hash raw bytes directly)
    console.log('📊 Calculating payload hash...');
    console.log(`📏 Payload size: ${encryptedData.length} bytes`);
    const payloadHashHex = await sha256Hash(encryptedData);
    console.log(`🔑 Payload hash: ${payloadHashHex.substring(0, 16)}...`);
    
    // CRITICAL: Normalize bucket name to lowercase for proper AWS signature
    const normalizedBucket = COLD_STORAGE_BUCKET!.toLowerCase();
    if (COLD_STORAGE_BUCKET !== normalizedBucket) {
      console.warn(`⚠️ Bucket name normalized: ${COLD_STORAGE_BUCKET} -> ${normalizedBucket}`);
    }
    
    const host = `${normalizedBucket}.s3.${COLD_STORAGE_REGION}.amazonaws.com`;
    const path = `/${backupName}`;
    const uploadUrl = `https://${host}${path}`;
    
    // Calculate x-amz-date BEFORE signing (must be included in signature)
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    console.log(`📅 Generated x-amz-date: ${amzDate}`);
    
    const s3Headers = {
      'Host': host,
      'Content-Type': 'application/octet-stream',
      'Content-Length': encryptedData.length.toString(),
      'x-amz-content-sha256': payloadHashHex,  // CRITICAL: Required by AWS S3
      'x-amz-date': amzDate,  // CRITICAL: Must be included BEFORE signing
      'x-amz-server-side-encryption': 'AES256',
      'x-amz-meta-encryption-method': 'AES-256-GCM',
      'x-amz-meta-iv-length': '12',
      'x-amz-meta-created-at': new Date().toISOString(),
    };

    console.log('🔐 Signing S3 request...');
    console.log(`📋 Headers to sign: ${Object.keys(s3Headers).join(', ')}`);
    const signedHeaders = await signAwsRequest(
      'PUT',
      host,
      path,
      s3Headers,
      encryptedData,
      COLD_STORAGE_ACCESS_KEY!,
      COLD_STORAGE_SECRET_KEY!,
      COLD_STORAGE_REGION
    );
    console.log(`✅ Request signed successfully`);
    console.log(`📋 Final headers: ${Object.keys(signedHeaders).join(', ')}`);

    console.log('📤 Sending PUT request to S3...');
    console.log(`🌐 URL: ${uploadUrl}`);
    const s3Response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: signedHeaders,
      body: encryptedData,
    });

    console.log(`📬 S3 Response status: ${s3Response.status} ${s3Response.statusText}`);
    console.log(`📋 S3 Response headers: ${JSON.stringify(Object.fromEntries(s3Response.headers))}`);

    if (!s3Response.ok) {
      const errorText = await s3Response.text();
      console.error('❌ S3 upload failed:', s3Response.status, errorText);
      console.error(`📋 Request headers used:`, JSON.stringify(signedHeaders, null, 2));
      throw new Error(`S3 upload failed: ${s3Response.status} - ${errorText}`);
    }

    console.log('✅ Successfully uploaded to S3');
    const s3Location = `s3://${COLD_STORAGE_BUCKET}/${backupName}`;

    // Record backup in database
    console.log('💾 Recording backup in database...');
    const { data: backupRecord, error: insertError } = await supabaseAdmin
      .from('cold_storage_backups')
      .insert({
        backup_name: backupName,
        backup_size_bytes: encryptedData.length,
        tables_included: tablesToBackup,
        record_count: totalRecords,
        storage_location: s3Location,
        created_by: userId, // Will be null for cron jobs
        metadata: {
          tables_count: tablesToBackup.length,
          compression: 'none',
          encryption: 'AES-256-GCM',
          iv_length: 12,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to record backup:', insertError);
    } else {
      console.log('✅ Backup recorded in database:', backupRecord.id);
    }

    // Log audit trail
    console.log('📝 Creating audit log entry...');
    await supabaseAdmin.from('backup_audit_log').insert({
      backup_id: backupRecord?.id,
      action_type: 'CREATE_BACKUP',
      performed_by: userId, // Will be null for cron jobs
      action_details: {
        tables: tablesToBackup,
        record_count: totalRecords,
        size_bytes: encryptedData.length,
      },
      status: 'success',
    });

    console.log(`✅ Backup created: ${backupName}, ${totalRecords} records, ${encryptedData.length} bytes`);

    return new Response(
      JSON.stringify({
        success: true,
        backup_name: backupName,
        record_count: totalRecords,
        size_bytes: encryptedData.length,
        backup_id: backupRecord?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Backup creation error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
