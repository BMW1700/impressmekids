import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sparkles,
  FileText,
  GraduationCap,
  ShieldCheck,
  BarChart3,
  Users,
} from 'lucide-react';

const highlights = [
  {
    icon: GraduationCap,
    title: 'Aligned with your curriculum',
    body:
      'YubiLearn maps to HMH Into Reading, EL Education, Wit & Wisdom, Amplify CKLA, and Wilson Fundations. Show a printable crosswalk to your literacy lead in 60 seconds.',
    cta: 'See alignment',
    href: '/curriculum-alignment',
  },
  {
    icon: BarChart3,
    title: 'Six-week principal demo',
    body:
      'Walk through a seeded Kindergarten classroom — 18 students, 6 weeks of growth data, MTSS Tier-2 groupings, printable teacher reports.',
    cta: 'Open demo classroom',
    href: '/demos/principal',
  },
  {
    icon: ShieldCheck,
    title: 'Pilot-ready legal package',
    body:
      'Ed Law §2-d addendum, DPA, and 8-week no-cost MSA available for your district legal counsel today. COPPA/FERPA compliant.',
    cta: 'Download pilot packet',
    href: '/pilot-packet',
  },
  {
    icon: Users,
    title: 'Teacher-first workflow',
    body:
      '15-minute training video, laminated quick-start card, roster import in under 5 minutes. No new logins for students — access codes only.',
    cta: 'View teacher demo',
    href: '/demos/teacher',
  },
];

export default function ForPrincipals() {
  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" /> For School Leaders
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          An early-literacy sprint your teachers actually want to run.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          YubiLearn's Sir Bookears mode is a Tier-1 supplement and Tier-2 intervention layer that plugs into HMH,
          EL, Wit & Wisdom, CKLA, and Fundations classrooms. Free 8-week pilot with printable teacher
          reports on Day 30 and Day 60.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/demos/principal">Open principal demo</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/pilot-packet">Download pilot packet</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <Card key={h.title} className="border-muted">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{h.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{h.body}</p>
                  <Button variant="link" className="h-auto p-0" asChild>
                    <Link to={h.href}>
                      {h.cta} <span aria-hidden>→</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" /> Ready to pilot?
              </div>
              <h2 className="mt-2 text-2xl font-bold">Book a 20-minute walkthrough.</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We'll show your specific curriculum crosswalk, a live principal dashboard, and confirm
                your district's Ed Law §2-d requirements on the call.
              </p>
            </div>
            <Button size="lg" asChild>
              <a href="mailto:pilots@yubilearn.com?subject=Bronx%20Pilot%20Interest">
                Email pilots@yubilearn.com
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
