## Brutal audit result

The per-scene edge functions are correct in isolation. The parallel worker pool in `runFullAuto` (CONCURRENCY=3) exposes **two real bugs** in the write paths. They will not throw loudly; they will silently drop data. Both must be fixed before "Full auto" is trustworthy on a multi-scene level.

---

### 🔴 Bug 1 — Lost-update race on `prek_levels` path maps

Both `prek-clip-redub` and `prek-clip-music-extract` do this pattern:

```text
SELECT redub_audio_paths FROM prek_levels WHERE id = :level
merge one { sceneKey → storagePath }
UPDATE prek_levels SET redub_audio_paths = merged
```

When two workers finish scenes A and B for the **same level** at roughly the same time, both read the pre-merge dict, each adds its own key, each writes the whole dict back. The later write wipes the earlier scene's entry.

Affected columns:
- `prek_levels.redub_audio_paths`
- `prek_levels.redub_isolated_paths`
- `prek_levels.music_audio_paths`

Symptom: the timeline `prek_level_audio_clips` rows are fine (they're inserted per-row and protected by UNIQUE), but `useBennyRedub.reload()` reads from `prek_levels` — so the "generated ✓" indicator, signed-URL preview, and any future regenerate-only-missing logic will show scenes as "not done" even though the MP3 exists in storage.

**Fix:** replace the read-modify-write with an atomic JSONB merge via a `SECURITY DEFINER` RPC:

```sql
create or replace function public.prek_merge_level_json(
  _level_id uuid,
  _column text,
  _patch jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if _column not in ('redub_audio_paths','redub_isolated_paths','music_audio_paths') then
    raise exception 'invalid column';
  end if;
  execute format(
    'update public.prek_levels set %I = coalesce(%I, ''{}''::jsonb) || $1 where id = $2',
    _column, _column
  ) using _patch, _level_id;
end $$;

grant execute on function public.prek_merge_level_json(uuid, text, jsonb) to service_role;
```

Then in both edge functions:

```ts
await admin.rpc("prek_merge_level_json", {
  _level_id: body.levelId,
  _column: "redub_audio_paths",
  _patch: { [body.sceneKey]: outPath },
});
```

### 🔴 Bug 2 — Track-insert race trips UNIQUE(level_id, track_index)

`ensureRedubClip` / `ensureMusicClip` do "SELECT track → if missing INSERT". Two parallel workers for the same level both see no track, both try to INSERT track_index 89 (or 90), one hits `duplicate key value violates unique constraint`, the whole scene errors out even though the redub/music MP3 uploaded fine.

**Fix:** replace the check-then-insert with an idempotent upsert:

```ts
await admin
  .from("prek_level_audio_tracks")
  .upsert(
    { level_id: args.levelId, track_index: MUSIC_TRACK_INDEX, name: MUSIC_TRACK_NAME, volume: 0.8, muted: false },
    { onConflict: "level_id,track_index", ignoreDuplicates: true },
  );
```

Same for the redub track (index 90).

### 🟡 Nit — `mute_source_video_audio` write is also a lost update in theory

`prek-clip-redub` sets `mute_source_video_audio: true` per scene. It's idempotent (always the same value), so parallel writes are safe. No fix needed.

---

## Everything else I checked and it's clean

- ✅ Auth + role check on both functions.
- ✅ LALAL 90s cap + client resume loop with 10 min ceiling.
- ✅ 5xx retry helper on all upstream calls.
- ✅ Isolated path timestamped to bust CDN.
- ✅ `pause_on_word_card: false` for music, `true` for redub.
- ✅ `source_kind` check constraint includes `'music'`.
- ✅ Partial UNIQUE index on `(level_id, track_index, anchor_scene_key)` WHERE source_kind='music' / 'redub' guarantees one clip per scene per lane.
- ✅ `mute_source_video_audio` auto-flips on first redub so original Benny audio doesn't fight the redub.
- ✅ R2 mirror is fire-and-forget with Service Role JWT; CDN HEAD fallback catches misses.
- ✅ Both functions use `../_shared/cors.ts` — CORS is consistent.

---

## What I'll ship on approval

1. **New migration** creating `public.prek_merge_level_json(uuid, text, jsonb)` with `service_role` execute grant.
2. **`prek-clip-redub`** — swap both `SELECT → merge → UPDATE` blocks (redub_audio_paths, redub_isolated_paths) for `rpc("prek_merge_level_json", …)`; convert track insert to idempotent upsert.
3. **`prek-clip-music-extract`** — same treatment for `music_audio_paths`; convert track insert to idempotent upsert.
4. **Redeploy** both edge functions.

No UI changes. No hook changes. Concurrency stays at 3.

After that, Full Auto is safe to hammer on a 15-scene level without corrupting `prek_levels` or randomly failing a scene on the track-insert race.