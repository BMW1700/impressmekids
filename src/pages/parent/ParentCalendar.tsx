import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Printer, Search, Filter, Loader2, Users } from "lucide-react";
import { format, addMonths, subMonths, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useParentCalendarData } from "@/hooks/useParentCalendarData";
import { getCalendarMonthDays, getItemsForDate, getCategoryColor, getTypeColor, formatTime, getCategoryIcon, exportToICal } from "@/lib/calendarUtils";
import { CalendarItemDetailModal } from "@/components/calendar/CalendarItemDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function ParentCalendar() {
  const navigate = useNavigate();
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

  const { data: items = [], isLoading: calendarLoading } = useParentCalendarData({
    startDate: dateRange.start,
    endDate: dateRange.end,
    parentId: parentId || "",
    childId: selectedChildId,
  });

  const filteredItems = items.filter((item) => {
    if (!filters.events && item.type === "event") return false;
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

  const renderMonthView = () => {
    const days = getCalendarMonthDays(currentDate);
    const today = new Date();

    return (
      <div className="grid grid-cols-7 gap-2">
        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
          <div key={day} className="text-center font-semibold text-sm py-2 text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          const dayItems = getItemsForDate(filteredItems, day);
          const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
          const isCurrentMonth = format(day, "M") === format(currentDate, "M");

          return (
            <Card
              key={i}
              className={`min-h-[120px] p-2 cursor-pointer hover:shadow-md transition-shadow ${
                !isCurrentMonth ? "opacity-40" : ""
              } ${isToday ? "ring-2 ring-primary" : ""}`}
            >
              <div className="font-semibold text-sm mb-1">
                {format(day, "d")}
                {isToday && <Badge className="ml-1 text-xs">Today</Badge>}
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => {
                  const categoryColor = getCategoryColor(item.category);

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`text-xs p-1 rounded truncate ${categoryColor.bg} ${categoryColor.text} hover:opacity-80`}
                    >
                      <span className="mr-1">{getCategoryIcon(item.category)}</span>
                      {item.title}
                    </div>
                  );
                })}
                {dayItems.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </Card>
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
                const categoryColor = getCategoryColor(item.category);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow border ${categoryColor.border}`}
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
        <Header />
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
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-8 w-8" />
                Student Calendar
              </h1>
              <p className="text-muted-foreground">View your child's schedule</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Child Selector */}
                {children.length > 1 && (
                  <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Select child" />
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

                {/* View Selector */}
                <Tabs value={view} onValueChange={(v) => setView(v as any)} className="flex-1">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Navigation */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="text-xl font-semibold">
                  {format(currentDate, view === "day" ? "MMMM d, yyyy" : "MMMM yyyy")}
                </h2>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Show:
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.events}
                    onCheckedChange={(checked) => setFilters({ ...filters, events: !!checked })}
                  />
                  <span className="text-sm">Events</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.assignments}
                    onCheckedChange={(checked) => setFilters({ ...filters, assignments: !!checked })}
                  />
                  <span className="text-sm">Assignments</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.schoolEvents}
                    onCheckedChange={(checked) => setFilters({ ...filters, schoolEvents: !!checked })}
                  />
                  <span className="text-sm">School Events</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Content */}
          {calendarLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-pulse">Loading calendar...</div>
              </CardContent>
            </Card>
          ) : view === "list" ? (
            renderListView()
          ) : (
            <Card>
              <CardContent className="pt-6">{renderMonthView()}</CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />

      {/* Item Detail Modal */}
      {selectedItem && (
        <CalendarItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          userRole="parent"
        />
      )}
    </div>
  );
}
