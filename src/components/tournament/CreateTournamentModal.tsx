import { useState } from 'react';
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
  onSuccess?: (tournamentId: string) => void;
}

export const CreateTournamentModal = ({
  open,
  onOpenChange,
  classroomId,
  onSuccess,
}: CreateTournamentModalProps) => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

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
        description: `${name} has been created successfully`,
      });

      // Seed and create matches
      setIsSeeding(true);

      const { data: seedData, error: seedError } = await supabase.functions.invoke(
        'seed-and-create-matches',
        {
          body: { tournament_id: tournament.id },
        }
      );

      if (seedError) throw seedError;

      toast({
        title: 'Matches Created!',
        description: `${seedData.matches} matches created with ${seedData.tournament_players} players`,
      });

      setName('');
      onOpenChange(false);
      onSuccess?.(tournament.id);
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create tournament',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
      setIsSeeding(false);
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
              disabled={isCreating || isSeeding}
            />
          </div>

          <Button
            onClick={handleCreate}
            className="w-full"
            disabled={isCreating || isSeeding}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSeeding ? 'Creating Matches...' : isCreating ? 'Creating...' : 'Create Tournament'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
