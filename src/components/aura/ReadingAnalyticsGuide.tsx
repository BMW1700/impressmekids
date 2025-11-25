import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Target, TrendingUp, Award, AlertCircle, CheckCircle } from 'lucide-react';

export const ReadingAnalyticsGuide: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reading Analytics Teacher Guide</h1>
        <p className="text-muted-foreground">
          Everything you need to know about using the word-by-word reading analytics system
        </p>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          This system uses 100% free, client-side technology. No AI credits required!
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            What It Measures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold mb-1">Words Per Minute (WPM)</h4>
              <p className="text-sm text-muted-foreground">
                Tracks reading speed with grade-level benchmarks:
              </p>
              <ul className="text-sm text-muted-foreground ml-6 mt-1 space-y-1">
                <li>• Kindergarten: 50 WPM</li>
                <li>• 1st Grade: 60 WPM</li>
                <li>• 2nd Grade: 90 WPM</li>
                <li>• 3rd Grade: 110 WPM</li>
                <li>• 4th Grade: 125 WPM</li>
                <li>• 5th Grade: 135 WPM</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Accuracy (%)</h4>
              <p className="text-sm text-muted-foreground">
                Percentage of words read correctly using intelligent phoneme matching from the CMU Pronouncing Dictionary (90%+ accuracy)
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Mispronunciations</h4>
              <p className="text-sm text-muted-foreground">
                Automatically detects common phoneme-level errors like 'th' → 't', 'r' → 'w', vowel confusions, and consonant cluster issues
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Hesitations</h4>
              <p className="text-sm text-muted-foreground">
                Identifies pauses longer than 800ms, which may indicate word recognition struggles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            How Students Use It
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">1.</span>
              <span>Navigate to their Student Dashboard → Courses → Select a Classroom → Assignments Tab</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">2.</span>
              <span>Click on a reading assignment → "Word-by-Word Practice" tab</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">3.</span>
              <span>Click "Start Reading" and allow microphone access (browser will prompt)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">4.</span>
              <span>Read the passage aloud at their normal pace</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">5.</span>
              <span>Click "Stop Reading" when finished</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">6.</span>
              <span>System analyzes phonemes and generates instant feedback + personalized practice exercises</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Teacher Dashboard Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold mb-2">View in: Student Profile → AURA Tab</h4>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• WPM progress over time (line chart)</li>
              <li>• Accuracy trends</li>
              <li>• Phoneme mastery heatmap (which sounds they struggle with)</li>
              <li>• Mispronunciation patterns (e.g., "struggles with 'th' sound")</li>
              <li>• Personalized practice exercises generated for each student</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Gamification Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Students earn achievements automatically tracked in their stats:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6">
            <li>• Total reading sessions completed</li>
            <li>• Total words read aloud</li>
            <li>• Average WPM</li>
            <li>• Highest accuracy achieved</li>
            <li>• Phonemes mastered</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Browser Compatibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Supported:</strong> Chrome, Edge, Opera, Samsung Internet
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Not Supported:</strong> Safari (iOS/macOS), Firefox
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground mt-2">
            If students see a "Browser not supported" error, have them switch to Chrome or Edge.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Differences: Reading Analytics vs. AURA AI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">📖 Reading Analytics (New)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Focus:</strong> Oral reading fluency</li>
                <li>• <strong>Measures:</strong> WPM, pronunciation, hesitations</li>
                <li>• <strong>Technology:</strong> Web Speech API (free, client-side)</li>
                <li>• <strong>Cost:</strong> Zero credits, scales infinitely</li>
                <li>• <strong>Purpose:</strong> Phonics, decoding, fluency</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">🧠 AURA AI (Existing)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Focus:</strong> Reading comprehension</li>
                <li>• <strong>Measures:</strong> Text annotations, semantic analysis</li>
                <li>• <strong>Technology:</strong> Google Vertex AI (ML models)</li>
                <li>• <strong>Cost:</strong> Uses Lovable AI credits</li>
                <li>• <strong>Purpose:</strong> Critical thinking, inference, analysis</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Together</strong>, these systems provide comprehensive literacy support: <strong>AURA</strong> ensures students understand what they read, while <strong>Reading Analytics</strong> ensures they can read it fluently.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
