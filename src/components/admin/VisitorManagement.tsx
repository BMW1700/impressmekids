import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, LogOut, Search, Users, AlertTriangle, Clock, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Visitor {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  email: string | null;
  company_organization: string | null;
  purpose: string;
  host_name: string | null;
  badge_number: string | null;
  checked_in_at: string;
  checked_out_at: string | null;
  is_on_campus: boolean;
}

export function VisitorManagement() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnCampusOnly, setShowOnCampusOnly] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const [newVisitor, setNewVisitor] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    company_organization: "",
    purpose: "",
    host_name: "",
  });

  useEffect(() => {
    fetchVisitors();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("visitors-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visitors" },
        () => fetchVisitors()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showOnCampusOnly]);

  const fetchVisitors = async () => {
    try {
      let query = supabase
        .from("visitors")
        .select("*")
        .order("checked_in_at", { ascending: false });

      if (showOnCampusOnly) {
        query = query.eq("is_on_campus", true);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error("Error fetching visitors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!newVisitor.first_name || !newVisitor.last_name || !newVisitor.purpose) {
      toast.error("Please fill in required fields");
      return;
    }

    setCheckingIn(true);
    try {
      const badgeNumber = `V${Date.now().toString().slice(-6)}`;

      const { error } = await supabase.from("visitors").insert({
        first_name: newVisitor.first_name,
        last_name: newVisitor.last_name,
        phone_number: newVisitor.phone_number || null,
        email: newVisitor.email || null,
        company_organization: newVisitor.company_organization || null,
        purpose: newVisitor.purpose,
        host_name: newVisitor.host_name || null,
        badge_number: badgeNumber,
        is_on_campus: true,
      });

      if (error) throw error;

      toast.success(`Visitor checked in - Badge: ${badgeNumber}`);
      setIsCheckInOpen(false);
      setNewVisitor({
        first_name: "",
        last_name: "",
        phone_number: "",
        email: "",
        company_organization: "",
        purpose: "",
        host_name: "",
      });
      fetchVisitors();
    } catch (error) {
      console.error("Error checking in visitor:", error);
      toast.error("Failed to check in visitor");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (visitorId: string) => {
    try {
      const { error } = await supabase
        .from("visitors")
        .update({
          checked_out_at: new Date().toISOString(),
          is_on_campus: false,
        })
        .eq("id", visitorId);

      if (error) throw error;
      toast.success("Visitor checked out");
      fetchVisitors();
    } catch (error) {
      console.error("Error checking out visitor:", error);
      toast.error("Failed to check out visitor");
    }
  };

  const printBadge = (visitor: Visitor) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor Badge</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .badge { border: 3px solid #333; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { background: #dc2626; color: white; padding: 10px; font-size: 24px; font-weight: bold; }
            .name { font-size: 28px; font-weight: bold; margin: 20px 0; }
            .details { font-size: 14px; color: #666; margin: 10px 0; }
            .badge-number { font-size: 20px; font-weight: bold; margin-top: 20px; }
            .date { font-size: 12px; color: #999; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="badge">
            <div class="header">VISITOR</div>
            <div class="name">${visitor.first_name} ${visitor.last_name}</div>
            <div class="details">${visitor.company_organization || ""}</div>
            <div class="details">Host: ${visitor.host_name || "N/A"}</div>
            <div class="details">Purpose: ${visitor.purpose}</div>
            <div class="badge-number">${visitor.badge_number}</div>
            <div class="date">${format(new Date(visitor.checked_in_at), "MMM dd, yyyy h:mm a")}</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredVisitors = visitors.filter((v) =>
    `${v.first_name} ${v.last_name} ${v.company_organization || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const onCampusCount = visitors.filter((v) => v.is_on_campus).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visitor Management</h2>
          <p className="text-muted-foreground">Track and manage campus visitors</p>
        </div>
        <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Check In Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Visitor Check-In</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={newVisitor.first_name}
                    onChange={(e) => setNewVisitor({ ...newVisitor, first_name: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={newVisitor.last_name}
                    onChange={(e) => setNewVisitor({ ...newVisitor, last_name: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={newVisitor.phone_number}
                  onChange={(e) => setNewVisitor({ ...newVisitor, phone_number: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newVisitor.email}
                  onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>Company/Organization</Label>
                <Input
                  value={newVisitor.company_organization}
                  onChange={(e) => setNewVisitor({ ...newVisitor, company_organization: e.target.value })}
                  placeholder="ABC Company"
                />
              </div>
              <div>
                <Label>Purpose of Visit *</Label>
                <Select
                  value={newVisitor.purpose}
                  onValueChange={(value) => setNewVisitor({ ...newVisitor, purpose: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="parent_visit">Parent Visit</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Host Name</Label>
                <Input
                  value={newVisitor.host_name}
                  onChange={(e) => setNewVisitor({ ...newVisitor, host_name: e.target.value })}
                  placeholder="Who are you visiting?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCheckInOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCheckIn} disabled={checkingIn}>
                {checkingIn ? "Checking In..." : "Check In"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{onCampusCount}</div>
              <div className="text-sm text-muted-foreground">Visitors On Campus</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{visitors.length}</div>
              <div className="text-sm text-muted-foreground">Total Today</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-950">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                During drills, all visitors will be included in the accountability roster
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search visitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showOnCampusOnly ? "default" : "outline"}
          onClick={() => setShowOnCampusOnly(!showOnCampusOnly)}
        >
          {showOnCampusOnly ? "On Campus Only" : "All Visitors"}
        </Button>
      </div>

      {/* Visitors Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Visitor</th>
                <th className="text-left py-3 px-4">Badge</th>
                <th className="text-left py-3 px-4">Purpose</th>
                <th className="text-left py-3 px-4">Host</th>
                <th className="text-left py-3 px-4">Check-In</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map((visitor) => (
                <tr key={visitor.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{visitor.first_name} {visitor.last_name}</div>
                    <div className="text-sm text-muted-foreground">{visitor.company_organization || "—"}</div>
                  </td>
                  <td className="py-3 px-4 font-mono">{visitor.badge_number}</td>
                  <td className="py-3 px-4 capitalize">{visitor.purpose.replace("_", " ")}</td>
                  <td className="py-3 px-4">{visitor.host_name || "—"}</td>
                  <td className="py-3 px-4">
                    {format(new Date(visitor.checked_in_at), "h:mm a")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {visitor.is_on_campus ? (
                      <Badge className="bg-green-500">On Campus</Badge>
                    ) : (
                      <Badge variant="secondary">Checked Out</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => printBadge(visitor)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      {visitor.is_on_campus && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(visitor.id)}
                        >
                          <LogOut className="mr-1 h-4 w-4" />
                          Check Out
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVisitors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No visitors found
          </div>
        )}
      </Card>
    </div>
  );
}
