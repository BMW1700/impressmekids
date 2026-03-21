import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Shield } from "lucide-react";

export default function VendorRiskAssessment() {
  const vendors = [
    {
      name: "Google Cloud Platform (GCP)",
      category: "Critical Infrastructure",
      servicesUsed: [
        "Compute Engine (via Supabase)",
        "Cloud Storage",
        "Cloud SQL (via Supabase)",
        "Networking Infrastructure"
      ],
      dataProcessed: [
        "All student PII",
        "AURA voice recordings",
        "Assignment submissions",
        "User authentication data",
        "Application logs"
      ],
      soc2Status: "SOC 2 Type 2 Certified",
      soc2ReportDate: "2024-Q3 (pending collection)",
      otherCompliance: ["ISO 27001", "GDPR", "FERPA-compliant infrastructure"],
      riskLevel: "Low",
      mitigatingControls: [
        "Leverages GCP's SOC 2 certified infrastructure",
        "Data encrypted at rest and in transit",
        "Multi-region redundancy",
        "99.95% SLA",
        "DPA executed with Google Cloud",
        "Access controlled via IAM policies"
      ],
      contractStatus: "Active DPA",
      lastReview: "2025-01-15",
      nextReview: "2025-04-15",
      keyContacts: "GCP Enterprise Support",
      notes: "Primary infrastructure provider. All data stored on GCP infrastructure via Supabase. SOC 2 Type 2 report to be collected for audit evidence."
    },
    {
      name: "Supabase / Lovable Cloud",
      category: "Critical Infrastructure",
      servicesUsed: [
        "PostgreSQL Database",
        "Authentication (Supabase Auth)",
        "File Storage (Supabase Storage)",
        "Edge Functions",
        "Realtime subscriptions"
      ],
      dataProcessed: [
        "All student PII",
        "AURA voice recordings (audio files)",
        "Assignment data",
        "User credentials",
        "Classroom data",
        "Parent consent records"
      ],
      soc2Status: "SOC 2 Type 2 Certified",
      soc2ReportDate: "2024-Q4 (pending collection)",
      otherCompliance: ["ISO 27001", "GDPR", "HIPAA-ready"],
      riskLevel: "Low",
      mitigatingControls: [
        "SOC 2 Type 2 certified platform",
        "Row-Level Security (RLS) enforced on all tables",
        "Immutable audit logs",
        "Automated backups (daily to S3)",
        "AES-256 encryption at rest",
        "TLS 1.3 encryption in transit",
        "Built on GCP infrastructure"
      ],
      contractStatus: "Active via Lovable Cloud",
      lastReview: "2025-01-15",
      nextReview: "2025-04-15",
      keyContacts: "Lovable Cloud Support",
      notes: "Primary database and backend provider. All security controls implemented at application level (RLS, audit logs, consent verification). SOC 2 report to be collected."
    },
    {
      name: "Google Vertex AI",
      category: "Critical AI/ML",
      servicesUsed: [
        "Speech-to-Text API",
        "Text Analysis",
        "Machine Learning APIs"
      ],
      dataProcessed: [
        "Student voice recordings (AURA)",
        "Transcribed text",
        "Reading comprehension submissions",
        "Audio analysis metadata"
      ],
      soc2Status: "Part of GCP SOC 2 Certification",
      soc2ReportDate: "Covered by GCP SOC 2 report",
      otherCompliance: ["ISO 27001", "GDPR", "FERPA-compliant"],
      riskLevel: "Low",
      mitigatingControls: [
        "Google Cloud AI security controls",
        "Data residency controls (US regions only)",
        "VPC Service Controls isolate data",
        "IAM policies restrict access",
        "No model training on student data",
        "Transient processing (no long-term storage)",
        "Encrypted API calls (TLS 1.3)"
      ],
      contractStatus: "Active via GCP DPA",
      lastReview: "2025-01-15",
      nextReview: "2025-04-15",
      keyContacts: "GCP AI/ML Support",
      notes: "Used exclusively for AURA speech analysis. Student data is processed transiently and not retained by Google. Covered under GCP's SOC 2 certification."
    },
    {
      name: "Resend",
      category: "Medium Risk",
      servicesUsed: [
        "Transactional Email Service"
      ],
      dataProcessed: [
        "User email addresses",
        "Email notification content",
        "Assignment notifications",
        "Calendar event reminders"
      ],
      soc2Status: "SOC 2 Type 2 Certified",
      soc2ReportDate: "2024-Q3 (pending collection)",
      otherCompliance: ["GDPR"],
      riskLevel: "Low",
      mitigatingControls: [
        "SOC 2 Type 2 certified email provider",
        "TLS encryption in transit",
        "No sensitive PII in email content",
        "Email addresses only (no SSN, biometrics, etc.)",
        "DMARC/SPF/DKIM configured",
        "Rate limiting enabled"
      ],
      contractStatus: "Active",
      lastReview: "2025-01-15",
      nextReview: "2025-04-15",
      keyContacts: "support@resend.com",
      notes: "Used only for transactional emails (notifications, calendar reminders). No sensitive student data transmitted via email. SOC 2 report to be collected."
    },
    {
      name: "Amazon Web Services (S3)",
      category: "Critical Backup Storage",
      servicesUsed: [
        "S3 Cold Storage (Glacier)"
      ],
      dataProcessed: [
        "Encrypted database backups",
        "Long-term data retention"
      ],
      soc2Status: "SOC 2 Type 2 Certified",
      soc2ReportDate: "2024-Q4 (pending collection)",
      otherCompliance: ["ISO 27001", "GDPR", "FERPA-compliant"],
      riskLevel: "Low",
      mitigatingControls: [
        "SOC 2 Type 2 certified infrastructure",
        "AES-256-GCM encryption at rest",
        "S3 bucket policies restrict access",
        "IAM roles with least privilege",
        "Versioning enabled",
        "MFA delete protection",
        "180-day retention policy"
      ],
      contractStatus: "Active via AWS",
      lastReview: "2025-01-15",
      nextReview: "2025-04-15",
      keyContacts: "AWS Enterprise Support",
      notes: "Used exclusively for encrypted cold storage backups. All backups encrypted with AES-256-GCM before upload. SOC 2 report to be collected."
    }
  ];

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "Low":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Low Risk</Badge>;
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Medium Risk</Badge>;
      case "High":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">High Risk</Badge>;
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    if (category.includes("Critical")) {
      return <Badge variant="destructive">Critical</Badge>;
    }
    return <Badge variant="secondary">{category}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-foreground">Vendor Risk Assessment Summary</h1>
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

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This Vendor Risk Assessment evaluates all third-party vendors that process, store, or transmit 
              data for NabuLearn. All critical vendors are SOC 2 Type 2 certified, significantly reducing 
              our vendor risk exposure.
            </p>
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{vendors.length}</p>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600">{vendors.filter(v => v.soc2Status.includes("SOC 2")).length}</p>
                <p className="text-sm text-muted-foreground">SOC 2 Certified</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600">{vendors.filter(v => v.riskLevel === "Low").length}</p>
                <p className="text-sm text-muted-foreground">Low Risk</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-red-600">0</p>
                <p className="text-sm text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle>Key Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">100% SOC 2 Certified Vendors</p>
                  <p className="text-sm text-muted-foreground">All vendors processing student data are SOC 2 Type 2 certified.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Strong Infrastructure Security</p>
                  <p className="text-sm text-muted-foreground">Built on enterprise-grade infrastructure (GCP, Supabase) with proven security controls.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">SOC 2 Reports Pending Collection</p>
                  <p className="text-sm text-muted-foreground">Vendor SOC 2 attestation reports need to be collected for audit evidence.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Profiles */}
        {vendors.map((vendor, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle>{vendor.name}</CardTitle>
                  <div className="flex gap-2">
                    {getCategoryBadge(vendor.category)}
                    {getRiskBadge(vendor.riskLevel)}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                    {vendor.soc2Status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{vendor.soc2ReportDate}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Services Used */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Services Used:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  {vendor.servicesUsed.map((service, idx) => (
                    <li key={idx}>{service}</li>
                  ))}
                </ul>
              </div>

              {/* Data Processed */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Data Processed:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  {vendor.dataProcessed.map((data, idx) => (
                    <li key={idx}>{data}</li>
                  ))}
                </ul>
              </div>

              {/* Compliance */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Additional Compliance:</h4>
                <div className="flex gap-2 flex-wrap">
                  {vendor.otherCompliance.map((comp, idx) => (
                    <Badge key={idx} variant="secondary">{comp}</Badge>
                  ))}
                </div>
              </div>

              {/* Mitigating Controls */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Mitigating Controls:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  {vendor.mitigatingControls.map((control, idx) => (
                    <li key={idx}>{control}</li>
                  ))}
                </ul>
              </div>

              {/* Contract & Review Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-semibold text-foreground">Contract Status</p>
                  <p className="text-sm text-muted-foreground">{vendor.contractStatus}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Last Review</p>
                  <p className="text-sm text-muted-foreground">{vendor.lastReview}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Next Review</p>
                  <p className="text-sm text-muted-foreground">{vendor.nextReview}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Key Contact</p>
                  <p className="text-sm text-muted-foreground">{vendor.keyContacts}</p>
                </div>
              </div>

              {/* Notes */}
              {vendor.notes && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Notes:</span> {vendor.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Required Actions for SOC 2 Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Collect SOC 2 Type 2 Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Request and collect attestation reports from: Google Cloud Platform, Supabase, Resend, AWS S3.
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-2">Target: Within 30 days</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Execute Data Processing Agreements</p>
                  <p className="text-sm text-muted-foreground">
                    Collect signed DPAs from all vendors processing student data (if not already in place).
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-2">Target: Within 30 days</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Schedule Quarterly Vendor Reviews</p>
                  <p className="text-sm text-muted-foreground">
                    Set up recurring reviews (Q2 2025) for all critical vendors to assess ongoing compliance.
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-2">Target: Q2 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
          <p><strong>Classification:</strong> Confidential - Internal Use Only</p>
          <p><strong>Document Control:</strong> This vendor assessment is reviewed quarterly or when vendor changes occur.</p>
          <p><strong>Contact:</strong> security@nabulearn.com</p>
        </div>
      </div>
    </div>
  );
}
