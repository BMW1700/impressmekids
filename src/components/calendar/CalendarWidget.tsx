import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";
import { useCalendarData } from "@/hooks/useCalendarData";
import { getCalendarMonthDays, getItemsForDate, getTypeColor } from "@/lib/calendarUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarWidgetProps {
  userId: string;
  userRole: "student" | "teacher" | "admin" | "parent";
  childId?: string;
}

export const CalendarWidget = ({ userId, userRole, childId }: CalendarWidgetProps) => {
  const navigate = useNavigate();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const { data: items = [], isLoading } = useCalendarData({
    startDate: monthStart,
    endDate: monthEnd,
    userId,
    userRole,
    childId,
  });

  const days = getCalendarMonthDays(today);
  const upcomingItems = items
    .filter(item => new Date(item.date) >= today && !item.isDraft)
    .slice(0, 5);

  const urgentCount = items.filter(item => {
    const itemDate = new Date(item.date);
    const hoursUntil = (itemDate.getTime() - today.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 48 && !item.isDraft;
  }).length;

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    navigate(`/calendar?date=${dateStr}`);
  };

  // Keyboard navigation for calendar widget
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedDayIndex === null || !calendarRef.current) return;
      
      let newIndex = focusedDayIndex;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newIndex = Math.max(0, focusedDayIndex - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newIndex = Math.min(days.length - 1, focusedDayIndex + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          newIndex = Math.max(0, focusedDayIndex - 7);
          break;
        case "ArrowDown":
          e.preventDefault();
          newIndex = Math.min(days.length - 1, focusedDayIndex + 7);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleDayClick(days[focusedDayIndex]);
          return;
        case "Escape":
          setFocusedDayIndex(null);
          return;
        default:
          return;
      }

      setFocusedDayIndex(newIndex);
    };

    if (focusedDayIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [focusedDayIndex, days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow border shadow-sm bg-card/80 backdrop-blur-sm" onClick={() => navigate("/calendar")}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </div>
          {urgentCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {urgentCount} Due Soon
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini Calendar */}
        <div 
          className="grid grid-cols-7 gap-1 text-center text-xs" 
          ref={calendarRef}
          role="grid"
          aria-label="Mini calendar"
        >
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="font-semibold text-muted-foreground py-1" role="columnheader">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dayItems = getItemsForDate(items, day);
            const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
            const isCurrentMonth = format(day, "M") === format(today, "M");
            const hasRecentlyPosted = dayItems.some(item => item.recentlyPosted);
            const isFocused = focusedDayIndex === i;

            return (
              <div
                key={i}
                tabIndex={0}
                role="gridcell"
                aria-label={`${format(day, "MMMM d")}, ${dayItems.length} items`}
                aria-selected={isFocused}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayClick(day);
                }}
                onFocus={() => setFocusedDayIndex(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDayClick(day);
                  }
                }}
                className={`
                  relative p-1 rounded-md cursor-pointer hover:bg-accent transition-colors
                  ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                  ${!isCurrentMonth ? "text-muted-foreground/40" : ""}
                  ${dayItems.length > 0 && !isToday ? "font-semibold" : ""}
                  ${isFocused ? "ring-2 ring-primary ring-offset-1" : ""}
                `}
              >
                {format(day, "d")}
                {dayItems.length > 0 && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    {dayItems.slice(0, 3).map((item, idx) => {
                      const color = getTypeColor(item.type);
                      return (
                        <div
                          key={idx}
                          className={`w-1 h-1 rounded-full ${color.bg}`}
                          title={item.title}
                        />
                      );
                    })}
                  </div>
                )}
                {hasRecentlyPosted && (
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Upcoming Events */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming
          </h4>
          <div className="space-y-1.5">
            {upcomingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            ) : (
              upcomingItems.map((item) => {
                const typeColor = getTypeColor(item.type);
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.title}, ${item.type}, ${format(new Date(item.date), "MMMM d")}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/calendar?date=${format(new Date(item.date), "yyyy-MM-dd")}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/calendar?date=${format(new Date(item.date), "yyyy-MM-dd")}`);
                      }
                    }}
                    className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-accent cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  >
                    <span className="text-lg">{typeColor.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.date), "MMM d")}
                        {item.recentlyPosted && (
                          <Badge variant="outline" className="ml-2 text-xs">New</Badge>
                        )}
                      </p>
                    </div>
                    {item.isSubmitted && (
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Click to view full calendar
        </p>
      </CardContent>
    </Card>
  );
};
