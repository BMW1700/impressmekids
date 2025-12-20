import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TabItem {
  id: string;
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

// Default order of teacher tabs
const DEFAULT_TEACHER_TAB_ORDER = [
  "syllabus",
  "attendance",
  "students",
  "safety",
  "parent-requests",
  "announcements",
  "assignments",
  "discussions",
  "study",
  "tournaments",
];

export const useTabOrder = (classroomId: string | undefined, isTeacher: boolean) => {
  const [tabOrder, setTabOrder] = useState<string[]>(DEFAULT_TEACHER_TAB_ORDER);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved tab order from database
  useEffect(() => {
    if (!classroomId || !isTeacher) {
      setIsLoading(false);
      return;
    }

    const loadTabOrder = async () => {
      try {
        const { data, error } = await supabase
          .from("classroom_features")
          .select("feature_id, display_order")
          .eq("classroom_id", classroomId)
          .not("display_order", "is", null)
          .order("display_order", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Get ordered feature IDs
          const orderedIds = data.map((f) => f.feature_id);
          // Merge with default order (keep defaults for tabs not in DB)
          const mergedOrder = [
            ...orderedIds,
            ...DEFAULT_TEACHER_TAB_ORDER.filter((id) => !orderedIds.includes(id)),
          ];
          setTabOrder(mergedOrder);
        }
      } catch (error) {
        console.error("Failed to load tab order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTabOrder();
  }, [classroomId, isTeacher]);

  // Save new tab order to database
  const saveTabOrder = useCallback(
    async (newOrder: string[]) => {
      if (!classroomId || !isTeacher) return;

      setTabOrder(newOrder);

      try {
        // Upsert display_order for each tab
        const updates = newOrder.map((featureId, index) => ({
          classroom_id: classroomId,
          feature_id: featureId,
          display_order: index,
          is_enabled: true,
        }));

        for (const update of updates) {
          await supabase
            .from("classroom_features")
            .upsert(update, { onConflict: "classroom_id,feature_id" });
        }
      } catch (error) {
        console.error("Failed to save tab order:", error);
      }
    },
    [classroomId, isTeacher]
  );

  const reorderTabs = useCallback(
    (startIndex: number, endIndex: number) => {
      const newOrder = [...tabOrder];
      const [removed] = newOrder.splice(startIndex, 1);
      newOrder.splice(endIndex, 0, removed);
      saveTabOrder(newOrder);
    },
    [tabOrder, saveTabOrder]
  );

  return {
    tabOrder,
    reorderTabs,
    isLoading,
  };
};
