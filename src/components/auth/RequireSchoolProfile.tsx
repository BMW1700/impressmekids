import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SCHOOL_ROLES = ["teacher", "student", "parent", "admin", "district_admin"];

/**
 * Route guard that requires a complete school profile (valid school role + district).
 * Nest inside <RequireAuth /> so session is already guaranteed.
 */
export function RequireSchoolProfile() {
  const { profile, isProfileLoading } = useAuth();
  const location = useLocation();

  if (isProfileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasSchoolRole = profile.role && SCHOOL_ROLES.includes(profile.role);
  const hasDistrict = !!profile.district_id;

  // Allow substitute teachers through without role/district
  const substituteAccess = sessionStorage.getItem('substituteAccess');
  if (substituteAccess) {
    try {
      const parsed = JSON.parse(substituteAccess);
      if (parsed.accessEnd && new Date(parsed.accessEnd) > new Date()) {
        return <Outlet />;
      }
    } catch {}
  }

  if (!hasSchoolRole || !hasDistrict) {
    return <Navigate to="/school/setup" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
