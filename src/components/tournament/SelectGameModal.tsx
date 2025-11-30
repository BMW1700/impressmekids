import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Calculator, BookOpen, Brain, Globe, Trophy } from "lucide-react";

interface SelectGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGame: (gameType: string) => void;
}

const games = [
  {
    id: 'jeopardy_duel',
    title: 'TriviaTastic',
    description: 'Challenge students in a fast-paced trivia battle across multiple subjects',
    gradeRange: 'Grades K-12',
    icon: Zap,
    isAvailable: true,
  },
  {
    id: 'math_race',
    title: 'Math Race',
    description: 'Solve math problems faster than opponents. Perfect for arithmetic skills!',
    gradeRange: 'Grades K-8',
    icon: Calculator,
    isAvailable: false,
  },
  {
    id: 'word_builder',
    title: 'Word Builder',
    description: 'Create words and outscore the competition in this vocabulary challenge!',
    gradeRange: 'Grades 1-8',
    icon: BookOpen,
    isAvailable: false,
  },
  {
    id: 'science_sprint',
    title: 'Science Sprint',
    description: 'Race through science questions and learn amazing facts about our world!',
    gradeRange: 'Grades 3-12',
    icon: Brain,
    isAvailable: false,
  },
  {
    id: 'geography_quest',
    title: 'Geography Quest',
    description: 'Explore the world through fun geography challenges and trivia!',
    gradeRange: 'Grades 2-10',
    icon: Globe,
    isAvailable: false,
  },
  {
    id: 'spelling_bee',
    title: 'Spelling Bee',
    description: 'Show off spelling skills in head-to-head spelling competitions!',
    gradeRange: 'Grades 1-8',
    icon: Trophy,
    isAvailable: false,
  },
];

export const SelectGameModal = ({ open, onOpenChange, onSelectGame }: SelectGameModalProps) => {
  const handleGameSelect = (gameType: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    onSelectGame(gameType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select a Game for Tournament</DialogTitle>
          <DialogDescription>
            Choose which game type you'd like to create a tournament for
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <Card 
                key={game.id}
                className={`transition-all duration-300 ${
                  game.isAvailable 
                    ? 'shadow-card hover:shadow-purple hover:scale-105 cursor-pointer' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => handleGameSelect(game.id, game.isAvailable)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-primary">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      {game.gradeRange}
                    </Badge>
                    {!game.isAvailable && (
                      <Badge variant="outline" className="ml-auto">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{game.title}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {game.isAvailable && (
                    <p className="text-sm text-muted-foreground">
                      Click to create a tournament with this game
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
