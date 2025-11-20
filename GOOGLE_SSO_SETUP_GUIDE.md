# Google SSO Setup Guide for Impress Me Kids

## Overview
Google Single Sign-On (SSO) allows students and teachers to sign in using their existing Google accounts (e.g., @gmail.com or school Google Workspace accounts). This is **critical for enterprise adoption** as most schools use Google Workspace for Education.

## ✅ Current Status
- ✅ Frontend implementation complete (Google sign-in button working)
- ✅ Backend OAuth flow configured
- ⚠️ **Requires Google Cloud OAuth credentials to activate**

---

## Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Project name: `Impress Me Kids Auth`
4. Click **"Create"**

---

### Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, navigate to:
   - **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** (for all users)
3. Fill in required fields:
   - **App name:** Impress Me Kids
   - **User support email:** your-email@domain.com
   - **Developer contact email:** your-email@domain.com
4. Under **"Authorized domains"**, add:
   ```
   lovableproject.com
   lovable.app
   ```
5. **Scopes:** Add the following non-sensitive scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Click **"Save and Continue"**

---

### Step 3: Create OAuth Client ID

1. Navigate to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"OAuth Client ID"**
3. Application type: **"Web application"**
4. Name: `Impress Me Kids Web Client`

5. **Authorized JavaScript origins:**
   ```
   https://impress-me-kids.lovable.app
   https://your-custom-domain.com (if applicable)
   ```

6. **Authorized redirect URIs:**
   ```
   https://sjigkjwkgovculkovcjy.supabase.co/auth/v1/callback
   https://impress-me-kids.lovable.app/auth
   ```

7. Click **"Create"**
8. **Save these credentials** (you'll need them in Step 4):
   - Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-abc123xyz`)

---

### Step 4: Add Credentials to Lovable Cloud Backend

Click the button below to open your backend settings:

<lov-actions>
  <lov-open-backend>Configure Google OAuth</lov-open-backend>
</lov-actions>

Once in the backend dashboard:

1. Navigate to **Users** → **Auth Settings** → **Google Settings**
2. Enable **Google provider**
3. Paste your **Client ID** and **Client Secret**
4. Save changes

---

### Step 5: Update Redirect URLs (If Using Custom Domain)

If you have a custom domain:

1. In Lovable Cloud dashboard:
   - Go to **Users** → **Auth Settings**
   - Under **Site URL**, set: `https://your-custom-domain.com`
   - Under **Redirect URLs**, add: `https://your-custom-domain.com/auth`

2. Go back to Google Cloud Console:
   - Add your custom domain to **Authorized JavaScript origins**
   - Add `https://your-custom-domain.com/auth` to **Authorized redirect URIs**

---

## Testing

1. Go to your app's login page: [https://impress-me-kids.lovable.app/auth](https://impress-me-kids.lovable.app/auth)
2. Click **"Sign in with Google"**
3. Choose a Google account
4. You should be redirected back and logged in automatically

### Troubleshooting

**Error: "redirect_uri_mismatch"**
- Check that your redirect URI in Google Cloud **exactly matches** what's in Lovable Cloud backend
- Common issue: Missing `/auth` at the end of the URL

**Error: "requested path is invalid"**
- Your Site URL or Redirect URL is not set correctly in Lovable Cloud
- Open backend settings and verify both are set to your app's domain

**Users stuck on "Choose role" after Google sign-in**
- This is expected for district staff (e.g., @district.edu emails)
- Regular users (@gmail.com) will be assigned 'student' role by default
- Teachers should sign up with email/password first, then link Google later

---

## Enterprise Benefits

Once configured, Google SSO provides:

✅ **One-click sign-in** for students with school Google accounts  
✅ **No password management** (uses school's existing auth)  
✅ **Faster onboarding** (students don't need to create new accounts)  
✅ **District IT compliance** (leverages Google Workspace security)  
✅ **Professional appearance** (shows you integrate with enterprise tools)

---

## Next Steps

After Google SSO is working:
1. ✅ Test with a few pilot users
2. 📋 Document for teachers: "How to have students sign in with Google"
3. 🔗 Consider adding Microsoft SSO for districts using Office 365
4. 🔐 Enable 2FA for admin accounts (separate from Google OAuth)

---

## Cost: $0/month
Google OAuth is **completely free** for unlimited users.
