import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, Wrench, FolderInput, ChevronUp, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface World { id: string; title: string; world_number: number; }
interface Level {
  id: string;
  world_id: string;
  level_number: number;
  title: string;
  description: string;
  goal: string;
  ending_line: string;
  is_published: boolean;
  opening_video_url: string | null;
  closing_video_url: string | null;
  word_count?: number;
}

const PreKLevelsList = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const [world, setWorld] = useState<World | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Level | null>(null);
  const [allWorlds, setAllWorlds] = useState<World[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moving, setMoving] = useState<Level | null>(null);
  const [targetWorldId, setTargetWorldId] = useState<string>("");
  const [targetLevelNumber, setTargetLevelNumber] = useState<number>(1);

  // form
  const [levelNumber, setLevelNumber] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [endingLine, setEndingLine] = useState("");

  const load = async () => {
    if (!worldId) return;
    setLoading(true);
    const [{ data: w }, { data: ls }, { data: ws }] = await Promise.all([
      supabase.from("prek_worlds").select("id, title, world_number").eq("id", worldId).maybeSingle(),
      supabase.from("prek_levels").select("*, prek_level_words(count)").eq("world_id", worldId).order("level_number"),
      supabase.from("prek_worlds").select("id, title, world_number").order("world_number"),
    ]);
    setWorld(w as World | null);
    setLevels((ls ?? []).map((l: any) => ({ ...l, word_count: l.prek_level_words?.[0]?.count ?? 0 })));
    setAllWorlds((ws ?? []) as World[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [worldId]);

  const openNew = () => {
    setEditing(null);
    setLevelNumber(Math.max(0, ...levels.map((l) => l.level_number)) + 1);
    setTitle("");
    setDescription("");
    setGoal("");
    setEndingLine("");
    setDialogOpen(true);
  };

  const openEdit = (l: Level) => {
    setEditing(l);
    setLevelNumber(l.level_number);
    setTitle(l.title);
    setDescription(l.description);
    setGoal(l.goal);
    setEndingLine(l.ending_line);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!worldId) return;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      world_id: worldId,
      level_number: Number(levelNumber),
      title: title.trim(),
      description: description.trim(),
      goal: goal.trim(),
      ending_line: endingLine.trim(),
    };
    const op = editing
      ? supabase.from("prek_levels").update(payload).eq("id", editing.id)
      : supabase.from("prek_levels").insert(payload);
    const { error } = await op;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Level updated" : "Level created");
    setDialogOpen(false);
    load();
  };

  const togglePublish = async (l: Level) => {
    const { error } = await supabase.from("prek_levels").update({ is_published: !l.is_published }).eq("id", l.id);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (l: Level) => {
    if (!confirm(`Delete level "${l.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("prek_levels").delete().eq("id", l.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Level deleted");
      load();
    }
  };

  const openMove = async (l: Level) => {
    setMoving(l);
    const others = allWorlds.filter((w) => w.id !== l.world_id);
    setTargetWorldId(others[0]?.id ?? "");
    if (others[0]?.id) {
      const { data } = await supabase
        .from("prek_levels")
        .select("level_number")
        .eq("world_id", others[0].id)
        .order("level_number", { ascending: false })
        .limit(1);
      setTargetLevelNumber((data?.[0]?.level_number ?? 0) + 1);
    } else {
      setTargetLevelNumber(1);
    }
    setMoveDialogOpen(true);
  };

  const onTargetWorldChange = async (id: string) => {
    setTargetWorldId(id);
    const { data } = await supabase
      .from("prek_levels")
      .select("level_number")
      .eq("world_id", id)
      .order("level_number", { ascending: false })
      .limit(1);
    setTargetLevelNumber((data?.[0]?.level_number ?? 0) + 1);
  };

  const confirmMove = async () => {
    if (!moving || !targetWorldId) return;
    const { error } = await supabase
      .from("prek_levels")
      .update({ world_id: targetWorldId, level_number: Number(targetLevelNumber) })
      .eq("id", moving.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Level moved");
    setMoveDialogOpen(false);
    setMoving(null);
    load();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/super-admin/prek"><ArrowLeft className="h-4 w-4 mr-1" /> Worlds</Link>
            </Button>
            <h1 className="text-3xl font-bold">{world ? world.title : "Levels"}</h1>
            {world && <Badge variant="outline">#{world.world_number}</Badge>}
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Level</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : levels.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            No levels yet. Create one to start building.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {levels.map((l) => {
              const hasOpen = !!l.opening_video_url;
              const hasClose = !!l.closing_video_url;
              const ready = hasOpen && hasClose && (l.word_count ?? 0) > 0;
              return (
                <Card key={l.id}>
                  <CardHeader className="flex flex-row items-center justify-between gap-3 py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">L{l.level_number}</span>
                        <CardTitle className="text-lg">{l.title}</CardTitle>
                        <Badge variant={l.is_published ? "default" : "secondary"}>
                          {l.is_published ? "Published" : "Draft"}
                        </Badge>
                        <Badge variant="outline">{l.word_count} word{l.word_count === 1 ? "" : "s"}</Badge>
                        {!ready && <Badge variant="destructive">Needs videos</Badge>}
                      </div>
                      {l.description && (
                        <p className="text-sm text-muted-foreground mt-1">{l.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button asChild size="sm"><Link to={`/super-admin/prek/${worldId}/${l.id}/edit`}>
                        <Wrench className="h-4 w-4 mr-1" /> Build
                      </Link></Button>
                      <Button variant="ghost" size="icon" onClick={() => togglePublish(l)} title={l.is_published ? "Unpublish" : "Publish"}>
                        {l.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openMove(l)} title="Move to another world">
                        <FolderInput className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(l)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Level" : "New Level"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Level Number</Label>
                <Input type="number" value={levelNumber} onChange={(e) => setLevelNumber(Number(e.target.value))} />
              </div>
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Help Benny Visit Grandma" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Goal (header pill)</Label>
                <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Help Benny visit Grandma!" />
              </div>
              <div>
                <Label>Ending Line</Label>
                <Input value={endingLine} onChange={(e) => setEndingLine(e.target.value)} placeholder="We made it to Grandma's!" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move "{moving?.title}" to another world</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Target World</Label>
                <Select value={targetWorldId} onValueChange={onTargetWorldChange}>
                  <SelectTrigger><SelectValue placeholder="Pick a world" /></SelectTrigger>
                  <SelectContent>
                    {allWorlds.filter((w) => w.id !== moving?.world_id).map((w) => (
                      <SelectItem key={w.id} value={w.id}>#{w.world_number} — {w.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level Number in target world</Label>
                <Input type="number" value={targetLevelNumber} onChange={(e) => setTargetLevelNumber(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">Must be unique within the target world.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmMove} disabled={!targetWorldId}>Move</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default PreKLevelsList;
