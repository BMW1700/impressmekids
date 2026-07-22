import { PilotDoc } from './PilotDoc';

export default function NJAddendum() {
  return (
    <PilotDoc
      eyebrow="Privacy Rider — New Jersey"
      title="New Jersey Student Data Privacy Addendum"
      subtitle="Supplemental terms for pilot deployments in New Jersey local education agencies (LEAs)."
    >
      <h2>1. Scope</h2>
      <p>
        This Addendum supplements the YubiLearn Master Services Agreement and Data Processing
        Addendum (DPA) for any New Jersey LEA (the "District") entering an 8-week pilot with
        YubiLearn Inc. ("Provider"). In the event of a conflict between this Addendum and the
        MSA/DPA, this Addendum controls for the District's New Jersey deployment.
      </p>

      <h2>2. Applicable New Jersey law</h2>
      <ul>
        <li>N.J.S.A. 18A:36-35 (student directory information)</li>
        <li>N.J.A.C. 6A:32-7 (pupil records)</li>
        <li>N.J.S.A. 18A:36-19 et seq. (student records confidentiality)</li>
        <li>Federal FERPA (20 U.S.C. §1232g) and COPPA (15 U.S.C. §6501 et seq.)</li>
      </ul>

      <h2>3. Data ownership</h2>
      <p>
        All student data collected by Provider during the pilot remains the property of the
        District. Provider acts solely as a "school official" with a legitimate educational
        interest under FERPA §99.31(a)(1)(i)(B).
      </p>

      <h2>4. Permitted uses</h2>
      <p>
        Provider may use student data only to: (a) deliver the YubiLearn service to the
        District, (b) improve the security and reliability of the service for the District's
        users, and (c) respond to authorized District requests. Provider will not use student
        data to build advertising profiles, sell to third parties, or train externally
        licensed AI models.
      </p>

      <h2>5. Data minimization</h2>
      <p>
        Provider collects only the minimum data required to operate the service: student
        first name (optional), grade, classroom code, and oral-reading performance samples.
        Provider does not collect Social Security numbers, home addresses, biometric
        identifiers, or health records.
      </p>

      <h2>6. Sub-processors</h2>
      <p>
        Provider uses the following sub-processors, all under written data-protection
        agreements: Supabase (database + auth), OpenAI (AI text generation, with student PII
        stripped before transmission), ElevenLabs (voice synthesis, no PII), LALAL.AI
        (music/voice separation, no PII), Sentry (error monitoring, PII scrubbed).
      </p>

      <h2>7. Breach notification</h2>
      <p>
        Provider will notify the District in writing within 72 hours of confirming any
        unauthorized access to District student data, and will cooperate with the District's
        obligations under N.J.S.A. 18A:36-35.
      </p>

      <h2>8. Data return and deletion</h2>
      <p>
        Upon pilot expiration or on 30 days' written request, Provider will return all
        District student data in CSV/JSON format and permanently delete all copies from
        production systems within 60 days, with backups purged within 180 days.
      </p>

      <h2>9. Parental rights</h2>
      <p>
        Provider maintains a self-service parental data-deletion portal at{' '}
        <span className="whitespace-nowrap">yubilearn.com/parent/delete</span>. Requests
        made through this portal trigger cascading deletion of the child's account, audio
        samples, and analytics within 30 days.
      </p>

      <h2>10. Term</h2>
      <p>
        This Addendum is effective on the pilot start date and expires with the MSA.
        Sections 3, 4, 5, 7, 8, and 9 survive termination.
      </p>

      <h2>Signatures</h2>
      <div className="not-prose mt-6 grid grid-cols-2 gap-8 text-sm">
        <div>
          <div className="mb-1 font-semibold">For the District</div>
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
