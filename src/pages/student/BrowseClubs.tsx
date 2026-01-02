import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useBrowseClubs, useJoinClubRequest } from "@/hooks/useBrowseClubs";
import { ArrowLeft, Loader2, Search, Users, MapPin, UserPlus, Check, Clock } from "lucide-react";

const BrowseClubs = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clubs, isLoading } = useBrowseClubs(searchQuery);
  const joinClub = useJoinClubRequest();

  const getRequestButton = (club: any) => {
    switch (club.request_status) {
      case "member":
        return (
          <Button variant="secondary" size="sm" disabled>
            <Check className="h-4 w-4 mr-2" />
            Member
          </Button>
        );
      case "pending":
        return (
          <Button variant="outline" size="sm" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
        );
      case "denied":
        return (
          <Button variant="outline" size="sm" disabled>
            Denied
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={() => joinClub.mutate(club.id)}
            disabled={joinClub.isPending}
          >
            {joinClub.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Request to Join
          </Button>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showAuthButtons={false} onSignOut={signOut} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/student/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Browse Clubs</h1>
            <p className="text-muted-foreground">
              Discover clubs and organizations to join
            </p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : clubs && clubs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <Card key={club.id} className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-1">
                          {club.name}
                        </CardTitle>
                        {club.owner_name && (
                          <p className="text-sm text-muted-foreground">
                            by {club.owner_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    {club.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {club.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {club.member_count} member{club.member_count !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {club.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{club.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-3">
                      {getRequestButton(club)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Clubs Found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No clubs match your search. Try a different term."
                  : "No clubs are available yet. Check back later!"}
              </p>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BrowseClubs;
