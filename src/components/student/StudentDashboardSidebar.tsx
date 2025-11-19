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
    <aside className="w-64 border-r border-border bg-gradient-to-b from-card to-card/50 h-full">
      <div className="p-5">
        <h2 className="text-xl font-bold mb-6 text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dashboard</h2>
        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-muted hover:to-muted/50 hover:text-foreground hover:scale-102 hover:shadow-md"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-primary"
                )} />
                <span className="relative z-10">{section.label}</span>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
