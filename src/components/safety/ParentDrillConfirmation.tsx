import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Car, 
  UserCheck, 
  AlertTriangle,
  Loader2,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParentDrillConfirmationProps {
  drillSessionId: string;
  studentId: string;
  studentName: string;
  drillType: string;
  isRealEmergency: boolean;
  parentId: string;
  existingResponse?: {
    response_type: string;
    notes?: string;
    created_at: string;
  };
  onResponseSubmitted?: () => void;
}

const RESPONSE_OPTIONS = [
  {
    type: "confirmed_safe",
    label: "My Child is Safe",
    description: "I confirm my child is safe and accounted for",
    icon: CheckCircle2,
    color: "bg-green-600 hover:bg-green-700"
  },
  {
    type: "en_route",
    label: "I'm On My Way",
    description: "I am currently en route to pick up my child",
    icon: Car,
    color: "bg-blue-600 hover:bg-blue-700"
  },
  {
    type: "picked_up",
    label: "Child Picked Up",
    description: "I have picked up my child from school",
    icon: UserCheck,
    color: "bg-purple-600 hover:bg-purple-700"
  },
  {
    type: "needs_help",
    label: "Need Assistance",
    description: "I need help or have concerns about my child",
    icon: AlertTriangle,
    color: "bg-orange-600 hover:bg-orange-700"
  }
];

export function ParentDrillConfirmation({
  drillSessionId,
  studentId,
  studentName,
  drillType,
  isRealEmergency,
  parentId,
  existingResponse,
  onResponseSubmitted
}: ParentDrillConfirmationProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string | null>(existingResponse?.response_type || null);
  const [notes, setNotes] = useState(existingResponse?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(!!existingResponse);

  const handleSubmit = async (responseType: string) => {
    setIsSubmitting(true);
    setSelectedType(responseType);

    try {
      const { error } = await supabase
        .from("parent_drill_responses")
        .upsert({
          parent_id: parentId,
          student_id: studentId,
          drill_session_id: drillSessionId,
          response_type: responseType,
          notes: notes || null
        }, {
          onConflict: "parent_id,student_id,drill_session_id"
        });

      if (error) throw error;

      setHasSubmitted(true);
      toast({
        title: "Response Submitted",
        description: `Your response for ${studentName} has been recorded.`
      });

      onResponseSubmitted?.();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentResponse = RESPONSE_OPTIONS.find(opt => opt.type === selectedType);

  if (hasSubmitted && currentResponse) {
    return (
      <Card className={`p-4 ${isRealEmergency ? "border-red-600 border-2" : "border-green-600 border-2"}`}>
        <div className="flex items-center gap-3">
          <currentResponse.icon className="h-6 w-6 text-green-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{studentName}</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Response Recorded
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentResponse.label} • {new Date(existingResponse?.created_at || Date.now()).toLocaleTimeString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHasSubmitted(false)}
          >
            Update
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${isRealEmergency ? "border-red-600 border-2 bg-red-600/10" : "border-primary/30"}`}>
      <div className="flex items-center gap-3 mb-4">
        <Shield className={`h-6 w-6 ${isRealEmergency ? "text-red-600" : "text-primary"}`} />
        <div>
          <h3 className="font-semibold text-lg">{studentName}</h3>
          <p className="text-sm text-muted-foreground">
            {drillType.replace(/_/g, " ")} {isRealEmergency && "- REAL EMERGENCY"}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Please confirm your child's status to help the school ensure everyone is accounted for.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {RESPONSE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.type}
              variant="outline"
              className={`h-auto p-4 flex flex-col items-center gap-2 ${
                selectedType === option.type ? option.color + " text-white" : ""
              }`}
              onClick={() => handleSubmit(option.type)}
              disabled={isSubmitting}
            >
              {isSubmitting && selectedType === option.type ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Icon className="h-6 w-6" />
              )}
              <span className="font-medium text-sm">{option.label}</span>
            </Button>
          );
        })}
      </div>

      <Textarea
        placeholder="Add any notes or additional information (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mb-2"
        rows={2}
      />
    </Card>
  );
}