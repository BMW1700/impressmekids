import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Car, 
  UserCheck, 
  AlertTriangle,
  Users,
  Clock
} from "lucide-react";

interface ParentResponse {
  id: string;
  parent_id: string;
  student_id: string;
  response_type: string;
  notes: string | null;
  created_at: string;
  parent_name?: string;
  student_name?: string;
}

interface ParentResponseStatsProps {
  drillSessionId: string;
  totalStudents: number;
}

export function ParentResponseStats({ drillSessionId, totalStudents }: ParentResponseStatsProps) {
  const [responses, setResponses] = useState<ParentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponses();
    subscribeToResponses();
  }, [drillSessionId]);

  const fetchResponses = async () => {
    const { data } = await supabase
      .from("parent_drill_responses")
      .select(`
        *,
        parent:profiles!parent_drill_responses_parent_id_fkey(full_name),
        student:profiles!parent_drill_responses_student_id_fkey(full_name)
      `)
      .eq("drill_session_id", drillSessionId);

    if (data) {
      setResponses(data.map((r: any) => ({
        ...r,
        parent_name: r.parent?.full_name,
        student_name: r.student?.full_name
      })));
    }
    setLoading(false);
  };

  const subscribeToResponses = () => {
    const channel = supabase
      .channel(`parent-responses-${drillSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parent_drill_responses",
          filter: `drill_session_id=eq.${drillSessionId}`
        },
        () => {
          fetchResponses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getResponseIcon = (type: string) => {
    switch (type) {
      case "confirmed_safe": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "en_route": return <Car className="h-4 w-4 text-blue-600" />;
      case "picked_up": return <UserCheck className="h-4 w-4 text-purple-600" />;
      case "needs_help": return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getResponseLabel = (type: string) => {
    switch (type) {
      case "confirmed_safe": return "Confirmed Safe";
      case "en_route": return "En Route";
      case "picked_up": return "Picked Up";
      case "needs_help": return "Needs Help";
      default: return type;
    }
  };

  const getResponseColor = (type: string) => {
    switch (type) {
      case "confirmed_safe": return "bg-green-600";
      case "en_route": return "bg-blue-600";
      case "picked_up": return "bg-purple-600";
      case "needs_help": return "bg-orange-600";
      default: return "bg-muted";
    }
  };

  // Count by response type
  const counts = {
    confirmed_safe: responses.filter(r => r.response_type === "confirmed_safe").length,
    en_route: responses.filter(r => r.response_type === "en_route").length,
    picked_up: responses.filter(r => r.response_type === "picked_up").length,
    needs_help: responses.filter(r => r.response_type === "needs_help").length
  };

  const totalResponses = responses.length;
  const responseRate = totalStudents > 0 ? (totalResponses / totalStudents) * 100 : 0;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Parent Responses
        </h3>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {totalResponses}/{totalStudents} ({responseRate.toFixed(0)}%)
        </Badge>
      </div>

      <Progress value={responseRate} className="h-3 mb-6" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-green-600/10 rounded-lg">
          <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-600">{counts.confirmed_safe}</div>
          <div className="text-xs text-muted-foreground">Confirmed Safe</div>
        </div>
        <div className="text-center p-3 bg-blue-600/10 rounded-lg">
          <Car className="h-6 w-6 text-blue-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-blue-600">{counts.en_route}</div>
          <div className="text-xs text-muted-foreground">En Route</div>
        </div>
        <div className="text-center p-3 bg-purple-600/10 rounded-lg">
          <UserCheck className="h-6 w-6 text-purple-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-purple-600">{counts.picked_up}</div>
          <div className="text-xs text-muted-foreground">Picked Up</div>
        </div>
        <div className="text-center p-3 bg-orange-600/10 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
          <div className="text-2xl font-bold text-orange-600">{counts.needs_help}</div>
          <div className="text-xs text-muted-foreground">Need Help</div>
        </div>
      </div>

      {counts.needs_help > 0 && (
        <div className="mb-4 p-3 bg-orange-600/20 border border-orange-600 rounded-lg">
          <h4 className="font-semibold text-orange-600 flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            Parents Needing Assistance
          </h4>
          <div className="space-y-2">
            {responses
              .filter(r => r.response_type === "needs_help")
              .map(r => (
                <div key={r.id} className="text-sm">
                  <span className="font-medium">{r.parent_name}</span> for{" "}
                  <span className="font-medium">{r.student_name}</span>
                  {r.notes && <p className="text-muted-foreground italic">"{r.notes}"</p>}
                </div>
              ))}
          </div>
        </div>
      )}

      {responses.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Responses</h4>
          {responses.slice(0, 10).map(response => (
            <div key={response.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
              <div className="flex items-center gap-2">
                {getResponseIcon(response.response_type)}
                <span>{response.student_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getResponseColor(response.response_type)}>
                  {getResponseLabel(response.response_type)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(response.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}