import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Save } from 'lucide-react';
import { QuestionBuilder } from '@/components/assignments/QuestionBuilder';
import { useMultiQuestionAssignments } from '@/hooks/useMultiQuestionAssignments';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ConfirmModal } from '@/components/ConfirmModal';

interface Question {
  id: string;
  sequence: number;
  question_type: 'question_answer' | 'reading_comprehension' | 'speaking' | null;
  question_data: any;
}

export default function CreateMultiQuestionAssignment() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { createAssignment, updateAssignment, assignment } = useMultiQuestionAssignments(classroomId, editId || undefined);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timerMinutes, setTimerMinutes] = useState<number | undefined>();
  const [dueDate, setDueDate] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: uuidv4(), sequence: 1, question_type: null, question_data: {} }
  ]);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // Load assignment data when editing
  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title || '');
      setDescription(assignment.description || '');
      setTimerMinutes(assignment.timer_minutes);
      setDueDate(assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '');
      
      if (assignment.assignment_questions && assignment.assignment_questions.length > 0) {
        const loadedQuestions = assignment.assignment_questions.map((q: any) => ({
          id: q.id || uuidv4(),
          sequence: q.sequence,
          question_type: q.question_type,
          question_data: q.question_data,
        }));
        setQuestions(loadedQuestions);
      }
    }
  }, [assignment]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      sequence: questions.length + 1,
      question_type: null,
      question_data: {},
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updated: Question) => {
    setQuestions(questions.map(q => q.id === id ? updated : q));
  };

  const deleteQuestion = (id: string) => {
    const filtered = questions.filter(q => q.id !== id);
    // Re-sequence remaining questions
    const resequenced = filtered.map((q, index) => ({
      ...q,
      sequence: index + 1,
    }));
    setQuestions(resequenced);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Re-sequence after drag
    const resequenced = items.map((item, index) => ({
      ...item,
      sequence: index + 1,
    }));

    setQuestions(resequenced);
  };

  const handleSaveAndClose = () => {
    if (!classroomId) return;
    
    const questionData = questions.map(q => ({
      sequence: q.sequence,
      question_type: q.question_type!,
      question_data: q.question_data,
    }));

    if (editId) {
      // Update existing assignment
      updateAssignment({
        id: editId,
        updates: {
          title,
          description,
          classroom_id: classroomId,
          due_date: dueDate,
          timer_minutes: timerMinutes,
        },
        questions: questionData,
      });
    } else {
      // Create new assignment
      createAssignment({
        title,
        description,
        classroom_id: classroomId,
        due_date: dueDate,
        timer_minutes: timerMinutes,
        questions: questionData,
      });
    }

    navigate(`/classrooms/${classroomId}?tab=assignments`);
  };

  const handlePublish = () => {
    setShowPublishConfirm(true);
  };

  const confirmPublish = () => {
    if (!classroomId) return;
    
    const questionData = questions.map(q => ({
      sequence: q.sequence,
      question_type: q.question_type!,
      question_data: q.question_data,
    }));

    if (editId) {
      // Update and publish existing assignment
      updateAssignment({
        id: editId,
        updates: {
          title,
          description,
          classroom_id: classroomId,
          due_date: dueDate,
          timer_minutes: timerMinutes,
        },
        questions: questionData,
      });
    } else {
      // Create new assignment
      createAssignment({
        title,
        description,
        classroom_id: classroomId,
        due_date: dueDate,
        timer_minutes: timerMinutes,
        questions: questionData,
      });
    }

    navigate(`/classrooms/${classroomId}?tab=assignments`);
  };

  const isValid = title && questions.every(q => q.question_type && Object.keys(q.question_data).length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header showAuthButtons={false} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Create Assignment</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveAndClose} disabled={!isValid}>
                <Save className="mr-2 h-4 w-4" />
                Save and Close
              </Button>
              <Button onClick={handlePublish} disabled={!isValid}>
                Post Assignment
              </Button>
            </div>
          </div>

          {/* Assignment details */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label>Assignment Title *</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter assignment title..."
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the assignment..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Completion Timer (minutes, optional)</Label>
                  <Input 
                    type="number" 
                    value={timerMinutes || ''} 
                    onChange={(e) => setTimerMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 30"
                    min={1}
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input 
                    type="datetime-local" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {questions.map((question, index) => (
                      <Draggable key={question.id} draggableId={question.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <QuestionBuilder
                              question={question}
                              onUpdate={(updated) => updateQuestion(question.id, updated)}
                              onDelete={() => deleteQuestion(question.id)}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="flex justify-center pt-4">
              <Button onClick={addQuestion} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ConfirmModal
        open={showPublishConfirm}
        onOpenChange={setShowPublishConfirm}
        title="Post Assignment?"
        description="Are you sure you want to post this assignment? Students will be able to see and complete it."
        onConfirm={confirmPublish}
      />
    </div>
  );
}
