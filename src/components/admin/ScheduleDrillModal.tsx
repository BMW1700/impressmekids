import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ScheduleDrillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (drillType: string, scheduledFor: Date) => Promise<void>;
}

export function ScheduleDrillModal({ open, onOpenChange, onSchedule }: ScheduleDrillModalProps) {
  const [drillType, setDrillType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!drillType || !selectedDate) return;

    setIsScheduling(true);
    try {
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await onSchedule(drillType, scheduledDateTime);
      
      // Reset form
      setDrillType("");
      setSelectedDate(undefined);
      setSelectedTime("10:00");
      onOpenChange(false);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Safety Drill</DialogTitle>
          <DialogDescription>
            Schedule a drill to notify all teachers, students, and parents in advance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Drill Type</Label>
            <Select value={drillType} onValueChange={setDrillType}>
              <SelectTrigger>
                <SelectValue placeholder="Select drill type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fire_drill">🔥 Fire Drill</SelectItem>
                <SelectItem value="lockdown_drill">🔒 Lockdown Drill</SelectItem>
                <SelectItem value="earthquake_drill">🌊 Earthquake Drill</SelectItem>
                <SelectItem value="tornado_drill">🌪️ Tornado Drill</SelectItem>
                <SelectItem value="evacuation_drill">🚶 Evacuation Drill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00">8:00 AM</SelectItem>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="11:00">11:00 AM</SelectItem>
                <SelectItem value="12:00">12:00 PM</SelectItem>
                <SelectItem value="13:00">1:00 PM</SelectItem>
                <SelectItem value="14:00">2:00 PM</SelectItem>
                <SelectItem value="15:00">3:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSchedule} 
            disabled={!drillType || !selectedDate || isScheduling}
          >
            {isScheduling ? "Scheduling..." : "Schedule Drill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
