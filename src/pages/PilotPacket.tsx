import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  ScrollText,
  GraduationCap,
  Rocket,
  Baby,
  Landmark,
  Swords,
} from 'lucide-react';

type Item = {
  icon: typeof FileText;
  title: string;
  description: string;
  badge: string;
  href: string;
  external?: boolean;
};

const legal: Item[] = [
  {
    icon: FileText,
    title: '8-Week Free Pilot MSA',
    description:
      'Master Services Agreement for a no-cost, 8-week classroom pilot. Terminates automatically unless renewed.',
    badge: 'Signature required',
    href: '/legal/pilot-msa',
    external: true,
  },
  {
    icon: ShieldCheck,
    title: 'NY Ed Law §2-d Addendum',
    description:
      "New York State Education Law §2-d addendum + Parents' Bill of Rights supplemental information.",
    badge: 'NY districts',
    href: '/legal/ny-2d-addendum',
    external: true,
  },
  {
    icon: Landmark,
    title: 'NJ Privacy Addendum',
    description:
      'New Jersey supplemental terms covering N.J.S.A. 18A:36-35 and N.J.A.C. 6A:32-7.',
    badge: 'NJ districts',
    href: '/pilot-packet/nj-addendum',
  },
  {
    icon: ScrollText,
    title: 'SDPC / NDPA Exhibit',
    description:
      'Standard NDPA-aligned exhibit covering IL, CA, TX, MA and other state alliances.',
    badge: 'State alliances',
    href: '/pilot-packet/ndpa-exhibit',
  },
  {
    icon: Baby,
    title: 'FERPA / COPPA — Plain English',
    description:
      'One-page privacy overview for daycare directors, center owners, and parent hand-outs.',
    badge: 'Daycare-friendly',
    href: '/pilot-packet/ferpa-coppa',
  },
  {
    icon: GraduationCap,
    title: 'Privacy Summary (1 page)',
    description:
      'One-page plain-English data summary suitable for parent notifications and district cabinet review.',
    badge: 'Parent-facing',
    href: '/privacy-policy',
    external: true,
  },
];

const sales: Item[] = [
  {
    icon: Swords,
    title: 'YubiLearn vs Imagine — Coexistence Sheet',
    description:
      'One-page comparison for literacy coaches. Kills the "we already have Imagine" objection.',
    badge: 'Objection killer',
    href: '/pilot-packet/imagine-coexistence',
  },
  {
    icon: Rocket,
    title: 'Teacher / Director Quick Start',
    description:
      'One page, four steps. Get a classroom reading with Sir Bookears in under 10 minutes.',
    badge: 'Day-1 handout',
    href: '/pilot-packet/quick-start',
  },
];

function ItemCard({ item }: { item: Item }) {
  const Icon = item.icon;
  const Button_ = (
    <Button variant="outline" size="sm" asChild>
      {item.external ? (
        <a href={item.href} target="_blank" rel="noopener noreferrer">
          Open document
        </a>
      ) : (
        <Link to={item.href}>Open document</Link>
      )}
    </Button>
  );
  return (
    <Card>
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
        {Button_}
      </CardContent>
    </Card>
  );
}

export default function PilotPacket() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <div className="text-sm font-medium text-primary">Pilot Packet</div>
          <h1 className="mt-2 text-3xl font-bold">Everything a principal or director needs on the table.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            YubiLearn's 8-week pilot is free and terminates automatically. Print the sales
            one-pagers for your meeting and hand the legal documents to district counsel.
          </p>
        </div>

        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          For the meeting
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sales.map((item) => (
            <ItemCard key={item.title} item={item} />
          ))}
        </div>

        <div className="mt-10 mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          For legal / privacy review
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {legal.map((item) => (
            <ItemCard key={item.title} item={item} />
          ))}
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
