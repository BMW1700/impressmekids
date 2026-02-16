import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Trophy, ClipboardList, Calendar, Star, CheckCircle, Play, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

type DemoTab = "dashboard" | "assignments" | "games" | "reading";

const mockAssignments = [
  { title: "Chapter 5 Reading Comprehension", subject: "ELA", due: "Tomorrow", status: "pending" },
  { title: "Math Word Problems Set 3", subject: "Math", due: "Feb 18", status: "pending" },
  { title: "Science Vocabulary Quiz", subject: "Science", due: "Completed", status: "done" },
];

const mockGames = [
  { name: "Jeopardy 1v1", description: "Challenge a classmate to a quiz battle", icon: "🎯" },
  { name: "Number Maker", description: "Build equations to reach target numbers", icon: "🔢" },
  { name: "Name That Animal", description: "Identify animals from clues", icon: "🦁" },
  { name: "Tug of War", description: "Answer questions to pull the rope", icon: "🪢" },
];

const StudentDemo = () => {
  const [activeTab, setActiveTab] = useState<DemoTab>("dashboard");
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const markDone = (action: string) => {
    if (!completedActions.includes(action)) setCompletedActions([...completedActions, action]);
  };

  const tabs: { id: DemoTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Star className="h-4 w-4" /> },
    { id: "assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
    { id: "games", label: "Games", icon: <Trophy className="h-4 w-4" /> },
    { id: "reading", label: "Reading", icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/demos">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Demos</Button>
          </Link>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">Student Demo</Badge>
        </div>
        <span className="text-sm text-muted-foreground">{completedActions.length}/4 actions explored</span>
      </div>

      {/* Tab nav */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); markDone(tab.id); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Welcome back, Demo Student! 👋</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: "Assignments Due", value: "2", color: "text-amber-600" },
                    { label: "Current Streak", value: "5 days 🔥", color: "text-orange-600" },
                    { label: "Total XP", value: "1,240", color: "text-blue-600" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => { setActiveTab("assignments"); markDone("assignments"); }}>View Assignments <ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" onClick={() => { setActiveTab("games"); markDone("games"); }}>Play Games <ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" onClick={() => { setActiveTab("reading"); markDone("reading"); }}>Practice Reading <ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "assignments" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">My Assignments</h2>
                {mockAssignments.map((a) => (
                  <div key={a.title} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={() => markDone("assignments")}>
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.subject} • Due: {a.due}</p>
                    </div>
                    {a.status === "done" ? (
                      <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Done</Badge>
                    ) : (
                      <Button size="sm">Start <Play className="h-3 w-3 ml-1" /></Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "games" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Educational Games</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {mockGames.map((g) => (
                    <div key={g.name} className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => markDone("games")}>
                      <span className="text-3xl mb-3 block">{g.icon}</span>
                      <h3 className="font-semibold text-lg">{g.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{g.description}</p>
                      <Button size="sm" variant="outline" className="mt-4">Play Now</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reading" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Reading Practice</h2>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-2">📖 Today's Passage</h3>
                  <p className="text-muted-foreground text-sm mb-4">Practice reading aloud to improve fluency. Our AI-powered system tracks your words per minute, accuracy, and expression.</p>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4 text-sm leading-relaxed">
                    "The sun rose slowly over the mountains, casting golden light across the valley below. Birds began their morning songs as a gentle breeze rustled through the tall grass..."
                  </div>
                  <Button onClick={() => markDone("reading")}>🎙️ Start Recording</Button>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[{ label: "Words Per Minute", value: "112" }, { label: "Accuracy", value: "94%" }, { label: "Sessions This Week", value: "3" }].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentDemo;
