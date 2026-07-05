export const AccessControlPolicy = () => {
  return (
    <div className="policy-document">
      <div className="policy-header">
        <h1>Access Control Policy</h1>
        <div className="policy-meta">
          <p><strong>Version:</strong> 1.0</p>
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Document Owner:</strong> Security Lead (Ben)</p>
        </div>
      </div>

      <section className="policy-section">
        <h2>1. Policy Statement</h2>
        <p>This policy defines Role-Based Access Control (RBAC) implementation and data access permissions for the YubiLearn (IMK) platform. All access decisions follow the Principle of Least Privilege and comply with FERPA, COPPA, and SOC 2 requirements.</p>
        <p><strong>Core Principles:</strong></p>
        <ul>
          <li><strong>Role-Based Access Control (RBAC):</strong> Permissions granted based on user role, not individual identity</li>
          <li><strong>Principle of Least Privilege:</strong> Users receive minimum access required for their role</li>
          <li><strong>Data Minimization:</strong> Limit exposure of student PII to essential personnel only</li>
          <li><strong>Deny by Default:</strong> All data access denied unless explicitly permitted by RLS policy</li>
        </ul>
        <p><strong>Compliance Frameworks:</strong> SOC 2 Type I (CC6.1, CC6.2, CC6.3), FERPA, COPPA</p>
      </section>

      <section className="policy-section">
        <h2>2. Role Definitions & Permissions Matrix</h2>
        <div className="policy-subsection">
          <h3>2.1 System Roles</h3>
          <table className="policy-table policy-table-wide">
            <thead>
              <tr>
                <th>Role</th>
                <th>Authentication</th>
                <th>Profile Access</th>
                <th>Student Data</th>
                <th>Grades</th>
                <th>Voice Recordings</th>
                <th>Analytics</th>
                <th>Admin Functions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Student</strong></td>
                <td>Required</td>
                <td>Own only</td>
                <td>Own only</td>
                <td>Own only</td>
                <td>Own only</td>
                <td>Own only</td>
                <td>None</td>
              </tr>
              <tr>
                <td><strong>Teacher</strong></td>
                <td>Required</td>
                <td>Own + classroom students (limited)</td>
                <td>Classroom students only</td>
                <td>Read/Write for own classes</td>
                <td>With parental consent only</td>
                <td>Classroom-level</td>
                <td>Classroom management</td>
              </tr>
              <tr>
                <td><strong>Parent</strong></td>
                <td>Required</td>
                <td>Own + approved children</td>
                <td>Approved children only</td>
                <td>Finalized grades only</td>
                <td>With consent granted</td>
                <td>Child-specific</td>
                <td>None</td>
              </tr>
              <tr>
                <td><strong>District Admin</strong></td>
                <td>Required + MFA</td>
                <td>District users</td>
                <td>District students</td>
                <td>District-wide (read)</td>
                <td>Audit access only</td>
                <td>District-wide</td>
                <td>User management, reports</td>
              </tr>
              <tr>
                <td><strong>System Admin</strong></td>
                <td>Required + MFA</td>
                <td>All users</td>
                <td>All students</td>
                <td>All grades</td>
                <td>Audit logs only</td>
                <td>Full system</td>
                <td>Full admin, security audits</td>
              </tr>
              <tr>
                <td><strong>Anonymous</strong></td>
                <td>None</td>
                <td><strong>DENIED</strong></td>
                <td><strong>DENIED</strong></td>
                <td><strong>DENIED</strong></td>
                <td><strong>DENIED</strong></td>
                <td><strong>DENIED</strong></td>
                <td><strong>DENIED</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="policy-section">
        <h2>3. Data Classification</h2>
        <table className="policy-table">
          <thead>
            <tr>
              <th>Classification</th>
              <th>Definition</th>
              <th>Examples</th>
              <th>Access Requirements</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Public</strong></td>
              <td>Information freely available to anyone</td>
              <td>None (all IMK data requires authentication)</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td><strong>Internal</strong></td>
              <td>Information for authenticated users only</td>
              <td>Classroom rosters, assignment templates, question banks</td>
              <td>Valid authentication token, role-appropriate access</td>
            </tr>
            <tr>
              <td><strong>Confidential</strong></td>
              <td>Sensitive educational records</td>
              <td>Student PII, grades, teacher notes, parent contact info</td>
              <td>Authentication + role-based RLS policy + legitimate educational interest</td>
            </tr>
            <tr>
              <td><strong>Restricted</strong></td>
              <td>Highly sensitive data requiring additional consent</td>
              <td>Voice recordings (AURA), biometric data, special education notes</td>
              <td>Authentication + role-based RLS + parental consent + audit logging</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>4. Technical Implementation</h2>
        <div className="policy-subsection">
          <h3>4.1 Row-Level Security (RLS)</h3>
          <p>All database tables implement Row-Level Security policies that enforce access control at the database level:</p>
          <ul>
            <li><strong>Enable RLS:</strong> <code>ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;</code></li>
            <li><strong>Default Deny:</strong> No access unless explicitly permitted by policy</li>
            <li><strong>Role Verification:</strong> Policies use <code>has_role()</code> function to verify user roles</li>
            <li><strong>Ownership Checks:</strong> Policies verify <code>auth.uid() = user_id</code> for personal data</li>
            <li><strong>Consent Verification:</strong> Voice recording access requires <code>has_aura_consent()</code> check</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>4.2 Security Definer Functions</h3>
          <p>Database functions used for access control run with elevated privileges (SECURITY DEFINER) to prevent privilege escalation:</p>
          <ul>
            <li><code>has_role(role_name text)</code> - Verifies user has specified role</li>
            <li><code>has_aura_consent(student_id uuid)</code> - Checks parental consent for voice recording access</li>
            <li><code>is_classroom_teacher(classroom_id uuid)</code> - Verifies teacher ownership of classroom</li>
            <li><code>is_parent_of_student(student_id uuid)</code> - Verifies parent-child relationship</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>4.3 User Role Assignment</h3>
          <p>User roles are stored in the <code>user_roles</code> table with immutable audit logging:</p>
          <ul>
            <li>Role assignments require admin approval</li>
            <li>Role changes logged to <code>security_audit_log</code></li>
            <li>Cannot self-assign or escalate privileges</li>
            <li>Role verification occurs on every database query (enforced by RLS)</li>
          </ul>
        </div>
      </section>

      <section className="policy-section">
        <h2>5. Specific Access Controls</h2>
        <div className="policy-subsection">
          <h3>5.1 Student Profiles (<code>profiles</code> table)</h3>
          <ul>
            <li><strong>Students:</strong> See own profile only (full access)</li>
            <li><strong>Teachers:</strong> See classroom students' profiles with limited fields (name, grade level; NO email)</li>
            <li><strong>Parents:</strong> See approved children's profiles (full access after approval)</li>
            <li><strong>Admins:</strong> See all profiles within district scope</li>
            <li><strong>Email Protection:</strong> Email addresses not exposed to prevent harvesting</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>5.2 AURA Voice Recordings (<code>aura_records</code> table)</h3>
          <ul>
            <li><strong>Requires Explicit Parental Consent:</strong> Verified via <code>parent_consents.aura_recording_consent = true</code></li>
            <li><strong>Students:</strong> Can record and view own recordings (always permitted)</li>
            <li><strong>Teachers:</strong> Can view student recordings ONLY if parent has granted consent</li>
            <li><strong>Parents:</strong> Can view child's recordings ONLY if they granted consent</li>
            <li><strong>Admins:</strong> Audit access only (metadata, no audio playback without consent)</li>
            <li><strong>Access Logging:</strong> All access to voice recordings logged in <code>aura_access_log</code></li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>5.3 Grades & Submissions (<code>assignment_submissions</code> table)</h3>
          <ul>
            <li><strong>Students:</strong> View own submissions only (all statuses)</li>
            <li><strong>Teachers:</strong> Read/write access to submissions from their classroom students</li>
            <li><strong>Parents:</strong> View finalized grades only (not drafts or in-progress submissions)</li>
            <li><strong>Admins:</strong> Read-only access to district-wide grades for reporting</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>5.4 Teacher Notes (stored in <code>profiles</code> or assignment feedback)</h3>
          <ul>
            <li><strong>Visible to:</strong> Teachers only (creator and classroom teacher)</li>
            <li><strong>Hidden from:</strong> Students, parents, other teachers</li>
            <li><strong>Admin Access:</strong> Audit purposes only (requires justification)</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>5.5 Audit Logs (<code>security_audit_log</code>, <code>aura_access_log</code>)</h3>
          <ul>
            <li><strong>System Admins Only:</strong> Full read access</li>
            <li><strong>Immutable:</strong> No updates or deletions permitted (write-once)</li>
            <li><strong>Retention:</strong> 7 years for compliance</li>
          </ul>
        </div>
      </section>

      <section className="policy-section">
        <h2>6. Google Vertex AI Access Controls</h2>
        <p>AI processing is secured through Google Cloud IAM and VPC Service Controls:</p>
        <ul>
          <li><strong>Service Account:</strong> Dedicated service account with minimal IAM permissions (roles/aiplatform.user)</li>
          <li><strong>VPC Service Controls:</strong> Restrict Vertex AI API access to approved networks only</li>
          <li><strong>Data Encryption:</strong> All data encrypted in transit (TLS 1.3) and at rest (Google-managed keys)</li>
          <li><strong>Audit Logging:</strong> Cloud Audit Logs enabled for all Vertex AI API calls</li>
          <li><strong>No Direct Student Data:</strong> Student PII never sent to Vertex AI (only anonymized text/audio)</li>
          <li><strong>API Key Storage:</strong> Stored in Google Secret Manager (encrypted, access logged)</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>7. Parent Access Request Process</h2>
        <p>Parents must request and receive approval to access their child's educational data:</p>
        <ol>
          <li><strong>Request Submission:</strong> Parent submits request via <code>parent_access_requests</code> table (includes student ID, justification)</li>
          <li><strong>Teacher Review:</strong> Classroom teacher reviews request (verifies parent identity via school records)</li>
          <li><strong>Approval:</strong> Teacher approves or denies (recorded in <code>parent_student_links</code> table)</li>
          <li><strong>Access Granted:</strong> RLS policies automatically grant access based on approved link</li>
          <li><strong>Revocation:</strong> Teacher or admin can revoke access at any time (immediate effect)</li>
          <li><strong>Audit Trail:</strong> All requests, approvals, and revocations logged to <code>security_audit_log</code></li>
        </ol>
      </section>

      <section className="policy-section">
        <h2>8. Access Review & Monitoring</h2>
        <div className="policy-subsection">
          <h3>8.1 Quarterly Access Reviews</h3>
          <p>Security Lead conducts quarterly reviews of:</p>
          <ul>
            <li>User role assignments (verify still appropriate)</li>
            <li>Parent access approvals (verify still enrolled students)</li>
            <li>Admin accounts (verify still employed)</li>
            <li>Service account permissions (verify least privilege)</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>8.2 Automated Monitoring</h3>
          <p>Real-time alerts for suspicious access patterns:</p>
          <ul>
            <li>Access to &gt;50 student records in &lt;5 minutes → Alert to Security Lead</li>
            <li>Voice recording access without consent → Blocked + alert</li>
            <li>Admin role assignment → Immediate notification to Security Lead and Technical Lead</li>
            <li>Failed RLS policy checks → Logged and reviewed daily</li>
          </ul>
        </div>
      </section>

      <section className="policy-section">
        <h2>9. Access Termination Procedures</h2>
        <table className="policy-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Action</th>
              <th>Timeline</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Teacher Leaves District</td>
              <td>Disable account, revoke all classroom access, archive data</td>
              <td>Same day</td>
            </tr>
            <tr>
              <td>Student Transfers/Graduates</td>
              <td>Disable login, maintain data for records retention</td>
              <td>Within 1 week</td>
            </tr>
            <tr>
              <td>Parent Revokes Consent</td>
              <td>Immediately block voice recording access, update <code>parent_consents</code></td>
              <td>Immediate</td>
            </tr>
            <tr>
              <td>Admin Leaves Organization</td>
              <td>Disable account, revoke MFA, audit recent activity</td>
              <td>Same day</td>
            </tr>
            <tr>
              <td>Suspected Compromise</td>
              <td>Force password reset, revoke sessions, investigate</td>
              <td>Within 15 minutes</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>10. Exceptions & Waivers</h2>
        <p>Access control exceptions require Security Lead approval and must include:</p>
        <ul>
          <li>Justification (e.g., emergency access for student safety)</li>
          <li>Scope (specific data, duration)</li>
          <li>Compensating controls (e.g., enhanced audit logging)</li>
          <li>Expiration date (maximum 30 days)</li>
          <li>Review by Technical Lead and Product Lead</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>11. Policy Review & Updates</h2>
        <ul>
          <li><strong>Review Frequency:</strong> Quarterly or when roles change</li>
          <li><strong>Approval Required:</strong> Security Lead + Technical Lead</li>
          <li><strong>User Notification:</strong> All users notified of significant access control changes</li>
          <li><strong>Effective Date:</strong> Immediate for security enhancements, 30 days for restrictions</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>12. Related Policies</h2>
        <ul>
          <li>Password and MFA Policy</li>
          <li>Incident Response Policy</li>
          <li>Data Retention and Destruction Policy</li>
          <li>Third-Party Vendor Management Policy</li>
        </ul>
      </section>

      <div className="policy-footer">
        <p><strong>Classification:</strong> Internal Use Only</p>
        <p><strong>Document Control:</strong> This policy is maintained by the Security Lead and stored in the shared Security Policies folder.</p>
      </div>
    </div>
  );
};
