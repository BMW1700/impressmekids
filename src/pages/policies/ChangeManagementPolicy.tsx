export const ChangeManagementPolicy = () => {
  return (
    <div className="policy-document">
      <div className="policy-header">
        <h1>Change Management Policy</h1>
        <div className="policy-meta">
          <p><strong>Version:</strong> 1.0</p>
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Document Owner:</strong> Security Lead (Ben)</p>
        </div>
      </div>

      <section className="policy-section">
        <h2>1. Policy Statement</h2>
        <p>This policy ensures all system changes to the Impress Me Kids (IMK) platform are authorized, tested, documented, and implemented in a controlled manner that minimizes risk to students, teachers, and data integrity. All changes must maintain compliance with SOC 2, FERPA, and COPPA requirements.</p>
        <p><strong>Objectives:</strong></p>
        <ul>
          <li>Minimize disruption to educational activities</li>
          <li>Prevent unauthorized or untested changes to production systems</li>
          <li>Maintain audit trail for compliance and troubleshooting</li>
          <li>Ensure rollback capability for all changes</li>
          <li>Balance security with agility for educational needs</li>
        </ul>
        <p><strong>Compliance Frameworks:</strong> SOC 2 Type I (CC8.1, CC8.2, CC8.3), FERPA, COPPA</p>
      </section>

      <section className="policy-section">
        <h2>2. Change Classification</h2>
        <table className="policy-table policy-table-wide">
          <thead>
            <tr>
              <th>Change Type</th>
              <th>Examples</th>
              <th>Testing Required</th>
              <th>Approval Required</th>
              <th>Rollback Plan</th>
              <th>Notification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Emergency</strong></td>
              <td>
                • Security patch (zero-day vulnerability)<br />
                • Critical bug fix (data loss prevention)<br />
                • System outage response<br />
                • Authentication bypass fix
              </td>
              <td>Minimal (production hotfix permitted)</td>
              <td>Security Lead verbal approval + written approval within 24 hours</td>
              <td>Mandatory (tested immediately after deployment)</td>
              <td>After deployment (immediate Slack + email)</td>
            </tr>
            <tr>
              <td><strong>Standard</strong></td>
              <td>
                • New features (assignments, games)<br />
                • UI updates<br />
                • Database schema changes<br />
                • API integrations<br />
                • RLS policy updates
              </td>
              <td>Full testing (dev → staging → production)</td>
              <td>Security Lead + Product Lead</td>
              <td>Mandatory (tested in staging)</td>
              <td>24 hours advance notice to district admins and teachers</td>
            </tr>
            <tr>
              <td><strong>Major</strong></td>
              <td>
                • Infrastructure changes (Google Vertex AI integration)<br />
                • Third-party service changes (Cloudflare, Datadog)<br />
                • Authentication system changes<br />
                • Database migrations affecting RLS<br />
                • Backup/restore procedures
              </td>
              <td>Extensive testing + security review + user acceptance testing (UAT)</td>
              <td>Security Lead + Product Lead + Technical Lead</td>
              <td>Mandatory + tested rollback in staging</td>
              <td>1 week advance notice + training materials provided</td>
            </tr>
            <tr>
              <td><strong>Routine</strong></td>
              <td>
                • Content updates (help docs, announcements)<br />
                • Documentation changes<br />
                • Configuration tweaks (non-security)<br />
                • UI copy changes<br />
                • Report generation updates
              </td>
              <td>Basic testing (dev environment)</td>
              <td>Security Lead or delegate</td>
              <td>Optional</td>
              <td>No notification needed</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>3. Change Request Process</h2>
        <div className="policy-subsection">
          <h3>Step 1: Request Submission</h3>
          <p>All changes must be documented via Jira ticket or GitHub issue containing:</p>
          <ul>
            <li><strong>Change Description:</strong> What is changing and why</li>
            <li><strong>Business Justification:</strong> Educational benefit, security improvement, bug fix</li>
            <li><strong>Risk Assessment:</strong> Impact on students, teachers, data (High/Medium/Low)</li>
            <li><strong>Testing Plan:</strong> Specific tests to verify functionality</li>
            <li><strong>Rollback Procedure:</strong> Step-by-step instructions to revert</li>
            <li><strong>Deployment Window:</strong> Proposed date/time (avoid peak usage)</li>
            <li><strong>Dependencies:</strong> Other systems, services, or changes required</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>Step 2: Security Review (Ben - Security Lead)</h3>
          <p>Security Lead reviews every change for:</p>
          <ul>
            <li><strong>RLS Policy Impact:</strong> Does change affect data access controls?</li>
            <li><strong>Data Access Changes:</strong> New permissions, role changes, or data exposure?</li>
            <li><strong>Audit Logging:</strong> Is change logged to <code>security_audit_log</code>?</li>
            <li><strong>Compliance Impact:</strong> FERPA, COPPA, or SOC 2 implications?</li>
            <li><strong>Google Vertex AI Security:</strong> IAM changes, API key updates, data handling?</li>
            <li><strong>Vulnerability Introduction:</strong> Potential security weaknesses?</li>
          </ul>
          <p><strong>Security Review Checklist:</strong></p>
          <pre className="policy-code">
□ RLS policies reviewed and updated (if applicable)
□ Authentication/authorization changes tested
□ Input validation added for new user inputs
□ SQL injection risks mitigated (parameterized queries)
□ Secrets not hardcoded (use environment variables)
□ HTTPS/TLS enforced for all endpoints
□ Audit logging implemented for sensitive actions
□ Compliance requirements verified (FERPA/COPPA)
□ Rollback tested and documented
□ Security testing completed (Snyk scan, manual review)
          </pre>
        </div>

        <div className="policy-subsection">
          <h3>Step 3: Testing & Validation</h3>
          <table className="policy-table">
            <thead>
              <tr>
                <th>Environment</th>
                <th>Purpose</th>
                <th>Testing Activities</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Development</strong></td>
                <td>Developer testing</td>
                <td>
                  • Unit tests<br />
                  • Integration tests<br />
                  • Code review (GitHub PR)<br />
                  • Snyk code scan (automated)
                </td>
              </tr>
              <tr>
                <td><strong>Staging</strong></td>
                <td>QA validation, security testing</td>
                <td>
                  • Functional testing (all user roles)<br />
                  • Security testing (RLS policies, authentication)<br />
                  • Performance testing (load, stress)<br />
                  • Datadog monitoring validation
                </td>
              </tr>
              <tr>
                <td><strong>UAT (for Major changes)</strong></td>
                <td>Teacher/admin preview</td>
                <td>
                  • Real-world usage scenarios<br />
                  • Feedback collection<br />
                  • Training materials validation
                </td>
              </tr>
              <tr>
                <td><strong>Production</strong></td>
                <td>Live deployment</td>
                <td>
                  • Smoke tests post-deployment<br />
                  • Monitoring for anomalies<br />
                  • Rollback readiness verification
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="policy-subsection">
          <h3>Step 4: Approval & Scheduling</h3>
          <p><strong>Approval Requirements by Change Type:</strong></p>
          <ul>
            <li><strong>Emergency:</strong> Security Lead verbal approval (written approval within 24 hours)</li>
            <li><strong>Standard:</strong> Security Lead + Product Lead (both must approve)</li>
            <li><strong>Major:</strong> Security Lead + Product Lead + Technical Lead (unanimous approval required)</li>
            <li><strong>Routine:</strong> Security Lead or authorized delegate</li>
          </ul>
          <p><strong>Deployment Windows (Avoid Peak Usage):</strong></p>
          <ul>
            <li><strong>Preferred:</strong> Weekends (Saturday/Sunday), school holidays, after 6 PM local time</li>
            <li><strong>Blackout Periods:</strong> Testing weeks, first week of school, parent-teacher conference days</li>
            <li><strong>Emergency:</strong> Any time (if critical security or data loss issue)</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>Step 5: Deployment</h3>
          <p><strong>Deployment Methods:</strong></p>
          <table className="policy-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Deployment Method</th>
                <th>Rollback Mechanism</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Frontend (React)</td>
                <td>Lovable Cloud automatic deployment via "Update" in publish dialog</td>
                <td>1-click rollback to previous version in Lovable dashboard</td>
              </tr>
              <tr>
                <td>Backend Functions</td>
                <td>Supabase Edge Functions deploy automatically when pushed to supabase/functions/</td>
                <td>Revert code, redeploy previous version</td>
              </tr>
              <tr>
                <td>Database Migrations</td>
                <td>SQL scripts in supabase/migrations/ (run via migration tool)</td>
                <td>Restore from cold storage backup (see Backup Management Policy)</td>
              </tr>
              <tr>
                <td>Google Vertex AI</td>
                <td>Cloud Build with approval gates, API configuration updates</td>
                <td>Revert to previous model version or API config</td>
              </tr>
              <tr>
                <td>Cloudflare Rules</td>
                <td>Manual changes via Cloudflare dashboard</td>
                <td>Restore previous rule configuration (version controlled in GitHub)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="policy-subsection">
          <h3>Step 6: Verification & Monitoring</h3>
          <p><strong>Post-Deployment Checks (within 1 hour):</strong></p>
          <ul>
            <li><strong>Smoke Tests:</strong> Verify core functionality (login, assignments, games, voice recording)</li>
            <li><strong>Datadog Monitoring:</strong> Check for error rate spikes, performance degradation</li>
            <li><strong>Security Audit Log:</strong> Review <code>security_audit_log</code> for unexpected access patterns</li>
            <li><strong>RLS Policy Validation:</strong> Test data access controls with different user roles</li>
            <li><strong>User Feedback:</strong> Monitor support channels (Slack, email) for user-reported issues</li>
          </ul>
          <p><strong>Rollback Criteria (Trigger Immediate Rollback if):</strong></p>
          <ul>
            <li>Error rate increases by >5% from baseline</li>
            <li>Critical functionality broken (login, grading, voice recording)</li>
            <li>Security vulnerability introduced (RLS bypass, authentication issue)</li>
            <li>Data corruption or loss detected</li>
            <li>Performance degradation >20% (page load times, API latency)</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>Step 7: Documentation</h3>
          <p>All changes must be documented in:</p>
          <ul>
            <li><strong>Change Log:</strong> Maintained in GitHub repository (CHANGELOG.md)</li>
            <li><strong>Release Notes:</strong> Published to users (if user-facing changes)</li>
            <li><strong>SOC 2 Audit Trail:</strong> Change approval records maintained for 7 years</li>
            <li><strong>Post-Deployment Report:</strong> Summary of deployment (success/failure, issues encountered, rollback performed)</li>
          </ul>
        </div>
      </section>

      <section className="policy-section">
        <h2>4. Emergency Change Procedures</h2>
        <p><strong>When to Use Emergency Process:</strong></p>
        <ul>
          <li>Zero-day security vulnerability actively exploited</li>
          <li>Critical bug causing data loss or student safety risk</li>
          <li>System outage preventing access to educational content</li>
          <li>Authentication bypass discovered</li>
          <li>FERPA violation requiring immediate remediation</li>
        </ul>
        <p><strong>Emergency Change Workflow:</strong></p>
        <ol>
          <li><strong>Verbal Approval:</strong> Security Lead or on-call engineer approves verbally (Slack, phone)</li>
          <li><strong>Minimal Testing:</strong> Test in staging if time permits (skip if life/safety issue)</li>
          <li><strong>Deploy to Production:</strong> Immediate deployment with enhanced monitoring</li>
          <li><strong>Notify Leadership:</strong> Inform Security Lead, Technical Lead, Product Lead immediately</li>
          <li><strong>Written Approval:</strong> Security Lead provides written approval within 24 hours (retroactive)</li>
          <li><strong>Post-Deployment Review:</strong> Mandatory within 48 hours (analyze emergency, improve procedures)</li>
        </ol>
        <p><strong>Emergency Change Log Template:</strong></p>
        <pre className="policy-code">
Emergency Change Record
Date/Time: [timestamp]
Deployed By: [name]
Approved By: [Security Lead name] (verbal approval at [time])
Reason: [critical issue description]
Change: [what was changed]
Testing: [minimal testing performed]
Rollback Plan: [how to revert if needed]
Post-Deployment Status: [success/issues encountered]
Follow-up Actions: [what needs to be done next]
        </pre>
      </section>

      <section className="policy-section">
        <h2>5. Rollback Procedures</h2>
        <div className="policy-subsection">
          <h3>5.1 Frontend Rollback</h3>
          <ol>
            <li>Log into Lovable dashboard</li>
            <li>Navigate to deployment history</li>
            <li>Select previous stable version</li>
            <li>Click "Rollback" (takes effect immediately)</li>
            <li>Verify rollback with smoke tests</li>
            <li>Notify users if visible changes reverted</li>
          </ol>
        </div>

        <div className="policy-subsection">
          <h3>5.2 Backend Function Rollback</h3>
          <ol>
            <li>Revert code changes in GitHub (git revert or cherry-pick previous version)</li>
            <li>Redeploy edge function (automatic via Supabase)</li>
            <li>Verify function behavior with test requests</li>
            <li>Monitor logs for errors</li>
          </ol>
        </div>

        <div className="policy-subsection">
          <h3>5.3 Database Migration Rollback</h3>
          <p><strong>Option 1: Reverse Migration (Preferred)</strong></p>
          <ol>
            <li>Create reverse migration SQL script (undo changes)</li>
            <li>Test reverse migration in staging</li>
            <li>Run reverse migration in production via migration tool</li>
            <li>Verify data integrity</li>
          </ol>
          <p><strong>Option 2: Cold Storage Backup Restore (Last Resort)</strong></p>
          <ol>
            <li>Request data restoration via <code>request-data-restoration</code> edge function</li>
            <li>Submit restoration request with justification</li>
            <li>Wait for admin approval</li>
            <li>Restore from cold storage backup (see Backup Management Policy)</li>
            <li><strong>WARNING:</strong> May result in data loss (transactions since backup timestamp)</li>
          </ol>
        </div>

        <div className="policy-subsection">
          <h3>5.4 Google Vertex AI Rollback</h3>
          <ol>
            <li>Revert to previous model version in Google Cloud Console</li>
            <li>Restore previous API configuration (IAM, VPC-SC, secrets)</li>
            <li>Update environment variables if API keys changed</li>
            <li>Verify AI features functioning (voice transcription, flashcard generation)</li>
          </ol>
        </div>
      </section>

      <section className="policy-section">
        <h2>6. Google Vertex AI-Specific Change Management</h2>
        <p>AI model and integration changes require additional controls due to potential bias, accuracy, and privacy implications:</p>
        <div className="policy-subsection">
          <h3>6.1 Model Updates</h3>
          <ul>
            <li><strong>Testing Requirements:</strong>
              <ul>
                <li>Test with diverse sample student data (different reading levels, accents)</li>
                <li>Bias detection analysis (ensure no demographic bias)</li>
                <li>Accuracy validation (compare to baseline model)</li>
                <li>Latency testing (response time within 5 seconds)</li>
              </ul>
            </li>
            <li><strong>Approval:</strong> Security Lead + Product Lead + Educational Content Lead</li>
            <li><strong>Rollback:</strong> Previous model version kept active for 30 days (instant rollback available)</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>6.2 API Configuration Changes</h3>
          <ul>
            <li><strong>IAM Permission Changes:</strong> Review for least privilege, test access controls</li>
            <li><strong>Secret Manager Key Updates:</strong> Rotate keys every 90 days, test before cutover</li>
            <li><strong>VPC Service Controls:</strong> Test network restrictions don't block legitimate traffic</li>
            <li><strong>Audit Logging:</strong> Verify Cloud Audit Logs capture all Vertex AI API calls</li>
          </ul>
        </div>

        <div className="policy-subsection">
          <h3>6.3 Deployment Method</h3>
          <p>Use Cloud Build with approval gates:</p>
          <ol>
            <li>Push code to GitHub (triggers Cloud Build)</li>
            <li>Automated tests run (unit, integration, security)</li>
            <li>Manual approval gate (Security Lead reviews build artifacts)</li>
            <li>Deploy to production (with automatic rollback on failure)</li>
          </ol>
        </div>
      </section>

      <section className="policy-section">
        <h2>7. Stakeholder Notifications</h2>
        <table className="policy-table">
          <thead>
            <tr>
              <th>Change Type</th>
              <th>Notification Method</th>
              <th>Timing</th>
              <th>Recipients</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Emergency</td>
              <td>Slack + email</td>
              <td>Immediately after deployment</td>
              <td>All users (district admins, teachers, parents)</td>
            </tr>
            <tr>
              <td>Standard</td>
              <td>Email + in-app banner</td>
              <td>24 hours before deployment</td>
              <td>District admins, teachers</td>
            </tr>
            <tr>
              <td>Major</td>
              <td>Email + in-app banner + training session</td>
              <td>1 week before deployment</td>
              <td>All users + training materials provided</td>
            </tr>
            <tr>
              <td>Routine</td>
              <td>None</td>
              <td>N/A</td>
              <td>N/A</td>
            </tr>
          </tbody>
        </table>

        <p><strong>Maintenance Window Communication Template:</strong></p>
        <pre className="policy-code">
Subject: Scheduled Maintenance - [Date/Time]

Dear Impress Me Kids Users,

We will be performing scheduled maintenance on [date] from [start time] to [end time].

WHAT TO EXPECT:
• [Brief description of changes]
• Expected downtime: [duration] (if applicable)
• New features available after maintenance: [list]

WHAT YOU SHOULD DO:
• Save any in-progress work before [start time]
• Plan assignments around maintenance window
• Contact support@impressmekids.com with questions

Thank you for your patience as we improve the platform.

Sincerely,
Impress Me Kids Team
        </pre>
      </section>

      <section className="policy-section">
        <h2>8. Roles & Responsibilities</h2>
        <table className="policy-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Responsibilities</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Security Lead (Ben)</strong></td>
              <td>
                • Approve all changes with security/compliance impact<br />
                • Conduct security reviews (RLS policies, audit logging)<br />
                • Enforce change management policy<br />
                • Review emergency changes within 24 hours
              </td>
            </tr>
            <tr>
              <td><strong>Technical Lead (Matt)</strong></td>
              <td>
                • Approve infrastructure and architecture changes<br />
                • Conduct technical reviews (performance, scalability)<br />
                • Oversee Google Vertex AI integration changes<br />
                • Validate rollback procedures
              </td>
            </tr>
            <tr>
              <td><strong>Product Lead</strong></td>
              <td>
                • Approve feature changes and UI updates<br />
                • Coordinate user communications and training<br />
                • Assess educational impact of changes<br />
                • Manage maintenance window scheduling
              </td>
            </tr>
            <tr>
              <td><strong>Developers</strong></td>
              <td>
                • Submit change requests with complete documentation<br />
                • Conduct testing in dev and staging environments<br />
                • Document rollback procedures<br />
                • Monitor post-deployment for issues
              </td>
            </tr>
            <tr>
              <td><strong>QA/Testing</strong></td>
              <td>
                • Validate changes in staging environment<br />
                • Execute test plans (functional, security, performance)<br />
                • Document bugs and regressions<br />
                • Approve changes for production deployment
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="policy-section">
        <h2>9. Metrics & Continuous Improvement</h2>
        <p>The following metrics are tracked monthly to assess change management effectiveness:</p>
        <table className="policy-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Target</th>
              <th>Action if Below Target</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Change Success Rate</td>
              <td>&gt; 95%</td>
              <td>Review failed changes, improve testing procedures</td>
            </tr>
            <tr>
              <td>Rollback Frequency</td>
              <td>&lt; 5% of changes</td>
              <td>Enhance staging testing, improve approval process</td>
            </tr>
            <tr>
              <td>Mean Time to Deployment</td>
              <td>Tracked for optimization</td>
              <td>Identify bottlenecks, streamline approval process</td>
            </tr>
            <tr>
              <td>Security Incident Rate Post-Change</td>
              <td>0 incidents</td>
              <td>Strengthen security review, mandatory Snyk scans</td>
            </tr>
            <tr>
              <td>Emergency Change Frequency</td>
              <td>&lt; 5% of all changes</td>
              <td>Improve proactive testing, reduce reactive fixes</td>
            </tr>
          </tbody>
        </table>
        <p><strong>Quarterly Review:</strong> Change management process reviewed quarterly by Security Lead, Technical Lead, and Product Lead to identify improvements.</p>
      </section>

      <section className="policy-section">
        <h2>10. Exceptions & Waivers</h2>
        <p>Exceptions to this policy require written approval from Security Lead and must include:</p>
        <ul>
          <li>Justification for exception (e.g., critical educational need, vendor limitation)</li>
          <li>Compensating controls (e.g., enhanced monitoring, manual testing)</li>
          <li>Expiration date (maximum 90 days for non-emergency exceptions)</li>
          <li>Risk acceptance by leadership</li>
          <li>Review by Technical Lead and Product Lead</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>11. Policy Review & Updates</h2>
        <ul>
          <li><strong>Review Frequency:</strong> Quarterly or after significant process failure</li>
          <li><strong>Approval Required:</strong> Security Lead + Technical Lead + Product Lead</li>
          <li><strong>Testing Required:</strong> Updated procedures tested with sample change before approval</li>
          <li><strong>Effective Date:</strong> 30 days after approval (allows time for team training)</li>
        </ul>
      </section>

      <section className="policy-section">
        <h2>12. Related Policies</h2>
        <ul>
          <li>Incident Response Policy (emergency changes)</li>
          <li>Access Control Policy (RLS policy changes)</li>
          <li>Backup Management Policy (database rollback procedures)</li>
          <li>Security Patch Management Policy</li>
        </ul>
      </section>

      <div className="policy-footer">
        <p><strong>Classification:</strong> Internal Use Only</p>
        <p><strong>Document Control:</strong> This policy is maintained by the Security Lead and stored in the shared Security Policies folder.</p>
      </div>
    </div>
  );
};
