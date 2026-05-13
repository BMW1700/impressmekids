import { useState, useEffect } from 'react';
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
  Mic,
  Download,
} from 'lucide-react';
import { phonicsScopeAndSequence } from '@/data/phonicsScopeAndSequence';
import { playCorrectPronunciation, unlockSpeechSynthesis } from '@/lib/pronunciationPlayer';
import { useToast } from '@/hooks/use-toast';
import { usePhonicsFoundationsProgress } from '@/hooks/usePhonicsFoundationsProgress';
import { PhonicsMasteryCheck } from '@/components/aura/PhonicsMasteryCheck';
import { generatePhonicsCertificatePdf } from '@/lib/phonicsCertificatePdf';
import { supabase } from '@/integrations/supabase/client';

/**
 * World 0: Phonics Foundations
 * Speech-checked progression aligned to Common Core RF.K.2–RF.2.3.
 */
const PhonicsFoundations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mastered, loading, recordMastery, isAuthenticated } =
    usePhonicsFoundationsProgress();
  const [activeStageId, setActiveStageId] = useState<string>(
    phonicsScopeAndSequence[0].id,
  );
  const [checkingStageId, setCheckingStageId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const loadName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', uid)
        .maybeSingle();
      if (!cancelled && data?.full_name) setStudentName(data.full_name);
    };
    loadName();
    return () => { cancelled = true; };
  }, []);

  const total = phonicsScopeAndSequence.length;
  const completed = mastered.size;
  const percent = Math.round((completed / total) * 100);
  const allComplete = completed === total;

  const isUnlocked = (idx: number) => {
    if (idx === 0) return true;
    const prev = phonicsScopeAndSequence[idx - 1];
    return mastered.has(prev.id);
  };

  const handlePlayWord = (word: string) => {
    unlockSpeechSynthesis();
    playCorrectPronunciation(word);
  };

  const handleMasteryPass = async (
    stageId: string,
    stageTitle: string,
    wordsCorrect: number,
    wordsAttempted: number,
  ) => {
    setCheckingStageId(null);
    const { persisted } = await recordMastery(stageId, wordsCorrect, wordsAttempted);

    toast({
      title: 'Stage mastered! 🎉',
      description: persisted
        ? `Saved your progress on ${stageTitle}.`
        : `Great job on ${stageTitle}! Sign in to save progress to your account.`,
    });

    const idx = phonicsScopeAndSequence.findIndex((s) => s.id === stageId);
    const nextStage = phonicsScopeAndSequence[idx + 1];
    if (nextStage) setActiveStageId(nextStage.id);
  };

  const handleEnterLexiQuest = () => navigate('/game/play');

  const activeStage =
    phonicsScopeAndSequence.find((s) => s.id === activeStageId) ??
    phonicsScopeAndSequence[0];
  const isCheckingActive = checkingStageId === activeStage.id;
  const isAlreadyMastered = mastered.has(activeStage.id);

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
            Six research-aligned stages aligned to Common Core RF.K.2–RF.2.3.
            Each stage is unlocked by reading 5 practice words aloud — your
            voice is graded by the same engine that powers AURA.
          </p>

          <div className="mx-auto mt-6 max-w-md">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">
                {completed} of {total} stages mastered
              </span>
              <span className="text-muted-foreground">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2" />
            {!isAuthenticated && !loading && (
              <p className="mt-2 text-xs text-muted-foreground">
                Progress is saved locally on this device.{' '}
                <Link to="/auth" className="text-primary underline">
                  Sign in
                </Link>{' '}
                to sync across devices.
              </p>
            )}
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
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={handleEnterLexiQuest} size="lg">
                  Enter LexiQuest →
                </Button>
                <Button
                  onClick={() => generatePhonicsCertificatePdf(studentName)}
                  size="lg"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Certificate
                </Button>
              </div>
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

                {/* Mastery gate: speech-checked OR already-passed badge */}
                {isCheckingActive ? (
                  <PhonicsMasteryCheck
                    words={activeStage.practiceWords}
                    onPass={(correct, attempted) =>
                      handleMasteryPass(
                        activeStage.id,
                        activeStage.title,
                        correct,
                        attempted,
                      )
                    }
                    onCancel={() => setCheckingStageId(null)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      {isAlreadyMastered
                        ? '✓ You\'ve already mastered this stage.'
                        : 'Ready? Read 5 random words aloud to prove mastery.'}
                    </div>
                    <Button
                      onClick={() => setCheckingStageId(activeStage.id)}
                      disabled={isAlreadyMastered}
                    >
                      {isAlreadyMastered ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mastered
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Start Mastery Check
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PhonicsFoundations;
