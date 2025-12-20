import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Users, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DistrictStatus {
  id: string;
  name: string;
  district_code: string;
  activeDrills: number;
  totalStudents: number;
  accountedStudents: number;
  alertLevel: "normal" | "elevated" | "emergency";
}

export function MultiDistrictDashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const { data: districts, isLoading } = useQuery({
    queryKey: ['districts-status'],
    queryFn: async () => {
      const { data: districtsData, error } = await supabase
        .from('districts')
        .select('*')
        .eq('is_visible', true)
        .order('name');

      if (error) throw error;

      // Get active drill counts for each district
      const districtsWithStatus: DistrictStatus[] = await Promise.all(
        (districtsData || []).map(async (district) => {
          const { data: drills } = await supabase
            .from('drill_sessions')
            .select('id, is_real_emergency')
            .eq('school_id', district.district_code)
            .eq('status', 'in_progress');

          const activeDrills = drills?.length || 0;
          const hasEmergency = drills?.some(d => d.is_real_emergency) || false;

          return {
            id: district.id,
            name: district.name,
            district_code: district.district_code,
            activeDrills,
            totalStudents: 0, // Would need additional query
            accountedStudents: 0,
            alertLevel: hasEmergency ? "emergency" : activeDrills > 0 ? "elevated" : "normal"
          };
        })
      );

      return districtsWithStatus;
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const getAlertBadge = (level: string) => {
    switch (level) {
      case "emergency":
        return <Badge className="bg-red-600 animate-pulse">EMERGENCY</Badge>;
      case "elevated":
        return <Badge className="bg-yellow-600">Active Drill</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Multi-District Overview
          </CardTitle>
          <CardDescription>
            Real-time status across all districts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{districts?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Districts</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {districts?.filter(d => d.alertLevel === "normal").length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Normal Status</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <Shield className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">
                {districts?.filter(d => d.alertLevel === "elevated").length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Drills</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">
                {districts?.filter(d => d.alertLevel === "emergency").length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Emergencies</div>
            </div>
          </div>

          {/* District List */}
          <div className="space-y-3">
            {districts?.map((district) => (
              <div 
                key={district.id}
                className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                  district.alertLevel === "emergency" ? "border-red-500 bg-red-500/5" :
                  district.alertLevel === "elevated" ? "border-yellow-500 bg-yellow-500/5" :
                  "border-border"
                }`}
                onClick={() => setSelectedDistrict(district.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-semibold">{district.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Code: {district.district_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {district.activeDrills > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        {district.activeDrills} active
                      </div>
                    )}
                    {getAlertBadge(district.alertLevel)}
                  </div>
                </div>
              </div>
            ))}

            {(!districts || districts.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No districts configured yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}