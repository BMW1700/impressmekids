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
                NabuLearn complies with the Family Educational Rights and Privacy Act (FERPA) and protects student education records. 
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
                <li>Game progress and engagement data (virtual currency, achievements, cosmetic preferences)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Usage</h2>
              <p className="text-muted-foreground mb-2">Student data is used exclusively for:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Providing personalized learning experiences</li>
                <li>Generating AI-powered insights for teachers</li>
                <li>Processing through AI models for real-time educational insights (data not retained or used for training)</li>
                <li>Tracking student progress and identifying learning gaps</li>
                <li>Improving platform functionality</li>
                <li>Providing gamified reading motivation through virtual rewards and achievements (no real money involved)</li>
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
                <li>Google Gemini AI via Lovable AI Gateway (educational content generation and analysis):
                  <ul className="list-circle list-inside ml-4 mt-1 space-y-1 text-xs">
                    <li>Speech analysis and phoneme detection</li>
                    <li>Educational content generation (flashcards, practice exercises, quiz questions)</li>
                    <li>Image text extraction for assignments</li>
                    <li>Teacher performance summaries</li>
                    <li>Student data is NOT used for model training</li>
                    <li>Processed data is not retained beyond immediate educational use</li>
                  </ul>
                </li>
                <li>OpenAI Whisper API (speech transcription with zero data retention):
                  <ul className="list-circle list-inside ml-4 mt-1 space-y-1 text-xs">
                    <li>Audio is processed in real-time for transcription only</li>
                    <li>Audio files are not stored or used for model training</li>
                    <li>Immediate deletion after processing</li>
                  </ul>
                </li>
                <li>Google OAuth (optional single sign-on - no data shared)</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-xs">
                All AI services operate under strict data protection policies that prohibit training on student data and require immediate deletion of processed content. We do not share student data with AI providers for any purpose other than real-time educational processing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">AI Processing & Transparency</h2>
              <p className="text-muted-foreground mb-2">
                We use artificial intelligence (AI) to enhance learning experiences, not replace human teaching. 
                AI is used to analyze student work, generate personalized practice materials, and provide insights to teachers.
              </p>
              
              <div className="space-y-3 mt-3">
                <div>
                  <h3 className="font-semibold text-muted-foreground mb-1">What AI Sees:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 text-xs">
                    <li>Student speech recordings (for phoneme analysis only)</li>
                    <li>Assignment submissions and answers</li>
                    <li>Practice exercise performance data</li>
                    <li>Teacher-provided classroom context for content generation</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-muted-foreground mb-1">What AI Does NOT Do:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 text-xs">
                    <li>Store or retain student data after processing</li>
                    <li>Use student data to train AI models</li>
                    <li>Share student information with third parties</li>
                    <li>Make automated decisions about student grades or placement</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-muted-foreground mb-1">AI Data Retention:</h3>
                  <p className="text-muted-foreground text-xs ml-4">
                    AI processing happens in real-time. Student data sent to AI services is immediately deleted 
                    after processing (within seconds). No student information is retained by AI providers beyond 
                    the time needed to generate educational insights.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-muted-foreground mb-1">Compliance with 2025 COPPA AI Rule:</h3>
                  <p className="text-muted-foreground text-xs ml-4">
                    We comply with the FTC's updated COPPA Rule (effective June 23, 2025) requiring explicit 
                    parental consent for AI processing of children's data. Parents are informed about AI usage 
                    during enrollment and can withdraw consent at any time.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Parent Rights</h2>
              <p className="text-muted-foreground mb-2">Parents have the right to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Access their child's education records</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of their child's data</li>
                <li>Withdraw consent for AURA recording collection</li>
                <li>Withdraw consent for AI processing of their child's data</li>
                <li>Request details about AI usage on their child's work</li>
                <li>Receive notifications of data breaches</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
              <p className="text-muted-foreground">
                For privacy-related questions or to exercise your rights under FERPA/COPPA, contact us at: <br />
                <strong>privacy@nabulearn.com</strong>
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
