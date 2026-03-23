# Clever Integration Setup Guide for NabuLearn

## Overview
Clever is the **#1 Student Information System (SIS) integration** used by K-12 schools in the US. It provides:
- Automatic student roster sync
- Automatic teacher roster sync
- Automatic class enrollment
- Daily updates (students added/removed automatically)
- Single Sign-On for students

**This is the most requested feature by school districts.**

---

## ✅ Current Status
- ✅ Backend infrastructure ready
- ✅ OAuth callback endpoint created
- ✅ Data sync logic implemented
- ⚠️ **Requires Clever Developer Account to activate**

---

## Step-by-Step Setup

### Step 1: Create Clever Developer Account

1. Go to [Clever Developer Portal](https://dev.clever.com/)
2. Click **"Sign Up"** (it's free)
3. Create an account using your school/company email
4. Verify your email

---

### Step 2: Create a New Application

1. In Clever dashboard, click **"Create a new application"**
2. Fill in application details:
   - **Application Name:** NabuLearn
   - **Description:** AI-powered literacy and assessment platform for K-12 schools
   - **Icon:** Upload your logo (optional)
   - **Category:** Educational Platform
   - **Website:** https://nabulearn.com

---

### Step 3: Configure OAuth Settings

1. Under **OAuth Settings**:
   - **Redirect URI:** 
     ```
     https://sjigkjwkgovculkovcjy.supabase.co/functions/v1/clever-sync-callback
     ```
   - **Scopes Required:**
     - `read:district_admins`
     - `read:schools`
     - `read:sections`
     - `read:students`
     - `read:teachers`
     - `read:school_admins`

2. Click **"Save"**

---

### Step 4: Get Your Clever Credentials

After creating the application, Clever will provide:

1. **Client ID** (looks like: `abc123xyz789`)
2. **Client Secret** (looks like: `def456uvw123`)

**Save these credentials** - you'll need them in Step 5.

---

### Step 5: Add Credentials to Lovable Cloud

Click the button below to securely add your Clever credentials:

<lov-actions>
  <lov-open-backend>Add Clever Credentials</lov-open-backend>
</lov-actions>

Then create two secrets:
1. Secret name: `CLEVER_CLIENT_ID` → Paste your Client ID
2. Secret name: `CLEVER_CLIENT_SECRET` → Paste your Client Secret

---

### Step 6: Submit for Clever Certification (Optional but Recommended)

For production use with real schools, submit your app for Clever Certification:

1. In Clever dashboard, click **"Submit for Certification"**
2. Clever will review your app (1-2 weeks)
3. Once certified, schools can install your app from Clever Library

**Note:** You can test with Clever's sandbox data **without** certification.

---

## How It Works

### For School Districts:

1. **District IT installs your app** from Clever Library
2. Clever syncs all student/teacher/class data to your database
3. Data updates **automatically every 24 hours**
4. Students sign in with their Clever accounts (SSO)

### For You (The Developer):

The integration handles:
- ✅ Student creation (name, email, grade)
- ✅ Teacher creation (name, email)
- ✅ Classroom creation (name, subject, grade)
- ✅ Student enrollment in classes
- ✅ Teacher assignment to classes
- ✅ Automatic updates (students transfer, graduate, etc.)

---

## Testing with Sandbox Data

Clever provides **free sandbox districts** for testing:

1. In Clever dashboard, go to **"Instant Login"**
2. Click **"Create Sandbox District"**
3. You'll get a district with:
   - 100 fake students
   - 10 fake teachers
   - 20 fake classes
4. Test the OAuth flow with these accounts

---

## Implementation Timeline

**Phase 1: Initial Setup (2 hours)**
- ✅ Create Clever account
- ✅ Configure OAuth
- ✅ Add credentials to backend
- ✅ Test with sandbox district

**Phase 2: First Pilot School (1 week)**
- 🔄 School IT installs your app
- 🔄 Data syncs automatically
- 🔄 Teachers/students can sign in

**Phase 3: Scale (ongoing)**
- 🔄 More schools install from Clever Library
- 🔄 Automatic data sync keeps everything current

---

## What Schools See

When a school installs your app through Clever:

1. **IT Admin approves data sharing**
   - Roster data (students, teachers, classes)
   - Read-only access (you cannot modify Clever data)

2. **Teachers see:**
   - All their classes pre-populated
   - Students automatically enrolled
   - No manual roster entry needed

3. **Students see:**
   - "Sign in with Clever" button
   - One-click login (no password needed)

---

## Cost Analysis

| User Count | Clever Cost | Your Cost | ROI |
|------------|-------------|-----------|-----|
| 1-500 students | Free | $0/mo | ∞ |
| 500-5,000 students | Free | $0/mo | ∞ |
| 5,000+ students | Free | $0/mo | ∞ |

**Clever is FREE for unlimited users.**

---

## Enterprise Benefits

✅ **Zero-touch onboarding:** Schools install, data syncs automatically  
✅ **No manual roster entry:** Saves teachers 2-3 hours per semester  
✅ **Always up-to-date:** Students transfer/leave → automatically reflected  
✅ **Single Sign-On:** Students use their existing school login  
✅ **IT-approved:** Schools trust Clever (used by 70% of US schools)  
✅ **Competitive advantage:** "Clever certified" = serious ed-tech product

---

## Troubleshooting

**Error: "Invalid redirect URI"**
- Check that your redirect URI in Clever **exactly matches** your edge function URL
- Make sure there are no trailing slashes

**No data syncing after installation**
- Check edge function logs in Lovable Cloud backend
- Verify `CLEVER_CLIENT_ID` and `CLEVER_CLIENT_SECRET` are set correctly

**Students can't sign in with Clever**
- Ensure Clever SSO is enabled in your auth settings
- Check that the district has approved data sharing

---

## Deployment Checklist

Before pitching to schools:

- [ ] Clever app created and configured
- [ ] OAuth redirect URI set correctly
- [ ] Credentials added to Lovable Cloud backend
- [ ] Tested with Clever sandbox district
- [ ] Edge function logs show successful sync
- [ ] Students can sign in with Clever SSO
- [ ] (Optional) Clever certification submitted

---

## Next Steps After Setup

1. **Add "Install via Clever" button** to your marketing site
2. **Create Clever integration demo video** for sales pitches
3. **Document for school IT:** "How to install NabuLearn via Clever"
4. **Add "Clever Certified" badge** to your homepage (after certification)

---

## Why This Matters for Sales

Clever integration is **the difference** between:

❌ "We'll need IT to manually upload 500 student records"  
✅ "IT clicks 'Install' and all 500 students are auto-enrolled in 5 minutes"

**Schools won't adopt your product at scale without Clever.**

---

## Questions?

Clever documentation: https://dev.clever.com/docs  
Clever support: developers@clever.com  
Integration issues: Check edge function logs in Lovable Cloud backend
