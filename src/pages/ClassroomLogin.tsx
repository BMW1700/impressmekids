import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { classroomLogin } from "@/lib/classroomLogin";
import { Loader2, School } from "lucide-react";

/**
 * Classroom sign-in for K-5 devices: class code + username + 6-digit PIN.
 * No email, no password, no internal identifiers shown to students.
 */
const ClassroomLogin = () => {
  const [classCode, setClassCode] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await classroomLogin(classCode, username, pin);

    if (!result.success) {
      toast({
        title: result.locked ? "Too many tries" : "Try again",
        description: result.error,
        variant: "destructive",
      });
      setPin("");
      setIsLoading(false);
      return;
    }

    toast({ title: "Welcome back!", description: "Let's read." });
    navigate("/student/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <School className="h-12 w-12 mx-auto mb-3 text-primary" aria-hidden="true" />
          <CardTitle className="text-2xl">Class Sign In</CardTitle>
          <CardDescription>
            Use the class code, your username, and your 6-number PIN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="classCode">Class code</Label>
              <Input
                id="classCode"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
                className="font-mono text-xl text-center tracking-[0.4em] h-14"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="maria.g"
                autoCapitalize="none"
                autoComplete="username"
                className="text-lg h-14"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="font-mono text-2xl text-center tracking-[0.5em] h-16"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" size="lg" className="h-14 text-lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Start Reading
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Forgot your PIN? Ask your teacher to reset it.
            </p>

            <Button type="button" variant="ghost" onClick={() => navigate("/auth")} disabled={isLoading}>
              Sign in another way
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassroomLogin;
