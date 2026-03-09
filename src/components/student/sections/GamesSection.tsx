import { GameTile } from "@/components/GameTile";
import { Zap, Trophy, BookOpen, Brain, Calculator, Globe, Hash, PawPrint, Map, Swords } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const GamesSection = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          {t('games.title')} 🎮
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('games.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GameTile
          title="TriviaTastic"
          description="Challenge your classmates in a fast-paced multiplayer trivia battle! Answer questions across multiple subjects."
          gradeRange="Grades K-12"
          path="/games/jeopardy-1v1"
          icon={<Zap className="h-6 w-6 text-white" />}
        />
        <GameTile
          title="Name that Animal"
          description="Learn letter sounds by identifying the first letter of animal names. Perfect for early readers!"
          gradeRange="Ages 3-6"
          path="/games/name-that-animal"
          icon={<PawPrint className="h-6 w-6 text-white" />}
        />
        <GameTile
          title="Number Maker"
          description="Combine given numbers using math operations to create the target number."
          gradeRange="Grades K-8"
          path="/games/number-maker"
          icon={<Hash className="h-6 w-6 text-white" />}
        />
        <GameTile
          title="U.S. States Map Quiz"
          description="Learn U.S. geography by clicking on states! Test your knowledge of all 50 states."
          gradeRange="Grades 2-8"
          path="/games/us-states-quiz"
          icon={<Map className="h-6 w-6 text-white" />}
        />
        <GameTile
          title="Reading Tug of War"
          description="Battle goblins by reading words aloud! Pull the rope to your side to win this speech-powered showdown."
          gradeRange="Grades K-5"
          path="/games/tug-of-war"
          icon={<Swords className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
};
