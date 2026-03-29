import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Heart, Shield, Loader2 } from "lucide-react";
import { DistrictCombobox } from "@/components/auth/DistrictCombobox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SCHOOL_ROLES = ["teacher", "student", "parent", "admin", "district_admin"];

const roleOptions = [
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "teacher", label: "Teacher", icon: Users },
  { value: "parent", label: "Parent", icon: Heart },
] as const;

type SchoolRole = (typeof roleOptions)[number]["value"];

interface District {
  id: string;
  name: string;
  district_code?: string;
}

export default function SchoolSetup() {
  const { profile, isProfileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<SchoolRole | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(true);

  const from = (location.state as any)?.from || "/student/dashboard";

  // If user already has school profile, redirect them
  useEffect(() => {
    if (!isProfileLoading && profile) {
      const hasSchoolRole = profile.role && SCHOOL_ROLES.includes(profile.role);
      const hasDistrict = !!profile.district_id;
      if (hasSchoolRole && hasDistrict) {
        const dashboardMap: Record<string, string> = {
          teacher: "/teacher/dashboard",
          student: "/student/dashboard",
          parent: "/parent/dashboard",
          admin: "/admin/dashboard",
          district_admin: "/district/dashboard",
        };
        navigate(dashboardMap[profile.role!] || from, { replace: true });
      }
    }
  }, [profile, isProfileLoading, navigate, from]);

  // Fetch districts
  useEffect(() => {
    async function fetchDistricts() {
      const { data } = await supabase
        .from("districts_public" as any)
        .select("district_code,name")
        .order("name");
      if (data) {
        setDistricts(
          (data as any[]).map((d: any) => ({
            id: d.district_code,
            name: d.name,
            district_code: d.district_code,
          }))
        );
      }
      setLoadingDistricts(false);
    }
    fetchDistricts();
  }, []);

  async function handleSubmit() {
    if (!selectedRole || !selectedDistrict || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: selectedRole, district_id: selectedDistrict })
        .eq("id", profile.id);

      if (error) throw error;

      // Also insert into user_roles if not already there
      await supabase.from("user_roles").upsert(
        { user_id: profile.id, role: selectedRole as any },
        { onConflict: "user_id,role" }
      );

      toast({ title: "School profile set up!", description: "Redirecting to your dashboard..." });

      const dashboardMap: Record<string, string> = {
        teacher: "/teacher/dashboard",
        student: "/student/dashboard",
        parent: "/parent/dashboard",
        admin: "/admin/dashboard",
        district_admin: "/district/dashboard",
      };

      // Small delay to let auth context refresh
      setTimeout(() => {
        navigate(dashboardMap[selectedRole] || from, { replace: true });
        window.location.reload();
      }, 500);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Set Up School Access</h1>
          <p className="text-muted-foreground">
            Select your role and district to access school features.
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">I am a...</label>
          <div className="grid grid-cols-3 gap-3">
            {roleOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={selectedRole === value ? "default" : "outline"}
                className="h-24 flex-col gap-2 transition-all"
                onClick={() => setSelectedRole(value)}
              >
                <Icon className="h-8 w-8" />
                <span className="text-sm font-semibold">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* District Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">My district</label>
          {loadingDistricts ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading districts...
            </div>
          ) : (
            <DistrictCombobox
              value={selectedDistrict}
              onValueChange={setSelectedDistrict}
              districts={districts}
              placeholder="Choose your district..."
            />
          )}
        </div>

        {/* Submit */}
        <Button
          className="w-full h-12 text-base"
          disabled={!selectedRole || !selectedDistrict || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Setting up...</>
          ) : (
            "Continue to School Mode"
          )}
        </Button>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
