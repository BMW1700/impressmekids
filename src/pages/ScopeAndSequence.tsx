import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, GraduationCap, BookOpen, CheckCircle2, Download } from 'lucide-react';
import {
  phonicsScopeAndSequence,
  totalPracticeWords,
} from '@/data/phonicsScopeAndSequence';
import { generateScopeSequencePdf } from '@/lib/scopeSequencePdf';

const ScopeAndSequence = () => {
  const handlePrint = () => window.print();
  const handleDownloadPdf = () => generateScopeSequencePdf();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Phonics Scope &amp; Sequence — YubiLearn</title>
        <meta name="description" content="Complete K-5 phonics scope and sequence used by YubiLearn AURA. Decoding skills, sight words, and practice word counts by grade." />
        <link rel="canonical" href="https://yubilearn.com/scope-and-sequence" />
        <meta property="og:title" content="Phonics Scope &amp; Sequence — YubiLearn" />
        <meta property="og:description" content="K-5 decoding skills, sight words, and practice word counts." />
        <meta property="og:url" content="https://yubilearn.com/scope-and-sequence" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "K-5 Phonics Scope & Sequence",
          "description": "Complete K-5 phonics scope and sequence used by YubiLearn AURA, covering decoding skills, sight words, and practice word counts by grade.",
          "educationalLevel": "K-5",
          "provider": {
            "@type": "Organization",
            "name": "YubiLearn",
            "url": "https://yubilearn.com"
          }
        })}</script>
      </Helmet>

      {/* Top bar — hidden when printing */}
      <header className="border-b border-border bg-card print:hidden">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/school">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to YubiLearn
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownloadPdf} size="sm" variant="default">
              <Download className="mr-2 h-4 w-4" />
              Download One-Pager PDF
            </Button>
            <Button onClick={handlePrint} size="sm" variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-10 print:py-4">
        {/* Hero */}
        <section className="mb-10 text-center print:mb-6">
          <div className="mb-4 flex items-center justify-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              YubiLearn
            </span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl print:text-3xl">
            K–2 Phonics Scope &amp; Sequence
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground print:text-base">
            A research-aligned phonics progression covering{' '}
            <strong>{phonicsScopeAndSequence.length} stages</strong> and{' '}
            <strong>{totalPracticeWords}+ practice words</strong>. Built into
            World 0: Phonics Foundations and reinforced across all 280
            decodable stories.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary">CCSS Aligned</Badge>
            <Badge variant="secondary">Wilson / UFLI Compatible</Badge>
            <Badge variant="secondary">Tier 1 Instruction</Badge>
            <Badge variant="secondary">Speech-Checked Mastery</Badge>
          </div>
        </section>

        {/* Visual ladder */}
        <section className="mb-10 print:mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                The Progression Ladder
              </CardTitle>
              <CardDescription>
                Each stage builds on the one below it. Students can be placed
                at any rung based on a 5-minute diagnostic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {[...phonicsScopeAndSequence].reverse().map((stage) => (
                  <li
                    key={stage.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {stage.stageNumber}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{stage.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {stage.example}
                      </div>
                    </div>
                    <Badge variant="outline" className="hidden sm:inline-flex">
                      {stage.recommendedGrades}
                    </Badge>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Detailed stage cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Stage-by-Stage Detail</h2>
          {phonicsScopeAndSequence.map((stage) => (
            <Card key={stage.id} className="print:break-inside-avoid">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Badge>Stage {stage.stageNumber}</Badge>
                      <Badge variant="outline">{stage.recommendedGrades}</Badge>
                    </div>
                    <CardTitle>{stage.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {stage.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Common Core Standards
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stage.ccssStandards.map((std) => (
                      <Badge key={std} variant="secondary" className="font-mono">
                        {std}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sample Practice Words
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stage.practiceWords.slice(0, 18).map((word) => (
                      <span
                        key={word}
                        className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-sm font-medium"
                      >
                        {word}
                      </span>
                    ))}
                    {stage.practiceWords.length > 18 && (
                      <span className="px-2 py-0.5 text-sm text-muted-foreground">
                        +{stage.practiceWords.length - 18} more
                      </span>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Teaching Tip
                  </div>
                  <p className="text-sm">{stage.teachingTip}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground print:mt-6">
          <p>
            <strong className="text-foreground">YubiLearn</strong> · AI-Powered
            Literacy Platform · yubilearn.com
          </p>
          <p className="mt-1">
            Phonics scope and sequence aligned to Common Core Foundational
            Reading Standards. Used in all K-2 instruction across the platform.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ScopeAndSequence;
