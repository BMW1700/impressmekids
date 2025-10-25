import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GameTile } from "@/components/GameTile";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Users, Trophy, BookOpen } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is authenticated, redirect to their dashboard
        const { data: profileData } = await supabase
          .rpc('get_user_profile', { _user_id: session.user.id });

        if (profileData && profileData.length > 0) {
          const userRole = profileData[0].role;
          
          if (userRole === 'teacher') {
            navigate('/teacher/dashboard');
          } else if (userRole === 'parent') {
            navigate('/parent/dashboard');
          } else if (userRole === 'district_admin') {
            navigate('/district/dashboard');
          } else if (userRole === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/student/dashboard');
          }
        }
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-20 animate-fade-in">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Learn Through Play! 🎮
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            Educational games that make learning fun and exciting for kids
          </p>
          <div className="flex gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary-light" asChild>
              <Link to="/auth">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20" asChild>
              <Link to="/games">Explore Games</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Kids Love It
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 hover:scale-[1.05] transition-transform duration-200">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast-Paced Fun</h3>
              <p className="text-muted-foreground">
                Exciting 1v1 games that keep students engaged and motivated
              </p>
            </div>
            <div className="text-center p-6 hover:scale-[1.05] transition-transform duration-200">
              <div className="inline-flex p-4 rounded-full bg-gradient-secondary mb-4">
                <BookOpen className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Educational Content</h3>
              <p className="text-muted-foreground">
                Curriculum-aligned questions across Math, Science, English & more
              </p>
            </div>
            <div className="text-center p-6 hover:scale-[1.05] transition-transform duration-200">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Teachers and students can see stats and celebrate achievements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Games Hub Preview */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Available Games
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from our growing collection of educational games
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <GameTile
              title="Jeopardy Duel"
              description="Challenge your classmates in a fast-paced trivia battle!"
              gradeRange="Grades 3-6"
              path="/games/jeopardy-1v1"
              icon={<Zap className="h-6 w-6 text-white" />}
            />
            <GameTile
              title="Math Race"
              description="Solve problems faster than your opponent to win!"
              gradeRange="Grades 2-5"
              path="/games"
              icon={<Trophy className="h-6 w-6 text-white" />}
              isComingSoon
            />
            <GameTile
              title="Word Builder"
              description="Create words and outscore your competition!"
              gradeRange="Grades 3-6"
              path="/games"
              icon={<BookOpen className="h-6 w-6 text-white" />}
              isComingSoon
            />
          </div>

          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link to="/games">View All Games</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <Users className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join teachers and students who are making learning fun!
          </p>
          <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary-light" asChild>
            <Link to="/auth">Start Playing Now</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;