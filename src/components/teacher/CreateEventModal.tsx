import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, MapPin, Link as LinkIcon, FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  teacherId: string;
  event?: any; // For editing existing events
}

const EVENT_CATEGORIES = [
  { value: "quiz", label: "Quiz" },
  { value: "test", label: "Test" },
  { value: "field_trip", label: "Field Trip" },
  { value: "guest_speaker", label: "Guest Speaker" },
  { value: "homework_due", label: "Homework Due" },
  { value: "project_presentation", label: "Project Presentation" },
  { value: "parent_teacher_conference", label: "Parent-Teacher Conference" },
  { value: "other", label: "Other" },
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const CreateEventModal = ({ open, onOpenChange, classroomId, teacherId, event }: CreateEventModalProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [eventDate, setEventDate] = useState<Date | undefined>(
    event?.event_date ? new Date(event.event_date) : undefined
  );
  const [startTime, setStartTime] = useState(event?.start_time || "");
  const [endTime, setEndTime] = useState(event?.end_time || "");
  const [location, setLocation] = useState(event?.location || "");
  const [category, setCategory] = useState(event?.category || "other");
  const [isRepeating, setIsRepeating] = useState(event?.is_repeating || false);
  const [repeatDays, setRepeatDays] = useState<string[]>(event?.repeat_days || []);
  const [repeatEndDate, setRepeatEndDate] = useState<Date | undefined>(
    event?.repeat_end_date ? new Date(event.repeat_end_date) : undefined
  );
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string }>>(
    event?.attachments || []
  );

  const [conflicts, setConflicts] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const checkConflicts = async () => {
    if (!eventDate || !startTime || !endTime) return;

    const conflicts: string[] = [];
    const warnings: string[] = [];
    
    // Check for school events
    const { data: schoolEvents } = await supabase
      .from("school_events")
      .select("*")
      .eq("event_date", format(eventDate, "yyyy-MM-dd"));

    if (schoolEvents && schoolEvents.length > 0) {
      schoolEvents.forEach(se => {
        if (se.blocks_classes) {
          warnings.push(`School event "${se.title}" blocks regular classes on this date`);
        } else {
          warnings.push(`School event "${se.title}" is scheduled on this date`);
        }
      });
    }

    // Check for other events in the same classroom
    const { data: existingEvents } = await supabase
      .from("events")
      .select("*")
      .eq("classroom_id", classroomId)
      .eq("event_date", format(eventDate, "yyyy-MM-dd"))
      .neq("id", event?.id || "");

    if (existingEvents && existingEvents.length > 0) {
      existingEvents.forEach(e => {
        const existingStart = e.start_time;
        const existingEnd = e.end_time;
        
        // Check for time overlap
        if ((startTime >= existingStart && startTime < existingEnd) ||
            (endTime > existingStart && endTime <= existingEnd) ||
            (startTime <= existingStart && endTime >= existingEnd)) {
          conflicts.push(`Conflicts with event "${e.title}" (${existingStart} - ${existingEnd})`);
        }
      });
    }

    // Check school hours
    const { data: settings } = await supabase
      .from("school_settings")
      .select("*")
      .single();

    if (settings) {
      if (startTime < settings.school_start_time) {
        warnings.push(`Event starts before normal school hours (${settings.school_start_time})`);
      }
      if (endTime > settings.school_end_time) {
        warnings.push(`Event ends after normal school hours (${settings.school_end_time})`);
      }
    }

    setConflicts(conflicts);
    setWarnings(warnings);
  };

  const handleAddAttachment = () => {
    if (attachmentName && attachmentUrl) {
      setAttachments([...attachments, { name: attachmentName, url: attachmentUrl }]);
      setAttachmentName("");
      setAttachmentUrl("");
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleToggleRepeatDay = (day: string) => {
    setRepeatDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!title || !eventDate || !startTime || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isRepeating && repeatDays.length === 0) {
      toast.error("Please select at least one day for repeating events");
      return;
    }

    setIsLoading(true);

    try {
      const eventData = {
        classroom_id: classroomId,
        teacher_id: teacherId,
        title,
        description,
        event_date: format(eventDate, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        location,
        category,
        is_repeating: isRepeating,
        repeat_days: isRepeating ? repeatDays : [],
        repeat_end_date: isRepeating && repeatEndDate ? format(repeatEndDate, "yyyy-MM-dd") : null,
        attachments,
        is_posted: !isDraft,
      };

      if (event) {
        // Update existing event
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", event.id);

        if (error) throw error;
        toast.success(`Event ${isDraft ? "saved as draft" : "posted"} successfully`);
      } else {
        // Create new event
        const { error } = await supabase
          .from("events")
          .insert(eventData);

        if (error) throw error;
        toast.success(`Event ${isDraft ? "saved as draft" : "posted"} successfully`);
      }

      queryClient.invalidateQueries({ queryKey: ["calendar-data"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast.error(error.message || "Failed to save event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Math Quiz on Chapter 5"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the event..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Event Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={(date) => {
                      setEventDate(date);
                      if (date) checkConflicts();
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    checkConflicts();
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    checkConflicts();
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Room 204 or Auditorium"
                className="pl-10"
              />
            </div>
          </div>

          {/* Repeating Event */}
          <div className="space-y-3 p-4 border rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={isRepeating}
                onCheckedChange={(checked) => setIsRepeating(!!checked)}
              />
              <span className="font-medium">Repeating Event</span>
            </label>

            {isRepeating && (
              <>
                <div className="space-y-2">
                  <Label>Repeat on days:</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={repeatDays.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleRepeatDay(day)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Repeat until (optional):</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !repeatEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {repeatEndDate ? format(repeatEndDate, "MMM d, yyyy") : "End of school year"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={repeatEndDate}
                        onSelect={setRepeatEndDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>

          {/* Attachments */}
          <div className="space-y-3 p-4 border rounded-lg">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Attachments & Links
            </Label>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <LinkIcon className="h-4 w-4" />
                    <span className="flex-1 truncate">{att.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Link name (e.g., Zoom Link)"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
              />
              <Input
                placeholder="URL"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
              />
              <Button type="button" onClick={handleAddAttachment}>
                Add
              </Button>
            </div>
          </div>

          {/* Warnings and Conflicts */}
          {(conflicts.length > 0 || warnings.length > 0) && (
            <div className="space-y-2">
              {conflicts.length > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <div className="flex items-center gap-2 text-destructive font-semibold mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Conflicts Detected
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {conflicts.map((conflict, idx) => (
                      <li key={idx}>{conflict}</li>
                    ))}
                  </ul>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 font-semibold mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1 text-yellow-700">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
              className="flex-1"
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isLoading || conflicts.length > 0}
              className="flex-1"
            >
              {isLoading ? "Posting..." : "Post Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
