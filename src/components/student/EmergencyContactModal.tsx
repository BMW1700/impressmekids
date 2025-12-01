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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  custom_relationship?: string;
  phone_number: string;
}

interface EmergencyContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: EmergencyContact | null;
  onSave: () => void;
}

export const EmergencyContactModal = ({
  open,
  onOpenChange,
  contact,
  onSave,
}: EmergencyContactModalProps) => {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [customRelationship, setCustomRelationship] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    
    // Format as (XXX) XXX-XXXX
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setRelationship(contact.relationship);
      setCustomRelationship(contact.custom_relationship || "");
      // Format phone number from database (stored as digits only)
      setPhoneNumber(formatPhoneNumber(contact.phone_number));
    } else {
      setName("");
      setRelationship("");
      setCustomRelationship("");
      setPhoneNumber("");
    }
  }, [contact, open]);

  const handleSave = async () => {
    if (!name || !relationship || !phoneNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (relationship === "Other" && !customRelationship) {
      toast({
        title: "Error",
        description: "Please specify the relationship",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use getSession() instead of getUser() for more reliable session retrieval
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error("Your session has expired. Please sign out and sign back in.");
      }
      
      const user = session.user;

      // Store only digits in database
      const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      if (cleanedPhoneNumber.length !== 10) {
        throw new Error("Phone number must be 10 digits");
      }

      const contactData = {
        student_id: user.id,
        name,
        relationship,
        custom_relationship: relationship === "Other" ? customRelationship : null,
        phone_number: cleanedPhoneNumber,
      };

      if (contact?.id) {
        const { error } = await supabase
          .from("emergency_contacts")
          .update(contactData)
          .eq("id", contact.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Emergency contact updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("emergency_contacts")
          .insert(contactData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Emergency contact added successfully",
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
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
            {contact ? "Edit Emergency Contact" : "Add Emergency Contact"}
          </DialogTitle>
          <DialogDescription>
            {contact
              ? "Update the emergency contact information below."
              : "Enter the emergency contact information below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter contact name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship *</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Parent/Guardian">Parent/Guardian</SelectItem>
                <SelectItem value="Primary Care Physician">Primary Care Physician</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {relationship === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="customRelationship">Specify Relationship *</Label>
              <Input
                id="customRelationship"
                value={customRelationship}
                onChange={(e) => setCustomRelationship(e.target.value)}
                placeholder="Enter relationship"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="(123) 456-7890"
              maxLength={14}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};