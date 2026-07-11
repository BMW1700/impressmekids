## Three fixes

### 1. Add R2 Migration card to Super Admin dashboard
The route `/super-admin/r2-migration` exists but there's no card linking to it — that's why you can't see it. Add a 5th card ("R2 Migration") to `SuperAdminDashboard.tsx` alongside Pre-K, K-12, Castle Swarm, Benny Voice.

### 2. Persist prewarm progress across reloads
Right now progress lives in React state, so a reload wipes it — even though the MP3s themselves are safely stored. Fix by having the scan step **probe the storage bucket** for each word/mode and pre-populate row status as `cached` when the file already exists.

Implementation in `BennyVoicePrewarm.tsx`:
- After computing `uniqueWords`, list objects in the `prek-word-tts` bucket under `<voiceId>/say/` and `<voiceId>/teach/` (one `storage.list` call per prefix, paginated).
- Build a `Set<string>` of already-warmed slugs per mode.
- Seed `rows` on load so every already-cached word shows the green ✓ badge immediately, and the progress bar reflects reality.
- Re-run the probe automatically whenever `voiceId` changes.

Result: reload the page → you instantly see "847 / 900 cached" instead of a blank slate, and clicking Prewarm only hits ElevenLabs for the missing ones.

### 3. Make the voice slow + kid-clear
Update `supabase/functions/prek-word-tts/index.ts` prompts and voice settings:

**Say mode** — currently just `"cat."` spoken at speed 1.0.
Change to say the word **twice with a pause**, at slower speed:
```
"cat... cat."
```
with `speed: 0.85`, `stability: 0.6`, `style: 0.25` (calmer, clearer, less dramatic).

**Teach mode** — currently `"Cat. C — A — T. c - a - t... cat!"` at speed 0.9.
Rewrite for real phonics teaching:
```
"cat. Let's sound it out. C ... A ... T. /k/ ... /æ/ ... /t/. cat!"
```
For multi-syllable words:
```
"rabbit. Let's sound it out. rab ... bit. rabbit!"
```
With `speed: 0.75` (much slower), `stability: 0.65`, plus explicit ellipses (ElevenLabs interprets `...` as real pauses) so each letter/phoneme lands distinctly.

Also add a tiny phoneme map for common CVC letters (`a → /æ/`, `e → /ɛ/`, `c → /k/`, etc.) so the teach prompt produces the actual sound, not the letter name, on the second pass.

**Important — cache invalidation:** Because the cache key is `<voiceId>/<mode>/<slug>.mp3`, the existing warmed files would still play the old fast version. Two options:
- **(a)** Bump the object path to `<voiceId>/v2/<mode>/<slug>.mp3` so all old files are ignored and you re-run the prewarm once. Old files stay on disk (harmless) but nothing points to them.
- **(b)** Add a "Force regenerate" toggle in the prewarm UI that passes `force: true` and the edge function overwrites the existing MP3.

Recommend **(a) + (b) together**: bump to `v2` for a clean slate, and keep the Force toggle for future voice/style tweaks so you never have to touch code again.

### Files touched
- `src/pages/superadmin/SuperAdminDashboard.tsx` — add R2 Migration card
- `src/pages/superadmin/BennyVoicePrewarm.tsx` — storage probe on scan, Force regenerate toggle
- `supabase/functions/prek-word-tts/index.ts` — new prompts, slower voice settings, `v2` path, optional `force` flag
