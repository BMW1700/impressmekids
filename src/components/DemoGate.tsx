import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

const DEMO_CODE = "Brecon50";
const STORAGE_KEY = "imk_demo_access";

export function DemoGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (granted) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === DEMO_CODE) {
      localStorage.setItem(STORAGE_KEY, "1");
      setGranted(true);
    } else {
      setError("Invalid access code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Private Preview</CardTitle>
          <CardDescription>This app is currently in private preview. Enter your access code to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gate-code">Access Code</Label>
              <Input id="gate-code" type="password" value={code} onChange={(e) => { setCode(e.target.value); setError(""); }} autoFocus />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full">Unlock</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
