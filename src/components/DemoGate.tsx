import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DEMO_CODE = "Brecon50";
const STORAGE_KEY = "imk_demo_access";
let cachedGateEnabled: boolean | null = null;
let gateSettingPromise: Promise<boolean> | null = null;

const loadGateSetting = async () => {
  if (cachedGateEnabled !== null) return cachedGateEnabled;
  if (!gateSettingPromise) {
    gateSettingPromise = Promise.resolve(supabase
      .from("app_settings")
      .select("demo_gate_enabled")
      .eq("id", 1)
      .maybeSingle())
      .then(({ data }) => {
        cachedGateEnabled = data?.demo_gate_enabled ?? true;
        return cachedGateEnabled;
      })
      .finally(() => {
        gateSettingPromise = null;
      });
  }
  return gateSettingPromise;
};

export function DemoGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");
  const [gateEnabled, setGateEnabled] = useState<boolean | null>(() => cachedGateEnabled); // null = still loading
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (granted) {
      setGateEnabled(false);
      return;
    }

    let mounted = true;

    const fetchSetting = async () => {
      const enabled = await loadGateSetting();
      if (mounted) {
        setGateEnabled(enabled);
      }
    };
    fetchSetting();

    const channel = supabase
      .channel("app_settings_gate")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        (payload: any) => {
          if (payload.new && mounted) {
            cachedGateEnabled = payload.new.demo_gate_enabled;
            setGateEnabled(cachedGateEnabled);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [granted]);

  // Gate is OFF globally → render app
  if (gateEnabled === false) return <>{children}</>;

  // Already unlocked locally → render app
  if (granted) return <>{children}</>;

  // Still loading the setting → render optimistically (don't block paint).
  // If the fetch then resolves to enabled=true AND user isn't unlocked, the gate will appear.
  if (gateEnabled === null) return <>{children}</>;

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
