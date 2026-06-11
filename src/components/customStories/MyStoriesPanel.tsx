import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  deleteCustomStory,
  listMyCustomStories,
  type CustomStory,
} from "@/data/customStories";
import { CustomStoryEditor } from "./CustomStoryEditor";

/**
 * Lists every custom story authored by the current user. Reusable on student /
 * parent / teacher dashboards.
 */
export const MyStoriesPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<CustomStory[]>([]);
  const [editing, setEditing] = useState<CustomStory | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setStories(await listMyCustomStories());
    } catch (e) {
      toast({
        title: "Couldn't load stories",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = async (s: CustomStory) => {
    if (!confirm(`Delete "${s.title}"? This can't be undone.`)) return;
    try {
      await deleteCustomStory(s.id);
      setStories((prev) => prev.filter((x) => x.id !== s.id));
      toast({ title: "Story deleted" });
    } catch (e) {
      toast({
        title: "Couldn't delete",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">My Custom Stories</h2>
        <p className="text-sm text-muted-foreground">
          Write your own text — a poem, a page from a book, anything — and play any RPG level with it instead of the built-in story.
          To create one, open a level and tap "Write a new one".
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
        </div>
      ) : stories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No custom stories yet. Start one from any K-12 RPG level or Castle Swarm run.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {stories.map((s) => (
            <li key={s.id}>
              <Card>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {targetLabel(s)} · {s.body.length} chars · updated {new Date(s.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(s)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <CustomStoryEditor
          open={!!editing}
          onOpenChange={(o) => { if (!o) setEditing(null); }}
          target={
            editing.target_kind === "rpg_level"
              ? {
                  kind: "rpg_level",
                  worldId: editing.world_id ?? 0,
                  levelId: editing.level_id ?? "",
                  label: targetLabel(editing),
                }
              : {
                  kind: "castle_band",
                  castleBand: (editing.castle_band ?? "K-5") as "K-5" | "6-12",
                  label: targetLabel(editing),
                }
          }
          editing={editing}
          classroomId={editing.classroom_id}
          onSaved={(s) => {
            setStories((prev) => prev.map((x) => (x.id === s.id ? s : x)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

function targetLabel(s: CustomStory): string {
  if (s.target_kind === "rpg_level") {
    return `World ${s.world_id} · Level ${s.level_id}`;
  }
  return `Castle Swarm (${s.castle_band})`;
}
