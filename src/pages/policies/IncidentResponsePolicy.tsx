export const IncidentResponsePolicy = () => {
  return (
    <div className="policy-document">
      <div className="policy-header">
        <h1>Incident Response Policy</h1>
        <div className="policy-meta">
          <p><strong>Version:</strong> 1.0</p>
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Document Owner:</strong> Security Lead (Ben)</p>
        </div>
      </div>

      <section className="policy-section">
        <h2>1. Policy Statement & Objectives</h2>
        <p>This policy establishes procedures for detecting, responding to, and recovering from security incidents affecting the NabuLearn (IMK) platform. Our objectives are to:</p>
        <ul>
          <li>Detect and respond to security incidents rapidly</li>
          <li>Contain incidents to minimize impact on students and operations</li>
          <li>Preserve evidence for forensic analysis and regulatory reporting</li>
          <li>Comply with FERPA breach notification requirements</li>
          <li>Learn from incidents to prevent future occurrences</li>
        </ul>
        <p><strong>Compliance Frameworks:</strong> SOC 2 Type I (CC7.3, CC7.4, CC7.5), FERPA (34 CFR § 99.31), COPPA</p>
      </section>

      <section className="policy-section">
        <h2>2. Incident Classification</h2>
        <table className="policy-table policy-table-wide">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Examples</th>
              <th>Response Time</th>
              <th>Notification Required</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Critical (P0)</strong></td>
              <td>
                • Data breach exposing student PII<br />
                • Ransomware attack<br />
                • Complete system outage<br />
                • Authentication bypass vulnerability<br />
                • Mass data exfiltration
              </td>
              <td>&lt; 15 minutes</td>
              <td>Immediate: Leadership, affected users, law enforcement (if criminal), Department of Education</td>
            </tr>
            <tr>
              <td><strong>High (P1)</strong></td>
              <td>
                • Unauthorized admin access<br />
                • Partial data leak (non-PII)<br />
                • RLS policy bypass<br />
                • Successful intrusion attempt<br />
                • DDoS attack causing degradation
              </td>
              <td>&lt; 1 hour</td>
              <td>Leadership, security team, affected district admins</td>
            </tr>
            <tr>
              <td><strong>Medium (P2)</strong></td>
              <td>
                • Failed intrusion attempt<br />
                • DoS attack mitigated by Cloudflare<br />
                • Suspicious login patterns<br />
                • Malware detected (contained)<br />
                • Unauthorized access attempt (blocked)
              </td>
              <td>&lt; 4 hours</td>
              <td>Security team, system logs</td>
            </tr>
            <tr>
              <td><strong>Low (P3)</strong></td>
              <td>
                • Single failed login<br />
                • Password reset request<br />
                • Minor configuration error<br />
                • Phishing email reported<br />
                • Routine vulnerability scan findings
              </td>
              <td>&lt; 24 hours</td>
              <td>Logged only (no immediate notification)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>3. Incident Response Team</h2>
        <table className="policy-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Responsibilities</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Security Lead (Ben)</strong></td>
              <td>
                • Overall incident commander<br />
                • External communications (parents, authorities)<br />
                • FERPA compliance and breach notifications<br />
                • Post-incident review coordination
              </td>
              <td>Primary: Slack @security-incidents<br />Backup: Email + SMS</td>
            </tr>
            <tr>
              <td><strong>Technical Lead (Matt)</strong></td>
              <td>
                • System investigation and forensics<br />
                • Remediation implementation<br />
                • Root cause analysis<br />
                • Technical containment measures
              </td>
              <td>Primary: Slack @security-incidents<br />Backup: Email + SMS</td>
            </tr>
            <tr>
              <td><strong>Product Lead</strong></td>
              <td>
                • User communications (students, teachers)<br />
                • Impact assessment (educational disruption)<br />
                • Stakeholder management<br />
                • Service recovery coordination
              </td>
              <td>Primary: Slack @security-incidents</td>
            </tr>
            <tr>
              <td><strong>Legal/Compliance</strong></td>
              <td>
                • FERPA breach notification oversight<br />
                • Regulatory compliance verification<br />
                • Liability assessment<br />
                • External counsel coordination (if needed)
              </td>
              <td>As needed (coordinated by Security Lead)</td>
            </tr>
            <tr>
              <td><strong>External Support</strong></td>
              <td>
                • Cloudflare: DDoS mitigation, WAF adjustments<br />
                • Datadog: Enhanced monitoring, log analysis<br />
                • Supabase/Lovable Cloud: Infrastructure support<br />
                • Google Cloud: Vertex AI security, IAM issues
              </td>
              <td>Vendor support portals (priority support enabled)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>4. Response Procedures (6-Phase Model)</h2>

        <div className="policy-subsection">
          <h3>Phase 1: Detection (0-15 minutes)</h3>
          <p><strong>Detection Sources:</strong></p>
          <ul>
            <li><strong>Automated Alerts:</strong> Datadog security monitoring, Cloudflare threat detection, Supabase RLS violations</li>
            <li><strong>Manual Reports:</strong> User complaints, system admin observations, security scan findings</li>
            <li><strong>Indicators of Compromise:</strong> Failed login spikes, unusual data access patterns, unexpected system behavior, performance degradation</li>
          </ul>
          <p><strong>Initial Actions:</strong></p>
          <ol>
            <li>Receive alert or report</li>
            <li>Verify incident is legitimate (not false positive)</li>
            <li>Classify severity using table in Section 2</li>
            <li>Activate incident response team via Slack (@security-incidents)</li>
            <li>Start incident log (timestamped Google Doc)</li>
          </ol>
        </div>

        <div className="policy-subsection">
          <h3>Phase 2: Containment (15 minutes - 2 hours)</h3>
          <p><strong>Immediate Containment Actions:</strong></p>
          <ul>
            <li><strong>Isolate Affected Systems:</strong>
              <ul>
                <li>Disable compromised user accounts (via Supabase Auth)</li>
                <li>Block malicious IPs via Cloudflare firewall rules</li>
                <li>Revoke suspicious authentication sessions</li>
                <li>Enable read-only mode if necessary (database-level)</li>
              </ul>
            </li>
            <li><strong>Evidence Preservation:</strong>
              <ul>
                <li>Export logs from <code>security_audit_log</code> table (timestamps, affected users, actions)</li>
                <li>Export Cloudflare access logs (IPs, request patterns)</li>
                <li>Export Datadog security events (alerts, anomalies)</li>
                <li>Take database snapshots (cold storage backup)</li>
                <li>Document all containment actions in incident log</li>
              </ul>
            </li>
          </ul>
          <p><strong>Do NOT at This Stage:</strong></p>
          <ul>
            <li>Patch vulnerabilities (may destroy evidence)</li>
            <li>Delete logs or accounts (preserve for forensics)</li>
            <li>Communicate externally (coordinate with Security Lead first)</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>Phase 3: Investigation (2-24 hours)</h3>
          <p><strong>Root Cause Analysis:</strong></p>
          <ul>
            <li><strong>Database Logs:</strong> Review <code>security_audit_log</code> for unauthorized access, privilege escalation, RLS policy violations</li>
            <li><strong>Cloudflare Logs:</strong> Analyze traffic patterns, blocked threats, WAF rule triggers</li>
            <li><strong>Datadog Alerts:</strong> Review security monitoring alerts, threat detection findings</li>
            <li><strong>Google Cloud Audit Logs:</strong> Verify Vertex AI access logs, IAM changes, API usage</li>
            <li><strong>Code Review:</strong> Examine recent deployments, configuration changes (via GitHub commit history)</li>
          </ul>
          <p><strong>Scope Determination:</strong></p>
          <ul>
            <li>Identify affected users (students, teachers, parents)</li>
            <li>Determine if student PII was exposed (names, emails, grades, voice recordings)</li>
            <li>Assess FERPA breach notification requirements (see Section 5)</li>
            <li>Quantify data loss or corruption</li>
            <li>Identify vulnerability exploited (if applicable)</li>
          </ul>
          <p><strong>Timeline Reconstruction:</strong></p>
          <ul>
            <li>First indication of compromise</li>
            <li>Attacker actions (access, exfiltration, modification)</li>
            <li>Duration of unauthorized access</li>
            <li>Data accessed or modified</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>Phase 4: Eradication (4-48 hours)</h3>
          <p><strong>Threat Removal Actions:</strong></p>
          <ul>
            <li>Patch vulnerability via emergency change management process (see Change Management Policy)</li>
            <li>Close security gaps (update RLS policies, strengthen authentication)</li>
            <li>Remove malicious code or accounts</li>
            <li>Reset compromised credentials (force password resets)</li>
            <li>Update firewall rules and security configurations</li>
          </ul>
          <p><strong>Verification:</strong></p>
          <ul>
            <li>Scan systems for remaining threats (Snyk code scan, vulnerability assessment)</li>
            <li>Verify RLS policies block unauthorized access</li>
            <li>Test authentication and access controls</li>
            <li>Confirm no backdoors remain</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>Phase 5: Recovery (24-72 hours)</h3>
          <p><strong>Restore Normal Operations:</strong></p>
          <ul>
            <li>Restore systems from clean backups (if necessary)</li>
            <li>Re-enable user accounts (after credential reset)</li>
            <li>Gradually restore services (monitor for re-infection)</li>
            <li>Validate data integrity (checksums, spot-checks)</li>
            <li>Implement enhanced monitoring (temporary increased logging)</li>
          </ul>
          <p><strong>Monitoring for Recurrence:</strong></p>
          <ul>
            <li>24/7 enhanced monitoring for 7 days post-incident</li>
            <li>Daily security log reviews</li>
            <li>Weekly vulnerability scans</li>
            <li>Incident response team on-call</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>Phase 6: Post-Incident Review (72 hours - 1 week)</h3>
          <p><strong>Blameless Postmortem:</strong></p>
          <ul>
            <li>What happened? (timeline, root cause)</li>
            <li>What went well? (effective containment, good communication)</li>
            <li>What could be improved? (detection speed, response procedures)</li>
            <li>What action items will prevent recurrence? (technical, process, training)</li>
          </ul>
          <p><strong>Documentation:</strong></p>
          <ul>
            <li>Incident report (timeline, impact, actions taken)</li>
            <li>Lessons learned summary</li>
            <li>Policy updates required</li>
            <li>Training needs identified</li>
          </ul>
          <p><strong>Stakeholder Reporting:</strong></p>
          <ul>
            <li>Executive summary for leadership</li>
            <li>Technical report for engineering team</li>
            <li>Compliance report for auditors (SOC 2)</li>
            <li>User communication (if applicable)</li>
          </ul>
        </div>
      </section>

      <section className="policy-section">
        <h2>5. FERPA Breach Notification Requirements</h2>
        <p><strong>When is Notification Required?</strong></p>
        <p>Under FERPA (34 CFR § 99.31), notification is required when there is unauthorized disclosure of education records containing personally identifiable information (PII).</p>
        
        <p><strong>Timeline:</strong></p>
        <ul>
          <li><strong>Internal Goal:</strong> Notify affected parents/students within 7 days of confirmed breach</li>
          <li><strong>Legal Requirement:</strong> Within 30 days (aim for faster to maintain trust)</li>
          <li><strong>Department of Education:</strong> Notify if breach affects &gt;500 individuals (within reasonable time)</li>
        </ul>

        <p><strong>Notification Content (Must Include):</strong></p>
        <ul>
          <li>Description of the breach (what happened, when discovered)</li>
          <li>Types of data exposed (e.g., student names, grades, voice recordings)</li>
          <li>Actions taken to contain and remediate (e.g., patched vulnerability, reset passwords)</li>
          <li>Steps users should take (e.g., monitor accounts, change passwords)</li>
          <li>Contact information for questions (Security Lead email, phone)</li>
          <li>Resources available (credit monitoring if SSNs exposed, counseling if sensitive data exposed)</li>
        </ul>

        <p><strong>Notification Methods:</strong></p>
        <ul>
          <li><strong>Email:</strong> Primary notification method (sent to parent email on file)</li>
          <li><strong>In-App Alert:</strong> Banner notification when users log in</li>
          <li><strong>Letter:</strong> Mailed to parent/guardian if email undeliverable</li>
          <li><strong>Public Disclosure:</strong> Only if required by state law or affects &gt;5,000 individuals</li>
        </ul>

        <p><strong>Documentation Requirements:</strong></p>
        <ul>
          <li>Maintain records of breach notification for 7 years</li>
          <li>Document all affected individuals notified</li>
          <li>Track notification delivery (email opens, bounces)</li>
          <li>Keep copies of all notification content</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>6. Communication Templates</h2>
        <div className="policy-subsection">
          <h3>6.1 Internal Notification (Slack Alert)</h3>
          <pre className="policy-code">
@security-incidents SECURITY INCIDENT DETECTED
Severity: [P0/P1/P2/P3]
Type: [Data Breach/Unauthorized Access/DDoS/etc.]
Affected Systems: [List]
Status: [Detection/Containment/Investigation/etc.]
Incident Commander: @ben
War Room: [Google Meet link]
Incident Doc: [Google Doc link]
          </pre>
        </div>

        <div className="policy-subsection">
          <h3>6.2 User Notification Email (Critical Breach)</h3>
          <pre className="policy-code">
Subject: Important Security Notice - Action Required

Dear [Parent Name / Student Name],

We are writing to inform you of a security incident that may have affected your account on the NabuLearn platform.

WHAT HAPPENED:
On [date], we discovered [brief description of incident]. We immediately took action to contain the incident and have since [remediation steps].

WHAT INFORMATION WAS INVOLVED:
[List specific data types: student names, grades, etc.]

WHAT WE ARE DOING:
• [Security measures implemented]
• [Enhanced monitoring]
• [Law enforcement involvement if applicable]

WHAT YOU SHOULD DO:
• Reset your password immediately using this link: [link]
• Review your account activity for any suspicious behavior
• Contact us at security@nabulearn.com with any concerns

We sincerely apologize for this incident and are committed to protecting your information.

Sincerely,
[Security Lead Name]
Security Lead, NabuLearn
[Contact information]
          </pre>
        </div>
      </section>

      <section className="policy-section">
        <h2>7. Testing & Training</h2>
        <ul>
          <li><strong>Quarterly Tabletop Exercises:</strong> Scenario-based incident response simulation (no system impact)</li>
          <li><strong>Annual Simulated Breach Drill:</strong> Full incident response test with actual system containment (controlled environment)</li>
          <li><strong>New Team Member Training:</strong> Within first 30 days of hire, complete incident response training</li>
          <li><strong>Phishing Simulations:</strong> Quarterly phishing tests to assess user awareness</li>
          <li><strong>Lessons Learned Reviews:</strong> After every P0 or P1 incident, conduct postmortem and update procedures</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>8. Escalation Procedures</h2>
        <p><strong>When to Escalate to Law Enforcement:</strong></p>
        <ul>
          <li>Criminal activity suspected (hacking, ransomware, fraud)</li>
          <li>Threats to student safety</li>
          <li>Data exfiltration for malicious purposes</li>
          <li>Nation-state actor involvement suspected</li>
        </ul>
        <p><strong>Escalation Contacts:</strong></p>
        <ul>
          <li><strong>FBI Cyber Division:</strong> https://www.fbi.gov/investigate/cyber (for major breaches)</li>
          <li><strong>Local Law Enforcement:</strong> [District-specific contact]</li>
          <li><strong>State Attorney General:</strong> [State-specific contact for breach notification laws]</li>
          <li><strong>Department of Education:</strong> privacy@ed.gov (for FERPA breaches)</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>9. Policy Review & Updates</h2>
        <ul>
          <li><strong>Review Frequency:</strong> Annually or after every P0/P1 incident</li>
          <li><strong>Approval Required:</strong> Security Lead + Technical Lead + Legal</li>
          <li><strong>Testing Required:</strong> Updated procedures tested in tabletop exercise before approval</li>
          <li><strong>Effective Date:</strong> Immediate upon approval</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>10. Related Policies</h2>
        <ul>
          <li>Access Control Policy</li>
          <li>Change Management Policy</li>
          <li>Data Retention and Destruction Policy</li>
          <li>Business Continuity and Disaster Recovery Policy</li>
        </ul>
      </section>

      <div className="policy-footer">
        <p><strong>Classification:</strong> Internal Use Only</p>
        <p><strong>Document Control:</strong> This policy is maintained by the Security Lead and stored in the shared Security Policies folder.</p>
        <p><strong>Emergency Contact:</strong> Security Lead (Ben) - Slack @security-incidents | Email: security@nabulearn.com</p>
      </div>
    </div>
  );
};
