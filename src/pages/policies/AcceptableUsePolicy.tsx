import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle } from "lucide-react";

export default function AcceptableUsePolicy() {
  return (
    <div className="space-y-8">
      {/* Document Header */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">Acceptable Use Policy</h1>
          <Badge variant="outline" className="text-lg px-4 py-2">SOC 2 Compliant</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Document ID:</span>
            <p className="font-semibold">IMK-POL-AUP-001</p>
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
          This Acceptable Use Policy (AUP) establishes the rules and guidelines for the appropriate 
          use of NabuLearn' information technology resources, systems, and data. This policy 
          is designed to protect the organization, its employees, partners, students, and the data 
          entrusted to us while ensuring compliance with SOC 2 requirements and educational data 
          privacy regulations (FERPA, COPPA).
        </p>
      </section>

      {/* Scope */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">2. Scope</h2>
        <p className="text-muted-foreground">This policy applies to:</p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
          <li>All employees, contractors, consultants, and temporary workers</li>
          <li>All company-owned or managed computing devices and systems</li>
          <li>Personal devices used to access company resources (BYOD)</li>
          <li>All network resources, cloud services, and applications</li>
          <li>All data created, stored, or transmitted on company systems</li>
          <li>All email, messaging, and communication systems</li>
        </ul>
      </section>

      {/* Acceptable Use */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">3. Acceptable Use</h2>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Permitted Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <span>Conducting legitimate business activities and job responsibilities</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <span>Accessing authorized systems and data necessary for work functions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <span>Professional communication via email, messaging, and collaboration tools</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <span>Professional development and learning activities during appropriate times</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <span>Limited personal use that does not interfere with work or violate this policy</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                <span>Reporting security incidents, vulnerabilities, or policy violations</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Prohibited Use */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">4. Prohibited Activities</h2>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Strictly Prohibited Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Security Violations</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Sharing passwords or authentication credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Bypassing or attempting to circumvent security controls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Unauthorized access to systems, data, or accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Installing unauthorized software or malware</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Disabling security software or monitoring tools</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Data Violations</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Unauthorized disclosure of confidential or student data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Exfiltrating company data to personal accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Storing sensitive data on unapproved platforms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Violating FERPA or COPPA data protection requirements</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Inappropriate Content</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Accessing, downloading, or distributing illegal content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Harassment, discrimination, or offensive communications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Pornographic, violent, or inappropriate material</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Other Violations</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Using company resources for unauthorized commercial purposes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Copyright or intellectual property infringement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                    <span>Excessive personal use that impacts productivity</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Email and Communications */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">5. Email and Communications</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Email Guidelines:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Use company email for business purposes; limited personal use is permitted</li>
                <li>Do not open suspicious attachments or click unknown links</li>
                <li>Report phishing attempts to security immediately</li>
                <li>Do not auto-forward company email to personal accounts</li>
                <li>Use encryption when sending sensitive data externally</li>
                <li>Include required disclaimers in external communications</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Messaging and Collaboration:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Use approved collaboration tools (Slack, Teams, etc.) for business communication</li>
                <li>Do not share confidential information in public channels</li>
                <li>Maintain professional conduct in all communications</li>
                <li>Be aware that all communications may be monitored and logged</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Internet Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">6. Internet Usage</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              Internet access is provided for business purposes. Limited personal use is permitted 
              during breaks, provided it does not violate this policy.
            </p>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Use the internet responsibly and ethically</li>
                <li>Do not download unauthorized software or applications</li>
                <li>Avoid streaming or activities that consume excessive bandwidth</li>
                <li>Be aware that internet activity may be monitored</li>
                <li>Use VPN when accessing company resources remotely</li>
                <li>Do not access sites blocked by company security controls</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Data Handling */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">7. Data Handling Requirements</h2>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Classification</TableHead>
                  <TableHead>Handling Requirements</TableHead>
                  <TableHead>Examples</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Public</TableCell>
                  <TableCell>No restrictions on sharing</TableCell>
                  <TableCell>Marketing materials, public website content</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Internal</TableCell>
                  <TableCell>Share only with employees on need-to-know basis</TableCell>
                  <TableCell>Internal policies, general procedures</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Confidential</TableCell>
                  <TableCell>Encrypt in transit and at rest; restrict access</TableCell>
                  <TableCell>Business plans, financial data, contracts</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Restricted (Student PII)</TableCell>
                  <TableCell>Strict access controls; FERPA/COPPA compliance required</TableCell>
                  <TableCell>Student records, voice recordings, assessment data</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Device Security */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">8. Device Security</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Keep devices physically secure at all times</li>
                <li>Enable screen lock with password/biometrics</li>
                <li>Install all required security updates promptly</li>
                <li>Do not disable security software</li>
                <li>Report lost or stolen devices immediately</li>
                <li>Do not lend devices to unauthorized persons</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Devices (BYOD)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Register device with IT before accessing company resources</li>
                <li>Enable device encryption and screen lock</li>
                <li>Keep operating system and apps updated</li>
                <li>Install required MDM software if applicable</li>
                <li>Separate personal and company data</li>
                <li>Allow remote wipe capability for company data</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Remote Work */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">9. Remote Work Security</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              When working remotely, additional security measures apply:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Use company VPN when accessing internal resources</li>
              <li>Work only on secure, private networks (avoid public WiFi for sensitive work)</li>
              <li>Ensure physical security of devices and documents</li>
              <li>Lock screens when stepping away</li>
              <li>Do not allow family members or others to use work devices</li>
              <li>Use privacy screens in public spaces</li>
              <li>Securely dispose of any printed materials</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Monitoring */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">10. Monitoring and Privacy</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
              <p className="text-foreground font-semibold">
                Notice: NabuLearn reserves the right to monitor all use of company systems, 
                networks, and resources without prior notice.
              </p>
            </div>
            <p className="text-muted-foreground">
              Monitored activities may include:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Email and messaging content</li>
              <li>Internet browsing activity</li>
              <li>File access and transfers</li>
              <li>System login and authentication events</li>
              <li>Application usage</li>
              <li>Network traffic</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Users should have no expectation of privacy when using company resources. Monitoring 
              is conducted to ensure security, compliance, and appropriate use of resources.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Violations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">11. Violations and Consequences</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              Violations of this policy may result in disciplinary action, up to and including 
              termination of employment. Depending on the severity, consequences may include:
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Violation Severity</TableHead>
                  <TableHead>Potential Consequences</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Minor</TableCell>
                  <TableCell>Verbal warning, mandatory retraining</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Moderate</TableCell>
                  <TableCell>Written warning, temporary access restriction, formal HR review</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Severe</TableCell>
                  <TableCell>Immediate access revocation, termination, legal action</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-muted-foreground mt-4">
              Violations involving illegal activity may be reported to law enforcement authorities.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Reporting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">12. Reporting Violations</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
              All personnel are required to report suspected violations of this policy. Reports can 
              be made to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Direct supervisor or manager</li>
              <li>Human Resources department</li>
              <li>Security Officer (security@nabulearn.com)</li>
              <li>Anonymous reporting channel (if available)</li>
            </ul>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
              <p className="text-foreground">
                <strong>Non-Retaliation:</strong> NabuLearn prohibits retaliation against 
                anyone who reports a policy violation in good faith.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Acknowledgment */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">13. Policy Acknowledgment</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              All personnel must acknowledge receipt and understanding of this policy upon hire 
              and annually thereafter. By using company systems and resources, users agree to 
              comply with this Acceptable Use Policy.
            </p>
            <div className="border-2 border-dashed border-muted p-6 rounded-lg">
              <p className="text-sm text-muted-foreground italic">
                "I acknowledge that I have read, understood, and agree to comply with the 
                NabuLearn Acceptable Use Policy. I understand that violations may result 
                in disciplinary action and that my use of company systems may be monitored."
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employee Signature:</p>
                  <div className="border-b-2 border-foreground h-8"></div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date:</p>
                  <div className="border-b-2 border-foreground h-8"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SOC 2 Control Mapping */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">14. SOC 2 Control Mapping</h2>
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
                  <TableCell className="font-semibold">CC1.1</TableCell>
                  <TableCell>Control Environment</TableCell>
                  <TableCell>Establishes expected behaviors and ethical standards</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">CC2.2</TableCell>
                  <TableCell>Communication</TableCell>
                  <TableCell>Communicates responsibilities for system and data use</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">CC5.3</TableCell>
                  <TableCell>Control Activities</TableCell>
                  <TableCell>Defines acceptable and prohibited activities</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">CC6.1</TableCell>
                  <TableCell>Logical Access</TableCell>
                  <TableCell>Password and device security requirements</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">CC6.8</TableCell>
                  <TableCell>System Operations</TableCell>
                  <TableCell>Monitoring and acceptable use enforcement</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Document Control */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">15. Document Control</h2>
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
