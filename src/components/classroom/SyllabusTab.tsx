import { TeacherSyllabusView } from "./TeacherSyllabusView";
import { StudentSyllabusView } from "./StudentSyllabusView";

interface SyllabusTabProps {
  classroomId: string;
  isTeacher: boolean;
}

export const SyllabusTab = ({ classroomId, isTeacher }: SyllabusTabProps) => {
  if (isTeacher) {
    return <TeacherSyllabusView classroomId={classroomId} />;
  }

  return <StudentSyllabusView classroomId={classroomId} />;
};
