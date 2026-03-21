import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SecurityAwarenessTrainingPolicy() {
  return (
    <div className="space-y-8">
      {/* Document Header */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">Security Awareness Training Policy</h1>
          <Badge variant="outline" className="text-lg px-4 py-2">SOC 2 Compliant</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Document ID:</span>
            <p className="font-semibold">IMK-POL-SAT-001</p>
          </div>
          <div>
            <span className="text-muted-foreground">Version:</span>
            <p className="font-semibold">1.0</p>
          </div>
          <div>
            <span className="text-muted-foreground">Effective Date:</span>
            <p className="font-semibold">{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Review Cycle:</span>
            <p className="font-semibold">Annual</p>
          </div>
        </div>
      </div>

      {/* Purpose */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">1. Purpose</h2>
        <p className="text-muted-foreground">
          This Security Awareness Training Policy establishes the requirements for educating all personnel 
          on information security best practices, threats, and their responsibilities in protecting 
          NabuLearn' information assets, student data, and systems. This policy ensures compliance 
          with SOC 2 Trust Service Criteria, FERPA, and COPPA requirements.
        </p>
      </section>

      {/* Scope */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">2. Scope</h2>
        <p className="text-muted-foreground">This policy applies to:</p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
          <li>All full-time and part-time employees</li>
          <li>Contractors and temporary workers with access to company systems</li>
          <li>Third-party service providers with access to sensitive data</li>
          <li>Executive leadership and management</li>
          <li>Technical and development staff</li>
        </ul>
      </section>

      {/* Training Requirements */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">3. Training Requirements</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>3.1 New Hire Training</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              All new personnel must complete security awareness training within <strong>14 days</strong> of 
              their start date, before being granted access to production systems or sensitive data.
            </p>
            <div>
              <p className="font-semibold text-foreground mb-2">New Hire Training Topics:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Information security fundamentals</li>
                <li>Company security policies overview</li>
                <li>Data classification and handling procedures</li>
                <li>Acceptable use of company resources</li>
                <li>Password and authentication requirements</li>
                <li>Incident reporting procedures</li>
                <li>FERPA and COPPA compliance requirements (for education data)</li>
                <li>Physical security awareness</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3.2 Annual Refresher Training</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              All personnel must complete annual security awareness refresher training. Training must be 
              completed within <strong>30 days</strong> of the annual training campaign launch.
            </p>
            <div>
              <p className="font-semibold text-foreground mb-2">Annual Training Topics:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Updates to security policies and procedures</li>
                <li>Emerging threat landscape and attack vectors</li>
                <li>Social engineering and phishing recognition</li>
                <li>Data breach prevention and response</li>
                <li>Remote work security best practices</li>
                <li>Regulatory compliance updates</li>
                <li>Lessons learned from security incidents</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3.3 Role-Based Training</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Category</TableHead>
                  <TableHead>Additional Training Requirements</TableHead>
                  <TableHead>Frequency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Developers/Engineers</TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Secure coding practices (OWASP Top 10)</li>
                      <li>Code review security checklist</li>
                      <li>Dependency vulnerability management</li>
                      <li>API security best practices</li>
                    </ul>
                  </TableCell>
                  <TableCell>Annual + when major changes occur</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">System Administrators</TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Infrastructure security hardening</li>
                      <li>Privileged access management</li>
                      <li>Security monitoring and logging</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </TableCell>
                  <TableCell>Annual + quarterly updates</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Management/Leadership</TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Risk management and governance</li>
                      <li>Regulatory compliance overview</li>
                      <li>Incident escalation procedures</li>
                      <li>Third-party risk management</li>
                    </ul>
                  </TableCell>
                  <TableCell>Annual</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Customer Support</TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Social engineering recognition</li>
                      <li>Data privacy handling</li>
                      <li>Customer verification procedures</li>
                      <li>Incident reporting</li>
                    </ul>
                  </TableCell>
                  <TableCell>Annual + quarterly phishing simulations</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Training Topics */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">4. Core Training Topics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">4.1 Phishing & Social Engineering</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Recognizing phishing emails and messages</li>
                <li>Verifying sender authenticity</li>
                <li>Reporting suspicious communications</li>
                <li>Social engineering attack techniques</li>
                <li>Voice phishing (vishing) awareness</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">4.2 Password & Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Strong password creation</li>
                <li>Password manager usage</li>
                <li>Multi-factor authentication setup</li>
                <li>Avoiding password reuse</li>
                <li>Recognizing credential theft attempts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">4.3 Data Handling</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Data classification levels</li>
                <li>Secure data storage practices</li>
                <li>Secure data transmission methods</li>
                <li>Data retention and disposal</li>
                <li>Student data privacy (FERPA/COPPA)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">4.4 Incident Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>What constitutes a security incident</li>
                <li>Reporting channels and procedures</li>
                <li>Timely reporting requirements</li>
                <li>Evidence preservation</li>
                <li>Non-retaliation policy</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Phishing Simulations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">5. Phishing Simulations</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              To reinforce training and measure effectiveness, NabuLearn conducts regular 
              phishing simulation exercises.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aspect</TableHead>
                  <TableHead>Requirement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Frequency</TableCell>
                  <TableCell>Quarterly (at minimum)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Scope</TableCell>
                  <TableCell>All personnel with email access</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Failure Response</TableCell>
                  <TableCell>Immediate educational feedback + targeted retraining within 7 days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Repeat Failure</TableCell>
                  <TableCell>Manager notification + mandatory one-on-one training</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Metrics Tracked</TableCell>
                  <TableCell>Click rates, report rates, completion rates, trends over time</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Training Tracking */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">6. Training Tracking & Acknowledgment</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              All training completion must be documented and tracked for audit purposes.
            </p>
            <div>
              <p className="font-semibold text-foreground mb-2">Required Records:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Training completion dates</li>
                <li>Quiz/assessment scores (minimum 80% passing score)</li>
                <li>Digital acknowledgment of policy understanding</li>
                <li>Training material version completed</li>
                <li>Instructor information (for live training)</li>
              </ul>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Record Retention:</strong> Training records are retained for a minimum of 
                3 years or as required by applicable regulations.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Non-Compliance */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">7. Non-Compliance</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              Failure to complete required security awareness training may result in:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>First offense:</strong> Manager notification and reminder to complete training within 7 days</li>
              <li><strong>Second offense:</strong> Escalation to HR and temporary suspension of system access</li>
              <li><strong>Third offense:</strong> Disciplinary action up to and including termination</li>
            </ul>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> Contractors who fail to complete required training may have their 
                contracts terminated. Third-party vendors may be required to demonstrate equivalent 
                training for their personnel.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Responsibilities */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">8. Roles and Responsibilities</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Responsibilities</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold">Security Officer</TableCell>
              <TableCell>
                Develop training content, schedule training campaigns, track completion rates, 
                report metrics to leadership, update training materials
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">HR Department</TableCell>
              <TableCell>
                Coordinate new hire onboarding training, maintain training records, 
                enforce non-compliance consequences
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Department Managers</TableCell>
              <TableCell>
                Ensure team members complete training on time, support training initiatives, 
                address non-compliance
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">All Personnel</TableCell>
              <TableCell>
                Complete required training by deadlines, report security incidents, 
                apply training in daily activities
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* SOC 2 Control Mapping */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">9. SOC 2 Control Mapping</h2>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control ID</TableHead>
                  <TableHead>Control Category</TableHead>
                  <TableHead>How This Policy Addresses It</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">CC1.4</TableCell>
                  <TableCell>Control Environment</TableCell>
                  <TableCell>Demonstrates commitment to competence through mandatory security training</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">CC2.2</TableCell>
                  <TableCell>Communication</TableCell>
                  <TableCell>Communicates security responsibilities to personnel</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">CC2.3</TableCell>
                  <TableCell>Communication</TableCell>
                  <TableCell>Communicates internal control matters including security expectations</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">CC6.1</TableCell>
                  <TableCell>Logical Access</TableCell>
                  <TableCell>Training on access control policies and password requirements</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">CC7.4</TableCell>
                  <TableCell>System Operations</TableCell>
                  <TableCell>Training on incident identification and reporting</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Document Control */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">10. Document Control</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>1.0</TableCell>
              <TableCell>{new Date().toLocaleDateString()}</TableCell>
              <TableCell>Security Officer</TableCell>
              <TableCell>Initial policy creation for SOC 2 Type 1 certification</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
