import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Plus, X } from "lucide-react";

export default function RegisterDistrict() {
  const navigate = useNavigate();
  const [districtName, setDistrictName] = useState("");
  const [emailDomains, setEmailDomains] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);

  const addDomain = () => {
    setEmailDomains([...emailDomains, ""]);
  };

  const removeDomain = (index: number) => {
    setEmailDomains(emailDomains.filter((_, i) => i !== index));
  };

  const updateDomain = (index: number, value: string) => {
    const newDomains = [...emailDomains];
    newDomains[index] = value;
    setEmailDomains(newDomains);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to register a district");
        navigate("/auth");
        return;
      }

      const cleanDomains = emailDomains
        .map(d => d.trim().toLowerCase())
        .filter(d => d.length > 0);

      if (cleanDomains.length === 0) {
        toast.error("Please add at least one email domain");
        setIsLoading(false);
        return;
      }

      const slug = districtName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const { error } = await supabase
        .from('districts')
        .insert({
          name: districtName,
          slug,
          email_domains: cleanDomains,
          primary_contact_email: user.email,
        });

      if (error) throw error;

      toast.success("District registered successfully! Teachers can now sign up with Google using your domain.");
      navigate('/district/dashboard');
    } catch (error: any) {
      console.error('Error registering district:', error);
      toast.error(error.message || "Failed to register district");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showAuthButtons={false} />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Register Your School District</CardTitle>
            <CardDescription>
              Add your district to enable Google SSO for teachers and students. Once registered, 
              staff members with your domain email can sign up instantly.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="districtName">District Name</Label>
                <Input
                  id="districtName"
                  placeholder="e.g., Allentown School District"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label>Staff Email Domains</Label>
                <p className="text-sm text-muted-foreground">
                  Add all email domains used by your staff (e.g., allentownsd.org). 
                  Don't include the @ symbol.
                </p>
                
                <div className="space-y-2">
                  {emailDomains.map((domain, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="example.org"
                        value={domain}
                        onChange={(e) => updateDomain(i, e.target.value)}
                        required
                      />
                      {emailDomains.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeDomain(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDomain}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Domain
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !districtName.trim()}>
                {isLoading ? "Registering..." : "Register District"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
