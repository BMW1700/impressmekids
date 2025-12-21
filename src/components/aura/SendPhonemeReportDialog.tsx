import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Mail, CheckCircle2 } from "lucide-react";

interface PhonemeData {
  symbol: string;
  label: string;
  example: string;
  score: number | null;
}

interface SendPhonemeReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  classroomId: string;
  classroomName: string;
  phonemes: PhonemeData[];
}

export const SendPhonemeReportDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  classroomId,
  classroomName,
  phonemes,
}: SendPhonemeReportDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedPhonemes, setSelectedPhonemes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  // Fetch parent accounts linked to this student
  const fetchParents = async (): Promise<{ id: string; full_name: string; email: string }[]> => {
    const linksRes = await supabase.from("parent_student_links").select("parent_id").match({ student_id: studentId, status: "active" });
    if (linksRes.error) throw linksRes.error;
    if (!linksRes.data?.length) return [];
    const ids = linksRes.data.map((l: { parent_id: string }) => l.parent_id);
    const parentsRes = await supabase.from("parent_accounts").select("id, full_name, email").in("id", ids);
    if (parentsRes.error) throw parentsRes.error;
    return (parentsRes.data || []) as { id: string; full_name: string; email: string }[];
  };

  const { data: parentAccounts = [], isLoading: loadingParents } = useQuery({
    queryKey: ["student-parents", studentId],
    queryFn: fetchParents,
    enabled: open,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (parentAccounts.length === 0) {
        throw new Error("No parent accounts linked to this student");
      }

      const selectedData = phonemes
        .filter(p => selectedPhonemes.includes(p.symbol))
        .map(p => ({
          symbol: p.symbol,
          label: p.label,
          score: p.score,
        }));

      if (selectedData.length === 0) {
        throw new Error("Please select at least one sound to include");
      }

      // Send to all linked parents
      const results = await Promise.all(
        parentAccounts.map(async (parent: any) => {
          const { data, error } = await supabase.functions.invoke("send-phoneme-report", {
            body: {
              studentId,
              parentId: parent.id,
              classroomId,
              phonemeData: selectedData,
              message,
            },
          });

          if (error) throw error;
          return data;
        })
      );

      return results;
    },
    onSuccess: () => {
      toast.success(`Report sent to ${parentAccounts.length} parent(s)`);
      queryClient.invalidateQueries({ queryKey: ["parent-phoneme-reports"] });
      onOpenChange(false);
      setSelectedPhonemes([]);
      setMessage("");
      setSelectAll(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedPhonemes(phonemes.map(p => p.symbol));
    } else {
      setSelectedPhonemes([]);
    }
  };

  const handleTogglePhoneme = (symbol: string) => {
    setSelectedPhonemes(prev => {
      const newSelection = prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol];
      setSelectAll(newSelection.length === phonemes.length);
      return newSelection;
    });
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-muted text-muted-foreground";
    if (score >= 90) return "bg-green-500 text-white";
    if (score >= 70) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Send Phoneme Report
          </DialogTitle>
          <DialogDescription>
            Send {studentName}'s sound accuracy data to their parent(s)
          </DialogDescription>
        </DialogHeader>

        {loadingParents ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : parentAccounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No parent accounts are linked to this student.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Parent info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">Recipients:</p>
              <div className="flex flex-wrap gap-2">
                {parentAccounts.map((parent: any) => (
                  <Badge key={parent.id} variant="secondary">
                    {parent.full_name} ({parent.email})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Select sounds */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select sounds to include:</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  />
                  <label htmlFor="select-all" className="text-sm cursor-pointer">
                    Select All
                  </label>
                </div>
              </div>
              
              <ScrollArea className="h-[200px] border rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  {phonemes.map((p) => (
                    <div
                      key={p.symbol}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedPhonemes.includes(p.symbol)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                      onClick={() => handleTogglePhoneme(p.symbol)}
                    >
                      <Checkbox
                        checked={selectedPhonemes.includes(p.symbol)}
                        onCheckedChange={() => handleTogglePhoneme(p.symbol)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.label}</p>
                        <p className="text-xs text-muted-foreground">"{p.example}"</p>
                      </div>
                      <Badge className={`${getScoreColor(p.score)} shrink-0`}>
                        {p.score !== null ? `${p.score}%` : "-"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedPhonemes.length} of {phonemes.length} sounds selected
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Add a message (optional):</Label>
              <Textarea
                id="message"
                placeholder="Write a personalized message to the parent..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Send button */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending || selectedPhonemes.length === 0}
              >
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Report
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};