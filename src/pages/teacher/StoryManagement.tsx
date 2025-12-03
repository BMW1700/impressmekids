import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, Edit2, Trash2, Star, ChevronLeft, Search, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const categories = ['animals', 'space', 'sports', 'fairy_tales', 'science', 'adventure', 'history'];
const grades = [0, 1, 2, 3, 4, 5];
const gradients = [
  'from-amber-400 to-orange-500',
  'from-blue-400 to-cyan-500',
  'from-red-400 to-pink-500',
  'from-purple-400 to-indigo-500',
  'from-green-400 to-emerald-500',
  'from-yellow-400 to-amber-500',
  'from-pink-400 to-rose-500',
  'from-teal-400 to-cyan-500',
  'from-indigo-400 to-purple-500',
  'from-orange-400 to-red-500',
];

const categoryIcons: Record<string, string> = {
  animals: "🐾",
  space: "🚀",
  sports: "⚽",
  fairy_tales: "✨",
  science: "🔬",
  adventure: "🗺️",
  history: "📜"
};

interface StoryForm {
  title: string;
  description: string;
  passage_text: string;
  grade_level: number;
  category: string;
  cover_gradient: string;
  target_phonemes: string[];
}

const StoryManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<StoryForm>({
    title: '',
    description: '',
    passage_text: '',
    grade_level: 1,
    category: 'animals',
    cover_gradient: gradients[0],
    target_phonemes: [],
  });

  // Fetch stories
  const { data: stories, isLoading } = useQuery({
    queryKey: ['teacher-stories'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('reading_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Create story mutation
  const createStory = useMutation({
    mutationFn: async (story: StoryForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const wordCount = story.passage_text.split(/\s+/).filter(w => w.length > 0).length;
      const readingTime = Math.ceil(wordCount / 100); // ~100 words per minute for kids

      const { data, error } = await supabase
        .from('reading_library')
        .insert({
          ...story,
          word_count: wordCount,
          reading_time_minutes: readingTime,
          difficulty_level: Math.min(5, Math.max(1, story.grade_level + 1)),
          created_by: user.id,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-stories'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Story Created! 📚",
        description: "Your story has been added to the library.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update story mutation
  const updateStory = useMutation({
    mutationFn: async ({ id, story }: { id: string; story: StoryForm }) => {
      const wordCount = story.passage_text.split(/\s+/).filter(w => w.length > 0).length;
      const readingTime = Math.ceil(wordCount / 100);

      const { data, error } = await supabase
        .from('reading_library')
        .update({
          ...story,
          word_count: wordCount,
          reading_time_minutes: readingTime,
          difficulty_level: Math.min(5, Math.max(1, story.grade_level + 1)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-stories'] });
      setIsDialogOpen(false);
      setEditingStory(null);
      resetForm();
      toast({
        title: "Story Updated!",
        description: "Your changes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update story. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete story mutation
  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reading_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-stories'] });
      toast({
        title: "Story Deleted",
        description: "The story has been removed from the library.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      passage_text: '',
      grade_level: 1,
      category: 'animals',
      cover_gradient: gradients[0],
      target_phonemes: [],
    });
  };

  const handleEdit = (story: any) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      description: story.description,
      passage_text: story.passage_text,
      grade_level: story.grade_level,
      category: story.category,
      cover_gradient: story.cover_gradient,
      target_phonemes: story.target_phonemes || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.passage_text) {
      toast({
        title: "Missing Fields",
        description: "Please fill in the title and passage text.",
        variant: "destructive",
      });
      return;
    }

    if (editingStory) {
      updateStory.mutate({ id: editingStory.id, story: formData });
    } else {
      createStory.mutate(formData);
    }
  };

  const filteredStories = stories?.filter(story =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/dashboard')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Story Library</h1>
                <p className="text-muted-foreground">Create and manage reading stories for your students</p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingStory(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Story
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingStory ? 'Edit Story' : 'Create New Story'}</DialogTitle>
                  <DialogDescription>
                    {editingStory ? 'Update the story details below.' : 'Add a new story to your reading library.'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="The Adventure Begins..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {categoryIcons[cat]} {cat.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="A brief description of the story..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade Level</Label>
                      <Select
                        value={formData.grade_level.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, grade_level: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map(grade => (
                            <SelectItem key={grade} value={grade.toString()}>
                              Grade {grade === 0 ? 'K' : grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Cover Color</Label>
                      <div className="flex gap-2 flex-wrap">
                        {gradients.map((gradient, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, cover_gradient: gradient }))}
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} ${
                              formData.cover_gradient === gradient ? 'ring-2 ring-primary ring-offset-2' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passage">Passage Text</Label>
                    <Textarea
                      id="passage"
                      value={formData.passage_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, passage_text: e.target.value }))}
                      placeholder="Write or paste the story passage here..."
                      rows={10}
                    />
                    <p className="text-sm text-muted-foreground">
                      Word count: {formData.passage_text.split(/\s+/).filter(w => w.length > 0).length}
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createStory.isPending || updateStory.isPending}>
                      {editingStory ? 'Save Changes' : 'Create Story'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold">{stories?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Stories</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold">
                {stories?.reduce((sum, s) => sum + s.word_count, 0).toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Words</div>
            </Card>
          </div>

          {/* Story List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-32 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : filteredStories.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Stories Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first story to get started!
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Story
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <div className={`h-32 bg-gradient-to-br ${story.cover_gradient} relative`}>
                      <div className="absolute bottom-3 left-3 text-4xl">
                        {categoryIcons[story.category]}
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90">
                          Grade {story.grade_level === 0 ? 'K' : story.grade_level}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold line-clamp-1">{story.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{story.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{story.word_count} words</span>
                        <span>•</span>
                        <span>{story.reading_time_minutes} min</span>
                        <span>•</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < story.difficulty_level ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            // Navigate to assignment creation with story pre-selected
                            navigate(`/classrooms?createAssignment=true&storyId=${story.id}&storyTitle=${encodeURIComponent(story.title)}`);
                          }}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(story)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this story?')) {
                              deleteStory.mutate(story.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StoryManagement;