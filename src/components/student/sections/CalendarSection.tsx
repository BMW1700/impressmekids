import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { useLanguage } from "@/contexts/LanguageContext";

interface CalendarSectionProps {
  studentId: string;
}

export const CalendarSection = ({ studentId }: CalendarSectionProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">{t("student.calendar.title")}</h1>
      <CalendarWidget userId={studentId} userRole="student" />
    </div>
  );
};
