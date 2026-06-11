import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";

interface Props {
  children: ReactNode;
}

/** Route guard: only super admins may render `children`. */
export const RequireSuperAdmin = ({ children }: Props) => {
  const { isSuperAdmin, loading } = useIsSuperAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
