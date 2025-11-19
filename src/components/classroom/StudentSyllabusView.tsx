import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, Info } from "lucide-react";
import { GradeWeightsDisplay } from "./GradeWeightsDisplay";
import {
  useClassroomSyllabus,
  useDownloadSyllabus,
} from "@/hooks/useClassroomSyllabus";

interface StudentSyllabusViewProps {
  classroomId: string;
}

export const StudentSyllabusView = ({ classroomId }: StudentSyllabusViewProps) => {
  const { data: syllabus, isLoading } = useClassroomSyllabus(classroomId);
  const downloadMutation = useDownloadSyllabus();

  const handleDownload = () => {
    if (syllabus) {
      downloadMutation.mutate({
        filePath: syllabus.file_url,
        fileName: syllabus.file_name,
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">Loading...</div>;
  }

  if (!syllabus || !syllabus.is_posted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Syllabus Available</h3>
        <p className="text-muted-foreground max-w-md">
          Your teacher hasn't posted a syllabus yet. Check back later or ask your
          teacher for more information.
        </p>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Syllabus File Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Course Syllabus</CardTitle>
              <CardDescription>
                {syllabus.file_name} • {formatFileSize(syllabus.file_size)}
              </CardDescription>
            </div>
            <Button onClick={handleDownload} disabled={downloadMutation.isPending}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is your course syllabus. Review it carefully to understand course
              requirements, grading policies, and important dates.
            </AlertDescription>
          </Alert>

          {/* PDF Viewer */}
          <div className="border rounded-lg overflow-hidden bg-muted">
            <iframe
              src={`/api/placeholder/800/600`}
              className="w-full h-[600px]"
              title="Course Syllabus"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grade Weights Display */}
      <GradeWeightsDisplay weights={syllabus.grade_weights} />

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Your Grade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your final grade in this course is calculated using a weighted system. Each
            category (Tests, Quizzes, Homework, and Attendance) contributes a specific
            percentage to your overall grade.
          </p>
          <p className="text-sm text-muted-foreground">
            Within each category, all assignments are weighted equally. For example, if
            Tests are worth 30% of your final grade and you have 3 tests, each test
            contributes 10% to your final grade.
          </p>
          <p className="text-sm text-muted-foreground">
            You can view your current grade breakdown in the "Gradebook" tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
