import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useStudentParents } from "@/hooks/useAdminData";
import { format } from "date-fns";

interface StudentParentsListProps {
  open: boolean;
  onClose: () => void;
  studentId: string | null;
  studentName: string;
}

export const StudentParentsList = ({
  open,
  onClose,
  studentId,
  studentName,
}: StudentParentsListProps) => {
  const { data: parents, isLoading } = useStudentParents(studentId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Parents of {studentName}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !parents || parents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No parent links found</p>
        ) : (
          <div className="space-y-3">
            {parents.map((parent) => (
              <Card key={parent.parent_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{parent.parent_name}</CardTitle>
                      <CardDescription>{parent.parent_email}</CardDescription>
                    </div>
                    <Badge variant={parent.approved ? "default" : "secondary"} className="gap-1">
                      {parent.approved ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Approved
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                {parent.approved && parent.approved_at && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Approved: {format(new Date(parent.approved_at), "MMM d, yyyy")}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
