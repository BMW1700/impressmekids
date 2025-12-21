import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface MedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication?: any;
  onSave: () => void;
}

const TIME_OF_DAY_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night (Before Bed)" },
  { value: "with_meals", label: "With Meals" },
  { value: "as_needed", label: "As Needed" },
];

export const MedicationModal = ({
  open,
  onOpenChange,
  medication,
  onSave,
}: MedicationModalProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [medicationName, setMedicationName] = useState("");
  const [dose, setDose] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (medication) {
      setMedicationName(medication.medication_name || "");
      setDose(medication.dose || "");
      setTimeOfDay(medication.time_of_day || "");
      setDescription(medication.description || "");
    } else {
      setMedicationName("");
      setDose("");
      setTimeOfDay("");
      setDescription("");
    }
  }, [medication, open]);

  const handleSave = async () => {
    if (!medicationName.trim() || !dose.trim() || !timeOfDay) {
      toast({
        title: t("common.error"),
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (medication) {
        // Update existing
        const { error } = await supabase
          .from("student_medications")
          .update({
            medication_name: medicationName.trim(),
            dose: dose.trim(),
            time_of_day: timeOfDay,
            description: description.trim() || null,
          })
          .eq("id", medication.id);

        if (error) throw error;

        toast({
          title: t("common.success"),
          description: "Medication updated successfully",
        });
      } else {
        // Create new
        const { error } = await supabase.from("student_medications").insert({
          student_id: user.id,
          medication_name: medicationName.trim(),
          dose: dose.trim(),
          time_of_day: timeOfDay,
          description: description.trim() || null,
        });

        if (error) throw error;

        toast({
          title: t("common.success"),
          description: "Medication added successfully",
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {medication ? "Edit Medication" : "Add Medication"}
          </DialogTitle>
          <DialogDescription>
            Enter the medication details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicationName">Medication Name *</Label>
            <Input
              id="medicationName"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="e.g., Ibuprofen, Inhaler"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dose">Dose *</Label>
            <Input
              id="dose"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g., 200mg, 2 puffs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeOfDay">Time of Day *</Label>
            <Select value={timeOfDay} onValueChange={setTimeOfDay}>
              <SelectTrigger>
                <SelectValue placeholder="Select when you take it" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OF_DAY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details about this medication..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("student.account.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : medication ? "Update" : "Add Medication"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
