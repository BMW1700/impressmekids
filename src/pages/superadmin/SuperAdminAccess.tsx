import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Search, ShieldCheck, ShieldOff } from "lucide-react";

interface PersonRow {
  id: string;
  email: string;
  full_name?: string | null;
  current_role?: string | null;
  is_super_admin?: boolean;
}

const SuperAdminAccess = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<PersonRow[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("manage-super-admin", { body });
    if (error) {
      // Surface the real reason instead of "non-2xx status code".
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const payload = await ctx.json();
          if (payload?.error) throw new Error(String(payload.error));
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message) throw parseErr;
        }
      }
      throw new Error(error.message);
    }
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as Record<string, unknown>;
  };

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const data = await call({ action: "list" });
      setAdmins((data.admins as PersonRow[]) ?? []);
    } catch (e) {
      toast({
        title: "Couldn't load the list",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const data = await call({ action: "search", query: query.trim() });
      setResults((data.results as PersonRow[]) ?? []);
    } catch (err) {
      toast({
        title: "Search failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const grant = async (person: PersonRow) => {
    setBusyId(person.id);
    try {
      await call({ action: "grant", targetUserId: person.id });
      toast({ title: "Access granted", description: `${person.email} is now a super admin.` });
      setResults((r) => r.map((p) => (p.id === person.id ? { ...p, is_super_admin: true } : p)));
      loadAdmins();
    } catch (err) {
      toast({
        title: "Couldn't grant access",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (person: PersonRow) => {
    setBusyId(person.id);
    try {
      await call({ action: "revoke", targetUserId: person.id });
      toast({ title: "Access removed", description: `${person.email} is no longer a super admin.` });
      setResults((r) => r.map((p) => (p.id === person.id ? { ...p, is_super_admin: false } : p)));
      loadAdmins();
    } catch (err) {
      toast({
        title: "Couldn't remove access",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/super-admin"><ArrowLeft className="h-4 w-4 mr-1" /> Super Admin</Link>
          </Button>
          <h1 className="text-3xl font-bold">Super Admin Access</h1>
        </div>
        <p className="text-muted-foreground">
          Find a person by name or email, then give or remove super admin access with one click.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Find a person</CardTitle>
            <CardDescription>Search by email address or full name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={runSearch} className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="name@school.org"
                autoComplete="off"
              />
              <Button type="submit" disabled={searching || query.trim().length < 2}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Search</span>
              </Button>
            </form>

            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.full_name || p.email}</div>
                      <div className="text-sm text-muted-foreground truncate">{p.email}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.is_super_admin ? (
                        <Badge variant="secondary">Super admin</Badge>
                      ) : (
                        <Badge variant="outline">{p.current_role ?? "no role"}</Badge>
                      )}
                      {p.is_super_admin ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === p.id || p.id === user?.id}
                          onClick={() => revoke(p)}
                        >
                          {busyId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldOff className="h-4 w-4" />
                          )}
                          <span className="ml-2">Remove</span>
                        </Button>
                      ) : (
                        <Button size="sm" disabled={busyId === p.id} onClick={() => grant(p)}>
                          {busyId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                          <span className="ml-2">Make super admin</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-sm text-muted-foreground">No one matched that search.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current super admins</CardTitle>
            <CardDescription>Everyone who can reach this area today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingAdmins ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No super admins yet.</p>
            ) : (
              admins.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.full_name || p.email}</div>
                    <div className="text-sm text-muted-foreground truncate">{p.email}</div>
                  </div>
                  {p.id === user?.id ? (
                    <Badge variant="secondary">You</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === p.id}
                      onClick={() => revoke(p)}
                    >
                      {busyId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldOff className="h-4 w-4" />
                      )}
                      <span className="ml-2">Remove</span>
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminAccess;
