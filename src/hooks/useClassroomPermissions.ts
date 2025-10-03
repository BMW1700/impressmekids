import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClassroomPermissions {
  isTeacher: boolean;
  isStudent: boolean;
  isLoading: boolean;
}

export const useClassroomPermissions = (classroomId: string | undefined): ClassroomPermissions => {
  const [permissions, setPermissions] = useState<ClassroomPermissions>({
    isTeacher: false,
    isStudent: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!classroomId) {
        setPermissions({ isTeacher: false, isStudent: false, isLoading: false });
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setPermissions({ isTeacher: false, isStudent: false, isLoading: false });
          return;
        }

        // Check if user is the teacher of this classroom
        const { data: classroom, error: classroomError } = await supabase
          .from('classrooms')
          .select('teacher_id')
          .eq('id', classroomId)
          .maybeSingle();

        console.log('Classroom query result:', { classroom, classroomError, userId: session.user.id });

        const isTeacher = classroom?.teacher_id === session.user.id;

        // Check if user is a student in this classroom
        const { data: studentRecord, error: studentError } = await supabase
          .from('classroom_students')
          .select('id')
          .eq('classroom_id', classroomId)
          .eq('student_id', session.user.id)
          .maybeSingle();

        console.log('Student query result:', { studentRecord, studentError });

        const isStudent = !!studentRecord;

        setPermissions({
          isTeacher,
          isStudent,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error checking permissions:", error);
        setPermissions({ isTeacher: false, isStudent: false, isLoading: false });
      }
    };

    checkPermissions();
  }, [classroomId]);

  return permissions;
};
