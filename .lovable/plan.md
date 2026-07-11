# Answer first: you're already doing extra steps you don't need to

The pipeline you described (download VO3 clip → run through ElevenLabs Voice Isolator → upload → redub → drop on a track) is **exactly what `prek-clip-redub` already does server-side, in one call, per scene**. You never have to touch ElevenLabs' Isolator UI or re-download anything.

What happens today when you click **Redub** on a scene in the Pre-K editor:

```text
Source MP4 in prek-level-videos
        │
        ▼
[1] Edge function downloads the clip (no CORS, no browser)
        │
        ▼
[2] ElevenLabs Voice Isolation  →  isolated MP3 saved to prek-level-audio
        │                          (this is the same isolator you tested manually)
        ▼
[3] ElevenLabs Speech-to-Speech (Benny voice, your stability/similarity)
        │                          → clean redub MP3, cadence preserved for lip-sync
        ▼
[4] Upload MP3 to prek-level-audio  +  mirror to R2
        │
        ▼
[5] Auto-create "Benny (Redub)" track (index 90) if missing
        │
        ▼
[6] Upsert timeline clip anchored to the scene, fill-scene, pause-on-word-card
        │
        ▼
[7] Auto-enable "mute source video audio" so old audio doesn't fight the redub
```

So the manual VO3 → Isolator → upload dance is redundant. The isolator step (which is what made your test sound clean) is already baked in — that's why the redub sounds like "new Benny" instead of muddy VO3 audio with background voices.

**"Redub entire level"** already exists in the Redub Studio panel and loops every scene through that same pipeline.

## What's missing (and what this plan adds)

Right now you can one-click a whole **level**, but not a whole **world**. If you want every clip across every Pre-K level to sound like clean Benny in one shot, you still have to open each level and press "Redub entire level". That's the only real friction left.

## Plan

Add a **"Redub entire world in Benny's voice"** button in the world editor that:

1. Loads every published level in that world.
2. For each level, enumerates its scene graph and calls the existing `prek-clip-redub` function once per scene (isolate + STS + auto-place, exactly like today).
3. Runs sequentially with a live progress bar: `Level 3/8 • Scene 5/12 • ~14 min remaining`.
4. Skips scenes that already have a redub MP3 with the current voice ID (idempotent — safe to re-run).
5. Writes a small run log to `prek_redub_batches` so you can see failures and retry just the failed ones.

No new ElevenLabs product, no new manual steps, no changes to the audio quality path — it's the same isolate→STS pipeline you already validated, just fanned out across a whole world.

## Technical details

- New file: `src/components/superadmin/prek/RedubWorldPanel.tsx` — button + progress UI, mounted in the world editor (`PreKWorldsList` / world detail page).
- New hook: `src/hooks/useBennyWorldRedub.ts` — walks `prek_levels` for the world, reuses `useBennyRedub.redubScene` per scene so we get the exact same isolate + STS + track-placement behavior. No edge-function changes needed.
- New table: `prek_redub_batches` (id, world_id, started_at, finished_at, total, succeeded, failed, error_summary jsonb) with `GRANT` + RLS restricted to `super_admin` / `content_editor` via `has_role`.
- Idempotency: before calling `prek-clip-redub` for a scene, check `prek_levels.redub_audio_paths[sceneKey]` and `redub_voice_id === current voice`. Skip if matched, unless the user checks "Force re-render".
- Concurrency: **1 scene at a time** to stay under ElevenLabs' STS rate limits (~45s/clip). Concurrency of 2 optional behind a toggle.
- Failure handling: per-scene errors are captured, batch continues, final toast lists failed scenes with a "Retry failed only" button.

## Nothing else changes

- Voice Isolator is already server-side — you can uninstall it from your desktop workflow.
- Manual VO3 downloads are only needed if you want to keep the raw MP4 for editing outside YubiLearn.
- Existing per-scene and per-level Redub buttons stay exactly as they are.
