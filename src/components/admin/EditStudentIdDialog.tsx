import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditStudentIdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  currentStudentIdNumber: string | null;
}

export const EditStudentIdDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  currentStudentIdNumber,
}: EditStudentIdDialogProps) => {
  const [studentIdNumber, setStudentIdNumber] = useState(currentStudentIdNumber || "");
  const queryClient = useQueryClient();

  const updateStudentIdMutation = useMutation({
    mutationFn: async (newStudentId: string | null) => {
      const { error } = await supabase
        .from("profiles")
        .update({ student_id: newStudentId || null })
        .eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      toast.success("Student ID updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (error.message.includes("must be exactly 8 digits")) {
        toast.error("Student ID must be exactly 8 digits");
      } else {
        toast.error("Failed to update student ID: " + error.message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = studentIdNumber.trim();
    if (trimmed && !/^\d{8}$/.test(trimmed)) {
      toast.error("Student ID must be exactly 8 digits");
      return;
    }
    updateStudentIdMutation.mutate(trimmed || null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Student ID</DialogTitle>
          <DialogDescription>
            Update the student ID number for {studentName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID Number</Label>
              <Input
                id="studentId"
                placeholder="12345678"
                value={studentIdNumber}
                onChange={(e) => setStudentIdNumber(e.target.value)}
                maxLength={8}
                pattern="\d{8}"
              />
              <p className="text-sm text-muted-foreground">
                Must be exactly 8 digits. Leave empty to remove.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateStudentIdMutation.isPending}>
              {updateStudentIdMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};