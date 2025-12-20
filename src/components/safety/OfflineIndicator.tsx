import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  className?: string;
  showSyncButton?: boolean;
}

export function OfflineIndicator({ className, showSyncButton = true }: OfflineIndicatorProps) {
  const { isOnline, pendingCount, isSyncing, syncPendingActions } = useOfflineSync();
  const location = useLocation();
  
  // Hide on landing page
  if (location.pathname === "/") {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isOnline ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </Badge>
      ) : (
        <Badge variant="destructive" className="animate-pulse">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}

      {pendingCount > 0 && (
        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
          <Cloud className="h-3 w-3 mr-1" />
          {pendingCount} pending
        </Badge>
      )}

      {showSyncButton && pendingCount > 0 && isOnline && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => syncPendingActions()}
          disabled={isSyncing}
          className="h-7"
        >
          <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
        </Button>
      )}
    </div>
  );
}
