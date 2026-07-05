import { Card } from "@/components/ui/card";

export const BackupDisasterRecoveryPolicy = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Backup & Disaster Recovery Policy</h1>
        <p className="text-muted-foreground">YubiLearn</p>
        <p className="text-sm text-muted-foreground">Effective Date: January 2025 | Version 1.0</p>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">1. Policy Overview & Scope</h2>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Purpose</h3>
        <p className="mb-4">
          This Backup & Disaster Recovery Policy establishes comprehensive procedures to ensure the availability, 
          integrity, and recoverability of all critical data and systems for YubiLearn. The policy defines 
          backup procedures, disaster recovery processes, business continuity planning, and testing requirements 
          to protect student educational data and maintain service availability.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Objectives</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Protect student educational data from loss, corruption, or unauthorized access</li>
          <li>Ensure business continuity and rapid recovery from disaster scenarios</li>
          <li>Meet regulatory requirements (FERPA, COPPA, SOC 2)</li>
          <li>Maintain defined Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)</li>
          <li>Provide transparent, auditable backup and recovery processes</li>
          <li>Minimize service disruption and data loss during incidents</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">1.3 Scope</h3>
        <p className="mb-4">
          This policy applies to all YubiLearn systems, applications, and data, including:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Production Database</strong>: All student profiles, assignments, classrooms, authentication data</li>
          <li><strong>Audio Recordings</strong>: AURA voice analysis recordings and assignment audio</li>
          <li><strong>File Storage</strong>: Images, attachments, and user-generated content</li>
          <li><strong>Configuration Data</strong>: System settings, policies, and metadata</li>
          <li><strong>Audit Logs</strong>: Security audit trails and compliance records</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">2. Backup Procedures</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Automated Daily Backups</h3>
        <p className="mb-4">
          <strong>Schedule</strong>: Daily at 2:00 AM UTC via automated edge function<br/>
          <strong>Technology</strong>: AWS S3 Cold Storage (us-east-1)<br/>
          <strong>Encryption</strong>: AES-256-GCM encryption at rest<br/>
          <strong>Automation</strong>: Triggered by pg_cron scheduler with CRON_SECRET authentication
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Backup Coverage</h3>
        <p className="mb-4">The following critical tables are backed up daily:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Student Data</strong>: profiles, public_profiles, classroom_students</li>
          <li><strong>Educational Content</strong>: assignments, questions, flashcard_sets</li>
          <li><strong>Assessment Data</strong>: assignment_submissions, assignment_answers, aura_records</li>
          <li><strong>Classroom Management</strong>: classrooms, events, classroom_announcements</li>
          <li><strong>Parent Access</strong>: parent_accounts, parent_student_links, parent_consents</li>
          <li><strong>Tournament Data</strong>: tournaments, matches, tournament_players</li>
          <li><strong>Security Logs</strong>: backup_audit_log, aura_access_log (immutable)</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Backup Verification</h3>
        <p className="mb-4">
          <strong>Health Checks</strong>: Automated daily verification via check-backup-health edge function<br/>
          <strong>Validation</strong>: Confirms backup completion, size validation, and S3 accessibility<br/>
          <strong>Alerting</strong>: Failed backups trigger immediate notification to System Administrator<br/>
          <strong>Audit Trail</strong>: All backup operations logged to immutable backup_audit_log table
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Retention Policy</h3>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Backup Type</th>
                <th className="border border-border px-4 py-2 text-left">Retention Period</th>
                <th className="border border-border px-4 py-2 text-left">Storage Location</th>
                <th className="border border-border px-4 py-2 text-left">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2">Operational Backups</td>
                <td className="border border-border px-4 py-2">180 days</td>
                <td className="border border-border px-4 py-2">AWS S3 Cold Storage</td>
                <td className="border border-border px-4 py-2">Disaster recovery, data restoration</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">Annual Archive</td>
                <td className="border border-border px-4 py-2">7 years</td>
                <td className="border border-border px-4 py-2">AWS S3 Glacier Deep Archive</td>
                <td className="border border-border px-4 py-2">FERPA compliance, long-term archival</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">Audit Logs</td>
                <td className="border border-border px-4 py-2">7 years</td>
                <td className="border border-border px-4 py-2">Immutable database table</td>
                <td className="border border-border px-4 py-2">Compliance, security investigations</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">2.5 Automated Cleanup</h3>
        <p className="mb-4">
          <strong>Schedule</strong>: Daily at 2:00 AM UTC (after backup creation)<br/>
          <strong>Process</strong>: cleanup-old-backups edge function removes backups older than 180 days<br/>
          <strong>Audit</strong>: All deletion operations logged with reason and timestamp<br/>
          <strong>Exceptions</strong>: Annual archival backups and legal hold items preserved
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">3. Recovery Time & Point Objectives</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Recovery Point Objective (RPO)</h3>
        <p className="mb-4">
          <strong>Target</strong>: 24 hours maximum data loss<br/>
          <strong>Rationale</strong>: Daily backups at 2:00 AM UTC ensure maximum 24-hour data loss window<br/>
          <strong>Acceptable Risk</strong>: Up to one day of assignment submissions and practice sessions may require re-entry
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Recovery Time Objective (RTO)</h3>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">System Component</th>
                <th className="border border-border px-4 py-2 text-left">Priority</th>
                <th className="border border-border px-4 py-2 text-left">RTO Target</th>
                <th className="border border-border px-4 py-2 text-left">Impact if Down</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2">Authentication System</td>
                <td className="border border-border px-4 py-2">Critical</td>
                <td className="border border-border px-4 py-2">4 hours</td>
                <td className="border border-border px-4 py-2">No user access to platform</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">Core Database</td>
                <td className="border border-border px-4 py-2">Critical</td>
                <td className="border border-border px-4 py-2">4 hours</td>
                <td className="border border-border px-4 py-2">Complete service outage</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">Edge Functions</td>
                <td className="border border-border px-4 py-2">High</td>
                <td className="border border-border px-4 py-2">8 hours</td>
                <td className="border border-border px-4 py-2">AI features unavailable</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">File Storage (Audio)</td>
                <td className="border border-border px-4 py-2">High</td>
                <td className="border border-border px-4 py-2">8 hours</td>
                <td className="border border-border px-4 py-2">AURA recordings inaccessible</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">Analytics & Reports</td>
                <td className="border border-border px-4 py-2">Medium</td>
                <td className="border border-border px-4 py-2">24 hours</td>
                <td className="border border-border px-4 py-2">Teacher insights delayed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">4. Disaster Recovery Procedures</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Disaster Scenarios</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Data Corruption</strong>: Database integrity compromise due to software bug or malicious activity</li>
          <li><strong>Accidental Deletion</strong>: Unintended mass deletion of student or classroom data</li>
          <li><strong>Cyberattack</strong>: Ransomware, SQL injection, or unauthorized data modification</li>
          <li><strong>Hardware Failure</strong>: Supabase infrastructure outage or storage system failure</li>
          <li><strong>Human Error</strong>: Incorrect data migration or deployment rollback requirement</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Response Team & Roles</h3>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Role</th>
                <th className="border border-border px-4 py-2 text-left">Responsibilities</th>
                <th className="border border-border px-4 py-2 text-left">Authority Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2">System Administrator</td>
                <td className="border border-border px-4 py-2">Incident detection, initial assessment, restoration request submission</td>
                <td className="border border-border px-4 py-2">Requester only</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">Database Administrator</td>
                <td className="border border-border px-4 py-2">Backup validation, restoration execution, data integrity verification</td>
                <td className="border border-border px-4 py-2">Executor (post-approval)</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">Security Officer</td>
                <td className="border border-border px-4 py-2">Audit log review, compliance verification, approval authority</td>
                <td className="border border-border px-4 py-2">Approver</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">Senior Management</td>
                <td className="border border-border px-4 py-2">Final approval for major restorations, stakeholder communication</td>
                <td className="border border-border px-4 py-2">Final approver</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Recovery Process Steps</h3>
        
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Step 1: Incident Detection & Assessment</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>Identify the incident type, scope, and affected systems</li>
            <li>Estimate data loss window (time range of affected data)</li>
            <li>Determine impact on users, classrooms, and educational activities</li>
            <li>Document initial findings in incident report</li>
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Step 2: Restoration Request Submission</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>System Administrator submits formal restoration request via admin dashboard</li>
            <li>Required information: backup_id, reason, urgency level, contact details</li>
            <li>Specify which tables need restoration (selective or full restore)</li>
            <li>Request logged to data_restoration_requests table with "pending" status</li>
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Step 3: Multi-Party Approval Process</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Security Officer Review</strong>: Verify request legitimacy, assess security implications</li>
            <li><strong>Management Approval</strong>: Senior management review for major restorations</li>
            <li><strong>Separation of Duties</strong>: Requester cannot approve their own restoration request</li>
            <li><strong>Audit Trail</strong>: All approval actions logged with timestamp and reviewer ID</li>
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Step 4: Data Restoration Execution</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>Database Administrator retrieves encrypted backup from AWS S3</li>
            <li>Decrypt backup using BACKUP_ENCRYPTION_KEY</li>
            <li>Create staging database for restoration (test before production)</li>
            <li>Restore selected tables to staging environment</li>
            <li>Validate data integrity and completeness</li>
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Step 5: Validation & Testing</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>Verify row counts match backup metadata</li>
            <li>Test critical user workflows (authentication, assignments, AURA)</li>
            <li>Confirm no data corruption or missing records</li>
            <li>Review audit logs for any anomalies during restoration</li>
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Step 6: Service Restoration</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>Schedule maintenance window for production restoration</li>
            <li>Notify all users of brief service interruption</li>
            <li>Promote validated staging data to production</li>
            <li>Resume normal operations and monitor for issues</li>
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Step 7: Post-Incident Review</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>Document incident timeline, root cause, and resolution</li>
            <li>Update restoration request status to "completed"</li>
            <li>Identify lessons learned and process improvements</li>
            <li>Update disaster recovery procedures if needed</li>
            <li>Communicate resolution to affected stakeholders</li>
          </ul>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">5. Business Continuity Planning</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Critical Systems Identification</h3>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">System</th>
                <th className="border border-border px-4 py-2 text-left">Business Impact</th>
                <th className="border border-border px-4 py-2 text-left">Dependencies</th>
                <th className="border border-border px-4 py-2 text-left">Failover Strategy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2">Database</td>
                <td className="border border-border px-4 py-2">Complete outage</td>
                <td className="border border-border px-4 py-2">Supabase infrastructure</td>
                <td className="border border-border px-4 py-2">Supabase multi-region redundancy</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">Authentication</td>
                <td className="border border-border px-4 py-2">No user access</td>
                <td className="border border-border px-4 py-2">Supabase Auth</td>
                <td className="border border-border px-4 py-2">Built-in high availability</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">Edge Functions</td>
                <td className="border border-border px-4 py-2">AI features down</td>
                <td className="border border-border px-4 py-2">Deno runtime</td>
                <td className="border border-border px-4 py-2">Automatic container restart</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">File Storage</td>
                <td className="border border-border px-4 py-2">Audio inaccessible</td>
                <td className="border border-border px-4 py-2">S3-compatible storage</td>
                <td className="border border-border px-4 py-2">S3 cross-region replication</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Communication Plan</h3>
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Internal Communication</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Immediate</strong>: Alert System Administrator and Database Administrator via email/SMS</li>
            <li><strong>Within 1 hour</strong>: Notify Security Officer and Senior Management</li>
            <li><strong>Status Updates</strong>: Hourly updates to response team during active incident</li>
          </ul>
        </div>
        
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">External Communication</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Status</strong>: Update status page with incident description and ETA</li>
            <li><strong>User Notification</strong>: In-app banner and email to all affected schools/teachers</li>
            <li><strong>Transparency</strong>: Provide estimated restoration time and impact scope</li>
            <li><strong>Post-Resolution</strong>: Summary email detailing incident, resolution, and preventive measures</li>
          </ul>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Alternative Operations</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Read-Only Mode</strong>: Enable view-only access during database restoration</li>
          <li><strong>Cached Data</strong>: Serve cached assignments and classroom data when possible</li>
          <li><strong>Offline Assignments</strong>: Teachers can download assignments for offline distribution</li>
          <li><strong>Manual Processes</strong>: Document procedures for critical manual operations during outage</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">6. Testing & Validation</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Quarterly Backup Integrity Tests</h3>
        <p className="mb-4"><strong>Frequency</strong>: Every 3 months (March, June, September, December)</p>
        <p className="mb-4"><strong>Procedure</strong>:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Select random backup from past 30 days</li>
          <li>Restore to isolated staging environment</li>
          <li>Verify data integrity (row counts, relationships, constraints)</li>
          <li>Test sample queries and data retrieval</li>
          <li>Document test results and any issues found</li>
          <li>Update backup procedures if problems identified</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Annual Disaster Recovery Simulation</h3>
        <p className="mb-4"><strong>Frequency</strong>: Annually (January)</p>
        <p className="mb-4"><strong>Procedure</strong>:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Simulate realistic disaster scenario (e.g., database corruption)</li>
          <li>Execute full disaster recovery process end-to-end</li>
          <li>Involve all response team members in defined roles</li>
          <li>Measure actual RTO/RPO against targets</li>
          <li>Test communication plans and escalation procedures</li>
          <li>Document lessons learned and improvement opportunities</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Success Criteria</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Backup restoration completes within RTO targets</li>
          <li>Zero data loss or corruption detected post-restoration</li>
          <li>All authentication and core functions operational</li>
          <li>Audit trail complete and accurate</li>
          <li>Communication plan executed effectively</li>
          <li>Response team demonstrates competency in roles</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">6.4 Documentation Updates</h3>
        <p className="mb-4">
          After each test or actual disaster recovery event, the following documents must be updated:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Test results report with date, participants, and outcomes</li>
          <li>Process improvements identified during test</li>
          <li>Updated contact information for response team</li>
          <li>Revised RTO/RPO targets if needed</li>
          <li>This Backup & Disaster Recovery Policy (if procedures change)</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">7. Roles & Responsibilities</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">7.1 System Administrator</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Monitor daily backup completion via health checks</li>
          <li>Investigate and resolve backup failures</li>
          <li>Submit restoration requests when incidents occur</li>
          <li>Maintain backup schedules and automation</li>
          <li>Coordinate with Database Administrator during recovery</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Database Administrator</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Execute approved restoration requests</li>
          <li>Validate backup integrity and completeness</li>
          <li>Manage backup encryption keys (BACKUP_ENCRYPTION_KEY)</li>
          <li>Perform quarterly backup restoration tests</li>
          <li>Document restoration procedures and outcomes</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Security Officer</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Review and approve restoration requests</li>
          <li>Audit backup and restoration logs for anomalies</li>
          <li>Ensure compliance with FERPA/COPPA requirements</li>
          <li>Maintain separation of duties controls</li>
          <li>Conduct annual disaster recovery simulations</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">7.4 Senior Management</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Provide final approval for major restorations</li>
          <li>Allocate resources for backup infrastructure</li>
          <li>Communicate with stakeholders during incidents</li>
          <li>Review annual policy effectiveness</li>
          <li>Authorize exceptions to standard procedures</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">8. Data Retention & Archival</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Operational Backup Retention</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Duration</strong>: 180 days (6 months)</li>
          <li><strong>Storage</strong>: AWS S3 Cold Storage (us-east-1)</li>
          <li><strong>Purpose</strong>: Disaster recovery, accidental deletion recovery, data restoration</li>
          <li><strong>Cleanup</strong>: Automated daily via cleanup-old-backups edge function</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Long-Term Archival</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Duration</strong>: 7 years (FERPA requirement for educational records)</li>
          <li><strong>Storage</strong>: AWS S3 Glacier Deep Archive</li>
          <li><strong>Frequency</strong>: Annual snapshot at end of each school year (June 30)</li>
          <li><strong>Content</strong>: Complete database snapshot including all student educational records</li>
          <li><strong>Retrieval</strong>: 12-48 hour retrieval time for compliance or legal requests</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Secure Deletion</h3>
        <p className="mb-4">
          When backups are deleted after retention period expires:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>AWS S3 permanently deletes objects (no soft delete or versioning)</li>
          <li>Deletion logged to backup_audit_log with reason "retention_expired"</li>
          <li>Encryption keys rotated annually to ensure deleted backups cannot be recovered</li>
          <li>Annual archival backups exempt from automated deletion</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">8.4 Legal Hold Procedures</h3>
        <p className="mb-4">
          If legal hold is required (litigation, investigation, audit):
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Mark specific backups as "legal_hold" in cold_storage_backups table</li>
          <li>Automated cleanup skips backups with legal_hold status</li>
          <li>Document hold reason, requesting party, and case reference</li>
          <li>Release hold only upon written authorization from legal counsel</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">9. Security Controls</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.1 Encryption</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>At Rest</strong>: AES-256-GCM encryption for all backups in S3</li>
          <li><strong>In Transit</strong>: TLS 1.3 for all backup transfers to/from AWS</li>
          <li><strong>Key Management</strong>: BACKUP_ENCRYPTION_KEY stored as Supabase secret (never in code)</li>
          <li><strong>Key Rotation</strong>: Annual encryption key rotation with documented procedure</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Access Control</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Automation</strong>: CRON_SECRET required for scheduled backup/cleanup jobs</li>
          <li><strong>Admin Only</strong>: Only admin role can submit restoration requests</li>
          <li><strong>Multi-Party Approval</strong>: Requester cannot approve their own restoration</li>
          <li><strong>AWS Credentials</strong>: COLD_STORAGE_ACCESS_KEY and COLD_STORAGE_SECRET_KEY limited to S3 bucket only</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.3 Audit Logging</h3>
        <p className="mb-4">
          All backup and restoration operations logged to <strong>backup_audit_log</strong> table:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Immutable</strong>: Logs cannot be modified or deleted (enforced by trigger)</li>
          <li><strong>What's Logged</strong>: Action type, performed_by, status, error messages, action details</li>
          <li><strong>Retention</strong>: 7 years for compliance</li>
          <li><strong>Monitoring</strong>: Security Officer reviews logs quarterly</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">9.4 Separation of Duties</h3>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Function</th>
                <th className="border border-border px-4 py-2 text-left">Role Authorized</th>
                <th className="border border-border px-4 py-2 text-left">Separation Control</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2">Submit Restoration Request</td>
                <td className="border border-border px-4 py-2">System Administrator</td>
                <td className="border border-border px-4 py-2">Cannot approve own request</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">Approve Restoration Request</td>
                <td className="border border-border px-4 py-2">Security Officer / Management</td>
                <td className="border border-border px-4 py-2">Cannot be requester</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">Execute Restoration</td>
                <td className="border border-border px-4 py-2">Database Administrator</td>
                <td className="border border-border px-4 py-2">Requires approved request</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">Audit Log Review</td>
                <td className="border border-border px-4 py-2">Security Officer</td>
                <td className="border border-border px-4 py-2">Independent from operations</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">10. SOC 2 Control Mappings</h2>

        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Control ID</th>
                <th className="border border-border px-4 py-2 text-left">Trust Services Criteria</th>
                <th className="border border-border px-4 py-2 text-left">Control Description</th>
                <th className="border border-border px-4 py-2 text-left">Implementation Evidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2">CC9.1</td>
                <td className="border border-border px-4 py-2">Common Criteria - Risk Mitigation</td>
                <td className="border border-border px-4 py-2">Risk assessment identifies backup risks; mitigation procedures in place</td>
                <td className="border border-border px-4 py-2">Daily automated backups, health checks, documented DR procedures</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">A1.2</td>
                <td className="border border-border px-4 py-2">Availability - Backup & Recovery</td>
                <td className="border border-border px-4 py-2">System availability maintained through backup and recovery capabilities</td>
                <td className="border border-border px-4 py-2">180-day backup retention, defined RTO/RPO targets, quarterly tests</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">A1.3</td>
                <td className="border border-border px-4 py-2">Availability - Recovery & Continuity</td>
                <td className="border border-border px-4 py-2">Recovery and business continuity procedures documented and tested</td>
                <td className="border border-border px-4 py-2">Annual DR simulation, documented recovery steps, alternative operations plan</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">CC6.1</td>
                <td className="border border-border px-4 py-2">Common Criteria - Logical Access</td>
                <td className="border border-border px-4 py-2">Logical access controls restrict backup access to authorized personnel</td>
                <td className="border border-border px-4 py-2">CRON_SECRET authentication, admin-only restoration requests, AWS IAM policies</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">CC6.6</td>
                <td className="border border-border px-4 py-2">Common Criteria - Encryption</td>
                <td className="border border-border px-4 py-2">Sensitive data encrypted at rest and in transit</td>
                <td className="border border-border px-4 py-2">AES-256-GCM encryption for backups, TLS 1.3 for transfers, key rotation</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">CC7.2</td>
                <td className="border border-border px-4 py-2">Common Criteria - System Monitoring</td>
                <td className="border border-border px-4 py-2">System monitoring detects and reports anomalies</td>
                <td className="border border-border px-4 py-2">Daily backup health checks, automated alerting on failures, audit log monitoring</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">PI1.5</td>
                <td className="border border-border px-4 py-2">Processing Integrity - Data Retention</td>
                <td className="border border-border px-4 py-2">Data retention and disposal procedures align with legal requirements</td>
                <td className="border border-border px-4 py-2">180-day operational retention, 7-year archival (FERPA), automated cleanup, secure deletion</td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-2">CC8.1</td>
                <td className="border border-border px-4 py-2">Common Criteria - Change Management</td>
                <td className="border border-border px-4 py-2">Changes to backup systems authorized, tested, and documented</td>
                <td className="border border-border px-4 py-2">Change approval process, testing in staging, rollback procedures documented</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">11. Compliance & Audit</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">11.1 FERPA Requirements</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>7-Year Retention</strong>: Educational records backed up and archived for minimum 7 years</li>
          <li><strong>Secure Storage</strong>: Encrypted backups prevent unauthorized access to student PII</li>
          <li><strong>Audit Trail</strong>: All backup access logged for compliance audits</li>
          <li><strong>Parental Rights</strong>: Restoration procedures support parental data access requests</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">11.2 COPPA Requirements</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Parental Consent Preservation</strong>: parent_consents table backed up to prove compliance</li>
          <li><strong>Data Deletion Requests</strong>: Restoration capability supports verification of deletion</li>
          <li><strong>Audio Recording Consent</strong>: aura_recording_consent flags preserved in backups</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">11.3 Annual Policy Review</h3>
        <p className="mb-4"><strong>Schedule</strong>: Annually in January (aligned with DR simulation)</p>
        <p className="mb-4"><strong>Review Process</strong>:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Evaluate policy effectiveness based on test results and actual incidents</li>
          <li>Review RTO/RPO targets against business requirements</li>
          <li>Update contact information and team roles</li>
          <li>Assess new threats or regulatory changes</li>
          <li>Document review findings and policy updates</li>
          <li>Obtain management approval for policy changes</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">11.4 Continuous Monitoring</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Daily</strong>: Automated backup health checks verify completion and integrity</li>
          <li><strong>Weekly</strong>: System Administrator reviews backup logs for anomalies</li>
          <li><strong>Monthly</strong>: Security Officer spot-checks audit logs for compliance</li>
          <li><strong>Quarterly</strong>: Backup restoration test to validate recovery procedures</li>
          <li><strong>Annually</strong>: Full disaster recovery simulation with all stakeholders</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">11.5 Exception Handling</h3>
        <p className="mb-4">
          If a backup fails or health check detects issues:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Immediate Alert</strong>: Notify System Administrator via automated alert</li>
          <li><strong>Investigation</strong>: Identify root cause within 2 hours</li>
          <li><strong>Remediation</strong>: Fix issue and manually trigger backup if needed</li>
          <li><strong>Documentation</strong>: Log exception, cause, and resolution in backup_audit_log</li>
          <li><strong>Management Escalation</strong>: Escalate to Security Officer if failure exceeds 24 hours</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">12. Documentation & Records</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">12.1 Backup Logs</h3>
        <p className="mb-4"><strong>Location</strong>: backup_audit_log table (immutable)</p>
        <p className="mb-4"><strong>Content</strong>:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Backup creation timestamp and backup_id</li>
          <li>Tables included and record counts</li>
          <li>Backup size and storage location</li>
          <li>Encryption method and completion status</li>
          <li>Health check results (pass/fail)</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">12.2 Restoration Requests</h3>
        <p className="mb-4"><strong>Location</strong>: data_restoration_requests table</p>
        <p className="mb-4"><strong>Content</strong>:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Request submission date and requested_by user</li>
          <li>Backup ID and requested tables</li>
          <li>Reason, urgency level, contact information</li>
          <li>Approval status, reviewed_by, review_notes</li>
          <li>Resolution status and completion timestamp</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">12.3 Test Results</h3>
        <p className="mb-4"><strong>Documentation Required</strong>:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Test date, type (quarterly integrity or annual DR simulation)</li>
          <li>Participants and their roles</li>
          <li>Test scenario and expected outcomes</li>
          <li>Actual results (RTO/RPO achieved, data integrity verified)</li>
          <li>Issues identified and resolution plans</li>
          <li>Recommendations for process improvements</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">12.4 Incident Reports</h3>
        <p className="mb-4"><strong>Required for All Disaster Recovery Events</strong>:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Incident timeline (detection, response, resolution)</li>
          <li>Root cause analysis and contributing factors</li>
          <li>Impact assessment (users affected, data loss, downtime)</li>
          <li>Response actions taken and effectiveness</li>
          <li>Lessons learned and preventive measures</li>
          <li>Policy or procedure updates recommended</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">13. Policy Maintenance</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">13.1 Version Control</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Current Version</strong>: 1.0</li>
          <li><strong>Effective Date</strong>: January 2025</li>
          <li><strong>Next Review</strong>: January 2026</li>
          <li><strong>Version History</strong>: Maintained with change log for each revision</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">13.2 Change Management</h3>
        <p className="mb-4">Policy changes must be:</p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Proposed with justification and impact analysis</li>
          <li>Reviewed by Security Officer and Database Administrator</li>
          <li>Approved by Senior Management before implementation</li>
          <li>Communicated to all relevant staff</li>
          <li>Documented with version number and change description</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">13.3 Training Requirements</h3>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Initial Training</strong>: All response team members upon policy adoption</li>
          <li><strong>Annual Refresher</strong>: During disaster recovery simulation</li>
          <li><strong>New Staff</strong>: Training within 30 days of role assignment</li>
          <li><strong>Documentation</strong>: Training records maintained for audit purposes</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">13.4 Contact Information</h3>
        <p className="mb-4">
          For questions or concerns regarding this policy, contact:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Security Officer</strong>: security@yubilearn.com</li>
          <li><strong>System Administrator</strong>: admin@yubilearn.com</li>
          <li><strong>General Support</strong>: support@yubilearn.com</li>
        </ul>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Document Approval</h2>
          <div className="border-t border-border pt-4">
            <p className="mb-2"><strong>Policy Owner</strong>: Security Officer</p>
            <p className="mb-2"><strong>Approved By</strong>: Senior Management</p>
            <p className="mb-2"><strong>Approval Date</strong>: January 2025</p>
            <p className="mb-2"><strong>Next Review Date</strong>: January 2026</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
