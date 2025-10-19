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

        console.log('🔐 Checking permissions for user:', session.user.id, 'classroom:', classroomId);

        // Use security definer function to bypass RLS
        const { data: classroomResult, error: classroomError } = await supabase
          .rpc('get_classroom_detail', {
            _user_id: session.user.id,
            _classroom_id: classroomId
          });

        console.log('Classroom RPC result:', { classroomResult, classroomError });

        const classroom = classroomResult?.[0];
        const isTeacher = classroom?.teacher_id === session.user.id;

        // Use security definer function to check student status
        const { data: studentsResult, error: studentError } = await supabase
          .rpc('get_classroom_students', {
            _user_id: session.user.id,
            _classroom_id: classroomId
          });

        console.log('Students RPC result:', { studentsResult, studentError });

        // If we got results, we're either the teacher or a student
        // Check if current user is in the students list
        const isStudent = studentsResult?.some((s: any) => s.student_id === session.user.id) || false;

        console.log('✅ Permissions determined:', { isTeacher, isStudent });

        setPermissions({
          isTeacher,
          isStudent,
          isLoading: false,
        });
      } catch (error) {
        console.error("❌ Error checking permissions:", error);
        setPermissions({ isTeacher: false, isStudent: false, isLoading: false });
      }
    };

    checkPermissions();
  }, [classroomId]);

  return permissions;
};
