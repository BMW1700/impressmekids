# Google SSO Setup Guide for NabuLearn

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
3. Project name: `NabuLearn Auth`
4. Click **"Create"**

---

### Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, navigate to:
   - **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** (for all users)
3. Fill in required fields:
   - **App name:** NabuLearn
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
4. Name: `NabuLearn Web Client`

5. **Authorized JavaScript origins:**
   ```
   https://nabulearn.com
   ```

6. **Authorized redirect URIs:**
   ```
   https://sjigkjwkgovculkovcjy.supabase.co/auth/v1/callback
    https://nabulearn.com/auth
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

1. Go to your app's login page: [https://nabulearn.com/auth](https://nabulearn.com/auth)
2. Click **"Sign in with Google"**
3. Choose a Google account
4. You should be redirected back and logged in automatically

---

## Troubleshooting Guide

### Error: Google 403 "access_blocked" or "This app is blocked"

This error means Google is blocking sign-in attempts. Follow these steps **in order**:

#### Step 1: Check OAuth Consent Screen Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Check your **User Type**:

   **If User Type is "Internal":**
   - This only allows users from your organization's Workspace
   - If you're testing with a personal Gmail account, it will fail
   - **Solution:** Change to **"External"** to allow any Google account

   **If User Type is "External":**
   - Check the **Publishing status**:
     - If **"Testing"**: Only whitelisted users can sign in
     - **Solution A:** Add your test email to **"Test users"** (up to 100 users)
     - **Solution B:** Click **"Publish App"** to allow anyone to sign in

4. **Verify Scopes** (at the bottom of the page):
   - Must include:
     - `openid`
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - If missing, click **"Edit App"** → **"Scopes"** → Add these scopes → **"Save"**

5. Click **"Save and Continue"**

#### Step 2: Verify OAuth Client ID Configuration

1. Navigate to **APIs & Services** → **Credentials**
2. Find your **OAuth 2.0 Client ID** (should be "Web application" type)
3. Click the **edit icon** (pencil)
4. **Verify Authorized JavaScript origins:**
   ```
    https://nabulearn.com
   ```
   - Must be exactly this URL (no trailing slash, no `http://`)

5. **Verify Authorized redirect URIs:**
   ```
   https://sjigkjwkgovculkovcjy.supabase.co/auth/v1/callback
   ```
   - This MUST exactly match the "Callback URL" shown in your backend's Google settings
   - Check backend to confirm: Users → Auth Settings → Google Settings → "Callback URL"

6. Click **"Save"**

#### Step 3: Confirm Backend Credentials Match

<lov-actions>
  <lov-open-backend>Open Backend Settings</lov-open-backend>
</lov-actions>

1. In the backend dashboard, go to **Users** → **Auth Settings** → **Google Settings**
2. **Verify these match your Google Cloud OAuth Client:**
   - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abc123xyz`)
3. If they don't match, copy-paste from Google Cloud Console and **Save**

#### Step 4: Clear Browser Cache & Test

1. **Close all browser windows** (this clears session cookies)
2. Open a **new incognito/private window**
3. Go to: `https://impress-me-kids.lovable.app/auth`
4. Click **"Sign in with Google"**
5. **Test with both:**
   - A personal **Gmail** account (e.g., `yourname@gmail.com`)
   - A **school/Workspace** account (e.g., `teacher@district.org`) if applicable

#### Step 5: Check Error Details

If sign-in still fails, check the URL bar for error parameters:

- `error=access_denied` → User cancelled or app not approved
- `error=admin_policy_enforced` → Workspace admin blocked the app
- `error=org_internal` → App is set to "Internal" but user is external

**If using a school/Workspace account:**
- The school's Workspace admin may need to approve your app
- Go to: Google Workspace Admin Console → Security → API Controls → Manage Third-Party App Access
- Request admin to whitelist your OAuth Client ID

---

### Other Common Errors

**Error: "redirect_uri_mismatch"**
- Your redirect URI in Google Cloud doesn't match the backend's callback URL
- Solution: Copy the **exact** callback URL from backend settings and paste into Google Cloud

**Error: "requested path is invalid"**
- Your Site URL or Redirect URL is not configured in the backend
- Solution: Set **Site URL** to `https://impress-me-kids.lovable.app` in backend auth settings

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
