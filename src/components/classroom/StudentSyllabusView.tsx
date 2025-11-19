import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, Info, ExternalLink, AlertTriangle } from "lucide-react";
import { GradeWeightsDisplay } from "./GradeWeightsDisplay";
import {
  useClassroomSyllabus,
  useDownloadSyllabus,
  useSignedSyllabusUrl,
} from "@/hooks/useClassroomSyllabus";

interface StudentSyllabusViewProps {
  classroomId: string;
}

export const StudentSyllabusView = ({ classroomId }: StudentSyllabusViewProps) => {
  const { data: syllabus, isLoading } = useClassroomSyllabus(classroomId);
  const downloadMutation = useDownloadSyllabus();
  const { data: signedUrl, isLoading: isLoadingUrl } = useSignedSyllabusUrl(
    syllabus?.file_url || null
  );
  const [pdfLoadError, setPdfLoadError] = useState(false);

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
            <div className="flex gap-2">
              <Button onClick={handleDownload} disabled={downloadMutation.isPending}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {signedUrl && (
                <Button 
                  variant="outline"
                  onClick={() => window.open(signedUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in New Tab
                </Button>
              )}
            </div>
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
            {isLoadingUrl ? (
              <div className="w-full h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-12 w-12 animate-pulse mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading syllabus...</p>
                </div>
              </div>
            ) : signedUrl ? (
              <>
                {syllabus.mime_type === 'application/pdf' ? (
                  <>
                    <iframe
                      src={signedUrl}
                      className="w-full h-[600px]"
                      title="Course Syllabus"
                      onError={() => setPdfLoadError(true)}
                      onLoad={() => setPdfLoadError(false)}
                    />
                    {pdfLoadError && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Your browser cannot display PDFs inline. Please download the file or open in a new tab.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (syllabus.mime_type?.includes('word') || syllabus.mime_type?.includes('document')) ? (
                  <div className="w-full h-[600px] flex items-center justify-center bg-muted">
                    <div className="text-center space-y-4">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Word Document</p>
                        <p className="text-sm text-muted-foreground">
                          Word documents cannot be previewed. Please download to view.
                        </p>
                      </div>
                      <Button onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Document
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="w-full h-[600px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Unable to display preview. Use the download button above.
                </p>
              </div>
            )}
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
