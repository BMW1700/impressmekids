const ControlMatrix = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            SOC 2 Type I Control Matrix
          </h1>
          <p className="text-lg text-muted-foreground">
            Impress Me Kids - Educational Platform
          </p>
          <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold">Version:</span> 1.0
            </div>
            <div>
              <span className="font-semibold">Effective Date:</span> {new Date().toLocaleDateString()}
            </div>
            <div>
              <span className="font-semibold">Compliance Type:</span> SOC 2 Type I
            </div>
          </div>
        </div>

        {/* Trust Services Criteria Legend */}
        <div className="bg-muted/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Trust Services Criteria (TSC) Legend</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-background rounded p-4">
              <h3 className="font-bold text-primary mb-2">CC - Common Criteria</h3>
              <p className="text-sm text-muted-foreground">
                Foundational controls for security, availability, and confidentiality
              </p>
            </div>
            <div className="bg-background rounded p-4">
              <h3 className="font-bold text-primary mb-2">A - Availability</h3>
              <p className="text-sm text-muted-foreground">
                System availability and recovery
              </p>
            </div>
            <div className="bg-background rounded p-4">
              <h3 className="font-bold text-primary mb-2">PI - Processing Integrity</h3>
              <p className="text-sm text-muted-foreground">
                Accurate, complete, and timely processing
              </p>
            </div>
            <div className="bg-background rounded p-4">
              <h3 className="font-bold text-primary mb-2">C - Confidentiality</h3>
              <p className="text-sm text-muted-foreground">
                Protection of confidential information
              </p>
            </div>
            <div className="bg-background rounded p-4">
              <h3 className="font-bold text-primary mb-2">P - Privacy</h3>
              <p className="text-sm text-muted-foreground">
                Personal information protection (FERPA/COPPA)
              </p>
            </div>
          </div>
        </div>

        {/* Control Domains */}
        
        {/* 1. ORGANIZATIONAL CONTROLS */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            1. Organizational & Governance Controls
          </h2>

          <ControlCard
            controlId="ORG-001"
            controlTitle="Security Policy Documentation"
            tscCriteria={["CC1.1", "CC1.2", "CC1.3"]}
            controlDescription="Comprehensive security policies documented including Access Control, Password & MFA, Incident Response, Change Management"
            controlOwner="Security Team / Admin"
            frequency="Annual review"
            evidenceSources={[
              "Access Control Policy document",
              "Password & MFA Policy document",
              "Incident Response Policy document",
              "Change Management Policy document",
              "Policy review meeting minutes"
            ]}
            testingProcedures={[
              "Obtain and review all security policy documents",
              "Verify policies are approved by management",
              "Confirm annual review schedule exists",
              "Validate policies address SOC 2 requirements",
              "Check policy version control and distribution"
            ]}
          />

          <ControlCard
            controlId="ORG-002"
            controlTitle="Privacy Policy Documentation (FERPA/COPPA)"
            tscCriteria={["P1.1", "P2.1", "P3.1", "P4.1"]}
            controlDescription="Privacy policies compliant with FERPA and COPPA regulations for student data protection"
            controlOwner="Compliance Officer"
            frequency="Annual review"
            evidenceSources={[
              "Privacy Policy (public-facing)",
              "Terms of Service",
              "FERPA compliance documentation",
              "COPPA compliance documentation",
              "Parental consent forms and workflows"
            ]}
            testingProcedures={[
              "Review Privacy Policy for FERPA/COPPA compliance",
              "Verify parental consent mechanisms are documented",
              "Confirm data minimization practices",
              "Validate privacy notice provisions",
              "Check privacy policy accessibility on website"
            ]}
          />

          <ControlCard
            controlId="ORG-003"
            controlTitle="Role-Based Access Control (RBAC) Framework"
            tscCriteria={["CC6.1", "CC6.2", "CC6.3", "C1.1"]}
            controlDescription="Formal RBAC system with defined roles (Student, Teacher, Parent, Admin) and segregated permissions"
            controlOwner="Development Team"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "user_roles database table schema",
              "RLS policies in database",
              "Role definition documentation",
              "Access control matrix",
              "Code repository (role validation logic)"
            ]}
            testingProcedures={[
              "Review user_roles table structure and enum definitions",
              "Test role assignment process",
              "Verify least privilege implementation",
              "Validate role cannot be escalated client-side",
              "Confirm RLS policies enforce role boundaries"
            ]}
          />
        </div>

        {/* 2. ACCESS CONTROL */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            2. Access Control & Authentication
          </h2>

          <ControlCard
            controlId="ACC-001"
            controlTitle="Email/Password Authentication"
            tscCriteria={["CC6.1", "CC6.6", "C1.1"]}
            controlDescription="Supabase Auth with email verification, secure password storage (bcrypt hashing), and session management"
            controlOwner="Lovable Cloud (Supabase)"
            frequency="Continuous"
            evidenceSources={[
              "Supabase Auth configuration",
              "Email verification enabled setting",
              "Auto-confirm disabled for production",
              "Authentication logs",
              "Session token configuration"
            ]}
            testingProcedures={[
              "Verify email verification is enabled",
              "Confirm passwords are hashed (not plaintext)",
              "Test authentication flow",
              "Validate session expiration settings",
              "Check failed login attempt logging"
            ]}
          />

          <ControlCard
            controlId="ACC-002"
            controlTitle="Password Policy Enforcement"
            tscCriteria={["CC6.1", "C1.1"]}
            controlDescription="Minimum password requirements enforced: 8+ characters, complexity requirements, leaked password detection via HIBP"
            controlOwner="Lovable Cloud (Supabase)"
            frequency="Continuous"
            evidenceSources={[
              "Password policy configuration",
              "HIBP integration settings",
              "Password validation code",
              "Failed password attempt logs"
            ]}
            testingProcedures={[
              "Attempt to create account with weak password",
              "Test leaked password detection",
              "Verify minimum length enforcement",
              "Validate complexity requirements",
              "Check password reset flow security"
            ]}
          />

          <ControlCard
            controlId="ACC-003"
            controlTitle="Multi-Factor Authentication (MFA) Support"
            tscCriteria={["CC6.1", "CC6.2", "C1.1"]}
            controlDescription="MFA support available via Supabase Auth for privileged accounts (teachers, admins)"
            controlOwner="Lovable Cloud (Supabase)"
            frequency="Continuous"
            evidenceSources={[
              "MFA configuration in Supabase",
              "MFA enrollment documentation",
              "List of MFA-enabled accounts",
              "MFA enforcement policy"
            ]}
            testingProcedures={[
              "Verify MFA is enabled in Supabase settings",
              "Test MFA enrollment process",
              "Confirm MFA cannot be bypassed",
              "Validate backup code generation",
              "Check MFA audit logs"
            ]}
          />

          <ControlCard
            controlId="ACC-004"
            controlTitle="OAuth2 Social Login (Google)"
            tscCriteria={["CC6.1", "C1.1"]}
            controlDescription="OAuth2 authentication with Google as identity provider, reducing password exposure"
            controlOwner="Lovable Cloud (Supabase) + Google"
            frequency="Continuous"
            evidenceSources={[
              "OAuth2 provider configuration",
              "Google OAuth consent screen",
              "OAuth token validation code",
              "OAuth audit logs"
            ]}
            testingProcedures={[
              "Test Google OAuth login flow",
              "Verify token validation",
              "Confirm secure token storage",
              "Validate OAuth callback security",
              "Check scope limitations"
            ]}
          />

          <ControlCard
            controlId="ACC-005"
            controlTitle="Session Management & Timeout"
            tscCriteria={["CC6.1", "CC6.3", "C1.1"]}
            controlDescription="JWT-based sessions with automatic expiration, secure storage, and proper logout"
            controlOwner="Lovable Cloud (Supabase)"
            frequency="Continuous"
            evidenceSources={[
              "JWT configuration",
              "Session timeout settings",
              "Token refresh logic",
              "Logout implementation code"
            ]}
            testingProcedures={[
              "Verify session timeout is configured",
              "Test automatic session expiration",
              "Confirm logout clears session",
              "Validate JWT signature verification",
              "Check session cannot be reused after logout"
            ]}
          />
        </div>

        {/* 3. DATABASE SECURITY */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            3. Database Security Controls
          </h2>

          <ControlCard
            controlId="DB-001"
            controlTitle="Row-Level Security (RLS) Policies"
            tscCriteria={["CC6.1", "CC6.2", "C1.1", "P4.1"]}
            controlDescription="RLS enabled on all sensitive tables ensuring users can only access their own data or data they're authorized to view"
            controlOwner="Development Team"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "Database RLS policy definitions",
              "RLS linter scan results",
              "Table security configuration",
              "Code repository (migration files)"
            ]}
            testingProcedures={[
              "Run database linter to verify all tables have RLS",
              "Attempt unauthorized data access as different roles",
              "Review RLS policy logic for correctness",
              "Validate teacher cannot access other teacher's data",
              "Confirm students can only see their own submissions"
            ]}
          />

          <ControlCard
            controlId="DB-002"
            controlTitle="Database Encryption at Rest"
            tscCriteria={["CC6.1", "C1.2", "P4.1"]}
            controlDescription="All database data encrypted at rest using AES-256 encryption (managed by Supabase/PostgreSQL)"
            controlOwner="Lovable Cloud (Supabase)"
            frequency="Continuous"
            evidenceSources={[
              "Supabase encryption documentation",
              "Database configuration",
              "Compliance certifications (Supabase SOC 2)"
            ]}
            testingProcedures={[
              "Review Supabase encryption documentation",
              "Verify encryption is enabled in database settings",
              "Obtain Supabase SOC 2 report confirming encryption",
              "Validate encryption keys are managed properly"
            ]}
          />

          <ControlCard
            controlId="DB-003"
            controlTitle="Database Connection Encryption (TLS)"
            tscCriteria={["CC6.1", "CC6.7", "C1.2"]}
            controlDescription="All database connections use TLS 1.2+ encryption for data in transit"
            controlOwner="Lovable Cloud (Supabase)"
            frequency="Continuous"
            evidenceSources={[
              "Supabase connection string configuration",
              "TLS certificate",
              "Database connection logs"
            ]}
            testingProcedures={[
              "Inspect database connection string for SSL/TLS",
              "Verify TLS version is 1.2 or higher",
              "Confirm certificate validity",
              "Test connection fails without TLS"
            ]}
          />

          <ControlCard
            controlId="DB-004"
            controlTitle="Security Definer Functions"
            tscCriteria={["CC6.2", "CC6.3", "C1.1"]}
            controlDescription="Database functions use SECURITY DEFINER appropriately to prevent RLS recursion while maintaining security boundaries"
            controlOwner="Development Team"
            frequency="Code review for each deployment"
            evidenceSources={[
              "Database function definitions",
              "Code review documentation",
              "Function security audit",
              "Deployment logs"
            ]}
            testingProcedures={[
              "Review all SECURITY DEFINER functions",
              "Verify each function has proper authorization checks",
              "Test functions cannot be exploited for privilege escalation",
              "Confirm functions follow least privilege",
              "Validate input sanitization in functions"
            ]}
          />

          <ControlCard
            controlId="DB-005"
            controlTitle="Foreign Key Constraints & Referential Integrity"
            tscCriteria={["PI1.1", "PI1.3"]}
            controlDescription="Foreign key constraints enforce referential integrity and prevent orphaned records"
            controlOwner="Development Team"
            frequency="Database migration review"
            evidenceSources={[
              "Database schema with FK definitions",
              "Migration files",
              "Database integrity reports"
            ]}
            testingProcedures={[
              "Review database schema for FK constraints",
              "Attempt to create orphaned records",
              "Verify cascade delete behavior is appropriate",
              "Check constraint violations are logged",
              "Validate all relationships have constraints"
            ]}
          />

          <ControlCard
            controlId="DB-006"
            controlTitle="Automated Database Backups"
            tscCriteria={["A1.2", "A1.3", "CC7.4"]}
            controlDescription="Automated daily backups with point-in-time recovery capability"
            controlOwner="Lovable Cloud (Supabase)"
            frequency="Daily (automated)"
            evidenceSources={[
              "Backup configuration",
              "Backup logs",
              "Point-in-time recovery settings",
              "Backup retention policy"
            ]}
            testingProcedures={[
              "Review backup schedule configuration",
              "Verify backups are completing successfully",
              "Test point-in-time recovery capability",
              "Confirm backup retention period",
              "Validate backup encryption"
            ]}
          />

          <ControlCard
            controlId="DB-007"
            controlTitle="Cold Storage Backup System"
            tscCriteria={["A1.2", "A1.3", "CC7.4"]}
            controlDescription="Manual cold storage backup system for long-term archival with encryption and audit logging"
            controlOwner="Admin Team"
            frequency="On-demand (manual)"
            evidenceSources={[
              "cold_storage_backups table records",
              "backup_audit_log entries",
              "Backup restoration request workflow",
              "Edge functions (create-cold-storage-backup, list-cold-storage-backups)"
            ]}
            testingProcedures={[
              "Review backup audit log for backup creation events",
              "Verify backups are encrypted (encryption_method field)",
              "Test backup listing functionality",
              "Validate restoration request workflow",
              "Confirm backup metadata includes record counts"
            ]}
          />

          <ControlCard
            controlId="DB-008"
            controlTitle="Backup Cleanup & Retention"
            tscCriteria={["A1.2", "CC7.5", "P4.2"]}
            controlDescription="Automated cleanup of old backups via scheduled cron job with configurable retention period"
            controlOwner="System (Automated)"
            frequency="Daily at 2 AM UTC"
            evidenceSources={[
              "pg_cron job configuration",
              "cleanup-old-backups edge function",
              "backup_audit_log cleanup entries",
              "CRON_SECRET authentication"
            ]}
            testingProcedures={[
              "Review pg_cron schedule configuration",
              "Verify cleanup function runs successfully",
              "Check audit log for cleanup events",
              "Confirm CRON_SECRET is required for authentication",
              "Validate retention period is enforced"
            ]}
          />
        </div>

        {/* 4. APPLICATION SECURITY */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            4. Application Security Controls
          </h2>

          <ControlCard
            controlId="APP-001"
            controlTitle="Input Validation & Sanitization"
            tscCriteria={["CC7.2", "PI1.1", "PI1.2"]}
            controlDescription="All user inputs validated using Zod schemas and React Hook Form before processing"
            controlOwner="Development Team"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "Zod schema definitions in codebase",
              "Form validation code",
              "API input validation in edge functions",
              "Code review records"
            ]}
            testingProcedures={[
              "Review form components for validation schemas",
              "Test form submission with invalid data",
              "Verify API endpoints validate inputs",
              "Attempt SQL injection and XSS attacks",
              "Confirm error messages don't leak sensitive info"
            ]}
          />

          <ControlCard
            controlId="APP-002"
            controlTitle="SQL Injection Prevention"
            tscCriteria={["CC7.2", "C1.1"]}
            controlDescription="Parameterized queries and Supabase client library prevent SQL injection attacks"
            controlOwner="Development Team"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "Code repository (database query patterns)",
              "Security code review checklist",
              "Static code analysis results"
            ]}
            testingProcedures={[
              "Review all database queries for parameterization",
              "Attempt SQL injection attacks on forms",
              "Verify no raw SQL concatenation exists",
              "Test edge function database calls",
              "Run automated SQL injection scanner"
            ]}
          />

          <ControlCard
            controlId="APP-003"
            controlTitle="Cross-Site Scripting (XSS) Prevention"
            tscCriteria={["CC7.2", "C1.1"]}
            controlDescription="React's built-in XSS protection through JSX auto-escaping, no dangerouslySetInnerHTML usage"
            controlOwner="Development Team"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "Code repository (component implementations)",
              "Code review focusing on XSS vectors",
              "Static code analysis results"
            ]}
            testingProcedures={[
              "Search codebase for dangerouslySetInnerHTML",
              "Attempt XSS attacks via form inputs",
              "Test rich text inputs for script injection",
              "Verify user-generated content is escaped",
              "Run automated XSS vulnerability scanner"
            ]}
          />

          <ControlCard
            controlId="APP-004"
            controlTitle="Content Security Policy (CSP)"
            tscCriteria={["CC7.2", "C1.1"]}
            controlDescription="CSP headers restrict resource loading and prevent XSS attacks"
            controlOwner="Development Team"
            frequency="Deployment configuration"
            evidenceSources={[
              "index.html meta CSP tags",
              "HTTP security headers configuration",
              "Browser console CSP violation logs"
            ]}
            testingProcedures={[
              "Review CSP configuration in index.html",
              "Verify CSP headers are present in HTTP responses",
              "Test that inline scripts are blocked",
              "Confirm external script sources are whitelisted",
              "Check CSP violation reporting"
            ]}
          />

          <ControlCard
            controlId="APP-005"
            controlTitle="HTTPS/TLS Enforcement"
            tscCriteria={["CC6.1", "CC6.7", "C1.2"]}
            controlDescription="All application traffic encrypted via HTTPS with TLS 1.2+ enforced"
            controlOwner="Lovable Cloud (Hosting)"
            frequency="Continuous"
            evidenceSources={[
              "TLS certificate",
              "HTTPS redirect configuration",
              "SSL Labs test results",
              "Browser security indicators"
            ]}
            testingProcedures={[
              "Verify all pages load over HTTPS",
              "Test HTTP requests are redirected to HTTPS",
              "Check TLS version is 1.2 or higher",
              "Validate certificate is valid and trusted",
              "Run SSL Labs scan for A+ rating"
            ]}
          />

          <ControlCard
            controlId="APP-006"
            controlTitle="Secret Management"
            tscCriteria={["CC6.6", "C1.2"]}
            controlDescription="API keys and secrets stored securely in Supabase Vault, never in code or client-side"
            controlOwner="Development Team"
            frequency="Continuous"
            evidenceSources={[
              "Supabase secrets configuration",
              "Environment variable management",
              "Code repository (no secrets committed)",
              "Secret rotation logs"
            ]}
            testingProcedures={[
              "Search codebase for hardcoded secrets",
              "Verify secrets are accessed via edge functions only",
              "Confirm client-side code doesn't contain API keys",
              "Test secret rotation procedures",
              "Validate .env files are gitignored"
            ]}
          />

          <ControlCard
            controlId="APP-007"
            controlTitle="Error Handling & Logging"
            tscCriteria={["CC7.2", "CC7.4", "PI1.5"]}
            controlDescription="Errors logged securely without exposing sensitive data, with proper error boundaries in React"
            controlOwner="Development Team"
            frequency="Continuous"
            evidenceSources={[
              "Error handling code",
              "Error boundary implementations",
              "Application logs",
              "Error monitoring configuration"
            ]}
            testingProcedures={[
              "Trigger errors and review error messages",
              "Verify stack traces aren't exposed to users",
              "Confirm sensitive data isn't logged",
              "Test error boundaries catch errors",
              "Validate error logs are accessible to admins"
            ]}
          />
        </div>

        {/* 5. DATA PRIVACY & PROTECTION */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            5. Data Privacy & Protection (FERPA/COPPA)
          </h2>

          <ControlCard
            controlId="PRIV-001"
            controlTitle="Parental Consent for Voice Recordings"
            tscCriteria={["P3.1", "P3.2", "P4.1", "C1.1"]}
            controlDescription="Parental consent required and tracked before students can submit voice recordings (COPPA compliance)"
            controlOwner="Application Logic"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "parent_consents table",
              "Consent tracking logic in code",
              "Consent forms (UI components)",
              "Audit logs for consent grants"
            ]}
            testingProcedures={[
              "Attempt to submit voice recording without consent",
              "Verify consent is tracked in parent_consents table",
              "Test consent revocation prevents recording access",
              "Confirm consent date is recorded",
              "Validate consent applies per student-parent pair"
            ]}
          />

          <ControlCard
            controlId="PRIV-002"
            controlTitle="Student Voice Recording Access Control"
            tscCriteria={["C1.1", "P4.1", "CC6.2"]}
            controlDescription="Voice recordings restricted: students see only their own, teachers see only with parental consent"
            controlOwner="Database RLS + Application Logic"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "aura_records table RLS policies",
              "has_aura_consent() database function",
              "aura_access_log table entries",
              "Storage bucket policies (aura-audio)"
            ]}
            testingProcedures={[
              "Test student can access their own recordings",
              "Verify teacher cannot access without consent",
              "Attempt cross-student recording access (should fail)",
              "Check aura_access_log for access audit trail",
              "Validate signed URL generation for audio files"
            ]}
          />

          <ControlCard
            controlId="PRIV-003"
            controlTitle="Teacher Notes Privacy"
            tscCriteria={["C1.1", "P4.1", "CC6.2"]}
            controlDescription="Teacher notes on students are private and only accessible to the authoring teacher"
            controlOwner="Database RLS"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "teacher_notes table RLS policies",
              "Code accessing teacher notes",
              "RLS linter results"
            ]}
            testingProcedures={[
              "Test teacher can view their own notes",
              "Verify other teachers cannot access notes",
              "Confirm students cannot see teacher notes",
              "Attempt admin access to teacher notes",
              "Validate notes are encrypted at rest"
            ]}
          />

          <ControlCard
            controlId="PRIV-004"
            controlTitle="Assignment Draft Privacy"
            tscCriteria={["C1.1", "PI1.1", "CC6.2"]}
            controlDescription="Draft assignments (is_posted=false) are hidden from students until published by teacher"
            controlOwner="Database RLS + Application Logic"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "assignments table RLS policies",
              "is_posted flag logic",
              "Student dashboard query filters"
            ]}
            testingProcedures={[
              "Create draft assignment and verify student cannot see it",
              "Publish assignment and confirm student visibility",
              "Test RLS policy prevents draft access",
              "Validate is_posted flag defaults to false"
            ]}
          />

          <ControlCard
            controlId="PRIV-005"
            controlTitle="Grade Release Control"
            tscCriteria={["C1.1", "P4.1", "PI1.1"]}
            controlDescription="Grades only visible to students after teacher has graded and marked submission as complete"
            controlOwner="Application Logic"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "assignment_submissions table",
              "Status field logic (draft/submitted/graded)",
              "Grade visibility code"
            ]}
            testingProcedures={[
              "Submit assignment and verify grade is null",
              "Grade submission and check status update",
              "Confirm student sees grade only after graded status",
              "Test grade field is hidden in draft/submitted states"
            ]}
          />

          <ControlCard
            controlId="PRIV-006"
            controlTitle="Parent Access Approval Workflow"
            tscCriteria={["P3.1", "P4.1", "CC6.2"]}
            controlDescription="Parents must request and receive approval (from admin/teacher) before viewing student data"
            controlOwner="Application Logic"
            frequency="Continuous (code-enforced)"
            evidenceSources={[
              "parent_access_requests table",
              "parent_student_links table (approved field)",
              "Approval workflow UI components",
              "Access request audit logs"
            ]}
            testingProcedures={[
              "Create parent account and request student access",
              "Verify access is denied until approved",
              "Approve request and test data access is granted",
              "Test unapproved parent cannot see student data",
              "Validate approval audit trail exists"
            ]}
          />

          <ControlCard
            controlId="PRIV-007"
            controlTitle="Data Minimization & Retention"
            tscCriteria={["P4.2", "C1.2", "CC7.5"]}
            controlDescription="Only necessary student data collected, retention policies defined, unused data purged"
            controlOwner="Data Governance Team"
            frequency="Quarterly review"
            evidenceSources={[
              "Data collection inventory",
              "Data retention policy document",
              "Backup cleanup logs (cleanup-old-backups)",
              "Data purge procedures"
            ]}
            testingProcedures={[
              "Review database schema for unnecessary PII fields",
              "Verify retention policies are documented",
              "Confirm old backups are automatically deleted",
              "Test data purge procedures",
              "Validate data collection justification exists"
            ]}
          />

          <ControlCard
            controlId="PRIV-008"
            controlTitle="Audit Logging for Sensitive Data Access"
            tscCriteria={["CC7.3", "P4.1", "C1.1"]}
            controlDescription="All access to student voice recordings and profiles logged in aura_access_log and security_audit_log"
            controlOwner="Application Logic"
            frequency="Continuous (automated)"
            evidenceSources={[
              "aura_access_log table entries",
              "security_audit_log table entries",
              "log_aura_access() function",
              "Audit log review reports"
            ]}
            testingProcedures={[
              "Access student recording and verify log entry created",
              "Review aura_access_log for access patterns",
              "Confirm IP address and user agent logged",
              "Test audit logs are immutable (prevent_audit_log_modification trigger)",
              "Validate log retention period"
            ]}
          />
        </div>

        {/* 6. THIRD-PARTY VENDOR CONTROLS */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            6. Third-Party Vendor & AI Controls
          </h2>

          <ControlCard
            controlId="VEND-001"
            controlTitle="Google Vertex AI Security Controls"
            tscCriteria={["CC9.1", "CC9.2", "C1.1", "P4.1"]}
            controlDescription="Google Vertex AI used for voice transcription and analysis with appropriate security controls"
            controlOwner="Google Cloud Platform (Inherited)"
            frequency="Continuous"
            evidenceSources={[
              "Google Vertex AI Security Controls document",
              "Service account key (GOOGLE_VERTEX_AI_KEY)",
              "API call logs from analyze-aura edge function",
              "Google Cloud audit logs",
              "GCP SOC 2 report"
            ]}
            testingProcedures={[
              "Review Google Vertex AI Security Controls document",
              "Verify service account has minimal required permissions",
              "Confirm data sent to Vertex AI is encrypted in transit",
              "Validate API keys are stored in Supabase Vault",
              "Obtain Google Cloud SOC 2 report"
            ]}
          />

          <ControlCard
            controlId="VEND-002"
            controlTitle="Supabase/Lovable Cloud SOC 2 Compliance"
            tscCriteria={["CC9.1", "CC9.2"]}
            controlDescription="Supabase (Lovable Cloud provider) maintains SOC 2 Type II certification"
            controlOwner="Supabase (Inherited)"
            frequency="Annual (SOC 2 audit cycle)"
            evidenceSources={[
              "Supabase SOC 2 Type II report",
              "Service Level Agreement (SLA)",
              "Supabase security documentation"
            ]}
            testingProcedures={[
              "Obtain current Supabase SOC 2 report",
              "Review Supabase security certifications",
              "Verify SLA includes security commitments",
              "Confirm Supabase encryption standards meet requirements"
            ]}
          />

          <ControlCard
            controlId="VEND-003"
            controlTitle="API Key & Service Account Security"
            tscCriteria={["CC6.6", "C1.2"]}
            controlDescription="API keys for Google Vertex AI, OpenAI Whisper stored securely in Supabase Vault, rotated periodically"
            controlOwner="DevOps / Security Team"
            frequency="Quarterly rotation"
            evidenceSources={[
              "Supabase Vault secrets list",
              "Secret rotation logs",
              "Access logs for secret retrieval",
              "Key management procedures"
            ]}
            testingProcedures={[
              "Verify API keys are in Supabase Vault (not in code)",
              "Test key rotation procedure",
              "Confirm old keys are revoked after rotation",
              "Validate access to secrets is logged",
              "Check secrets are not exposed in client-side code"
            ]}
          />

          <ControlCard
            controlId="VEND-004"
            controlTitle="Data Processing Agreement (DPA) with Vendors"
            tscCriteria={["CC9.1", "P3.2", "C1.1"]}
            controlDescription="DPAs in place with Google Cloud and Supabase covering data processing, security, and compliance"
            controlOwner="Legal / Compliance Team"
            frequency="Annual review"
            evidenceSources={[
              "Google Cloud DPA (signed)",
              "Supabase DPA (signed)",
              "Vendor contract review logs"
            ]}
            testingProcedures={[
              "Obtain signed DPA from Google Cloud",
              "Obtain signed DPA from Supabase",
              "Review DPAs for FERPA/COPPA compliance terms",
              "Verify data deletion obligations are included",
              "Confirm DPAs are reviewed annually"
            ]}
          />
        </div>

        {/* 7. AVAILABILITY & DISASTER RECOVERY */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            7. Availability & Disaster Recovery
          </h2>

          <ControlCard
            controlId="AVAIL-001"
            controlTitle="System Uptime Monitoring"
            tscCriteria={["A1.1", "CC7.1"]}
            controlDescription="Uptime monitoring via Lovable Cloud with automatic alerting for downtime"
            controlOwner="Lovable Cloud (Hosting)"
            frequency="Continuous"
            evidenceSources={[
              "Uptime monitoring dashboard",
              "Incident response logs",
              "SLA uptime reports"
            ]}
            testingProcedures={[
              "Review uptime monitoring configuration",
              "Verify alerting is enabled for downtime",
              "Test alert delivery to on-call team",
              "Confirm SLA meets 99.9% uptime target"
            ]}
          />

          <ControlCard
            controlId="AVAIL-002"
            controlTitle="Database High Availability"
            tscCriteria={["A1.2", "CC9.2"]}
            controlDescription="Supabase provides high-availability database with automatic failover"
            controlOwner="Lovable Cloud (Supabase)"
            frequency="Continuous"
            evidenceSources={[
              "Supabase HA configuration",
              "Failover test results",
              "Database replication settings"
            ]}
            testingProcedures={[
              "Review Supabase HA architecture documentation",
              "Verify database replication is enabled",
              "Confirm automatic failover is configured",
              "Test recovery time objective (RTO) is documented"
            ]}
          />

          <ControlCard
            controlId="AVAIL-003"
            controlTitle="Disaster Recovery Plan"
            tscCriteria={["A1.2", "A1.3", "CC7.4", "CC7.5"]}
            controlDescription="Documented disaster recovery procedures including backup restoration and communication plan"
            controlOwner="IT / Security Team"
            frequency="Annual review & testing"
            evidenceSources={[
              "Disaster Recovery Plan document",
              "DR test results",
              "Backup restoration logs",
              "Communication plan"
            ]}
            testingProcedures={[
              "Review DR plan document",
              "Verify plan includes backup restoration steps",
              "Confirm communication procedures are documented",
              "Test DR plan annually",
              "Validate RTO and RPO are defined and achievable"
            ]}
          />

          <ControlCard
            controlId="AVAIL-004"
            controlTitle="Backup Restoration Testing"
            tscCriteria={["A1.3", "CC7.4"]}
            controlDescription="Quarterly backup restoration tests to verify recoverability"
            controlOwner="DevOps Team"
            frequency="Quarterly"
            evidenceSources={[
              "Backup restoration test logs",
              "Test results documentation",
              "Data validation reports"
            ]}
            testingProcedures={[
              "Perform quarterly backup restoration to test environment",
              "Verify data integrity after restoration",
              "Document restoration time and any issues",
              "Confirm restoration meets RPO/RTO requirements"
            ]}
          />
        </div>

        {/* 8. CHANGE MANAGEMENT & DEPLOYMENT */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            8. Change Management & Deployment Controls
          </h2>

          <ControlCard
            controlId="CHG-001"
            controlTitle="Change Management Policy"
            tscCriteria={["CC8.1", "PI1.3"]}
            controlDescription="Documented change management process for all code and infrastructure changes"
            controlOwner="Development Team"
            frequency="Every deployment"
            evidenceSources={[
              "Change Management Policy document",
              "Deployment logs",
              "Code review records",
              "Approval documentation"
            ]}
            testingProcedures={[
              "Review Change Management Policy",
              "Verify all changes require approval",
              "Confirm changes are documented in logs",
              "Test emergency change procedures exist",
              "Validate rollback procedures are documented"
            ]}
          />

          <ControlCard
            controlId="CHG-002"
            controlTitle="Code Review Process"
            tscCriteria={["CC8.1", "PI1.3", "CC7.2"]}
            controlDescription="All code changes reviewed by at least one other developer before deployment"
            controlOwner="Development Team"
            frequency="Every code change"
            evidenceSources={[
              "GitHub pull request history",
              "Code review comments",
              "Approval records in Git"
            ]}
            testingProcedures={[
              "Review recent pull requests for approval",
              "Verify no direct commits to main branch",
              "Confirm security review checklist is used",
              "Test that unapproved code cannot be deployed"
            ]}
          />

          <ControlCard
            controlId="CHG-003"
            controlTitle="Database Migration Review"
            tscCriteria={["CC8.1", "PI1.3", "A1.2"]}
            controlDescription="Database schema changes reviewed and tested before production deployment"
            controlOwner="Development Team"
            frequency="Every database migration"
            evidenceSources={[
              "Migration files in supabase/migrations/",
              "Migration review documentation",
              "Rollback procedures"
            ]}
            testingProcedures={[
              "Review all migration files for security issues",
              "Verify migrations are tested in staging first",
              "Confirm rollback plan exists for each migration",
              "Test migrations don't break RLS policies",
              "Validate migrations maintain data integrity"
            ]}
          />

          <ControlCard
            controlId="CHG-004"
            controlTitle="Automated Testing & CI/CD"
            tscCriteria={["PI1.3", "CC8.1"]}
            controlDescription="Automated testing pipeline validates changes before deployment"
            controlOwner="Development Team"
            frequency="Every code commit"
            evidenceSources={[
              "CI/CD pipeline configuration",
              "Test results logs",
              "Build success/failure reports"
            ]}
            testingProcedures={[
              "Review CI/CD configuration",
              "Verify tests run on every commit",
              "Confirm failed tests block deployment",
              "Test coverage meets minimum threshold"
            ]}
          />

          <ControlCard
            controlId="CHG-005"
            controlTitle="Deployment Logging & Audit Trail"
            tscCriteria={["CC7.3", "CC8.1"]}
            controlDescription="All deployments logged with timestamp, deployer, and changes included"
            controlOwner="Lovable Cloud / Development Team"
            frequency="Every deployment"
            evidenceSources={[
              "Deployment logs",
              "Git commit history",
              "Change log documentation"
            ]}
            testingProcedures={[
              "Review deployment logs for completeness",
              "Verify deployer identity is recorded",
              "Confirm deployment timestamp is accurate",
              "Test logs are retained per policy"
            ]}
          />
        </div>

        {/* 9. INCIDENT RESPONSE */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            9. Incident Response & Security Monitoring
          </h2>

          <ControlCard
            controlId="INC-001"
            controlTitle="Incident Response Policy"
            tscCriteria={["CC7.3", "CC7.4", "CC7.5"]}
            controlDescription="Documented incident response procedures covering detection, containment, investigation, and recovery"
            controlOwner="Security Team"
            frequency="Annual review"
            evidenceSources={[
              "Incident Response Policy document",
              "Incident response playbooks",
              "Incident logs",
              "Post-incident review reports"
            ]}
            testingProcedures={[
              "Review Incident Response Policy",
              "Verify incident classification criteria exist",
              "Confirm escalation procedures are documented",
              "Test incident response plan via tabletop exercise",
              "Validate communication templates exist"
            ]}
          />

          <ControlCard
            controlId="INC-002"
            controlTitle="Security Monitoring & Alerting"
            tscCriteria={["CC7.2", "CC7.3"]}
            controlDescription="Monitoring of failed login attempts, unusual access patterns, and errors"
            controlOwner="Security Team / Lovable Cloud"
            frequency="Continuous"
            evidenceSources={[
              "Security monitoring logs",
              "Failed login attempt logs",
              "Access pattern analysis",
              "Alert configuration"
            ]}
            testingProcedures={[
              "Review security monitoring configuration",
              "Test alerting triggers for failed logins",
              "Verify unusual access patterns are detected",
              "Confirm alerts are sent to security team",
              "Validate log retention meets requirements"
            ]}
          />

          <ControlCard
            controlId="INC-003"
            controlTitle="Breach Notification Procedures"
            tscCriteria={["CC7.4", "P6.1", "P6.2"]}
            controlDescription="Procedures for notifying affected parties within required timeframes per FERPA/COPPA"
            controlOwner="Compliance / Legal Team"
            frequency="As needed (incident-driven)"
            evidenceSources={[
              "Breach notification procedures",
              "FERPA/COPPA notification requirements",
              "Incident communication templates",
              "Notification logs"
            ]}
            testingProcedures={[
              "Review breach notification procedures",
              "Verify FERPA/COPPA requirements are addressed",
              "Confirm notification timeframes are documented",
              "Test notification templates exist",
              "Validate escalation to legal/compliance team"
            ]}
          />

          <ControlCard
            controlId="INC-004"
            controlTitle="Security Incident Post-Mortem"
            tscCriteria={["CC7.5", "PI1.5"]}
            controlDescription="Post-incident reviews conducted to identify root causes and preventive measures"
            controlOwner="Security Team"
            frequency="After each incident"
            evidenceSources={[
              "Post-incident review reports",
              "Root cause analysis",
              "Corrective action plans",
              "Lessons learned documentation"
            ]}
            testingProcedures={[
              "Review post-incident reports for completeness",
              "Verify root cause analysis is performed",
              "Confirm corrective actions are documented",
              "Test corrective actions are tracked to completion",
              "Validate lessons learned are shared with team"
            ]}
          />
        </div>

        {/* Summary */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Control Matrix Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Total Controls</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">CC, A, PI, C, P</div>
              <div className="text-sm text-muted-foreground">TSC Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">9</div>
              <div className="text-sm text-muted-foreground">Control Domains</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">SOC 2 Type I</div>
              <div className="text-sm text-muted-foreground">Certification Target</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Control Card Component
interface ControlCardProps {
  controlId: string;
  controlTitle: string;
  tscCriteria: string[];
  controlDescription: string;
  controlOwner: string;
  frequency: string;
  evidenceSources: string[];
  testingProcedures: string[];
}

const ControlCard = ({
  controlId,
  controlTitle,
  tscCriteria,
  controlDescription,
  controlOwner,
  frequency,
  evidenceSources,
  testingProcedures,
}: ControlCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-mono font-bold rounded">
              {controlId}
            </span>
            <h3 className="text-xl font-bold text-foreground">{controlTitle}</h3>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tscCriteria.map((criteria) => (
              <span
                key={criteria}
                className="px-2 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded"
              >
                {criteria}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground">{controlDescription}</p>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <span className="text-sm font-semibold text-foreground">Control Owner:</span>
          <p className="text-sm text-muted-foreground">{controlOwner}</p>
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">Frequency:</span>
          <p className="text-sm text-muted-foreground">{frequency}</p>
        </div>
      </div>

      {/* Evidence Sources */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-2">Evidence Sources:</h4>
        <ul className="space-y-1">
          {evidenceSources.map((source, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{source}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Testing Procedures */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-2">Testing Procedures:</h4>
        <ol className="space-y-1">
          {testingProcedures.map((procedure, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary font-semibold min-w-[20px]">{idx + 1}.</span>
              <span>{procedure}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default ControlMatrix;