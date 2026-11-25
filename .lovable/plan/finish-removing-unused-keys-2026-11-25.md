# Finish removing unused keys

## Answer: which saved keys does the app still need?

**Not needed. Safe to delete (nothing in the app uses them):**
- Google AI key (the Gemini/Vertex key)
- Old OpenAI key
- Google Cloud project ID
- Google sign-in client ID and client secret. Google sign-in on the website runs through the built-in sign-in and doesn't read these.

**Still needed. Keep:**
- ElevenLabs and Benny's voice ID: Benny redub and Pre-K word audio
- LALAL: music split in the Pre-K editor
- Resend: emails
- R2 (4 keys): video and audio storage
- Cold storage (3 keys) and backup encryption key: nightly backups
- Clever (3 keys): school Clever sign-in
- App address, scheduled-task key, push notification key, error tracking: core plumbing
- The built-in Lovable key: emails and admin background art. It's capped by your credits.

## What I'll do once you approve
1. Delete the 5 unused keys listed above.
2. Save the work (the Google AI features are already turned off and the old server functions are already deleted).

## What only you can do
- In Google Cloud, delete the service account key and turn off Vertex AI billing.
- In OpenAI, revoke the old key.
- In ElevenLabs and LALAL, set a monthly spending limit.
