import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from "date-fns";
import { CalendarItem } from "@/hooks/useCalendarData";

export const getCalendarMonthDays = (date: Date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let currentDate = calendarStart;

  while (currentDate <= calendarEnd) {
    days.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return days;
};

export const getCategoryColor = (category?: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    quiz: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
    test: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-300 dark:border-red-700" },
    field_trip: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-300 dark:border-green-700" },
    guest_speaker: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700" },
    homework_due: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-300 dark:border-yellow-700" },
    project_presentation: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-300 dark:border-indigo-700" },
    parent_teacher_conference: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", border: "border-pink-300 dark:border-pink-700" },
    holiday: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700" },
    school_break: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
    assembly: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-300 dark:border-cyan-700" },
    testing_day: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
    early_dismissal: { bg: "bg-lime-100 dark:bg-lime-900/30", text: "text-lime-700 dark:text-lime-300", border: "border-lime-300 dark:border-lime-700" },
    parent_event: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-300 dark:border-indigo-700" },
    personal: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-300 dark:border-indigo-700" },
    student_event: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700" },
    other: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", border: "border-gray-300 dark:border-gray-700" },
  };

  return colors[category || "other"] || colors.other;
};

export const getTypeColor = (type: string) => {
  const colors: Record<string, { bg: string; text: string; icon: string }> = {
    class: { bg: "bg-blue-500/30", text: "text-blue-700 dark:text-blue-300", icon: "📚" },
    event: { bg: "bg-green-500/30", text: "text-green-700 dark:text-green-300", icon: "📅" },
    assignment: { bg: "bg-purple-500/30", text: "text-purple-700 dark:text-purple-300", icon: "📝" },
    school_event: { bg: "bg-orange-500/30", text: "text-orange-700 dark:text-orange-300", icon: "🏫" },
  };

  return colors[type] || colors.event;
};

export const formatTime = (time?: string) => {
  if (!time) return "";
  try {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return time;
  }
};

export const getItemsForDate = (items: CalendarItem[], date: Date) => {
  const dateStr = format(date, "yyyy-MM-dd");
  return items.filter(item => item.date === dateStr);
};

export const getCategoryIcon = (category?: string) => {
  const icons: Record<string, string> = {
    quiz: "📊",
    test: "📋",
    field_trip: "🚌",
    guest_speaker: "🎤",
    homework_due: "📓",
    project_presentation: "🎨",
    parent_teacher_conference: "👥",
    holiday: "🎉",
    school_break: "🏖️",
    assembly: "🎭",
    testing_day: "✏️",
    early_dismissal: "🏠",
    picture_day: "📸",
    other: "📌",
  };

  return icons[category || "other"] || icons.other;
};

export const exportToICal = (items: CalendarItem[], userRole: string) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Impress Me Kids//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  items.forEach(item => {
    if (item.isDraft && userRole !== "teacher") return; // Skip drafts for non-teachers

    const dateStr = item.date.replace(/-/g, "");
    const startTime = item.startTime ? item.startTime.replace(/:/g, "") + "00" : "000000";
    const endTime = item.endTime ? item.endTime.replace(/:/g, "") + "00" : "235900";

    lines.push(
      "BEGIN:VEVENT",
      `DTSTART:${dateStr}T${startTime}`,
      `DTEND:${dateStr}T${endTime}`,
      `SUMMARY:${item.title}`,
      item.description ? `DESCRIPTION:${item.description.replace(/\n/g, "\\n")}` : "",
      item.location ? `LOCATION:${item.location}` : "",
      `UID:${item.id}@impressmekids.com`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd")}T${format(new Date(), "HHmmss")}`,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");

  const icalContent = lines.filter(line => line).join("\r\n");
  const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `calendar-${format(new Date(), "yyyy-MM-dd")}.ics`;
  link.click();
  URL.revokeObjectURL(url);
};
