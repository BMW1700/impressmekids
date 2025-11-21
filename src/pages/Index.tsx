import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ClipboardList, Trophy, Users2, BookOpen, ArrowRight, CheckCircle, GraduationCap, MessageSquare, LayoutDashboard } from "lucide-react";
import { StatsSection } from "@/components/landing/StatsSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { ResearchSection } from "@/components/landing/ResearchSection";
import { Badge } from "@/components/ui/badge";
const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        // User is authenticated, redirect to their dashboard
        const {
          data: profileData
        } = await supabase.rpc('get_user_profile', {
          _user_id: session.user.id
        });
        if (profileData && profileData.length > 0) {
          const userRole = profileData[0].role;
          if (userRole === 'teacher') {
            navigate('/teacher/dashboard');
          } else if (userRole === 'parent') {
            navigate('/parent/dashboard');
          } else if (userRole === 'district_manager') {
            navigate('/district-manager/dashboard');
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
  return <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-24 md:py-32 animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNGgydjJoLTJ2LTJ6bTAtOGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-700">
              Complete Classroom Solution
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 leading-tight">
              Your Complete Platform for <span className="text-secondary">Teaching & Learning</span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-95 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">A collaborative learning platform that empowers teachers, students, and parents to connect, communicate, and inspire academic growth in and beyond the classroom.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary-light text-lg px-8 py-6" asChild>
                <Link to="/auth">
                  Request a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-2 border-white hover:bg-white hover:text-primary text-lg px-8 py-6" asChild>
                <Link to="/auth">
                  Start Free Trial
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>One stop shop for all classrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Privacy-first design</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform that brings together all your classroom tools
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 rounded-xl bg-card border-2 border-border hover:border-primary hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-6">
                <ClipboardList className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Assignment Management</h3>
              <p className="text-muted-foreground">
                Create, publish, and grade assignments with ease. Track submissions and provide detailed feedback to every student
              </p>
            </div>
            
            <div className="text-center p-8 rounded-xl bg-card border-2 border-border hover:border-primary hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-6">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Interactive Games</h3>
              <p className="text-muted-foreground">
                Engage students with educational games, tournaments, and practice exercises that make learning fun and competitive
              </p>
            </div>
            
            <div className="text-center p-8 rounded-xl bg-card border-2 border-border hover:border-primary hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-6">
                <Users2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Communication Hub</h3>
              <p className="text-muted-foreground">
                Connect teachers, students, and parents. Share announcements, manage directories, and keep everyone informed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Every Role
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features tailored for teachers, students, parents, and administrators
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="p-6 rounded-xl bg-card hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-3 rounded-full bg-gradient-primary mb-4">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Teachers</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Create & grade assignments</li>
                <li>• Track student progress</li>
                <li>• Generate AI insights</li>
                <li>• Manage classrooms</li>
                <li>• Schedule events</li>
              </ul>
            </div>
            
            <div className="p-6 rounded-xl bg-card hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-3 rounded-full bg-gradient-primary mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Students</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Complete assignments</li>
                <li>• Play educational games</li>
                <li>• Track your progress</li>
                <li>• Practice reading skills</li>
                <li>• View your calendar</li>
              </ul>
            </div>
            
            <div className="p-6 rounded-xl bg-card hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-3 rounded-full bg-gradient-primary mb-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Parents</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Monitor child progress</li>
                <li>• View assignments</li>
                <li>• Connect with teachers</li>
                <li>• Track schedules</li>
                <li>• Get notifications</li>
              </ul>
            </div>
            
            <div className="p-6 rounded-xl bg-card hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-3 rounded-full bg-gradient-primary mb-4">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Admins</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Manage school users</li>
                <li>• Oversee classrooms</li>
                <li>• Schedule events</li>
                <li>• Handle backups</li>
                <li>• View analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Research & Innovation Section */}
      <ResearchSection />

      {/* Testimonials */}
      <TestimonialSection />

      {/* Trust & Security */}
      <TrustSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Simplify Your Classroom?
            </h2>
            <p className="text-xl mb-8 opacity-95 max-w-2xl mx-auto">
              Join educators using our complete platform to manage assignments, engage students, and drive learning outcomes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary-light text-lg px-8 py-6" asChild>
                <Link to="/auth">
                  Schedule Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6" asChild>
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-75">
              No credit card required • Setup in minutes • Privacy-first platform
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Index;