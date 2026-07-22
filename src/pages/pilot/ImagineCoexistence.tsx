import { PilotDoc } from './PilotDoc';

export default function ImagineCoexistence() {
  const rows = [
    {
      dim: 'Assessment method',
      yubi: 'Listens to child read aloud. Returns WCPM, accuracy, prosody, and miscue analysis.',
      imagine: 'Tap, drag, and multiple-choice activities. No oral-reading measurement.',
    },
    {
      dim: 'Personalization',
      yubi: 'Real-time story generation adapted to the exact phonemes each child is missing (Pre-K Benny + K-5 RPG).',
      imagine: '~2,500 pre-authored activities on a fixed adaptive path.',
    },
    {
      dim: 'Parent / teacher controls',
      yubi: 'Live 1–5 Challenge Meter with optional PIN lock. Adjustable per child, per session.',
      imagine: 'System-controlled difficulty. Opaque to parents.',
    },
    {
      dim: 'Setup speed',
      yubi: '8-week free pilot. MSA + NY §2-d + DPA prepared. Classroom live in under a week.',
      imagine: 'Multi-year district contract. Procurement cycle typically 3–6 months.',
    },
    {
      dim: 'Reporting for principals',
      yubi: 'Printable 90-Day Growth Report mapped to CCSS Foundational Reading. MTSS Tier 1/2/3 grouping.',
      imagine: 'Strong dashboards, locked inside the Imagine portal.',
    },
    {
      dim: 'Price posture',
      yubi: '$5–7 per student per year. Pilot is free.',
      imagine: 'Enterprise district pricing. Not published.',
    },
    {
      dim: 'Coexistence',
      yubi: 'Designed to run alongside Imagine. CSV export of oral-reading data for the Imagine dashboard.',
      imagine: 'Core curriculum tool. Assumes it is the primary practice platform.',
    },
  ];

  return (
    <PilotDoc
      eyebrow="Coexistence Sheet"
      title="YubiLearn alongside Imagine Language & Literacy"
      subtitle="A one-page comparison for literacy coaches and district cabinets. We do not replace Imagine — we add the oral-reading measurement layer Imagine does not have."
    >
      <div className="not-prose overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-1/6 p-3 text-left font-semibold">Dimension</th>
              <th className="w-1/2 p-3 text-left font-semibold text-primary">YubiLearn</th>
              <th className="w-1/3 p-3 text-left font-semibold">Imagine Language & Literacy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dim} className="border-b align-top">
                <td className="p-3 font-medium">{r.dim}</td>
                <td className="p-3">{r.yubi}</td>
                <td className="p-3 text-muted-foreground">{r.imagine}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Bottom line for principals</h2>
      <p>
        Imagine is the incumbent gamified practice platform. YubiLearn is the oral-reading
        measurement layer plus a personalized practice layer that Imagine does not compete in.
        Pilot us for 8 weeks alongside your current Imagine deployment and we will show
        WCPM and accuracy growth on the same students, exportable to the format your
        literacy coach already uses.
      </p>
      <p className="text-sm text-muted-foreground">
        Questions: <a href="mailto:pilots@yubilearn.com">pilots@yubilearn.com</a>
      </p>
    </PilotDoc>
  );
}
