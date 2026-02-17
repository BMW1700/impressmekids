import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

import { corsHeaders } from '../_shared/cors.ts';

interface CleverUserInfo {
  type: string;
  data: {
    id: string;
    district: string;
    email: string;
    name: {
      first: string;
      last: string;
    };
    roles: {
      student?: { id: string };
      teacher?: { id: string };
      district_admin?: { id: string };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const appUrl = Deno.env.get('APP_URL') || 'https://impressmekids.com';
  
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Clever OAuth error:', error);
      return Response.redirect(`${appUrl}/auth?error=${encodeURIComponent(error)}`, 302);
    }

    if (!code) {
      console.error('No authorization code provided');
      return Response.redirect(`${appUrl}/auth?error=no_code`, 302);
    }

    // Get Clever credentials
    const cleverClientId = Deno.env.get('CLEVER_CLIENT_ID');
    const cleverClientSecret = Deno.env.get('CLEVER_CLIENT_SECRET');

    if (!cleverClientId || !cleverClientSecret) {
      console.error('Clever credentials not configured');
      return Response.redirect(`${appUrl}/auth?error=config_error`, 302);
    }

    // Exchange code for access token
    console.log('Exchanging code for token...');
    const tokenResponse = await fetch('https://clever.com/oauth/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${cleverClientId}:${cleverClientSecret}`)}`,
      },
      body: JSON.stringify({
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/clever-sync-callback`,
      }),
    });

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      console.error('Failed to get access token:', tokens);
      return Response.redirect(`${appUrl}/auth?error=token_failed`, 302);
    }

    const accessToken = tokens.access_token;
    console.log('Got access token, fetching user info...');

    // Get the current logged-in user's info from Clever
    const meResponse = await fetch('https://api.clever.com/v3.0/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    const meData: CleverUserInfo = await meResponse.json();
    console.log('Clever user info:', JSON.stringify(meData));

    if (!meData.data || !meData.data.email) {
      console.error('Invalid user data from Clever:', meData);
      return Response.redirect(`${appUrl}/auth?error=invalid_user`, 302);
    }

    const email = meData.data.email;
    const fullName = `${meData.data.name.first} ${meData.data.name.last}`;
    const cleverId = meData.data.id;
    
    // Determine role based on Clever user type
    let role: 'student' | 'teacher' | 'admin' = 'student';
    if (meData.data.roles?.teacher) {
      role = 'teacher';
    } else if (meData.data.roles?.district_admin) {
      role = 'admin';
    }

    console.log(`User: ${fullName} (${email}), Role: ${role}`);

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // User exists - update their metadata
      console.log('User exists, updating metadata...');
      userId = existingUser.id;
      
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: fullName,
          clever_id: cleverId,
          role: role,
        },
      });
    } else {
      // Create new user
      console.log('Creating new user...');
      const tempPassword = crypto.randomUUID();
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          clever_id: cleverId,
          role: role,
        },
      });

      if (authError || !authData?.user) {
        console.error('Failed to create user:', authError);
        return Response.redirect(`${appUrl}/auth?error=user_creation_failed`, 302);
      }

      userId = authData.user.id;
      console.log('Created user:', userId);
    }

    // Generate a magic link for the user to sign in
    console.log('Generating sign-in link...');
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${appUrl}/auth?clever_login=success`,
      },
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Failed to generate magic link:', linkError);
      return Response.redirect(`${appUrl}/auth?error=link_failed`, 302);
    }

    // Extract the token from the magic link
    const magicLinkUrl = new URL(linkData.properties.action_link);
    const token = magicLinkUrl.searchParams.get('token');
    const tokenType = magicLinkUrl.searchParams.get('type');
    
    // Redirect to the app's auth page with the magic link token
    // The Supabase client on the frontend will handle the token verification
    const redirectUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token}&type=${tokenType}&redirect_to=${encodeURIComponent(`${appUrl}/auth?clever_login=success`)}`;
    
    console.log('Redirecting to:', redirectUrl);
    return Response.redirect(redirectUrl, 302);

  } catch (error) {
    console.error('Clever SSO error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.redirect(`${appUrl}/auth?error=${encodeURIComponent(errorMessage)}`, 302);
  }
});
