export const PasswordMFAPolicy = () => {
  return (
    <div className="policy-document">
      <div className="policy-header">
        <h1>Password and Multi-Factor Authentication Policy</h1>
        <div className="policy-meta">
          <p><strong>Version:</strong> 1.0</p>
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Document Owner:</strong> Security Lead (Ben)</p>
        </div>
      </div>

      <section className="policy-section">
        <h2>1. Policy Statement & Scope</h2>
        <p>This policy establishes password complexity requirements and multi-factor authentication (MFA) standards for all Impress Me Kids (IMK) system users. This policy applies to:</p>
        <ul>
          <li>Students</li>
          <li>Teachers</li>
          <li>Parents</li>
          <li>District Administrators</li>
          <li>System Administrators</li>
        </ul>
        <p><strong>Compliance Frameworks:</strong> SOC 2 Type I (CC6.1, CC6.6), FERPA, COPPA</p>
      </section>

      <section className="policy-section">
        <h2>2. Password Requirements</h2>
        <div className="policy-subsection">
          <h3>2.1 Minimum Password Standards</h3>
          <table className="policy-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Standard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Minimum Length</td>
                <td>8 characters</td>
              </tr>
              <tr>
                <td>Complexity</td>
                <td>Must include uppercase, lowercase, numbers, and special characters</td>
              </tr>
              <tr>
                <td>Password History</td>
                <td>Cannot reuse last 5 passwords</td>
              </tr>
              <tr>
                <td>Expiration - Admin/Teacher</td>
                <td>90 days</td>
              </tr>
              <tr>
                <td>Expiration - Students</td>
                <td>180 days</td>
              </tr>
              <tr>
                <td>Leaked Password Protection</td>
                <td>Enabled (HaveIBeenPwned integration via Supabase Auth)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="policy-subsection">
          <h3>2.2 Password Security Best Practices</h3>
          <ul>
            <li>Never share passwords with anyone</li>
            <li>Use unique passwords for IMK (do not reuse across services)</li>
            <li>Use a password manager for secure storage</li>
            <li>Do not write passwords down or store in plain text</li>
            <li>Change password immediately if compromise is suspected</li>
          </ul>
        </div>
      </section>

      <section className="policy-section">
        <h2>3. Multi-Factor Authentication (MFA)</h2>
        <div className="policy-subsection">
          <h3>3.1 MFA Requirements by Role</h3>
          <table className="policy-table">
            <thead>
              <tr>
                <th>User Role</th>
                <th>MFA Status</th>
                <th>Supported Methods</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>District Administrators</td>
                <td><strong>Required</strong></td>
                <td>Authenticator app (TOTP), SMS backup</td>
              </tr>
              <tr>
                <td>School Administrators</td>
                <td><strong>Required</strong></td>
                <td>Authenticator app (TOTP), SMS backup</td>
              </tr>
              <tr>
                <td>Teachers</td>
                <td>Strongly Recommended</td>
                <td>Authenticator app (TOTP), SMS backup</td>
              </tr>
              <tr>
                <td>Parents</td>
                <td>Recommended</td>
                <td>Authenticator app (TOTP), SMS backup</td>
              </tr>
              <tr>
                <td>Students</td>
                <td>Optional</td>
                <td>Authenticator app (TOTP), SMS backup</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="policy-subsection">
          <h3>3.2 MFA Enrollment Process</h3>
          <ol>
            <li>User navigates to Account Settings → Security</li>
            <li>Selects "Enable Multi-Factor Authentication"</li>
            <li>Scans QR code with authenticator app (Google Authenticator, Authy, Microsoft Authenticator)</li>
            <li>Enters verification code to confirm setup</li>
            <li>Saves backup codes for account recovery</li>
          </ol>
        </div>

        <div className="policy-subsection">
          <h3>3.3 MFA Reset Procedures</h3>
          <ul>
            <li><strong>User-Initiated:</strong> Use backup codes provided during enrollment</li>
            <li><strong>Lost Device:</strong> Contact Security Lead with identity verification</li>
            <li><strong>Verification Required:</strong> Government-issued ID + email confirmation</li>
            <li><strong>Processing Time:</strong> Within 24 hours for teachers/admins, 48 hours for parents/students</li>
          </ul>
        </div>
      </section>

      <section className="policy-section">
        <h2>4. Account Security Measures</h2>
        <table className="policy-table">
          <thead>
            <tr>
              <th>Security Control</th>
              <th>Configuration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Session Timeout (Inactivity)</td>
              <td>30 minutes</td>
            </tr>
            <tr>
              <td>Maximum Failed Login Attempts</td>
              <td>5 attempts → 15-minute account lockout</td>
            </tr>
            <tr>
              <td>Password Reset Flow</td>
              <td>Email verification required (link expires in 1 hour)</td>
            </tr>
            <tr>
              <td>OAuth (Google Sign-In)</td>
              <td>Enabled with domain restrictions (school email domains only)</td>
            </tr>
            <tr>
              <td>Session Persistence</td>
              <td>Browser local storage (encrypted tokens)</td>
            </tr>
            <tr>
              <td>Account Lockout</td>
              <td>Automatic after 5 failed attempts; manual unlock by admin</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>5. Google Vertex AI Integration Security</h2>
        <p>AI capabilities are powered by Google Vertex AI with the following security controls:</p>
        <ul>
          <li><strong>Authentication:</strong> Service account with minimal IAM permissions</li>
          <li><strong>Credential Storage:</strong> Google Secret Manager (encrypted at rest)</li>
          <li><strong>API Key Rotation:</strong> Every 90 days (automated)</li>
          <li><strong>Access Control:</strong> VPC Service Controls restrict API access to approved networks</li>
          <li><strong>Audit Logging:</strong> All Vertex AI API calls logged to Cloud Audit Logs</li>
          <li><strong>Data Encryption:</strong> In transit (TLS 1.3) and at rest (Google-managed encryption keys)</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>6. Roles & Responsibilities</h2>
        <table className="policy-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Responsibilities</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Security Lead (Ben)</td>
              <td>
                • Policy enforcement and monitoring<br />
                • Security incident response<br />
                • Quarterly password/MFA compliance audits<br />
                • Coordinate with CPA firm for SOC 2 audits
              </td>
            </tr>
            <tr>
              <td>System Administrators</td>
              <td>
                • MFA enrollment assistance<br />
                • Password reset approvals<br />
                • Account lockout management<br />
                • Monitor failed login attempts
              </td>
            </tr>
            <tr>
              <td>All Users</td>
              <td>
                • Maintain strong, unique passwords<br />
                • Enable MFA when required or recommended<br />
                • Report compromised accounts immediately<br />
                • Complete annual security awareness training
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>7. Audit & Monitoring</h2>
        <p>The following activities are logged in the <code>security_audit_log</code> table and reviewed monthly:</p>
        <ul>
          <li>Failed login attempts (source IP, timestamp, username)</li>
          <li>Successful logins from new devices/locations</li>
          <li>Password changes and resets</li>
          <li>MFA enrollment, disablement, and reset events</li>
          <li>Account lockouts and unlocks</li>
          <li>Administrative password resets</li>
        </ul>
        <p><strong>Alert Triggers:</strong></p>
        <ul>
          <li>5+ failed logins within 5 minutes from single IP → Immediate alert to Security Lead</li>
          <li>Admin MFA disabled → Immediate alert to Security Lead and Technical Lead</li>
          <li>10+ failed logins across system within 1 hour → Potential attack investigation</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>8. Exceptions & Waivers</h2>
        <p>Exceptions to this policy require written approval from the Security Lead and must include:</p>
        <ul>
          <li>Justification for exception</li>
          <li>Compensating controls implemented</li>
          <li>Expiration date for exception (maximum 90 days)</li>
          <li>Risk acceptance by leadership</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>9. Policy Review & Updates</h2>
        <ul>
          <li><strong>Review Frequency:</strong> Quarterly or after security incident</li>
          <li><strong>Approval Required:</strong> Security Lead + Technical Lead</li>
          <li><strong>User Notification:</strong> All users notified of policy changes via email</li>
          <li><strong>Effective Date:</strong> 30 days after approval</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>10. Related Policies</h2>
        <ul>
          <li>Access Control Policy</li>
          <li>Incident Response Policy</li>
          <li>Security Awareness Training Policy</li>
          <li>Acceptable Use Policy</li>
        </ul>
      </section>

      <div className="policy-footer">
        <p><strong>Classification:</strong> Internal Use Only</p>
        <p><strong>Document Control:</strong> This policy is maintained by the Security Lead and stored in the shared Security Policies folder.</p>
      </div>
    </div>
  );
};
