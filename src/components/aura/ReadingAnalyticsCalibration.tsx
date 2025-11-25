import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ClipboardCheck, 
  Users, 
  Settings, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  BookOpen
} from "lucide-react";

const ReadingAnalyticsCalibration = () => {
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Phase 2: Testing & Calibration Plan</h1>
        <p className="text-muted-foreground text-lg">
          Validate the Reading Analytics system with real K-5 students
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Estimated Time:</strong> 2-3 days of focused testing with 5-10 students per grade level (K-5)
        </AlertDescription>
      </Alert>

      {/* Pre-Testing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Pre-Testing Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox id="pre-1" />
              <label htmlFor="pre-1" className="text-sm leading-relaxed cursor-pointer">
                <strong>Browser Compatibility Check:</strong> Test on Chrome (✅), Edge (✅), Firefox (✅), Safari (⚠️ limited support)
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="pre-2" />
              <label htmlFor="pre-2" className="text-sm leading-relaxed cursor-pointer">
                <strong>Microphone Setup:</strong> Verify microphone permissions granted, test audio recording quality
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="pre-3" />
              <label htmlFor="pre-3" className="text-sm leading-relaxed cursor-pointer">
                <strong>Passage Selection:</strong> Choose grade-appropriate passages (50-150 words for K-2, 150-300 words for 3-5)
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="pre-4" />
              <label htmlFor="pre-4" className="text-sm leading-relaxed cursor-pointer">
                <strong>Student Roster:</strong> Recruit 5-10 students per grade level (K-5) for diverse reading ability mix
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="pre-5" />
              <label htmlFor="pre-5" className="text-sm leading-relaxed cursor-pointer">
                <strong>Baseline Data:</strong> Record each student's known reading level (below/at/above grade level)
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Testing Protocol */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Testing Protocol (Per Student)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Step 1: Setup (2 minutes)
              </h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Student logs into their account</li>
                <li>Navigate to assigned reading passage</li>
                <li>Click "Start Reading" button</li>
                <li>Grant microphone permissions when prompted</li>
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Step 2: Reading Session (3-5 minutes)
              </h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Student reads passage aloud at natural pace</li>
                <li>Teacher observes: word-by-word highlighting accuracy</li>
                <li>Teacher notes: false positives (incorrect words marked correct)</li>
                <li>Teacher notes: false negatives (correct words marked incorrect)</li>
                <li>Teacher manually counts actual mispronunciations and hesitations</li>
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Step 3: Post-Session Review (2 minutes)
              </h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Record system-calculated WPM vs. teacher-calculated WPM</li>
                <li>Record system accuracy % vs. teacher-observed accuracy</li>
                <li>Record system mispronunciations vs. teacher count</li>
                <li>Record system hesitations vs. teacher count</li>
                <li>Note any phoneme detection errors (e.g., "th" → "t" missed)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calibration Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Calibration Thresholds to Adjust
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              After testing, adjust these thresholds in <code className="bg-muted px-1 rounded">WordByWordReader.tsx</code> based on real student data
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center justify-between">
                Word Similarity Threshold
                <Badge variant="outline">Currently: 0.75</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Controls how strict word matching is (0 = exact match required, 1 = any word accepted)
              </p>
              <div className="text-sm space-y-1">
                <p><strong>Too High (0.85+):</strong> False positives (wrong words marked correct)</p>
                <p><strong>Too Low (0.65-):</strong> False negatives (correct words marked wrong)</p>
                <p className="text-primary"><strong>Target Range:</strong> 0.70-0.80 based on testing results</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center justify-between">
                Hesitation Detection Timing
                <Badge variant="outline">Currently: 800ms</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Minimum pause duration to count as a hesitation
              </p>
              <div className="text-sm space-y-1">
                <p><strong>Too Short (500ms-):</strong> Natural pauses counted as hesitations</p>
                <p><strong>Too Long (1200ms+):</strong> Real hesitations missed</p>
                <p className="text-primary"><strong>Target Range:</strong> 700-900ms based on grade level</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center justify-between">
                Phoneme Confidence Threshold
                <Badge variant="outline">Currently: 0.6</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Minimum confidence score to trust phoneme detection (0-1 scale)
              </p>
              <div className="text-sm space-y-1">
                <p><strong>Too High (0.8+):</strong> Misses real pronunciation errors</p>
                <p><strong>Too Low (0.4-):</strong> False phoneme error detections</p>
                <p className="text-primary"><strong>Target Range:</strong> 0.55-0.70 based on CMU Dictionary accuracy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WPM Benchmarks by Grade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            WPM Benchmarks to Validate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify that system-calculated WPM aligns with these research-based oral reading fluency norms:
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Kindergarten</h3>
                <Badge>Beginning Readers</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p>Fall: 10-30 WPM</p>
                <p>Winter: 20-40 WPM</p>
                <p>Spring: 30-60 WPM</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">1st Grade</h3>
                <Badge>Emerging Fluency</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p>Fall: 30-60 WPM</p>
                <p>Winter: 40-80 WPM</p>
                <p>Spring: 60-90 WPM</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">2nd Grade</h3>
                <Badge>Developing Fluency</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p>Fall: 60-90 WPM</p>
                <p>Winter: 70-100 WPM</p>
                <p>Spring: 80-110 WPM</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">3rd Grade</h3>
                <Badge>Building Fluency</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p>Fall: 80-110 WPM</p>
                <p>Winter: 90-120 WPM</p>
                <p>Spring: 100-130 WPM</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">4th Grade</h3>
                <Badge>Strong Fluency</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p>Fall: 100-130 WPM</p>
                <p>Winter: 110-140 WPM</p>
                <p>Spring: 120-150 WPM</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">5th Grade</h3>
                <Badge>Advanced Fluency</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p>Fall: 120-150 WPM</p>
                <p>Winter: 130-160 WPM</p>
                <p>Spring: 140-170 WPM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Phase 2 Success Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The Reading Analytics system is production-ready when:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">WPM Accuracy: ±5 WPM</p>
                <p className="text-sm text-muted-foreground">
                  System-calculated WPM within 5 words/minute of teacher-calculated WPM across 80%+ of test sessions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Word Accuracy: 90%+ Match Rate</p>
                <p className="text-sm text-muted-foreground">
                  System correctly identifies 90%+ of words as correct/incorrect compared to teacher observation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Phoneme Detection: 85%+ Accuracy</p>
                <p className="text-sm text-muted-foreground">
                  System identifies 85%+ of true mispronunciations at the phoneme level (e.g., "th" → "t", vowel confusions)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Hesitation Detection: 80%+ Accuracy</p>
                <p className="text-sm text-muted-foreground">
                  System correctly identifies 80%+ of hesitations vs. natural pauses compared to teacher observation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">False Positive Rate: &lt;10%</p>
                <p className="text-sm text-muted-foreground">
                  Less than 10% of correct readings incorrectly flagged as errors
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Browser Compatibility: 95%+ Success Rate</p>
                <p className="text-sm text-muted-foreground">
                  System works on Chrome, Edge, Firefox without issues (Safari known limitation documented)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>After Phase 2 Completion:</strong> Document calibration results, update thresholds in code, and proceed to Phase 3 (Enhancement Features) or Phase 4 (Pilot School Rollout)
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ReadingAnalyticsCalibration;
