import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <section>
              <h2 className="text-xl font-semibold mb-3">Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using NabuLearn ("the Platform"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Permitted Users</h2>
              <p className="text-muted-foreground mb-2">The Platform is intended for use by:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>K-12 teachers and school administrators ("Educators")</li>
                <li>K-12 students enrolled in participating schools ("Students")</li>
                <li>Parents/guardians of enrolled Students ("Parents")</li>
                <li>District administrators with authorized access ("District Admins")</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Students under 13 must have verifiable parental consent to use the Platform per COPPA regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Educator Responsibilities</h2>
              <p className="text-muted-foreground mb-2">Educators agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Only create accounts for students enrolled in their school</li>
                <li>Obtain parental consent before enabling AURA recording features for students under 13</li>
                <li>Not share student data outside the Platform without proper authorization</li>
                <li>Review and respond to parent access requests in a timely manner</li>
                <li>Use AI-generated insights to supplement (not replace) professional judgment</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Student Conduct</h2>
              <p className="text-muted-foreground mb-2">Students agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Use the Platform only for educational purposes</li>
                <li>Not share their account credentials with others</li>
                <li>Not attempt to access other students' data or accounts</li>
                <li>Follow their school's acceptable use policy</li>
                <li>Report any suspicious activity to their teacher</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Parent Rights and Responsibilities</h2>
              <p className="text-muted-foreground mb-2">Parents have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Request access to view their child's progress and data</li>
                <li>Withdraw consent for AURA recording features at any time</li>
                <li>Request deletion of their child's data</li>
                <li>Contact teachers through the Platform's messaging system</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Ownership</h2>
              <p className="text-muted-foreground">
                All student data, including AURA recordings, assignments, and grades, remains the property of the school district. 
                NabuLearn acts as a service provider and does not claim ownership of any student data. Schools retain full 
                control over their data and can request a complete export or deletion at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">AI-Generated Content</h2>
              <p className="text-muted-foreground">
                The Platform uses artificial intelligence to generate insights, feedback, and exercise recommendations. 
                While we strive for accuracy, AI-generated content should be reviewed by educators before being acted upon. 
                We are not liable for decisions made solely based on AI-generated content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Service Availability</h2>
              <p className="text-muted-foreground">
                We aim for 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance will be announced 
                in advance when possible. We are not liable for lost work due to service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                NabuLearn is provided "as is" without warranty of any kind. We are not liable for any indirect, incidental, 
                or consequential damages arising from use of the Platform. Our total liability shall not exceed the amount paid 
                by the school for the Platform during the current academic year.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate accounts that violate these Terms. Schools may terminate service 
                at any time with 30 days written notice. Upon termination, all student data will be deleted per our data 
                retention policy unless the school requests an export.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these Terms from time to time. Material changes will be communicated to schools via email at least 
                30 days before taking effect. Continued use of the Platform after changes take effect constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at: <br />
                <strong>legal@nabulearn.com</strong>
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
