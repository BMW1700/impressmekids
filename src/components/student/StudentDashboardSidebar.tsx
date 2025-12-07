import { Home, Calendar, BookOpen, Users, Bell, GraduationCap, FolderOpen, User, Gamepad2, Shield, Sparkles, BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StudentDashboardSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onNavigateToGames?: () => void;
  onNavigateToAuraReading?: () => void;
}

const sections = [
  { id: "home", label: "Home", icon: Home, color: "from-violet-500 to-purple-600" },
  { id: "today", label: "Today", icon: Calendar, color: "from-blue-500 to-cyan-500" },
  { id: "courses", label: "Courses", icon: BookOpen, color: "from-emerald-500 to-teal-500" },
  { id: "clubs", label: "Clubs & Organizations", icon: Users, color: "from-pink-500 to-rose-500" },
  { id: "calendar", label: "Calendar", icon: Calendar, color: "from-amber-500 to-orange-500" },
  { id: "announcements", label: "Announcements", icon: Bell, color: "from-red-500 to-pink-500" },
  { id: "study-games", label: "Study Games", icon: Gamepad2, isExternal: true, color: "from-indigo-500 to-violet-500" },
  { id: "aura-reading", label: "Aura Reading", icon: BookOpenCheck, isExternal: true, color: "from-amber-500 to-yellow-500" },
  { id: "gradebook", label: "Gradebook", icon: GraduationCap, color: "from-cyan-500 to-blue-500" },
  { id: "directory", label: "Directory", icon: FolderOpen, color: "from-slate-500 to-gray-600" },
  { id: "safety", label: "Safety", icon: Shield, color: "from-green-500 to-emerald-500" },
  { id: "account", label: "Account", icon: User, color: "from-purple-500 to-indigo-500" },
];

export const StudentDashboardSidebar = ({
  activeSection,
  onSectionChange,
  onNavigateToGames,
  onNavigateToAuraReading,
}: StudentDashboardSidebarProps) => {
  return (
    <aside className="w-72 border-r border-border/50 bg-gradient-to-b from-background via-background to-muted/20 h-full relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-12 w-32 h-32 bg-secondary/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-transparent rounded-xl blur-sm -z-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Dashboard
              </h2>
              <p className="text-xs text-muted-foreground">Student Portal</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1.5">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                onClick={() => {
                  if (section.id === 'study-games' && onNavigateToGames) {
                    onNavigateToGames();
                  } else if (section.id === 'aura-reading' && onNavigateToAuraReading) {
                    onNavigateToAuraReading();
                  } else {
                    onSectionChange(section.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group",
                  isActive
                    ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                style={{
                  boxShadow: isActive ? `0 8px 24px -8px hsl(var(--primary) / 0.4)` : undefined
                }}
              >
                {/* Icon container */}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                  isActive 
                    ? "bg-white/20" 
                    : "bg-muted/50 group-hover:bg-muted"
                )}>
                  <Icon className={cn(
                    "h-4 w-4 transition-all duration-300",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                </div>
                
                {/* Label */}
                <span className={cn(
                  "relative z-10 flex-1 text-left transition-all duration-300",
                  isActive ? "text-white font-semibold" : ""
                )}>
                  {section.label}
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-2 h-2 rounded-full bg-white/80"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                  />
                )}
                
                {/* Hover glow effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </motion.button>
            );
          })}
        </nav>
        
        {/* Bottom decorative element */}
        <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-lg">📚</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Keep Learning!</p>
              <p className="text-[10px] text-muted-foreground">Every day is a new adventure</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
