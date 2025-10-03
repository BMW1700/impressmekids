import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Play, Search } from "lucide-react";
import { FlashcardSetViewer } from "@/components/flashcards/FlashcardSetViewer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StudyMaterials = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [flashcardSets, setFlashcardSets] = useState<any[]>([]);
  const [filteredSets, setFilteredSets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [viewingSet, setViewingSet] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  useEffect(() => {
    filterFlashcards();
  }, [searchQuery, selectedClassroom, selectedSubject, flashcardSets]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "student") {
      navigate("/teacher/dashboard");
    }
  };

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load student's classrooms
      const { data: classroomData } = await supabase
        .from("classroom_students")
        .select("classroom:classrooms(id, name)")
        .eq("student_id", session.user.id);

      const classroomsList = classroomData?.map((item) => item.classroom) || [];
      setClassrooms(classroomsList);

      if (classroomsList.length === 0) {
        setIsLoading(false);
        return;
      }

      // Load flashcard sets from all enrolled classrooms
      const classroomIds = classroomsList.map((c: any) => c.id);
      const { data: flashcardData, error } = await supabase
        .from("flashcard_sets")
        .select(`
          *,
          classrooms(name),
          question_groups(title, subject, grade)
        `)
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlashcardSets(flashcardData || []);
      setFilteredSets(flashcardData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load study materials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterFlashcards = () => {
    let filtered = [...flashcardSets];

    if (searchQuery) {
      filtered = filtered.filter(
        (set) =>
          set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          set.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedClassroom !== "all") {
      filtered = filtered.filter((set) => set.classroom_id === selectedClassroom);
    }

    if (selectedSubject !== "all") {
      filtered = filtered.filter(
        (set) => set.question_groups?.subject === selectedSubject
      );
    }

    setFilteredSets(filtered);
  };

  const uniqueSubjects = Array.from(
    new Set(flashcardSets.map((set) => set.question_groups?.subject).filter(Boolean))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (viewingSet) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showAuthButtons={false} />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Button
              variant="outline"
              onClick={() => setViewingSet(null)}
              className="mb-4"
            >
              ← Back to Study Materials
            </Button>
            <FlashcardSetViewer flashcards={viewingSet.flashcards} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/student/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Study Materials</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Study Materials</h1>
            <p className="text-muted-foreground">
              Review flashcard sets from your classrooms
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search flashcard sets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Classrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classrooms</SelectItem>
                {classrooms.map((classroom: any) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {uniqueSubjects.map((subject: any) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredSets.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Study Materials Available</h3>
              <p className="text-muted-foreground mb-4">
                {flashcardSets.length === 0
                  ? "Your teachers haven't created any flashcard sets yet"
                  : "No flashcard sets match your search criteria"}
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSets.map((set) => (
                <Card key={set.id} className="shadow-card hover:shadow-purple transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{set.title}</CardTitle>
                    {set.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {set.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{set.classrooms?.name}</Badge>
                        {set.question_groups?.subject && (
                          <Badge variant="secondary">{set.question_groups.subject}</Badge>
                        )}
                        {set.question_groups?.grade !== undefined && (
                          <Badge variant="outline">
                            {set.question_groups.grade === 0
                              ? "K"
                              : `Grade ${set.question_groups.grade}`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>{set.flashcards.length}</strong> flashcards
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(set.created_at).toLocaleDateString()}
                      </p>
                      <Button
                        className="w-full bg-gradient-primary"
                        onClick={() => setViewingSet(set)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Study Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudyMaterials;
