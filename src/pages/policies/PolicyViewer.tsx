import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download } from "lucide-react";
import { PasswordMFAPolicy } from "./PasswordMFAPolicy";
import { AccessControlPolicy } from "./AccessControlPolicy";
import { IncidentResponsePolicy } from "./IncidentResponsePolicy";
import { ChangeManagementPolicy } from "./ChangeManagementPolicy";

type PolicyType = "password" | "access" | "incident" | "change" | "all";

export default function PolicyViewer() {
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType>("password");

  const handlePrint = () => {
    window.print();
  };

  const policies = {
    password: {
      name: "Password and MFA Policy",
      component: <PasswordMFAPolicy />
    },
    access: {
      name: "Access Control Policy",
      component: <AccessControlPolicy />
    },
    incident: {
      name: "Incident Response Policy",
      component: <IncidentResponsePolicy />
    },
    change: {
      name: "Change Management Policy",
      component: <ChangeManagementPolicy />
    },
    all: {
      name: "All Policies (Combined)",
      component: (
        <>
          <PasswordMFAPolicy />
          <div className="page-break" />
          <AccessControlPolicy />
          <div className="page-break" />
          <IncidentResponsePolicy />
          <div className="page-break" />
          <ChangeManagementPolicy />
        </>
      )
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar (hidden in print) */}
      <div className="print:hidden sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-bold text-foreground">SOC 2 Security Policies</h1>
            <Select value={selectedPolicy} onValueChange={(value) => setSelectedPolicy(value as PolicyType)}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="password">Password and MFA Policy</SelectItem>
                <SelectItem value="access">Access Control Policy</SelectItem>
                <SelectItem value="incident">Incident Response Policy</SelectItem>
                <SelectItem value="change">Change Management Policy</SelectItem>
                <SelectItem value="all">All Policies (Combined)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="default">
              <Printer className="mr-2 h-4 w-4" />
              Print to PDF
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Policy Content */}
      <div className="container mx-auto px-4 py-8 print:px-0 print:py-0">
        <div className="bg-card print:bg-white print:shadow-none rounded-lg shadow-md p-8 print:p-0">
          {policies[selectedPolicy].component}
        </div>
      </div>

      {/* Instructions (hidden in print) */}
      <div className="print:hidden container mx-auto px-4 pb-8">
        <div className="bg-muted/50 rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold mb-3 text-foreground">How to Export as PDF</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Select the policy you want to export from the dropdown above (or select "All Policies" for a combined document)</li>
            <li>Click "Print to PDF" button (or use Ctrl+P / Cmd+P)</li>
            <li>In the print dialog, select "Save as PDF" as the printer destination</li>
            <li>Choose your save location and filename (e.g., <code className="bg-muted px-1.5 py-0.5 rounded">IMK_Password_MFA_Policy_v1.0.pdf</code>)</li>
            <li>Click "Save" to generate the PDF file</li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            <strong>Tip:</strong> The exported PDF will include professional formatting with page breaks, headers, and company branding suitable for SOC 2 audit submission.
          </p>
        </div>
      </div>
    </div>
  );
}
