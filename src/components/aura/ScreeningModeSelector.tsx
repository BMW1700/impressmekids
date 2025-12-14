import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  getCurrentScreeningPeriod, 
  getCurrentSchoolYear,
  type ScreeningPeriod 
} from "@/lib/fluencyBenchmarks";
import { useCreateBenchmarkPeriod } from "@/hooks/useBenchmarkData";
import { format, addDays } from "date-fns";
import { CalendarIcon, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScreeningModeSelectorProps {
  classroomId: string;
  onPeriodCreated?: (periodId: string) => void;
}

export function ScreeningModeSelector({ 
  classroomId,
  onPeriodCreated 
}: ScreeningModeSelectorProps) {
  const createPeriod = useCreateBenchmarkPeriod();
  
  const suggestedPeriod = getCurrentScreeningPeriod();
  const schoolYear = getCurrentSchoolYear();
  
  const [selectedPeriod, setSelectedPeriod] = useState<ScreeningPeriod>(suggestedPeriod);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 14));

  const handleCreatePeriod = async () => {
    const result = await createPeriod.mutateAsync({
      classroomId,
      periodName: selectedPeriod,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      schoolYear,
    });
    // Pass the created period ID to the callback
    onPeriodCreated?.(result.id);
  };

  const periodDescriptions: Record<ScreeningPeriod, string> = {
    Fall: "Beginning of year baseline (August - November)",
    Winter: "Mid-year progress check (December - February)",
    Spring: "End of year summative (March - June)",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Universal Screening</CardTitle>
        <CardDescription>
          Configure the benchmark assessment period for your classroom
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selection */}
        <div className="space-y-3">
          <Label>Screening Period</Label>
          <RadioGroup
            value={selectedPeriod}
            onValueChange={(v) => setSelectedPeriod(v as ScreeningPeriod)}
            className="grid grid-cols-3 gap-4"
          >
            {(['Fall', 'Winter', 'Spring'] as ScreeningPeriod[]).map((period) => (
              <div key={period}>
                <RadioGroupItem
                  value={period}
                  id={period}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={period}
                  className={cn(
                    "flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                    "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  )}
                >
                  <span className="text-lg font-semibold">{period}</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    {period === 'Fall' && 'Aug - Nov'}
                    {period === 'Winter' && 'Dec - Feb'}
                    {period === 'Spring' && 'Mar - Jun'}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <p className="text-sm text-muted-foreground">
            {periodDescriptions[selectedPeriod]}
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* School Year */}
        <div className="space-y-2">
          <Label>School Year</Label>
          <Input value={schoolYear} disabled className="bg-muted" />
        </div>

        {/* Start Button */}
        <Button 
          onClick={handleCreatePeriod} 
          className="w-full"
          disabled={createPeriod.isPending}
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          {createPeriod.isPending ? "Creating..." : "Start Screening Period"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Once started, students can complete benchmark assessments during this period.
          Results will be automatically categorized by RTI tier.
        </p>
      </CardContent>
    </Card>
  );
}
