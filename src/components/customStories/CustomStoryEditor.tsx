import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  createCustomStory,
  updateCustomStory,
  type CustomStory,
  type CustomStoryAuthorRole,
  type CustomStoryTargetKind,
  type CastleBand,
} from "@/data/customStories";
import { CUSTOM_STORY_LIMITS, tokenizeWords } from "@/lib/customStorySanitize";

interface Target {
  kind: CustomStoryTargetKind;
  /** RPG: world id */
  worldId?: number;
  /** RPG: level id */
  levelId?: string | number;
  /** Castle Swarm band */
  castleBand?: CastleBand;
  /** Friendly label shown in the UI ("World 3 · Level 2", "Castle Swarm K-5", …) */
  label: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: Target;
  /** Pass an existing story to edit; omit to create. */
  editing?: CustomStory | null;
  /** Teacher-authored stories require a classroom_id. */
  classroomId?: string | null;
  onSaved?: (story: CustomStory) => void;
}

export const CustomStoryEditor = ({ open, onOpenChange, target, editing, classroomId, onSaved }: Props) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? "");
      setBody(editing?.body ?? "");
    }
  }, [open, editing]);

  const role = mapRole(profile?.role);
  const wordCount = tokenizeWords(body).length;
  const bodyLen = body.length;

  const handleSave = async () => {
    if (!role) {
      toast({ title: "Sign in required", description: "Sign in to save custom stories." });
      return;
    }
    if (role === "teacher" && !classroomId) {
      toast({ title: "Pick a class", description: "Teacher stories need a classroom." });
      return;
    }
    setSaving(true);
    try {
      const saved = editing
        ? await updateCustomStory(editing.id, { title, body })
        : await createCustomStory({
            title,
            body,
            author_role: role,
            target_kind: target.kind,
            world_id: target.kind === "rpg_level" ? target.worldId ?? null : null,
            level_id: target.kind === "rpg_level" ? (target.levelId != null ? String(target.levelId) : null) : null,
            castle_band: target.kind === "castle_band" ? target.castleBand ?? null : null,
            classroom_id: role === "teacher" ? classroomId ?? null : null,
          });
      toast({ title: editing ? "Story updated" : "Story saved" });
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Couldn't save",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit your story" : "Write a custom story"}</DialogTitle>
          <DialogDescription>
            For {target.label}. {role === "parent" && "Your linked kids will see this story when they play."}
            {role === "teacher" && "Your classroom will see this story when they play."}
            {role === "student" && "Only you will see this story."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cs-title">Title</Label>
            <Input
              id="cs-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={CUSTOM_STORY_LIMITS.MAX_TITLE}
              placeholder="e.g. Song of Myself"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cs-body">Story</Label>
              <span className="text-xs text-muted-foreground">
                {bodyLen}/{CUSTOM_STORY_LIMITS.MAX_BODY} chars · {wordCount} words
              </span>
            </div>
            <Textarea
              id="cs-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Paste a poem, a page from a favorite book, or write your own…"
              maxLength={CUSTOM_STORY_LIMITS.MAX_BODY}
            />
            <p className="text-xs text-muted-foreground">
              {CUSTOM_STORY_LIMITS.MIN_BODY}–{CUSTOM_STORY_LIMITS.MAX_BODY} characters. Keep it kid-friendly — no links or emails.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || body.length < CUSTOM_STORY_LIMITS.MIN_BODY}>
            {saving ? "Saving…" : editing ? "Save changes" : "Save story"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function mapRole(role: string | null | undefined): CustomStoryAuthorRole | null {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r.includes("parent")) return "parent";
  if (r.includes("teacher") || r.includes("admin")) return "teacher";
  return "student";
}
