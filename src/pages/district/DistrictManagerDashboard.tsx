import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Plus } from "lucide-react";
import { toast } from "sonner";

interface District {
  id: string;
  name: string;
  district_code: string;
  created_at: string;
}

const DistrictManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState<District[]>([]);
  const [newDistrictName, setNewDistrictName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('🔍 DistrictManagerDashboard - Starting checkAuth');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('❌ DistrictManagerDashboard - No session, redirecting to /auth');
      navigate("/auth");
      return;
    }

    console.log('🔍 DistrictManagerDashboard - Session found:', session.user.email, 'User ID:', session.user.id);

    // Check if district manager account exists
    console.log('🔍 DistrictManagerDashboard - Querying district_managers table...');
    const { data: districtManager, error: dmError } = await supabase
      .from("district_managers")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    console.log('🔍 DistrictManagerDashboard - district_managers query result:', {
      data: districtManager,
      error: dmError
    });

    if (!districtManager) {
      console.error('❌ DistrictManagerDashboard - No district manager record found!');
      console.log('🔍 DistrictManagerDashboard - Checking if RLS is blocking the query...');
      
      // Try to get more info about the user's roles
      const { data: profileData } = await supabase.rpc('get_user_profile', {
        _user_id: session.user.id
      });
      console.log('🔍 DistrictManagerDashboard - User profile from get_user_profile:', profileData);
      
      toast.error("You do not have district manager access");
      navigate("/");
      return;
    }

    console.log('✅ DistrictManagerDashboard - District manager access confirmed');
    loadDistricts();
  };

  const loadDistricts = async () => {
    const { data, error } = await supabase
      .from("districts")
      .select("id, name, district_code, created_at")
      .order("name");

    if (error) {
      toast.error("Failed to load districts");
      console.error(error);
    } else {
      setDistricts(data || []);
    }

    setLoading(false);
  };

  const handleCreateDistrict = async () => {
    if (!newDistrictName.trim()) {
      toast.error("Please enter a district name");
      return;
    }

    setIsCreating(true);

    try {
      // Generate unique district code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_unique_district_code');

      if (codeError) throw codeError;

      const districtCode = codeData;

      // Create the district
      const { error: insertError } = await supabase
        .from("districts")
        .insert({
          name: newDistrictName.trim(),
          district_code: districtCode,
          email_domains: [],
          slug: newDistrictName.toLowerCase().replace(/\s+/g, '-')
        });

      if (insertError) throw insertError;

      toast.success(`District created successfully! Code: ${districtCode}`);
      setNewDistrictName("");
      loadDistricts();
    } catch (error: any) {
      toast.error("Failed to create district: " + error.message);
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            District Manager Dashboard
          </h1>
          <p className="text-muted-foreground">System-wide district management</p>
        </div>

        {/* Create New District Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New District</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="district-name">District Name</Label>
                <Input
                  id="district-name"
                  placeholder="Enter district name"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleCreateDistrict}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create District
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              A unique 12-digit district code will be automatically generated
            </p>
          </CardContent>
        </Card>

        {/* Districts List */}
        <Card>
          <CardHeader>
            <CardTitle>All Districts ({districts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {districts.map((district) => (
                <div 
                  key={district.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{district.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(district.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">District Code</p>
                    <p className="text-xl font-mono font-bold">{district.district_code}</p>
                  </div>
                </div>
              ))}
              {districts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No districts created yet. Create your first district above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default DistrictManagerDashboard;
