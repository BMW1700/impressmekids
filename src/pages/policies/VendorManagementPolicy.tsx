import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export default function VendorManagementPolicy() {
  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Vendor Management Policy</h1>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Badge variant="outline">Version 1.0</Badge>
          <Badge variant="outline">Effective Date: {new Date().toLocaleDateString()}</Badge>
          <Badge variant="outline">SOC 2 Type I</Badge>
          <Badge className="bg-green-600">Active Policy</Badge>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This Vendor Management Policy establishes the framework for evaluating, selecting, onboarding, 
            monitoring, and managing third-party vendors that provide services to Impress Me Kids. This policy 
            ensures that vendor relationships meet security, privacy, compliance, and operational requirements 
            aligned with SOC 2 Trust Services Criteria.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="font-semibold mb-2">Policy Scope</div>
              <p className="text-sm text-muted-foreground">All third-party vendors with access to Impress Me Kids systems or student data</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-semibold mb-2">Key Vendors</div>
              <p className="text-sm text-muted-foreground">Google Cloud Platform, Vertex AI, Supabase/Lovable Cloud</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-semibold mb-2">Review Frequency</div>
              <p className="text-sm text-muted-foreground">Annual vendor reviews, quarterly for critical vendors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purpose and Scope */}
      <Card>
        <CardHeader>
          <CardTitle>1. Purpose and Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1.1 Purpose</h4>
            <p className="text-muted-foreground">
              This policy aims to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li>Establish consistent vendor evaluation and selection criteria</li>
              <li>Ensure vendors meet security, privacy, and compliance requirements</li>
              <li>Define ongoing vendor monitoring and risk management processes</li>
              <li>Protect student data and maintain service availability</li>
              <li>Support SOC 2 compliance requirements</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">1.2 Scope</h4>
            <p className="text-muted-foreground">
              This policy applies to all third-party vendors that:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li>Have access to Impress Me Kids systems, networks, or infrastructure</li>
              <li>Process, store, or transmit student data or other sensitive information</li>
              <li>Provide critical services that impact system availability or security</li>
              <li>Are integrated into the Impress Me Kids technology stack</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Classification */}
      <Card>
        <CardHeader>
          <CardTitle>2. Vendor Classification</CardTitle>
          <CardDescription>Vendors are classified based on risk level to determine appropriate due diligence</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk Level</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Examples</TableHead>
                <TableHead>Due Diligence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Badge variant="destructive">Critical</Badge>
                </TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Stores/processes student data</li>
                    <li>• Core infrastructure provider</li>
                    <li>• Service outage impacts operations</li>
                  </ul>
                </TableCell>
                <TableCell className="text-sm">
                  Google Cloud Platform, Vertex AI, Supabase/Lovable Cloud
                </TableCell>
                <TableCell className="text-sm">
                  Full security assessment, annual SOC 2 report review, quarterly reviews
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="default" className="bg-orange-600">High</Badge>
                </TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Access to systems/networks</li>
                    <li>• Processes non-student sensitive data</li>
                    <li>• Important but not critical services</li>
                  </ul>
                </TableCell>
                <TableCell className="text-sm">
                  Authentication providers, payment processors
                </TableCell>
                <TableCell className="text-sm">
                  Security questionnaire, compliance certifications, annual reviews
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="secondary">Medium</Badge>
                </TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Limited system access</li>
                    <li>• No sensitive data access</li>
                    <li>• Non-critical services</li>
                  </ul>
                </TableCell>
                <TableCell className="text-sm">
                  Analytics tools, marketing platforms
                </TableCell>
                <TableCell className="text-sm">
                  Basic security review, privacy policy review, biannual reviews
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="outline">Low</Badge>
                </TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• No system access</li>
                    <li>• No data processing</li>
                    <li>• Minimal risk</li>
                  </ul>
                </TableCell>
                <TableCell className="text-sm">
                  Office supplies, general software tools
                </TableCell>
                <TableCell className="text-sm">
                  Standard contract review
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vendor Evaluation Process */}
      <Card>
        <CardHeader>
          <CardTitle>3. Vendor Evaluation and Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">3.1 Evaluation Criteria</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Security</TableCell>
                  <TableCell>
                    <ul className="text-sm space-y-1">
                      <li>• SOC 2 Type II certification (critical vendors)</li>
                      <li>• Data encryption (in transit and at rest)</li>
                      <li>• Access controls and authentication</li>
                      <li>• Incident response procedures</li>
                      <li>• Vulnerability management program</li>
                    </ul>
                  </TableCell>
                  <TableCell className="text-sm">
                    SOC 2 reports, security questionnaires, penetration test results
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Privacy & Compliance</TableCell>
                  <TableCell>
                    <ul className="text-sm space-y-1">
                      <li>• FERPA compliance (for student data)</li>
                      <li>• COPPA compliance</li>
                      <li>• GDPR compliance (if applicable)</li>
                      <li>• Data Processing Agreement (DPA)</li>
                      <li>• Privacy policy and data handling practices</li>
                    </ul>
                  </TableCell>
                  <TableCell className="text-sm">
                    Compliance certifications, DPA, privacy policies
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Business Continuity</TableCell>
                  <TableCell>
                    <ul className="text-sm space-y-1">
                      <li>• Disaster recovery plan</li>
                      <li>• Business continuity plan</li>
                      <li>• SLA commitments (uptime, response time)</li>
                      <li>• Backup and redundancy measures</li>
                    </ul>
                  </TableCell>
                  <TableCell className="text-sm">
                    BCP/DR documentation, SLA agreements, uptime reports
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Financial Stability</TableCell>
                  <TableCell>
                    <ul className="text-sm space-y-1">
                      <li>• Financial viability assessment</li>
                      <li>• Insurance coverage</li>
                      <li>• References and reputation</li>
                    </ul>
                  </TableCell>
                  <TableCell className="text-sm">
                    Financial statements, insurance certificates, references
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h4 className="font-semibold mb-3">3.2 Due Diligence Process</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">1</div>
                <div>
                  <div className="font-medium">Initial Assessment</div>
                  <p className="text-sm text-muted-foreground">Determine vendor classification and required due diligence level</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">2</div>
                <div>
                  <div className="font-medium">Security Review</div>
                  <p className="text-sm text-muted-foreground">Request and review security documentation (SOC 2, penetration tests, questionnaires)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">3</div>
                <div>
                  <div className="font-medium">Compliance Verification</div>
                  <p className="text-sm text-muted-foreground">Verify FERPA, COPPA, and other relevant compliance certifications</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">4</div>
                <div>
                  <div className="font-medium">Contract Negotiation</div>
                  <p className="text-sm text-muted-foreground">Negotiate terms including DPA, SLA, liability, termination, and audit rights</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">5</div>
                <div>
                  <div className="font-medium">Risk Assessment</div>
                  <p className="text-sm text-muted-foreground">Document risks, mitigation strategies, and approval by Security Officer</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">6</div>
                <div>
                  <div className="font-medium">Approval and Onboarding</div>
                  <p className="text-sm text-muted-foreground">Final approval by management and add to vendor registry</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Onboarding */}
      <Card>
        <CardHeader>
          <CardTitle>4. Vendor Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">4.1 Onboarding Checklist</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Contract Execution</TableCell>
                  <TableCell>Sign master service agreement and DPA</TableCell>
                  <TableCell>Legal/Management</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vendor Registry</TableCell>
                  <TableCell>Add vendor to central vendor registry with classification</TableCell>
                  <TableCell>Security Officer</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Access Provisioning</TableCell>
                  <TableCell>Configure accounts and access controls per least privilege principle</TableCell>
                  <TableCell>IT Administrator</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Integration Configuration</TableCell>
                  <TableCell>Set up API keys, webhooks, and technical integration securely</TableCell>
                  <TableCell>Engineering Team</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Documentation</TableCell>
                  <TableCell>Document integration architecture and data flows</TableCell>
                  <TableCell>Engineering Team</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Monitoring Setup</TableCell>
                  <TableCell>Configure monitoring, alerting, and logging for vendor services</TableCell>
                  <TableCell>IT Administrator</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Review Schedule</TableCell>
                  <TableCell>Set calendar reminders for periodic vendor reviews</TableCell>
                  <TableCell>Security Officer</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Requirement:</strong> All API keys, credentials, and secrets for vendor integrations 
              must be stored in the secure secrets management system (Lovable Cloud Secrets), never in source code.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Ongoing Management */}
      <Card>
        <CardHeader>
          <CardTitle>5. Ongoing Vendor Management and Monitoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">5.1 Periodic Reviews</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Classification</TableHead>
                  <TableHead>Review Frequency</TableHead>
                  <TableHead>Review Activities</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell><Badge variant="destructive">Critical</Badge></TableCell>
                  <TableCell>Quarterly</TableCell>
                  <TableCell>
                    <ul className="text-sm space-y-1">
                      <li>• Review updated SOC 2 reports</li>
                      <li>• Assess service performance against SLAs</li>
                      <li>• Review security incidents or breaches</li>
                      <li>• Verify compliance status</li>
                      <li>• Review access logs and usage</li>
                    </ul>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Badge variant="default" className="bg-orange-600">High</Badge></TableCell>
                  <TableCell>Annual</TableCell>
                  <TableCell>
                    <ul className="text-sm space-y-1">
                      <li>• Update security questionnaire</li>
                      <li>• Review compliance certifications</li>
                      <li>• Assess service performance</li>
                      <li>• Review any security incidents</li>
                    </ul>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Badge variant="secondary">Medium/Low</Badge></TableCell>
                  <TableCell>Biannual or as needed</TableCell>
                  <TableCell>
                    <ul className="text-sm space-y-1">
                      <li>• Review contract and terms</li>
                      <li>• Assess continued business need</li>
                      <li>• Review any changes to services</li>
                    </ul>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h4 className="font-semibold mb-3">5.2 Continuous Monitoring</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">Performance Monitoring</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Service uptime and availability</li>
                  <li>• Response times and latency</li>
                  <li>• Error rates and incidents</li>
                  <li>• SLA compliance metrics</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">Security Monitoring</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Security incident notifications</li>
                  <li>• Access log review</li>
                  <li>• Unusual activity detection</li>
                  <li>• Compliance status changes</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">Business Monitoring</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Contract renewal dates</li>
                  <li>• Cost tracking and budget</li>
                  <li>• Service usage patterns</li>
                  <li>• Vendor financial health</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">Compliance Monitoring</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Certification expiration dates</li>
                  <li>• Regulatory changes</li>
                  <li>• Audit findings</li>
                  <li>• Policy updates</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">5.3 Incident Response</h4>
            <p className="text-muted-foreground mb-3">
              If a vendor experiences a security incident or service outage:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Vendor must notify Impress Me Kids within 24 hours</li>
              <li>Security Officer assesses impact on Impress Me Kids systems and data</li>
              <li>Activate incident response procedures if student data is affected</li>
              <li>Document incident details, timeline, and vendor response</li>
              <li>Review vendor's remediation plan and timeline</li>
              <li>Conduct post-incident review and update risk assessment</li>
              <li>Consider vendor replacement if incidents are recurring or severe</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Key Vendors */}
      <Card>
        <CardHeader>
          <CardTitle>6. Critical Vendor Profiles</CardTitle>
          <CardDescription>Detailed information on our key technology vendors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Cloud Platform */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">Google Cloud Platform (GCP)</h4>
                <p className="text-sm text-muted-foreground">Infrastructure and AI Services Provider</p>
              </div>
              <Badge variant="destructive">Critical</Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-sm mb-2">Services Used</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vertex AI (Gemini models)</li>
                  <li>• Cloud Storage</li>
                  <li>• Cloud Functions</li>
                  <li>• Cloud Logging</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Data Processing</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Student audio recordings (temporary)</li>
                  <li>• Text transcripts</li>
                  <li>• AI model inferences</li>
                  <li>• Application logs</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Compliance Status</div>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">SOC 2 Type II</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">FERPA Compliant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">COPPA Compliant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">ISO 27001</span>
                  </li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Key Controls</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Data encrypted at rest and in transit</li>
                  <li>• IAM policies for least privilege access</li>
                  <li>• VPC Service Controls for data perimeter</li>
                  <li>• Cloud Audit Logs enabled</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="font-medium text-sm mb-2">Review Schedule</div>
              <p className="text-sm text-muted-foreground">Quarterly reviews, annual SOC 2 report verification</p>
            </div>

            <div>
              <div className="font-medium text-sm mb-2">Risk Mitigation</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Regular backup of critical data to alternative storage</li>
                <li>• Multi-region deployment for high availability</li>
                <li>• Monitoring and alerting on service health</li>
                <li>• DPA in place with Google Cloud</li>
              </ul>
            </div>
          </div>

          {/* Supabase/Lovable Cloud */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">Supabase / Lovable Cloud</h4>
                <p className="text-sm text-muted-foreground">Backend-as-a-Service, Database, Authentication, Storage</p>
              </div>
              <Badge variant="destructive">Critical</Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-sm mb-2">Services Used</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• PostgreSQL Database</li>
                  <li>• Authentication (JWT)</li>
                  <li>• File Storage</li>
                  <li>• Edge Functions</li>
                  <li>• Real-time subscriptions</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Data Processing</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All application data</li>
                  <li>• Student profiles and progress</li>
                  <li>• Assignment submissions</li>
                  <li>• Audio file storage</li>
                  <li>• User authentication data</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Compliance Status</div>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">SOC 2 Type II</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">GDPR Compliant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">HIPAA Compatible</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">ISO 27001</span>
                  </li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Key Controls</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Row-Level Security (RLS) policies</li>
                  <li>• Encryption at rest (AES-256)</li>
                  <li>• TLS 1.3 for data in transit</li>
                  <li>• Automated daily backups</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="font-medium text-sm mb-2">Review Schedule</div>
              <p className="text-sm text-muted-foreground">Quarterly reviews, continuous performance monitoring</p>
            </div>

            <div>
              <div className="font-medium text-sm mb-2">Risk Mitigation</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Point-in-time recovery for database</li>
                <li>• Regular backup testing and restoration drills</li>
                <li>• Cold storage backups for long-term retention</li>
                <li>• Monitoring on database performance and storage</li>
              </ul>
            </div>
          </div>

          {/* Vertex AI */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">Google Vertex AI</h4>
                <p className="text-sm text-muted-foreground">AI/ML Platform for Audio Analysis and Content Generation</p>
              </div>
              <Badge variant="destructive">Critical</Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-sm mb-2">Services Used</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gemini 2.0 Flash (audio transcription)</li>
                  <li>• Gemini 2.5 Flash (content generation)</li>
                  <li>• Speech-to-Text API</li>
                  <li>• Natural Language API</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Data Processing</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Student voice recordings</li>
                  <li>• Reading transcripts</li>
                  <li>• Assignment prompts</li>
                  <li>• Generated exercises</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Data Handling</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Audio data processed transiently</li>
                  <li>• Not stored by Google after processing</li>
                  <li>• Not used to train models</li>
                  <li>• Regional processing (US)</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Key Controls</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• API authentication via service accounts</li>
                  <li>• TLS encryption for API calls</li>
                  <li>• Rate limiting and quota management</li>
                  <li>• Audit logging of all API requests</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="font-medium text-sm mb-2">Review Schedule</div>
              <p className="text-sm text-muted-foreground">Quarterly reviews as part of GCP vendor management</p>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Privacy Protection:</strong> Student audio is sent to Vertex AI for transcription only. 
                Google does not store audio data or use it for model training per our Data Processing Agreement.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Offboarding */}
      <Card>
        <CardHeader>
          <CardTitle>7. Vendor Offboarding and Termination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">7.1 Offboarding Process</h4>
            <p className="text-muted-foreground mb-3">
              When terminating a vendor relationship:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Notify vendor per contract termination clause</li>
              <li>Export and migrate all data from vendor systems</li>
              <li>Verify data deletion from vendor systems per DPA</li>
              <li>Revoke all access credentials and API keys</li>
              <li>Remove integrations and dependencies from codebase</li>
              <li>Update documentation and architecture diagrams</li>
              <li>Conduct final security review</li>
              <li>Archive vendor documentation and contracts</li>
              <li>Update vendor registry to "Terminated" status</li>
              <li>Conduct lessons learned review</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">7.2 Data Deletion Verification</h4>
            <p className="text-muted-foreground">
              For critical vendors that processed student data, obtain written certification from the vendor 
              that all data has been permanently deleted from their systems, backups, and any third-party processors.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Roles and Responsibilities */}
      <Card>
        <CardHeader>
          <CardTitle>8. Roles and Responsibilities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Responsibilities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Security Officer</TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Overall vendor management program oversight</li>
                    <li>• Vendor risk assessment and approval</li>
                    <li>• Maintain vendor registry</li>
                    <li>• Coordinate periodic vendor reviews</li>
                    <li>• Incident response for vendor-related security events</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Management</TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Final approval for critical vendor relationships</li>
                    <li>• Budget approval for vendor services</li>
                    <li>• Strategic vendor relationship oversight</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Engineering Team</TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Technical evaluation of vendor capabilities</li>
                    <li>• Integration implementation and testing</li>
                    <li>• Ongoing monitoring of vendor service performance</li>
                    <li>• Vendor offboarding and migration</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">IT Administrator</TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Access provisioning and management</li>
                    <li>• Credential rotation and secrets management</li>
                    <li>• Monitoring and alerting configuration</li>
                    <li>• Access revocation during offboarding</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Legal/Compliance</TableCell>
                <TableCell>
                  <ul className="text-sm space-y-1">
                    <li>• Contract review and negotiation</li>
                    <li>• DPA and compliance verification</li>
                    <li>• Regulatory requirements interpretation</li>
                  </ul>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>9. Documentation and Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">9.1 Vendor Registry</h4>
            <p className="text-muted-foreground mb-2">
              The vendor registry must include for each vendor:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li>Vendor name and contact information</li>
              <li>Classification (Critical/High/Medium/Low)</li>
              <li>Services provided</li>
              <li>Data processed (if any)</li>
              <li>Contract start and end dates</li>
              <li>Last review date and next scheduled review</li>
              <li>Compliance certifications (SOC 2, etc.)</li>
              <li>Risk assessment summary</li>
              <li>Links to contracts, DPAs, and security documentation</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">9.2 Required Documentation</h4>
            <p className="text-muted-foreground mb-2">
              Maintain the following documentation for each critical/high vendor:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li>Master Service Agreement (MSA)</li>
              <li>Data Processing Agreement (DPA)</li>
              <li>Service Level Agreement (SLA)</li>
              <li>SOC 2 Type II report (if applicable)</li>
              <li>Security questionnaire responses</li>
              <li>Insurance certificates</li>
              <li>Vendor risk assessment</li>
              <li>Periodic review reports</li>
              <li>Incident reports (if any)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">9.3 Record Retention</h4>
            <p className="text-muted-foreground">
              Vendor documentation must be retained for 7 years after vendor relationship termination 
              to support compliance requirements and potential audits.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Policy Review */}
      <Card>
        <CardHeader>
          <CardTitle>10. Policy Review and Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This Vendor Management Policy will be reviewed annually or when significant changes occur to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
            <li>Technology infrastructure or vendor relationships</li>
            <li>Regulatory requirements (FERPA, COPPA, state privacy laws)</li>
            <li>SOC 2 audit findings or recommendations</li>
            <li>Security incidents involving vendors</li>
          </ul>
          
          <div className="mt-6 pt-6 border-t">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-1">Policy Owner</div>
                <p className="text-muted-foreground">Chief Security Officer</p>
              </div>
              <div>
                <div className="font-medium mb-1">Next Review Date</div>
                <p className="text-muted-foreground">{new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}</p>
              </div>
              <div>
                <div className="font-medium mb-1">Approval Date</div>
                <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <div className="font-medium mb-1">Version</div>
                <p className="text-muted-foreground">1.0</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOC 2 Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>11. SOC 2 Trust Services Criteria Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criteria</TableHead>
                <TableHead>Policy Section</TableHead>
                <TableHead>Control Objective</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Badge>CC9.2</Badge></TableCell>
                <TableCell>Vendor Evaluation (Section 3)</TableCell>
                <TableCell>Vendor risks are identified and managed through formal evaluation</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge>CC9.3</Badge></TableCell>
                <TableCell>Ongoing Management (Section 5)</TableCell>
                <TableCell>Vendor performance and compliance are monitored on an ongoing basis</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge>P3.1</Badge></TableCell>
                <TableCell>Vendor Classification (Section 2)</TableCell>
                <TableCell>Vendors with access to personal information are appropriately managed</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge>P4.1</Badge></TableCell>
                <TableCell>Critical Vendor Profiles (Section 6)</TableCell>
                <TableCell>Privacy commitments are communicated to vendors</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge>C1.2</Badge></TableCell>
                <TableCell>Due Diligence (Section 3.2)</TableCell>
                <TableCell>Confidentiality commitments to external parties are documented</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
