import { Home, Calendar, BookOpen, Users, Bell, GraduationCap, FolderOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentDashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: "home", label: "Home", icon: Home },
  { id: "today", label: "Today", icon: Calendar },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "clubs", label: "Clubs & Organizations", icon: Users },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "gradebook", label: "Gradebook", icon: GraduationCap },
  { id: "directory", label: "Directory", icon: FolderOpen },
  { id: "account", label: "Account", icon: User },
];

export const StudentDashboardSidebar = ({
  activeSection,
  onSectionChange,
}: StudentDashboardSidebarProps) => {
  return (
    <aside className="w-60 border-r border-border bg-card h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Dashboard</h2>
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
