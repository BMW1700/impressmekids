import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Wrench } from "lucide-react";
import { useClassroomFeatures } from "@/hooks/useClassroomFeatures";
import { TOOLKIT_CATEGORIES, TOOLKIT_FEATURES } from "@/config/toolkitFeatures";
import { cn } from "@/lib/utils";

interface ToolkitSidebarProps {
  classroomId: string;
}

export const ToolkitSidebar = ({ classroomId }: ToolkitSidebarProps) => {
  const { isFeatureEnabled, toggleFeature, isLoading } = useClassroomFeatures(classroomId);

  const getFeaturesByCategory = (categoryId: string) => {
    return TOOLKIT_FEATURES.filter((f) => f.category === categoryId);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="hover:bg-primary/5 hover:border-primary/30">
          <Wrench className="mr-2 h-5 w-5" />
          🧰 Toolkit
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            IMK Teacher Tool Kit
          </SheetTitle>
          <p className="text-muted-foreground text-sm">
            Add or remove tools from your classroom. Enabled tools will appear as tabs.
          </p>
        </SheetHeader>

        <div className="space-y-6">
          {TOOLKIT_CATEGORIES.map((category) => {
            const features = getFeaturesByCategory(category.id);
            if (features.length === 0) return null;

            return (
              <div key={category.id} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {features.map((feature) => {
                    const Icon = feature.icon;
                    const enabled = isFeatureEnabled(feature.id);

                    return (
                      <div
                        key={feature.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                          enabled
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-background hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{feature.name}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => toggleFeature(feature.id)}
                          disabled={isLoading}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
