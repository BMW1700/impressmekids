import { PilotDoc } from './PilotDoc';

export default function FerpaCoppaOnePager() {
  return (
    <PilotDoc
      eyebrow="Daycare / Preschool"
      title="FERPA & COPPA in plain English"
      subtitle="A one-page privacy overview for daycare directors, center owners, and parent hand-outs."
    >
      <h2>Who we are</h2>
      <p>
        YubiLearn is a US-based literacy platform for children ages 2–8. We help kids read
        aloud with an animated character named Sir Bookears and give teachers/parents a simple
        progress view.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Child's first name (optional) and age band</li>
        <li>Short audio samples of the child reading — only if a parent turns audio ON</li>
        <li>How many words the child reads correctly per minute</li>
        <li>Which stories they finished</li>
      </ul>
      <p><strong>We do not collect:</strong> home address, phone number, photos of the child, health records, biometric identifiers, or location data.</p>

      <h2>COPPA — for children under 13</h2>
      <p>
        We are COPPA-compliant. Accounts for children under 13 are created only after a
        verified parent or guardian gives written consent through our consent flow. Parents
        can revoke consent at any time via the self-service portal at{' '}
        <span className="whitespace-nowrap">yubilearn.com/parent/delete</span>, which
        deletes the child's account and all data within 30 days.
      </p>

      <h2>FERPA — for school-affiliated deployments</h2>
      <p>
        When a school or district deploys YubiLearn, we act as a "school official" with a
        legitimate educational interest under FERPA §99.31(a)(1)(i)(B). Student records
        remain the property of the school. We do not disclose student records to third
        parties without written authorization.
      </p>

      <h2>How we protect data</h2>
      <ul>
        <li>All data encrypted in transit (TLS 1.2+) and at rest (AES-256)</li>
        <li>Row-level access controls on every database table</li>
        <li>MFA on every admin login</li>
        <li>Audio samples stored in a private bucket, path-scoped to the classroom</li>
        <li>Student names/emails are stripped before any AI provider sees the data</li>
      </ul>

      <h2>What we never do</h2>
      <ul>
        <li>Sell student data</li>
        <li>Show advertising to children</li>
        <li>Build behavioral profiles for marketing</li>
        <li>Train external AI models on student data</li>
      </ul>

      <h2>Questions</h2>
      <p>
        <a href="mailto:privacy@yubilearn.com">privacy@yubilearn.com</a> · Response within
        2 business days.
      </p>
    </PilotDoc>
  );
}
