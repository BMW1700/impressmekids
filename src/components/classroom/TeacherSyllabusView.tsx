import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Info,
} from "lucide-react";
import { GradeWeightsForm } from "./GradeWeightsForm";
import {
  useClassroomSyllabus,
  useUploadSyllabus,
  useUpdateGradeWeights,
  useToggleSyllabusPublish,
  useDeleteSyllabus,
  useDownloadSyllabus,
  useSignedSyllabusUrl,
  GradeWeights,
} from "@/hooks/useClassroomSyllabus";
import { toast } from "sonner";

interface TeacherSyllabusViewProps {
  classroomId: string;
}

export const TeacherSyllabusView = ({ classroomId }: TeacherSyllabusViewProps) => {
  const { data: syllabus, isLoading } = useClassroomSyllabus(classroomId);
  const uploadMutation = useUploadSyllabus();
  const updateWeightsMutation = useUpdateGradeWeights();
  const togglePublishMutation = useToggleSyllabusPublish();
  const deleteMutation = useDeleteSyllabus();
  const downloadMutation = useDownloadSyllabus();
  const { data: signedUrl, isLoading: isLoadingUrl } = useSignedSyllabusUrl(
    syllabus?.file_url || null
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  const handleFileUpload = useCallback(
    (file: File) => {
      uploadMutation.mutate({ classroomId, file });
    },
    [classroomId, uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleSaveWeights = useCallback(
    (weights: GradeWeights) => {
      updateWeightsMutation.mutate({ classroomId, weights });
    },
    [classroomId, updateWeightsMutation]
  );

  const handleTogglePublish = useCallback(
    (checked: boolean) => {
      togglePublishMutation.mutate({
        classroomId,
        isPosted: checked,
      });
    },
    [classroomId, togglePublishMutation]
  );

  const handleDelete = useCallback(() => {
    deleteMutation.mutate(classroomId);
    setShowDeleteDialog(false);
  }, [classroomId, deleteMutation]);

  const handleDownload = useCallback(() => {
    if (syllabus) {
      downloadMutation.mutate({
        filePath: syllabus.file_url,
        fileName: syllabus.file_name,
      });
    }
  }, [syllabus, downloadMutation]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Syllabus File</CardTitle>
          <CardDescription>
            Upload a PDF or Word document for your course syllabus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!syllabus?.file_url ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary"
              }`}
            >
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Drag and drop your syllabus file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse (PDF, DOC, DOCX - Max 10MB)
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-8 w-8 text-primary mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{syllabus.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(syllabus.file_size)} • Uploaded{" "}
                      {new Date(syllabus.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {signedUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(signedUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-replace"
                />
                <label htmlFor="file-replace" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploadMutation.isPending}
                    asChild
                  >
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Replace File
                    </span>
                  </Button>
                </label>
              </div>

              {/* PDF Preview */}
              <div className="border rounded-lg overflow-hidden bg-muted">
                {isLoadingUrl ? (
                  <div className="w-full h-[500px] flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-12 w-12 animate-pulse mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading preview...</p>
                    </div>
                  </div>
                ) : signedUrl ? (
                  <>
                    {syllabus.mime_type === 'application/pdf' ? (
                      <>
                        <iframe
                          src={signedUrl}
                          className="w-full h-[500px]"
                          title="Syllabus Preview"
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
                      <div className="w-full h-[500px] flex items-center justify-center bg-muted">
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
                    {syllabus.mime_type === 'application/pdf' && !pdfLoadError && (
                      <Alert className="mt-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          If the preview doesn't display, try downloading the file or opening in a new tab.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <div className="w-full h-[500px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Preview not available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Weights Configuration */}
      <GradeWeightsForm
        initialWeights={syllabus?.grade_weights}
        onSave={handleSaveWeights}
        isSaving={updateWeightsMutation.isPending}
      />

      {/* Publish Controls */}
      {syllabus?.file_url && (
        <Card>
          <CardHeader>
            <CardTitle>Publish Status</CardTitle>
            <CardDescription>
              Control whether students can see the syllabus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">
                  {syllabus.is_posted ? "Syllabus is Published" : "Publish Syllabus"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {syllabus.is_posted 
                    ? "Students can currently view the syllabus" 
                    : "Make the syllabus visible to all students in this classroom"}
                </p>
              </div>
              <Button
                onClick={() => handleTogglePublish(!syllabus.is_posted)}
                disabled={togglePublishMutation.isPending}
                variant={syllabus.is_posted ? "outline" : "default"}
                className={syllabus.is_posted 
                  ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                  : "bg-primary hover:bg-primary/90"}
              >
                {syllabus.is_posted ? "Unpublish" : "Publish"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={syllabus.is_posted ? "default" : "secondary"}>
                {syllabus.is_posted ? "Published" : "Draft"}
              </Badge>
            </div>

            {!syllabus.is_posted && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Students cannot see the syllabus until it is published
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Syllabus?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the syllabus file and reset grade weights to
              default values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
