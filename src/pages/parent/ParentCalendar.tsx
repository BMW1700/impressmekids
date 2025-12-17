import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Printer, Search, Filter, Loader2, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useParentCalendarData } from "@/hooks/useParentCalendarData";
import { getCalendarMonthDays, getItemsForDate, getCategoryColor, getTypeColor, formatTime, getCategoryIcon, exportToICal } from "@/lib/calendarUtils";
import { CalendarItemDetailModal } from "@/components/calendar/CalendarItemDetailModal";
import { ParentCreateEventModal } from "@/components/parent/ParentCreateEventModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getStudentColor, getParentColor } from "@/lib/parentCalendarColors";
import { useToast } from "@/hooks/use-toast";

export default function ParentCalendar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(undefined);
  const [parentId, setParentId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    events: true,
    assignments: true,
    schoolEvents: true,
  });
  const [focusedDateIndex, setFocusedDateIndex] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [deleteEvent, setDeleteEvent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const calendarGridRef = useRef<HTMLDivElement>(null);

  // Check authentication
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.rpc("get_user_profile", {
        _user_id: session.user.id,
      });
      return data?.[0];
    },
    enabled: !!session?.user?.id,
  });

  // Get parent account
  const { data: parentAccount } = useQuery({
    queryKey: ["parent-account", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .rpc("get_parent_account", { _user_id: session.user.id });
      return data?.[0];
    },
    enabled: !!session?.user?.id && profile?.role === "parent",
  });

  // Get approved children
  const { data: childrenLinks = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["parent-children", parentAccount?.id],
    queryFn: async () => {
      if (!parentAccount?.id) return [];
      const { data } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_id", parentAccount.id)
        .eq("approved", true);
      return data || [];
    },
    enabled: !!parentAccount?.id,
  });

  // Fetch profile details for children
  const { data: children = [] } = useQuery({
    queryKey: ["children-profiles", childrenLinks],
    queryFn: async () => {
      if (!childrenLinks || childrenLinks.length === 0) return [];
      const studentIds = childrenLinks.map(link => link.student_id);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);
      return data || [];
    },
    enabled: childrenLinks && childrenLinks.length > 0,
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate("/auth");
    }
    if (profile && profile.role !== "parent") {
      navigate("/");
    }
    if (parentAccount) {
      setParentId(parentAccount.id);
    }
  }, [session, sessionLoading, profile, parentAccount, navigate]);

  // Set first child as default if available
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const getDateRange = () => {
    switch (view) {
      case "day":
        return { start: currentDate, end: currentDate };
      case "week":
        return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
      case "month":
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      case "list":
        return { start: currentDate, end: addMonths(currentDate, 3) };
      default:
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  };

  const dateRange = getDateRange();

  const { data: items = [], isLoading: calendarLoading, refetch } = useParentCalendarData({
    startDate: dateRange.start,
    endDate: dateRange.end,
    parentId: parentId || "",
    childId: selectedChildId,
  });

  // Get event color based on type and student
  const getEventColor = (item: any) => {
    // Parent-created events use green to match the "Events" filter button
    if (item.type === "parent_personal" || item.type === "parent_student") {
      return getTypeColor("event"); // Green color for events
    }
    // Default for other event types (assignments, school events, etc.)
    return getTypeColor(item.type);
  };

  const handleEdit = (item: any) => {
    setEditEvent({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      studentId: item.studentId,
    });
    setSelectedItem(null);
    setShowCreateModal(true);
  };

  const handleDelete = (item: any) => {
    setDeleteEvent(item);
    setSelectedItem(null);
  };

  const confirmDelete = async () => {
    if (!deleteEvent) return;

    setIsDeleting(true);
    try {
      const table = deleteEvent.type === "parent_personal"
        ? "parent_personal_events"
        : "parent_student_events";

      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", deleteEvent.id);

      if (error) throw error;

      toast({
        title: "Event Deleted",
        description: "The event has been removed from your calendar.",
      });

      refetch();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteEvent(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!filters.events && (item.type === "event" || item.type === "parent_personal" || item.type === "parent_student")) return false;
    if (!filters.assignments && item.type === "assignment") return false;
    if (!filters.schoolEvents && item.type === "school_event") return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const navigateDate = (direction: "prev" | "next") => {
    switch (view) {
      case "day":
        setCurrentDate(direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(direction === "next" ? addDays(currentDate, 7) : subDays(currentDate, 7));
        break;
      case "month":
        setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        break;
    }
  };

  const handleExport = () => {
    exportToICal(filteredItems, "parent");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== "month" || focusedDateIndex === null) return;
      
      const days = getCalendarMonthDays(currentDate);
      let newIndex = focusedDateIndex;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newIndex = Math.max(0, focusedDateIndex - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newIndex = Math.min(days.length - 1, focusedDateIndex + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          newIndex = Math.max(0, focusedDateIndex - 7);
          break;
        case "ArrowDown":
          e.preventDefault();
          newIndex = Math.min(days.length - 1, focusedDateIndex + 7);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          const dayItems = getItemsForDate(filteredItems, days[focusedDateIndex]);
          if (dayItems.length > 0) {
            setSelectedItem(dayItems[0]);
          }
          break;
        case "Escape":
          setFocusedDateIndex(null);
          break;
        default:
          return;
      }

      setFocusedDateIndex(newIndex);
    };

    if (focusedDateIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [focusedDateIndex, view, currentDate, filteredItems]);

  const renderMonthView = () => {
    const days = getCalendarMonthDays(currentDate);
    const today = new Date();

    return (
      <div 
        className="grid grid-cols-7 gap-3"
        ref={calendarGridRef}
        role="grid"
        aria-label="Parent calendar month view"
      >
        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
          <div key={day} className="text-center font-medium text-xs text-muted-foreground/70 py-3 tracking-wider uppercase" role="columnheader">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          const dayItems = getItemsForDate(filteredItems, day);
          const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
          const isCurrentMonth = format(day, "M") === format(currentDate, "M");
          const isFocused = focusedDateIndex === i;

          return (
            <div
              key={i}
              tabIndex={0}
              role="gridcell"
              aria-label={`${format(day, "MMMM d, yyyy")}, ${dayItems.length} items`}
              aria-selected={isFocused}
              onClick={() => {
                setFocusedDateIndex(i);
                if (dayItems.length > 0) {
                  setSelectedItem(dayItems[0]);
                }
              }}
              onFocus={() => setFocusedDateIndex(i)}
              className={`
                group min-h-28 p-3 rounded-2xl cursor-pointer transition-all duration-300
                backdrop-blur-sm border
                ${!isCurrentMonth ? "opacity-30" : ""}
                ${isCurrentMonth ? "bg-card/50 border-white/10" : "bg-muted/10 border-transparent"}
                ${isToday ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary/40 shadow-glow-primary" : ""}
                ${isFocused ? "ring-2 ring-primary ring-offset-2 shadow-lg" : ""}
                hover:shadow-glass-md hover:scale-[1.02] hover:bg-card/70
              `}
            >
              <div className={`text-sm font-semibold mb-2 flex items-center justify-between ${isToday ? "text-primary animate-pulse-luxury" : "text-foreground"}`}>
                <span>{format(day, "d")}</span>
                {isToday && <span className="w-2 h-2 rounded-full bg-primary animate-pulse-luxury"></span>}
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => {
                  const eventColor = getEventColor(item);

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.title}, ${item.type}, ${format(day, "MMMM d")}`}
                      onClick={() => setSelectedItem(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedItem(item);
                        }
                      }}
                      className={`text-xs p-1 rounded truncate ${eventColor.bg} ${eventColor.text} border ${eventColor.border} hover:opacity-80 focus:ring-2 focus:ring-primary focus:ring-offset-1`}
                    >
                      <span className="mr-1">{getCategoryIcon(item.category)}</span>
                      {item.title}
                      {item.type === "parent_student" && item.studentName && (
                        <span className="text-[10px] ml-1 opacity-70">({item.studentName})</span>
                      )}
                    </div>
                  );
                })}
                {dayItems.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const groupedItems = filteredItems.reduce((acc, item) => {
      const dateKey = item.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, typeof filteredItems>);

    return (
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([date, dayItems]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayItems.map((item) => {
                const typeColor = getTypeColor(item.type);

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.title}, ${item.type}, ${format(new Date(item.date), "MMMM d, yyyy")}`}
                    onClick={() => setSelectedItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedItem(item);
                      }
                    }}
                    className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow border ${typeColor.border} focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getCategoryIcon(item.category)}</span>
                          <h4 className="font-semibold">{item.title}</h4>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          {item.startTime && <span>⏰ {formatTime(item.startTime)}</span>}
                          {item.location && <span>📍 {item.location}</span>}
                          {item.classroomName && <span>📚 {item.classroomName}</span>}
                        </div>
                      </div>
                      <Badge className={typeColor.bg}>{item.type}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
        {Object.keys(groupedItems).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No items found
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (sessionLoading || childrenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onSignOut={handleSignOut} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                No Children Linked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You need to link a student to view their calendar.
              </p>
              <Button onClick={() => navigate("/parent/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSignOut={handleSignOut} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-5xl font-luxury font-bold bg-clip-text text-transparent animate-fade-in" style={{ backgroundImage: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))' }}>
              Calendar
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">View your child's schedule and events</p>
          </div>

          <div className="relative p-8 rounded-3xl backdrop-blur-xl bg-gradient-mesh-light border-2 border-white/30 shadow-glass-lg">
            <div className="flex flex-col gap-6">
              {children.length > 1 && (
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger className="w-full md:w-64 bg-white/60 dark:bg-black/40 backdrop-blur-sm border border-white/20">
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate('prev')}
                  className="rounded-full hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-sm border border-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-4xl font-luxury font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate('next')}
                  className="rounded-full hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-sm border border-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 items-center justify-center">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-full px-6 py-2 bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, events: !prev.events }))}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm border-2",
                    filters.events 
                      ? "bg-green-500/30 text-green-700 dark:text-green-300 border-green-400/50 shadow-md" 
                      : "bg-white/40 text-muted-foreground border-white/30 hover:bg-white/60"
                  )}
                >
                  Events
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, assignments: !prev.assignments }))}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm border-2",
                    filters.assignments 
                      ? "bg-purple-500/30 text-purple-700 dark:text-purple-300 border-purple-400/50 shadow-md" 
                      : "bg-white/40 text-muted-foreground border-white/30 hover:bg-white/60"
                  )}
                >
                  Assignments
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, schoolEvents: !prev.schoolEvents }))}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm border-2",
                    filters.schoolEvents 
                      ? "bg-orange-500/30 text-orange-700 dark:text-orange-300 border-orange-400/50 shadow-md" 
                      : "bg-white/40 text-muted-foreground border-white/30 hover:bg-white/60"
                  )}
                >
                  School Events
                </button>
              </div>

              {calendarLoading ? (
                <div className="py-12 text-center">
                  <div className="animate-pulse text-lg">Loading calendar...</div>
                </div>
              ) : view === "list" ? (
                renderListView()
              ) : (
                renderMonthView()
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Create Event Modal */}
      <ParentCreateEventModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) setEditEvent(null);
        }}
        parentId={parentId || ""}
        children={children.map(c => ({ student_id: c.id, student_name: c.full_name }))}
        onEventCreated={() => {
          refetch();
          setEditEvent(null);
        }}
        editEvent={editEvent}
      />

      {/* Item Detail Modal */}
      {selectedItem && (
        <CalendarItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          userRole="parent"
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <ConfirmModal
        open={!!deleteEvent}
        onOpenChange={(open) => !open && setDeleteEvent(null)}
        onConfirm={confirmDelete}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
      />
    </div>
  );
}
