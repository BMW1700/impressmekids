import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PrintAssignmentProps {
  assignmentId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function PrintAssignment({ assignmentId, variant = "outline", size = "default", className }: PrintAssignmentProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = async () => {
    try {
      setIsLoading(true);

      // Fetch assignment details
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) throw assignmentError;

      // Only allow printing if assignment is published
      if (assignment.status !== 'published') {
        toast({
          title: "Cannot Print",
          description: "Only published assignments can be printed",
          variant: "destructive",
        });
        return;
      }

      // Fetch questions for the assignment
      const { data: questions, error: questionsError } = await supabase
        .from('assignment_questions')
        .select('*, questions(*)')
        .eq('assignment_id', assignmentId)
        .order('question_order');

      if (questionsError) throw questionsError;

      // Create print window content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Print Blocked",
          description: "Please allow pop-ups to print assignments",
          variant: "destructive",
        });
        return;
      }

      // Build print content
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${assignment.title} - Assignment</title>
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 20mm;
                }
                .page-break {
                  page-break-before: always;
                }
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                border-bottom: 3px solid #333;
                padding-bottom: 15px;
                margin-bottom: 30px;
              }
              h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
              }
              .meta {
                color: #666;
                font-size: 14px;
              }
              .description {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .passage {
                background: #fafafa;
                padding: 20px;
                border-left: 4px solid #333;
                margin: 20px 0;
                white-space: pre-wrap;
              }
              .question {
                margin: 30px 0;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
              }
              .question-number {
                font-weight: bold;
                font-size: 18px;
                color: #333;
                margin-bottom: 10px;
              }
              .question-text {
                font-size: 16px;
                margin: 15px 0;
              }
              .options {
                margin: 15px 0 15px 20px;
              }
              .option {
                margin: 8px 0;
                padding: 10px;
                background: #f9f9f9;
                border-radius: 4px;
              }
              .answer-space {
                margin-top: 20px;
                border-top: 1px solid #ddd;
                padding-top: 15px;
              }
              .answer-label {
                font-weight: bold;
                margin-bottom: 10px;
              }
              .answer-lines {
                border-bottom: 1px solid #ccc;
                height: 60px;
                margin: 10px 0;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #333;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
              @media print {
                button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${assignment.title}</h1>
              <div class="meta">
                ${assignment.description ? `<p>${assignment.description}</p>` : ''}
                ${assignment.due_date ? `<p>Due Date: ${new Date(assignment.due_date).toLocaleDateString()}</p>` : ''}
                ${assignment.timer_minutes ? `<p>Time Limit: ${assignment.timer_minutes} minutes</p>` : ''}
              </div>
            </div>

            ${assignment.passage_text ? `
              <div class="passage">
                <h2 style="margin-top: 0;">Reading Passage</h2>
                ${assignment.passage_text}
              </div>
            ` : ''}

            <div style="margin: 30px 0;">
              <h2>Questions</h2>
              ${questions && questions.length > 0 ? questions.map((q: any, index: number) => `
                <div class="question">
                  <div class="question-number">Question ${index + 1}</div>
                  <div class="question-text">${q.questions?.question_text || 'Question text not available'}</div>
                  
                  ${q.questions?.options && Array.isArray(q.questions.options) && q.questions.options.length > 0 ? `
                    <div class="options">
                      ${q.questions.options.map((opt: any, optIndex: number) => `
                        <div class="option">
                          <strong>${String.fromCharCode(65 + optIndex)}.</strong> ${opt.text || opt}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  
                  <div class="answer-space">
                    <div class="answer-label">Your Answer:</div>
                    <div class="answer-lines"></div>
                    <div class="answer-lines"></div>
                  </div>
                </div>
              `).join('') : '<p>No questions available</p>'}
            </div>

            <div class="footer">
              <p>Name: ___________________________ Date: _______________</p>
              <p style="margin-top: 10px;">Printed from Classroom Assignment System</p>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: error.message || "Could not generate print version",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      disabled={isLoading}
      className={className}
    >
      <Printer className="h-4 w-4 mr-2" />
      Print
    </Button>
  );
}
