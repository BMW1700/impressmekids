export default function DataClassificationPolicy() {
  return (
    <div className="policy-document">
      <header className="policy-header">
        <h1>Data Classification & Handling Policy</h1>
        <div className="policy-meta">
          <p><strong>Document Owner:</strong> Chief Information Security Officer</p>
          <p><strong>Effective Date:</strong> January 1, 2025</p>
          <p><strong>Last Reviewed:</strong> January 1, 2025</p>
          <p><strong>Next Review:</strong> January 1, 2026</p>
          <p><strong>Version:</strong> 1.0</p>
        </div>
      </header>

      <section className="policy-section">
        <h2>1. Purpose & Scope</h2>
        
        <h3>1.1 Purpose</h3>
        <p>
          This Data Classification & Handling Policy establishes standards for classifying, labeling, 
          handling, storing, transmitting, and disposing of data assets at Impress Me Kids. The policy 
          ensures appropriate protection of sensitive information, particularly student Personally 
          Identifiable Information (PII), educational records, and audio recordings, in compliance with 
          FERPA, COPPA, and SOC 2 requirements.
        </p>

        <h3>1.2 Scope</h3>
        <p>This policy applies to:</p>
        <ul>
          <li>All data created, collected, processed, stored, or transmitted by Impress Me Kids systems</li>
          <li>All employees, contractors, vendors, and third parties with access to company data</li>
          <li>All storage locations (cloud infrastructure, databases, file systems, backups)</li>
          <li>All transmission methods (APIs, web interfaces, mobile applications, email)</li>
          <li>All data lifecycle stages (collection, processing, storage, transmission, archival, disposal)</li>
        </ul>

        <h3>1.3 Policy Statement</h3>
        <p>
          Impress Me Kids is committed to protecting the confidentiality, integrity, and availability 
          of all data entrusted to us. We classify data based on sensitivity and regulatory requirements, 
          implementing controls proportionate to the classification level. Student data privacy is our 
          highest priority, and we maintain strict compliance with FERPA and COPPA regulations.
        </p>
      </section>

      <section className="policy-section">
        <h2>2. Data Classification Levels</h2>
        
        <h3>2.1 Classification Framework</h3>
        <p>All data is classified into four levels based on sensitivity and regulatory requirements:</p>

        <div className="classification-table">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Description</th>
                <th>Examples</th>
                <th>Impact if Compromised</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>RESTRICTED</strong></td>
                <td>Highest sensitivity. Legally protected. Unauthorized access causes severe harm.</td>
                <td>Student PII, SSNs, health data, parent financial info, authentication credentials</td>
                <td>Legal liability, regulatory penalties, severe reputational damage, identity theft</td>
              </tr>
              <tr>
                <td><strong>CONFIDENTIAL</strong></td>
                <td>Sensitive business or educational data. Unauthorized access causes significant harm.</td>
                <td>Student grades, assessment results, teacher evaluations, audio recordings, behavioral data</td>
                <td>Privacy violations, regulatory non-compliance, moderate reputational damage</td>
              </tr>
              <tr>
                <td><strong>INTERNAL</strong></td>
                <td>Internal use only. Unauthorized access causes minor harm.</td>
                <td>Classroom rosters, curriculum materials, internal reports, system logs</td>
                <td>Minor privacy concerns, competitive disadvantage</td>
              </tr>
              <tr>
                <td><strong>PUBLIC</strong></td>
                <td>Approved for public disclosure. No harm if disclosed.</td>
                <td>Marketing materials, public website content, press releases, help documentation</td>
                <td>No harm expected</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>2.2 Classification Decision Tree</h3>
        <p>To classify data, answer these questions in order:</p>
        <ol>
          <li><strong>Does it identify an individual student or contain legally protected information?</strong>
            <ul>
              <li>Yes → RESTRICTED</li>
              <li>No → Continue to next question</li>
            </ul>
          </li>
          <li><strong>Is it educational records or sensitive assessment data?</strong>
            <ul>
              <li>Yes → CONFIDENTIAL</li>
              <li>No → Continue to next question</li>
            </ul>
          </li>
          <li><strong>Is it internal business data not intended for public disclosure?</strong>
            <ul>
              <li>Yes → INTERNAL</li>
              <li>No → PUBLIC</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className="policy-section">
        <h2>3. Data Inventory & Categorization</h2>
        
        <h3>3.1 Student PII (RESTRICTED)</h3>
        <p><strong>Definition:</strong> Information that directly identifies a student or can be used to identify a student when combined with other data.</p>
        
        <p><strong>Data Elements:</strong></p>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Date of birth</li>
          <li>Student ID numbers</li>
          <li>IP addresses associated with student accounts</li>
          <li>Biometric data (voice recordings when identifiable)</li>
          <li>Parent/guardian contact information</li>
          <li>Home address</li>
          <li>Phone numbers</li>
        </ul>

        <p><strong>Storage Locations:</strong></p>
        <ul>
          <li><code>profiles</code> table (name, email)</li>
          <li><code>parent_accounts</code> table (parent contact info)</li>
          <li><code>public_profiles</code> table (display names, grade)</li>
          <li><code>aura_records.audio_url</code> (voice recordings)</li>
        </ul>

        <p><strong>Regulatory Requirements:</strong> FERPA, COPPA, GDPR (if applicable)</p>
        <p><strong>Retention Period:</strong> Duration of enrollment + 7 years, or per parental request</p>

        <h3>3.2 Assessment & Educational Data (CONFIDENTIAL)</h3>
        <p><strong>Definition:</strong> Educational records, grades, assessment results, and performance metrics.</p>
        
        <p><strong>Data Elements:</strong></p>
        <ul>
          <li>Assignment submissions and grades</li>
          <li>Quiz/test scores</li>
          <li>AURA reading analysis results</li>
          <li>Performance metrics and trends</li>
          <li>Teacher feedback and comments</li>
          <li>Behavioral observations</li>
          <li>Classroom participation data</li>
        </ul>

        <p><strong>Storage Locations:</strong></p>
        <ul>
          <li><code>assignments</code> table</li>
          <li><code>assignment_submissions</code> table</li>
          <li><code>assignment_answers</code> table</li>
          <li><code>aura_records</code> table (grades, feedback, performance metrics)</li>
          <li><code>student_skill_vectors</code> table</li>
        </ul>

        <p><strong>Regulatory Requirements:</strong> FERPA</p>
        <p><strong>Retention Period:</strong> 3 years after course completion</p>

        <h3>3.3 Audio Recordings (CONFIDENTIAL/RESTRICTED)</h3>
        <p><strong>Definition:</strong> Voice recordings of students for reading assessment and speech analysis.</p>
        
        <p><strong>Data Elements:</strong></p>
        <ul>
          <li>Audio files (WAV, WebM formats)</li>
          <li>Transcripts derived from audio</li>
          <li>Phoneme analysis results</li>
          <li>Prosody and fluency metrics</li>
        </ul>

        <p><strong>Storage Locations:</strong></p>
        <ul>
          <li>Supabase Storage buckets (encrypted at rest)</li>
          <li><code>aura_records</code> table (URLs, transcripts, analysis)</li>
        </ul>

        <p><strong>Special Handling Requirements:</strong></p>
        <ul>
          <li>Parental consent required before collection (COPPA)</li>
          <li>Access restricted via <code>parent_consents</code> table</li>
          <li>Signed URLs with 24-hour expiration</li>
          <li>Access logging in <code>aura_access_log</code> table</li>
        </ul>

        <p><strong>Regulatory Requirements:</strong> FERPA, COPPA (biometric data provisions)</p>
        <p><strong>Retention Period:</strong> 1 year or until parental consent is revoked</p>

        <h3>3.4 Authentication & System Data (RESTRICTED)</h3>
        <p><strong>Definition:</strong> Credentials, session tokens, and system access data.</p>
        
        <p><strong>Data Elements:</strong></p>
        <ul>
          <li>Passwords (hashed)</li>
          <li>JWT tokens</li>
          <li>API keys</li>
          <li>OAuth tokens</li>
          <li>Session identifiers</li>
          <li>MFA secrets</li>
        </ul>

        <p><strong>Storage Locations:</strong></p>
        <ul>
          <li><code>auth.users</code> table (Supabase managed)</li>
          <li>Supabase Vault (encrypted secrets)</li>
          <li>Browser session storage (temporary)</li>
        </ul>

        <p><strong>Retention Period:</strong> Active session duration; passwords retained until changed</p>

        <h3>3.5 Classroom & Operational Data (INTERNAL)</h3>
        <p><strong>Definition:</strong> Non-sensitive classroom and operational information.</p>
        
        <p><strong>Data Elements:</strong></p>
        <ul>
          <li>Classroom names and subjects</li>
          <li>Course schedules</li>
          <li>Assignment titles and descriptions</li>
          <li>Teacher names and emails</li>
          <li>Curriculum content</li>
          <li>Question banks</li>
        </ul>

        <p><strong>Storage Locations:</strong></p>
        <ul>
          <li><code>classrooms</code> table</li>
          <li><code>questions</code> table</li>
          <li><code>assignments</code> table (metadata only)</li>
        </ul>

        <p><strong>Retention Period:</strong> 3 years</p>

        <h3>3.6 Audit & Security Logs (CONFIDENTIAL)</h3>
        <p><strong>Definition:</strong> System logs recording access, changes, and security events.</p>
        
        <p><strong>Data Elements:</strong></p>
        <ul>
          <li>User access logs</li>
          <li>Data modification logs</li>
          <li>Security events</li>
          <li>Failed login attempts</li>
          <li>RLS policy enforcement logs</li>
        </ul>

        <p><strong>Storage Locations:</strong></p>
        <ul>
          <li><code>security_audit_log</code> table</li>
          <li><code>aura_access_log</code> table</li>
          <li><code>backup_audit_log</code> table</li>
        </ul>

        <p><strong>Retention Period:</strong> 1 year (operational), 7 years (compliance archives)</p>
      </section>

      <section className="policy-section">
        <h2>4. Handling Requirements by Classification</h2>
        
        <h3>4.1 RESTRICTED Data Handling</h3>
        
        <h4>Storage</h4>
        <ul>
          <li><strong>Encryption at Rest:</strong> AES-256 encryption for all storage (Supabase default)</li>
          <li><strong>Encryption in Transit:</strong> TLS 1.2+ for all data transmission</li>
          <li><strong>Access Control:</strong> Row-Level Security (RLS) policies enforced on all tables</li>
          <li><strong>Database Location:</strong> Supabase (US region with SOC 2 Type II certification)</li>
        </ul>

        <h4>Access Controls</h4>
        <ul>
          <li><strong>Principle of Least Privilege:</strong> Users access only data necessary for their role</li>
          <li><strong>Role-Based Access:</strong> Enforced via <code>user_roles</code> table and RLS policies</li>
          <li><strong>Multi-Factor Authentication:</strong> Required for admin accounts</li>
          <li><strong>Consent Verification:</strong> Parental consent checked before accessing student audio (<code>parent_consents</code>)</li>
        </ul>

        <h4>Transmission</h4>
        <ul>
          <li><strong>TLS 1.2+:</strong> All API calls, web traffic</li>
          <li><strong>Signed URLs:</strong> Audio files accessed via time-limited signed URLs (24-hour expiration)</li>
          <li><strong>No Email Transmission:</strong> RESTRICTED data never sent via email</li>
          <li><strong>API Authentication:</strong> JWT tokens required for all data access</li>
        </ul>

        <h4>Labeling</h4>
        <ul>
          <li>Database tables containing RESTRICTED data documented in schema</li>
          <li>Code comments indicating RESTRICTED data handling</li>
          <li>UI components display privacy indicators for sensitive data</li>
        </ul>

        <h4>Logging & Monitoring</h4>
        <ul>
          <li>All access to student PII logged in <code>security_audit_log</code></li>
          <li>All audio recording access logged in <code>aura_access_log</code></li>
          <li>Failed access attempts trigger alerts</li>
          <li>Quarterly access reviews for admin accounts</li>
        </ul>

        <h3>4.2 CONFIDENTIAL Data Handling</h3>
        
        <h4>Storage</h4>
        <ul>
          <li><strong>Encryption at Rest:</strong> AES-256 encryption</li>
          <li><strong>Encryption in Transit:</strong> TLS 1.2+</li>
          <li><strong>Access Control:</strong> RLS policies restrict access to authorized users</li>
        </ul>

        <h4>Access Controls</h4>
        <ul>
          <li>Teachers access only their classroom data</li>
          <li>Students access only their own submissions and grades</li>
          <li>Parents access only their approved children's data</li>
          <li>Authentication required for all access</li>
        </ul>

        <h4>Transmission</h4>
        <ul>
          <li>TLS 1.2+ for all transmission</li>
          <li>API authentication required</li>
          <li>Limited email transmission (grades via secure portal link only)</li>
        </ul>

        <h4>Labeling</h4>
        <ul>
          <li>Schema documentation indicates CONFIDENTIAL classification</li>
          <li>UI displays "For Educational Use Only" notices</li>
        </ul>

        <h3>4.3 INTERNAL Data Handling</h3>
        
        <h4>Storage</h4>
        <ul>
          <li>Standard encryption at rest</li>
          <li>Access limited to authenticated users</li>
        </ul>

        <h4>Access Controls</h4>
        <ul>
          <li>Authentication required</li>
          <li>Basic authorization checks</li>
        </ul>

        <h4>Transmission</h4>
        <ul>
          <li>TLS for web traffic</li>
          <li>May be shared via email to internal users</li>
        </ul>

        <h3>4.4 PUBLIC Data Handling</h3>
        <ul>
          <li>No special handling required</li>
          <li>May be published to public websites</li>
          <li>No encryption or access controls required</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>5. Data Lifecycle Management</h2>
        
        <h3>5.1 Data Collection</h3>
        <p><strong>Principles:</strong></p>
        <ul>
          <li><strong>Data Minimization:</strong> Collect only data necessary for educational purposes</li>
          <li><strong>Consent:</strong> Parental consent obtained before collecting student data (COPPA)</li>
          <li><strong>Transparency:</strong> Privacy policy discloses all data collection practices</li>
          <li><strong>Classification at Creation:</strong> Data classified immediately upon collection</li>
        </ul>

        <p><strong>Collection Mechanisms:</strong></p>
        <ul>
          <li>User registration forms (validated input)</li>
          <li>Assignment submissions (file uploads, text input)</li>
          <li>Audio recordings (browser MediaRecorder API)</li>
          <li>System logs (automated)</li>
        </ul>

        <h3>5.2 Data Processing</h3>
        <p><strong>Processing Activities:</strong></p>
        <ul>
          <li>Assignment grading (automated and manual)</li>
          <li>AURA speech analysis (Google Vertex AI STT, phoneme detection)</li>
          <li>ML model training (anonymized data only)</li>
          <li>Report generation (aggregated data)</li>
        </ul>

        <p><strong>Third-Party Processing:</strong></p>
        <ul>
          <li><strong>Google Vertex AI:</strong> Audio transcription and embeddings (DPA in place)</li>
          <li><strong>Supabase:</strong> Database and storage hosting (DPA in place)</li>
          <li>All processors are SOC 2 certified and FERPA compliant</li>
        </ul>

        <h3>5.3 Data Storage</h3>
        <p><strong>Primary Storage:</strong></p>
        <ul>
          <li><strong>Production Database:</strong> Supabase Postgres (US region)</li>
          <li><strong>File Storage:</strong> Supabase Storage (audio recordings)</li>
          <li><strong>Backup Storage:</strong> Supabase automated backups (daily)</li>
        </ul>

        <p><strong>Backup & Recovery:</strong></p>
        <ul>
          <li>Daily automated backups with 7-day retention</li>
          <li>Cold storage backups for long-term retention (7 years)</li>
          <li>Point-in-time recovery capability</li>
          <li>Quarterly disaster recovery testing</li>
        </ul>

        <h3>5.4 Data Retention</h3>
        <table>
          <thead>
            <tr>
              <th>Data Type</th>
              <th>Active Retention</th>
              <th>Archive Period</th>
              <th>Total Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Student PII</td>
              <td>Duration of enrollment</td>
              <td>7 years post-enrollment</td>
              <td>Enrollment + 7 years</td>
            </tr>
            <tr>
              <td>Assessment Data</td>
              <td>Current school year</td>
              <td>3 years</td>
              <td>3 years</td>
            </tr>
            <tr>
              <td>Audio Recordings</td>
              <td>1 year</td>
              <td>None</td>
              <td>1 year or until consent revoked</td>
            </tr>
            <tr>
              <td>Audit Logs</td>
              <td>1 year</td>
              <td>7 years (cold storage)</td>
              <td>7 years</td>
            </tr>
            <tr>
              <td>Classroom Data</td>
              <td>Current + 2 years</td>
              <td>1 year</td>
              <td>3 years</td>
            </tr>
          </tbody>
        </table>

        <p><strong>Retention Enforcement:</strong></p>
        <ul>
          <li>Automated deletion via scheduled edge functions (<code>cleanup-old-backups</code>)</li>
          <li>Manual review for edge cases (parental requests)</li>
          <li>Retention periods tracked in database metadata</li>
        </ul>

        <h3>5.5 Data Disposal</h3>
        <p><strong>Secure Deletion Methods:</strong></p>
        <ul>
          <li><strong>Database Records:</strong> Hard delete with CASCADE on foreign keys</li>
          <li><strong>File Storage:</strong> Permanent deletion from Supabase Storage</li>
          <li><strong>Backups:</strong> Deletion from cold storage after retention period</li>
          <li><strong>Verification:</strong> Audit logs confirm successful deletion</li>
        </ul>

        <p><strong>Right to Deletion:</strong></p>
        <ul>
          <li>Parents may request deletion of student data at any time</li>
          <li>Requests processed within 30 days</li>
          <li>Exceptions: Data required for legal compliance retained</li>
          <li>Deletion logged in <code>data_restoration_requests</code> table</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>6. Special Handling: Student Privacy</h2>
        
        <h3>6.1 FERPA Compliance</h3>
        <p><strong>Education Records Protection:</strong></p>
        <ul>
          <li>Education records not disclosed without parental consent (except authorized parties)</li>
          <li>Parents have right to inspect and review education records</li>
          <li>Parents may request amendments to inaccurate records</li>
          <li>Directory information disclosure requires opt-out notice</li>
        </ul>

        <p><strong>Authorized Disclosures (No Consent Required):</strong></p>
        <ul>
          <li>School officials with legitimate educational interest (teachers)</li>
          <li>Compliance with judicial order or lawfully issued subpoena</li>
          <li>Health/safety emergency</li>
        </ul>

        <h3>6.2 COPPA Compliance</h3>
        <p><strong>Children Under 13:</strong></p>
        <ul>
          <li>Verifiable parental consent required before collecting PII</li>
          <li>Consent mechanism: Email notification with confirmation link</li>
          <li>Parents may review, delete, or refuse further collection of child's PII</li>
          <li>Data minimization: Only collect data necessary for educational purpose</li>
        </ul>

        <p><strong>Consent Management:</strong></p>
        <ul>
          <li><code>parent_consents</code> table tracks consent status</li>
          <li>Consent types: <code>aura_recording_consent</code>, <code>assignment_data_consent</code></li>
          <li>RLS policies enforce consent before data access</li>
          <li>Parents may revoke consent at any time via dashboard</li>
        </ul>

        <h3>6.3 Audio Recording Special Handling</h3>
        <p><strong>Biometric Data Considerations:</strong></p>
        <ul>
          <li>Voice recordings may be considered biometric data in some jurisdictions</li>
          <li>Explicit parental consent required</li>
          <li>Purpose limitation: Used only for reading assessment</li>
          <li>Retention minimization: 1-year maximum</li>
          <li>Access logging: All access recorded in <code>aura_access_log</code></li>
        </ul>

        <p><strong>Technical Safeguards:</strong></p>
        <ul>
          <li>Signed URLs with 24-hour expiration</li>
          <li>No public URLs; all access authenticated</li>
          <li>Encryption at rest and in transit</li>
          <li>Access restricted by RLS policies</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>7. Roles & Responsibilities</h2>
        
        <h3>7.1 Data Owner (CISO)</h3>
        <ul>
          <li>Maintains data classification framework</li>
          <li>Approves classification for new data types</li>
          <li>Reviews policy annually</li>
          <li>Oversees compliance with handling requirements</li>
        </ul>

        <h3>7.2 Data Custodians (Engineering Team)</h3>
        <ul>
          <li>Implements technical controls per classification level</li>
          <li>Manages encryption, access controls, logging</li>
          <li>Maintains RLS policies and database security</li>
          <li>Executes data retention and disposal procedures</li>
        </ul>

        <h3>7.3 Data Users (Teachers, Students, Parents)</h3>
        <ul>
          <li>Access data only as authorized</li>
          <li>Do not share credentials</li>
          <li>Report suspected data breaches immediately</li>
          <li>Comply with Acceptable Use Policy</li>
        </ul>

        <h3>7.4 Privacy Officer</h3>
        <ul>
          <li>Responds to parental consent and data access requests</li>
          <li>Manages FERPA and COPPA compliance</li>
          <li>Conducts privacy impact assessments for new features</li>
          <li>Maintains privacy policy and notices</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>8. Data Breach Response</h2>
        
        <h3>8.1 Breach Definition</h3>
        <p>A data breach is unauthorized access, disclosure, or loss of RESTRICTED or CONFIDENTIAL data.</p>

        <h3>8.2 Response Procedures</h3>
        <ol>
          <li><strong>Detection & Reporting (0-1 hour):</strong>
            <ul>
              <li>Any user detecting a breach reports to security@impressmekids.com</li>
              <li>Security team initiates Incident Response Plan</li>
            </ul>
          </li>
          <li><strong>Containment (1-4 hours):</strong>
            <ul>
              <li>Isolate affected systems</li>
              <li>Revoke compromised credentials</li>
              <li>Block unauthorized access</li>
            </ul>
          </li>
          <li><strong>Assessment (4-24 hours):</strong>
            <ul>
              <li>Determine scope (what data, how many records)</li>
              <li>Identify affected individuals</li>
              <li>Assess harm potential</li>
            </ul>
          </li>
          <li><strong>Notification (24-72 hours):</strong>
            <ul>
              <li>Notify affected parents/students</li>
              <li>Report to school districts</li>
              <li>Report to regulatory authorities if required</li>
            </ul>
          </li>
          <li><strong>Remediation (Ongoing):</strong>
            <ul>
              <li>Fix vulnerability</li>
              <li>Enhance controls</li>
              <li>Conduct lessons-learned review</li>
            </ul>
          </li>
        </ol>

        <h3>8.3 Notification Requirements</h3>
        <table>
          <thead>
            <tr>
              <th>Party</th>
              <th>Timeframe</th>
              <th>Trigger</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Affected Parents/Students</td>
              <td>72 hours</td>
              <td>Any breach of PII or education records</td>
            </tr>
            <tr>
              <td>School District Partners</td>
              <td>48 hours</td>
              <td>Breach affecting their students</td>
            </tr>
            <tr>
              <td>State Education Agency</td>
              <td>As required by state law</td>
              <td>Varies by state</td>
            </tr>
            <tr>
              <td>FTC (COPPA)</td>
              <td>Per FTC guidelines</td>
              <td>Breach of children's data</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>9. Compliance & Auditing</h2>
        
        <h3>9.1 Compliance Monitoring</h3>
        <ul>
          <li><strong>Quarterly Reviews:</strong> Data access patterns, consent status, retention compliance</li>
          <li><strong>Annual Audits:</strong> Full data inventory, classification accuracy, control effectiveness</li>
          <li><strong>Continuous Monitoring:</strong> Automated alerts for policy violations</li>
        </ul>

        <h3>9.2 Audit Logs</h3>
        <p>The following events are logged for compliance:</p>
        <ul>
          <li>Access to RESTRICTED data (<code>security_audit_log</code>)</li>
          <li>Audio recording access (<code>aura_access_log</code>)</li>
          <li>Data modifications (timestamps on all tables)</li>
          <li>Consent changes (<code>parent_consents</code> audit trail)</li>
          <li>Admin actions (<code>backup_audit_log</code>)</li>
        </ul>

        <h3>9.3 Training Requirements</h3>
        <ul>
          <li><strong>New Employees:</strong> Data classification and FERPA training within first week</li>
          <li><strong>Annual Refresher:</strong> All staff complete annual privacy training</li>
          <li><strong>Role-Specific Training:</strong> Developers trained on secure coding and RLS policies</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>10. SOC 2 Control Mappings</h2>
        
        <table>
          <thead>
            <tr>
              <th>Control Domain</th>
              <th>TSC Criteria</th>
              <th>Policy Section</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Common Criteria</td>
              <td>CC6.1 (Logical Access)</td>
              <td>§4 Handling Requirements, §7 Roles</td>
            </tr>
            <tr>
              <td>Common Criteria</td>
              <td>CC6.6 (Data Classification)</td>
              <td>§2 Classification Levels, §3 Data Inventory</td>
            </tr>
            <tr>
              <td>Common Criteria</td>
              <td>CC6.7 (Encryption)</td>
              <td>§4.1 RESTRICTED Handling</td>
            </tr>
            <tr>
              <td>Confidentiality</td>
              <td>C1.1 (Confidential Information)</td>
              <td>§2 Classification Framework</td>
            </tr>
            <tr>
              <td>Confidentiality</td>
              <td>C1.2 (Disposal)</td>
              <td>§5.5 Data Disposal</td>
            </tr>
            <tr>
              <td>Privacy</td>
              <td>P4.1 (Retention)</td>
              <td>§5.4 Data Retention</td>
            </tr>
            <tr>
              <td>Privacy</td>
              <td>P4.2 (Disposal)</td>
              <td>§5.5 Data Disposal</td>
            </tr>
            <tr>
              <td>Privacy</td>
              <td>P6.1 (Data Subject Rights)</td>
              <td>§5.5 Right to Deletion, §6.2 COPPA</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>11. Policy Review & Updates</h2>
        
        <h3>11.1 Review Schedule</h3>
        <ul>
          <li><strong>Annual Review:</strong> Full policy review by January 31 each year</li>
          <li><strong>Triggered Reviews:</strong> After data breaches, regulatory changes, major system changes</li>
          <li><strong>Approval:</strong> CISO approves all policy updates</li>
        </ul>

        <h3>11.2 Change Management</h3>
        <ul>
          <li>Policy changes communicated to all staff within 5 business days</li>
          <li>Training updated to reflect policy changes</li>
          <li>Version history maintained for audit purposes</li>
        </ul>

        <h3>11.3 Exception Process</h3>
        <p>Exceptions to handling requirements may be granted only by:</p>
        <ul>
          <li><strong>Requestor:</strong> Submits written exception request with business justification</li>
          <li><strong>Risk Assessment:</strong> Security team assesses risk and compensating controls</li>
          <li><strong>Approval:</strong> CISO approves or denies within 5 business days</li>
          <li><strong>Documentation:</strong> Approved exceptions documented with expiration date</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>12. Related Policies</h2>
        <ul>
          <li>Information Security Policy</li>
          <li>Access Control Policy</li>
          <li>Incident Response Policy</li>
          <li>Backup & Disaster Recovery Policy</li>
          <li>Vendor Management Policy</li>
          <li>Change Management Policy</li>
          <li>Acceptable Use Policy</li>
          <li>Privacy Policy (external)</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>13. References & Resources</h2>
        <ul>
          <li>FERPA Regulations (34 CFR Part 99)</li>
          <li>COPPA Regulations (16 CFR Part 312)</li>
          <li>NIST SP 800-122: Guide to Protecting the Confidentiality of PII</li>
          <li>SOC 2 Trust Services Criteria (2017)</li>
          <li>Supabase Security Documentation</li>
          <li>Google Cloud Data Processing Agreement</li>
        </ul>
      </section>

      <footer className="policy-footer">
        <p><strong>Approval:</strong></p>
        <p>This policy has been reviewed and approved by the Chief Information Security Officer.</p>
        <p><strong>Questions:</strong> Contact security@impressmekids.com</p>
      </footer>
    </div>
  );
}
