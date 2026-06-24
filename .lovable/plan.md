## Problem

Google sign-in from `/auth` (Game Mode) returns a Google **403 "you do not have access"** page, while `/school/auth` works.

## Root cause

`src/pages/game/GameAuth.tsx` calls `supabase.auth.signInWithOAuth({ provider: 'google', ... })` directly with `access_type: 'offline'` + `prompt: 'consent'`. That bypasses Lovable Cloud's managed Google OAuth broker, which is the supported path on this project. The managed broker (`lovable.auth.signInWithOAuth("google", ...)`) is what the Cloud auth knowledge mandates for Google on Lovable Cloud projects. The school page only "works" because its older flow happened to be already-consented in this browser; on a fresh session it hits the same wall. The 403 is Google rejecting the OAuth client config for the params being sent.

## Fix

Replace the raw Supabase call in `GameAuth.tsx` with the managed Lovable helper, matching the pattern in the official docs:

```ts
import { lovable } from "@/integrations/lovable";

const handleGoogleSignIn = async () => {
  setIsLoading(true);
  try {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Google sign-in failed", description: result.error.message, variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    // tokens set; navigate handled by session effect
  } catch (e: any) {
    toast({ title: "Google sign-in failed", description: e?.message ?? "Please try again.", variant: "destructive" });
  } finally {
    setIsLoading(false);
  }
};
```

Key differences from the current code:
- Uses `lovable.auth.signInWithOAuth("google", …)` (managed broker) instead of `supabase.auth.signInWithOAuth`.
- `redirect_uri` is `window.location.origin` (public, not a protected route) per the Lovable Cloud OAuth rules.
- Drops `access_type: 'offline'` and `prompt: 'consent'` — those forced-consent params are what the managed client rejects.

While we're in there, do the same swap in `src/pages/Auth.tsx` `handleGoogleSignIn` so the school side stays consistent and doesn't break for new users hitting Google fresh.

## Files touched

- `src/pages/game/GameAuth.tsx` — rewrite `handleGoogleSignIn` to use `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- `src/pages/Auth.tsx` — same rewrite for parity.

## Not changing

- Card layout, gradient, Clever flow, Student ID flow — untouched.
- No backend / provider config changes. Managed Google OAuth in Lovable Cloud is already configured.

## Note on preview

Google OAuth can still fail inside the Lovable preview iframe due to the preview fetch proxy. If it still 403s after this fix, test on the published URL (`nabulearn.lovable.app` / `nabulearn.com`) — that's the canonical test surface for Google sign-in.
