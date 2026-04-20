import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, CheckCircle2, XCircle, Volume2, RefreshCw } from 'lucide-react';
import { speechManager } from '@/lib/speechRecognitionManager';
import { isWordMatchLenient } from '@/lib/wordMatchingModes';
import { playCorrectPronunciation, unlockSpeechSynthesis } from '@/lib/pronunciationPlayer';

interface PhonicsMasteryCheckProps {
  /** Practice words pool for the stage. We pick 5 at random per attempt. */
  words: string[];
  /** Threshold (0-1) of correct words required to pass. Defaults to 0.8. */
  passThreshold?: number;
  /** Called when the student passes — receives correct/attempted counts. */
  onPass: (wordsCorrect: number, wordsAttempted: number) => void;
  /** Called if the student bails out without passing. */
  onCancel?: () => void;
}

const WORDS_PER_CHECK = 5;

const sampleWords = (pool: string[], n: number): string[] => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, pool.length));
};

/**
 * Speech-checked mastery gate for a phonics stage.
 *
 * Flow:
 * 1. Sample 5 random words from the stage's practice pool.
 * 2. Show one word at a time, listen via speechManager.
 * 3. Use lenient matchWord() (incl. phonicsConfusionMap) to grade each.
 * 4. Pass when ≥ threshold correct; auto-call onPass with the stats.
 */
export const PhonicsMasteryCheck = ({
  words,
  passThreshold = 0.8,
  onPass,
  onCancel,
}: PhonicsMasteryCheckProps) => {
  const [checkWords, setCheckWords] = useState<string[]>(() =>
    sampleWords(words, WORDS_PER_CHECK),
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<Array<'pending' | 'correct' | 'incorrect'>>(
    () => Array(WORDS_PER_CHECK).fill('pending'),
  );
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>('');
  const [finished, setFinished] = useState(false);

  // Stable refs to avoid stale closures during speech callbacks
  const idxRef = useRef(currentIdx);
  const wordsRef = useRef(checkWords);
  const resultsRef = useRef(results);

  useEffect(() => { idxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { wordsRef.current = checkWords; }, [checkWords]);
  useEffect(() => { resultsRef.current = results; }, [results]);

  // Cleanup mic on unmount
  useEffect(() => {
    return () => {
      if (speechManager.getCurrentOwner() === 'reader') {
        speechManager.stop('reader');
      }
    };
  }, []);

  const advance = (wasCorrect: boolean) => {
    const idx = idxRef.current;
    const next = [...resultsRef.current];
    next[idx] = wasCorrect ? 'correct' : 'incorrect';
    setResults(next);

    const newIdx = idx + 1;
    if (newIdx >= wordsRef.current.length) {
      // Done — stop mic, calculate score, fire onPass if threshold met
      stopListening();
      setFinished(true);
      const correctCount = next.filter((r) => r === 'correct').length;
      if (correctCount / wordsRef.current.length >= passThreshold) {
        // Slight delay so the student sees the final tick
        setTimeout(() => onPass(correctCount, wordsRef.current.length), 600);
      }
    } else {
      setCurrentIdx(newIdx);
    }
  };

  const startListening = () => {
    unlockSpeechSynthesis();
    setListening(true);
    setLastHeard('');

    const ok = speechManager.start({
      owner: 'reader',
      continuous: true,
      interimResults: true,
      onResult: (transcript, alternatives, isFinal) => {
        if (!isFinal) return;
        const target = wordsRef.current[idxRef.current];
        if (!target) return;

        setLastHeard(transcript);

        // Try the primary transcript + all alternatives via lenient matcher
        const candidates = [transcript, ...alternatives];
        const matched = candidates.some((cand) =>
          isWordMatchLenient(cand, target),
        );

        advance(matched);
      },
      onError: (err) => {
        console.warn('[PhonicsMasteryCheck] mic error:', err);
        setListening(false);
      },
      onEnd: () => {
        // speechManager auto-restarts while continuous; this only fires on full stop
      },
    });

    if (!ok) {
      setListening(false);
    }
  };

  const stopListening = () => {
    if (speechManager.getCurrentOwner() === 'reader') {
      speechManager.stop('reader');
    }
    setListening(false);
  };

  const restart = () => {
    stopListening();
    setCheckWords(sampleWords(words, WORDS_PER_CHECK));
    setCurrentIdx(0);
    setResults(Array(WORDS_PER_CHECK).fill('pending'));
    setLastHeard('');
    setFinished(false);
  };

  const correctCount = results.filter((r) => r === 'correct').length;
  const attemptedCount = results.filter((r) => r !== 'pending').length;
  const passed = finished && correctCount / checkWords.length >= passThreshold;
  const failed = finished && !passed;
  const currentWord = checkWords[currentIdx];

  return (
    <div className="rounded-lg border border-primary/30 bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Mastery Check
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Read each word aloud. Get {Math.ceil(passThreshold * checkWords.length)} of{' '}
            {checkWords.length} correct to master this stage.
          </p>
        </div>
        <Badge variant="outline">
          {attemptedCount} / {checkWords.length}
        </Badge>
      </div>

      <Progress value={(attemptedCount / checkWords.length) * 100} className="h-1.5" />

      {/* Word ribbon — shows result chips */}
      <div className="flex flex-wrap gap-2">
        {checkWords.map((w, i) => {
          const status = results[i];
          const isActive = i === currentIdx && !finished;
          return (
            <div
              key={`${w}-${i}`}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium border transition-all ${
                isActive
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : status === 'correct'
                    ? 'border-primary/30 bg-primary/5 text-primary'
                    : status === 'incorrect'
                      ? 'border-destructive/30 bg-destructive/5 text-destructive'
                      : 'border-border bg-muted/40 text-muted-foreground'
              }`}
            >
              {status === 'correct' && <CheckCircle2 className="h-3.5 w-3.5" />}
              {status === 'incorrect' && <XCircle className="h-3.5 w-3.5" />}
              <span>{w}</span>
            </div>
          );
        })}
      </div>

      {!finished && currentWord && (
        <div className="rounded-md bg-muted/40 p-5 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Read this word
          </div>
          <div className="text-4xl font-bold text-foreground mb-3">{currentWord}</div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              unlockSpeechSynthesis();
              playCorrectPronunciation(currentWord);
            }}
          >
            <Volume2 className="mr-2 h-4 w-4" />
            Hear it
          </Button>
          {lastHeard && (
            <div className="mt-3 text-xs text-muted-foreground">
              Heard: <span className="font-mono">{lastHeard}</span>
            </div>
          )}
        </div>
      )}

      {finished && (
        <div
          className={`rounded-md p-5 text-center ${
            passed
              ? 'bg-primary/10 border border-primary/30'
              : 'bg-destructive/5 border border-destructive/30'
          }`}
        >
          <div className="text-2xl font-bold mb-1">
            {correctCount} / {checkWords.length} correct
          </div>
          <div className="text-sm text-muted-foreground">
            {passed
              ? '🎉 Mastered! Saving your progress...'
              : 'Keep practicing — you\'ll get it next time.'}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {onCancel && !finished && (
          <Button variant="ghost" size="sm" onClick={() => { stopListening(); onCancel(); }}>
            Cancel
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          {failed && (
            <Button variant="outline" size="sm" onClick={restart}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          )}
          {!finished && (
            listening ? (
              <Button variant="outline" size="sm" onClick={stopListening}>
                <MicOff className="mr-2 h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button size="sm" onClick={startListening}>
                <Mic className="mr-2 h-4 w-4" />
                Start reading
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
