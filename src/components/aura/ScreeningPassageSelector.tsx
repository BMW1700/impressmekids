import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  getPassagesForGrade, 
  getRandomScreeningPassage, 
  getAvailableGradeLevels,
  type ScreeningPassage 
} from '@/data/screeningPassages';
import { BookOpen, Shuffle, Target, Clock } from 'lucide-react';

interface ScreeningPassageSelectorProps {
  gradeLevel: number;
  onSelectPassage: (passage: ScreeningPassage) => void;
}

export function ScreeningPassageSelector({ gradeLevel, onSelectPassage }: ScreeningPassageSelectorProps) {
  const [selectedGrade, setSelectedGrade] = useState<number>(gradeLevel);
  const [viewMode, setViewMode] = useState<'random' | 'manual'>('random');
  
  const passages = getPassagesForGrade(selectedGrade);
  const availableGrades = getAvailableGradeLevels();

  const handleRandomSelect = () => {
    const passage = getRandomScreeningPassage(selectedGrade);
    if (passage) {
      onSelectPassage(passage);
    }
  };

  const gradeLabel = (grade: number) => {
    if (grade === 0) return 'Kindergarten';
    return `Grade ${grade}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Screening Passage Selection
        </CardTitle>
        <CardDescription>
          Select a standardized passage for benchmark assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grade Level Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Grade Level:</label>
          <Select 
            value={selectedGrade.toString()} 
            onValueChange={(v) => setSelectedGrade(parseInt(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableGrades.map((g) => (
                <SelectItem key={g} value={g.toString()}>
                  {gradeLabel(g)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selection Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'random' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('random')}
          >
            <Shuffle className="h-4 w-4 mr-1" />
            Random Selection
          </Button>
          <Button
            variant={viewMode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('manual')}
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Browse Passages
          </Button>
        </div>

        {viewMode === 'random' ? (
          <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              A random passage will be selected to prevent students from practicing the same text.
            </p>
            <Button onClick={handleRandomSelect} size="lg">
              <Shuffle className="h-4 w-4 mr-2" />
              Start Random Screening
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {passages.map((passage) => (
              <div 
                key={passage.id}
                className="p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => onSelectPassage(passage)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{passage.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {passage.genre === 'fiction' ? '📖 Fiction' : '📚 Nonfiction'}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~1 min
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{passage.wordCount} words</p>
                    <p className="text-xs text-muted-foreground">
                      FK Grade: {passage.fleschKincaidGrade.toFixed(1)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {passage.passage.substring(0, 150)}...
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Passage info note */}
        <p className="text-xs text-muted-foreground italic text-center pt-2">
          Passages calibrated to Hasbrouck & Tindal (2017) Oral Reading Fluency Norms
        </p>
      </CardContent>
    </Card>
  );
}
