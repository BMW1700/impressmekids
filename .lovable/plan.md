## Goal

Make `/auth` (Game Mode entry) feel like the polished primary entry, and add Google + Clever sign-in (the same ones already on `/school/auth`) — without losing the Student ID login that's unique to Game Mode.

## Recommendation: keep GameAuth, don't scrap it

School `Auth.tsx` (1,900+ lines) is tangled with district/school/teacher/parent role flows and verification. `GameAuth.tsx` is purpose-built for the game audience (Email + Student ID + class join code) and is already wired to `/auth`. Cleaner path:

- Keep `GameAuth.tsx` as the canonical `/auth` page.
- Port Google + Clever sign-in handlers/buttons from `Auth.tsx` (they already work — same managed Google OAuth + same `clever-sync-callback` edge function).
- Polish the card itself.

## Background colors — unchanged

Per your note, the purple → amber gradient backdrop stays **exactly as it is**. The gradient is the brand for the game entry point. The polish happens **inside the card**, not on the page background.

## What changes

### 1. Add Google + Clever to `src/pages/game/GameAuth.tsx`

- Port `handleGoogleSignIn` using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` (managed flow).
- Port `handleCleverSignIn` and the `?clever_login=success|error` URL-param effect from `Auth.tsx`.
- Add two buttons above the Email/Student-ID tabs on both Login and Sign Up:
  - "Continue with Google" (white button, Google "G" mark)
  - "Continue with Clever" (Clever blue, Clever mark)
- "or continue with" divider between SSO and the email/student-ID form.
- Hide SSO buttons when the user is on the Student ID sub-tab (SSO doesn't apply to 8-digit IDs); only show them on the Email sub-tab.

### 2. Polish the card (background gradient untouched)

Page background = same gradient. Everything else inside it gets tightened:

- Replace the translucent `bg-white/10` glass card with a more solid, readable surface that still sits over the gradient nicely — slightly darker frosted panel with a real border and a soft shadow (`shadow-glass-lg` token), so text contrast is strong against both the purple and amber sides of the gradient.
- Tighter header inside the card: smaller controller icon in a rounded tinted tile, "Game Mode" as the H1, one-line tagline, and "Back" baked into the top-left of the card (replaces the floating "Back to Mode Select" row above the card).
- Login / Sign Up tabs use proper shadcn `Tabs` styling with a clear active state instead of semi-transparent pills.
- Inputs use standard `Input` styling so focus rings, placeholders, and the password reveal eye match the rest of the app.
- Primary "Login" / "Sign Up" button uses the app's primary token + the existing gradient-gold button variant for game-flavor, with proper hover/press states (no more flat amber slab).
- Replace "School accounts work here too!" with: "Have a school account? Sign in with Google or Clever above."
- Add a "Forgot password?" link wired to the existing reset flow.

All text/borders use semantic tokens so contrast holds against the gradient — no more washed-out `text-white/40` placeholders that disappear on the amber side.

### 3. No backend or route changes

- No schema changes, no new edge functions. `clever-sync-callback` and managed Google OAuth already configured.
- Routes unchanged: `/auth` → GameAuth (primary), `/school/auth` → Auth, `/game/auth` → GameAuth alias.
- `Auth.tsx` untouched.

## Files touched

- `src/pages/game/GameAuth.tsx` — add Google + Clever handlers/buttons, port Clever URL-param effect, restyle the card and inputs, add forgot-password link, bake Back into card header.

## Open question

Bake "Back" into the card header (cleaner) vs. keep the separate floating "Back to Mode Select" link above the card? Default in this plan: bake into the card.