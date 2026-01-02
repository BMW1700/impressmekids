import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, Users, AlertCircle, CheckCircle2, Loader2, FileUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface CSVRow {
  email: string;
  full_name: string;
  classroom_code?: string;
  grade?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function BulkStudentImport() {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const template = `email,full_name,classroom_code,grade
student1@school.edu,John Doe,ABC123,9
student2@school.edu,Jane Smith,ABC123,9
student3@school.edu,Mike Johnson,XYZ456,10`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Template downloaded");
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row as CSVRow;
    });
  };

  const validateRow = (row: CSVRow, index: number): string | null => {
    if (!row.email || !row.email.includes('@')) {
      return `Row ${index + 2}: Invalid email format`;
    }
    if (!row.full_name || row.full_name.length < 2) {
      return `Row ${index + 2}: Full name is required (minimum 2 characters)`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const processImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      const errors: string[] = [];
      const validRows: CSVRow[] = [];

      // Validate all rows first
      rows.forEach((row, index) => {
        const error = validateRow(row, index);
        if (error) {
          errors.push(error);
        } else {
          validRows.push(row);
        }
      });

      let successCount = 0;
      let failCount = 0;

      // Process valid rows
      for (const row of validRows) {
        try {
          // Generate random password (school will use password reset)
          const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
          
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: row.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: row.full_name,
              role: 'student',
            }
          });

          if (authError) {
            errors.push(`${row.email}: ${authError.message}`);
            failCount++;
            continue;
          }

          // Join classroom if code provided
          if (row.classroom_code && authData.user) {
            const { data: classroom } = await supabase
              .from('classrooms')
              .select('id')
              .eq('join_code', row.classroom_code.toUpperCase())
              .single();

            if (classroom) {
              await supabase
                .from('classroom_students')
                .insert({
                  classroom_id: classroom.id,
                  student_id: authData.user.id
                });
            }
          }

          // Update grade if provided
          if (row.grade && authData.user) {
            await supabase
              .from('public_profiles')
              .update({ grade: parseInt(row.grade) })
              .eq('id', authData.user.id);
          }

          successCount++;
        } catch (error: any) {
          errors.push(`${row.email}: ${error.message}`);
          failCount++;
        }
      }

      setResult({
        success: successCount,
        failed: failCount + errors.length,
        errors
      });

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} students`);
      }
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Student Import
        </CardTitle>
        <CardDescription>
          Import multiple students at once using a CSV file. Students will receive email instructions to set their password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Required columns:</strong> email, full_name<br />
            <strong>Optional columns:</strong> classroom_code, grade (9-12)
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>

          {isMobile ? (
            /* Mobile: Custom styled button */
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full flex items-center gap-2"
              >
                <FileUp className="h-4 w-4" />
                Choose File
              </Button>
              {file && (
                <p className="text-sm text-muted-foreground mt-2 truncate">
                  Selected: {file.name}
                </p>
              )}
            </div>
          ) : (
            /* Desktop: Standard file input */
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="cursor-pointer"
              />
            </div>
          )}
        </div>

        {file && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <Button
              onClick={processImport}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Students
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">{result.success}</p>
                      <p className="text-sm text-green-600">Successful</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                      <p className="text-sm text-red-600">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Import Errors:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {result.errors.slice(0, 10).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>... and {result.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Students will need to use the "Forgot Password" feature on the login page to set their own password before first sign-in.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
