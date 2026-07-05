import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export default function EvidenceLog() {
  const evidence = [
    {
      controlId: "CC1.1",
      controlName: "Control Environment - Integrity and Ethics",
      trustCriteria: "Common Criteria",
      evidenceType: "Policy Documentation",
      evidenceArtifacts: [
        "Access Control Policy",
        "Incident Response Policy",
        "Data Classification Policy",
        "Vendor Management Policy",
        "Security Awareness Training Policy",
        "Acceptable Use Policy"
      ],
      status: "collected",
      location: "Policy Repository (/policies)",
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: "All policies documented and accessible including new security training and acceptable use policies"
    },
    {
      controlId: "CC2.1",
      controlName: "Communication and Information - Internal",
      trustCriteria: "Common Criteria",
      evidenceType: "System Documentation",
      evidenceArtifacts: [
        "System Description Document",
        "Architecture Diagrams",
        "Data Flow Diagrams"
      ],
      status: "collected",
      location: "Documentation Repository",
      lastUpdated: "2025-01-19",
      notes: "Comprehensive system documentation"
    },
    {
      controlId: "CC3.1",
      controlName: "Risk Assessment Process",
      trustCriteria: "Common Criteria",
      evidenceType: "Risk Management",
      evidenceArtifacts: [
        "Risk Register",
        "Threat Model Documentation",
        "Security Scan Results"
      ],
      status: "collected",
      location: "Security Documentation",
      lastUpdated: "2025-01-19",
      notes: "Risk register created, quarterly review scheduled"
    },
    {
      controlId: "CC5.1",
      controlName: "Logical Access - Identification and Authentication",
      trustCriteria: "Common Criteria",
      evidenceType: "Technical Implementation",
      evidenceArtifacts: [
        "Authentication flow screenshots",
        "Email verification code",
        "Leaked password protection config",
        "Session management implementation"
      ],
      status: "collected",
      location: "Codebase + Screenshots",
      lastUpdated: "2025-01-18",
      notes: "Auth system fully implemented with HaveIBeenPwned integration"
    },
    {
      controlId: "CC5.2",
      controlName: "Logical Access - Authorization",
      trustCriteria: "Common Criteria",
      evidenceType: "Technical Implementation",
      evidenceArtifacts: [
        "RLS policies (all tables)",
        "RBAC implementation code",
        "Server-side role validation",
        "Access control matrix"
      ],
      status: "collected",
      location: "Database + Codebase",
      lastUpdated: "2025-01-18",
      notes: "RLS enabled on all tables, zero RLS warnings"
    },
    {
      controlId: "CC6.1",
      controlName: "Logical and Physical Access Controls",
      trustCriteria: "Common Criteria",
      evidenceType: "Technical Configuration",
      evidenceArtifacts: [
        "RLS policy definitions",
        "Audit log implementation",
        "Access control tests"
      ],
      status: "collected",
      location: "Database Schema + Code",
      lastUpdated: "2025-01-18",
      notes: "Comprehensive access controls implemented"
    },
    {
      controlId: "CC6.6",
      controlName: "Logical and Physical Access - Encryption",
      trustCriteria: "Common Criteria",
      evidenceType: "Technical Configuration",
      evidenceArtifacts: [
        "TLS configuration (HTTPS)",
        "Database encryption at rest (Supabase)",
        "Backup encryption config (AES-256-GCM)",
        "Google Cloud encryption documentation"
      ],
      status: "collected",
      location: "Infrastructure Configuration",
      lastUpdated: "2025-01-18",
      notes: "Encryption in transit and at rest verified"
    },
    {
      controlId: "CC7.1",
      controlName: "System Operations - Detection",
      trustCriteria: "Common Criteria",
      evidenceType: "Monitoring Configuration",
      evidenceArtifacts: [
        "Security linter results (clean scan)",
        "Audit log tables",
        "Failed login tracking"
      ],
      status: "collected",
      location: "Security Tooling + Database",
      lastUpdated: "2025-01-18",
      notes: "Automated detection mechanisms in place"
    },
    {
      controlId: "CC7.2",
      controlName: "System Operations - Monitoring",
      trustCriteria: "Common Criteria",
      evidenceType: "Logging Implementation",
      evidenceArtifacts: [
        "Audit log schema",
        "Access log implementation (aura_access_log)",
        "Immutable audit trail code"
      ],
      status: "collected",
      location: "Database + Codebase",
      lastUpdated: "2025-01-18",
      notes: "Comprehensive audit logging implemented"
    },
    {
      controlId: "CC7.3",
      controlName: "System Operations - Incident Response",
      trustCriteria: "Common Criteria",
      evidenceType: "Policy + Exercise",
      evidenceArtifacts: [
        "Incident Response Policy",
        "IR Tabletop Exercise Log",
        "Escalation procedures"
      ],
      status: "collected",
      location: "Policy Repository",
      lastUpdated: "2025-01-19",
      notes: "IR policy documented, tabletop exercise conducted"
    },
    {
      controlId: "CC8.1",
      controlName: "Change Management",
      trustCriteria: "Common Criteria",
      evidenceType: "Policy Documentation",
      evidenceArtifacts: [
        "Change Management Policy",
        "Git commit history",
        "Database migration logs"
      ],
      status: "collected",
      location: "Policy Repository + Git",
      lastUpdated: "2025-01-19",
      notes: "Change management process documented"
    },
    {
      controlId: "CC9.1",
      controlName: "Vendor Management",
      trustCriteria: "Common Criteria",
      evidenceType: "Vendor Documentation",
      evidenceArtifacts: [
        "Vendor Management Policy",
        "Vendor Risk Assessment Summary",
        "Critical vendor profiles"
      ],
      status: "collected",
      location: "Policy Repository",
      lastUpdated: "2025-01-19",
      notes: "Vendor assessment documented"
    },
    {
      controlId: "CC9.2",
      controlName: "Vendor SOC 2 Reports",
      trustCriteria: "Common Criteria",
      evidenceType: "External Attestations",
      evidenceArtifacts: [
        "Google Cloud SOC 2 Type 2 report (pending collection)",
        "Supabase SOC 2 Type 2 report (pending collection)",
        "Vertex AI compliance documentation (pending collection)"
      ],
      status: "partial",
      location: "Vendor Documents (to be collected)",
      lastUpdated: "2025-01-19",
      notes: "Request sent to vendors for SOC 2 reports"
    },
    {
      controlId: "PI1.1",
      controlName: "Privacy Notice",
      trustCriteria: "Privacy",
      evidenceType: "Legal Documentation",
      evidenceArtifacts: [
        "Privacy Policy",
        "Terms of Service",
        "FERPA/COPPA compliance documentation"
      ],
      status: "collected",
      location: "Legal Repository",
      lastUpdated: "2025-01-18",
      notes: "Privacy notices published and accessible"
    },
    {
      controlId: "PI1.2",
      controlName: "Consent Management",
      trustCriteria: "Privacy",
      evidenceType: "Technical Implementation",
      evidenceArtifacts: [
        "Parent consent table (parent_consents)",
        "Consent verification code",
        "AURA access consent logic"
      ],
      status: "collected",
      location: "Database + Codebase",
      lastUpdated: "2025-01-18",
      notes: "Consent-based access system implemented"
    },
    {
      controlId: "A1.1",
      controlName: "Backup and Recovery",
      trustCriteria: "Availability",
      evidenceType: "Technical Configuration",
      evidenceArtifacts: [
        "Backup policy documentation",
        "Automated backup scripts (Edge Functions)",
        "S3 backup storage configuration",
        "Backup health check results"
      ],
      status: "collected",
      location: "Infrastructure + Documentation",
      lastUpdated: "2025-01-18",
      notes: "Automated daily backups to S3, 180-day retention"
    },
    {
      controlId: "A1.2",
      controlName: "Disaster Recovery Plan",
      trustCriteria: "Availability",
      evidenceType: "Policy Documentation",
      evidenceArtifacts: [
        "Backup & Disaster Recovery Policy",
        "Data restoration procedures",
        "RTO/RPO documentation"
      ],
      status: "collected",
      location: "Policy Repository",
      lastUpdated: "2025-01-19",
      notes: "DR policy documented with defined RTO/RPO"
    },
    {
      controlId: "C1.1",
      controlName: "Confidentiality Agreements",
      trustCriteria: "Confidentiality",
      evidenceType: "Legal Documentation",
      evidenceArtifacts: [
        "Data Processing Agreements (to be collected)",
        "Vendor NDAs (to be collected)",
        "Employee confidentiality agreements (to be implemented)"
      ],
      status: "partial",
      location: "Legal Repository",
      lastUpdated: "2025-01-19",
      notes: "DPAs and NDAs to be collected from vendors"
    },
    {
      controlId: "P1.1",
      controlName: "Processing Integrity - Input Validation",
      trustCriteria: "Processing Integrity",
      evidenceType: "Technical Implementation",
      evidenceArtifacts: [
        "Input validation code",
        "SQL injection prevention (Supabase)",
        "XSS protection implementation"
      ],
      status: "collected",
      location: "Codebase",
      lastUpdated: "2025-01-18",
      notes: "Input validation implemented across application"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "collected":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "missing":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "collected":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">✅ Collected</Badge>;
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">⚠️ Partial</Badge>;
      case "missing":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">❌ Missing</Badge>;
      default:
        return null;
    }
  };

  const collectedCount = evidence.filter(e => e.status === "collected").length;
  const partialCount = evidence.filter(e => e.status === "partial").length;
  const missingCount = evidence.filter(e => e.status === "missing").length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-foreground">Evidence Log</h1>
            <Badge variant="outline" className="text-lg px-4 py-2">
              SOC 2 Type 1 Preparation
            </Badge>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Version: 1.0</span>
            <span>•</span>
            <span>Last Updated: {new Date().toLocaleDateString()}</span>
            <span>•</span>
            <span>Document Owner: Security Officer</span>
          </div>
        </div>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Evidence Collection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{evidence.length}</p>
                <p className="text-sm text-muted-foreground">Total Controls</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600">{collectedCount}</p>
                <p className="text-sm text-muted-foreground">Evidence Collected</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-yellow-600">{partialCount}</p>
                <p className="text-sm text-muted-foreground">Partial Evidence</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-red-600">{missingCount}</p>
                <p className="text-sm text-muted-foreground">Missing Evidence</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold text-foreground mb-2">Completion Status:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-green-600 h-full transition-all duration-500"
                    style={{ width: `${(collectedCount / evidence.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {Math.round((collectedCount / evidence.length) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Control Evidence Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {evidence.map((item, index) => (
                <div key={index} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <Badge variant="outline">{item.controlId}</Badge>
                        <Badge variant="secondary">{item.trustCriteria}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{item.controlName}</h3>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Evidence Type:</p>
                      <p className="text-sm text-muted-foreground">{item.evidenceType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Location:</p>
                      <p className="text-sm text-muted-foreground">{item.location}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-foreground mb-2">Evidence Artifacts:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      {item.evidenceArtifacts.map((artifact, idx) => (
                        <li key={idx}>{artifact}</li>
                      ))}
                    </ul>
                  </div>

                  {item.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Notes:</span> {item.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 text-sm text-muted-foreground">
                    <span className="font-semibold">Last Updated:</span> {item.lastUpdated}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Evidence Collection Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Collect Vendor SOC 2 Reports</p>
                  <p className="text-sm text-muted-foreground">Request and collect SOC 2 Type 2 reports from Google Cloud, Supabase, and other critical vendors.</p>
                  <p className="text-sm text-muted-foreground mt-1"><strong>Target:</strong> Within 30 days</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Finalize Data Processing Agreements</p>
                  <p className="text-sm text-muted-foreground">Collect executed DPAs and NDAs from all vendors processing student data.</p>
                  <p className="text-sm text-muted-foreground mt-1"><strong>Target:</strong> Within 30 days</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Technical Controls Documentation Complete</p>
                  <p className="text-sm text-muted-foreground">All technical security controls have been implemented and documented with code artifacts.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
          <p><strong>Classification:</strong> Confidential - Internal Use Only</p>
          <p><strong>Document Control:</strong> This evidence log is maintained continuously and reviewed monthly.</p>
          <p><strong>Contact:</strong> security@yubilearn.com</p>
        </div>
      </div>
    </div>
  );
}
