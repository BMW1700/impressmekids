import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School } from "lucide-react";
import { useSchools } from "@/hooks/useSchools";

interface AdminSchoolSelectorProps {
  value: string | null;
  onChange: (schoolId: string | null) => void;
  isDistrictAdmin: boolean;
  districtId?: string | null;
  lockedSchoolName?: string;
}

export function AdminSchoolSelector({ 
  value, 
  onChange, 
  isDistrictAdmin,
  districtId,
  lockedSchoolName
}: AdminSchoolSelectorProps) {
  const { schools, isLoading } = useSchools(districtId);

  // School Admins - show static school name, no dropdown
  if (!isDistrictAdmin) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <School className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">{lockedSchoolName || "Your School"}</span>
      </div>
    );
  }

  // District Admins - show dropdown with all schools in their district
  return (
    <div className="flex items-center gap-2">
      <School className="h-5 w-5 text-muted-foreground" />
      <Select
        value={value || "all"}
        onValueChange={(val) => onChange(val === "all" ? null : val)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select a school..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Schools</SelectItem>
          {schools?.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
