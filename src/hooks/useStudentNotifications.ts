import { useStudentActivityFeed } from "./useStudentActivityFeed";
import { useState, useEffect } from "react";

export const useStudentNotifications = (studentId: string | undefined) => {
  const { data: activities = [], isLoading } = useStudentActivityFeed(studentId);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(() => {
    const stored = localStorage.getItem(`notifications_last_seen_${studentId}`);
    return stored ? parseInt(stored, 10) : Date.now();
  });

  // Calculate unread count based on activities created after last seen
  const unreadCount = activities.filter(
    (activity) => activity.timestamp.getTime() > lastSeenTimestamp
  ).length;

  const markAllAsRead = () => {
    const now = Date.now();
    setLastSeenTimestamp(now);
    if (studentId) {
      localStorage.setItem(`notifications_last_seen_${studentId}`, now.toString());
    }
  };

  return {
    notifications: activities,
    unreadCount,
    isLoading,
    markAllAsRead,
  };
};
