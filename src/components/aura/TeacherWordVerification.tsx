/**
 * Teacher Word Verification Component
 * Allows teachers to verify flagged words in student reading assessments
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { signAuraAudioUrl } from '@/lib/auraAudioUrl';
import { toast } from 'sonner';

interface FlaggedWord {
  index: number;
  expected: string;
  spoken: string;
  aiResult: boolean; // What AI marked it as
  confidence: 'high' | 'medium' | 'low';
  matchScore: number;
  speechConfidence: number;
  timestampMs: number; // For audio seek
}

interface TeacherWordVerificationProps {
  resultId: string;
  studentName: string;
  flaggedWords: FlaggedWord[];
  audioPath?: string | null;
  originalWcpm: number;
  originalAccuracy: number;
  totalWords: number;
  onVerificationComplete?: (adjustedWcpm: number, adjustedAccuracy: number) => void;
}

export const TeacherWordVerification = ({
  resultId,
  studentName,
  flaggedWords,
  audioPath,
  originalWcpm,
  originalAccuracy,
  totalWords,
  onVerificationComplete,
}: TeacherWordVerificationProps) => {
  const [expanded, setExpanded] = useState(false);
  const [verifications, setVerifications] = useState<Map<number, boolean>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load signed audio URL
  useEffect(() => {
    const loadAudioUrl = async () => {
      if (!audioPath) return;
      
      const { data } = await supabase.storage
        .from('aura-audio')
        .createSignedUrl(audioPath, 3600);
      
      if (data?.signedUrl) {
        setAudioUrl(data.signedUrl);
      }
    };
    
    loadAudioUrl();
  }, [audioPath]);

  // Calculate adjusted metrics based on verifications
  const calculateAdjustedMetrics = useCallback(() => {
    let correctionDelta = 0;
    
    flaggedWords.forEach((word) => {
      const teacherVerified = verifications.get(word.index);
      if (teacherVerified !== undefined) {
        // Teacher override
        if (teacherVerified && !word.aiResult) {
          // AI said wrong, teacher says correct: +1 to correct count
          correctionDelta += 1;
        } else if (!teacherVerified && word.aiResult) {
          // AI said correct, teacher says wrong: -1 from correct count
          correctionDelta -= 1;
        }
      }
    });
    
    // Calculate adjusted values
    const originalCorrect = Math.round((originalAccuracy / 100) * totalWords);
    const adjustedCorrect = Math.max(0, originalCorrect + correctionDelta);
    const adjustedAccuracy = totalWords > 0 ? Math.round((adjustedCorrect / totalWords) * 100) : 0;
    
    // WCPM is typically calculated from a 1-minute reading, so we adjust proportionally
    const wcpmAdjustment = Math.round(correctionDelta * (originalWcpm / Math.max(originalCorrect, 1)));
    const adjustedWcpm = Math.max(0, originalWcpm + wcpmAdjustment);
    
    return { adjustedWcpm, adjustedAccuracy, correctionDelta };
  }, [verifications, flaggedWords, originalWcpm, originalAccuracy, totalWords]);

  const handleVerify = (wordIndex: number, isCorrect: boolean) => {
    setVerifications(prev => {
      const newMap = new Map(prev);
      newMap.set(wordIndex, isCorrect);
      return newMap;
    });
  };

  const handlePlayWord = async (word: FlaggedWord) => {
    if (!audioRef.current || !audioUrl) return;
    
    // Seek to word timestamp (convert ms to seconds, with 0.3s buffer before)
    const seekTime = Math.max(0, (word.timestampMs - 300) / 1000);
    audioRef.current.currentTime = seekTime;
    audioRef.current.play();
    setIsPlaying(true);
    setCurrentPlayingIndex(word.index);
    
    // Auto-pause after 2 seconds (to hear just the word)
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        setCurrentPlayingIndex(null);
      }
    }, 2000);
  };

  const handleSaveVerifications = async () => {
    if (verifications.size === 0) {
      toast.info('No verifications to save');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { adjustedWcpm, adjustedAccuracy, correctionDelta } = calculateAdjustedMetrics();
      
      // Build verification data
      const verificationData = Array.from(verifications.entries()).map(([index, isCorrect]) => ({
        word_index: index,
        teacher_verified_correct: isCorrect,
        ai_original_result: flaggedWords.find(w => w.index === index)?.aiResult ?? false,
      }));
      
      // Update the benchmark result with teacher-verified data
      // Store verification info in notes field until schema is updated
      const verificationNote = `Teacher verified: Original WCPM ${originalWcpm} → ${adjustedWcpm}, Accuracy ${originalAccuracy}% → ${adjustedAccuracy}%. ${verificationData.length} words reviewed.`;
      
      const { error } = await supabase
        .from('student_benchmark_results')
        .update({
          wcpm: adjustedWcpm,
          accuracy_percentage: adjustedAccuracy,
          notes: verificationNote,
        })
        .eq('id', resultId);
      
      if (error) throw error;
      
      toast.success(`Verification saved! ${correctionDelta > 0 ? '+' : ''}${correctionDelta} corrections applied`);
      onVerificationComplete?.(adjustedWcpm, adjustedAccuracy);
    } catch (err) {
      console.error('Save verification error:', err);
      toast.error('Failed to save verification');
    } finally {
      setIsSaving(false);
    }
  };

  const { adjustedWcpm, adjustedAccuracy, correctionDelta } = calculateAdjustedMetrics();
  const hasChanges = verifications.size > 0;

  if (flaggedWords.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-green-700">
            <Shield className="h-5 w-5" />
            <span className="font-medium">High AI Confidence</span>
            <span className="text-sm text-green-600">- No words flagged for verification</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200">
      <CardHeader 
        className="cursor-pointer py-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">
              Teacher Verification ({flaggedWords.length} words flagged)
            </CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="bg-primary/10">
                {correctionDelta > 0 ? '+' : ''}{correctionDelta} changes
              </Badge>
            )}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          These words had low AI confidence. Verify for 100% accuracy.
        </p>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4">
          {/* Hidden audio element */}
          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
          )}
          
          {/* Flagged Words List */}
          <div className="space-y-2">
            {flaggedWords.map((word) => {
              const verified = verifications.get(word.index);
              const isCurrentlyPlaying = currentPlayingIndex === word.index;
              
              return (
                <div 
                  key={word.index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    verified === true ? 'bg-green-50 border-green-200' :
                    verified === false ? 'bg-red-50 border-red-200' :
                    'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Word info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">"{word.expected}"</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono text-sm text-muted-foreground">"{word.spoken}"</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            word.confidence === 'high' ? 'bg-green-100 text-green-700' :
                            word.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {word.matchScore}% match
                        </Badge>
                        <span>AI: {word.aiResult ? 'Correct' : 'Incorrect'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Play audio button */}
                    {audioUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlayWord(word)}
                        className={isCurrentlyPlaying ? 'text-primary' : ''}
                      >
                        {isCurrentlyPlaying ? (
                          <Volume2 className="h-4 w-4 animate-pulse" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {/* Verification buttons */}
                    <Button
                      variant={verified === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVerify(word.index, true)}
                      className={verified === true ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Correct
                    </Button>
                    <Button
                      variant={verified === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVerify(word.index, false)}
                      className={verified === false ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Incorrect
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <Separator />
          
          {/* Adjusted Metrics Preview */}
          {hasChanges && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground">Adjusted WCPM</p>
                <p className="text-2xl font-bold">
                  {adjustedWcpm}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (was {originalWcpm})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adjusted Accuracy</p>
                <p className="text-2xl font-bold">
                  {adjustedAccuracy}%
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (was {originalAccuracy}%)
                  </span>
                </p>
              </div>
            </div>
          )}
          
          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setVerifications(new Map())}
              disabled={!hasChanges || isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={handleSaveVerifications}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Verification'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
