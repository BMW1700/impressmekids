## Straight answers first

**"Isn't the Teach thing already built?"**
Yes — but only as a *shell*. What exists today in `prek-word-tts` is a single ElevenLabs call that generates one MP3 with the word, letters, and phonemes crammed into one sentence at 0.75× speed. That's why it sounds rushed, mumbles the phonemes, and repeats weirdly — it's one voice take trying to do three jobs. **My plan replaces the guts of that existing Teach button, not adds a new one.** The button, cache, prewarm UI, storage bucket — all stay. What changes is *how the audio is produced and played back*.

**"Do I have to redo the 30 videos?"**
No. Zero video work. This is 100% the audio layer on the word card, not the story videos.

**"Why does R2 show `1000/1000 copied 100%` but re-patch says `failed 1223`?"**
Two different things. Copy succeeded for 1000 files. The re-patch step is failing with `R2 PUT 403 AccessDenied` on the `aura-audio` bucket — that is a **Cloudflare R2 API-token permissions issue**, not a code bug. Fix is in Cloudflare, not the app. Walkthrough below in Part 2.

---

# PART 1 — Rebuild the Teach flow properly

## The core change: 6 tiny audio segments, not 1 big one

Instead of one ElevenLabs take saying `"cat. Let's sound it out. C ... A ... T. /k/ ... /æ/ ... /t/. cat!"` (which sounds mushed because ElevenLabs decides the pacing), we generate **6 separate MP3s** per word and the app plays them with **real, code-controlled silences between them**:

```text
CAT (short vowel, CVC):
  seg-1  "cat"          ← whole word, spoken clean, 0.85×
  seg-2  "C"            ← letter name (long pause after)
  seg-3  "A"            ← letter name
  seg-4  "T"            ← letter name
  seg-5  "cuh — aaa — tuh"   ← sounded out with dashes
  seg-6  "cat"          ← final blend, 0.75×

SHIP (digraph):
  seg-1  "ship"
  seg-2  "S-H"          ← named as digraph
  seg-3  "I"
  seg-4  "P"
  seg-5  "shhh — ihh — puh"
  seg-6  "ship"

RABBIT (multi-syllable):
  seg-1  "rabbit"
  seg-2  "rab"          ← syllable 1
  seg-3  "bit"          ← syllable 2
  seg-4  "rab — bit"    ← blended syllables
  seg-5  "rabbit"       ← whole word
```

Playback in the app:

```text
▶ seg-1                     (whole word)
   [800ms silence]           ← the app inserts real silence, not ElevenLabs
"Let's sound it out."        ← optional, pre-recorded once per voice, cached
   [500ms silence]
▶ seg-2                      (first letter/sound highlights on screen)
   [600ms silence]
▶ seg-3                      (next letter highlights)
   [600ms silence]
▶ seg-4
   [800ms silence]
▶ seg-5                      (blend — whole word highlights)
   [700ms silence]
▶ seg-6                      (final whole word)
```

This is why it will sound dramatically better:

1. **Real pauses.** ElevenLabs is bad at silence; the browser is perfect at it.
2. **Each sound recorded in isolation** = the voice actor (Benny) gives a clean, deliberate delivery of each phoneme instead of racing through them mid-sentence.
3. **Speed control works.** We can slow just the phoneme segments (0.7×) while keeping the whole word natural (0.9×) — impossible in one take.
4. **Karaoke-style letter highlighting** on screen syncs to each segment starting.
5. **Speech-therapy correct.** Onset → nucleus → coda is exactly how Wilson / UFLI / OG programs teach decoding.

## Speed control the parent/teacher can change

Three-way toggle on the word card, saved per-family in localStorage:

- **🐢 Slow** — 900ms gaps, phoneme segs at 0.65×, whole word at 0.8×
- **🚶 Normal** (default) — 600ms gaps, 0.75×, 0.9×
- **🏃 Fast** — 300ms gaps, 0.85×, 1.0×

Default = Slow for Pre-K, since the entire complaint is "it reads too fast." Parent can bump it up.

## What breaks with the current code (and why my plan is different, not additive)

Current `prek-word-tts/index.ts` `mode: "teach"` builds one prompt string, ships it to ElevenLabs, caches one MP3. That is what plays today. It is what David heard. It is unfixable inside one API call because ElevenLabs won't respect the pauses.

My plan **replaces** that path with:

- New mode: `"teach-segment"` — accepts `{ word, segmentKind, segmentText }` and caches one tiny MP3.
- The client's `teachWord()` orchestrator asks the edge function for all 6 segments (cache hits mostly), then plays them with real gaps.
- Old `mode: "teach"` stays as a deprecated fallback for one release, then gets removed.

## The pieces to build

### A. Segmenter — `src/lib/phonicsSegmenter.ts` (new)
Pure function `segmentWord(word) → Segment[]`. Uses your existing `phonicsScopeAndSequence.ts` phoneme map. Handles:
- CVC (cat, dog, sit)
- Digraphs sh/ch/th/ck/wh/ph
- Blends st/fr/pl/tr/…
- Silent-E (cake, kite)
- Vowel teams (rain, moon, boat)
- Multi-syllable fallback (rabbit → rab-bit)

### B. Edge function upgrade — `supabase/functions/prek-word-tts/index.ts`
- Add `mode: "teach-segment"` with `segmentKind` in the cache path: `<voiceId>/v3/teach-segment/<word>/<segmentKind>.mp3`.
- Per-segment voice_settings: phonemes get `stability: 0.75, style: 0.15, speed: 0.7`; whole-word gets `speed: 0.85`.
- Bump `CACHE_VERSION` to `v3` so old rushed MP3s never play again (existing v2 files stay on disk, harmless).

### C. Teach orchestrator — `src/lib/bennyTeach.ts` (new)
```ts
teachWord(word, {
  pace: "slow" | "normal" | "fast",
  onSegmentStart: (kind, text) => void,  // for UI highlighting
  onDone: () => void,
  signal: AbortSignal,                    // stop cleanly if user leaves
})
```
Fetches all segments in parallel (cache-first), then plays them sequentially with pace-driven gaps.

### D. UI — `src/components/aura/game/rpg/RPGWordReader.tsx`
- The existing Teach button now calls `teachWord()` instead of `speakBenny(word, {mode:"teach"})`.
- Word card shows the word letters in a row; each letter gets a `.highlight` class as its segment plays (soft yellow glow, 300ms fade).
- Speed toggle appears next to Teach: 🐢 🚶 🏃.
- Fixes the wrong-answer bug: after a miss, auto-runs `teachWord()` once, then re-enables the mic and shows Retry — solves David's "can't get back to retry" complaint in the same commit.

### E. Prewarm — `src/pages/superadmin/BennyVoicePrewarm.tsx`
- Each word now needs ~6 segment MP3s instead of 2 blob MP3s. New estimate: **118 words × ~6 segments = ~708 API calls** (matches the number already shown in your screenshot, coincidentally).
- Cost: **~$3–5 one-time**, then $0 forever.
- Progress bar counts segments, not words.

### F. Cache the fixed narration line
`"Let's sound it out."` is generated once per voice and reused for every word. One extra MP3 total.

---

# PART 2 — Fix the R2 migration (the 403 errors)

## What's actually happening

Your screenshot shows:
- ✅ **Copy step**: `1000/1000 copied` — the initial copy of files from Supabase Storage → R2 worked.
- ❌ **Re-patch cache headers**: `Re-patched 0 / attempted 1223 (failed 1223)` on `aura-audio` bucket files with `R2 PUT 403 AccessDenied`.

The re-patch step re-`PUT`s each object in R2 with proper `Cache-Control: public, max-age=31536000, immutable` headers so Cloudflare caches them aggressively. It's failing because **the R2 API token you gave the migration function does not have write permission on the `aura-audio` bucket** (or does not have permission on that account's buckets at all).

Two possibilities:
1. Token was created with **read-only** or **object-read** permissions.
2. Token was created scoped to specific buckets (e.g. `prek-level-videos`) and `aura-audio` isn't in the allow list.

Either way, this is a Cloudflare-side config change, not code.

## Walkthrough — do this yourself, takes 3 minutes

1. Go to **Cloudflare dashboard → R2 → Manage R2 API Tokens**.
2. Find the token you're using for YubiLearn migration (probably named something like `yubi-r2-migrate` or `lovable-r2`).
3. Click it → **Edit** (or "Roll" and create a new one with the same name if edit is disabled — Cloudflare sometimes disallows editing).
4. Set:
   - **Permissions**: `Object Read & Write`
   - **Specify bucket(s)**: choose **"Apply to all buckets in this account"** (safer for future buckets), OR explicitly list every bucket that appears in your Supabase Storage (`prek-level-videos`, `prek-audio`, `prek-word-tts`, `aura-audio`, and any other you use).
   - **TTL**: leave as-is or `Forever`.
5. Save. Cloudflare shows the new **Access Key ID** and **Secret Access Key**.
6. Come back to Lovable — I'll update the R2 secrets (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) with `secrets--set_secret` once you paste the two values here or you set them yourself via the Backend secrets UI.
7. Redeploy `migrate-to-r2` edge function (I'll do this after the secret is set — it only picks up new env vars on redeploy).
8. Back in Super Admin → R2 Migration, click **3. Re-patch cache headers** again. Should now show `Re-patched 1223 / attempted 1223 (failed 0)`.

## Why the copy worked but re-patch didn't

Copy uses **PUT to a new object** — some tokens allow create-only.
Re-patch uses **PUT overwrite on existing object** — requires full Object Read & Write.

Yours is stuck in that in-between permission state.

## After the fix

Once re-patch finishes, `cdn.yubilearn.com` serves every YubiLearn media file (videos, audio, TTS MP3s) from R2 with 1-year immutable cache headers. At 100K users, Supabase egress bill drops from ~$400/mo to under $10/mo, and Cloudflare R2 egress is $0.

---

# Decisions I need from you before I start building

1. **Default speed for Pre-K**: **Slow** (my recommendation — you literally said "reads too fast"), or **Normal**?
2. **Auto-teach on wrong answer**: auto-play once then show Retry, or make the child tap Teach themselves? (Recommendation: auto-play once.)
3. **R2 fix**: do you want to update the Cloudflare token yourself and paste me the new keys, or do you want me to walk you through it live while you screen-share? (I can't reach your Cloudflare account — this step has to be manual.)

Reply with 1/2/3 answers and I'll build the whole Teach rebuild in one shot, plus I'll wire the secret update the moment you have the new R2 keys.
