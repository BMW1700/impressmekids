import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX, Clock } from "lucide-react";
import { useState } from "react";

interface ParentAccessRequestCardProps {
  id: string;
  parentName: string;
  parentEmail: string;
  studentName: string;
  message?: string;
  status: string;
  createdAt: string;
  onApprove: (id: string) => Promise<void>;
  onDeny: (id: string) => Promise<void>;
}

export const ParentAccessRequestCard = ({ 
  id,
  parentName,
  parentEmail,
  studentName,
  message,
  status,
  createdAt,
  onApprove,
  onDeny
}: ParentAccessRequestCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    try {
      await onDeny(id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="shadow-card hover:shadow-purple transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{parentName}</CardTitle>
            <CardDescription>{parentEmail}</CardDescription>
          </div>
          <Badge 
            variant={status === 'pending' ? 'secondary' : status === 'approved' ? 'default' : 'destructive'}
            className="shrink-0"
          >
            {status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
            {status === 'approved' && <UserCheck className="h-3 w-3 mr-1" />}
            {status === 'denied' && <UserX className="h-3 w-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <CardDescription className="mt-2">
          Requesting access to view <span className="font-medium text-foreground">{studentName}</span>'s progress
        </CardDescription>
        <CardDescription className="text-xs">
          {new Date(createdAt).toLocaleDateString()} at {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Message:</p>
            <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{message}</p>
          </div>
        )}
        
        {status === 'pending' && (
          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Approve Access
            </Button>
            <Button
              onClick={handleDeny}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              <UserX className="h-4 w-4 mr-2" />
              Deny Request
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
