import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2, Mail, Phone, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RequestRestorationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (requestData: RestorationRequestData) => void;
  isSubmitting: boolean;
  backupName: string;
  backupId: string;
  recordCount: number;
  tables: string[];
}

export interface RestorationRequestData {
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  tables_requested: string[];
  school_name: string;
  contact_email: string;
  contact_phone: string;
}

export const RequestRestorationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  backupName,
  backupId,
  recordCount,
  tables,
}: RequestRestorationDialogProps) => {
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [selectedTables, setSelectedTables] = useState<string[]>(tables);
  const [schoolName, setSchoolName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [understood, setUnderstood] = useState(false);

  const handleConfirm = () => {
    if (reason.trim() && contactEmail.trim() && understood && selectedTables.length > 0) {
      onConfirm({
        reason: reason.trim(),
        urgency,
        tables_requested: selectedTables,
        school_name: schoolName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
      });
    }
  };

  const toggleTable = (table: string) => {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  const isValid = reason.trim().length >= 20 && contactEmail.trim() && understood && selectedTables.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Request Data Restoration
          </DialogTitle>
          <DialogDescription>
            Submit a restoration request to YubiLearn support team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              For security reasons, data restoration requires approval from YubiLearn. 
              Your request will be reviewed within 24-48 hours.
            </AlertDescription>
          </Alert>

          {/* Backup Info */}
          <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
            <div className="text-sm">
              <span className="font-medium">Backup:</span> {backupName}
            </div>
            <div className="text-sm">
              <span className="font-medium">Total Records:</span> {recordCount.toLocaleString()}
            </div>
          </div>

          {/* Reason (Required) */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Restoration <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need this data restored (minimum 20 characters)"
              rows={4}
              disabled={isSubmitting}
              className={reason.trim().length > 0 && reason.trim().length < 20 ? 'border-yellow-500' : ''}
            />
            <p className="text-xs text-muted-foreground">
              {reason.trim().length}/20 characters minimum
            </p>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label htmlFor="urgency">
              Urgency Level <span className="text-destructive">*</span>
            </Label>
            <Select value={urgency} onValueChange={(value: any) => setUrgency(value)} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Can wait 3-5 days</SelectItem>
                <SelectItem value="medium">Medium - Need within 48 hours</SelectItem>
                <SelectItem value="high">High - Need within 24 hours</SelectItem>
                <SelectItem value="critical">Critical - Urgent (same day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table Selection */}
          <div className="space-y-2">
            <Label>Select Tables to Restore:</Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {tables.map(table => (
                <div key={table} className="flex items-center space-x-2">
                  <Checkbox
                    id={`table-${table}`}
                    checked={selectedTables.includes(table)}
                    onCheckedChange={() => toggleTable(table)}
                    disabled={isSubmitting}
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

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Contact Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="school">School/District Name (Optional)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="school"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Lincoln Elementary School"
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Contact Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="admin@school.edu"
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="understand"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
              disabled={isSubmitting}
            />
            <label
              htmlFor="understand"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand this request will be reviewed by YubiLearn support team
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
