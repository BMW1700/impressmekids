import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users2, ClipboardList, BarChart3, BookOpen, ChevronRight, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

type DemoTab = "dashboard" | "classrooms" | "assignments" | "analytics";

const mockStudents = [
  { name: "Emma Johnson", grade: "A", reading: 128, trend: "↑" },
  { name: "Liam Martinez", grade: "B+", reading: 105, trend: "↑" },
  { name: "Sophia Chen", grade: "A-", reading: 118, trend: "→" },
  { name: "Noah Williams", grade: "B", reading: 96, trend: "↑" },
];

const TeacherDemo = () => {
  const [activeTab, setActiveTab] = useState<DemoTab>("dashboard");
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const markDone = (action: string) => {
    if (!completedActions.includes(action)) setCompletedActions([...completedActions, action]);
  };

  const tabs: { id: DemoTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "classrooms", label: "Classrooms", icon: <Users2 className="h-4 w-4" /> },
    { id: "assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/demos"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Demos</Button></Link>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Teacher Demo</Badge>
        </div>
        <span className="text-sm text-muted-foreground">{completedActions.length}/4 actions explored</span>
      </div>

      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); markDone(tab.id); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
                <div className="grid sm:grid-cols-4 gap-4">
                  {[{ label: "Students", value: "28" }, { label: "Assignments", value: "12" }, { label: "Pending Grades", value: "5" }, { label: "Class Average", value: "87%" }].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-5">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => { setActiveTab("assignments"); markDone("assignments"); }}><Plus className="h-4 w-4 mr-1" /> Create Assignment</Button>
                    <Button variant="outline" onClick={() => { setActiveTab("classrooms"); markDone("classrooms"); }}>View Classrooms <ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" onClick={() => { setActiveTab("analytics"); markDone("analytics"); }}>View Analytics <ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "classrooms" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">My Classrooms</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {["5th Grade ELA – Period 1", "5th Grade ELA – Period 3"].map((name) => (
                    <div key={name} className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => markDone("classrooms")}>
                      <h3 className="font-semibold text-lg">{name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">28 students • 6 active assignments</p>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" /> View</Button>
                        <Button size="sm" variant="outline">Roster</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "assignments" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Assignments</h2>
                  <Button onClick={() => markDone("assignments")}><Plus className="h-4 w-4 mr-1" /> New Assignment</Button>
                </div>
                {["Chapter 5 Reading Comprehension", "Math Word Problems Set 3", "Science Vocabulary Quiz"].map((title) => (
                  <div key={title} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={() => markDone("assignments")}>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-muted-foreground">18/28 submitted • Due Feb 18</p>
                    </div>
                    <Button size="sm" variant="outline">Grade <ChevronRight className="h-3 w-3 ml-1" /></Button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Student Analytics</h2>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="text-left p-4 font-medium">Student</th>
                      <th className="text-left p-4 font-medium">Grade</th>
                      <th className="text-left p-4 font-medium">WPM</th>
                      <th className="text-left p-4 font-medium">Trend</th>
                    </tr></thead>
                    <tbody>
                      {mockStudents.map((s) => (
                        <tr key={s.name} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => markDone("analytics")}>
                          <td className="p-4 font-medium">{s.name}</td>
                          <td className="p-4">{s.grade}</td>
                          <td className="p-4">{s.reading}</td>
                          <td className="p-4 text-lg">{s.trend}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherDemo;
