import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useTeacherJournal, useTeacherGameScores, MoodType } from "@/hooks/useTeacherJournal";
import { Smile, Meh, Frown, Zap, Heart, Trophy, Star, Sparkles, Target, RefreshCw, Coffee, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const MOODS: { value: MoodType; icon: React.ReactNode; label: string; color: string }[] = [
  { value: 'amazing', icon: <Sparkles className="h-6 w-6" />, label: 'Amazing', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { value: 'good', icon: <Smile className="h-6 w-6" />, label: 'Good', color: 'bg-green-500 hover:bg-green-600' },
  { value: 'okay', icon: <Meh className="h-6 w-6" />, label: 'Okay', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: 'stressed', icon: <Coffee className="h-6 w-6" />, label: 'Stressed', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: 'tough', icon: <Frown className="h-6 w-6" />, label: 'Tough', color: 'bg-red-500 hover:bg-red-600' },
];

const MOTIVATIONAL_QUOTES = [
  { quote: "Every child you teach is an opportunity to change the world.", author: "Unknown" },
  { quote: "Teaching is the one profession that creates all other professions.", author: "Unknown" },
  { quote: "A good teacher can inspire hope, ignite the imagination, and instill a love of learning.", author: "Brad Henry" },
  { quote: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
  { quote: "Teachers affect eternity; no one can tell where their influence stops.", author: "Henry Adams" },
  { quote: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
  { quote: "The best teachers teach from the heart, not from the book.", author: "Unknown" },
  { quote: "What a teacher writes on the blackboard of life can never be erased.", author: "Unknown" },
  { quote: "Teaching is the greatest act of optimism.", author: "Colleen Wilcox" },
  { quote: "To teach is to touch a life forever.", author: "Unknown" },
];

interface TeacherJournalTabProps {
  classroomId?: string;
}

export function TeacherJournalTab({ classroomId }: TeacherJournalTabProps) {
  const { entries, todayEntry, moodStats, saveEntry, isSaving } = useTeacherJournal(classroomId);
  const { scores, personalBest, saveScore } = useTeacherGameScores();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(todayEntry?.mood || null);
  const [energyLevel, setEnergyLevel] = useState<number>(todayEntry?.energy_level || 3);
  const [note, setNote] = useState(todayEntry?.note || '');
  const [gratitude, setGratitude] = useState(todayEntry?.gratitude || '');
  const [winOfTheDay, setWinOfTheDay] = useState(todayEntry?.win_of_the_day || '');

  // Sync form with today's entry
  useEffect(() => {
    if (todayEntry) {
      setSelectedMood(todayEntry.mood);
      setEnergyLevel(todayEntry.energy_level || 3);
      setNote(todayEntry.note || '');
      setGratitude(todayEntry.gratitude || '');
      setWinOfTheDay(todayEntry.win_of_the_day || '');
    }
  }, [todayEntry]);

  const handleSave = () => {
    if (!selectedMood) return;
    saveEntry({
      mood: selectedMood,
      energy_level: energyLevel,
      note: note || undefined,
      gratitude: gratitude || undefined,
      win_of_the_day: winOfTheDay || undefined,
    });
  };

  // Mini-game state
  const [gameActive, setGameActive] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameTimeLeft, setGameTimeLeft] = useState(30);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [gameHighScore, setGameHighScore] = useState(personalBest?.score || 0);

  const moveTarget = useCallback(() => {
    setTargetPosition({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
    });
  }, []);

  const handleTargetClick = () => {
    if (!gameActive) return;
    setGameScore((s) => s + 1);
    moveTarget();
  };

  const startGame = () => {
    setGameActive(true);
    setGameScore(0);
    setGameTimeLeft(30);
    moveTarget();
  };

  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setGameTimeLeft((t) => {
        if (t <= 1) {
          setGameActive(false);
          if (gameScore > gameHighScore) {
            setGameHighScore(gameScore);
          }
          saveScore({ gameType: 'focus_tap', score: gameScore });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, gameScore, gameHighScore, saveScore]);

  // Random quote selection
  const dailyQuote = useMemo(() => {
    const today = new Date().toDateString();
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return MOTIVATIONAL_QUOTES[hash % MOTIVATIONAL_QUOTES.length];
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Teacher Journal</h2>
        <p className="text-muted-foreground mt-1">Track your mood, celebrate wins, and take a mental break</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Mood & Journal Card */}
        <Card className="shadow-card border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              How are you feeling today?
            </CardTitle>
            <CardDescription>Quick check-in to track your well-being</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mood Selector */}
            <div className="flex justify-center gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                    selectedMood === mood.value
                      ? `${mood.color} text-white scale-110 shadow-lg`
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {mood.icon}
                  <span className="text-xs font-medium">{mood.label}</span>
                </button>
              ))}
            </div>

            {/* Energy Level */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Energy Level
                </span>
                <Badge variant="outline">{energyLevel}/5</Badge>
              </div>
              <Slider
                value={[energyLevel]}
                onValueChange={(v) => setEnergyLevel(v[0])}
                min={1}
                max={5}
                step={1}
                className="py-2"
              />
            </div>

            {/* Win of the Day */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Win of the Day
              </label>
              <Textarea
                placeholder="What went well today? Celebrate your wins, big or small!"
                value={winOfTheDay}
                onChange={(e) => setWinOfTheDay(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>

            {/* Gratitude */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                Gratitude
              </label>
              <Textarea
                placeholder="What are you grateful for today?"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Any other thoughts or reflections..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!selectedMood || isSaving}
              className="w-full bg-gradient-primary"
            >
              {isSaving ? 'Saving...' : todayEntry ? 'Update Entry' : 'Save Entry'}
            </Button>
          </CardContent>
        </Card>

        {/* Mini-Game & Stats */}
        <div className="space-y-6">
          {/* Focus Tap Mini-Game */}
          <Card className="shadow-card border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Focus Break: Tap Game
              </CardTitle>
              <CardDescription>Take a quick mental break! Tap the targets as fast as you can.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    Score: {gameActive ? gameScore : (gameTimeLeft === 0 ? gameScore : '-')}
                  </Badge>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    Best: {Math.max(gameHighScore, personalBest?.score || 0)}
                  </Badge>
                </div>
                {gameActive && (
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {gameTimeLeft}s
                  </Badge>
                )}
              </div>

              <div
                className={cn(
                  "relative w-full h-48 rounded-xl border-2 transition-colors",
                  gameActive ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-muted"
                )}
              >
                {gameActive ? (
                  <button
                    onClick={handleTargetClick}
                    className="absolute w-12 h-12 rounded-full bg-gradient-primary shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 active:scale-95"
                    style={{
                      left: `${targetPosition.x}%`,
                      top: `${targetPosition.y}%`,
                    }}
                  >
                    <Target className="h-6 w-6 text-white" />
                  </button>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {gameTimeLeft === 0 ? (
                      <div className="text-center space-y-2">
                        <p className="text-2xl font-bold">Game Over!</p>
                        <p className="text-muted-foreground">You scored {gameScore} points</p>
                        <Button onClick={startGame} size="sm" className="mt-2">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Play Again
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={startGame} size="lg" className="bg-gradient-primary">
                        <Target className="mr-2 h-5 w-5" />
                        Start Game
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Mood Overview */}
          <Card className="shadow-card border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5 text-primary" />
                This Week's Moods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No entries yet. Start tracking your mood!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {entries.slice(0, 7).map((entry) => {
                    const moodConfig = MOODS.find((m) => m.value === entry.mood);
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg text-white",
                          moodConfig?.color || "bg-muted"
                        )}
                        title={new Date(entry.entry_date).toLocaleDateString()}
                      >
                        {moodConfig?.icon}
                        <span className="text-[10px]">
                          {new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Motivation Quote */}
          <Card className="shadow-card border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="py-6 text-center">
              <Quote className="h-8 w-8 mx-auto mb-3 text-primary" />
              <p className="text-lg italic text-muted-foreground">
                "{dailyQuote.quote}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">— {dailyQuote.author}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
