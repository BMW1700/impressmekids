import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function SchoolEventManager() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    event_type: "assembly" as const,
    blocks_classes: false,
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["school-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_events")
        .select("*")
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("school_events")
        .insert({
          ...data,
          created_by: session?.user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-events"] });
      toast.success("School event created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create event: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("school_events")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-events"] });
      toast.success("School event updated successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update event: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("school_events")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-events"] });
      toast.success("School event deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete event: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_date: "",
      start_time: "",
      end_time: "",
      event_type: "assembly",
      blocks_classes: false,
    });
    setIsCreating(false);
    setEditingEvent(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.event_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      event_type: event.event_type,
      blocks_classes: event.blocks_classes,
    });
    setIsCreating(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            School Events
          </h2>
          <p className="text-muted-foreground">Manage school-wide events and holidays</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingEvent ? "Edit Event" : "Create New Event"}</CardTitle>
            <CardDescription>
              {editingEvent ? "Update the event details" : "Add a new school-wide event"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Winter Break"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type *</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value as any })}
                >
                  <SelectTrigger id="event_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                    <SelectItem value="assembly">Assembly</SelectItem>
                    <SelectItem value="early_dismissal">Early Dismissal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Event Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blocks_classes" className="flex items-center gap-2">
                  <Switch
                    id="blocks_classes"
                    checked={formData.blocks_classes}
                    onCheckedChange={(checked) => setFormData({ ...formData, blocks_classes: checked })}
                  />
                  Blocks Regular Classes
                </Label>
                <p className="text-xs text-muted-foreground">
                  If enabled, regular classes won't appear on this date
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this event"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingEvent ? "Update Event" : "Create Event"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Loading events...</p>
        ) : !events || events.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No school events created yet
          </p>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>
                  {format(new Date(event.event_date), "MMMM d, yyyy")}
                  {event.start_time && ` • ${event.start_time}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{event.event_type.replace(/_/g, " ")}</span>
                  </div>
                  {event.blocks_classes && (
                    <p className="text-xs text-orange-600">⚠️ Blocks regular classes</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this event?")) {
                          deleteMutation.mutate(event.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}