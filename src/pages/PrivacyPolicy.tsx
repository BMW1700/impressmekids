import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <section>
              <h2 className="text-xl font-semibold mb-3">FERPA Compliance</h2>
              <p className="text-muted-foreground">
                Impress Me Kids complies with the Family Educational Rights and Privacy Act (FERPA) and protects student education records. 
                We never sell or share student data with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">COPPA Compliance</h2>
              <p className="text-muted-foreground">
                We comply with the Children's Online Privacy Protection Act (COPPA). We require verifiable parental consent before 
                collecting personal information from children under 13. Parents can review, delete, or refuse further collection 
                of their child's information at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Collection</h2>
              <p className="text-muted-foreground mb-2">We collect the following data to provide educational services:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Student name and email (provided by school)</li>
                <li>AURA speech recordings (with parental consent)</li>
                <li>Assignment submissions and grades</li>
                <li>Practice exercise completion data</li>
                <li>Usage analytics (page views, time spent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Usage</h2>
              <p className="text-muted-foreground mb-2">Student data is used exclusively for:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Providing personalized learning experiences</li>
                <li>Generating AI-powered insights for teachers</li>
                <li>Tracking student progress and identifying learning gaps</li>
                <li>Improving platform functionality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground">
                All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use industry-standard security practices 
                including role-based access control, audit logging, and regular security audits. Audio recordings are stored in 
                secure, access-controlled buckets with automatic expiration policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <p className="text-muted-foreground">
                Student data is retained for the duration of enrollment plus one academic year. After this period, data is 
                automatically deleted unless the school requests an extension. Parents can request immediate deletion at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
              <p className="text-muted-foreground mb-2">We use the following FERPA-compliant third-party services:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Lovable Cloud (database and authentication infrastructure)</li>
                <li>OpenAI Whisper API (speech transcription - audio is not stored)</li>
                <li>Google OAuth (optional single sign-on - no data shared)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Parent Rights</h2>
              <p className="text-muted-foreground mb-2">Parents have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Access their child's education records</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of their child's data</li>
                <li>Withdraw consent for AURA recording collection</li>
                <li>Receive notifications of data breaches</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
              <p className="text-muted-foreground">
                For privacy-related questions or to exercise your rights under FERPA/COPPA, contact us at: <br />
                <strong>privacy@impressmekids.com</strong>
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
