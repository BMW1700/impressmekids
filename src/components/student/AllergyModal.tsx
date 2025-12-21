import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Allergy {
  id: string;
  allergy_name: string;
  description: string | null;
}

interface AllergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  allergy?: Allergy | null;
  onSuccess: () => void;
}

export function AllergyModal({ isOpen, onClose, allergy, onSuccess }: AllergyModalProps) {
  const [allergyName, setAllergyName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (allergy) {
      setAllergyName(allergy.allergy_name);
      setDescription(allergy.description || "");
    } else {
      setAllergyName("");
      setDescription("");
    }
  }, [allergy, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allergyName.trim()) {
      toast.error("Please enter the allergy name");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (allergy) {
        const { error } = await supabase
          .from("student_allergies")
          .update({
            allergy_name: allergyName.trim(),
            description: description.trim() || null,
          })
          .eq("id", allergy.id);

        if (error) throw error;
        toast.success("Allergy updated successfully");
      } else {
        const { error } = await supabase
          .from("student_allergies")
          .insert({
            student_id: user.id,
            allergy_name: allergyName.trim(),
            description: description.trim() || null,
          });

        if (error) throw error;
        toast.success("Allergy added successfully");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save allergy");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{allergy ? "Edit Allergy" : "Add Allergy"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergyName">Allergy *</Label>
            <Input
              id="allergyName"
              value={allergyName}
              onChange={(e) => setAllergyName(e.target.value)}
              placeholder="e.g., Peanuts, Penicillin, Latex"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details about this allergy..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : allergy ? "Update" : "Add Allergy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
