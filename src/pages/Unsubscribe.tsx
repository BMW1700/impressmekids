import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "validating" | "ready" | "submitting" | "success" | "already" | "invalid" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<Status>("validating");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const validate = async () => {
      if (!token) { setStatus("invalid"); return; }
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const r = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await r.json();
        if (data?.alreadyUnsubscribed) setStatus("already");
        else if (r.ok && data?.valid) setStatus("ready");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const confirm = async () => {
    setStatus("submitting");
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) { setErrorMsg(error.message); setStatus("error"); return; }
      setStatus("success");
    } catch (e: any) {
      setErrorMsg(e.message || "Unknown error");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Unsubscribe from NabuLearn emails</CardTitle>
          <CardDescription>
            Confirm to stop receiving non-essential emails at your address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "validating" && (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Validating link…</div>
          )}
          {status === "ready" && (
            <Button onClick={confirm} className="w-full">Confirm unsubscribe</Button>
          )}
          {status === "submitting" && (
            <Button disabled className="w-full"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</Button>
          )}
          {status === "success" && (
            <div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-5 w-5" /> You've been unsubscribed.</div>
          )}
          {status === "already" && (
            <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-5 w-5" /> You're already unsubscribed.</div>
          )}
          {status === "invalid" && (
            <div className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" /> This link is invalid or expired.</div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" /> {errorMsg}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
