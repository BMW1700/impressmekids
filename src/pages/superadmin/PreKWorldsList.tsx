import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface World {
  id: string;
  world_number: number;
  title: string;
  description: string;
  difficulty: string;
  sort_order: number;
  is_published: boolean;
  level_count?: number;
}

const PreKWorldsList = () => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<World | null>(null);

  // form
  const [worldNumber, setWorldNumber] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [isPublished, setIsPublished] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prek_worlds")
      .select("*, prek_levels(count)")
      .order("world_number", { ascending: true });
    if (error) {
      toast.error("Failed to load worlds");
    } else {
      setWorlds(
        (data ?? []).map((w: any, i: number) => ({
          ...w,
          sort_order: i,
          level_count: w.prek_levels?.[0]?.count ?? 0,
        })),
      );
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setWorldNumber(Math.max(100, ...worlds.map((w) => w.world_number)) + 1);
    setTitle("");
    setDescription("");
    setDifficulty("easy");
    setIsPublished(false);
    setDialogOpen(true);
  };

  const openEdit = (w: World) => {
    setEditing(w);
    setWorldNumber(w.world_number);
    setTitle(w.title);
    setDescription(w.description);
    setDifficulty(w.difficulty);
    setIsPublished(w.is_published);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      world_number: Number(worldNumber),
      title: title.trim(),
      description: description.trim(),
      difficulty,
      is_published: isPublished,
      sort_order: editing?.sort_order ?? worlds.length,
    };
    const op = editing
      ? supabase.from("prek_worlds").update(payload).eq("id", editing.id)
      : supabase.from("prek_worlds").insert(payload);
    const { error } = await op;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "World updated" : "World created");
    setDialogOpen(false);
    load();
  };

  const togglePublish = async (w: World) => {
    const { error } = await supabase
      .from("prek_worlds")
      .update({ is_published: !w.is_published })
      .eq("id", w.id);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (w: World) => {
    if (!confirm(`Delete world "${w.title}" and ALL of its levels? This cannot be undone.`)) return;
    const { error } = await supabase.from("prek_worlds").delete().eq("id", w.id);
    if (error) toast.error(error.message);
    else {
      toast.success("World deleted");
      load();
    }
  };

  const moveWorld = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= worlds.length) return;
    const a = worlds[index];
    const b = worlds[target];
    // Swap world_numbers so the position label (# = world_number) matches ordering.
    const aNum = a.world_number;
    const bNum = b.world_number;
    const prev = worlds;
    const next = [...worlds];
    next[index] = { ...b, world_number: aNum };
    next[target] = { ...a, world_number: bNum };
    setWorlds(next);
    // Two-step swap to avoid unique constraint collisions (if any).
    const tmp = -Math.abs(aNum) - 1000000;
    const step1 = await supabase.from("prek_worlds").update({ world_number: tmp }).eq("id", a.id);
    if (step1.error) { toast.error("Reorder failed"); setWorlds(prev); return; }
    const step2 = await supabase.from("prek_worlds").update({ world_number: aNum }).eq("id", b.id);
    if (step2.error) { toast.error("Reorder failed"); setWorlds(prev); return; }
    const step3 = await supabase.from("prek_worlds").update({ world_number: bNum }).eq("id", a.id);
    if (step3.error) { toast.error("Reorder failed"); setWorlds(prev); return; }
    load();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/super-admin"><ArrowLeft className="h-4 w-4 mr-1" /> Super Admin</Link>
            </Button>
            <h1 className="text-3xl font-bold">Pre-K Worlds</h1>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New World</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : worlds.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            No worlds yet. Create one to get started.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {worlds.map((w, idx) => (
              <Card key={w.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === 0}
                        onClick={() => moveWorld(idx, -1)}
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === worlds.length - 1}
                        onClick={() => moveWorld(idx, 1)}
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">#{w.world_number}</span>
                        <CardTitle className="text-lg">{w.title}</CardTitle>
                        <Badge variant={w.is_published ? "default" : "secondary"}>
                          {w.is_published ? "Published" : "Draft"}
                        </Badge>
                        <Badge variant="outline">{w.difficulty}</Badge>
                        <Badge variant="outline">{w.level_count} level{w.level_count === 1 ? "" : "s"}</Badge>
                      </div>
                      {w.description && (
                        <p className="text-sm text-muted-foreground mt-1">{w.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="outline" size="sm"><Link to={`/super-admin/prek/${w.id}`}>Open</Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(w)} title={w.is_published ? "Unpublish" : "Publish"}>
                      {w.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(w)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(w)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit World" : "New World"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>World Number</Label>
                  <Input type="number" value={worldNumber} onChange={(e) => setWorldNumber(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Yubi Village" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                Published (visible to students)
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PreKWorldsList;
