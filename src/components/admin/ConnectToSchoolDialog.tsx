import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSchools } from "@/hooks/useSchools";
import { Loader2, School } from "lucide-react";

interface ConnectToSchoolDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentSchoolId?: string | null;
}

export const ConnectToSchoolDialog = ({
  open,
  onClose,
  userId,
  userName,
  currentSchoolId,
}: ConnectToSchoolDialogProps) => {
  const { schools, isLoading, connectUserToSchool } = useSchools();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentSchoolId || "");

  const handleConnect = async () => {
    await connectUserToSchool.mutateAsync({
      userId,
      schoolId: selectedSchoolId || null,
    });
    onClose();
  };

  const handleDisconnect = async () => {
    await connectUserToSchool.mutateAsync({
      userId,
      schoolId: null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            {currentSchoolId ? "Change School" : "Connect to School"}
          </DialogTitle>
          <DialogDescription>
            {currentSchoolId
              ? `Change the school assignment for ${userName}`
              : `Connect ${userName} to a school in your district`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="school">Select School</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !schools || schools.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No schools available. Please create a school first.
              </p>
            ) : (
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleConnect}
              disabled={!selectedSchoolId || connectUserToSchool.isPending}
              className="flex-1"
            >
              {connectUserToSchool.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : currentSchoolId ? (
                "Change School"
              ) : (
                "Connect"
              )}
            </Button>
            {currentSchoolId && (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={connectUserToSchool.isPending}
              >
                Disconnect
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
