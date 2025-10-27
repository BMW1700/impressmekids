import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RestoreConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedTables: string[]) => void;
  isRestoring: boolean;
  backupName: string;
  recordCount: number;
  tables: string[];
}

export const RestoreConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isRestoring,
  backupName,
  recordCount,
  tables,
}: RestoreConfirmationDialogProps) => {
  const [selectedTables, setSelectedTables] = useState<string[]>(tables);
  const [understood, setUnderstood] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = () => {
    if (confirmText === "RESTORE" && understood && selectedTables.length > 0) {
      onConfirm(selectedTables);
    }
  };

  const toggleTable = (table: string) => {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  const isValid = confirmText === "RESTORE" && understood && selectedTables.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Restore Backup - Destructive Action
          </DialogTitle>
          <DialogDescription>
            This will overwrite existing data in your database. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Backup Info */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Restoring this backup will insert {recordCount} records 
              into your database. Existing records with the same IDs will be skipped.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border p-4 space-y-2">
            <div className="text-sm">
              <span className="font-medium">Backup:</span> {backupName}
            </div>
            <div className="text-sm">
              <span className="font-medium">Total Records:</span> {recordCount}
            </div>
            <div className="text-sm">
              <span className="font-medium">Tables:</span> {tables.length}
            </div>
          </div>

          {/* Table Selection */}
          <div className="space-y-2">
            <Label>Select tables to restore:</Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {tables.map(table => (
                <div key={table} className="flex items-center space-x-2">
                  <Checkbox
                    id={`table-${table}`}
                    checked={selectedTables.includes(table)}
                    onCheckedChange={() => toggleTable(table)}
                    disabled={isRestoring}
                  />
                  <label
                    htmlFor={`table-${table}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {table}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="understand"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
              disabled={isRestoring}
            />
            <label
              htmlFor="understand"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand this will overwrite existing data
            </label>
          </div>

          {/* Type to Confirm */}
          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Type <code className="bg-muted px-1 py-0.5 rounded">RESTORE</code> to confirm:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESTORE"
              disabled={isRestoring}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRestoring}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isRestoring}
          >
            {isRestoring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              "Restore Backup"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
