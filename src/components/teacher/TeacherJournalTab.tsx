import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarIcon, 
  BookOpen, 
  Plus, 
  Trash2,
  Loader2,
  Save
} from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface JournalEntry {
  id: string;
  teacher_id: string;
  classroom_id: string | null;
  entry_date: string;
  note: string | null;
  checklist_items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

interface TeacherJournalTabProps {
  classroomId?: string;
}

// Get local date string in YYYY-MM-DD format using the user's timezone
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's date at start of day in user's local timezone
const getLocalToday = (): Date => {
  return startOfDay(new Date());
};

export function TeacherJournalTab({ classroomId }: TeacherJournalTabProps) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(getLocalToday());
  const [note, setNote] = useState("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Use local timezone for the date key
  const dateKey = getLocalDateString(selectedDate);

  // Fetch entry for selected date
  const { data: entry, isLoading } = useQuery({
    queryKey: ["journal-entry", dateKey, classroomId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const query = supabase
        .from("teacher_journal_entries")
        .select("*")
        .eq("teacher_id", user.id)
        .eq("entry_date", dateKey);

      if (classroomId) {
        query.eq("classroom_id", classroomId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      
      // Parse checklist_items from JSON
      return {
        ...data,
        checklist_items: Array.isArray(data.checklist_items) 
          ? (data.checklist_items as unknown as ChecklistItem[])
          : [],
      } as JournalEntry;
    },
  });

  // Fetch all entry dates for calendar highlighting
  const { data: entryDates = [] } = useQuery({
    queryKey: ["journal-entry-dates", classroomId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const query = supabase
        .from("teacher_journal_entries")
        .select("entry_date")
        .eq("teacher_id", user.id);

      if (classroomId) {
        query.eq("classroom_id", classroomId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data?.map(d => d.entry_date) || [];
    },
  });

  // Sync form with fetched entry
  useEffect(() => {
    if (entry) {
      setNote(entry.note || "");
      const items = Array.isArray(entry.checklist_items) ? entry.checklist_items : [];
      setChecklistItems(items);
    } else {
      setNote("");
      setChecklistItems([]);
    }
  }, [entry]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Cast checklist items to JSON-compatible format
      const checklistJson = JSON.parse(JSON.stringify(checklistItems));

      if (entry) {
        const { error } = await supabase
          .from("teacher_journal_entries")
          .update({
            note: note || null,
            checklist_items: checklistJson,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("teacher_journal_entries")
          .insert({
            teacher_id: user.id,
            classroom_id: classroomId || null,
            entry_date: dateKey,
            note: note || null,
            checklist_items: checklistJson,
            mood: "okay", // Required field, set default
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Journal saved");
      queryClient.invalidateQueries({ queryKey: ["journal-entry", dateKey] });
      queryClient.invalidateQueries({ queryKey: ["journal-entry-dates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Track last saved state to detect actual changes
  const lastSavedRef = useRef<{ note: string; checklist: string }>({ note: "", checklist: "[]" });

  // Update ref when entry loads
  useEffect(() => {
    if (entry) {
      lastSavedRef.current = {
        note: entry.note || "",
        checklist: JSON.stringify(entry.checklist_items || []),
      };
    } else if (entry === null) {
      lastSavedRef.current = { note: "", checklist: "[]" };
    }
  }, [entry]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const currentChecklist = JSON.stringify(checklistItems);
    return note !== lastSavedRef.current.note || currentChecklist !== lastSavedRef.current.checklist;
  }, [note, checklistItems]);

  // Auto-save with debounce - only when there are actual changes
  useEffect(() => {
    // Don't auto-save on initial load or if no changes
    if (entry === undefined) return;
    if (!hasUnsavedChanges()) return;
    
    const timeout = setTimeout(() => {
      if ((note || checklistItems.length > 0) && hasUnsavedChanges()) {
        saveMutation.mutate();
        // Update ref after save
        lastSavedRef.current = {
          note,
          checklist: JSON.stringify(checklistItems),
        };
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [note, checklistItems, entry, hasUnsavedChanges]);

  const goToPreviousDay = () => setSelectedDate(startOfDay(subDays(selectedDate, 1)));
  const goToNextDay = () => setSelectedDate(startOfDay(addDays(selectedDate, 1)));
  const goToToday = () => setSelectedDate(getLocalToday());

  // Check if selected date is today using local timezone
  const isSelectedToday = getLocalDateString(selectedDate) === getLocalDateString(new Date());

  const addChecklistItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      completed: false,
    };
    setChecklistItems([...checklistItems, newItem]);
    setNewItemText("");
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(items => items.filter(item => item.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChecklistItem();
    }
  };

  const completedCount = checklistItems.filter(i => i.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Teacher Journal
        </h2>
        <p className="text-muted-foreground mt-1">
          Daily notes and to-do list for your classroom
        </p>
      </div>

      {/* Date Navigation */}
      <Card className="shadow-card border-2 border-primary/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(startOfDay(date));
                        setCalendarOpen(false);
                      }
                    }}
                    modifiers={{
                      hasEntry: entryDates.map(d => new Date(d + "T12:00:00")),
                    }}
                    modifiersStyles={{
                      hasEntry: {
                        backgroundColor: "hsl(var(--primary) / 0.2)",
                        borderRadius: "50%",
                      },
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {!isSelectedToday && (
                <Button variant="secondary" size="sm" onClick={goToToday}>
                  Today
                </Button>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Notes Section */}
          <Card className="shadow-card border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Notes for the Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your notes for today..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[300px] resize-none"
              />
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  {saveMutation.isPending ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  ) : entry ? (
                    "Auto-saved"
                  ) : (
                    "Start typing to save"
                  )}
                </p>
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Checklist Section */}
          <Card className="shadow-card border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Checkbox checked disabled className="opacity-50" />
                  To-Do List
                </span>
                {checklistItems.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {completedCount}/{checklistItems.length} done
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new item */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new task..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button size="icon" onClick={addChecklistItem} disabled={!newItemText.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Checklist items */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {checklistItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No tasks yet. Add your first to-do item above.
                  </p>
                ) : (
                  checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        item.completed
                          ? "bg-muted/50 border-muted"
                          : "bg-background border-border hover:border-primary/30"
                      )}
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleChecklistItem(item.id)}
                      />
                      <span
                        className={cn(
                          "flex-1 text-sm",
                          item.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeChecklistItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}