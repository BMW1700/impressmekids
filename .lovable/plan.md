# Custom Story Override for RPG Mode

Let students, parents, and teachers paste their own text (a poem, a page from a book, their own writing) and play any **K-12 RPG level** or **Castle Swarm level** with that text instead of the built-in story. Pre-K (worlds 101/102/103) is out of scope — those are cinematic video levels.

At the start of an eligible level, the player sees a small chooser: **Default story** or any of their available custom stories for that level. Pick one and play.

## Scope

- ✅ K-12 RPG (Classic + Agent) — `RPGOneWordReader` and its battle variants
- ✅ Castle Swarm — `StoryRunner` (`src/components/aura/game/castle/storyRunner.ts`)
- ❌ Pre-K worlds 101 / 102 / 103 (cinematic video — not editable)

## Authors and visibility

| Author     | Who can play their story                              |
| ---------- | ----------------------------------------------------- |
| Student    | Only themselves                                       |
| Parent     | Themselves + every linked child (via `parent_student_links`) |
| Teacher    | Themselves + every student in the target classroom    |

No public/community sharing in v1.

## Pick-at-level-start UX

```text
┌─────────────────────────────────────────┐
│  World 3 · Level 2 · "The Cave"         │
│                                         │
│  Choose your story:                     │
│   ●  Default — "Whisper in the Cave"    │
│   ○  My Story — "Song of Myself" (Mom)  │
│   ○  My Story — "My dog Rex"            │
│                                         │
│  [ + Write a new one ]   [  Play  ]     │
└─────────────────────────────────────────┘
```

- Shown once at level entry. Skipped automatically if the user has no custom stories for that level.
- "Write a new one" opens an inline editor (title + body textarea) that saves and immediately becomes selectable.
- Selection is remembered per-user-per-level so returning play resumes the chosen story.

## Authoring UI

A single reusable `CustomStoryEditor` dialog used from:
- The level-start chooser ("Write a new one")
- A new "My Stories" tab on the student dashboard, parent dashboard, and teacher classroom page (manage / edit / delete / see which levels they target)

Editor fields:
- **Title** (required, ≤ 80 chars)
- **Body** (required, 50–5,000 chars)
- **Target level** — preselected when launched from the chooser; selectable otherwise (world + level, or "Any Castle Swarm K-5 / 6-12")
- **Visibility** — auto-set from author role; teachers also pick a classroom

## Content safety (light tier)

Client + server both enforce:
- 50 ≤ length ≤ 5,000 chars
- Profanity filter against a small built-in word list (server-side authoritative)
- Strip control chars, normalize whitespace, cap line breaks
- Reject if it contains URLs or emails (light anti-spam)

No AI moderation pass and no teacher approval workflow in v1 — per your "light" choice.

## How the story actually drives gameplay

- **K-12 RPG (`RPGOneWordReader` + battle variants):** today the reader resolves words/passage from `curatedStories` / `agentStories` / Nabu copy via `useMemo` near the top of the file. We add a single hook `useActiveLevelStory(world, level)` that returns either the override text or the built-in content. The reader runs the override through the same sentence/word tokenizer used elsewhere (lowercase, strip punctuation, 1–14 char tokens — mirrors `storyRunner.ts`) so speech matching, verb animations, and analytics behave identically.
- **Castle Swarm (`StoryRunner`):** add an optional `overrideText?: string` to its constructor. When present, it bypasses `pickStoriesForContext` and feeds the override through the existing `prepareStories` pipeline (one synthetic `CastleStory` with `paragraphs: [overrideText]`). All sentence/word/HUD behavior is unchanged.
- Verb-specific character animations (`useVerbAnimation`) keep working — they trigger off matched words regardless of source.
- Analytics: word_readings / aura_records continue logging; we add a `custom_story_id` column so reports can distinguish "read built-in passage" vs "read parent-authored text".

## Database

One new table, one helper view, RLS scoped to author + their audience.

```sql
create table public.custom_level_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_role text not null check (author_role in ('student','parent','teacher')),
  title text not null,
  body text not null,
  -- targeting (exactly one of these populated)
  target_kind text not null check (target_kind in ('rpg_level','castle_band')),
  world_id int,           -- for rpg_level
  level_id text,          -- for rpg_level
  castle_band text,       -- 'K-5' | '6-12' for castle_band
  -- visibility
  classroom_id uuid references public.classrooms(id) on delete cascade, -- teacher-authored
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- standard grants + RLS:
--   SELECT: author, OR (parent's linked children via parent_student_links),
--           OR (teacher's classroom members via classroom_students),
--           OR (the teacher themselves who owns the classroom)
--   INSERT/UPDATE/DELETE: author only
```

Plus a column on `aura_records` (or wherever per-attempt reading logs live — confirm during implementation): `custom_story_id uuid null references public.custom_level_stories(id) on delete set null`.

## Files to add / change

**New**
- `src/data/customStories.ts` — types + small client helpers (list, create, update, delete, fetch-eligible-for-level)
- `src/hooks/useCustomStories.ts` — react-query hooks
- `src/hooks/useActiveLevelStory.ts` — returns `{ source: 'default' | 'custom', text, customStoryId }`
- `src/components/aura/game/rpg/CustomStoryChooser.tsx` — level-start chooser dialog
- `src/components/aura/game/rpg/CustomStoryEditor.tsx` — create/edit dialog
- `src/components/customStories/MyStoriesPanel.tsx` — management list reused by all three dashboards
- Supabase migration for `custom_level_stories` (table + grants + RLS) and the `custom_story_id` column

**Edited (minimal, presentation-layer only)**
- `src/components/aura/game/rpg/NabuEpisodeWrapper.tsx` — for K-12 path, wrap with chooser; Pre-K path untouched
- `src/components/aura/game/rpg/RPGOneWordReader.tsx` — accept an optional `overrideStory` prop and feed it into the existing tokenization path
- `src/components/aura/game/castle/storyRunner.ts` — accept optional `overrideText` in constructor
- `src/pages/game/CastleSwarmDefense.tsx` — show chooser before run starts, pass override into `StoryRunner`
- Student / parent / teacher dashboard entry points — add "My Stories" tab using `MyStoriesPanel`

## Out of scope (v1)

- Public community library
- Editing Pre-K cinematic levels
- AI moderation, teacher approval workflow
- Importing PDFs / images — text only

## Open question I'll resolve during build

How a teacher-authored story interacts when a student has *also* written their own for the same level: I'll show both in the chooser, grouped ("From Ms. Lee" vs "Mine"), default-selecting the most recent one the student opened.
