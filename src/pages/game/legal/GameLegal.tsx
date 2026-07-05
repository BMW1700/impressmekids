import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Game Mode Legal & Compliance pages.
 *
 * One component, many sub-routes. These pages exist under /game/legal/* so
 * they ship as part of Game Mode even if School Mode is hidden at launch.
 * Content is contract-template grade — not legal advice; review by counsel
 * before signing district agreements.
 */

const TODAY = "June 10, 2026";

interface Doc {
  slug: string;
  title: string;
  desc: string;
  body: JSX.Element;
}

const docs: Doc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    desc: "How YubiLearn collects, uses, and protects student and family data under FERPA and COPPA.",
    body: (
      <>
        <p><strong>Effective:</strong> {TODAY}</p>
        <h2>1. Who we are</h2>
        <p>YubiLearn ("we", "us") provides an AI-powered literacy platform for students, families, teachers, and school administrators.</p>
        <h2>2. Data we collect</h2>
        <ul>
          <li><strong>Account data:</strong> name, email, role, grade level, classroom membership.</li>
          <li><strong>Learning data:</strong> reading sessions, assignments, scores, phoneme mastery, AURA audio recordings (with parental consent), AI-generated practice items.</li>
          <li><strong>Device data:</strong> browser, OS, IP address (used only for security and abuse prevention; not sold).</li>
          <li><strong>Voluntary profile data:</strong> demographic/health fields entered by a parent or staff member, stored encrypted at rest with row-level access controls.</li>
        </ul>
        <h2>3. How we use it</h2>
        <p>To deliver instruction, generate progress reports, route safety alerts, and improve the product. We never sell student data and never use it for advertising.</p>
        <h2>4. FERPA</h2>
        <p>For students enrolled through a school, YubiLearn operates as a "school official" with a legitimate educational interest under 34 CFR § 99.31(a)(1)(i)(B). Schools retain direct control of personally identifiable information from education records.</p>
        <h2>5. COPPA</h2>
        <p>For children under 13, YubiLearn collects personal information only with verifiable parental consent (or school-acting-as-agent consent under the FTC's school authorization). Parents can review, delete, or refuse further collection of their child's data via the Parent Data Portal at <Link to="/parent/data-privacy">/parent/data-privacy</Link>.</p>
        <h2>6. AI processing</h2>
        <p>Free-text AI prompts (Vertex AI / Gemini through Lovable AI Gateway) are pseudonymized server-side. Student names are replaced with opaque aliases (e.g. "Student 1"), and emails, phone numbers, UUIDs, and SSN-shaped strings are stripped before any request leaves our backend.</p>
        <h2>7. Retention</h2>
        <p>See <Link to="/game/legal/retention">Retention Schedule</Link>. AURA audio defaults to 90 days; learning records default to 24 months; immutable audit logs are retained 7 years.</p>
        <h2>8. Parent rights</h2>
        <p>Parents may request access, correction, export, or deletion of their child's data at any time through the Parent Data Portal or by emailing privacy@yubilearn.com.</p>
        <h2>9. Subprocessors</h2>
        <p>See <Link to="/game/legal/subprocessors">Subprocessor List</Link>.</p>
        <h2>10. Contact</h2>
        <p>privacy@yubilearn.com</p>
      </>
    ),
  },
  {
    slug: "terms",
    title: "Terms of Service",
    desc: "The agreement governing your use of YubiLearn.",
    body: (
      <>
        <p><strong>Effective:</strong> {TODAY}</p>
        <h2>1. Acceptance</h2>
        <p>By using YubiLearn you agree to these Terms. Schools and districts are bound by a separate executed agreement that supersedes these consumer terms where applicable.</p>
        <h2>2. Accounts</h2>
        <p>Student accounts under 13 require verifiable parental or school consent. Teacher, parent, and administrator accounts must be invited or verified by a school administrator.</p>
        <h2>3. Acceptable use</h2>
        <p>No reverse engineering, no bulk scraping, no attempts to circumvent access controls. Do not upload content that is unlawful, harassing, or that infringes intellectual property.</p>
        <h2>4. Intellectual property</h2>
        <p>All YubiLearn software, curriculum content, and ML models are owned by us. Student work product remains owned by the student or, where applicable, the school.</p>
        <h2>5. Disclaimers</h2>
        <p>YubiLearn is provided "as is". We make no warranty that the service will be uninterrupted or error-free.</p>
        <h2>6. Limitation of liability</h2>
        <p>To the maximum extent permitted by law, our aggregate liability is limited to fees paid in the 12 months preceding the claim.</p>
        <h2>7. Governing law</h2>
        <p>These Terms are governed by the laws of the Commonwealth of Pennsylvania, without regard to conflict of laws principles.</p>
      </>
    ),
  },
  {
    slug: "dpa",
    title: "Data Processing Addendum (template)",
    desc: "Standard DPA template for schools and districts.",
    body: (
      <>
        <p><strong>Template version:</strong> {TODAY}. Districts should send a marked-up copy to legal@yubilearn.com for execution.</p>
        <h2>1. Roles</h2>
        <p>The School is the Data Controller. YubiLearn is the Data Processor / School Official under FERPA.</p>
        <h2>2. Scope</h2>
        <p>Processing is limited to providing the platform, generating progress and safety reports, and supporting the School's educational program.</p>
        <h2>3. Confidentiality</h2>
        <p>All YubiLearn personnel with access to student data are bound by written confidentiality obligations and complete annual privacy/security training.</p>
        <h2>4. Security measures</h2>
        <ul>
          <li>Encryption in transit (TLS 1.2+) and at rest (AES-256 via Supabase managed Postgres).</li>
          <li>Row-Level Security on every Data API table; zero plaintext passwords; SECURITY DEFINER helpers locked to scoped roles.</li>
          <li>SHA-256 hash-chained audit logs for safety and security events.</li>
          <li>Quarterly internal access review; least-privilege engineering access.</li>
        </ul>
        <h2>5. Subprocessors</h2>
        <p>Listed at <Link to="/game/legal/subprocessors">/game/legal/subprocessors</Link>. We will give the School 30 days notice before adding a new subprocessor that processes student PII.</p>
        <h2>6. Breach notification</h2>
        <p>YubiLearn will notify the School of a confirmed security incident affecting student data within 72 hours of discovery, with details and remediation steps. See <Link to="/game/legal/incident-response">Incident Response</Link>.</p>
        <h2>7. Audit rights</h2>
        <p>The School may, no more than once per year and on 30 days notice, request a summary of YubiLearn's most recent SOC 2 report and security posture (see <Link to="/game/legal/security">/game/legal/security</Link>).</p>
        <h2>8. Data return / deletion</h2>
        <p>On termination, YubiLearn will, at the School's election, export all student records to the School and delete them from production systems within 30 days, and from backups in line with the <Link to="/game/legal/retention">Retention Schedule</Link>.</p>
        <h2>9. Parental rights</h2>
        <p>YubiLearn will support School responses to parent access, correction, and deletion requests at no charge.</p>
      </>
    ),
  },
  {
    slug: "subprocessors",
    title: "Subprocessor List",
    desc: "Third parties that process data on our behalf.",
    body: (
      <>
        <p><strong>Last updated:</strong> {TODAY}</p>
        <table className="w-full border-collapse text-sm mt-4">
          <thead><tr className="border-b border-border"><th className="text-left py-2">Subprocessor</th><th className="text-left">Purpose</th><th className="text-left">Region</th></tr></thead>
          <tbody>
            <tr className="border-b border-border/50"><td className="py-2">Supabase (via Lovable Cloud)</td><td>Database, auth, storage, edge functions</td><td>US</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Google Vertex AI / Gemini</td><td>Pseudonymized text generation for teacher summaries and practice items</td><td>US</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Resend</td><td>Transactional email (consent, alerts, reports)</td><td>US</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Sentry</td><td>Error monitoring (PII scrubbed; replay disabled for students)</td><td>US</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Cloudflare</td><td>CDN, WAF, DDoS protection</td><td>Global</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Datadog</td><td>Infra metrics and alerting (no student PII)</td><td>US</td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    slug: "security",
    title: "Security Overview",
    desc: "Public summary of our security posture.",
    body: (
      <>
        <h2>Architecture</h2>
        <p>Managed Postgres with Row-Level Security on every Data API table. All <code>SECURITY DEFINER</code> functions in <code>public</code> are pinned with <code>SET search_path</code> and revoke <code>EXECUTE</code> from <code>anon</code>.</p>
        <h2>Storage</h2>
        <p>AURA audio, assignment audio, and assignment-question images live in private buckets path-scoped to <code>auth.uid()</code> or the classroom teacher. Public buckets (avatars, world backgrounds) are direct-URL-only — bucket listing is disabled.</p>
        <h2>Auth</h2>
        <p>Email/password (HIBP leaked-password check enabled), Google SSO, Clever SSO, Apple SSO. MFA required for teacher, admin, district admin, and parent roles. No anonymous sign-ups. Student accounts created only after verified parental consent.</p>
        <h2>AI privacy</h2>
        <p>All third-party LLM calls run through a pseudonymization layer that replaces student names with stable aliases and strips emails, phone numbers, UUIDs, and SSN-shaped strings.</p>
        <h2>Audit logging</h2>
        <p>Security and safety events are written to immutable, SHA-256 hash-chained audit tables. Tamper attempts break the chain and are surfaced to admins.</p>
        <h2>Backups</h2>
        <p>Daily encrypted backups with 30-day point-in-time recovery; monthly cold-storage snapshots with 7-year retention for audit logs.</p>
        <h2>Vulnerability management</h2>
        <p>Continuous automated scans of database policies and edge function code. Quarterly third-party penetration tests (scheduled).</p>
      </>
    ),
  },
  {
    slug: "incident-response",
    title: "Incident Response",
    desc: "How we detect, respond to, and notify on security incidents.",
    body: (
      <>
        <h2>Detection</h2>
        <p>24/7 automated monitoring via Sentry, Datadog, and Supabase logs. Anomaly rules on sign-in failures, RLS denials, and edge function errors.</p>
        <h2>Response</h2>
        <ol>
          <li><strong>Triage (≤ 1 hour):</strong> on-call engineer confirms scope and severity.</li>
          <li><strong>Containment (≤ 4 hours):</strong> rotate affected credentials, disable affected accounts, isolate impacted services.</li>
          <li><strong>Eradication & recovery:</strong> patch root cause, restore from clean backups if needed.</li>
          <li><strong>Notification:</strong> impacted schools notified within <strong>72 hours</strong> of confirmed incident affecting student data, with scope, remediation, and next steps.</li>
          <li><strong>Post-mortem:</strong> blameless written review shared with affected schools on request.</li>
        </ol>
        <h2>Contact</h2>
        <p>security@yubilearn.com — monitored 24/7.</p>
      </>
    ),
  },
  {
    slug: "retention",
    title: "Data Retention Schedule",
    desc: "How long we keep different categories of data.",
    body: (
      <>
        <table className="w-full border-collapse text-sm mt-4">
          <thead><tr className="border-b border-border"><th className="text-left py-2">Category</th><th className="text-left">Default retention</th><th className="text-left">Configurable?</th></tr></thead>
          <tbody>
            <tr className="border-b border-border/50"><td className="py-2">AURA audio recordings</td><td>90 days</td><td>Yes (per school)</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Learning records (sessions, scores)</td><td>24 months</td><td>Yes (per school)</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Assignment submissions</td><td>School year + 1</td><td>Yes</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Security audit log</td><td>7 years</td><td>No</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Safety audit log</td><td>7 years</td><td>No</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Backups</td><td>30 days hot / 7 years cold</td><td>No</td></tr>
            <tr className="border-b border-border/50"><td className="py-2">Deleted accounts</td><td>30 days then purged</td><td>No</td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    slug: "coppa",
    title: "COPPA & Parent Rights",
    desc: "Children's Online Privacy Protection Act compliance.",
    body: (
      <>
        <h2>Parental consent</h2>
        <p>For users under 13, YubiLearn collects personal information only after verifiable consent from a parent or legal guardian — either directly via our double-opt-in email flow, or through the school acting as the parent's agent under the FTC's school authorization guidance.</p>
        <h2>What we collect from children</h2>
        <ul>
          <li>First name, grade, classroom membership.</li>
          <li>Reading session audio (only after explicit consent toggle).</li>
          <li>Learning performance (scores, phoneme mastery, time-on-task).</li>
        </ul>
        <p>We never collect: home address, social security number, government ID, geolocation more precise than school, or persistent device identifiers used for advertising.</p>
        <h2>Parent rights</h2>
        <ul>
          <li><strong>Review</strong> — see everything we have about your child.</li>
          <li><strong>Correct</strong> — fix anything that's wrong.</li>
          <li><strong>Delete</strong> — request full deletion at any time.</li>
          <li><strong>Withdraw consent</strong> — revoke audio recording or AI processing consent independently.</li>
        </ul>
        <p>Use the <Link to="/parent/data-privacy">Parent Data Portal</Link> or email privacy@yubilearn.com. We respond within 7 business days.</p>
        <h2>No targeted advertising</h2>
        <p>YubiLearn does not show ads. We do not build advertising profiles on children.</p>
      </>
    ),
  },
];

const docMap = Object.fromEntries(docs.map((d) => [d.slug, d]));

export default function GameLegal() {
  const { slug } = useParams<{ slug?: string }>();

  if (!slug) {
    return (
      <div className="min-h-screen bg-background text-foreground px-6 py-12">
        <Helmet>
          <title>Legal & Compliance — YubiLearn</title>
          <meta name="description" content="Privacy Policy, Terms, DPA, security, and parent rights for YubiLearn." />
          <link rel="canonical" href="https://yubilearn.com/game/legal" />
        </Helmet>
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <h1 className="text-3xl font-bold mb-2">Legal & Compliance</h1>
          <p className="text-muted-foreground mb-8">Everything schools, districts, and parents need to evaluate YubiLearn.</p>
          <ul className="space-y-3">
            {docs.map((d) => (
              <li key={d.slug}>
                <Link to={`/game/legal/${d.slug}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors">
                  <div className="font-semibold">{d.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{d.desc}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const doc = docMap[slug];
  if (!doc) return <Navigate to="/game/legal" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12">
      <Helmet>
        <title>{doc.title} — YubiLearn</title>
        <meta name="description" content={doc.desc} />
        <link rel="canonical" href={`https://yubilearn.com/game/legal/${doc.slug}`} />
      </Helmet>
      <div className="max-w-3xl mx-auto">
        <Link to="/game/legal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> All documents
        </Link>
        <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
        <p className="text-muted-foreground mb-8">{doc.desc}</p>
        <article className="prose prose-invert max-w-none [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:my-3 [&_ul]:my-3 [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:my-3 [&_ol]:pl-6 [&_ol]:list-decimal [&_a]:text-primary [&_a:hover]:underline [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-muted [&_code]:text-xs">
          {doc.body}
        </article>
        <div className="mt-12 pt-6 border-t border-border">
          <Button variant="outline" asChild>
            <a href="mailto:privacy@yubilearn.com">Contact privacy@yubilearn.com</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
