import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAllSeasons, type SeasonRow } from "@/hooks/useActiveSeason";
import type { SeasonTier } from "@/lib/rpgSeasonPass";

const BLANK_TIERS: SeasonTier[] = [
  { tier: 1, requiredXp: 50, rewardKind: "badge", rewardId: "tier_1", rewardLabel: "Tier 1 Badge", rewardEmoji: "🔥" },
  { tier: 2, requiredXp: 150, rewardKind: "title", rewardId: "tier_2", rewardLabel: "Tier 2 Title", rewardEmoji: "🌟" },
  { tier: 3, requiredXp: 300, rewardKind: "banner", rewardId: "tier_3", rewardLabel: "Tier 3 Banner", rewardEmoji: "🚩" },
];

/**
 * Super-admin screen for launching the next RPG season without a code deploy.
 * Tiers are edited as JSON so reward kinds/labels stay fully flexible.
 */
const RPGSeasonsAdmin = () => {
  const { seasons, loading, refresh } = useAllSeasons();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SeasonRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [themeColor, setThemeColor] = useState("#f97316");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [tiersJson, setTiersJson] = useState(JSON.stringify(BLANK_TIERS, null, 2));

  const openNew = () => {
    setEditing(null);
    setId("");
    setName("");
    setThemeColor("#f97316");
    setStartsAt("");
    setEndsAt("");
    setTiersJson(JSON.stringify(BLANK_TIERS, null, 2));
    setDialogOpen(true);
  };

  const openEdit = (s: SeasonRow) => {
    setEditing(s);
    setId(s.id);
    setName(s.name);
    setThemeColor(s.theme_color);
    setStartsAt(s.starts_at);
    setEndsAt(s.ends_at);
    setTiersJson(JSON.stringify(s.tiers ?? [], null, 2));
    setDialogOpen(true);
  };

  const save = async () => {
    let tiers: SeasonTier[];
    try {
      tiers = JSON.parse(tiersJson);
      if (!Array.isArray(tiers) || tiers.length === 0) throw new Error("empty");
    } catch {
      toast.error("Tiers must be a non-empty JSON array");
      return;
    }
    if (!id.trim() || !name.trim() || !startsAt || !endsAt) {
      toast.error("Season id, name, start and end dates are required");
      return;
    }

    setSaving(true);
    const payload = {
      id: id.trim(),
      name: name.trim(),
      theme_color: themeColor,
      starts_at: startsAt,
      ends_at: endsAt,
      tiers: tiers as unknown as never,
    };
    const { error } = editing
      ? await supabase.from("rpg_seasons").update(payload).eq("id", editing.id)
      : await supabase.from("rpg_seasons").insert(payload);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Season updated" : "Season created");
    setDialogOpen(false);
    void refresh();
  };

  const activate = async (s: SeasonRow) => {
    // Only one season may be active (enforced by a unique index), so clear first.
    const { error: clearError } = await supabase
      .from("rpg_seasons")
      .update({ is_active: false })
      .eq("is_active", true);
    if (clearError) {
      toast.error(clearError.message);
      return;
    }
    const { error } = await supabase.from("rpg_seasons").update({ is_active: true }).eq("id", s.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${s.name} is now live`);
    void refresh();
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link to="/superadmin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">RPG Seasons</h1>
          <p className="text-sm text-muted-foreground">Launch the next season without shipping code.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> New season
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading seasons…</p>
      ) : seasons.length === 0 ? (
        <p className="text-sm text-muted-foreground">No seasons yet.</p>
      ) : (
        <div className="space-y-3">
          {seasons.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.theme_color }} />
                    {s.name}
                    {s.is_active && <Badge variant="default">Live</Badge>}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{s.id}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {s.starts_at} → {s.ends_at} · {(s.tiers ?? []).length} tiers
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                  {!s.is_active && (
                    <Button size="sm" onClick={() => void activate(s)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Make live
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit season" : "New season"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="season-id">Season id</Label>
              <Input
                id="season-id"
                value={id}
                disabled={!!editing}
                placeholder="season-2026-w31"
                onChange={(e) => setId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="season-name">Name</Label>
              <Input id="season-name" value={name} placeholder="The Frost Trials" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="season-start">Starts</Label>
                <Input id="season-start" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="season-end">Ends</Label>
                <Input id="season-end" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="season-color">Theme colour</Label>
              <Input id="season-color" type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="season-tiers">Tiers (JSON)</Label>
              <Textarea id="season-tiers" rows={10} className="font-mono text-xs" value={tiersJson} onChange={(e) => setTiersJson(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RPGSeasonsAdmin;
