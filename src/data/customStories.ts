/**
 * Custom Level Stories — client types and small fetch/CRUD helpers.
 *
 * The chooser, editor, and reader/runner pull from here. RLS enforces
 * who can read whose stories; we just hand the supabase client a filter.
 */

import { supabase } from "@/integrations/supabase/client";
import { sanitizeBody, sanitizeTitle, tokenizeWords } from "@/lib/customStorySanitize";

export type CustomStoryAuthorRole = "student" | "parent" | "teacher";
export type CustomStoryTargetKind = "rpg_level" | "castle_band";
export type CastleBand = "K-5" | "6-12";

export interface CustomStory {
  id: string;
  author_id: string;
  author_role: CustomStoryAuthorRole;
  title: string;
  body: string;
  target_kind: CustomStoryTargetKind;
  world_id: number | null;
  level_id: string | null;
  castle_band: CastleBand | null;
  classroom_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewCustomStoryInput {
  title: string;
  body: string;
  author_role: CustomStoryAuthorRole;
  target_kind: CustomStoryTargetKind;
  world_id?: number | null;
  level_id?: string | null;
  castle_band?: CastleBand | null;
  classroom_id?: string | null;
}

const TABLE = "custom_level_stories";

export async function listMyCustomStories(): Promise<CustomStory[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomStory[];
}

export async function listStoriesForRpgLevel(
  worldId: number,
  levelId: string | number,
): Promise<CustomStory[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("target_kind", "rpg_level")
    .eq("world_id", worldId)
    .eq("level_id", String(levelId))
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomStory[];
}

export async function listStoriesForCastleBand(band: CastleBand): Promise<CustomStory[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("target_kind", "castle_band")
    .eq("castle_band", band)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomStory[];
}

export async function createCustomStory(input: NewCustomStoryInput): Promise<CustomStory> {
  const t = sanitizeTitle(input.title);
  if (!t.ok) throw new Error(t.error);
  const b = sanitizeBody(input.body);
  if (!b.ok) throw new Error(b.error);
  if (tokenizeWords(b.cleaned!).length < 10) {
    throw new Error("Story needs at least 10 words to play.");
  }

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) throw new Error("Please sign in to save stories.");

  const row = {
    author_id: userRes.user.id,
    author_role: input.author_role,
    title: t.cleaned!,
    body: b.cleaned!,
    target_kind: input.target_kind,
    world_id: input.target_kind === "rpg_level" ? (input.world_id ?? null) : null,
    level_id: input.target_kind === "rpg_level" ? (input.level_id ?? null) : null,
    castle_band: input.target_kind === "castle_band" ? (input.castle_band ?? null) : null,
    classroom_id: input.classroom_id ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as CustomStory;
}

export async function updateCustomStory(
  id: string,
  patch: { title?: string; body?: string },
): Promise<CustomStory> {
  const update: Record<string, string> = {};
  if (patch.title !== undefined) {
    const t = sanitizeTitle(patch.title);
    if (!t.ok) throw new Error(t.error);
    update.title = t.cleaned!;
  }
  if (patch.body !== undefined) {
    const b = sanitizeBody(patch.body);
    if (!b.ok) throw new Error(b.error);
    if (tokenizeWords(b.cleaned!).length < 10) {
      throw new Error("Story needs at least 10 words to play.");
    }
    update.body = b.cleaned!;
  }
  const { data, error } = await supabase
    .from(TABLE)
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as CustomStory;
}

export async function deleteCustomStory(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export function authorLabel(s: CustomStory, currentUserId?: string | null): string {
  if (currentUserId && s.author_id === currentUserId) return "You";
  switch (s.author_role) {
    case "parent": return "Parent";
    case "teacher": return "Teacher";
    case "student": return "Student";
  }
}
