import { Directory } from "@/components/Directory";
import { useLanguage } from "@/contexts/LanguageContext";

export const DirectorySection = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">{t("student.directory.title")}</h1>
      <Directory />
    </div>
  );
};
