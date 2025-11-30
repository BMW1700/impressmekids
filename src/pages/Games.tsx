import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GameTile } from "@/components/GameTile";
import { Zap, Trophy, BookOpen, Brain, Calculator, Globe } from "lucide-react";

const Games = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Educational Games Hub 🎮
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from our collection of fun and educational games
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GameTile
              title="TriviaTastic"
              description="Challenge your classmates in a fast-paced trivia battle! Answer questions across multiple subjects."
              gradeRange="Grades K-12"
              path="/games/jeopardy-1v1"
              icon={<Zap className="h-6 w-6 text-white" />}
            />
            <GameTile
              title="Math Race"
              description="Solve math problems faster than your opponent. Perfect for practicing arithmetic skills!"
              gradeRange="Grades K-8"
              path="/games"
              icon={<Calculator className="h-6 w-6 text-white" />}
              isComingSoon
            />
            <GameTile
              title="Word Builder"
              description="Create words and outscore your competition in this vocabulary challenge!"
              gradeRange="Grades 1-8"
              path="/games"
              icon={<BookOpen className="h-6 w-6 text-white" />}
              isComingSoon
            />
            <GameTile
              title="Science Sprint"
              description="Race through science questions and learn amazing facts about our world!"
              gradeRange="Grades 3-12"
              path="/games"
              icon={<Brain className="h-6 w-6 text-white" />}
              isComingSoon
            />
            <GameTile
              title="Geography Quest"
              description="Explore the world through fun geography challenges and trivia!"
              gradeRange="Grades 2-10"
              path="/games"
              icon={<Globe className="h-6 w-6 text-white" />}
              isComingSoon
            />
            <GameTile
              title="Spelling Bee"
              description="Show off your spelling skills in head-to-head spelling competitions!"
              gradeRange="Grades 1-8"
              path="/games"
              icon={<Trophy className="h-6 w-6 text-white" />}
              isComingSoon
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Games;
