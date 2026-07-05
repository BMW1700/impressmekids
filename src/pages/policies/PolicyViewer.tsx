import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download } from "lucide-react";
import { PasswordMFAPolicy } from "./PasswordMFAPolicy";
import { AccessControlPolicy } from "./AccessControlPolicy";
import { IncidentResponsePolicy } from "./IncidentResponsePolicy";
import { ChangeManagementPolicy } from "./ChangeManagementPolicy";
import GoogleVertexSecurityControls from "./GoogleVertexSecurityControls";
import SystemDescription from "./SystemDescription";
import ControlMatrix from "./ControlMatrix";
import VendorManagementPolicy from "./VendorManagementPolicy";
import DataClassificationPolicy from "./DataClassificationPolicy";
import { BackupDisasterRecoveryPolicy } from "./BackupDisasterRecoveryPolicy";
import RiskRegister from "./RiskRegister";
import EvidenceLog from "./EvidenceLog";
import VendorRiskAssessment from "./VendorRiskAssessment";
import IncidentResponseTabletop from "./IncidentResponseTabletop";
import VPATCompliance from "./VPATCompliance";
import SecurityAwarenessTrainingPolicy from "./SecurityAwarenessTrainingPolicy";
import AcceptableUsePolicy from "./AcceptableUsePolicy";

type PolicyType = "password" | "access" | "incident" | "change" | "vertex" | "system" | "control-matrix" | "vendor" | "dataclass" | "backup" | "risk-register" | "evidence-log" | "vendor-assessment" | "ir-tabletop" | "vpat" | "security-training" | "acceptable-use" | "all";

export default function PolicyViewer() {
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType>("password");

  const handlePrint = () => {
    window.print();
  };

  const policies = {
    system: {
      name: "System Description Document",
      component: <SystemDescription />
    },
    "control-matrix": {
      name: "SOC 2 Control Matrix",
      component: <ControlMatrix />
    },
    "risk-register": {
      name: "Risk Register",
      component: <RiskRegister />
    },
    "evidence-log": {
      name: "Evidence Log",
      component: <EvidenceLog />
    },
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
    "ir-tabletop": {
      name: "Incident Response Tabletop Exercise",
      component: <IncidentResponseTabletop />
    },
    change: {
      name: "Change Management Policy",
      component: <ChangeManagementPolicy />
    },
    vertex: {
      name: "Google Vertex AI Security Controls",
      component: <GoogleVertexSecurityControls />
    },
    vendor: {
      name: "Vendor Management Policy",
      component: <VendorManagementPolicy />
    },
    "vendor-assessment": {
      name: "Vendor Risk Assessment Summary",
      component: <VendorRiskAssessment />
    },
    dataclass: {
      name: "Data Classification & Handling Policy",
      component: <DataClassificationPolicy />
    },
    backup: {
      name: "Backup & Disaster Recovery Policy",
      component: <BackupDisasterRecoveryPolicy />
    },
    vpat: {
      name: "VPAT® 2.5 Accessibility Compliance (WCAG 2.1 AA)",
      component: <VPATCompliance />
    },
    "security-training": {
      name: "Security Awareness Training Policy",
      component: <SecurityAwarenessTrainingPolicy />
    },
    "acceptable-use": {
      name: "Acceptable Use Policy",
      component: <AcceptableUsePolicy />
    },
    all: {
      name: "All Policies (Combined)",
      component: (
        <>
          <SystemDescription />
          <div className="page-break" />
          <ControlMatrix />
          <div className="page-break" />
          <RiskRegister />
          <div className="page-break" />
          <EvidenceLog />
          <div className="page-break" />
          <PasswordMFAPolicy />
          <div className="page-break" />
          <AccessControlPolicy />
          <div className="page-break" />
          <IncidentResponsePolicy />
          <div className="page-break" />
          <IncidentResponseTabletop />
          <div className="page-break" />
          <ChangeManagementPolicy />
          <div className="page-break" />
          <GoogleVertexSecurityControls />
          <div className="page-break" />
          <VendorManagementPolicy />
          <div className="page-break" />
          <VendorRiskAssessment />
          <div className="page-break" />
          <DataClassificationPolicy />
          <div className="page-break" />
          <BackupDisasterRecoveryPolicy />
          <div className="page-break" />
          <VPATCompliance />
          <div className="page-break" />
          <SecurityAwarenessTrainingPolicy />
          <div className="page-break" />
          <AcceptableUsePolicy />
        </>
      )
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Security & Compliance Policies — YubiLearn</title>
        <meta name="description" content="YubiLearn security, privacy, and compliance documentation: access control, incident response, vendor management, and data classification policies." />
        <link rel="canonical" href="https://yubilearn.com/policies" />
        <meta property="og:title" content="Security & Compliance Policies — YubiLearn" />
        <meta property="og:description" content="YubiLearn security, privacy, and compliance documentation." />
        <meta property="og:url" content="https://yubilearn.com/policies" />
        <meta property="og:type" content="website" />
      </Helmet>
      <style>{`
        @media print {
          @page {
            margin: 0.75in 0.75in 1in 0.75in;
            size: letter;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          
          .policy-header {
            position: running(header);
          }
          
          .policy-footer {
            position: fixed;
            bottom: 0.5in;
            left: 0.75in;
            right: 0.75in;
            font-size: 9pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          h1 { 
            font-size: 18pt; 
            margin-top: 0;
            page-break-after: avoid;
          }
          
          h2 { 
            font-size: 14pt; 
            margin-top: 16pt;
            page-break-after: avoid;
          }
          
          h3 { 
            font-size: 12pt; 
            margin-top: 12pt;
            page-break-after: avoid;
          }
          
          p, li {
            font-size: 10pt;
            line-height: 1.5;
            orphans: 3;
            widows: 3;
          }
          
          table {
            page-break-inside: avoid;
            font-size: 9pt;
          }
          
          .approval-page {
            page-break-before: always;
          }
        }
      `}</style>
      
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
                <SelectItem value="system">System Description Document</SelectItem>
                <SelectItem value="control-matrix">SOC 2 Control Matrix</SelectItem>
                <SelectItem value="risk-register">Risk Register</SelectItem>
                <SelectItem value="evidence-log">Evidence Log</SelectItem>
                <SelectItem value="password">Password and MFA Policy</SelectItem>
                <SelectItem value="access">Access Control Policy</SelectItem>
                <SelectItem value="incident">Incident Response Policy</SelectItem>
                <SelectItem value="ir-tabletop">Incident Response Tabletop Exercise</SelectItem>
                <SelectItem value="change">Change Management Policy</SelectItem>
                <SelectItem value="vertex">Google Vertex AI Security Controls</SelectItem>
                <SelectItem value="vendor">Vendor Management Policy</SelectItem>
                <SelectItem value="vendor-assessment">Vendor Risk Assessment Summary</SelectItem>
                <SelectItem value="dataclass">Data Classification &amp; Handling Policy</SelectItem>
                <SelectItem value="backup">Backup &amp; Disaster Recovery Policy</SelectItem>
                <SelectItem value="vpat">VPAT® 2.5 Accessibility Compliance (WCAG 2.1 AA)</SelectItem>
                <SelectItem value="security-training">Security Awareness Training Policy</SelectItem>
                <SelectItem value="acceptable-use">Acceptable Use Policy</SelectItem>
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
        <div className="bg-card print:bg-white print:shadow-none rounded-lg shadow-md p-8 print:p-12">
          {policies[selectedPolicy].component}
          
          {/* Approval & Attestation Page */}
          <div className="approval-page mt-16 print:mt-0">
            <h1 className="text-2xl font-bold mb-8 text-center">Policy Approval & Attestation</h1>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold mb-4">Policy Information</h2>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-semibold w-1/3">Policy Name:</td>
                      <td className="py-2">{policies[selectedPolicy].name}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Version:</td>
                      <td className="py-2">1.0</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Effective Date:</td>
                      <td className="py-2">{new Date().toLocaleDateString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-semibold">Next Review Date:</td>
                      <td className="py-2">{new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Approval Signatures</h2>
                <div className="space-y-6">
                  <div className="border-b pb-6">
                    <p className="font-semibold mb-2">Chief Executive Officer (CEO)</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Signature:</p>
                        <div className="border-b-2 border-gray-400 h-12"></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Date:</p>
                        <div className="border-b-2 border-gray-400 h-12"></div>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <p className="font-semibold mb-2">Chief Technology Officer (CTO) / Technical Lead</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Signature:</p>
                        <div className="border-b-2 border-gray-400 h-12"></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Date:</p>
                        <div className="border-b-2 border-gray-400 h-12"></div>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <p className="font-semibold mb-2">Security Lead / Information Security Officer</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Signature:</p>
                        <div className="border-b-2 border-gray-400 h-12"></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Date:</p>
                        <div className="border-b-2 border-gray-400 h-12"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">SOC 2 Control Mappings</h2>
                <p className="text-sm mb-4">This policy addresses the following SOC 2 Trust Service Criteria:</p>
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Control ID</th>
                      <th className="border p-2 text-left">Control Category</th>
                      <th className="border p-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">CC6.1</td>
                      <td className="border p-2">Logical and Physical Access</td>
                      <td className="border p-2">Restricts logical access to information assets</td>
                    </tr>
                    <tr>
                      <td className="border p-2">CC6.2</td>
                      <td className="border p-2">Access Control</td>
                      <td className="border p-2">Prior to issuing system credentials and granting system access</td>
                    </tr>
                    <tr>
                      <td className="border p-2">CC6.6</td>
                      <td className="border p-2">Audit Logging</td>
                      <td className="border p-2">Audit logging and monitoring of security events</td>
                    </tr>
                    <tr>
                      <td className="border p-2">CC7.2</td>
                      <td className="border p-2">Security Incidents</td>
                      <td className="border p-2">Detection and response to security incidents</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Attestation</h2>
                <p className="text-sm leading-relaxed">
                  I hereby attest that I have reviewed this policy and understand my responsibilities as outlined herein. 
                  I acknowledge that this policy has been approved by executive leadership and is effective as of the date specified above. 
                  I commit to adhering to the requirements set forth in this policy and understand that violations may result in 
                  disciplinary action up to and including termination of employment or access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer for print */}
      <div className="hidden print:block policy-footer">
        <div>
          <strong>YubiLearn</strong> | Confidential & Proprietary
        </div>
        <div>
          Document ID: IMK-POL-{selectedPolicy.toUpperCase()}-v1.0
        </div>
      </div>

      {/* Instructions (hidden in print) */}
      <div className="print:hidden container mx-auto px-4 pb-8">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-3 text-green-900 flex items-center gap-2">
            <span className="text-2xl">✓</span> Ready for Delve/Coalfire Audit!
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-green-900 font-medium">
            <li>Select which policy to export (or "All Policies" for combined)</li>
            <li>Click "Print to PDF" or press Ctrl+P (Windows) / Cmd+P (Mac)</li>
            <li>Choose "Save as PDF" as your destination</li>
            <li>Save with naming format: <code className="bg-green-100 px-2 py-0.5 rounded font-mono">IMK_[PolicyName]_v1.0.pdf</code></li>
            <li>Sign the approval page and re-scan/upload for final submission</li>
          </ol>
          <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
            <p className="text-sm font-semibold text-green-900">
              ✓ Includes: Document control, approval pages, SOC 2 mappings, page numbers, professional formatting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
