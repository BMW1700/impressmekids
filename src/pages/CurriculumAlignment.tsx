import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { phonicsScopeAndSequence, PhonicsStage } from '@/data/phonicsScopeAndSequence';

type CurriculumKey =
  | 'fundations'
  | 'ckla'
  | 'hmhIntoReading'
  | 'elEducation'
  | 'witWisdom'
  | 'ufli'
  | 'heggerty';

const CURRICULA: { key: CurriculumKey; label: string; description: string }[] = [
  { key: 'hmhIntoReading', label: 'HMH Into Reading', description: 'NYC Reads / Success Academy' },
  { key: 'elEducation', label: 'EL Education', description: 'NYC Reads / Uncommon Schools' },
  { key: 'witWisdom', label: 'Wit & Wisdom (Amplify)', description: 'NYC Reads knowledge-building' },
  { key: 'ckla', label: 'Amplify CKLA', description: 'Skills strand K-2' },
  { key: 'fundations', label: 'Wilson Fundations', description: 'Tier 1 & Tier 2 phonics' },
  { key: 'ufli', label: 'UFLI Foundations', description: 'Public-domain K-1 phonics' },
  { key: 'heggerty', label: 'Heggerty PA', description: 'Phonemic Awareness curriculum' },
];

function stageAlignment(stage: PhonicsStage, key: CurriculumKey): string | undefined {
  return stage.curriculumAlignment?.[key];
}

export default function CurriculumAlignment() {
  const [selected, setSelected] = useState<CurriculumKey>('hmhIntoReading');
  const selectedMeta = useMemo(() => CURRICULA.find((c) => c.key === selected)!, [selected]);

  const printable = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold">Curriculum Alignment</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Pick your school's Tier-1 curriculum. YubiLearn's phonics stages map directly to the
              standard scope-and-sequence so your literacy lead can slot us in as a supplement or Tier-2
              intervention.
            </p>
          </div>
          <Button variant="outline" onClick={printable}>Print / Save PDF</Button>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 print:hidden">
          {CURRICULA.map((c) => (
            <Button
              key={c.key}
              size="sm"
              variant={selected === c.key ? 'default' : 'outline'}
              onClick={() => setSelected(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </div>

        <Card className="print:border-0 print:shadow-none">
          <CardHeader>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <CardTitle>YubiLearn ↔ {selectedMeta.label}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{selectedMeta.description}</p>
              </div>
              <Badge variant="secondary">K – Grade 2</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-semibold">YubiLearn Stage</th>
                    <th className="py-2 pr-4 font-semibold">CCSS</th>
                    <th className="py-2 pr-4 font-semibold">Grades</th>
                    <th className="py-2 font-semibold">{selectedMeta.label} placement</th>
                  </tr>
                </thead>
                <tbody>
                  {phonicsScopeAndSequence.map((stage) => (
                    <tr key={stage.id} className="border-b align-top">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{stage.title}</div>
                        <div className="text-xs text-muted-foreground">{stage.example}</div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {stage.ccssStandards.join(', ')}
                      </td>
                      <td className="py-3 pr-4 text-xs">{stage.recommendedGrades}</td>
                      <td className="py-3 text-xs">
                        {stageAlignment(stage, selected) ?? (
                          <span className="italic text-muted-foreground">
                            Reinforcement / no direct mapping
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 space-y-2 text-xs text-muted-foreground">
              <p>
                YubiLearn is a supplemental practice + assessment layer. It does not replace core
                Tier-1 instruction. All alignment mappings are approximate and reflect the most common
                pacing guides. Contact us for a district-specific crosswalk.
              </p>
              <p>
                Full public phonics scope: <Link className="underline" to="/scope-and-sequence">/scope-and-sequence</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
