import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const DEFAULT_TEACHER_TABS = [
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
  "leaderboard",
  "rubrics",
  "ai-insights",
  "behavior",
  "journal",
];

export const useTeacherTabOrder = (classroomId: string) => {
  const queryClient = useQueryClient();

  // Fetch saved tab order from localStorage (could be moved to DB later)
  const getStoredOrder = (): string[] => {
    const stored = localStorage.getItem(`tab-order-${classroomId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_TEACHER_TABS;
      }
    }
    return DEFAULT_TEACHER_TABS;
  };

  const [tabOrder, setTabOrder] = useState<string[]>(getStoredOrder);

  // Save to localStorage whenever order changes
  const saveOrder = (newOrder: string[]) => {
    localStorage.setItem(`tab-order-${classroomId}`, JSON.stringify(newOrder));
    setTabOrder(newOrder);
  };

  // Reorder function for drag and drop
  const reorderTabs = (sourceIndex: number, destinationIndex: number) => {
    const newOrder = Array.from(tabOrder);
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(destinationIndex, 0, removed);
    saveOrder(newOrder);
  };

  // Get ordered tabs based on visibility
  const getOrderedTabs = (visibleTabs: string[]): string[] => {
    // Filter tabOrder to only include visible tabs, maintaining order
    const ordered = tabOrder.filter((tab) => visibleTabs.includes(tab));
    // Add any new tabs that aren't in the saved order
    const newTabs = visibleTabs.filter((tab) => !tabOrder.includes(tab));
    return [...ordered, ...newTabs];
  };

  return {
    tabOrder,
    reorderTabs,
    getOrderedTabs,
  };
};
