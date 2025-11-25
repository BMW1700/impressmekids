import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, StopCircle, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getIPAPronunciation } from '@/lib/cmuDictWrapper';
import { analyzeMispronunciationPatterns } from '@/lib/mispronunciationAnalysis';
import { detectPhonemes } from '@/lib/phonemeDetection';
import { checkAndAwardAchievements, generateDailyMissions, updateMissionProgress } from '@/lib/achievementLogic';
import { AchievementUnlockedModal } from './AchievementUnlockedModal';

// Browser compatibility check
const checkBrowserSupport = () => {
  const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const hasMediaRecorder = 'MediaRecorder' in window;
  const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  
  return {
    isSupported: hasWebSpeech && hasMediaRecorder && hasGetUserMedia,
    missing: [
      !hasWebSpeech && 'Web Speech API',
      !hasMediaRecorder && 'MediaRecorder',
      !hasGetUserMedia && 'Microphone Access'
    ].filter(Boolean) as string[]
  };
};

interface WordByWordReaderProps {
  passageText: string;
  assignmentId?: string;
  onComplete: (sessionData: ReadingSessionResult) => void;
}

interface ReadingSessionResult {
  sessionId: string;
  wpm: number;
  accuracy: number;
  wordsRead: number;
  durationSeconds: number;
}

interface WordReading {
  word: string;
  index: number;
  startMs: number;
  endMs: number;
  correct: boolean;
  hesitation: boolean;
}

export const WordByWordReader = ({ passageText, assignmentId, onComplete }: WordByWordReaderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordReadings, setWordReadings] = useState<WordReading[]>([]);
  const [browserSupport] = useState(checkBrowserSupport());
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const words = passageText.split(/\s+/).filter(w => w.length > 0);
  const { toast } = useToast();

  const startReading = useCallback(async () => {
    // Check browser support
    if (!browserSupport.isSupported) {
      toast({
        title: 'Browser not supported',
        description: `Missing: ${browserSupport.missing.join(', ')}. Please use Chrome or Edge.`,
        variant: 'destructive',
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    // Start audio recording for phoneme detection
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.start(100); // Capture every 100ms for fine-grained segmentation
      mediaRecorderRef.current = recorder;
    } catch (error) {
      console.error('Microphone access error:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast({
          title: 'Microphone access denied',
          description: 'Please allow microphone access to use this feature.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Microphone Error',
          description: 'Please check your microphone and try again.',
          variant: 'destructive',
        });
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    startTimeRef.current = Date.now();
    let wordTimestamps: Array<{ word: string; time: number }> = [];

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase();
          const timestamp = Date.now() - startTimeRef.current;

          const spokenWords = transcript.split(/\s+/);
          spokenWords.forEach((spokenWord) => {
            wordTimestamps.push({ word: spokenWord, time: timestamp });
          });

          const matchedReadings = matchWordsToPassage(
            wordTimestamps,
            words,
            currentWordIndex
          );

          setWordReadings(prev => [...prev, ...matchedReadings]);
          setCurrentWordIndex(prev => Math.min(prev + matchedReadings.length, words.length));
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        toast({
          title: 'No speech detected',
          description: 'Please start reading aloud',
          variant: 'destructive',
        });
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);

    toast({
      title: 'Start Reading!',
      description: 'Read the passage aloud, word by word',
    });
  }, [currentWordIndex, words, toast]);

  const stopReading = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // Give it time to finish capturing
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsRecording(false);
    setIsProcessing(true);

    const totalDuration = (Date.now() - startTimeRef.current) / 1000;
    const wordsRead = wordReadings.length;
    const wpm = Math.round((wordsRead / totalDuration) * 60);
    const correctWords = wordReadings.filter(w => w.correct).length;
    const accuracy = wordsRead > 0 ? Math.round((correctWords / wordsRead) * 100) : 0;
    const fluencyScore = calculateFluencyScore(wordReadings);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save your reading',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    const { data: session, error: sessionError } = await supabase
      .from('reading_sessions')
      .insert({
        student_id: user.id,
        assignment_id: assignmentId,
        passage_text: passageText,
        words_read: wordsRead,
        duration_seconds: totalDuration,
        wpm,
        accuracy_percent: accuracy,
        fluency_score: fluencyScore,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session save error:', sessionError);
      toast({
        title: 'Error',
        description: 'Failed to save reading session',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    if (wordReadings.length > 0) {
      // Combine audio chunks into single blob
      const fullAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Process each word with phoneme detection
      const wordInserts = await Promise.all(
        wordReadings.map(async (wr, idx) => {
          // Get expected phonemes for the word
          const expectedWord = words[wr.index] || wr.word;
          const expectedPhonemes = getIPAPronunciation(expectedWord)[0] || [];
          
          // Detect hesitation based on time gap (>800ms between words)
          const previousReading = idx > 0 ? wordReadings[idx - 1] : null;
          const timeGap = previousReading ? wr.startMs - previousReading.endMs : 0;
          const hasHesitation = timeGap > 800;
          
          // Extract audio segment for this word and detect phonemes
          let detectedPhonemes: string[] = [];
          try {
            const wordAudioBlob = await extractAudioSegment(
              fullAudioBlob,
              wr.startMs,
              wr.endMs
            );
            
            if (wordAudioBlob) {
              const phonemeResults = await detectPhonemes(wordAudioBlob);
              detectedPhonemes = phonemeResults.map(p => p.phoneme);
            }
          } catch (error) {
            console.error('Phoneme detection error for word:', wr.word, error);
          }
          
          return {
            session_id: session.id,
            word_text: wr.word,
            word_index: wr.index,
            start_time_ms: wr.startMs,
            end_time_ms: wr.endMs,
            phonemes_detected: detectedPhonemes,
            phonemes_expected: expectedPhonemes,
            was_correct: wr.correct,
            hesitation_detected: hasHesitation,
          };
        })
      );

      await supabase.from('word_readings').insert(wordInserts);
      
      // Clear audio chunks for next session
      audioChunksRef.current = [];
    }

    const { data: statsCheck } = await supabase
      .from('student_reading_stats')
      .select('total_sessions')
      .eq('student_id', user.id)
      .single();

    const isFirstSession = !statsCheck || statsCheck.total_sessions === 0;

    await updateStudentStats(user.id, wordsRead, accuracy);

    // Generate daily missions if not already created
    await generateDailyMissions(user.id);

    // Update mission progress
    await updateMissionProgress(user.id, {
      wordsRead,
      durationSeconds: totalDuration,
    });

    // Check and award achievements
    const achievements = await checkAndAwardAchievements(user.id, {
      wpm,
      accuracy,
      wordsRead,
      isFirstSession,
    });

    if (achievements.length > 0) {
      setNewAchievements(achievements);
      setShowAchievementModal(true);
    }

    // Analyze mispronunciation patterns in background
    analyzeMispronunciationPatterns(user.id, session.id).catch(console.error);

    setIsProcessing(false);

    onComplete({
      sessionId: session.id,
      wpm,
      accuracy,
      wordsRead,
      durationSeconds: totalDuration,
    });

    toast({
      title: `Great job! 🎉`,
      description: `${wpm} WPM, ${accuracy}% accuracy, +${wordsRead} XP`,
    });
  }, [wordReadings, passageText, assignmentId, onComplete, toast]);

  const renderPassage = () => {
    return words.map((word, idx) => {
      let className = 'px-1 py-0.5 rounded transition-colors inline-block ';
      
      if (idx < currentWordIndex) {
        const wordReading = wordReadings.find(wr => wr.index === idx);
        className += wordReading?.correct
          ? 'bg-green-200 dark:bg-green-900/50'
          : 'bg-red-200 dark:bg-red-900/50';
      } else if (idx === currentWordIndex && isRecording) {
        className += 'bg-yellow-200 dark:bg-yellow-900/50 font-bold ring-2 ring-primary animate-pulse';
      } else {
        className += 'text-muted-foreground';
      }

      return (
        <span key={idx} className={className}>
          {word}{' '}
        </span>
      );
    });
  };

  const progress = words.length > 0 ? (currentWordIndex / words.length) * 100 : 0;

  return (
    <Card className="p-6 space-y-4">
      {!browserSupport.isSupported && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your browser doesn't support word-by-word reading practice. 
            Missing: {browserSupport.missing.join(', ')}. 
            Please use Chrome, Edge, or another modern browser.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Word-by-Word Reading Practice</h3>
        <Badge variant="secondary">
          {currentWordIndex} / {words.length} words
        </Badge>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="prose prose-sm max-w-none bg-muted p-4 rounded-lg text-base leading-relaxed">
        {renderPassage()}
      </div>

      <div className="flex gap-2">
        {!isRecording && !isProcessing && (
          <Button 
            onClick={startReading} 
            className="flex-1"
            disabled={!browserSupport.isSupported}
          >
            <Mic className="mr-2 h-4 w-4" />
            Start Reading
          </Button>
        )}
        
        {isRecording && (
          <Button onClick={stopReading} variant="destructive" className="flex-1">
            <StopCircle className="mr-2 h-4 w-4" />
            Stop Reading
          </Button>
        )}

        {isProcessing && (
          <Button disabled className="flex-1">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </Button>
        )}
      </div>

      {isRecording && (
        <p className="text-sm text-center text-muted-foreground animate-pulse">
          🎤 Reading... Follow the highlighted word
        </p>
      )}

      <AchievementUnlockedModal
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
        achievements={newAchievements}
      />
    </Card>
  );
};

function matchWordsToPassage(
  timestamps: Array<{ word: string; time: number }>,
  expectedWords: string[],
  startIndex: number
): WordReading[] {
  const matched: WordReading[] = [];
  
  timestamps.forEach((ts, idx) => {
    const expectedIndex = startIndex + idx;
    if (expectedIndex >= expectedWords.length) return;
    
    const expected = expectedWords[expectedIndex].toLowerCase().replace(/[^\w]/g, '');
    const spoken = ts.word.toLowerCase().replace(/[^\w]/g, '');
    
    const isCorrect = calculateWordSimilarity(spoken, expected) > 0.75;
    
    matched.push({
      word: spoken,
      index: expectedIndex,
      startMs: idx > 0 ? timestamps[idx - 1].time : 0,
      endMs: ts.time,
      correct: isCorrect,
      hesitation: false,
    });
  });
  
  return matched;
}

function calculateWordSimilarity(word1: string, word2: string): number {
  const maxLen = Math.max(word1.length, word2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(word1, word2);
  return 1.0 - (distance / maxLen);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateFluencyScore(readings: WordReading[]): number {
  if (readings.length === 0) return 0;
  
  const accuracy = readings.filter(r => r.correct).length / readings.length;
  const avgDuration = readings.reduce((sum, r) => sum + (r.endMs - r.startMs), 0) / readings.length;
  const hesitations = readings.filter(r => r.hesitation).length;
  
  const accuracyScore = accuracy * 50;
  const paceScore = Math.min(50, (300 / Math.max(avgDuration, 100)) * 25);
  const hesitationPenalty = hesitations * 2;
  
  return Math.max(0, Math.min(100, accuracyScore + paceScore - hesitationPenalty));
}

async function updateStudentStats(studentId: string, wordsRead: number, accuracy: number) {
  const xpGained = wordsRead + Math.round((accuracy / 100) * wordsRead * 0.5);
  
  const { data: stats } = await supabase
    .from('student_reading_stats')
    .select('*')
    .eq('student_id', studentId)
    .single();

  const today = new Date().toISOString().split('T')[0];
  const lastActivityDate = stats?.last_activity_date;
  
  const isNewDay = !lastActivityDate || lastActivityDate !== today;
  const yesterday = getPreviousDate(today);
  const newStreak = isNewDay && lastActivityDate === yesterday
    ? (stats?.current_streak_days || 0) + 1
    : isNewDay
    ? 1
    : stats?.current_streak_days || 1;

  await supabase
    .from('student_reading_stats')
    .upsert({
      student_id: studentId,
      total_words_read: (stats?.total_words_read || 0) + wordsRead,
      total_sessions: (stats?.total_sessions || 0) + 1,
      current_streak_days: newStreak,
      longest_streak_days: Math.max(newStreak, stats?.longest_streak_days || 0),
      xp_points: (stats?.xp_points || 0) + xpGained,
      level: Math.floor(((stats?.xp_points || 0) + xpGained) / 1000) + 1,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    });
}

function getPreviousDate(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Extract a specific time segment from an audio blob
 */
async function extractAudioSegment(
  audioBlob: Blob,
  startMs: number,
  endMs: number
): Promise<Blob | null> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor((startMs / 1000) * sampleRate);
    const endSample = Math.floor((endMs / 1000) * sampleRate);
    const segmentLength = endSample - startSample;
    
    if (segmentLength <= 0 || startSample >= audioBuffer.length) {
      return null;
    }
    
    // Create new buffer for the segment
    const segmentBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      sampleRate
    );
    
    // Copy audio data for this segment
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const targetData = segmentBuffer.getChannelData(channel);
      
      for (let i = 0; i < segmentLength; i++) {
        const sourceIndex = startSample + i;
        if (sourceIndex < sourceData.length) {
          targetData[i] = sourceData[sourceIndex];
        }
      }
    }
    
    // Convert buffer back to blob
    return await audioBufferToBlob(segmentBuffer);
  } catch (error) {
    console.error('Audio segment extraction error:', error);
    return null;
  }
}

/**
 * Convert AudioBuffer to Blob
 */
async function audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  const renderedBuffer = await offlineContext.startRendering();
  
  // Convert to WAV format
  const wavData = audioBufferToWav(renderedBuffer);
  return new Blob([wavData], { type: 'audio/wav' });
}

/**
 * Convert AudioBuffer to WAV format
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);
  
  // Audio data
  const channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}
