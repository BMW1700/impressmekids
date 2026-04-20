import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  Volume2,
  Trophy,
} from 'lucide-react';
import { phonicsScopeAndSequence } from '@/data/phonicsScopeAndSequence';
import { playCorrectPronunciation, unlockSpeechSynthesis } from '@/lib/pronunciationPlayer';
import { useToast } from '@/hooks/use-toast';

/**
 * World 0: Phonics Foundations
 *
 * A pre-LexiQuest mini-campaign that teaches the science-of-reading
 * progression (CVC → blends → Silent-E → digraphs → vowel teams → r-controlled).
 * Each stage shows a lesson card, lets the student listen to practice words,
 * and offers a "Mark Mastered" gate. Local-only progression for now (no DB
 * write); a future pass can persist mastery to campaign_progress.
 */
const STORAGE_KEY = 'nabulearn:phonics-foundations:mastered';

const loadMastered = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
};

const PhonicsFoundations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mastered, setMastered] = useState<Set<string>>(() => loadMastered());
  const [activeStageId, setActiveStageId] = useState<string | null>(
    phonicsScopeAndSequence[0].id,
  );

  const total = phonicsScopeAndSequence.length;
  const completed = mastered.size;
  const percent = Math.round((completed / total) * 100);
  const allComplete = completed === total;

  const persist = (next: Set<string>) => {
    setMastered(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // ignore storage errors
    }
  };

  const isUnlocked = (idx: number) => {
    if (idx === 0) return true;
    const prev = phonicsScopeAndSequence[idx - 1];
    return mastered.has(prev.id);
  };

  const handlePlayWord = (word: string) => {
    unlockSpeechSynthesis();
    playCorrectPronunciation(word);
  };

  const handleMastered = (stageId: string, stageTitle: string) => {
    const next = new Set(mastered);
    next.add(stageId);
    persist(next);
    toast({
      title: 'Stage mastered! 🎉',
      description: `Great job completing ${stageTitle}.`,
    });
    // Auto-advance to the next stage
    const idx = phonicsScopeAndSequence.findIndex((s) => s.id === stageId);
    const nextStage = phonicsScopeAndSequence[idx + 1];
    if (nextStage) setActiveStageId(nextStage.id);
  };

  const handleEnterLexiQuest = () => navigate('/game/play');

  const activeStage =
    phonicsScopeAndSequence.find((s) => s.id === activeStageId) ??
    phonicsScopeAndSequence[0];

  return (
    <div className="min-h-screen bg-background">

      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/game">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            World 0
          </Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <section className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Phonics Foundations
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
            Master the Building Blocks of Reading
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Six research-aligned stages — the same progression used by Wilson,
            UFLI, and Orton-Gillingham. Complete each stage to unlock LexiQuest
            World 1.
          </p>

          <div className="mx-auto mt-6 max-w-md">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">
                {completed} of {total} stages mastered
              </span>
              <span className="text-muted-foreground">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>

          {allComplete && (
            <div className="mx-auto mt-6 max-w-md rounded-lg border border-primary/30 bg-primary/10 p-4">
              <div className="mb-2 flex items-center justify-center gap-2 font-semibold text-primary">
                <Trophy className="h-5 w-5" />
                Foundation Complete!
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                You've mastered every phonics stage. LexiQuest awaits.
              </p>
              <Button onClick={handleEnterLexiQuest} size="lg">
                Enter LexiQuest →
              </Button>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Stage ladder sidebar */}
          <aside className="space-y-2">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Progression Ladder
            </h2>
            {phonicsScopeAndSequence.map((stage, idx) => {
              const unlocked = isUnlocked(idx);
              const done = mastered.has(stage.id);
              const active = stage.id === activeStageId;
              return (
                <button
                  key={stage.id}
                  onClick={() => unlocked && setActiveStageId(stage.id)}
                  disabled={!unlocked}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    active
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : unlocked
                        ? 'border-border bg-card hover:border-primary/50'
                        : 'border-border bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        done
                          ? 'bg-primary text-primary-foreground'
                          : unlocked
                            ? 'bg-muted text-foreground'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : !unlocked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        stage.stageNumber
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {stage.shortLabel}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {stage.recommendedGrades}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            <Separator className="my-4" />

            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/scope-and-sequence">View Full Scope &amp; Sequence</Link>
            </Button>
          </aside>

          {/* Active stage detail */}
          <section>
            <Card>
              <CardHeader>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge>Stage {activeStage.stageNumber}</Badge>
                  <Badge variant="outline">{activeStage.recommendedGrades}</Badge>
                  {activeStage.ccssStandards.map((s) => (
                    <Badge key={s} variant="secondary" className="font-mono text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="text-2xl">{activeStage.title}</CardTitle>
                <CardDescription className="text-base">
                  {activeStage.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Teaching Tip
                  </div>
                  <p className="text-sm">{activeStage.teachingTip}</p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Practice Words</h3>
                    <span className="text-xs text-muted-foreground">
                      Tap any word to hear it
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeStage.practiceWords.map((word) => (
                      <button
                        key={word}
                        onClick={() => handlePlayWord(word)}
                        className="group flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <Volume2 className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                        {word}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {mastered.has(activeStage.id)
                      ? '✓ You\'ve already mastered this stage.'
                      : 'When you can read these confidently, mark this stage as mastered.'}
                  </div>
                  <Button
                    onClick={() =>
                      handleMastered(activeStage.id, activeStage.title)
                    }
                    disabled={mastered.has(activeStage.id)}
                  >
                    {mastered.has(activeStage.id) ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mastered
                      </>
                    ) : (
                      'Mark as Mastered'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PhonicsFoundations;
