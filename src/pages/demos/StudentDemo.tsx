import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Home, Calendar, BookOpen, Users, Bell, GraduationCap, FolderOpen, User, 
  Gamepad2, Shield, Sparkles, BookOpenCheck, ArrowLeft, CheckCircle, Trophy, 
  Target, Flame, Menu, AlertCircle, Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";

const sections = [
  { id: "home", label: "Home", icon: Home, color: "from-violet-500 to-purple-600" },
  { id: "today", label: "Today", icon: Calendar, color: "from-blue-500 to-cyan-500" },
  { id: "courses", label: "Courses", icon: BookOpen, color: "from-emerald-500 to-teal-500" },
  { id: "clubs", label: "Clubs", icon: Users, color: "from-pink-500 to-rose-500" },
  { id: "calendar", label: "Calendar", icon: Calendar, color: "from-amber-500 to-orange-500" },
  { id: "announcements", label: "Announcements", icon: Bell, color: "from-red-500 to-pink-500" },
  { id: "study-games", label: "Study Games", icon: Gamepad2, color: "from-indigo-500 to-violet-500" },
  { id: "aura-reading", label: "AURA Reading", icon: BookOpenCheck, color: "from-amber-500 to-yellow-500" },
  { id: "gradebook", label: "Gradebook", icon: GraduationCap, color: "from-cyan-500 to-blue-500" },
  { id: "directory", label: "Directory", icon: FolderOpen, color: "from-slate-500 to-gray-600" },
  { id: "safety", label: "Safety", icon: Shield, color: "from-green-500 to-emerald-500" },
  { id: "links-resources", label: "Links & Resources", icon: LinkIcon, color: "from-blue-500 to-indigo-500" },
  { id: "account", label: "Account", icon: User, color: "from-purple-500 to-indigo-500" },
];

const DemoSidebar = ({ activeSection, onSectionChange, isSheet = false, onClose }: {
  activeSection: string;
  onSectionChange: (s: string) => void;
  isSheet?: boolean;
  onClose?: () => void;
}) => (
  <aside className={cn(
    "border-r border-border/50 bg-gradient-to-b from-background via-background to-muted/20 h-full relative overflow-hidden",
    isSheet ? "w-full" : "w-72"
  )}>
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 -left-12 w-32 h-32 bg-secondary/5 rounded-full blur-2xl" />
    </div>
    <div className="relative p-6 overflow-y-auto max-h-full">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Dashboard</h2>
            <p className="text-xs text-muted-foreground">Student Portal</p>
          </div>
        </div>
      </div>
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
              onClick={() => { onSectionChange(section.id); onClose?.(); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group",
                isActive
                  ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              style={{ boxShadow: isActive ? `0 8px 24px -8px hsl(var(--primary) / 0.4)` : undefined }}
            >
              <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300", isActive ? "bg-white/20" : "bg-muted/50 group-hover:bg-muted")}>
                <Icon className={cn("h-4 w-4 transition-all duration-300", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
              </div>
              <span className={cn("relative z-10 flex-1 text-left transition-all duration-300", isActive ? "text-white font-semibold" : "")}>{section.label}</span>
              {isActive && <motion.div layoutId="demoActiveIndicator" className="w-2 h-2 rounded-full bg-white/80" transition={{ type: "spring", bounce: 0.3, duration: 0.5 }} />}
            </motion.button>
          );
        })}
      </nav>
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><span className="text-lg">📚</span></div>
          <div className="flex-1"><p className="text-xs font-medium text-foreground">Keep Learning!</p><p className="text-[10px] text-muted-foreground">A new adventure awaits</p></div>
        </div>
      </div>
    </div>
  </aside>
);

// ──────── Section content ────────

const DemoHomeSection = () => (
  <div className="space-y-8 animate-fade-in">
    <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 border border-border/50 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg"><span className="text-2xl">👩‍🎓</span></div>
          <div><p className="text-sm text-muted-foreground font-medium">5th Grade • Room 204</p></div>
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 text-gradient-purple">Good afternoon, Demo Student!</h1>
          <p className="text-lg text-muted-foreground">Here's what's happening today</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: "Assignments", value: "5", circleClass: "icon-circle-sm icon-circle-blue" },
            { icon: CheckCircle, label: "Completed", value: "3", circleClass: "icon-circle-sm icon-circle-green" },
            { icon: Trophy, label: "Games Won", value: "8", circleClass: "icon-circle-sm icon-circle-purple" },
            { icon: Flame, label: "Day Streak", value: "5 🔥", circleClass: "icon-circle-sm icon-circle-orange" },
          ].map((stat) => (
            <Card key={stat.label} variant="glass" className="hover-lift">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={stat.circleClass}><stat.icon className="h-4 w-4 text-white" /></div>
                  <div><div className="text-2xl font-black">{stat.value}</div><div className="text-xs text-muted-foreground font-medium">{stat.label}</div></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <Card variant="glass"><CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Smart Next Action</CardTitle></CardHeader>
        <CardContent><div className="p-4 rounded-xl bg-primary/5 border border-primary/10"><p className="font-medium">Complete "Chapter 5 Reading Comprehension"</p><p className="text-sm text-muted-foreground mt-1">Due tomorrow • ELA • Mrs. Davis's class</p><Button className="mt-3" size="sm">Start Assignment</Button></div></CardContent>
      </Card>
      <Card variant="glass"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Daily Missions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[{ label: "Read for 15 minutes", xp: "+50 XP", done: true }, { label: "Complete 1 assignment", xp: "+100 XP", done: false }, { label: "Play a study game", xp: "+30 XP", done: false }].map((m) => (
            <div key={m.label} className={cn("flex items-center justify-between p-3 rounded-lg border", m.done ? "bg-green-50 border-green-200" : "bg-card border-border")}>
              <div className="flex items-center gap-2">{m.done ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}<span className={cn("text-sm", m.done && "line-through text-muted-foreground")}>{m.label}</span></div>
              <Badge variant="outline" className="text-xs">{m.xp}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>

    <Card variant="glass"><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-red-500" /> Recent Activity</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {["📝 Submitted Science Vocabulary Quiz — scored 95% — 2 hours ago", "🎮 Won Jeopardy 1v1 against classmate — Yesterday", "📖 AURA Reading session — 112 WPM, 94% accuracy — Yesterday", "⭐ Earned 'Bookworm' achievement — 2 days ago"].map((a, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"><p className="text-muted-foreground">{a}</p></div>
        ))}
      </CardContent>
    </Card>
  </div>
);

const DemoTodaySection = () => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="text-3xl font-black text-gradient-purple">Today's Schedule</h2>
    {[
      { time: "8:00 AM", event: "ELA – Mrs. Davis", type: "Class", color: "border-l-primary" },
      { time: "9:30 AM", event: "Math – Mr. Thompson", type: "Class", color: "border-l-blue-500" },
      { time: "11:00 AM", event: "Science Quiz Due", type: "Assignment", color: "border-l-amber-500" },
      { time: "1:00 PM", event: "Reading Practice", type: "Activity", color: "border-l-green-500" },
    ].map((item) => (
      <Card key={item.time} variant="glass" className={cn("border-l-4 hover-lift", item.color)}>
        <CardContent className="p-5 flex items-center justify-between">
          <div><p className="font-semibold">{item.event}</p><p className="text-sm text-muted-foreground">{item.time}</p></div>
          <Badge variant="outline">{item.type}</Badge>
        </CardContent>
      </Card>
    ))}
  </div>
);

const DemoCoursesSection = () => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="text-3xl font-black text-gradient-purple">My Courses</h2>
    <div className="grid md:grid-cols-2 gap-6">
      {[
        { name: "5th Grade ELA", teacher: "Mrs. Davis", students: 28, code: "ELA-2025" },
        { name: "5th Grade Math", teacher: "Mr. Thompson", students: 26, code: "MATH-2025" },
      ].map((c) => (
        <Card key={c.name} variant="glass" className="hover-lift cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"><BookOpen className="h-6 w-6 text-white" /></div>
              <Badge variant="outline" className="text-xs">{c.code}</Badge>
            </div>
            <h3 className="text-xl font-bold mb-1">{c.name}</h3>
            <p className="text-sm text-muted-foreground">{c.teacher} • {c.students} students</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const DemoGamesSection = () => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="text-3xl font-black text-gradient-purple">Study Games</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: "Jeopardy 1v1", desc: "Challenge a classmate to a quiz battle", emoji: "🎯" },
        { name: "Number Maker", desc: "Build equations to reach target numbers", emoji: "🔢" },
        { name: "Name That Animal", desc: "Identify animals from clues", emoji: "🦁" },
        { name: "US States Quiz", desc: "Test your geography knowledge", emoji: "🗺️" },
        { name: "Tug of War", desc: "Answer questions to pull the rope", emoji: "🪢" },
      ].map((g) => (
        <Card key={g.name} variant="glass" className="hover-lift cursor-pointer">
          <CardContent className="p-6 text-center">
            <span className="text-4xl mb-4 block">{g.emoji}</span>
            <h3 className="font-bold text-lg mb-1">{g.name}</h3>
            <p className="text-sm text-muted-foreground">{g.desc}</p>
            <Button size="sm" className="mt-4">Play Now</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const DemoAuraSection = () => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="text-3xl font-black text-gradient-purple">AURA Reading Practice</h2>
    <div className="grid sm:grid-cols-3 gap-4">
      {[{ label: "Words Per Minute", value: "112" }, { label: "Accuracy", value: "94%" }, { label: "Sessions This Week", value: "3" }].map((s) => (
        <Card key={s.label} variant="glass"><CardContent className="p-5 text-center"><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-3xl font-black">{s.value}</p></CardContent></Card>
      ))}
    </div>
    <Card variant="glass">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-primary" /> Today's Passage</h3>
        <div className="bg-muted/30 rounded-xl p-5 text-sm leading-relaxed mb-4 italic">
          "The sun rose slowly over the mountains, casting golden light across the valley below. Birds began their morning songs as a gentle breeze rustled through the tall grass…"
        </div>
        <Button>🎙️ Start Recording</Button>
      </CardContent>
    </Card>
  </div>
);

const DemoGradebookSection = () => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="text-3xl font-black text-gradient-purple">Gradebook</h2>
    <Card variant="glass">
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="text-left p-4 font-medium">Assignment</th><th className="text-left p-4 font-medium">Subject</th><th className="text-left p-4 font-medium">Grade</th><th className="text-left p-4 font-medium">Status</th></tr></thead>
          <tbody>
            {[
              { a: "Chapter 5 Comprehension", s: "ELA", g: "92%", st: "Graded" },
              { a: "Math Word Problems Set 2", s: "Math", g: "88%", st: "Graded" },
              { a: "Science Vocabulary Quiz", s: "Science", g: "95%", st: "Graded" },
              { a: "Chapter 6 Reading", s: "ELA", g: "—", st: "Pending" },
            ].map((r) => (
              <tr key={r.a} className="border-t border-border hover:bg-muted/30">
                <td className="p-4 font-medium">{r.a}</td><td className="p-4">{r.s}</td><td className="p-4 font-bold">{r.g}</td>
                <td className="p-4"><Badge variant={r.st === "Graded" ? "default" : "outline"} className={r.st === "Graded" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>{r.st}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  </div>
);

const DemoGenericSection = ({ title, description }: { title: string; description: string }) => (
  <div className="space-y-6 animate-fade-in">
    <h2 className="text-3xl font-black text-gradient-purple">{title}</h2>
    <Card variant="glass"><CardContent className="p-8 text-center"><p className="text-muted-foreground">{description}</p></CardContent></Card>
  </div>
);

// ──────── Main Component ────────

const StudentDemo = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case "home": return <DemoHomeSection />;
      case "today": return <DemoTodaySection />;
      case "courses": return <DemoCoursesSection />;
      case "study-games": return <DemoGamesSection />;
      case "aura-reading": return <DemoAuraSection />;
      case "gradebook": return <DemoGradebookSection />;
      case "clubs": return <DemoGenericSection title="Clubs" description="Browse and join school clubs. See upcoming club events and activities." />;
      case "calendar": return <DemoGenericSection title="Calendar" description="View your class schedule, assignment due dates, and school events all in one place." />;
      case "announcements": return <DemoGenericSection title="Announcements" description="Stay up to date with teacher announcements and school-wide notifications." />;
      case "directory": return <DemoGenericSection title="Directory" description="Find teachers, classmates, and school staff contact information." />;
      case "safety": return <DemoGenericSection title="Safety" description="Access emergency procedures, report concerns, and view safety alerts." />;
      case "links-resources": return <DemoGenericSection title="Links & Resources" description="Quick access to school resources, learning tools, and helpful links." />;
      case "account": return <DemoGenericSection title="Account" description="Manage your profile, avatar, and account settings." />;
      default: return <DemoHomeSection />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Demo banner */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/demos"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to Demos</Button></Link>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Interactive Student Demo</Badge>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">Click sidebar items to explore each section</p>
      </div>

      <Header />

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <DemoSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>

        {/* Mobile sidebar */}
        <div className="block lg:hidden fixed top-[7.5rem] left-4 z-50">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <button className="p-2.5 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-muted/80 transition-colors">
                <Menu className="h-5 w-5 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <DemoSidebar activeSection={activeSection} onSectionChange={setActiveSection} isSheet onClose={() => setMobileSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default StudentDemo;
