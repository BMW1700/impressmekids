import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface RestorationRequest {
  id: string;
  backup_name: string;
  backup_timestamp: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  school_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  tables_requested: string[];
}

const urgencyColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  completed: CheckCircle2,
  cancelled: XCircle,
};

const statusColors = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  completed: 'default',
  cancelled: 'secondary',
} as const;

export const RestorationRequestsList = () => {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['restoration-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_restoration_requests')
        .select('*')
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      return data as RestorationRequest[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Restoration Requests</CardTitle>
          <CardDescription>No restoration requests submitted yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>When you submit a restoration request, it will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restoration Requests</CardTitle>
        <CardDescription>Track the status of your data restoration requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => {
            const StatusIcon = statusIcons[request.status];
            
            return (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-medium">{request.backup_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Requested {format(new Date(request.requested_at), 'PPp')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={statusColors[request.status]} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                    <Badge className={`${urgencyColors[request.urgency]} text-white`}>
                      {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Reason:</span>
                    <p className="text-muted-foreground mt-1">{request.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {request.school_name && (
                      <div>
                        <span className="font-medium">School:</span> {request.school_name}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Contact:</span> {request.contact_email}
                    </div>
                  </div>

                  <div>
                    <span className="font-medium">Tables:</span>{' '}
                    <span className="text-muted-foreground">
                      {request.tables_requested.join(', ')}
                    </span>
                  </div>

                  {request.reviewed_at && (
                    <div className="pt-2 border-t">
                      <div className="font-medium">Review Information</div>
                      <div className="text-muted-foreground">
                        Reviewed {format(new Date(request.reviewed_at), 'PPp')}
                        {request.reviewed_by && ` by ${request.reviewed_by}`}
                      </div>
                      {request.review_notes && (
                        <p className="mt-1 text-muted-foreground italic">
                          "{request.review_notes}"
                        </p>
                      )}
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your request is being reviewed. We'll contact you at {request.contact_email} within 24-48 hours.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
