import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Brain, Target, TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
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
  return <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-24 md:py-32 animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNGgydjJoLTJ2LTJ6bTAtOGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-700">
              Revolutionary AI Technology
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 leading-tight">
              AI-Powered Literacy Platform Built for <span className="text-secondary">Measurable Results</span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-95 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">Proprietary machine learning predicts reading outcomes, identifies at-risk students early, and delivers personalized interventions witth scientific precision</p>

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
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Privacy-first design</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Built for K-12 educators</span>
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
              Outcomes That Matter
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI doesn't just measure—it predicts, intervenes, and accelerates learning
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 rounded-xl bg-card border-2 border-border hover:border-primary hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-6">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Predictive Intelligence</h3>
              <p className="text-muted-foreground">
                ML models identify struggling readers weeks before traditional assessments, enabling early intervention when it matters most
              </p>
            </div>
            
            <div className="text-center p-8 rounded-xl bg-card border-2 border-border hover:border-primary hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-6">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Personalized Pathways</h3>
              <p className="text-muted-foreground">
                Q-learning algorithms continuously optimize instruction for each student, prescribing the perfect next exercise every time
              </p>
            </div>
            
            <div className="text-center p-8 rounded-xl bg-card border-2 border-border hover:border-primary hover:shadow-card transition-all duration-300">
              <div className="inline-flex p-4 rounded-full bg-gradient-primary mb-6">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Measurable Impact</h3>
              <p className="text-muted-foreground">
                Real-time dashboards show exactly what's working, tracking progress with precision and actionable insights
              </p>
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
              Ready to Transform Literacy Outcomes?
            </h2>
            <p className="text-xl mb-8 opacity-95 max-w-2xl mx-auto">
              Join educators using AI-powered insights to accelerate reading growth
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