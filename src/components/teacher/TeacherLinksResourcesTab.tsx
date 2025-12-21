import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Link, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SchoolResource {
  id: string;
  school_id: string;
  name: string;
  url: string;
  schools?: {
    name: string;
  };
}

export const TeacherLinksResourcesTab = () => {
  const { t } = useLanguage();

  const { data: resources, isLoading } = useQuery({
    queryKey: ["teacher-school-resources"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Get the teacher's school_id from their profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", session.user.id)
        .single();

      if (!profile?.school_id) return [];

      // Fetch resources for the teacher's school
      const { data, error } = await supabase
        .from("school_resources")
        .select("*, schools(name)")
        .eq("school_id", profile.school_id)
        .order("name");

      if (error) {
        console.error("Error fetching resources:", error);
        return [];
      }
      return data as SchoolResource[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Links & Resources</h2>
      </div>

      {!resources || resources.length === 0 ? (
        <Card className="p-12 text-center">
          <Link className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Resources Available</h3>
          <p className="text-muted-foreground">
            Your school administrator hasn't added any links or resources yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/50 group-hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-primary" />
                      {resource.name}
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground truncate">
                    {resource.url}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
