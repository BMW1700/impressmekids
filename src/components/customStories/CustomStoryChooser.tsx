import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, BookOpen, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  listStoriesForRpgLevel,
  listStoriesForCastleBand,
  authorLabel,
  type CustomStory,
  type CastleBand,
} from "@/data/customStories";
import { CustomStoryEditor } from "./CustomStoryEditor";

export type StorySource =
  | { kind: "default" }
  | { kind: "custom"; story: CustomStory };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Heading like "World 3 · Level 2 — The Cave" */
  levelLabel: string;
  /** Use rpg_level OR castle_band. */
  target:
    | { kind: "rpg_level"; worldId: number; levelId: string | number }
    | { kind: "castle_band"; castleBand: CastleBand };
  defaultStoryLabel: string;
  onConfirm: (source: StorySource) => void;
  /** Optional classroom selection when teacher writes from here. */
  teacherClassroomId?: string | null;
}

export const CustomStoryChooser = ({
  open,
  onOpenChange,
  levelLabel,
  target,
  defaultStoryLabel,
  onConfirm,
  teacherClassroomId,
}: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stories, setStories] = useState<CustomStory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const targetKey = useMemo(() => JSON.stringify(target), [target]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setStories([]);
    setSelectedId(null);

    const load = target.kind === "rpg_level"
      ? listStoriesForRpgLevel(target.worldId, target.levelId)
      : listStoriesForCastleBand(target.castleBand);

    // Hard timeout so a hung Supabase request can never pin the spinner forever.
    const timeout = new Promise<CustomStory[]>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 8000),
    );

    Promise.race([load, timeout])
      .then((s) => {
        if (cancelled) return;
        setStories(s);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[CustomStoryChooser] failed to load stories", err);
        setLoadError(
          err?.message === "timeout"
            ? "Custom stories took too long to load. You can still play the built-in story."
            : "Couldn't load your custom stories. You can still play the built-in story.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetKey]);

  const handlePlay = () => {
    if (selectedId === null) {
      onConfirm({ kind: "default" });
    } else {
      const story = stories.find((s) => s.id === selectedId);
      if (story) onConfirm({ kind: "custom", story });
      else onConfirm({ kind: "default" });
    }
  };

  const editorTarget = useMemo(() => {
    if (target.kind === "rpg_level") {
      return {
        kind: "rpg_level" as const,
        worldId: target.worldId,
        levelId: target.levelId,
        label: levelLabel,
      };
    }
    return {
      kind: "castle_band" as const,
      castleBand: target.castleBand,
      label: levelLabel,
    };
  }, [target, levelLabel]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose your story</DialogTitle>
            <DialogDescription>{levelLabel}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <StoryOption
              selected={selectedId === null}
              onSelect={() => setSelectedId(null)}
              icon={<BookOpen className="h-4 w-4" />}
              title={defaultStoryLabel}
              subtitle="Built-in story"
            />

            {loading && (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading your stories…
              </div>
            )}

            {!loading && stories.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                You don't have any custom stories for this yet.
              </p>
            )}

            {stories.map((s) => (
              <StoryOption
                key={s.id}
                selected={selectedId === s.id}
                onSelect={() => setSelectedId(s.id)}
                icon={<User className="h-4 w-4" />}
                title={s.title}
                subtitle={`From ${authorLabel(s, user?.id)}`}
              />
            ))}
          </div>

          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="outline" onClick={() => setEditorOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Write a new one
            </Button>
            <Button onClick={handlePlay}>Play</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomStoryEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        target={editorTarget}
        classroomId={teacherClassroomId ?? null}
        onSaved={(s) => {
          setStories((prev) => [s, ...prev]);
          setSelectedId(s.id);
        }}
      />
    </>
  );
};

const StoryOption = ({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full text-left rounded-md border px-3 py-2.5 transition-colors flex items-center gap-3 ${
      selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
    }`}
  >
    <span
      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
        selected ? "border-primary" : "border-muted-foreground/40"
      }`}
    >
      {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
    </span>
    <span className="shrink-0 text-muted-foreground">{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-medium truncate">{title}</span>
      <span className="block text-xs text-muted-foreground truncate">{subtitle}</span>
    </span>
  </button>
);
