import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Link, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SchoolResource {
  id: string;
  school_id: string;
  name: string;
  url: string;
  school_name?: string;
}

interface ParentLinksResourcesModalProps {
  open: boolean;
  onClose: () => void;
  childrenSchoolIds: string[];
}

export const ParentLinksResourcesModal = ({
  open,
  onClose,
  childrenSchoolIds,
}: ParentLinksResourcesModalProps) => {
  // Get unique school IDs
  const uniqueSchoolIds = [...new Set(childrenSchoolIds.filter(Boolean))];

  const { data: resources, isLoading } = useQuery({
    queryKey: ["parent-school-resources", uniqueSchoolIds],
    queryFn: async () => {
      if (uniqueSchoolIds.length === 0) return [];

      const { data, error } = await supabase
        .from("school_resources")
        .select("*, schools(name)")
        .in("school_id", uniqueSchoolIds)
        .order("name");

      if (error) {
        console.error("Error fetching resources:", error);
        return [];
      }

      // Map to include school name and deduplicate by id
      const resourceMap = new Map<string, SchoolResource>();
      data?.forEach((r: any) => {
        if (!resourceMap.has(r.id)) {
          resourceMap.set(r.id, {
            id: r.id,
            school_id: r.school_id,
            name: r.name,
            url: r.url,
            school_name: r.schools?.name,
          });
        }
      });

      return Array.from(resourceMap.values());
    },
    enabled: open && uniqueSchoolIds.length > 0,
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Links & Resources
          </DialogTitle>
          <DialogDescription>
            Helpful links and resources from your children's schools
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !resources || resources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No resources available</p>
              <p className="text-sm">Schools haven't added any links yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{resource.name}</span>
                          </div>
                          {resource.school_name && (
                            <p className="text-xs text-muted-foreground ml-6 mt-0.5">
                              {resource.school_name}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
