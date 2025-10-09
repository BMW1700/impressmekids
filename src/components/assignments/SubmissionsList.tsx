import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Submission {
  id: string;
  student_id: string;
  status: string;
  submitted_at: string | null;
  graded_at: string | null;
  grade: number | null;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface SubmissionsListProps {
  submissions: Submission[];
  classroomId: string;
}

export const SubmissionsList = ({ submissions, classroomId }: SubmissionsListProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (submission: Submission) => {
    if (submission.graded_at) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Graded
        </Badge>
      );
    }
    if (submission.status === 'submitted') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Submitted
        </Badge>
      );
    }
    if (submission.status === 'in_progress') {
      return (
        <Badge variant="outline" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          In Progress
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        Not Started
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <Card key={submission.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(submission.profiles?.full_name || 'Student')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {submission.profiles?.full_name || 'Student'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {submission.profiles?.email || 'No email'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(submission)}
                
                {submission.grade !== null && (
                  <Badge variant="outline" className="font-mono font-bold">
                    {submission.grade}/100
                  </Badge>
                )}

                {submission.submitted_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate(`/teacher/review-submission/${submission.id}?classroom=${classroomId}`)
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                )}
              </div>
            </div>

            {submission.submitted_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Submitted {new Date(submission.submitted_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {submissions.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">No Submissions Yet</h3>
          <p className="text-muted-foreground">
            Students haven't started this assignment yet
          </p>
        </Card>
      )}
    </div>
  );
};
