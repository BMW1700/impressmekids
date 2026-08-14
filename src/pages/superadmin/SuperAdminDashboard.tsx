import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Baby, GraduationCap, Swords, Volume2, Cloud } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SiteSettingsSection } from "@/components/student/sections/SiteSettingsSection";

const OWNER_EMAIL = "benmaxweiner@gmail.com";

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Home</Link>
          </Button>
          <h1 className="text-3xl font-bold">Super Admin</h1>
        </div>
        <p className="text-muted-foreground">
          Manage worlds, levels, and content across the platform.
        </p>

        {isOwner && (
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Site Access — Private Preview Gate</CardTitle>
              <CardDescription>
                Flip the site blocker on or off instantly. Only visible to you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SiteSettingsSection />
            </CardContent>
          </Card>
        )}


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/super-admin/prek">
            <Card className="hover:border-primary transition-colors h-full">
              <CardHeader>
                <Baby className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Pre-K Worlds</CardTitle>
                <CardDescription>
                  Build cinematic video-and-word levels. Upload videos, add the spoken words, save.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Card className="opacity-60">
            <CardHeader>
              <GraduationCap className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle>K-12 RPG</CardTitle>
              <CardDescription>Coming soon — manage K-5 and 6-12 RPG worlds.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <Swords className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle>Castle Swarm</CardTitle>
              <CardDescription>Coming soon — manage Castle Swarm campaigns.</CardDescription>
            </CardHeader>
          </Card>

          <Link to="/super-admin/benny-voice">
            <Card className="hover:border-primary transition-colors h-full">
              <CardHeader>
                <Volume2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Sir Bookears Voice Prewarm</CardTitle>
                <CardDescription>
                  Pre-cache every word's audio in Sir Bookears' ElevenLabs voice. One credit per word, ever.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/super-admin/r2-migration">
            <Card className="hover:border-primary transition-colors h-full">
              <CardHeader>
                <Cloud className="h-8 w-8 text-primary mb-2" />
                <CardTitle>R2 Migration</CardTitle>
                <CardDescription>
                  Backfill every existing audio/video file to Cloudflare R2. Scan, then run — one time.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/super-admin/rpg-seasons">
            <Card className="hover:border-primary transition-colors h-full">
              <CardHeader>
                <Swords className="h-8 w-8 text-primary mb-2" />
                <CardTitle>RPG Seasons</CardTitle>
                <CardDescription>
                  Create and go live with the next Season Pass — no code deploy required.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
