import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Cloud, Lock, Eye, FileCheck, Server } from "lucide-react";

const GoogleVertexSecurityControls = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Google Vertex AI Security Controls</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Control Inheritance and Ownership Mapping for SOC 2 Type I Compliance
        </p>
        <div className="flex gap-2 mt-4">
          <Badge variant="outline">Version 1.0</Badge>
          <Badge variant="outline">Effective: January 2025</Badge>
          <Badge variant="outline">SOC 2 Type I</Badge>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Impress Me Kids (Delve) utilizes Google Vertex AI as a cloud-based artificial intelligence platform for 
            analyzing student voice recordings, generating educational content, and providing adaptive learning insights. 
            This document maps security controls between inherited responsibilities (Google's) and owned responsibilities (Delve's).
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                <h4 className="font-semibold">Inherited Controls</h4>
              </div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">From Google Cloud Platform</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold">Owned Controls</h4>
              </div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Managed by Delve</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <h4 className="font-semibold">Shared Controls</h4>
              </div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Joint Responsibility</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vertex AI Usage Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Vertex AI Usage in Delve
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Primary Use Cases:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Audio analysis and transcription of student voice recordings (analyze-aura function)</li>
                <li>AI-powered question generation for assignments (generate-question-ai function)</li>
                <li>Flashcard generation from educational content (generate-flashcards function)</li>
                <li>Text extraction from images using Vertex Vision (extract-text-from-image function)</li>
                <li>Teacher summary generation and insights (generate-teacher-summary function)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Models Used:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>gemini-2.0-flash-exp (text generation)</li>
                <li>gemini-2.5-flash (vision and multimodal)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Data Flow:</h4>
              <p className="text-muted-foreground">
                Student data (voice recordings, text) → Supabase Edge Functions → Vertex AI API → 
                Analysis Results → Stored in Supabase PostgreSQL with RLS policies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inherited Controls from Google */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            Inherited Controls from Google Cloud Platform
          </CardTitle>
          <CardDescription>
            Controls fully managed by Google Cloud Platform that Delve inherits through the service provider relationship
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Control Domain</TableHead>
                <TableHead className="w-[150px]">SOC 2 Criteria</TableHead>
                <TableHead>Control Description</TableHead>
                <TableHead className="w-[150px]">Evidence Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">Physical Security</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.4</Badge>
                </TableCell>
                <TableCell>
                  Google manages physical security of data centers including access controls, surveillance, 
                  and environmental controls (fire suppression, power, cooling)
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Google Cloud SOC 2 Type II Report
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Infrastructure Encryption</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.7</Badge>
                </TableCell>
                <TableCell>
                  Google encrypts data at rest using AES-256 and in transit using TLS 1.3+. 
                  All Vertex AI API calls are encrypted by default.
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Google Cloud Encryption Whitepaper
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Network Security</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.6</Badge>
                </TableCell>
                <TableCell>
                  Google operates private global network with DDoS protection, network segmentation, 
                  and intrusion detection systems
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Google Cloud Infrastructure Security Design
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Audit Logging</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC7.2</Badge>
                </TableCell>
                <TableCell>
                  Cloud Audit Logs automatically record API calls, admin activities, and data access 
                  to Vertex AI services with immutable timestamps
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  GCP Console Audit Logs
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Identity & Access Management</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.1, CC6.2</Badge>
                </TableCell>
                <TableCell>
                  Google IAM provides centralized identity management, role-based access control (RBAC), 
                  and service account authentication for Vertex AI
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  IAM Policy Export, Service Account Keys
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Availability & Disaster Recovery</TableCell>
                <TableCell>
                  <Badge variant="secondary">A1.2</Badge>
                </TableCell>
                <TableCell>
                  Google provides 99.95% SLA for Vertex AI with multi-region redundancy, 
                  automated failover, and backup infrastructure
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Google Cloud SLA Documentation
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Vulnerability Management</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC7.1</Badge>
                </TableCell>
                <TableCell>
                  Google performs regular vulnerability scanning, penetration testing, and security patching 
                  of Vertex AI infrastructure
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Google Cloud SOC 2 Report
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Data Residency</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.5</Badge>
                </TableCell>
                <TableCell>
                  Google allows selection of data processing regions (us-central1) and ensures data 
                  residency compliance
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Resource Location Constraints
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Incident Response</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC7.3, CC7.4</Badge>
                </TableCell>
                <TableCell>
                  Google maintains 24/7 security operations center (SOC) with incident detection, 
                  response, and customer notification procedures
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Google Cloud Incident Response Documentation
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Compliance Certifications</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC1.1</Badge>
                </TableCell>
                <TableCell>
                  Google Cloud Platform maintains SOC 2 Type II, ISO 27001, FedRAMP, and other compliance certifications
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Google Cloud Compliance Reports Hub
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Model Security</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.8</Badge>
                </TableCell>
                <TableCell>
                  Google secures AI models with access controls, protects against prompt injection, 
                  and implements content safety filters
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Vertex AI Security Best Practices
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Privacy Controls</TableCell>
                <TableCell>
                  <Badge variant="secondary">C1.2</Badge>
                </TableCell>
                <TableCell>
                  Google does not use customer data to train models. Data sent to Vertex AI is not retained 
                  by Google beyond processing time.
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Vertex AI Data Processing Addendum
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Owned Controls by Delve */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-500" />
            Owned Controls by Delve
          </CardTitle>
          <CardDescription>
            Controls directly managed and implemented by Delve's development and security team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Control Domain</TableHead>
                <TableHead className="w-[150px]">SOC 2 Criteria</TableHead>
                <TableHead>Control Description</TableHead>
                <TableHead className="w-[150px]">Evidence Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">API Authentication</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.1</Badge>
                </TableCell>
                <TableCell>
                  Delve manages GOOGLE_VERTEX_AI_KEY stored in Supabase Secrets Manager. 
                  JWT tokens are generated and rotated for API authentication.
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  vertexAuth.ts, Supabase Secrets
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Data Classification</TableCell>
                <TableCell>
                  <Badge variant="secondary">C1.1</Badge>
                </TableCell>
                <TableCell>
                  Delve classifies all data sent to Vertex AI and applies appropriate handling based on 
                  sensitivity (student voice recordings = Restricted, assignment text = Confidential)
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Data Classification Policy
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Parental Consent</TableCell>
                <TableCell>
                  <Badge variant="secondary">C1.2, P1.1</Badge>
                </TableCell>
                <TableCell>
                  Delve enforces parental consent before processing student voice recordings through Vertex AI. 
                  Consent verification occurs via parent_consents table.
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  parent_consents table, RLS policies
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Input Validation</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC8.1</Badge>
                </TableCell>
                <TableCell>
                  All data sent to Vertex AI is validated using Zod schemas to prevent injection attacks 
                  and ensure data integrity (validateInput function)
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  validation.ts, Edge Function Code
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Rate Limiting</TableCell>
                <TableCell>
                  <Badge variant="secondary">A1.3</Badge>
                </TableCell>
                <TableCell>
                  Delve implements rate limiting on all Vertex AI edge functions to prevent abuse 
                  and ensure fair resource allocation (3 requests/minute per user)
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  rateLimiter.ts, Edge Function Logs
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Error Handling & Logging</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC7.2</Badge>
                </TableCell>
                <TableCell>
                  Delve logs all Vertex AI API errors to aura_processing_failures table with request_id, 
                  error details, and timestamps for audit trail
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  aura_processing_failures table, Supabase Logs
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Access Controls</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.1, CC6.3</Badge>
                </TableCell>
                <TableCell>
                  Only authenticated teachers and students can invoke Vertex AI functions. 
                  Role-based access enforced via Supabase Auth and RLS policies.
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Edge Function Auth Checks, profiles table
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Data Retention</TableCell>
                <TableCell>
                  <Badge variant="secondary">C1.2</Badge>
                </TableCell>
                <TableCell>
                  Delve does not send data to Vertex AI for storage. All AI responses are received 
                  and stored in Supabase, not retained by Google.
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Data Flow Documentation, API Usage
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Shared Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-500" />
            Shared Controls (Joint Responsibility)
          </CardTitle>
          <CardDescription>
            Controls where both Google and Delve have specific responsibilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Control Domain</TableHead>
                <TableHead className="w-[150px]">SOC 2 Criteria</TableHead>
                <TableHead>Google's Responsibility</TableHead>
                <TableHead>Delve's Responsibility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">Encryption</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.7</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  Provides TLS 1.3 for API calls and AES-256 for data at rest
                </TableCell>
                <TableCell className="text-sm">
                  Ensures all API calls use HTTPS, validates certificates, encrypts secrets
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Access Logging</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC7.2</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  Records all API calls in Cloud Audit Logs with immutable timestamps
                </TableCell>
                <TableCell className="text-sm">
                  Monitors logs, investigates anomalies, correlates with aura_access_log
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Key Management</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC6.1</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  Provides Secret Manager for secure key storage and rotation
                </TableCell>
                <TableCell className="text-sm">
                  Manages service account keys, rotates credentials, restricts access
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Incident Response</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC7.3</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  Notifies customers of platform incidents, provides status updates
                </TableCell>
                <TableCell className="text-sm">
                  Responds to application-level incidents, notifies affected users
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Monitoring & Alerts</TableCell>
                <TableCell>
                  <Badge variant="secondary">CC7.2</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  Provides Cloud Monitoring for API metrics, latency, error rates
                </TableCell>
                <TableCell className="text-sm">
                  Configures alerts, monitors usage patterns, tracks rate limits
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Evidence Collection Requirements */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Evidence Collection Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">For Inherited Controls:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Obtain Google Cloud SOC 2 Type II report (valid within 12 months)</li>
                <li>Export and review IAM policies for Vertex AI service accounts</li>
                <li>Enable and configure Cloud Audit Logs for all Vertex AI API calls</li>
                <li>Document Vertex AI API scope in Google Cloud Compliance Reports Hub</li>
                <li>Obtain and review Vertex AI Data Processing Addendum (DPA)</li>
                <li>Screenshot GCP Console showing encryption settings and region configuration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Owned Controls:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Export edge function code demonstrating authentication, validation, and rate limiting</li>
                <li>Query aura_processing_failures table for error logging evidence</li>
                <li>Export Supabase Secrets showing GOOGLE_VERTEX_AI_KEY (redacted)</li>
                <li>Document RLS policies on parent_consents table</li>
                <li>Provide screenshots of rate limiter configuration and logs</li>
                <li>Document data classification matrix mapping student data to Vertex AI usage</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Shared Controls:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Cloud Audit Logs showing Vertex AI API calls with timestamps</li>
                <li>Supabase edge function logs correlating with Cloud Audit Logs</li>
                <li>Certificate validation tests for TLS connections</li>
                <li>Incident response runbook referencing both Google and Delve procedures</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <p className="font-semibold">Enable Cloud Audit Logs in GCP Console</p>
                <p className="text-sm text-muted-foreground">
                  Navigate to IAM & Admin → Audit Logs → Enable Data Read, Data Write, and Admin Read for Vertex AI
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <p className="font-semibold">Configure VPC Service Controls (if required)</p>
                <p className="text-sm text-muted-foreground">
                  For high-security deployments, configure VPC-SC to restrict Vertex AI API access to authorized networks
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <p className="font-semibold">Implement Secret Rotation Policy</p>
                <p className="text-sm text-muted-foreground">
                  Document and enforce 90-day rotation for GOOGLE_VERTEX_AI_KEY service account credentials
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <p className="font-semibold">Obtain Google Cloud SOC 2 Report</p>
                <p className="text-sm text-muted-foreground">
                  Request from Google Cloud compliance team or access via Compliance Reports Hub
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <p className="font-semibold">Document Data Flow Diagram</p>
                <p className="text-sm text-muted-foreground">
                  Create visual diagram showing data flow from student → Supabase → Vertex AI → storage
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <p className="font-semibold">Review and Sign Vertex AI DPA</p>
                <p className="text-sm text-muted-foreground">
                  Ensure Data Processing Addendum is executed and covers FERPA/COPPA requirements
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" />
              <div>
                <p className="font-semibold">Conduct Quarterly Control Review</p>
                <p className="text-sm text-muted-foreground">
                  Schedule recurring review of this control mapping to ensure continued accuracy
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 p-4 border rounded-lg bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          This document is maintained by the Delve Security Team and reviewed quarterly. 
          For questions or updates, contact the Security Lead.
        </p>
      </div>
    </div>
  );
};

export default GoogleVertexSecurityControls;
