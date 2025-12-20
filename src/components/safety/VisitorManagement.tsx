import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX, Search, Plus, Clock, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function VisitorManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    purpose: "",
    host_name: ""
  });

  const { data: visitors, isLoading } = useQuery({
    queryKey: ['visitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .order('checked_in_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    }
  });

  const checkInMutation = useMutation({
    mutationFn: async (visitor: typeof newVisitor) => {
      const { data, error } = await supabase
        .from('visitors')
        .insert({
          first_name: visitor.first_name,
          last_name: visitor.last_name || null,
          phone_number: visitor.phone_number || null,
          purpose: visitor.purpose || null,
          host_name: visitor.host_name || null,
          checked_in_at: new Date().toISOString(),
          badge_number: `V-${Date.now().toString().slice(-6)}`,
          is_on_campus: true
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      setShowAddDialog(false);
      setNewVisitor({ first_name: "", last_name: "", phone_number: "", purpose: "", host_name: "" });
      toast({ title: "Visitor Checked In", description: "Visitor has been registered" });
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: async (visitorId: string) => {
      const { error } = await supabase
        .from('visitors')
        .update({ checked_out_at: new Date().toISOString(), is_on_campus: false })
        .eq('id', visitorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast({ title: "Visitor Checked Out" });
    }
  });

  const activeVisitors = visitors?.filter(v => !v.checked_out_at) || [];

  const filteredVisitors = activeVisitors.filter(v => {
    const fullName = `${v.first_name} ${v.last_name || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || v.badge_number?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{activeVisitors.length}</div>
            <div className="text-sm text-muted-foreground">On-Site</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserX className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{visitors?.filter(v => v.checked_out_at).length || 0}</div>
            <div className="text-sm text-muted-foreground">Checked Out</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{visitors?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Active Visitors
            </CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Check In Visitor</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Check In Visitor</DialogTitle>
                  <DialogDescription>Register a new visitor</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input value={newVisitor.first_name} onChange={(e) => setNewVisitor({ ...newVisitor, first_name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={newVisitor.last_name} onChange={(e) => setNewVisitor({ ...newVisitor, last_name: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={newVisitor.phone_number} onChange={(e) => setNewVisitor({ ...newVisitor, phone_number: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Purpose</Label>
                    <Input value={newVisitor.purpose} onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Visiting</Label>
                    <Input value={newVisitor.host_name} onChange={(e) => setNewVisitor({ ...newVisitor, host_name: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button onClick={() => checkInMutation.mutate(newVisitor)} disabled={!newVisitor.first_name || checkInMutation.isPending}>
                    {checkInMutation.isPending ? "..." : "Check In"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filteredVisitors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No active visitors</div>
          ) : (
            <div className="space-y-3">
              {filteredVisitors.map((visitor) => (
                <div key={visitor.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{visitor.first_name} {visitor.last_name}</h4>
                      {visitor.badge_number && <Badge variant="outline">{visitor.badge_number}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {visitor.purpose && <span>{visitor.purpose}</span>}
                      {visitor.host_name && <span> • Visiting: {visitor.host_name}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {format(new Date(visitor.checked_in_at), "h:mm a")}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => checkOutMutation.mutate(visitor.id)}>
                    <UserX className="h-4 w-4 mr-2" />Check Out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-yellow-500 bg-yellow-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="text-sm">During drills, all visitors must be accounted for.</span>
        </CardContent>
      </Card>
    </div>
  );
}