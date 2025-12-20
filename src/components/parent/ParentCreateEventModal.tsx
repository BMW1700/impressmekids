import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ParentCreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
  children: Array<{ student_id: string; student_name: string }>;
  onEventCreated: () => void;
  editEvent?: {
    id: string;
    type: "parent_personal" | "parent_student";
    title: string;
    description?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    studentId?: string;
  } | null;
}

export function ParentCreateEventModal({
  open,
  onOpenChange,
  parentId,
  children,
  onEventCreated,
  editEvent,
}: ParentCreateEventModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(editEvent?.title || "");
  const [description, setDescription] = useState(editEvent?.description || "");
  const [date, setDate] = useState<Date | undefined>(
    editEvent?.date ? new Date(editEvent.date) : undefined
  );
  const [startTime, setStartTime] = useState(editEvent?.startTime || "");
  const [endTime, setEndTime] = useState(editEvent?.endTime || "");
  const [location, setLocation] = useState(editEvent?.location || "");
  const [target, setTarget] = useState<string>(
    editEvent?.studentId || children[0]?.student_id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when editEvent changes
  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description || "");
      setDate(editEvent.date ? new Date(editEvent.date) : undefined);
      setStartTime(editEvent.startTime || "");
      setEndTime(editEvent.endTime || "");
      setLocation(editEvent.location || "");
      setTarget(editEvent.studentId || children[0]?.student_id || "");
    } else {
      setTitle("");
      setDescription("");
      setDate(undefined);
      setStartTime("");
      setEndTime("");
      setLocation("");
      setTarget(children[0]?.student_id || "");
    }
  }, [editEvent, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and date for the event.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        parent_id: parentId,
        title,
        description: description || null,
        event_date: format(date, "yyyy-MM-dd"),
        start_time: startTime || null,
        end_time: endTime || null,
        location: location || null,
      };

      if (editEvent) {
        // Update existing event - always use parent_student_events now
        const { error } = await supabase
          .from("parent_student_events")
          .update({ ...eventData, student_id: target })
          .eq("id", editEvent.id);

        if (error) throw error;

        toast({
          title: "Event Updated",
          description: "Your event has been updated successfully.",
        });
      } else {
        // Create new event for student
        const { error } = await supabase
          .from("parent_student_events")
          .insert({
            ...eventData,
            student_id: target,
          });

        if (error) throw error;

        toast({
          title: "Event Created",
          description: "The event has been added to your student's calendar.",
        });
      }

      // Reset form
      setTitle("");
      setDescription("");
      setDate(undefined);
      setStartTime("");
      setEndTime("");
      setLocation("");
      setTarget(children[0]?.student_id || "");
      onOpenChange(false);
      onEventCreated();
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target">Event For</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger id="target">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.student_id} value={child.student_id}>
                    {child.student_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Event location (optional)"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (editEvent ? "Updating..." : "Creating...") 
                : (editEvent ? "Update Event" : "Create Event")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
