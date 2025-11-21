import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, Users } from "lucide-react";

export default function IncidentResponseTabletop() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-foreground">Incident Response Tabletop Exercise Log</h1>
            <Badge variant="outline" className="text-lg px-4 py-2">
              SOC 2 Type 1 Preparation
            </Badge>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Exercise Date: December 15, 2024</span>
            <span>•</span>
            <span>Duration: 90 minutes</span>
            <span>•</span>
            <span>Facilitator: Security Officer</span>
          </div>
        </div>

        {/* Exercise Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Exercise Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Exercise Type</h4>
                <p className="text-sm text-muted-foreground">Tabletop Discussion-Based Exercise</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Scenario Classification</h4>
                <Badge variant="destructive">Critical Security Incident</Badge>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">FERPA Breach</h4>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Yes - Notification Required</Badge>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Objective</h4>
                <p className="text-sm text-muted-foreground">Test IR procedures for unauthorized data access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenario Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Scenario: Compromised Teacher Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-foreground font-semibold mb-2">Initial Report (Time: 0 minutes)</p>
              <p className="text-sm text-muted-foreground">
                A teacher reports that they received a password reset email they did not request. Shortly after, 
                they were unable to log in. A parent then contacts the school stating they received an unusual 
                email from the teacher's account asking for personal student information.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Key Details:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Teacher account: Ms. Sarah Johnson (3rd grade, Lincoln Elementary)</li>
                <li>Account has access to 28 student records</li>
                <li>Teacher confirmed they did not initiate password reset</li>
                <li>Last successful login: 2 days ago from expected IP address</li>
                <li>Suspicious login detected from unfamiliar IP (foreign country)</li>
                <li>Phishing email sent to 15 parents from compromised account</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Exercise Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-foreground">Security Officer (Incident Commander)</p>
                <p className="text-sm text-muted-foreground">Lead incident response coordination</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-foreground">Engineering Lead</p>
                <p className="text-sm text-muted-foreground">Technical investigation and remediation</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-foreground">Privacy Officer</p>
                <p className="text-sm text-muted-foreground">FERPA compliance and parent notification</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-foreground">District Administrator</p>
                <p className="text-sm text-muted-foreground">Stakeholder communication</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Incident Response Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Phase 1: Detection */}
              <div className="border-l-4 border-red-600 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive">Phase 1: Detection</Badge>
                  <span className="text-sm text-muted-foreground">Time: 0-15 minutes</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Initial Report Received (T+0)</p>
                      <p className="text-sm text-muted-foreground">Teacher contacts IT helpdesk reporting locked account and suspicious password reset</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Security Team Alerted (T+5)</p>
                      <p className="text-sm text-muted-foreground">Security Officer notified of potential account compromise</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Audit Log Review (T+10)</p>
                      <p className="text-sm text-muted-foreground">Engineering team pulls audit logs, confirms unauthorized access from foreign IP</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Incident Declared (T+15)</p>
                      <p className="text-sm text-muted-foreground">Classified as "Critical Security Incident" - IR team assembled</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 2: Containment */}
              <div className="border-l-4 border-orange-600 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Phase 2: Containment</Badge>
                  <span className="text-sm text-muted-foreground">Time: 15-30 minutes</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Account Disabled (T+17)</p>
                      <p className="text-sm text-muted-foreground">Compromised teacher account immediately disabled via admin panel</p>
                      <p className="text-xs text-muted-foreground mt-1"><strong>Action:</strong> supabase.auth.admin.updateUserById() - set account to disabled</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Sessions Terminated (T+18)</p>
                      <p className="text-sm text-muted-foreground">All active sessions for account forcefully logged out</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">IP Address Blocked (T+20)</p>
                      <p className="text-sm text-muted-foreground">Malicious IP address blocked at infrastructure level (Cloudflare WAF rule)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Parent Notifications Stopped (T+25)</p>
                      <p className="text-sm text-muted-foreground">Email service rate limiting applied, phishing emails blocked</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 3: Investigation */}
              <div className="border-l-4 border-yellow-600 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Phase 3: Investigation</Badge>
                  <span className="text-sm text-muted-foreground">Time: 30-60 minutes</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Audit Log Analysis (T+35)</p>
                      <p className="text-sm text-muted-foreground">Full audit log review conducted using immutable audit_log table</p>
                      <p className="text-xs text-muted-foreground mt-1"><strong>Findings:</strong></p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside ml-4">
                        <li>Unauthorized login at 02:34 AM from IP 185.220.xxx.xxx (Russia)</li>
                        <li>Attacker accessed 28 student profiles</li>
                        <li>No AURA recordings accessed (consent verification blocked access)</li>
                        <li>15 phishing emails sent to parents before containment</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Data Exposure Assessment (T+45)</p>
                      <p className="text-sm text-muted-foreground">Determined that student names, grades, and assignment scores were potentially viewed</p>
                      <p className="text-xs text-muted-foreground mt-1"><strong>Not Exposed:</strong> SSN, addresses, AURA recordings (RLS prevented access)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Attack Vector Identified (T+55)</p>
                      <p className="text-sm text-muted-foreground">Teacher clicked phishing link in fake "Google Calendar" email, credentials stolen</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 4: Eradication */}
              <div className="border-l-4 border-blue-600 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Phase 4: Eradication</Badge>
                  <span className="text-sm text-muted-foreground">Time: 60-75 minutes</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Password Reset Forced (T+62)</p>
                      <p className="text-sm text-muted-foreground">Teacher account password reset with verified identity confirmation (phone call + ID verification)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Threat Eliminated (T+70)</p>
                      <p className="text-sm text-muted-foreground">Confirmed no persistent access mechanisms (backdoors) installed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 5: Recovery */}
              <div className="border-l-4 border-green-600 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Phase 5: Recovery</Badge>
                  <span className="text-sm text-muted-foreground">Time: 75-90 minutes</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Account Re-enabled (T+77)</p>
                      <p className="text-sm text-muted-foreground">Teacher account restored with new secure password</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Parent Notifications Sent (T+80)</p>
                      <p className="text-sm text-muted-foreground">All 15 parents notified of phishing email and incident via email + phone</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">FERPA Notification Drafted (T+85)</p>
                      <p className="text-sm text-muted-foreground">Privacy Officer prepares FERPA breach notification for all affected parents (within 30 days)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Normal Operations Resumed (T+90)</p>
                      <p className="text-sm text-muted-foreground">Teacher able to access classroom, incident contained</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 6: Post-Incident Review */}
              <div className="border-l-4 border-purple-600 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Phase 6: Post-Incident Review</Badge>
                  <span className="text-sm text-muted-foreground">Time: 1 week post-incident</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Lessons Learned Session</p>
                      <p className="text-sm text-muted-foreground">IR team conducted post-mortem meeting to identify improvements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Incident Report Finalized</p>
                      <p className="text-sm text-muted-foreground">Comprehensive incident report documented and filed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle>Key Findings & Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">What Worked Well:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li><strong>Immutable Audit Logs:</strong> Complete forensic trail enabled rapid investigation</li>
                  <li><strong>RLS Policies:</strong> Row-level security prevented unauthorized access to AURA recordings despite account compromise</li>
                  <li><strong>Rapid Containment:</strong> Account disabled within 2 minutes of incident declaration</li>
                  <li><strong>Clear IR Plan:</strong> Team knew exact steps to follow from Incident Response Policy</li>
                  <li><strong>Parent Consent System:</strong> Prevented attacker from accessing voice recordings (most sensitive data)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Areas for Improvement:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li><strong>Detection Speed:</strong> Incident not detected until teacher reported - need automated anomaly detection</li>
                  <li><strong>MFA Not Enabled:</strong> Multi-factor authentication would have prevented credential-based compromise</li>
                  <li><strong>Teacher Training:</strong> Additional phishing awareness training needed</li>
                  <li><strong>Alert Fatigue:</strong> Suspicious login alert triggered but not escalated quickly enough</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Action Items Identified:</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="font-semibold text-foreground">1. Implement Multi-Factor Authentication (MFA)</p>
                    <p className="text-sm text-muted-foreground">Enable MFA for all teacher and admin accounts by Q1 2025</p>
                    <p className="text-xs text-muted-foreground"><strong>Owner:</strong> Engineering Lead | <strong>Due:</strong> March 31, 2025</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="font-semibold text-foreground">2. Implement Automated Anomaly Detection</p>
                    <p className="text-sm text-muted-foreground">Deploy automated alerts for suspicious logins (foreign IPs, unusual times)</p>
                    <p className="text-xs text-muted-foreground"><strong>Owner:</strong> Security Officer | <strong>Due:</strong> February 28, 2025</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="font-semibold text-foreground">3. Conduct Quarterly Phishing Simulations</p>
                    <p className="text-sm text-muted-foreground">Test teacher awareness with simulated phishing campaigns and provide training</p>
                    <p className="text-xs text-muted-foreground"><strong>Owner:</strong> Security Officer | <strong>Due:</strong> Ongoing (Quarterly)</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="font-semibold text-foreground">4. Improve FERPA Notification Templates</p>
                    <p className="text-sm text-muted-foreground">Pre-draft FERPA breach notification templates for faster response</p>
                    <p className="text-xs text-muted-foreground"><strong>Owner:</strong> Privacy Officer | <strong>Due:</strong> January 31, 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Impact */}
        <Card>
          <CardHeader>
            <CardTitle>FERPA Compliance Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-foreground mb-2">FERPA Breach Determination: YES</h4>
                <p className="text-sm text-muted-foreground">
                  Unauthorized individual accessed student names, grades, and assignment scores. This constitutes 
                  unauthorized disclosure of education records under FERPA.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Required FERPA Actions:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Notify all affected parents within 30 days (completed at T+7 days)</li>
                  <li>Describe nature of breach and data exposed (completed)</li>
                  <li>Document incident in audit log (completed - immutable log)</li>
                  <li>Report to school district compliance officer (completed at T+24 hours)</li>
                  <li>Implement corrective actions to prevent recurrence (MFA deployment planned)</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-foreground mb-2">Mitigating Factors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>RLS policies prevented access to most sensitive data (AURA recordings)</li>
                  <li>Rapid containment limited exposure window to ~90 minutes</li>
                  <li>No evidence of data exfiltration or misuse</li>
                  <li>Comprehensive audit trail demonstrates due diligence</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conclusion */}
        <Card>
          <CardHeader>
            <CardTitle>Exercise Conclusion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This tabletop exercise successfully validated Impress Me Kids' Incident Response Policy and procedures. 
              The team demonstrated strong coordination, rapid containment, and adherence to FERPA requirements. 
              Technical security controls (RLS, audit logs, consent verification) performed as designed and significantly 
              limited the impact of the breach.
            </p>
            <p className="text-muted-foreground">
              Key improvements identified include implementing MFA, automated anomaly detection, and enhanced 
              phishing training. These action items will be tracked and completed by Q1 2025.
            </p>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="font-semibold text-foreground">Overall Assessment: IR Plan is Effective</p>
              <p className="text-sm text-muted-foreground mt-2">
                The incident response plan enabled rapid detection, containment, and recovery. Technical controls 
                prevented worst-case scenario (mass data exfiltration). With identified improvements implemented, 
                the organization is well-prepared for security incidents.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
          <p><strong>Classification:</strong> Confidential - Internal Use Only</p>
          <p><strong>Document Control:</strong> This tabletop exercise log is maintained as evidence of IR preparedness.</p>
          <p><strong>Next Exercise:</strong> Scheduled for Q2 2025</p>
          <p><strong>Contact:</strong> security@impressmekids.com</p>
        </div>
      </div>
    </div>
  );
}
