import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Default teacher tab order
const DEFAULT_TEACHER_TABS = [
  "syllabus",
  "attendance",
  "students",
  "safety",
  "meeting-requests",
  "announcements",
  "assignments",
  "discussions",
  "study",
  "tournaments",
  "leaderboard",
  "rubrics",
  "ai-insights",
  "behavior",
  "journal",
];

interface UseTabOrderResult {
  orderedTabs: string[];
  isOrganizing: boolean;
  setIsOrganizing: (value: boolean) => void;
  reorderTabs: (newOrder: string[]) => void;
  saveTabOrder: () => Promise<void>;
  cancelOrganizing: () => void;
  isSaving: boolean;
}

export const useTabOrder = (classroomId: string): UseTabOrderResult => {
  const [savedOrder, setSavedOrder] = useState<string[]>(DEFAULT_TEACHER_TABS);
  const [tempOrder, setTempOrder] = useState<string[]>(DEFAULT_TEACHER_TABS);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch saved tab order from database
  useEffect(() => {
    const fetchTabOrder = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id || !classroomId) return;

      const { data, error } = await supabase
        .from("classroom_tab_orders")
        .select("tab_order")
        .eq("classroom_id", classroomId)
        .eq("teacher_id", session.session.user.id)
        .maybeSingle();

      if (!error && data?.tab_order) {
        // Merge saved order with default tabs (in case new tabs were added)
        const savedTabs = data.tab_order as string[];
        const mergedTabs = [
          ...savedTabs,
          ...DEFAULT_TEACHER_TABS.filter((tab) => !savedTabs.includes(tab)),
        ];
        setSavedOrder(mergedTabs);
        setTempOrder(mergedTabs);
      }
    };

    fetchTabOrder();
  }, [classroomId]);

  const reorderTabs = useCallback((newOrder: string[]) => {
    setTempOrder(newOrder);
  }, []);

  const saveTabOrder = useCallback(async () => {
    setIsSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("classroom_tab_orders").upsert(
        {
          classroom_id: classroomId,
          teacher_id: session.session.user.id,
          tab_order: tempOrder,
        },
        {
          onConflict: "classroom_id,teacher_id",
        }
      );

      if (error) throw error;

      setSavedOrder(tempOrder);
      setIsOrganizing(false);
      toast({
        title: "Tab order saved",
        description: "Your tab organization has been saved.",
      });
    } catch (error) {
      console.error("Error saving tab order:", error);
      toast({
        title: "Error",
        description: "Failed to save tab order.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [classroomId, tempOrder, toast]);

  const cancelOrganizing = useCallback(() => {
    setTempOrder(savedOrder);
    setIsOrganizing(false);
  }, [savedOrder]);

  return {
    orderedTabs: isOrganizing ? tempOrder : savedOrder,
    isOrganizing,
    setIsOrganizing,
    reorderTabs,
    saveTabOrder,
    cancelOrganizing,
    isSaving,
  };
};
