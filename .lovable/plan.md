# Super Admin: Pre-K Video Level Builder

Build a Super Admin role and a content management interface that lets authorized users create, edit, and delete Pre-K worlds and video levels — including building each level from uploaded videos and spoken-word prompts. The existing "Visit Grandma" level gets migrated into the database so it's editable like any other.

Scope is **Pre-K only for now**. K-5, 6-12, and Castle Swarm CMS will reuse this foundation later.

---

## 1. New `super_admin` role

- Add `'super_admin'` to the existing `app_role` enum.
- Reuse the existing `has_role()` security-definer function — no new RLS pattern needed.
- **Bootstrap**: a one-time migration inserts the first super_admin for the email you provide. Once one super_admin exists, they can promote others in-app.
- New page `/admin/super` (gated by `has_role(uid, 'super_admin')`) with a "Manage Super Admins" panel that lists current super_admins and lets you grant/revoke the role by user email.

## 2. Database schema (new tables)

```text
prek_worlds
  ├─ id (uuid)
  ├─ world_number (int, unique)        ← shown to kids (101, 102, …)
  ├─ title, description
  ├─ difficulty ('easy' | 'medium' | 'hard')
  ├─ sort_order, is_published
  └─ created_by, timestamps

prek_levels
  ├─ id (uuid)
  ├─ world_id → prek_worlds
  ├─ level_number (int, unique per world)
  ├─ title, description, goal, ending_line
  ├─ opening_video_path  (storage path)
  ├─ closing_video_path  (storage path)
  ├─ sort_order, is_published
  └─ created_by, timestamps

prek_level_words   (one row per "introductory word" between videos)
  ├─ id (uuid)
  ├─ level_id → prek_levels
  ├─ sort_order (1..N)
  ├─ word (e.g. "JUMP")
  ├─ ask_line, success_line
  ├─ first_video_path   (plays before the word — "prompt" clip)
  ├─ second_video_path  (plays after the word — "action" clip)
  ├─ hold_poster_path   (optional last-frame still, auto-generated client-side)
  └─ timestamps
```

**Access rules (plain English):**

- Super admins can create/edit/delete worlds, levels, and words.
- All authenticated users (students, parents, teachers) can **read** published worlds/levels/words.
- Unpublished content is visible only to super admins.

## 3. Storage

- New **private** bucket `prek-level-videos`.
- Path scheme: `{world_id}/{level_id}/{filename}` so deletion of a level cleanly cascades.
- RLS on `storage.objects`:
  - super_admins: full read/write/delete on this bucket
  - authenticated users: read-only (playback uses signed URLs from a small edge helper, or short-lived signed URL fetched on demand)
- Upload limits enforced client-side: ≤50 MB per video, MP4/WebM/MOV only.

## 4. Super Admin UI

New routes, all gated by the super_admin role:

```text
/admin/super                       ← dashboard (cards: Pre-K, [K-5 coming soon], …)
/admin/super/prek                  ← worlds list (create/edit/delete/reorder)
/admin/super/prek/:worldId         ← levels list inside a world
/admin/super/prek/:worldId/:levelId/edit   ← the level builder
```

### Worlds list page

- Table of worlds with title, difficulty, level count, published toggle, edit, delete.
- "+ New World" → dialog (title, description, difficulty, world number).

### Levels list page

- Table of levels inside the selected world.
- "+ New Level" → dialog (title, description, goal, ending line).

### Level builder page (the core experience)

Vertical timeline matching the "Visit Grandma" template:

```text
┌──────────────────────────────────────────────┐
│  Opening Video         [ Upload / Replace ]  │
│  ↓ fades into                                │
│  Word #1: ___________                        │
│    Ask line: ___________                     │
│    Success line: ___________                 │
│    First Video  [ Upload ]                   │
│    Second Video [ Upload ]                   │
│  ↓ fades into                                │
│  Word #2: ___________  [ ↑ ↓ remove ]        │
│    …                                         │
│  [ + Add Word ]                              │
│  ↓ fades into                                │
│  Closing Video        [ Upload / Replace ]   │
│                                              │
│  [ Save Draft ]  [ Publish ]  [ Preview ]    │
└──────────────────────────────────────────────┘
```

- Drag-handle (or up/down buttons) to reorder words.
- Each upload shows progress, then an inline `<video>` preview.
- "Preview" opens the existing `NabuVideoAdventure` runner in a modal using the in-progress data — same seamless cross-fade logic that already powers Visit Grandma. **No new playback engine is built.**
- Validation before publish: opening + closing videos present, at least one word, every word has both videos and a non-empty word string.

## 5. Migrate "Visit Grandma" into the DB

A one-time data migration:

1. Inserts world `101` ("Nabu Village") and level `1` ("Help Benny visit Grandma!").
2. Re-uploads the 16 existing clips from `src/assets/L1-*.mp4.asset.json` into the new storage bucket (the migration script uses the CDN URLs already in those `.asset.json` pointers as the source).
3. Inserts 5 `prek_level_words` rows (JUMP, BOOTS, KEY, PUSH, SNEAK) with the existing ask/success lines.

After this, `getVideoLevel()` will load `101:1` from the database instead of the hardcoded TS file.

## 6. Runtime integration

- New hook `usePreKVideoLevel(worldId, levelId)` that:
  - Reads the level + words from DB (cached with React Query).
  - Resolves storage paths to **signed URLs** in a single batched call.
  - Returns the same `VideoLevel` shape `NabuVideoAdventure` already expects, so the runner doesn't change.
- `src/data/preKAdventuresVideo.ts` becomes a thin fallback (kept only until the data migration is verified, then deleted).

## 7. Out of scope (intentionally)

- K-5 / 6-12 / Castle Swarm CMS — same schema pattern, deferred to a later turn.
- Per-classroom or per-teacher custom Pre-K levels (this is global content).
- Auto-generating the `hold_poster` frame server-side — derived on the client via a `<canvas>` capture of the prompt video's last frame at upload time.
- Video transcoding / resolution normalization — admins upload at the size they want; we just enforce a 50 MB cap.

---

## Technical details (for reference)

- **Bootstrap super_admin**: I'll need your account email before running the bootstrap migration. If you'd rather, the migration can promote *every existing 'admin'* to super_admin in one shot.
- **Signed URLs**: 1-hour TTL, fetched in batch when a level loads. Cached in React Query keyed by storage path.
- **Cascade deletes**: `prek_levels.world_id` and `prek_level_words.level_id` use `ON DELETE CASCADE`. A DB trigger on `prek_levels` delete removes all objects under `{world_id}/{level_id}/` from storage.
- **Uploads**: direct browser → Supabase Storage `upload()` with `upsert: true`. No edge function in the upload path.
- **Audit**: every world/level/word write inserts a row in `security_audit_log` with `action_type = 'prek_cms_*'` (you already have this table).
- **Preview parity**: the level builder's Preview button mounts `NabuVideoAdventure` with the same `VideoLevel` object the runtime uses, so what the admin sees in preview is exactly what the kid will see — including the seamless cross-fades.

---



**["matthewross750@gmail.com"](mailto:matthewross750@gmail.com) should become the first super admin. Make the password "123456".**