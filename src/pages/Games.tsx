import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GameTile } from "@/components/GameTile";
import { Button } from "@/components/ui/button";
import { Zap, Hash, PawPrint, Map, Home, Swords } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Games = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dashboardPath, setDashboardPath] = useState("/");

  useEffect(() => {
    const getDashboardPath = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDashboardPath("/");
        return;
      }

      const { data: profileResult } = await supabase.rpc('get_user_profile', { 
        _user_id: session.user.id 
      });

      if (profileResult && profileResult.length > 0) {
        const role = profileResult[0].role;
        switch (role) {
          case 'teacher': setDashboardPath('/teacher/dashboard'); break;
          case 'student': setDashboardPath('/student/dashboard'); break;
          case 'admin': setDashboardPath('/admin/dashboard'); break;
          case 'parent': setDashboardPath('/parent/dashboard'); break;
          case 'district_manager': setDashboardPath('/district-manager/dashboard'); break;
          default: setDashboardPath('/');
        }
      }
    };

    getDashboardPath();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(dashboardPath)}
            className="mb-4"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('games.title')} 🎮
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
      </main>

      <Footer />
    </div>
  );
};

export default Games;
