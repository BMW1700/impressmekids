import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CreateTournamentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
}

export const CreateTournamentModal = ({
  open,
  onOpenChange,
  classroomId,
}: CreateTournamentModalProps) => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a tournament name',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Verify user is the teacher of this classroom
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in',
          variant: 'destructive',
        });
        return;
      }

      const { data: classroom } = await supabase
        .from('classrooms')
        .select('teacher_id')
        .eq('id', classroomId)
        .single();

      if (classroom?.teacher_id !== session.user.id) {
        toast({
          title: 'Access Denied',
          description: 'Only the classroom teacher can create tournaments',
          variant: 'destructive',
        });
        return;
      }

      // Create tournament
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'start-tournament',
        {
          body: { classroom_id: classroomId, name: name.trim() },
        }
      );

      if (functionError) throw functionError;

      const tournament = functionData.tournament;

      toast({
        title: 'Tournament Created!',
        description: 'Now assign questions and seed players to start matches',
      });

      setName('');
      onOpenChange(false);
      
      // Navigate to tournament control page
      navigate(`/teacher/tournament/control?tournament=${tournament.id}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create tournament',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            Create a new Jeopardy Duel tournament for your classroom
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tournament-name">Tournament Name</Label>
            <Input
              id="tournament-name"
              placeholder="e.g., Math Finals Tournament"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <Button
            onClick={handleCreate}
            className="w-full"
            disabled={isCreating}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Creating...' : 'Create Tournament'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
