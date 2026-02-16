import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, ClipboardList, Calendar, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

type DemoTab = "overview" | "gradebook" | "calendar" | "notifications";

const ParentDemo = () => {
  const [activeTab, setActiveTab] = useState<DemoTab>("overview");
  const [selectedChild, setSelectedChild] = useState("Ben");
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const markDone = (action: string) => {
    if (!completedActions.includes(action)) setCompletedActions([...completedActions, action]);
  };

  const tabs: { id: DemoTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <User className="h-4 w-4" /> },
    { id: "gradebook", label: "Gradebook", icon: <ClipboardList className="h-4 w-4" /> },
    { id: "calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/demos"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Demos</Button></Link>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">Parent Demo</Badge>
        </div>
        <span className="text-sm text-muted-foreground">{completedActions.length}/4 actions explored</span>
      </div>

      {/* Child switcher */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 flex gap-2 py-2">
          {["Ben", "Sarah"].map((child) => (
            <button key={child} onClick={() => { setSelectedChild(child); markDone("overview"); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedChild === child ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {child}
            </button>
          ))}
        </div>
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
          <motion.div key={`${activeTab}-${selectedChild}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">{selectedChild}'s Overview</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[{ label: "Overall Grade", value: selectedChild === "Ben" ? "A-" : "B+" }, { label: "Assignments Due", value: selectedChild === "Ben" ? "2" : "1" }, { label: "Reading Level", value: selectedChild === "Ben" ? "5.2" : "4.8" }].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-5">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">📝 Submitted "Chapter 5 Reading Comprehension" – 2 hours ago</p>
                    <p className="text-muted-foreground">🎮 Played Jeopardy 1v1 – Won! – Yesterday</p>
                    <p className="text-muted-foreground">📖 Completed reading practice – 112 WPM – Yesterday</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "gradebook" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{selectedChild}'s Gradebook</h2>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="text-left p-4 font-medium">Assignment</th>
                      <th className="text-left p-4 font-medium">Subject</th>
                      <th className="text-left p-4 font-medium">Grade</th>
                    </tr></thead>
                    <tbody>
                      {[{ a: "Chapter 5 Comprehension", s: "ELA", g: "92%" }, { a: "Math Set 2", s: "Math", g: "88%" }, { a: "Science Quiz", s: "Science", g: "95%" }].map((r) => (
                        <tr key={r.a} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => markDone("gradebook")}>
                          <td className="p-4">{r.a}</td><td className="p-4">{r.s}</td><td className="p-4 font-medium">{r.g}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="space-y-4" onClick={() => markDone("calendar")}>
                <h2 className="text-2xl font-bold">Upcoming Events</h2>
                {[{ d: "Feb 17", t: "Math Set 3 Due", type: "assignment" }, { d: "Feb 18", t: "Parent-Teacher Conference", type: "event" }, { d: "Feb 20", t: "Science Fair", type: "event" }].map((e) => (
                  <div key={e.t} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="text-center min-w-[60px]"><p className="text-xs text-muted-foreground">{e.d.split(" ")[0]}</p><p className="text-xl font-bold">{e.d.split(" ")[1]}</p></div>
                    <div><p className="font-medium">{e.t}</p><Badge variant="outline" className="text-xs mt-1">{e.type}</Badge></div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4" onClick={() => markDone("notifications")}>
                <h2 className="text-2xl font-bold">Notifications</h2>
                {["📢 New announcement from Mrs. Davis: 'Field trip permission slips due Friday'", "📝 Ben received a grade: 92% on Chapter 5 Comprehension", "🔔 Parent-Teacher Conference scheduled for Feb 18"].map((n, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:border-primary/50 transition-colors">
                    <p className="text-sm">{n}</p>
                    <p className="text-xs text-muted-foreground mt-1">{i === 0 ? "1 hour ago" : i === 1 ? "3 hours ago" : "Yesterday"}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ParentDemo;
