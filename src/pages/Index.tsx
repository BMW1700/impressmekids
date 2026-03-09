import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Trophy,
  Users2,
  BookOpen,
  ArrowRight,
  CheckCircle,
  GraduationCap,
  MessageSquare,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { StatsSection } from "@/components/landing/StatsSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { ResearchSection } from "@/components/landing/ResearchSection";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: delay,
      ease: "easeOut" as const
    }
  })
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: delay,
      ease: "easeOut" as const
    }
  })
};

const Index = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hardTimeout = window.setTimeout(() => {
      if (!cancelled) setIsCheckingAuth(false);
    }, 1500);

    const checkAuthAndRedirect = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || cancelled) return;

        const { data: profileData } = await supabase.rpc('get_user_profile', {
          _user_id: session.user.id,
        });

        if (!profileData || profileData.length === 0 || cancelled) return;

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
      } catch {
        // Intentionally swallow here so / never bricks behind a spinner
      } finally {
        if (!cancelled) setIsCheckingAuth(false);
      }
    };

    checkAuthAndRedirect();

    return () => {
      cancelled = true;
      window.clearTimeout(hardTimeout);
    };
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNGgydjJoLTJ2LTJ6bTAtOGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              variants={fadeInScale}
              initial="hidden"
              animate="visible"
              custom={0.1}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-semibold">
                AI-Powered Literacy • Safety • Classroom Management
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0.2}
            >
              Your Complete{" "}
              <span className="text-secondary">AI-Powered Platform</span>
              {" "}for Teaching & Learning
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl lg:text-2xl mb-8 opacity-95 max-w-3xl mx-auto"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0.4}
            >
              AURA uses 4 proprietary ML models to assess reading fluency, predict at-risk students, and deliver targeted interventions — all while students play an RPG adventure. Plus an integrated student safety system no other platform has.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0.6}
            >
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary-light text-lg px-8 py-6" asChild>
                <Link to="/demos">
                  Try Interactive Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-2 border-white hover:bg-white hover:text-primary text-lg px-8 py-6" asChild>
                <Link to="/auth">
                  Get Started
                </Link>
              </Button>
            </motion.div>

            <motion.div 
              className="flex flex-wrap justify-center gap-6 text-sm"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              custom={0.8}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>4 Proprietary ML Models</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>FERPA & COPPA Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Setup in Minutes</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section — concrete proof points */}
      <StatsSection />

      {/* Research & Innovation — differentiator, shown early */}
      <ResearchSection />

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
                Engage students with educational games, tournaments, and an RPG reading campaign that makes literacy practice an adventure
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
                <li>• AI-powered reading assessments</li>
                <li>• Track student progress</li>
                <li>• Manage classrooms</li>
                <li>• Early intervention alerts</li>
              </ul>
            </div>
            
            <div className="p-6 rounded-xl bg-card hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-3 rounded-full bg-gradient-primary mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Students</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• RPG reading adventure</li>
                <li>• Educational games & tournaments</li>
                <li>• Track your progress</li>
                <li>• Practice reading skills</li>
                <li>• Earn XP & rewards</li>
              </ul>
            </div>
            
            <div className="p-6 rounded-xl bg-card hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-3 rounded-full bg-gradient-primary mb-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">For Parents</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Monitor child progress</li>
                <li>• View assignments & grades</li>
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
                <li>• District-wide analytics</li>
                <li>• Safety system oversight</li>
                <li>• Data backups & exports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <TrustSection />

      {/* See It In Action — replaces fake testimonials */}
      <TestimonialSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Replace Expensive Assessments?
            </h2>
            <p className="text-xl mb-8 opacity-95 max-w-2xl mx-auto">
              Join educators using AURA to assess reading fluency, engage students through gaming, and identify at-risk learners — all for free
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary-light text-lg px-8 py-6" asChild>
                <Link to="/demos">
                  Try Interactive Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6" asChild>
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-75">
              Free for up to 30 students • No credit card required • FERPA & COPPA aligned
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
export default Index;
