import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Grid, List, Plus, Download, Filter, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useCalendarData, CalendarItem } from "@/hooks/useCalendarData";
import { Calendar } from "@/components/ui/calendar";
import { getCalendarMonthDays, getCategoryColor, getTypeColor, formatTime, exportToICal, getItemsForDate, getCategoryIcon } from "@/lib/calendarUtils";
import { CalendarItemDetailModal } from "@/components/calendar/CalendarItemDetailModal";
import { CreateEventModal } from "@/components/teacher/CreateEventModal";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";

const TeacherCalendar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileSelectedDate, setMobileSelectedDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState({
    classes: true,
    assignments: true,
    events: true,
    schoolEvents: true,
    drafts: false,
  });
  const [focusedDateIndex, setFocusedDateIndex] = useState<number | null>(null);
  const calendarGridRef = useRef<HTMLDivElement>(null);

  // Get user profile
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .rpc('get_user_profile', { _user_id: session.user.id });
      if (error) throw error;
      return data?.[0];
    },
  });

  // Get calendar data
  const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  
  const { data: calendarItems = [], isLoading } = useCalendarData({
    startDate,
    endDate,
    userId: profile?.id,
    userRole: "teacher",
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Filter items based on filters and show drafts
  const filteredItems = calendarItems.filter(item => {
    if (item.type === "class" && !filters.classes) return false;
    if (item.type === "assignment" && !filters.assignments) return false;
    if (item.type === "event" && !filters.events) return false;
    if (item.type === "school_event" && !filters.schoolEvents) return false;
    if (!filters.drafts && item.isDraft) return false;
    return true;
  });

  const handleExport = () => {
    exportToICal(filteredItems, "teacher");
  };

  const monthDays = getCalendarMonthDays(selectedDate);
  const itemsForSelectedDate = getItemsForDate(filteredItems, selectedDate);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== "month" || focusedDateIndex === null) return;
      
      let newIndex = focusedDateIndex;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newIndex = Math.max(0, focusedDateIndex - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newIndex = Math.min(monthDays.length - 1, focusedDateIndex + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          newIndex = Math.max(0, focusedDateIndex - 7);
          break;
        case "ArrowDown":
          e.preventDefault();
          newIndex = Math.min(monthDays.length - 1, focusedDateIndex + 7);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          const dayItems = getItemsForDate(filteredItems, monthDays[focusedDateIndex]);
          if (dayItems.length > 0) {
            setSelectedItem(dayItems[0]);
          } else {
            setSelectedDate(monthDays[focusedDateIndex]);
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
  }, [focusedDateIndex, view, monthDays, filteredItems]);

  // Mobile day view with navigation
  const renderMobileDayView = () => {
    const currentDayDate = mobileSelectedDate || new Date();
    const dayItems = getItemsForDate(filteredItems, currentDayDate);
    const today = new Date();
    const isToday = format(currentDayDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSelectedDate(subDays(currentDayDate, 1))}
            className="rounded-full hover:bg-white/20 backdrop-blur-sm border border-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <div className={cn("text-xl font-bold", isToday && "text-primary")}>
              {format(currentDayDate, "EEEE")}
            </div>
            <div className="text-lg text-muted-foreground">
              {format(currentDayDate, "MMMM d, yyyy")}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSelectedDate(addDays(currentDayDate, 1))}
            className="rounded-full hover:bg-white/20 backdrop-blur-sm border border-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileSelectedDate(null)}
          className="w-full"
        >
          Back to Month View
        </Button>

        {dayItems.length > 0 ? (
          <div className="space-y-3">
            {dayItems.map((item) => {
              const typeColor = getTypeColor(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl cursor-pointer border-2 ${typeColor.border} ${typeColor.bg} hover:shadow-md transition-all`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getCategoryIcon(item.category)}</span>
                        <h4 className="font-semibold">{item.title}</h4>
                        {item.isDraft && <Badge variant="outline">Draft</Badge>}
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
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No items for this day
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Mobile month view with compact dots
  const renderMobileMonthView = () => {
    const today = new Date();

    return (
      <div className="grid grid-cols-7 gap-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center font-medium text-xs text-muted-foreground py-2">
            {day}
          </div>
        ))}
        {monthDays.map((day, i) => {
          const dayItems = getItemsForDate(filteredItems, day);
          const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
          const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
          
          const hasAssignments = dayItems.some(item => item.type === "assignment");
          const hasClasses = dayItems.some(item => item.type === "class");
          const hasEvents = dayItems.some(item => item.type === "event");
          const hasSchoolEvents = dayItems.some(item => item.type === "school_event");

          return (
            <div
              key={i}
              onClick={() => {
                setMobileSelectedDate(day);
                setSelectedDate(day);
              }}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all p-1",
                !isCurrentMonth && "opacity-30",
                isCurrentMonth && "bg-card/50",
                isToday && "bg-primary/20 ring-2 ring-primary",
                "hover:bg-card/70 active:scale-95"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                isToday && "text-primary font-bold"
              )}>
                {format(day, "d")}
              </span>
              {dayItems.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {hasClasses && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  {hasAssignments && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                  {hasEvents && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  {hasSchoolEvents && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} onSignOut={handleSignOut} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/teacher/dashboard")}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-luxury font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
                  Teacher Calendar
                </h1>
                <p className="text-muted-foreground">Manage your schedule, events, and assignments</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowCreateEvent(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-classes"
                    checked={filters.classes}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, classes: !!checked }))}
                  />
                  <Label htmlFor="filter-classes">Classes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-assignments"
                    checked={filters.assignments}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, assignments: !!checked }))}
                  />
                  <Label htmlFor="filter-assignments">Assignments</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-events"
                    checked={filters.events}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, events: !!checked }))}
                  />
                  <Label htmlFor="filter-events">Events</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-school"
                    checked={filters.schoolEvents}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, schoolEvents: !!checked }))}
                  />
                  <Label htmlFor="filter-school">School Events</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-drafts"
                    checked={filters.drafts}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, drafts: !!checked }))}
                  />
                  <Label htmlFor="filter-drafts">Show Drafts</Label>
                </div>
              </div>
            </Card>
          )}

          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="month">
                <Grid className="h-4 w-4 mr-2" />
                Month
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="month" className="mt-6">
              <div className="relative p-4 md:p-8 rounded-3xl bg-gradient-mesh-light backdrop-blur-xl border border-white/20 shadow-glass-lg">
                {/* Hide month navigation when in mobile day view */}
                {!(isMobile && mobileSelectedDate) && (
                  <div className="flex items-center justify-between mb-4 md:mb-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                      className="rounded-full hover:bg-white/10 transition-all hover:scale-110"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-2xl md:text-3xl font-luxury font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                      className="rounded-full hover:bg-white/10 transition-all hover:scale-110"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* Filter buttons for mobile */}
                {isMobile && !mobileSelectedDate && (
                  <div className="flex flex-wrap gap-2 items-center justify-center mb-4">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, classes: !prev.classes }))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-sm border-2",
                        filters.classes 
                          ? "bg-blue-500/30 text-blue-700 dark:text-blue-300 border-blue-400/50 shadow-md" 
                          : "bg-white/40 text-muted-foreground border-white/30 hover:bg-white/60"
                      )}
                    >
                      Classes
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, events: !prev.events }))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-sm border-2",
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
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-sm border-2",
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
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-sm border-2",
                        filters.schoolEvents 
                          ? "bg-orange-500/30 text-orange-700 dark:text-orange-300 border-orange-400/50 shadow-md" 
                          : "bg-white/40 text-muted-foreground border-white/30 hover:bg-white/60"
                      )}
                    >
                      School Events
                    </button>
                  </div>
                )}

                {/* Render mobile or desktop calendar */}
                {isMobile ? (
                  mobileSelectedDate ? renderMobileDayView() : renderMobileMonthView()
                ) : (
                  <div 
                    className="grid grid-cols-7 gap-3"
                    ref={calendarGridRef}
                    role="grid"
                    aria-label="Teacher calendar month view"
                  >
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center font-medium text-xs text-muted-foreground/70 py-3 tracking-wider uppercase" role="columnheader">
                        {day}
                      </div>
                    ))}
                    {monthDays.map((date, idx) => {
                      const itemsForDay = getItemsForDate(filteredItems, date);
                      const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isFocused = focusedDateIndex === idx;
                      
                      return (
                        <div
                          key={idx}
                          tabIndex={0}
                          role="gridcell"
                          aria-label={`${date.toLocaleDateString()}, ${itemsForDay.length} items`}
                          aria-selected={isFocused}
                          onClick={() => {
                            setFocusedDateIndex(idx);
                            setSelectedDate(date);
                          }}
                          onFocus={() => setFocusedDateIndex(idx)}
                          className={`
                            group min-h-28 p-3 rounded-2xl cursor-pointer transition-all duration-300
                            backdrop-blur-sm border
                            ${isCurrentMonth ? "bg-card/50 border-white/10" : "bg-muted/10 border-transparent"}
                            ${isToday ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary/40 shadow-glow-primary" : ""}
                            ${date.toDateString() === selectedDate.toDateString() ? "ring-2 ring-primary/50" : ""}
                            ${isFocused ? "ring-2 ring-primary ring-offset-2 shadow-lg" : ""}
                            hover:shadow-glass-md hover:scale-[1.02] hover:bg-card/70
                          `}
                        >
                          <div className={`text-sm font-semibold mb-2 flex items-center justify-between ${isToday ? "text-primary animate-pulse-luxury" : "text-foreground"}`}>
                            <span>{date.getDate()}</span>
                            {isToday && <span className="w-2 h-2 rounded-full bg-primary animate-pulse-luxury"></span>}
                          </div>
                          <div className="space-y-1">
                            {itemsForDay.slice(0, 3).map((item, i) => {
                              const colors = getTypeColor(item.type);
                              return (
                                <div
                                  key={i}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`${item.isDraft ? "Draft: " : ""}${item.title}, ${item.type}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItem(item);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedItem(item);
                                    }
                                  }}
                                  className={`text-xs p-1 rounded truncate ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity focus:ring-2 focus:ring-primary focus:ring-offset-1`}
                                >
                                  {item.isDraft && "📝 "}
                                  {item.title}
                                </div>
                              );
                            })}
                            {itemsForDay.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{itemsForDay.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop selected date details */}
              {!isMobile && itemsForSelectedDate.length > 0 && (
                <Card className="mt-6 p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="space-y-2">
                    {itemsForSelectedDate.map((item) => {
                      const colors = getTypeColor(item.type);
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`${item.isDraft ? "Draft: " : ""}${item.title}, ${item.type}, ${item.startTime ? formatTime(item.startTime) : ""}`}
                          onClick={() => setSelectedItem(item)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedItem(item);
                            }
                          }}
                          className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${colors.bg} border border-border focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{colors.icon}</span>
                                <div>
                                  <h4 className="font-semibold">{item.title}</h4>
                                  {item.isDraft && (
                                    <Badge variant="outline" className="mt-1">Draft</Badge>
                                  )}
                                </div>
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              )}
                              {item.startTime && (
                                <p className="text-sm mt-1">{formatTime(item.startTime)}</p>
                              )}
                              {item.location && (
                                <p className="text-sm text-muted-foreground">{item.location}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <Card className="p-6">
                <div className="space-y-4">
                  {filteredItems.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No calendar items found</p>
                  ) : (
                    filteredItems.map((item) => {
                      const colors = getTypeColor(item.type);
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`${item.isDraft ? "Draft: " : ""}${item.title}, ${new Date(item.date).toLocaleDateString()}`}
                          onClick={() => setSelectedItem(item)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedItem(item);
                            }
                          }}
                          className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01] ${colors.bg} border border-border focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{colors.icon}</span>
                                <div>
                                  <h4 className="font-semibold">{item.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(item.date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                    {item.startTime && ` at ${formatTime(item.startTime)}`}
                                  </p>
                                </div>
                              </div>
                              {item.isDraft && (
                                <Badge variant="outline" className="mt-2">Draft</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {selectedItem && (
        <CalendarItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          userRole="teacher"
        />
      )}

      {showCreateEvent && profile && (
        <CreateEventModal
          open={showCreateEvent}
          onOpenChange={setShowCreateEvent}
          teacherId={profile.id}
        />
      )}
    </div>
  );
};

export default TeacherCalendar;
