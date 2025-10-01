import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const JeopardyGame = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-4">
                <Zap className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Jeopardy Duel
              </h1>
              <p className="text-xl text-muted-foreground">
                Challenge your classmate in an epic trivia showdown!
              </p>
            </div>

            <Card className="shadow-card mb-6">
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Create a Game Room</h3>
                    <p className="text-muted-foreground">
                      Choose your classroom and select a subject for the trivia questions
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Invite Your Opponent</h3>
                    <p className="text-muted-foreground">
                      Share the game code with a classmate to join the duel
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Answer Questions</h3>
                    <p className="text-muted-foreground">
                      Race to buzz in and answer trivia questions correctly to earn points
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Win the Game!</h3>
                    <p className="text-muted-foreground">
                      The player with the most points after all rounds wins the duel
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                <Zap className="mr-2 h-5 w-5" />
                Start a New Game
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Full game implementation coming soon!
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JeopardyGame;
