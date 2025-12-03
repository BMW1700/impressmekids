import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, BookOpen, Mic, Brain, Target } from "lucide-react";
import { format } from "date-fns";

interface StudentAuraMetricsProps {
  students: any[];
  records: any[];
  readingSessions?: any[]; // NEW: Reading sessions from WordByWordReader
}

const StudentAuraMetrics = ({ students, records, readingSessions = [] }: StudentAuraMetricsProps) => {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const getStudentData = (studentId: string) => {
    // Speaking/Practice records from aura_records
    const studentRecords = records.filter(r => r.profile_id === studentId);
    
    // Reading sessions from reading_sessions (WordByWordReader)
    const studentReadingSessions = readingSessions.filter(r => r.student_id === studentId);
    
    // If no data at all, return null
    if (studentRecords.length === 0 && studentReadingSessions.length === 0) return null;

    // Calculate speaking/practice stats
    const avgGrade = studentRecords.length > 0 
      ? Math.round(studentRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / studentRecords.length)
      : null;
    const avgPronunciation = studentRecords.length > 0 
      ? (studentRecords.reduce((sum, r) => sum + (r.pronunciation || r.clarity || 0), 0) / studentRecords.length).toFixed(1)
      : null;
    const avgClarity = studentRecords.length > 0
      ? (studentRecords.reduce((sum, r) => sum + (r.clarity || 0), 0) / studentRecords.length).toFixed(1)
      : null;
    const avgConfidence = studentRecords.length > 0
      ? (studentRecords.reduce((sum, r) => sum + (r.confidence || 0), 0) / studentRecords.length).toFixed(1)
      : null;

    // Calculate reading stats (from WordByWordReader)
    const readingAccuracy = studentReadingSessions.length > 0
      ? Math.round(studentReadingSessions.reduce((sum, r) => sum + (r.accuracy_percent || 0), 0) / studentReadingSessions.length)
      : null;
    const readingWpm = studentReadingSessions.length > 0
      ? Math.round(studentReadingSessions.reduce((sum, r) => sum + (r.wpm || 0), 0) / studentReadingSessions.length)
      : null;
    const totalWordsRead = studentReadingSessions.reduce((sum, r) => sum + (r.words_read || 0), 0);

    // Calculate trend from speaking records
    const recentRecords = studentRecords.slice(0, 3);
    const olderRecords = studentRecords.slice(3, 6);
    const trend = recentRecords.length > 0 && olderRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / recentRecords.length -
        olderRecords.reduce((sum, r) => sum + (r.grade || 0), 0) / olderRecords.length
      : 0;

    // Calculate reading trend
    const recentReadings = studentReadingSessions.slice(0, 3);
    const olderReadings = studentReadingSessions.slice(3, 6);
    const readingTrend = recentReadings.length > 0 && olderReadings.length > 0
      ? recentReadings.reduce((sum, r) => sum + (r.accuracy_percent || 0), 0) / recentReadings.length -
        olderReadings.reduce((sum, r) => sum + (r.accuracy_percent || 0), 0) / olderReadings.length
      : 0;

    return {
      avgGrade,
      avgPronunciation,
      avgClarity,
      avgConfidence,
      sessionCount: studentRecords.length,
      trend,
      recentRecords: studentRecords.slice(0, 5),
      // Reading data
      readingAccuracy,
      readingWpm,
      totalWordsRead,
      readingSessionCount: studentReadingSessions.length,
      readingTrend,
      recentReadingSessions: studentReadingSessions.slice(0, 5),
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
      // Sort by combined activity (reading + speaking)
      const aTotal = (a.data.avgGrade || 0) + (a.data.readingAccuracy || 0);
      const bTotal = (b.data.avgGrade || 0) + (b.data.readingAccuracy || 0);
      return bTotal - aTotal;
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
                        {/* Reading Badge (primary - from WordByWordReader) */}
                        {data.readingAccuracy !== null && (
                          <Badge variant="outline" className={`${getGradeColor(data.readingAccuracy)} flex items-center gap-1`}>
                            <BookOpen className="h-3 w-3" />
                            {data.readingAccuracy}%
                          </Badge>
                        )}
                        {/* Speaking Badge (secondary - from Practice) */}
                        {data.avgGrade !== null && (
                          <Badge variant="outline" className={`${getGradeColor(data.avgGrade)} flex items-center gap-1`}>
                            <Mic className="h-3 w-3" />
                            {data.avgGrade}
                          </Badge>
                        )}
                        {/* Trend indicator */}
                        {(data.trend !== 0 || data.readingTrend !== 0) && (
                          <div className={`flex items-center gap-1 text-sm ${
                            (data.readingTrend || data.trend) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(data.readingTrend || data.trend) > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span>{Math.abs(Math.round(data.readingTrend || data.trend))}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {data && (
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {/* Reading stats first (primary) */}
                      {data.readingSessionCount > 0 && (
                        <>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3 text-green-600" />
                            {data.readingSessionCount} readings
                          </span>
                          <span>{data.readingWpm} WPM</span>
                          <span>{data.totalWordsRead.toLocaleString()} words</span>
                        </>
                      )}
                      {/* Speaking stats (secondary) */}
                      {data.sessionCount > 0 && (
                        <>
                          <span className="flex items-center gap-1">
                            <Mic className="h-3 w-3" />
                            {data.sessionCount} practice
                          </span>
                          {data.avgClarity && <span>Clarity: {data.avgClarity}/5</span>}
                          {data.avgConfidence && <span>Confidence: {data.avgConfidence}/5</span>}
                        </>
                      )}
                    </div>
                  )}
                  {!data && (
                    <p className="text-sm text-muted-foreground mt-1">No reading or practice sessions yet</p>
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
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Reading Sessions (primary) */}
                  {data.recentReadingSessions.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-green-600" />
                        Recent Reading Sessions
                      </h5>
                      {data.recentReadingSessions.map((session: any) => (
                        <div key={session.id} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-sm mb-2">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-muted-foreground">
                              {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                            <Badge variant="outline" className={getGradeColor(session.accuracy_percent || 0)}>
                              {session.accuracy_percent || 0}% accuracy
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>WPM: {session.wpm || 0}</div>
                            <div>Words: {session.words_read || 0}</div>
                            <div>Duration: {Math.round((session.duration_seconds || 0) / 60)}min</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Practice Sessions (secondary) */}
                  {data.recentRecords.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <Mic className="h-4 w-4" />
                        Recent Practice Sessions
                      </h5>
                      {data.recentRecords.map((record: any) => (
                        <div key={record.id} className="p-3 bg-muted rounded-lg text-sm mb-2">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-muted-foreground">
                              {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                            <Badge variant="outline" className={getGradeColor(record.grade || 0)}>
                              {record.grade || 0}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>Pronunciation: {record.pronunciation || record.clarity || 0}/5</div>
                            <div>Clarity: {record.clarity || 0}/5</div>
                            <div>Confidence: {record.confidence || 0}/5</div>
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
