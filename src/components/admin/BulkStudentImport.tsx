import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, Users, AlertCircle, CheckCircle2, Loader2, FileUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface CSVRow {
  email?: string;
  student_id?: string;
  full_name: string;
  classroom_code?: string;
  grade?: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  failed: number;
  emailsQueued: number;
  errors: string[];
}

interface IssuedCredential {
  full_name: string;
  username: string;
  pin: string;
  classroom_code: string;
}

const CHUNK_SIZE = 100; // safe per-request size

export function BulkStudentImport() {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [credentials, setCredentials] = useState<IssuedCredential[]>([]);

  const downloadCredentials = () => {
    const header = "full_name,class_code,username,pin\n";
    const body = credentials
      .map((c) => `"${c.full_name}",${c.classroom_code},${c.username},${c.pin}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_sign_in_cards.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Sign-in cards downloaded — PINs are not shown again");
  };


  const downloadTemplate = () => {
    const template = `email,student_id,full_name,classroom_code,grade
student1@school.edu,,John Doe,ABC123,9
,12345678,Jane Smith,ABC123,9
student3@school.edu,,Mike Johnson,XYZ456,10`;
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
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, i) => { row[header] = values[i] || ''; });
      return row as CSVRow;
    });
  };

  const validateRow = (row: CSVRow, index: number): string | null => {
    if (!row.full_name || row.full_name.length < 2) {
      return `Row ${index + 2}: full_name required (min 2 chars)`;
    }
    const hasEmail = !!row.email && row.email.includes('@');
    const hasSid = !!row.student_id && /^\d{8}$/.test(row.student_id);
    if (!hasEmail && !hasSid) {
      return `Row ${index + 2}: provide either a valid email or an 8-digit student_id`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
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
    setProgress(0);
    setProgressLabel("Reading file...");

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      const errors: string[] = [];
      const validRows: CSVRow[] = [];
      rows.forEach((row, i) => {
        const err = validateRow(row, i);
        if (err) errors.push(err);
        else validRows.push(row);
      });

      if (validRows.length === 0) {
        setResult({ created: 0, skipped: 0, failed: errors.length, emailsQueued: 0, errors });
        return;
      }

      const totals = { created: 0, skipped: 0, failed: 0, emailsQueued: 0 };
      const allErrors: string[] = [...errors];
      const issued: IssuedCredential[] = [];

      const chunks: CSVRow[][] = [];
      for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
        chunks.push(validRows.slice(i, i + CHUNK_SIZE));
      }

      for (let c = 0; c < chunks.length; c++) {
        setProgressLabel(`Processing chunk ${c + 1} of ${chunks.length} (${chunks[c].length} students)...`);
        const { data, error } = await supabase.functions.invoke('bulk-create-students', {
          body: { students: chunks[c], sendOnboardingEmails: true },
        });

        if (error) {
          allErrors.push(`Chunk ${c + 1}: ${error.message}`);
          totals.failed += chunks[c].length;
        } else {
          totals.created += data?.successCount || 0;
          totals.skipped += data?.skippedCount || 0;
          totals.failed += data?.failedCount || 0;
          totals.emailsQueued += data?.emailsQueued || 0;
          const chunkErrors = (data?.results || [])
            .filter((r: any) => !r.success)
            .map((r: any) => `${r.identifier}: ${r.error}`);
          allErrors.push(...chunkErrors);

          // PINs are returned exactly once — capture them for the printout.
          (data?.results || [])
            .filter((r: any) => r.success && r.pin && r.username)
            .forEach((r: any, i: number) => {
              issued.push({
                full_name: r.full_name || r.identifier,
                username: r.username,
                pin: r.pin,
                classroom_code: chunks[c][i]?.classroom_code || '',
              });
            });
        }

        setProgress(Math.round(((c + 1) / chunks.length) * 100));
      }

      setCredentials(issued);
      setResult({ ...totals, errors: allErrors });

      if (totals.created > 0) {
        toast.success(`Imported ${totals.created} students (${totals.skipped} already existed)`);
      } else if (totals.skipped > 0) {
        toast.info(`No new students — ${totals.skipped} already existed`);
      }
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgressLabel("");
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
          Import hundreds of students from a CSV. Rows with an email get a setup email; rows with an 8-digit student_id are auto-confirmed for Student-ID sign-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Required:</strong> full_name + (email OR 8-digit student_id)<br />
            <strong>Optional:</strong> classroom_code, grade (1-12). Duplicates are skipped automatically.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Template
          </Button>

          {isMobile ? (
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
              {file && <p className="text-sm text-muted-foreground mt-2 truncate">Selected: {file.name}</p>}
            </div>
          ) : (
            <div className="flex-1">
              <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing} className="cursor-pointer" />
            </div>
          )}
        </div>

        {file && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <Button onClick={processImport} disabled={isProcessing} className="flex items-center gap-2">
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><Upload className="h-4 w-4" /> Import Students</>
              )}
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">{result.created}</p>
                      <p className="text-xs text-green-700">Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-blue-600">{result.skipped}</p>
                  <p className="text-xs text-blue-700">Already existed</p>
                </CardContent>
              </Card>
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-purple-600">{result.emailsQueued}</p>
                  <p className="text-xs text-purple-700">Setup emails queued</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-xs text-red-700">Failed</p>
                </CardContent>
              </Card>
            </div>

            {credentials.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-3">
                  <span>
                    <strong>{credentials.length} sign-in cards ready.</strong> PINs are shown
                    only once — download them now and hand them out. You can always reset a
                    PIN later from the class roster.
                  </span>
                  <Button onClick={downloadCredentials} className="w-fit flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download sign-in cards (CSV)
                  </Button>
                </AlertDescription>
              </Alert>
            )}


            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Errors ({result.errors.length}):</p>
                  <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.slice(0, 50).map((err, i) => (<li key={i}>• {err}</li>))}
                    {result.errors.length > 50 && <li>...and {result.errors.length - 50} more</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
