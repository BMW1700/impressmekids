import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users2, Settings, BarChart3, Shield, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

type DemoTab = "dashboard" | "users" | "classrooms" | "settings";

const mockUsers = [
  { name: "Mrs. Davis", role: "Teacher", status: "Active", classes: 2 },
  { name: "Mr. Thompson", role: "Teacher", status: "Active", classes: 3 },
  { name: "Emma Johnson", role: "Student", status: "Active", classes: 1 },
  { name: "John Parent", role: "Parent", status: "Pending", classes: 0 },
];

const AdminDemo = () => {
  const [activeTab, setActiveTab] = useState<DemoTab>("dashboard");
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const markDone = (action: string) => {
    if (!completedActions.includes(action)) setCompletedActions([...completedActions, action]);
  };

  const tabs: { id: DemoTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "users", label: "Users", icon: <Users2 className="h-4 w-4" /> },
    { id: "classrooms", label: "Classrooms", icon: <Shield className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/demos"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Demos</Button></Link>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">Admin Demo</Badge>
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
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                <div className="grid sm:grid-cols-4 gap-4">
                  {[{ label: "Total Users", value: "156" }, { label: "Teachers", value: "8" }, { label: "Students", value: "124" }, { label: "Parents", value: "24" }].map((s) => (
                    <div key={s.label} className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => markDone("dashboard")}>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-3">Pending Actions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200"><span>1 teacher verification request</span><Button size="sm" variant="outline" onClick={() => { setActiveTab("users"); markDone("users"); }}>Review</Button></div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200"><span>3 parent access requests</span><Button size="sm" variant="outline" onClick={() => { setActiveTab("users"); markDone("users"); }}>Review</Button></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">User Management</h2>
                  <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search users..." className="pl-9" onClick={() => markDone("users")} /></div>
                </div>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr><th className="text-left p-4 font-medium">Name</th><th className="text-left p-4 font-medium">Role</th><th className="text-left p-4 font-medium">Status</th><th className="text-left p-4 font-medium">Classes</th></tr></thead>
                    <tbody>
                      {mockUsers.map((u) => (
                        <tr key={u.name} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => markDone("users")}>
                          <td className="p-4 font-medium">{u.name}</td>
                          <td className="p-4"><Badge variant="outline">{u.role}</Badge></td>
                          <td className="p-4"><Badge className={u.status === "Active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{u.status}</Badge></td>
                          <td className="p-4">{u.classes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "classrooms" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">All Classrooms</h2>
                {["5th Grade ELA – Mrs. Davis", "5th Grade Math – Mr. Thompson", "4th Grade Science – Mrs. Lee"].map((c) => (
                  <div key={c} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={() => markDone("classrooms")}>
                    <div><p className="font-medium">{c}</p><p className="text-sm text-muted-foreground">28 students • 6 assignments</p></div>
                    <Button size="sm" variant="outline">View <ChevronRight className="h-3 w-3 ml-1" /></Button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4" onClick={() => markDone("settings")}>
                <h2 className="text-2xl font-bold">School Settings</h2>
                {["School Information", "Authentication & Security", "Email Notifications", "Data & Backups"].map((s) => (
                  <div key={s} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3"><Settings className="h-5 w-5 text-muted-foreground" /><span className="font-medium">{s}</span></div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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

export default AdminDemo;
