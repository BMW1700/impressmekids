import { PilotDoc } from './PilotDoc';

export default function NDPAExhibit() {
  return (
    <PilotDoc
      eyebrow="Privacy Rider — SDPC / NDPA"
      title="Student Data Privacy Agreement — General Exhibit"
      subtitle="SDPC-aligned exhibit compatible with the Standard NDPA (v1.0) used by state alliances including IL, CA, TX, and MA."
    >
      <h2>Exhibit A — Description of services</h2>
      <p>
        YubiLearn provides an AI-powered literacy platform for grades PreK-8 including
        oral-reading assessment (AURA), personalized story generation, and teacher/parent
        dashboards.
      </p>

      <h2>Exhibit B — Schedule of data</h2>
      <ul>
        <li>Student first name (optional), grade level, classroom code</li>
        <li>Oral-reading audio samples (retained only when parent consent = true)</li>
        <li>Words-correct-per-minute (WCPM), accuracy percentage, phoneme-level miscues</li>
        <li>In-app progress, achievements, and time-on-task</li>
        <li>No SSN, no home address, no biometric identifiers, no health data</li>
      </ul>

      <h2>Exhibit C — Definitions</h2>
      <p>
        Terms not defined here take the meaning given in the Standard NDPA v1.0 published
        by the Student Data Privacy Consortium.
      </p>

      <h2>Exhibit D — Data destruction</h2>
      <p>
        On written request or contract termination, YubiLearn returns student data in
        CSV/JSON within 30 days and destroys all production copies within 60 days. Backup
        copies are purged within 180 days on a rolling basis. A signed Certificate of
        Destruction is provided on request.
      </p>

      <h2>Exhibit E — General offer of privacy terms</h2>
      <p>
        YubiLearn hereby offers the same privacy terms accepted by any District that has
        signed this Exhibit to any other member LEA of the same state alliance, on the
        alliance's standard NDPA, without further negotiation.
      </p>

      <h2>Exhibit F — Data security requirements</h2>
      <ul>
        <li>TLS 1.2+ in transit; AES-256 at rest</li>
        <li>Row-Level Security on every student-scoped database table</li>
        <li>SOC 2-aligned controls; annual third-party security review</li>
        <li>MFA required for all admin routes</li>
        <li>Immutable audit log of all admin actions (SHA-256 hash-chained)</li>
        <li>72-hour breach notification to Districts</li>
      </ul>

      <h2>Signatures</h2>
      <div className="not-prose mt-6 grid grid-cols-2 gap-8 text-sm">
        <div>
          <div className="mb-1 font-semibold">For the LEA</div>
          <div className="mb-8 border-b border-foreground/40 pb-6">&nbsp;</div>
          <div className="text-muted-foreground">Name / Title / Date</div>
        </div>
        <div>
          <div className="mb-1 font-semibold">For YubiLearn Inc.</div>
          <div className="mb-8 border-b border-foreground/40 pb-6">&nbsp;</div>
          <div className="text-muted-foreground">Name / Title / Date</div>
        </div>
      </div>
    </PilotDoc>
  );
}
