import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingAction {
  id: string;
  type: "attendance_mark" | "visitor_checkout" | "drill_update";
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = "drill_offline_db";
const STORE_NAME = "pending_actions";

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function addPendingAction(action: PendingAction): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(action);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getPendingActions(): Promise<PendingAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingAction(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Changes will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check for pending actions on mount
    checkPendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkPendingCount = async () => {
    try {
      const actions = await getPendingActions();
      setPendingCount(actions.length);
    } catch (error) {
      console.error("Error checking pending count:", error);
    }
  };

  const syncPendingActions = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      const actions = await getPendingActions();
      if (actions.length === 0) {
        setIsSyncing(false);
        return;
      }

      toast.info(`Syncing ${actions.length} pending action(s)...`);

      for (const action of actions) {
        try {
          await processAction(action);
          await removePendingAction(action.id);
        } catch (error) {
          console.error(`Error syncing action ${action.id}:`, error);
          
          // Update retry count
          if (action.retryCount < 3) {
            await addPendingAction({ ...action, retryCount: action.retryCount + 1 });
          } else {
            await removePendingAction(action.id);
            toast.error(`Failed to sync action after 3 retries`);
          }
        }
      }

      await checkPendingCount();
      toast.success("All changes synced successfully");
    } catch (error) {
      console.error("Error syncing pending actions:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const processAction = async (action: PendingAction) => {
    switch (action.type) {
      case "attendance_mark":
        const { drill_attendance_id, status, marked_by } = action.data as {
          drill_attendance_id: string;
          status: string;
          marked_by: string;
        };
        await supabase
          .from("drill_attendance")
          .update({
            status,
            marked_at: new Date(action.timestamp).toISOString(),
            marked_by,
          })
          .eq("id", drill_attendance_id);
        break;

      case "visitor_checkout":
        const { visitor_id } = action.data as { visitor_id: string };
        await supabase
          .from("visitors")
          .update({
            checked_out_at: new Date(action.timestamp).toISOString(),
            is_on_campus: false,
          })
          .eq("id", visitor_id);
        break;

      case "drill_update":
        const { session_id, updates } = action.data as {
          session_id: string;
          updates: Record<string, unknown>;
        };
        await supabase
          .from("drill_sessions")
          .update(updates)
          .eq("id", session_id);
        break;
    }
  };

  const queueAction = useCallback(async (
    type: PendingAction["type"],
    data: Record<string, unknown>
  ): Promise<boolean> => {
    const action: PendingAction = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    if (navigator.onLine) {
      // Try to process immediately
      try {
        await processAction(action);
        return true;
      } catch (error) {
        console.error("Online action failed, queuing for retry:", error);
        await addPendingAction(action);
        await checkPendingCount();
        return false;
      }
    } else {
      // Queue for later
      await addPendingAction(action);
      await checkPendingCount();
      toast.info("Action saved offline. Will sync when online.");
      return false;
    }
  }, []);

  const markAttendanceOffline = useCallback(async (
    drillAttendanceId: string,
    status: string,
    markedBy: string
  ): Promise<boolean> => {
    return queueAction("attendance_mark", {
      drill_attendance_id: drillAttendanceId,
      status,
      marked_by: markedBy,
    });
  }, [queueAction]);

  const checkoutVisitorOffline = useCallback(async (visitorId: string): Promise<boolean> => {
    return queueAction("visitor_checkout", { visitor_id: visitorId });
  }, [queueAction]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncPendingActions,
    markAttendanceOffline,
    checkoutVisitorOffline,
    queueAction,
  };
}
