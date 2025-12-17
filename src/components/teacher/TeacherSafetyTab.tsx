import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Flame, AlertTriangle, Biohazard, HelpCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TeacherDrillAttendance } from "./TeacherDrillAttendance";

interface TeacherSafetyTabProps {
  classroomId: string;
  students: any[];
}

type EmergencyType = "Fire" | "Chemical Spill / Hazard" | "Threat" | "Other" | null;

export const TeacherSafetyTab = ({ classroomId, students }: TeacherSafetyTabProps) => {
  const { toast } = useToast();
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyType>(null);
  const [description, setDescription] = useState("");
  const [otherTitle, setOtherTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingRecess, setIsStartingRecess] = useState(false);

  const handleRecessReturn = async () => {
    setIsStartingRecess(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      await supabase.functions.invoke('send-drill-notification', {
        body: {
          type: 'recess_return',
          classroomId: classroomId,
          studentIds: students.map(s => s.id),
        },
      });

      toast({
        title: "Recess Return Notifications Sent",
        description: "Parents who opted in have been notified their children returned from recess.",
      });
    } catch (error) {
      console.error('Error sending recess notifications:', error);
      toast({
        title: "Error",
        description: "Failed to send recess return notifications",
        variant: "destructive",
      });
    } finally {
      setIsStartingRecess(false);
    }
  };

  const handleEmergencySelect = (type: EmergencyType) => {
    setSelectedEmergency(type);
    setDescription("");
    setOtherTitle("");
  };

  const handleCloseDialog = () => {
    setSelectedEmergency(null);
    setDescription("");
    setOtherTitle("");
  };

  const handleReportEmergency = async () => {
    if (!selectedEmergency) {
      return;
    }

    if (selectedEmergency === "Other" && !otherTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title for the emergency.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('report-emergency', {
        body: {
          emergencyType: selectedEmergency,
          title: selectedEmergency === "Other" ? otherTitle : selectedEmergency,
          description: description,
          classroomId: classroomId,
          teacherId: session.user.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Emergency Reported",
        description: `Your emergency report has been sent to administration. ${data?.adminsNotified || 0} administrator(s) notified.`,
      });

      handleCloseDialog();
    } catch (error) {
      console.error('Error reporting emergency:', error);
      toast({
        title: "Error",
        description: "Failed to report emergency. Please try again or contact administration directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const emergencyOptions = [
    { type: "Fire" as EmergencyType, icon: Flame, color: "text-orange-600", bgColor: "bg-orange-50 hover:bg-orange-100 border-orange-200" },
    { type: "Chemical Spill / Hazard" as EmergencyType, icon: Biohazard, color: "text-yellow-600", bgColor: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200" },
    { type: "Threat" as EmergencyType, icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-50 hover:bg-red-100 border-red-200" },
    { type: "Other" as EmergencyType, icon: HelpCircle, color: "text-gray-600", bgColor: "bg-gray-50 hover:bg-gray-100 border-gray-200" },
  ];

  return (
    <div className="space-y-6">
      {/* Active Drill Attendance - Shows during drills */}
      <TeacherDrillAttendance 
        classroomId={classroomId} 
        students={students.map(s => ({ id: s.id, full_name: s.full_name }))} 
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Report an Emergency</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Report a real emergency to administration immediately
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Emergency Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {emergencyOptions.map(({ type, icon: Icon, color, bgColor }) => (
                <Button
                  key={type}
                  variant="outline"
                  className={`h-24 flex-col gap-2 border-2 ${bgColor}`}
                  onClick={() => handleEmergencySelect(type)}
                >
                  <Icon className={`h-8 w-8 ${color}`} />
                  <span className="text-sm font-medium">{type}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-3">Recess & Break Management</h3>
            <Button
              variant="outline"
              className="w-full h-16"
              onClick={handleRecessReturn}
              disabled={isStartingRecess}
            >
              <Users className="mr-2 h-5 w-5" />
              {isStartingRecess ? 'Sending...' : 'Students Returned from Recess'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Notify parents who opted in that their children have returned from recess
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Report Dialog */}
      <Dialog open={selectedEmergency !== null} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Report {selectedEmergency === "Other" ? "Emergency" : selectedEmergency}
            </DialogTitle>
            <DialogDescription>
              This will send an immediate notification to all administrators in your district.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedEmergency === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="emergency-title">What is the Emergency</Label>
                <Input
                  id="emergency-title"
                  placeholder="Enter the type of emergency..."
                  value={otherTitle}
                  onChange={(e) => setOtherTitle(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="emergency-description">Description (Optional)</Label>
              <Textarea
                id="emergency-description"
                placeholder="Describe the emergency situation, location details, and any immediate actions taken..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Your report will include your name and classroom location so administrators can respond quickly.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReportEmergency}
              disabled={isSubmitting || (selectedEmergency === "Other" && !otherTitle.trim())}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                "Report to Administration"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
