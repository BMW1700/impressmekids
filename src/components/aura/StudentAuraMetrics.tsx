import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface StudentAuraMetricsProps {
  students: any[];
  records: any[];
}

const StudentAuraMetrics = ({ students, records }: StudentAuraMetricsProps) => {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const getStudentData = (studentId: string) => {
    const studentRecords = records.filter(r => r.profile_id === studentId);
    if (studentRecords.length === 0) return null;

    const avgGrade = Math.round(
      studentRecords.reduce((sum, r) => sum + r.grade, 0) / studentRecords.length
    );
    const avgPronunciation = (
      studentRecords.reduce((sum, r) => sum + r.pronunciation, 0) / studentRecords.length
    ).toFixed(1);
    const avgClarity = (
      studentRecords.reduce((sum, r) => sum + r.clarity, 0) / studentRecords.length
    ).toFixed(1);
    const avgConfidence = (
      studentRecords.reduce((sum, r) => sum + r.confidence, 0) / studentRecords.length
    ).toFixed(1);

    const recentRecords = studentRecords.slice(0, 3);
    const olderRecords = studentRecords.slice(3, 6);
    const trend = recentRecords.length > 0 && olderRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + r.grade, 0) / recentRecords.length -
        olderRecords.reduce((sum, r) => sum + r.grade, 0) / olderRecords.length
      : 0;

    return {
      avgGrade,
      avgPronunciation,
      avgClarity,
      avgConfidence,
      sessionCount: studentRecords.length,
      trend,
      recentRecords: studentRecords.slice(0, 5),
    };
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (grade >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const sortedStudents = students
    .map(s => ({
      ...s,
      data: getStudentData(s.student_id),
    }))
    .sort((a, b) => {
      if (!a.data) return 1;
      if (!b.data) return -1;
      return b.data.avgGrade - a.data.avgGrade;
    });

  return (
    <div className="space-y-3">
      {sortedStudents.map((student) => {
        const data = student.data;
        const isExpanded = expandedStudent === student.student_id;

        return (
          <Card key={student.student_id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{student.profiles?.full_name || 'Unknown'}</h4>
                    {data && (
                      <>
                        <Badge variant="outline" className={getGradeColor(data.avgGrade)}>
                          {data.avgGrade}
                        </Badge>
                        {data.trend !== 0 && (
                          <div className={`flex items-center gap-1 text-sm ${
                            data.trend > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {data.trend > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span>{Math.abs(Math.round(data.trend))}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {data && (
                    <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                      <span>{data.sessionCount} sessions</span>
                      <span>Pronunciation: {data.avgPronunciation}/5</span>
                      <span>Clarity: {data.avgClarity}/5</span>
                      <span>Confidence: {data.avgConfidence}/5</span>
                    </div>
                  )}
                  {!data && (
                    <p className="text-sm text-muted-foreground mt-1">No practice sessions yet</p>
                  )}
                </div>

                {data && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedStudent(isExpanded ? null : student.student_id)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
              </div>

              {isExpanded && data && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <h5 className="font-semibold text-sm">Recent Sessions</h5>
                  {data.recentRecords.map((record: any) => (
                    <div key={record.id} className="p-3 bg-muted rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-muted-foreground">
                          {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                        <Badge variant="outline" className={getGradeColor(record.grade)}>
                          {record.grade}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>Pronunciation: {record.pronunciation}/5</div>
                        <div>Clarity: {record.clarity}/5</div>
                        <div>Confidence: {record.confidence}/5</div>
                      </div>
                      {record.feedback && record.feedback.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {record.feedback[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentAuraMetrics;
