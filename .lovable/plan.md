
# Plan: Market research first, then decide on optional bulk-drop

Two things, in this order. Research is the priority — the splitter is a *maybe*, gated on whether the research says we have something special.

---

## Part 1 — Market research: is anyone doing what our backend does?

**What our backend actually does (the thing to check for uniqueness):**

Two buttons. One video. Result:
1. **Redub button** → ElevenLabs Voice Isolator pulls clean voice, scene-locks it to Track 90, one-shot clips that stop on word cards.
2. **Music button** → LALAL.AI splits music/background stems, scene-locks them to Track 89, fixed clips that pause on word cards, muted source video.
3. Both tracks stay in perfect scene-anchored harmony with the video timeline — not free-floating waveforms.

That combination — **scene-anchored timeline + voice isolation + stem separation + one-button-per-lane + auto-placement** — is the thing to check.

### How I'll research (real, cited — no vibes)

Subagent-driven web sweep + Firecrawl scrapes of each competitor's pricing/features page. Every claim gets a URL.

**Direct competitors to inspect:**
- ElevenLabs (Dubbing Studio, Voice Isolator standalone)
- Rask AI, HeyGen Video Translate, Papercup, Deepdub, Speechify Dubbing
- Descript (Overdub, Studio Sound), Adobe Podcast Enhance, Auphonic
- LALAL.AI, Moises, Audioshake, Splitter.ai (stems only)
- Kapwing, Submagic, Opus Clip, Captions.ai, CapCut
- Runway, Pika, Sora tooling, Veo3 tooling — do any bundle audio cleanup?

**For each I'll capture:** what it does, price, and specifically *does it combine scene-locked timeline + voice isolation + stem separation + auto-placement in one flow?*

**Deliverable:** `docs/product-research/dub-pipeline-market.md` with:
- Feature-vs-tool matrix (columns = our 4 pillars, rows = competitors)
- First-mover verdict (yes/no/partial, with evidence)
- Target segments ranked (AI-video creators using Sora/Veo3/Runway/Kling are the wedge — they *don't* get clean audio by default)
- TAM math (AI-video tools market, dubbing/localization market, creator audio-tools market — cited numbers)
- Pricing comparables + your COGS (LALAL + ElevenLabs per minute) + 3 pricing model options with margin math
- 30-day validation plan: named subreddits/Discords/X communities to post in, willingness-to-pay test
- Minimum shell to sell it separately: auth, billing, project isolation, credit metering — rough effort per item

**Cost/risk:** zero code change, no impact on the working pipeline. You keep testing while it runs.

---

## Part 2 — Optional "drop one file, auto-split" (conditional)

You already answered your own question correctly: **make it optional, top-of-panel toggle, manual per-scene stays default and untouched.**

### Is it worth building? Yes, *if* used carefully.

**Where it works well:**
- Fixed-length cuts (you type N seconds — 8, 10, 13, whatever) of a long audio file that you *know* aligns to your scenes.
- Scene-aware cuts: total audio duration ≈ total scene duration → slice to match each scene's exact length.

**Where it fails (and I won't pretend otherwise):**
- Auto-detecting sentence/beat boundaries from arbitrary audio is unreliable. Silence-based VAD misses breaths, over-cuts music, cuts mid-word on VO3 exports. I will **not** build that — you'd hate it.

So: fixed length + scene-aligned only. Both are deterministic and will actually work.

### UX (only if we build it)

A collapsible **"Bulk import (optional)"** section at the **top** of `RedubStudioPanel.tsx`. Collapsed by default. Manual per-scene flow below it is 100% unchanged.

Inside:
- Dropzone (mp3/wav/m4a/aac/ogg/flac, ≤200 MB)
- Mode: **Fixed length** (number input, any integer 1–120s) OR **Scene-aligned** (auto-fits every scene exactly)
- Target track: Redub (90) or Music (89)
- Preview table: chunk # → timestamp → target scene, with warnings if audio over/under-runs total scene time
- Two actions:
  - **Split & place raw** — chops with ffmpeg, uploads, inserts one `prek_level_audio_clips` row per slice as `duration_mode: "fixed"`, `loop_clip: false`, `pause_on_word_card: true`. Behaves exactly like current Redub/Music clips.
  - **Split & run full auto** — same, then feeds slices through existing `runFullAuto` (3-worker limiter). Redub through ElevenLabs, Music through LALAL. Same code path you already use.
- **Undo batch** button — every batch tagged with a `bulk_split_batch_id`, one click removes the whole batch.

### Backend

One new edge function `prek-clip-bulk-split` (ffmpeg, already used elsewhere in prek functions). No schema changes — reuses `prek_level_audio_clips` and the `prek-audio` bucket exactly like Redub does today.

### Why this is safe

- Additive. Zero touch to Track 89, Track 90, `usePreKAudioMixerRuntime`, `usePreKAudioTimelineTransport`, or the per-scene buttons.
- Same clip shape as current Redub/Music rows, so timeline rendering, freeze-hold, and word-card pause behavior all Just Work.
- Undo makes bad batches disposable.

### Recommendation

**Build it only if Part 1 shows we have a real product.** If we do, this splitter is exactly the "wow" that would sell it — drop a 2:30 audio file, click one button, get a fully-edited scene-locked track. That's the demo.

If the research shows a competitor already ships this, I'll say so plainly and we skip.

---

## Order of operations

1. Run Part 1 research now — I'll come back with the report and a go/no-go.
2. You read the report, decide.
3. If go: I ship Part 2 (~1 edge function + 1 collapsed UI section, both additive).

## Footprint

| Change | Files | Risk |
|---|---|---|
| Part 1 | `docs/product-research/dub-pipeline-market.md` (new) | None — docs only |
| Part 2 (conditional) | `RedubStudioPanel.tsx` (new collapsed section at top), `supabase/functions/prek-clip-bulk-split/index.ts` (new) | Low — additive, off by default |

Nothing else changes. Existing pipeline stays exactly as it is.
