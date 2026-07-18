import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ShieldCheck, ScrollText, GraduationCap } from 'lucide-react';

const items = [
  {
    icon: FileText,
    title: '8-Week Free Pilot MSA',
    description:
      'Master Services Agreement for a no-cost, 8-week classroom pilot. Terminates automatically unless renewed.',
    badge: 'Signature required',
    href: '/legal/pilot-msa',
  },
  {
    icon: ShieldCheck,
    title: 'NY Ed Law §2-d Addendum',
    description:
      'New York State Education Law §2-d addendum + Parents\' Bill of Rights supplemental information.',
    badge: 'NY districts',
    href: '/legal/ny-2d-addendum',
  },
  {
    icon: ScrollText,
    title: 'Data Processing Addendum (DPA)',
    description:
      'Standard SDPC-aligned DPA covering FERPA, COPPA, CCPA, and student data handling. Attach to the MSA.',
    badge: 'FERPA / COPPA',
    href: '/legal/dpa',
  },
  {
    icon: GraduationCap,
    title: 'Privacy Summary (1 page)',
    description:
      'One-page plain-English data summary suitable for parent notifications and district cabinet review.',
    badge: 'Parent-facing',
    href: '/privacy-policy',
  },
];

export default function PilotPacket() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <div className="text-sm font-medium text-primary">Pilot Packet</div>
          <h1 className="mt-2 text-3xl font-bold">Everything your district legal team needs.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            YubiLearn's 8-week pilot is free and terminates automatically. Hand these four documents to
            your district counsel to clear us in one review cycle.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{item.badge}</Badge>
                  </div>
                  <CardTitle className="mt-3">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      Open document
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8">
          <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Need a different form?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll sign your district's DPA or SDPC exhibit. Email pilots@yubilearn.com with the
                template attached and we'll return it within 2 business days.
              </p>
            </div>
            <Button asChild>
              <a href="mailto:pilots@yubilearn.com?subject=DPA%20Signature%20Request">
                Email legal team
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
