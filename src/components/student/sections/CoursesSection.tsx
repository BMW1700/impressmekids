import { ClassroomCard } from "@/components/ClassroomCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CoursesSectionProps {
  classrooms: any[];
}

export const CoursesSection = ({ classrooms }: CoursesSectionProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t("student.courses.title")}</h1>
        <Link to="/join-class">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("student.courses.joinCourse")}
          </Button>
        </Link>
      </div>

      {classrooms && classrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom: any) => (
            <ClassroomCard
              key={classroom.id}
              id={classroom.id}
              name={classroom.name}
              joinCode={classroom.join_code}
              studentCount={Number(classroom.student_count)}
              teacherName={classroom.teacher_name}
              createdAt={classroom.created_at}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t("student.courses.noCourses")}</p>
          <Link to="/join-class">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("student.courses.joinFirst")}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
