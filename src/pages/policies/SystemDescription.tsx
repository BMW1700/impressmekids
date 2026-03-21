import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Server, 
  Database, 
  Shield, 
  Users, 
  Workflow, 
  Cloud,
  Lock,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Network,
  Layers,
  Globe
} from "lucide-react";

const SystemDescription = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">System Description Document</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          NabuLearn - Educational Platform Architecture and Control Environment
        </p>
        <div className="flex gap-2 mt-4">
          <Badge variant="outline">SOC 2 Type 1</Badge>
          <Badge variant="outline">Version 1.0</Badge>
          <Badge variant="outline">Last Updated: November 2025</Badge>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            NabuLearn is a cloud-based educational platform designed to help K-12 students improve 
            their literacy and learning outcomes through AI-powered voice analysis, adaptive assignments, 
            and gamified learning experiences. The system serves students, teachers, parents, and school 
            administrators, processing sensitive student educational records subject to FERPA and COPPA regulations.
          </p>
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div className="p-4 border rounded-lg text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-semibold">4 User Types</p>
              <p className="text-sm text-muted-foreground">Students, Teachers, Parents, Admins</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Database className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-semibold">PostgreSQL</p>
              <p className="text-sm text-muted-foreground">Primary database with RLS</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Cloud className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Google Cloud</p>
              <p className="text-sm text-muted-foreground">Vertex AI & Infrastructure</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="font-semibold">FERPA/COPPA</p>
              <p className="text-sm text-muted-foreground">Compliant data handling</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Boundaries */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            System Boundaries and Scope
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                In Scope
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Web application (React/TypeScript frontend)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Lovable Cloud backend (Supabase-powered)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>PostgreSQL database with Row-Level Security</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Edge functions (serverless API layer)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>File storage (student audio recordings, images)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Google Vertex AI integration (voice analysis, content generation)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Authentication and authorization system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Security monitoring and audit logging</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Out of Scope
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Email delivery service (Resend - third-party)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Internal development tools and staging environments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Corporate IT infrastructure (employee devices, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Marketing website (separate from application)</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Architecture */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            System Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Technology Stack</h3>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Frontend Layer
              </h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium">Framework</p>
                  <p className="text-muted-foreground">React 18 with TypeScript</p>
                </div>
                <div>
                  <p className="font-medium">Build Tool</p>
                  <p className="text-muted-foreground">Vite</p>
                </div>
                <div>
                  <p className="font-medium">UI Components</p>
                  <p className="text-muted-foreground">Shadcn/ui with Radix primitives</p>
                </div>
                <div>
                  <p className="font-medium">Styling</p>
                  <p className="text-muted-foreground">Tailwind CSS</p>
                </div>
                <div>
                  <p className="font-medium">State Management</p>
                  <p className="text-muted-foreground">TanStack Query (React Query)</p>
                </div>
                <div>
                  <p className="font-medium">Routing</p>
                  <p className="text-muted-foreground">React Router v6</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Backend Layer (Lovable Cloud)
              </h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium">Platform</p>
                  <p className="text-muted-foreground">Supabase (fully managed)</p>
                </div>
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-muted-foreground">PostgreSQL 15+</p>
                </div>
                <div>
                  <p className="font-medium">Authentication</p>
                  <p className="text-muted-foreground">Supabase Auth (JWT-based)</p>
                </div>
                <div>
                  <p className="font-medium">Storage</p>
                  <p className="text-muted-foreground">Supabase Storage (S3-compatible)</p>
                </div>
                <div>
                  <p className="font-medium">API Layer</p>
                  <p className="text-muted-foreground">Edge Functions (Deno runtime)</p>
                </div>
                <div>
                  <p className="font-medium">Realtime</p>
                  <p className="text-muted-foreground">PostgreSQL replication streams</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                AI/ML Layer
              </h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium">Primary AI Platform</p>
                  <p className="text-muted-foreground">Google Vertex AI</p>
                </div>
                <div>
                  <p className="font-medium">Models Used</p>
                  <p className="text-muted-foreground">Gemini 2.5 Pro/Flash, Whisper (transcription)</p>
                </div>
                <div>
                  <p className="font-medium">Voice Analysis</p>
                  <p className="text-muted-foreground">Speech-to-Text API, phoneme detection</p>
                </div>
                <div>
                  <p className="font-medium">Content Generation</p>
                  <p className="text-muted-foreground">Gemini for questions, flashcards, feedback</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure and Hosting */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Infrastructure and Hosting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Primary Hosting</h4>
              <p className="text-sm text-muted-foreground mb-3">
                The application is hosted on Lovable's managed infrastructure, which utilizes Supabase's 
                multi-region cloud platform built on AWS infrastructure.
              </p>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium">Frontend Hosting</p>
                  <p className="text-muted-foreground">Lovable CDN (global edge network)</p>
                </div>
                <div>
                  <p className="font-medium">Backend Hosting</p>
                  <p className="text-muted-foreground">Supabase Cloud (AWS-based)</p>
                </div>
                <div>
                  <p className="font-medium">Database Location</p>
                  <p className="text-muted-foreground">US-based data centers (configurable)</p>
                </div>
                <div>
                  <p className="font-medium">Edge Functions</p>
                  <p className="text-muted-foreground">Global edge network (low latency)</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Google Cloud Platform</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Google Vertex AI services are consumed via API calls from our edge functions. No data 
                is permanently stored in GCP; audio files are transiently processed and immediately deleted.
              </p>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium">Region</p>
                  <p className="text-muted-foreground">us-central1 (primary)</p>
                </div>
                <div>
                  <p className="font-medium">Services Used</p>
                  <p className="text-muted-foreground">Vertex AI API only (no persistent storage)</p>
                </div>
                <div>
                  <p className="font-medium">Data Residency</p>
                  <p className="text-muted-foreground">Ephemeral processing only</p>
                </div>
                <div>
                  <p className="font-medium">Authentication</p>
                  <p className="text-muted-foreground">Service Account with minimal permissions</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-primary/5">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Infrastructure Security
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• TLS 1.3 encryption for all data in transit</li>
                <li>• AES-256 encryption for data at rest (database and storage)</li>
                <li>• Network isolation via VPC and security groups</li>
                <li>• DDoS protection at CDN layer</li>
                <li>• Automated backups with 7-day retention</li>
                <li>• Cold storage backups with encryption</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Flows */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Critical Data Flows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">1. User Authentication Flow</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>User enters email/password in React frontend</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Credentials sent via HTTPS to Supabase Auth API</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Password hashed with bcrypt, compared to stored hash</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>JWT access token (1 hour) and refresh token (30 days) issued</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>User role fetched from user_roles table via Security Definer function</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Frontend receives tokens, stored in localStorage</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>All subsequent requests include JWT in Authorization header</span>
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">2. Student Voice Recording and Analysis Flow</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Student clicks record button in assignment interface</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Browser captures audio via MediaRecorder API (WebM format)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Audio blob uploaded to Supabase Storage (aura-audio bucket) with RLS policy check</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Edge function `analyze-aura` invoked with audio URL and student context</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Function authenticates request, validates student/teacher relationship</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Audio sent to Google Speech-to-Text API for transcription</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Transcript analyzed for phoneme accuracy, prosody, fluency using Vertex AI</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Analysis results written to aura_records table with RLS protection</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Student sees feedback in UI; teacher can view with parental consent</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Access logged in aura_access_log for audit purposes</span>
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">3. Assignment Creation and Distribution Flow</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Teacher creates assignment in classroom interface</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Assignment saved to assignments table with is_posted=false (draft mode)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>RLS policy ensures only teacher can see draft assignments</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Teacher reviews, clicks "Post to Students"</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Assignment updated with is_posted=true</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>RLS policy now allows classroom students to see assignment</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Students receive realtime notification via PostgreSQL channels</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Parent notification created in parent_notifications table if enabled</span>
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">4. Parental Consent and Data Access Flow</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Parent creates account, requests access to student profile</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Request saved to parent_access_requests with status='pending'</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>School admin reviews request, verifies parent identity</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Admin approves request, entry created in parent_student_links</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>Parent consent record created in parent_consents table</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>RLS policies now grant parent read access to student's assignments and grades</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>If aura_recording_consent=true, parent can access voice analysis data</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-primary">→</span>
                  <span>All access logged in security_audit_log for FERPA compliance</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Roles and Responsibilities */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Roles and Access Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Student Role</h4>
                <Badge>Least Privileged</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Students can access only their own data and shared classroom resources.
              </p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>View assignments in their enrolled classrooms</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Submit assignment responses and voice recordings</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>View their own grades and feedback</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Participate in classroom games and tournaments</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Access their own AURA voice analysis data</span>
                </p>
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span>CANNOT view other students' submissions or PII</span>
                </p>
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span>CANNOT modify assignments or classroom data</span>
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Teacher Role</h4>
                <Badge>Classroom Manager</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Teachers manage classrooms and can access student data with appropriate consent.
              </p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Create and manage their own classrooms</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Create assignments, questions, and educational content</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>View submissions and grades for students in their classrooms</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Access AURA voice data ONLY with parental consent</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Organize tournaments and games for their classrooms</span>
                </p>
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span>CANNOT access students outside their classrooms</span>
                </p>
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span>CANNOT modify school-wide settings or user accounts</span>
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Parent Role</h4>
                <Badge>Consent-Based Viewer</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Parents can view their child's progress after admin approval and with proper consent.
              </p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Request access to student profiles (requires admin approval)</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>View child's assignments, grades, and classroom activity</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Configure notification preferences for assignment deadlines</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Manage consent for voice recording access</span>
                </p>
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span>CANNOT modify student work or assignments</span>
                </p>
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span>CANNOT access other students' data</span>
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Admin Role</h4>
                <Badge variant="destructive">Privileged Access</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                School administrators have elevated privileges for system management and oversight.
              </p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Manage all users, classrooms, and school-wide settings</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Approve/deny parental access requests</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>View security audit logs and system health</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Manage backup and data restoration requests</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Reset user passwords (with secure authentication)</span>
                </p>
                <p className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-amber-600" />
                  <span>All admin actions logged in security_audit_log</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Control Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Authentication Controls
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Email/Password Authentication:</span> Passwords hashed 
                    with bcrypt (cost factor 10+), minimum 8 characters required
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">JWT Session Management:</span> Short-lived access tokens 
                    (1 hour), refresh tokens rotated on use
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Leaked Password Detection:</span> Passwords checked against 
                    HaveIBeenPwned database before acceptance
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Email Verification:</span> Auto-confirm enabled for 
                    non-production; production requires email confirmation
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Session Security:</span> HttpOnly cookies, secure flag in 
                    production, automatic logout on token expiration
                  </div>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database Security Controls
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Row-Level Security (RLS):</span> All sensitive tables 
                    protected with RLS policies enforcing least-privilege access
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Security Definer Functions:</span> Privileged operations 
                    wrapped in security definer functions with server-side validation
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Prepared Statements:</span> All queries use parameterized 
                    statements to prevent SQL injection
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Data Masking:</span> Email addresses masked for non-admin 
                    viewers; PII protected in public views
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Audit Logging:</span> All sensitive data access logged to 
                    security_audit_log and aura_access_log tables
                  </div>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Network className="h-4 w-4" />
                Network and Transport Security
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">TLS 1.3:</span> All traffic encrypted in transit with TLS 1.3, 
                    HSTS enabled, certificate auto-renewal
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">API Security:</span> Edge functions authenticate via JWT, 
                    rate limiting enforced per endpoint
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">CORS Policy:</span> Strict CORS headers, only allowed origins 
                    can make API requests
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">DDoS Protection:</span> CDN-level DDoS mitigation, automatic 
                    traffic filtering and rate limiting
                  </div>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Application Security Controls
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Input Validation:</span> All user input validated with Zod 
                    schemas on frontend and backend
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">XSS Prevention:</span> React auto-escapes output, Content 
                    Security Policy headers enforced
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">CSRF Protection:</span> SameSite cookie attribute, token 
                    validation on state-changing operations
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Dependency Scanning:</span> Automated security scanning of 
                    npm packages, regular updates applied
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Secret Management:</span> API keys stored as Supabase secrets, 
                    never committed to version control
                  </div>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Data Protection and Privacy Controls
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Parental Consent:</span> Admin-approved parent-student links 
                    required before data access
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Voice Recording Consent:</span> Separate consent flag for 
                    accessing AURA voice analysis data
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Data Minimization:</span> Only essential student data collected; 
                    audio processed transiently and deleted
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Encryption at Rest:</span> Database and file storage encrypted 
                    with AES-256
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Backup Security:</span> Automated daily backups, cold storage 
                    backups with separate encryption
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <span className="font-medium">Data Retention:</span> 7-day retention for regular backups, 
                    automated cleanup of old data
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring and Incident Response */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Monitoring and Incident Response
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Security Monitoring</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Real-time error tracking and alerting via Supabase dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Failed authentication attempts logged and monitored</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Database query performance monitoring and alerting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Edge function execution logs retained for 7 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Security audit log reviewed weekly by security team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Automated backup health checks run daily</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Incident Response Process</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">1. Detection</p>
                  <p className="text-muted-foreground">Automated alerts, user reports, or security scans identify potential incidents</p>
                </div>
                <div>
                  <p className="font-medium mb-1">2. Initial Assessment (15 minutes)</p>
                  <p className="text-muted-foreground">Security lead evaluates severity, determines if incident response is needed</p>
                </div>
                <div>
                  <p className="font-medium mb-1">3. Containment (1 hour)</p>
                  <p className="text-muted-foreground">Isolate affected systems, prevent further damage, preserve evidence</p>
                </div>
                <div>
                  <p className="font-medium mb-1">4. Investigation (24 hours)</p>
                  <p className="text-muted-foreground">Review logs, identify root cause, determine scope of impact</p>
                </div>
                <div>
                  <p className="font-medium mb-1">5. Remediation (72 hours)</p>
                  <p className="text-muted-foreground">Apply fixes, update systems, verify security posture restored</p>
                </div>
                <div>
                  <p className="font-medium mb-1">6. Notification (As required)</p>
                  <p className="text-muted-foreground">Notify affected users, regulators per FERPA/COPPA requirements within 72 hours</p>
                </div>
                <div>
                  <p className="font-medium mb-1">7. Post-Incident Review (1 week)</p>
                  <p className="text-muted-foreground">Document lessons learned, update procedures, implement preventive measures</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance and Regulations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Regulatory Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">FERPA (Family Educational Rights and Privacy Act)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                NabuLearn handles student educational records subject to FERPA. The system implements 
                technical and administrative controls to ensure compliance.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Access limited to school officials with legitimate educational interest</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Parents can request access to student records (via admin approval process)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>All access to student records logged for audit purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Data not shared with third parties without consent (except service providers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Incident notification procedures align with FERPA requirements</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">COPPA (Children's Online Privacy Protection Act)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Students under 13 are protected by COPPA. The system implements verifiable parental consent 
                mechanisms for data collection and use.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Student accounts created by school officials, not self-registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Parental consent obtained via school district (school official exception)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Additional consent required for voice recording access</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Parents can review, modify, or delete child's data via admin requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Minimal data collection (only educational purpose data)</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4 bg-primary/5">
              <h4 className="font-semibold mb-3">Service Provider Compliance</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Third-party service providers (Supabase/Lovable Cloud, Google Cloud Platform) operate under 
                data processing agreements that ensure compliance with FERPA and COPPA.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Supabase: SOC 2 Type II certified, GDPR compliant, data processing agreement in place</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Google Cloud: FERPA compliant, Student Privacy Pledge signatory, DPA available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Resend (email): Minimal PII processed, DPA in place, GDPR compliant</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Change Management and Deployment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Development Workflow</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Code developed and tested in local Lovable development environment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Version control via Git (GitHub repository)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Code review required for security-sensitive changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Automated testing for critical user flows</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Database migrations reviewed and tested before production deployment</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Deployment Process</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Continuous deployment via Lovable platform (frontend)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Edge functions auto-deployed on commit to main branch</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Database migrations require explicit approval and execution</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Rollback capability via Git history and Supabase migration tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Deployment notifications sent to security team</span>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Emergency Changes</h4>
              <p className="text-sm text-muted-foreground mb-2">
                For security incidents or critical bugs:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Emergency change approval by security lead or CTO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Hotfix deployed immediately, followed by post-incident review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Change documentation updated within 24 hours</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Control */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Document Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Document Owner</p>
                <p className="text-muted-foreground">NabuLearn Security Team</p>
              </div>
              <div>
                <p className="font-medium">Review Frequency</p>
                <p className="text-muted-foreground">Quarterly (or upon significant system changes)</p>
              </div>
              <div>
                <p className="font-medium">Last Reviewed</p>
                <p className="text-muted-foreground">November 2025</p>
              </div>
              <div>
                <p className="font-medium">Next Review Date</p>
                <p className="text-muted-foreground">February 2026</p>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-muted-foreground">
              This document accurately describes the NabuLearn system as of the date above. 
              Changes to system architecture, data flows, or security controls trigger an update to this document.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 p-4 border rounded-lg bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          This System Description Document is prepared for SOC 2 Type 1 audit purposes. 
          For questions or clarifications, contact the NabuLearn Security Team.
        </p>
      </div>
    </div>
  );
};

export default SystemDescription;