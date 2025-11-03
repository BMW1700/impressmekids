import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Mic, FileText } from "lucide-react";
import { useStudentSubmissionAttempts } from "@/hooks/useStudentSubmissionAttempts";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface StudentAssignmentCardProps {
  assignment: any;
  classroomId: string;
}

export function StudentAssignmentCard({ assignment, classroomId }: StudentAssignmentCardProps) {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const getStudentId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id) {
        setStudentId(session.user.id);
      }
    };
    getStudentId();
  }, []);

  const {
    inProgressSubmission,
    completedSubmissions,
    canStartNewAttempt,
    maxAttempts,
    attemptsRemaining,
  } = useStudentSubmissionAttempts(assignment.id, studentId || undefined);

  const handleStartAssignment = () => {
    navigate(`/student/assignment/${assignment.id}?classroom=${classroomId}`);
  };

  const renderButton = () => {
    if (inProgressSubmission) {
      return (
        <Button onClick={handleStartAssignment} className="w-full">
          Resume Attempt {inProgressSubmission.attempt_number}
        </Button>
      );
    }

    if (completedSubmissions && completedSubmissions.length === 0) {
      return (
        <Button onClick={handleStartAssignment} className="w-full">
          <FileText className="mr-2 h-4 w-4" />
          Start Assignment
        </Button>
      );
    }

    if (canStartNewAttempt && attemptsRemaining && attemptsRemaining > 0) {
      return (
        <>
          <Badge variant="default" className="mb-2">
            Completed: {completedSubmissions?.length || 0}/{maxAttempts || 1}
          </Badge>
          <Button onClick={handleStartAssignment} className="w-full">
            Start Another Attempt
          </Button>
        </>
      );
    }

    // Maximum attempts reached
    return (
      <>
        <Badge variant="secondary" className="mb-2">Complete</Badge>
        <Badge variant="outline" className="mb-2">Maximum Attempts Submitted</Badge>
        <Button disabled className="w-full">
          All Attempts Complete
        </Button>
      </>
    );
  };

  return (
    <Card className="shadow-card hover:shadow-purple transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            {assignment.assignment_type === 'speaking' && (
              <span title="Speaking Assignment">
                <Mic className="h-4 w-4 text-primary" />
              </span>
            )}
            {(assignment.assignment_type === 'reading_comprehension' || 
              assignment.assignment_type === 'multi_question') && (
              <div className="flex items-center gap-1">
                <span title="Reading/Questions">
                  <BookOpen className="h-4 w-4 text-primary" />
                </span>
                <span title="Includes Speaking">
                  <Mic className="h-4 w-4 text-primary" />
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {assignment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {assignment.description}
            </p>
          )}
          {assignment.due_date && (
            <p className="text-xs text-muted-foreground">
              Due: {new Date(assignment.due_date).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Created {new Date(assignment.created_at).toLocaleDateString()}
          </p>
          
          {renderButton()}
        </div>
      </CardContent>
    </Card>
  );
}
