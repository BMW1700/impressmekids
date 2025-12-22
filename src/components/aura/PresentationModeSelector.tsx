import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, Shuffle, MessageSquare, Presentation, Clock, Sparkles } from 'lucide-react';
import { PRESENTATION_PROMPTS, type PresentationPrompt } from '@/lib/presentationAnalysis';

interface PresentationModeSelectorProps {
  onSelectPrompt: (prompt: PresentationPrompt | null, customTopic?: string) => void;
}

export const PresentationModeSelector = ({ onSelectPrompt }: PresentationModeSelectorProps) => {
  const [customTopic, setCustomTopic] = useState('');
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * PRESENTATION_PROMPTS.length);
    onSelectPrompt(PRESENTATION_PROMPTS[randomIndex]);
  };

  const handleFreeStyle = () => {
    onSelectPrompt(null, customTopic || undefined);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'hard': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted';
    }
  };

  const displayedPrompts = showAllPrompts ? PRESENTATION_PROMPTS : PRESENTATION_PROMPTS.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:scale-[1.02] transition-all border-2 hover:border-primary/50"
          onClick={handleFreeStyle}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Free Style</h3>
                <p className="text-sm text-muted-foreground">
                  Present on any topic you choose
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">1-2 minutes recommended</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:scale-[1.02] transition-all border-2 hover:border-primary/50"
          onClick={handleRandomPrompt}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Shuffle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">Random Challenge</h3>
                <p className="text-sm text-muted-foreground">
                  Get a surprise topic to present on
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Great for practice!</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompted Topics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Choose a Topic
          </h3>
          {PRESENTATION_PROMPTS.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllPrompts(!showAllPrompts)}
            >
              {showAllPrompts ? 'Show Less' : `Show All (${PRESENTATION_PROMPTS.length})`}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedPrompts.map((prompt) => (
            <Card
              key={prompt.id}
              className="cursor-pointer hover:scale-[1.01] transition-all hover:border-primary/50"
              onClick={() => onSelectPrompt(prompt)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{prompt.title}</h4>
                  <Badge variant="outline" className={getDifficultyColor(prompt.difficulty)}>
                    {prompt.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {prompt.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span>
                    {Math.floor(prompt.duration / 60)}:{(prompt.duration % 60).toString().padStart(2, '0')} target
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Topic Input */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Or enter your own topic..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customTopic.trim()) {
                  onSelectPrompt(null, customTopic.trim());
                }
              }}
            />
            <Button
              size="sm"
              disabled={!customTopic.trim()}
              onClick={() => onSelectPrompt(null, customTopic.trim())}
            >
              Start
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
