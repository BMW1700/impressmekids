import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Grid, List, Plus, Download, Filter } from "lucide-react";
import { useCalendarData, CalendarItem } from "@/hooks/useCalendarData";
import { Calendar } from "@/components/ui/calendar";
import { getCalendarMonthDays, getCategoryColor, getTypeColor, formatTime, exportToICal, getItemsForDate } from "@/lib/calendarUtils";
import { CalendarItemDetailModal } from "@/components/calendar/CalendarItemDetailModal";
import { CreateEventModal } from "@/components/teacher/CreateEventModal";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const TeacherCalendar = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    classes: true,
    assignments: true,
    events: true,
    schoolEvents: true,
    drafts: true,
  });

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} onSignOut={handleSignOut} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Teacher Calendar</h1>
              <p className="text-muted-foreground">Manage your schedule, events, and assignments</p>
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
              <Card className="p-6">
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {monthDays.map((date, idx) => {
                    const itemsForDay = getItemsForDate(filteredItems, date);
                    const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDate(date)}
                        className={`
                          min-h-24 p-2 border rounded-lg cursor-pointer transition-all
                          ${isCurrentMonth ? "bg-card" : "bg-muted/30"}
                          ${isToday ? "border-primary ring-2 ring-primary/20" : "border-border"}
                          ${date.toDateString() === selectedDate.toDateString() ? "ring-2 ring-primary" : ""}
                          hover:border-primary/50
                        `}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {itemsForDay.slice(0, 3).map((item, i) => {
                            const colors = getTypeColor(item.type);
                            return (
                              <div
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem(item);
                                }}
                                className={`text-xs p-1 rounded truncate ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity`}
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
              </Card>

              {itemsForSelectedDate.length > 0 && (
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
                          onClick={() => setSelectedItem(item)}
                          className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${colors.bg} border border-border`}
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
                          onClick={() => setSelectedItem(item)}
                          className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01] ${colors.bg} border border-border`}
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
          classroomId=""
        />
      )}
    </div>
  );
};

export default TeacherCalendar;
