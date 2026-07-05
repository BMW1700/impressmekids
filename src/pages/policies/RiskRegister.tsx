import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function RiskRegister() {
  const risks = [
    {
      id: "RISK-001",
      category: "Data Security",
      risk: "Unauthorized Access to Student PII",
      likelihood: "Low",
      impact: "Critical",
      inherentRisk: "High",
      controls: ["RLS on all tables", "Row-level security policies", "Audit logging", "Role-based access control"],
      residualRisk: "Low",
      owner: "Security Officer",
      reviewDate: "2025-03-01"
    },
    {
      id: "RISK-002",
      category: "Vendor Management",
      risk: "Third-Party Vendor Data Breach",
      likelihood: "Low",
      impact: "High",
      inherentRisk: "Medium",
      controls: ["SOC 2 Type 2 certified vendors only", "DPA agreements", "Vendor security reviews", "Data encryption in transit/at rest"],
      residualRisk: "Low",
      owner: "CTO",
      reviewDate: "2025-03-01"
    },
    {
      id: "RISK-003",
      category: "Authentication",
      risk: "Account Takeover via Compromised Credentials",
      likelihood: "Low",
      impact: "High",
      inherentRisk: "Medium",
      controls: ["Leaked password protection (HaveIBeenPwned)", "Email verification required", "Session management", "Password strength requirements"],
      residualRisk: "Low",
      owner: "Engineering Lead",
      reviewDate: "2025-03-01"
    },
    {
      id: "RISK-004",
      category: "Authorization",
      risk: "Privilege Escalation / Unauthorized Role Assignment",
      likelihood: "Very Low",
      impact: "Critical",
      inherentRisk: "High",
      controls: ["Server-side role validation", "Admin-only role assignment", "Teacher verification system", "Parent access approval workflow"],
      residualRisk: "Very Low",
      owner: "Security Officer",
      reviewDate: "2025-03-01"
    },
    {
      id: "RISK-005",
      category: "Data Privacy",
      risk: "Non-Compliant Access to AURA Voice Recordings",
      likelihood: "Very Low",
      impact: "High",
      inherentRisk: "Medium",
      controls: ["Consent-based access system", "Parent consent verification", "Audit logging of all access", "Signed URLs with expiration"],
      residualRisk: "Very Low",
      owner: "Privacy Officer",
      reviewDate: "2025-03-01"
    },
    {
      id: "RISK-006",
      category: "Business Continuity",
      risk: "Data Loss Due to System Failure",
      likelihood: "Low",
      impact: "High",
      inherentRisk: "Medium",
      controls: ["Automated daily backups to AWS S3", "180-day retention policy", "AES-256-GCM encryption", "Daily backup health checks", "Multi-party restoration approval"],
      residualRisk: "Very Low",
      owner: "Infrastructure Lead",
      reviewDate: "2025-03-01"
    },
    {
      id: "RISK-007",
      category: "Compliance",
      risk: "FERPA/COPPA Violation",
      likelihood: "Very Low",
      impact: "Critical",
      inherentRisk: "High",
      controls: ["Parent consent verification", "Data minimization policies", "Privacy-by-design architecture", "Regular compliance audits"],
      residualRisk: "Very Low",
      owner: "Privacy Officer",
      reviewDate: "2025-03-01"
    },
    {
      id: "RISK-008",
      category: "Infrastructure",
      risk: "Cloud Provider Outage",
      likelihood: "Low",
      impact: "Medium",
      inherentRisk: "Medium",
      controls: ["Multi-region architecture", "SOC 2 certified infrastructure (Google Cloud, Supabase)", "99.9% SLA", "Automated failover"],
      residualRisk: "Low",
      owner: "CTO",
      reviewDate: "2025-03-01"
    },
    {
      id: "RISK-009",
      category: "AI/ML",
      risk: "Biased or Inaccurate AI Feedback to Students",
      likelihood: "Low",
      impact: "Medium",
      inherentRisk: "Medium",
      controls: ["Google Vertex AI (certified provider)", "Human-in-the-loop validation", "Feedback review by teachers", "Transparent AI explanations"],
      residualRisk: "Low",
      owner: "AI/ML Lead",
      reviewDate: "2025-03-01"
    },
    {
      id: "RISK-010",
      category: "Operational",
      risk: "Insider Threat / Malicious Administrator",
      likelihood: "Very Low",
      impact: "Critical",
      inherentRisk: "High",
      controls: ["Immutable audit logs", "Multi-party approval for sensitive actions", "Background checks for admins", "Principle of least privilege"],
      residualRisk: "Low",
      owner: "Security Officer",
      reviewDate: "2025-03-01"
    }
  ];

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case "Very Low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Low": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "High": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Very Low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "High": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-foreground">Risk Register</h1>
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
              This Risk Register identifies, assesses, and documents risks to the YubiLearn platform's security, 
              privacy, and operational objectives. Each risk is evaluated for likelihood and impact, with corresponding 
              controls documented to demonstrate risk mitigation.
            </p>
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">10</p>
                <p className="text-sm text-muted-foreground">Total Risks Identified</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600">8</p>
                <p className="text-sm text-muted-foreground">Low Residual Risk</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-blue-600">2</p>
                <p className="text-sm text-muted-foreground">Very Low Residual Risk</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">100%</p>
                <p className="text-sm text-muted-foreground">Risks with Controls</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Matrix Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Likelihood Scale:</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getLikelihoodColor("Very Low")}>Very Low: &lt;5% probability</Badge>
                  <Badge className={getLikelihoodColor("Low")}>Low: 5-25% probability</Badge>
                  <Badge className={getLikelihoodColor("Medium")}>Medium: 25-50% probability</Badge>
                  <Badge className={getLikelihoodColor("High")}>High: 50-75% probability</Badge>
                  <Badge className={getLikelihoodColor("Critical")}>Critical: &gt;75% probability</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Impact Scale:</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getLikelihoodColor("Very Low")}>Very Low: Minimal impact</Badge>
                  <Badge className={getLikelihoodColor("Low")}>Low: Limited impact</Badge>
                  <Badge className={getLikelihoodColor("Medium")}>Medium: Moderate impact</Badge>
                  <Badge className={getLikelihoodColor("High")}>High: Significant impact</Badge>
                  <Badge className={getLikelihoodColor("Critical")}>Critical: Severe/Catastrophic impact</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Risk Register */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Register Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {risks.map((risk) => (
                <div key={risk.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{risk.id}</Badge>
                        <Badge variant="secondary">{risk.category}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{risk.risk}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Likelihood</p>
                      <Badge className={getLikelihoodColor(risk.likelihood)}>{risk.likelihood}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Impact</p>
                      <Badge className={getLikelihoodColor(risk.impact)}>{risk.impact}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Inherent Risk</p>
                      <Badge className={getRiskColor(risk.inherentRisk)}>{risk.inherentRisk}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Residual Risk</p>
                      <Badge className={getRiskColor(risk.residualRisk)}>{risk.residualRisk}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Mitigating Controls:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                        {risk.controls.map((control, idx) => (
                          <li key={idx}>{control}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        <span className="font-semibold">Owner:</span> {risk.owner}
                      </span>
                      <span className="text-muted-foreground">
                        <span className="font-semibold">Next Review:</span> {risk.reviewDate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Management Process */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Management Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground">1. Risk Identification</h4>
                <p className="text-sm text-muted-foreground">Continuous identification through security reviews, threat modeling, and stakeholder input.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">2. Risk Assessment</h4>
                <p className="text-sm text-muted-foreground">Evaluation of likelihood and impact using standardized matrix.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">3. Risk Treatment</h4>
                <p className="text-sm text-muted-foreground">Implementation of controls to mitigate, transfer, accept, or avoid risks.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">4. Risk Monitoring</h4>
                <p className="text-sm text-muted-foreground">Quarterly review of all risks, controls, and residual risk levels.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
          <p><strong>Classification:</strong> Confidential - Internal Use Only</p>
          <p><strong>Document Control:</strong> This is a living document reviewed quarterly or when significant changes occur.</p>
          <p><strong>Contact:</strong> security@yubilearn.com</p>
        </div>
      </div>
    </div>
  );
}
